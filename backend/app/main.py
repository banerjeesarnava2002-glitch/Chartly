from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Form
import os
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import engine, Base, get_db
from app.models import Dataset, AnalysisHistory
from app.services.data_service import DataService
from app.services.nlp_service import NLPService

import logging

# Configure basic logging for production
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Dataset Playground API",
    description="API for the Dataset Playground application",
    version="1.0.0",
)

# Configure CORS
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
# Strip leading/trailing whitespace and trailing slashes to prevent matching mismatches
origins = [origin.strip().rstrip("/") for origin in allowed_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Dataset Playground API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported for the MVP.")
        
    contents = await file.read()
    
    try:
        metadata = DataService.save_dataset(contents, file.filename)
        
        # Save to DB
        db_dataset = Dataset(
            filename=metadata["filename"],
            file_path=metadata["file_path"],
            columns=metadata["columns"],
            column_types=metadata["column_types"],
            row_count=metadata["row_count"]
        )
        db.add(db_dataset)
        db.commit()
        db.refresh(db_dataset)
        
        return {
            "id": db_dataset.id,
            "filename": db_dataset.filename,
            "columns": db_dataset.columns,
            "row_count": db_dataset.row_count,
            "preview": metadata["preview"]
        }
    except Exception as e:
        logger.error(f"Error during file upload: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

class AnalyzeRequest(BaseModel):
    dataset_id: int
    query: str

@app.post("/api/analyze")
def analyze_dataset(request: AnalyzeRequest, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == request.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Load a sample of data to give the AI context for Q&A
    try:
        import pandas as pd
        df_sample = pd.read_csv(dataset.file_path).head(20)
        df_sample = df_sample.where(pd.notnull(df_sample), None)
        dataset_sample = df_sample.to_dict(orient="records")
    except Exception:
        dataset_sample = []
        
    # 1. Get the last dashboard (if any)
    last_dashboard = db.query(AnalysisHistory).filter(
        AnalysisHistory.dataset_id == dataset.id,
        AnalysisHistory.operation_type == "dashboard"
    ).order_by(AnalysisHistory.created_at.desc()).first()
    
    dashboard_context = None
    if last_dashboard and last_dashboard.result and "parsed" in last_dashboard.result:
        dashboard_context = last_dashboard.result["parsed"]
        
    # 2. Get all charts and diagrams generated in this session (ordered by creation time)
    all_visuals = db.query(AnalysisHistory).filter(
        AnalysisHistory.dataset_id == dataset.id,
        AnalysisHistory.operation_type.in_(["chart", "diagram"])
    ).order_by(AnalysisHistory.created_at.asc()).all()
    
    visuals_list = []
    for idx, v in enumerate(all_visuals):
        if v.result and "parsed" in v.result:
            visuals_list.append({
                "index": idx + 1,
                "query": v.query,
                "parsed": v.result["parsed"]
            })
            
    recent_context = {
        "current_dashboard": dashboard_context,
        "session_visuals": visuals_list
    }
        
    # Parse query — pass the sample so AI can compute answers
    parsed = NLPService.parse_query(request.query, dataset.columns, dataset.column_types, dataset_sample, recent_context)
    
    if parsed.get("operation") == "unknown":
        return {"type": "error", "message": parsed.get("message", "Unknown query.")}
        
    result_data = None
    
    try:
        if parsed["operation"] == "answer":
            # Pure text Q&A — no data processing needed
            response_type = "answer"
            result_data = None

        elif parsed["operation"] == "summary":
            result_data = DataService.get_summary_stats(dataset.file_path)
            response_type = "table"

        elif parsed["operation"] == "chart":
            result_data = {
                "chart_type": parsed["type"],
                "x_col": parsed["x_col"],
                "y_col": parsed["y_col"],
                "data": DataService.generate_chart_data(dataset.file_path, parsed["x_col"], parsed["y_col"], parsed.get("type", "bar"))
            }
            response_type = "chart"

        elif parsed["operation"] == "dashboard":
            tiles_data = []
            for tile in parsed.get("tiles", []):
                tile_result = None
                if tile["operation"] == "summary":
                    tile_result = {
                        "type": "table",
                        "data": DataService.get_summary_stats(dataset.file_path)
                    }
                elif tile["operation"] == "chart":
                    tile_result = {
                        "type": "chart",
                        "chart_type": tile["type"],
                        "x_col": tile["x_col"],
                        "y_col": tile["y_col"],
                        "data": DataService.generate_chart_data(dataset.file_path, tile["x_col"], tile["y_col"], tile.get("type", "bar"))
                    }
                elif tile["operation"] == "diagram":
                    tile_result = {
                        "type": "diagram",
                        "diagram_type": tile.get("diagram_type", "flowchart"),
                        "nodes": tile.get("nodes", []),
                        "edges": tile.get("edges", [])
                    }
                if tile_result:
                    tiles_data.append(tile_result)
            result_data = tiles_data
            response_type = "dashboard"
            
        elif parsed["operation"] == "diagram":
            result_data = {
                "diagram_type": parsed.get("diagram_type", "flowchart"),
                "nodes": parsed.get("nodes", []),
                "edges": parsed.get("edges", []),
                "explanation": parsed.get("explanation", "")
            }
            response_type = "diagram"
            
        else:
            response_type = "unknown"
            result_data = None
            
        # Save history
        history = AnalysisHistory(
            dataset_id=dataset.id,
            query=request.query,
            operation_type=parsed["operation"],
            result={"type": response_type, "preview": "...", "parsed": parsed}
        )
        db.add(history)
        db.commit()
        
        return {
            "type": response_type,
            "data": result_data,
            "parsed_operation": parsed
        }
    except Exception as e:
        logger.error(f"Error during dataset analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download/{dataset_id}")
def download_dataset(dataset_id: int, db: Session = Depends(get_db)):
    import pandas as pd
    import io
    import os
    from fastapi.responses import StreamingResponse
    
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset #{dataset_id} not found in database.")
    
    # Resolve the file path to absolute
    file_path = dataset.file_path
    if not os.path.isabs(file_path):
        # Resolve relative to the backend directory
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        file_path = os.path.join(backend_dir, file_path.lstrip("./"))
    
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"The file for dataset '{dataset.filename}' no longer exists on disk. Please re-upload the file."
        )
    
    try:
        # Load the data to clean it for Power BI
        df = pd.read_csv(file_path)
        
        # Remove any unnamed index columns often created by pandas
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
        
        import zipfile
        
        # Save to buffer with utf-8-sig (Required for Power BI special character support)
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False, encoding='utf-8-sig')
        csv_data = csv_buffer.getvalue().encode('utf-8-sig')
        
        readme_content = f"""Power BI Ready Dataset: {dataset.filename}

How to use this package in Power BI Desktop:
1. Extract this ZIP file to a folder.
2. Open Power BI Desktop.
3. Click "Get Data" -> "Text/CSV".
4. Select the extracted '{dataset.filename}' file.
5. Power BI will automatically detect the UTF-8 encoding and the column types.
6. Click "Load" to start building your dashboard!

Happy analyzing!
- Dataset Playground AI Analyst
"""
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(dataset.filename, csv_data)
            zf.writestr("README_PowerBI.txt", readme_content)
            
        zip_buffer.seek(0)
        zip_filename = dataset.filename.replace(".csv", "") + "_PowerBI.zip"
        
        response = StreamingResponse(
            iter([zip_buffer.getvalue()]),
            media_type="application/zip"
        )
        response.headers["Content-Disposition"] = f'attachment; filename="{zip_filename}"'
        return response
        
    except Exception as e:
        logger.error(f"Error during file download: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process download: {str(e)}")

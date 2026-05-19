import pandas as pd
import io
import os
import uuid

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class DataService:
    @staticmethod
    def save_dataset(file_contents: bytes, filename: str) -> dict:
        """Saves file and returns metadata and preview."""
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as f:
            f.write(file_contents)
            
        # Parse with Pandas
        df = pd.read_csv(file_path)
        
        # Replace NaNs with None for JSON serialization
        df = df.where(pd.notnull(df), None)
        
        preview = df.head(10).to_dict(orient="records")
        columns = df.columns.tolist()
        column_types = {col: str(dtype) for col, dtype in df.dtypes.items()}
        
        return {
            "file_path": file_path,
            "filename": filename,
            "columns": columns,
            "column_types": column_types,
            "row_count": len(df),
            "preview": preview
        }

    @staticmethod
    def sanitize_data(data):
        """Recursively replaces NaN and Inf with None for JSON compliance."""
        import numpy as np
        import math
        
        if isinstance(data, dict):
            return {k: DataService.sanitize_data(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [DataService.sanitize_data(v) for v in data]
        elif isinstance(data, float):
            if math.isnan(data) or math.isinf(data):
                return None
        return data

    @staticmethod
    def get_summary_stats(file_path: str) -> dict:
        df = pd.read_csv(file_path)
        desc = df.describe(include='all').reset_index()
        # Initial cleanup with pandas
        desc = desc.where(pd.notnull(desc), None)
        records = desc.to_dict(orient="records")
        # Final recursive cleanup for any stragglers
        return DataService.sanitize_data(records)

    @staticmethod
    def generate_chart_data(file_path: str, x_col: str, y_col: str, chart_type: str = 'bar') -> list:
        df = pd.read_csv(file_path)
        
        # Check if we are plotting record counts on the Y-axis
        is_count_y = y_col.lower() in ['count', 'frequency', 'size', 'counts']
        
        if x_col not in df.columns:
            return []
            
        if not is_count_y and y_col not in df.columns:
            return []
            
        # Handle case where user tries to plot column against itself (force count aggregation)
        if not is_count_y and x_col == y_col:
            is_count_y = True
            y_col = "count"

        # Safe column subsetting to avoid duplicate column/2D grouper error in Pandas
        if is_count_y:
            df = df[[x_col]].dropna()
        else:
            df = df[[x_col, y_col]].dropna()

        x_is_numeric = pd.api.types.is_numeric_dtype(df[x_col]) if x_col in df.columns else False
        y_is_numeric = False if is_count_y else pd.api.types.is_numeric_dtype(df[y_col])

        if is_count_y:
            # Group by category, count occurrences
            agg_df = df.groupby(x_col, as_index=False).size().rename(columns={'size': y_col})
            agg_df = agg_df.nlargest(20, y_col)
            records = agg_df.to_dict(orient='records')
        elif chart_type == 'pie' or (not x_is_numeric and y_is_numeric):
            # Pie / categorical bar/line: aggregate — group by x, sum y
            agg_df = df.groupby(x_col, as_index=False)[y_col].sum()
            agg_df = agg_df.nlargest(20, y_col)
            records = agg_df.to_dict(orient='records')
        elif not x_is_numeric and not y_is_numeric:
            # Both categorical: group by x, count rows to avoid duplicate column name issue
            temp_count_col = f"{y_col}_count"
            agg_df = df.groupby(x_col, as_index=False).size().rename(columns={'size': temp_count_col})
            agg_df = agg_df.nlargest(20, temp_count_col)
            
            # Map back to expected column name mapping for the frontend
            records = []
            for r in agg_df.to_dict(orient='records'):
                records.append({x_col: r[x_col], y_col: r[temp_count_col]})
        elif chart_type == 'scatter':
            # Scatter: needs both axes numeric, no aggregation
            records = df.head(200).to_dict(orient='records')
        else:
            # Both numeric or time-series: raw data, capped at 200 rows
            records = df.head(200).to_dict(orient='records')

        return DataService.sanitize_data(records)


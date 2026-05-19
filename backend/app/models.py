from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_path = Column(String)  # Local path or S3 key
    columns = Column(JSON)      # Store column names
    column_types = Column(JSON) # Store column types
    row_count = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"))
    query = Column(String)
    operation_type = Column(String) # 'summary', 'chart', 'filter'
    result = Column(JSON)           # The output data
    created_at = Column(DateTime(timezone=True), server_default=func.now())

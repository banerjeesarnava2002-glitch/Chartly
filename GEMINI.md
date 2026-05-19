# Dataset Playground - Project Context

## Overview
Dataset Playground is a web application that allows users to upload datasets, perform data analysis, visualization, transformation, and machine learning operations via natural language or predefined options. The application provides an interactive environment for data exploration and processing with a clean, modern UI.

## Tech Stack
- **Frontend**: React 18+ with TypeScript, Tailwind CSS
- **Backend**: Python 3.11+ with FastAPI
- **Database**: PostgreSQL 15+
- **Authentication**: Auth0
- **Deployment**: Docker containers on AWS (ECS or Elastic Beanstalk)
- **Data Processing**: Pandas, NumPy, Scikit-learn
- **Visualization**: Plotly, Matplotlib

## Architectural Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React/TS)                   │
│  - Dataset Upload Component                             │
│  - Operation Selection (NL/Category)                    │
│  - Results Display (Tables, Charts, Stats)              │
│  - History Panel                                        │
│  - Auth0 Integration                                    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────┐
│               Backend (FastAPI/Python)                   │
│  - Auth Middleware (Auth0 JWT validation)               │
│  - Dataset Management Service                           │
│  - Analysis Engine (Pandas, NumPy)                      │
│  - Visualization Generator (Plotly, Matplotlib)         │
│  - ML Pipeline (Scikit-learn)                           │
│  - History Service                                      │
└────────────────────────┬────────────────────────────────┘
                         │ SQLAlchemy ORM
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                    │
│  - users                                                │
│  - datasets                                             │
│  - analyses                                             │
│  - visualizations                                       │
│  - ml_models                                           │
└─────────────────────────────────────────────────────────┘
```

## Database Schema (Key Tables)

```sql
-- Users (synced with Auth0)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    auth0_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Datasets
CREATE TABLE datasets (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    original_format VARCHAR(50),
    storage_path VARCHAR(500),
    row_count INTEGER,
    column_count INTEGER,
    columns JSONB,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Analyses
CREATE TABLE analyses (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    dataset_id UUID REFERENCES datasets(id),
    analysis_type VARCHAR(100),  -- 'statistics', 'visualization', 'transformation', 'ml'
    parameters JSONB,
    results JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Development Commands

### Backend
```bash
# Setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --port 8000

# Run tests
pytest

# Database migrations (Alembic)
alembic upgrade head
alembic revision --autogenerate -m "description"
```

### Frontend
```bash
# Setup
cd frontend
npm install

# Development
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint
npm run lint
```

### Docker
```bash
# Build and run all services
docker-compose up --build

# Run specific service
docker-compose up backend

# Stop all
docker-compose down
```

## Code Conventions

### General
- Use meaningful, descriptive names for variables, functions, and classes
- Keep functions focused and under 50 lines where possible
- Write unit tests for all business logic
- Use type hints in Python and TypeScript
- Document public APIs with docstrings/comments

### Python (Backend)
- Follow PEP 8 style guide
- Use Pydantic models for request/response validation
- Organize routes in separate modules by feature
- Use dependency injection for services
- Handle errors with custom exception classes

```python
# Example route structure
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/datasets", tags=["datasets"])

class DatasetUpload(BaseModel):
    filename: str
    format: str
    content: str  # base64 encoded

@router.post("/upload")
async def upload_dataset(
    data: DatasetUpload,
    user = Depends(get_current_user),
    service: DatasetService = Depends(get_dataset_service)
):
    try:
        result = await service.process_upload(user.id, data)
        return {"status": "success", "dataset_id": result.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

### TypeScript/React (Frontend)
- Use functional components with hooks
- Define TypeScript interfaces for all data structures
- Use React Query for server state management
- Implement proper error boundaries
- Use Tailwind CSS utility classes for styling

```typescript
// Example component structure
interface Dataset {
  id: string;
  filename: string;
  format: string;
  rowCount: number;
  uploadedAt: string;
}

const DatasetList: React.FC = () => {
  const { data, isLoading, error } = useQuery<Dataset[]>({
    queryKey: ['datasets'],
    queryFn: () => fetch('/api/v1/datasets').then(res => res.json())
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error.message} />;

  return (
    <div className="grid gap-4 p-4">
      {data?.map(dataset => (
        <DatasetCard key={dataset.id} dataset={dataset} />
      ))}
    </div>
  );
};
```

### API Design
- RESTful endpoints with versioning (`/api/v1/...`)
- Consistent error response format
- Pagination for list endpoints
- File uploads via multipart/form-data
- Results returned as JSON or file downloads

## Agent-Specific Instructions for Antigravity

### Context File Usage
This GEMINI.md should be referenced when:
1. Generating new code (components, routes, services)
2. Debugging issues across the stack
3. Planning feature implementations
4. Setting up development environments

### Preferred Patterns

**Frontend Data Flow:**
- Use React Query for all API calls
- Implement optimistic updates for mutations
- Cache dataset metadata in memory
- Use Web Workers for heavy client-side processing

**Backend Architecture:**
- Service layer pattern (routes → services → repositories)
- Async processing for long-running operations (ML training)
- S3-compatible storage for large datasets
- Redis caching for frequent queries

**Error Handling:**
- Frontend: Error boundaries + toast notifications
- Backend: Structured error responses with error codes
- Both: Logging with correlation IDs

### Testing Requirements
- Backend: Minimum 80% code coverage on services
- Frontend: Test all API interactions and user flows
- E2E: Cypress tests for critical paths (upload → analyze → download)

### Deployment Notes
- Staging environment mirrors production
- Database migrations run automatically in CI/CD
- Secrets managed via AWS Secrets Manager
- Health checks on `/health` endpoint

### Common Gotchas
- Auth0 JWT validation requires proper audience/issuer configuration
- Large file uploads need streaming to avoid memory issues
- ML models should be cached after training
- Plotly figures must be serialized to JSON for frontend rendering
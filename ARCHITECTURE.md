# Dataset Playground - Architecture Document

## System Overview

Dataset Playground is a web application that allows users to upload datasets, perform data analysis, transformation, visualization, and machine learning operations through a natural language or predefined interface. The system follows a modern client-server architecture with a React frontend, FastAPI backend, PostgreSQL database, and Auth0 for authentication.

## Component Breakdown

### 1. Frontend (React + TypeScript + Tailwind CSS)
- **Authentication Module**: Handles Auth0 login/logout and token management
- **Dataset Upload Module**: File upload with format validation (CSV, JSON, Excel)
- **Operation Interface Module**: Natural language input and predefined operation selection
- **Results Display Module**: Renders analysis results, charts, and tables
- **Visualization Module**: Generates interactive charts using libraries like Chart.js or D3.js
- **History Module**: Displays past analyses with ability to revisit results
- **Download Module**: Handles export of processed datasets

### 2. Backend (Python + FastAPI)
- **API Gateway**: RESTful endpoints for all frontend interactions
- **Authentication Middleware**: Validates Auth0 JWT tokens
- **File Processing Service**: Handles file upload, parsing, and storage
- **Natural Language Processor**: Interprets user queries (NLP pipeline or LLM integration)
- **Analysis Engine**: Performs statistical analysis, correlations, summaries
- **Visualization Service**: Generates chart data and image outputs (e.g., Matplotlib, Plotly)
- **Transformation Service**: Applies filtering, aggregation, pivoting operations
- **Machine Learning Service**: Runs classification, regression, clustering models (scikit-learn)
- **History Service**: Manages analysis records and results storage

### 3. Database (PostgreSQL)
- **Users Table**: Stores user profiles linked to Auth0 IDs
- **Datasets Table**: Metadata about uploaded datasets (name, format, size, upload timestamp)
- **Analyses Table**: Records of each analysis (type, parameters, status, timestamps)
- **Results Table**: Stores analysis results (JSON or references to file storage)
- **History Table**: Links users to their analysis history

### 4. External Services
- **Auth0**: Identity provider for authentication and authorization
- **File Storage**: AWS S3 or local storage for raw dataset files and generated visualizations

### 5. Deployment (Docker + AWS)
- **Docker Containers**: Frontend (Nginx), Backend (Uvicorn), Database (PostgreSQL)
- **AWS ECS/Elastic Beanstalk**: Orchestration and scaling
- **Load Balancer**: Distributes traffic
- **CI/CD Pipeline**: Automated builds and deployments

## Data Flow Description

```
+------------------+       +------------------+       +------------------+
|   User Browser   |       |   FastAPI App    |       |   PostgreSQL     |
|   (React App)    |       |   (Backend)      |       |   (Database)     |
+--------+---------+       +--------+---------+       +--------+---------+
         |                          |                          |
         |  1. Login (Auth0)        |                          |
         |<------------------------->|                          |
         |  2. JWT Token            |                          |
         |<-------------------------|                          |
         |                          |                          |
         |  3. Upload Dataset       |                          |
         |  (POST /upload)          |                          |
         |------------------------->|                          |
         |                          |  4. Store Metadata       |
         |                          |------------------------->|
         |                          |  5. Save File (S3)      |
         |                          |                          |
         |  6. Upload Confirmation  |                          |
         |<-------------------------|                          |
         |                          |                          |
         |  7. Submit Operation     |                          |
         |  (POST /analyze)         |                          |
         |------------------------->|                          |
         |                          |  8. Parse Query         |
         |                          |  9. Process Data        |
         |                          |  10. Store Results      |
         |                          |------------------------->|
         |                          |                          |
         |  11. Return Results      |                          |
         |<-------------------------|                          |
         |                          |                          |
         |  12. View History        |                          |
         |  (GET /history)          |                          |
         |------------------------->|                          |
         |                          |  13. Fetch History      |
         |                          |------------------------->|
         |                          |                          |
         |  14. History Data        |                          |
         |<-------------------------|                          |
         |                          |                          |
         |  15. Download Results    |                          |
         |  (GET /download/:id)     |                          |
         |------------------------->|                          |
         |                          |  16. Retrieve File      |
         |                          |  (from S3 or DB)        |
         |                          |                          |
         |  17. File Stream         |                          |
         |<-------------------------|                          |

Data Flow Steps:
1-2: User authenticates via Auth0, receives JWT
3-6: User uploads dataset, backend parses and stores
7-11: User specifies operation, backend processes and returns results
12-14: User views analysis history
15-17: User downloads processed results
```

## Module Responsibilities

### Frontend Modules

| Module | Responsibility |
|--------|----------------|
| Authentication | Manage Auth0 login/logout, store JWT, protect routes |
| Upload | Accept file selection, validate format, send to backend |
| Operation Interface | Provide natural language input and predefined operation buttons |
| Results Display | Show analysis results in tables, text, or embedded visualizations |
| Visualization | Render charts (bar, line, scatter, etc.) using charting library |
| History | List past analyses with timestamps and ability to re-view |
| Download | Trigger file download of processed results |

### Backend Modules

| Module | Responsibility |
|--------|----------------|
| API Gateway | Define routes, handle requests, return responses |
| Auth Middleware | Verify JWT tokens, extract user identity |
| File Processing | Parse uploaded files into pandas DataFrames, validate schema |
| NLP Processor | Convert natural language queries into structured operations |
| Analysis Engine | Compute summary stats, correlations, missing values |
| Visualization Service | Generate chart images or interactive HTML (Plotly) |
| Transformation Service | Apply filters, group by, pivot tables |
| ML Service | Train models, make predictions, evaluate performance |
| History Service | CRUD operations for analysis records |
| Storage Service | Interface with S3 or local file system for file persistence |

## Key Design Decisions

### 1. Natural Language Processing Strategy
- **Decision**: Use a hybrid approach with predefined operation templates and optional LLM integration (e.g., OpenAI API) for complex queries.
- **Rationale**: Reduces latency for common operations while allowing flexibility for advanced users. Predefined templates ensure consistent parsing for standard tasks.

### 2. Asynchronous Processing for Long-Running Tasks
- **Decision**: Implement background task queues (e.g., Celery with Redis) for ML model training or large dataset transformations.
- **Rationale**: Prevents API timeouts and improves user experience by allowing progress polling via WebSocket or polling endpoints.

### 3. File Storage Architecture
- **Decision**: Store raw uploaded files in AWS S3 and analysis results in PostgreSQL (JSONB for structured data, S3 for large artifacts).
- **Rationale**: S3 provides scalable, durable storage for large files. JSONB enables efficient querying of analysis metadata. Separation of concerns reduces database bloat.

### 4. Chart Generation Approach
- **Decision**: Generate charts server-side using Plotly (Python) and return as JSON for client-side rendering, with fallback to static images.
- **Rationale**: Server-side generation ensures consistent output across devices. JSON format allows interactivity in the frontend without heavy computation.

### 5. Authentication and Authorization
- **Decision**: Use Auth0 with JWT tokens passed in HTTP headers. Backend validates tokens via Auth0's JWKS endpoint.
- **Rationale**: Offloads identity management to a trusted third party, supports social logins, and provides role-based access control for future features.

### 6. Database Schema Design
- **Decision**: Normalize core entities (users, datasets, analyses) with JSONB for flexible analysis parameters and results.
- **Rationale**: Balances query performance with schema flexibility. Avoids excessive table joins for varied analysis types.

### 7. Deployment Strategy
- **Decision**: Dockerize all components and deploy on AWS ECS (Fargate) for serverless container management, with RDS for PostgreSQL.
- **Rationale**: ECS provides automatic scaling, load balancing, and integration with other AWS services. Fargate eliminates server management overhead.

### 8. Frontend State Management
- **Decision**: Use React Context API for global state (auth, current dataset) and local state for component-specific data. No Redux needed due to moderate complexity.
- **Rationale**: Simplifies codebase for a team of moderate size. Context API is sufficient for this scope without introducing Redux boilerplate.

### 9. Error Handling Strategy
- **Decision**: Implement consistent error responses from backend (RFC 7807 Problem Details) and display user-friendly messages in frontend with retry options.
- **Rationale**: Improves debuggability and user experience. Standardized errors allow frontend to handle failures gracefully.

### 10. Testing Strategy
- **Decision**: Unit tests for backend services (pytest), integration tests for API endpoints, and end-to-end tests using Cypress for critical user flows.
- **Rationale**: Ensures reliability of core functionality without over-testing. CI pipeline runs tests on every push.
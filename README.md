# Dataset Playground

A powerful web application that enables users to upload datasets and perform a wide range of operations—from basic analysis and visualization to complex machine learning tasks—all through an intuitive interface. Simply upload your data, describe what you want to do, and let the app handle the rest.

---

## Features

- **Multi-Format Upload** – Supports CSV, JSON, Excel, and other common data formats.
- **Natural Language or Predefined Operations** – Specify your desired operation via natural language or choose from a list of common tasks.
- **Data Analysis** – Generate summary statistics, correlation matrices, and other analytical insights.
- **Data Visualization** – Create interactive charts, graphs, and plots (bar, line, scatter, heatmaps, etc.).
- **Data Transformation** – Filter, aggregate, pivot, and reshape your data as needed.
- **Machine Learning** – Run classification, regression, and clustering models on your dataset.
- **Download Results** – Export processed data, visualizations, or model predictions.
- **History & Reproducibility** – View and revisit past analyses, including inputs and outputs.

---

## Tech Stack

| Layer        | Technology                |
|--------------|---------------------------|
| Frontend     | React with TypeScript     |
| Backend      | Python (FastAPI)          |
| Database     | PostgreSQL                |
| Auth         | Auth0                     |
| Styling      | Tailwind CSS              |
| Deployment   | Docker + AWS (ECS/Elastic Beanstalk) |

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later)
- **Python** (v3.10 or later)
- **PostgreSQL** (v13 or later)
- **Docker** (optional, for containerized deployment)
- **AWS CLI** (if deploying to AWS)

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/dataset-playground.git
cd dataset-playground
```

### 2. Backend Setup

Navigate to the backend directory and create a virtual environment:

```bash
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd ../frontend
npm install
```

### 4. Database Setup

Create a PostgreSQL database (e.g., `dataset_playground`). Update the connection string in environment variables (see below).

### 5. Auth0 Setup

1. Create an Auth0 application (Single Page Application).
2. Configure allowed callback URLs (e.g., `http://localhost:3000`).
3. Note your Auth0 domain, client ID, and audience.

---

## Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dataset_playground

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_AUDIENCE=your-api-audience
AUTH0_ALGORITHMS=RS256

# Backend
SECRET_KEY=your-secret-key
ALLOWED_ORIGINS=http://localhost:3000

# Optional: file upload limits
MAX_UPLOAD_SIZE_MB=50
```

For the frontend, create a `.env` file in the `frontend` directory:

```env
REACT_APP_AUTH0_DOMAIN=your-tenant.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-client-id
REACT_APP_AUTH0_AUDIENCE=your-api-audience
REACT_APP_API_BASE_URL=http://localhost:8000
```

---

## Usage

### Run Locally

1. **Start the backend** (from `backend/`):

```bash
uvicorn app.main:app --reload
```

2. **Start the frontend** (from `frontend/`):

```bash
npm start
```

3. Open your browser at `http://localhost:3000`.

### Using Docker

From the project root, build and run both services:

```bash
docker-compose up --build
```

The app will be available at `http://localhost:3000`.

### Deploy to AWS

1. Build Docker images and push to Amazon ECR.
2. Deploy to Amazon ECS or Elastic Beanstalk using the provided `Dockerfile` and `docker-compose.yml` as references.
3. Set environment variables in your AWS environment.

---

## Project Structure

```
dataset-playground/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── api/
│   │   │   ├── endpoints/       # API route handlers
│   │   │   ├── dependencies.py  # Auth, DB dependencies
│   │   │   └── router.py        # Route registration
│   │   ├── core/
│   │   │   ├── config.py        # Environment & app configuration
│   │   │   ├── security.py      # Auth0 verification
│   │   │   └── database.py      # DB connection & session
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas (request/response)
│   │   └── services/            # Business logic (analysis, ML, etc.)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page-level components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API client & Auth0 integration
│   │   ├── types/               # TypeScript type definitions
│   │   └── App.tsx              # Main app component
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env.example
├── docker-compose.yml           # Multi-container orchestration
├── .gitignore
└── README.md
```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.
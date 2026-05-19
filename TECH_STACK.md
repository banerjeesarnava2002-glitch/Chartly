# TECH_STACK.md

## Technology Choices

| Technology | Choice | Reasoning |
|---|---|---|
| **Frontend** | React with TypeScript | React is widely used with a rich ecosystem for data visualization libraries like D3.js and Recharts. TypeScript adds type safety. |
| **Backend** | Python (FastAPI) | Python is the de facto language for data science, with libraries like pandas, numpy, scikit-learn, and FastAPI provides high performance and easy async support. |
| **Database** | PostgreSQL | PostgreSQL is robust, supports JSONB for flexible schema, and can handle complex queries for user history and metadata. |
| **Authentication** | Auth0 | Auth0 provides a secure, scalable, and easy-to-integrate authentication solution with support for social logins and MFA. |
| **Styling** | Tailwind CSS | Tailwind CSS enables rapid UI development with utility-first classes, ensuring consistent and responsive design. |
| **Deployment** | Docker + AWS (ECS or Elastic Beanstalk) | Docker ensures consistent environments across development and production. AWS offers managed container orchestration (ECS) or simplified deployment (Elastic Beanstalk) for scalability and reliability. |
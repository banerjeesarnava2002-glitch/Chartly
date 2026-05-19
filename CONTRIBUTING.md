# Contributing to Dataset Playground

Thank you for considering contributing to Dataset Playground! This document outlines the guidelines and expectations for contributing to this project.

## Table of Contents
- [Branch Naming Conventions](#branch-naming-conventions)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Code Style Guide](#code-style-guide)
- [Testing Requirements](#testing-requirements)
- [Getting Started](#getting-started)

## Branch Naming Conventions

All branches should follow the format: `<type>/<short-description>`

### Types
- `feature/` - New features or enhancements
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring without functional changes
- `chore/` - Maintenance tasks, dependencies, CI/CD
- `test/` - Adding or updating tests

### Examples
- `feature/user-data-export`
- `bugfix/fix-login-redirect`
- `hotfix/critical-auth-fix`
- `docs/update-api-endpoints`
- `refactor/optimize-db-queries`
- `chore/update-docker-compose`
- `test/add-dataset-upload-tests`

Use lowercase with hyphens for word separation.

## Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- `feat` - A new feature
- `fix` - A bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, missing semicolons, etc.)
- `refactor` - Code refactoring
- `test` - Adding or modifying tests
- `chore` - Build process, dependencies, or tooling changes

### Scope (optional)
- `frontend` - React/TypeScript changes
- `backend` - Python/FastAPI changes
- `db` - Database migrations or schema changes
- `auth` - Authentication/Auth0 changes
- `deploy` - Docker/AWS deployment changes
- `deps` - Dependency updates

### Examples
```
feat(frontend): add dataset preview component

fix(backend): handle null values in CSV parser

docs: update API authentication section

test(backend): add unit tests for data validation

chore(deploy): update Dockerfile for production
```

## Pull Request Process

1. **Create a branch** from `main` following the naming conventions above.

2. **Keep PRs focused** - Each PR should address a single concern. Avoid mixing unrelated changes.

3. **Write a clear PR description** including:
   - What changes are being made and why
   - Screenshots or GIFs for UI changes
   - Links to related issues
   - Any breaking changes or migration steps

4. **Ensure all checks pass**:
   - Linting (ESLint for frontend, Flake8/Pylint for backend)
   - TypeScript type checking
   - All tests pass (frontend and backend)
   - Build succeeds

5. **Code review requirements**:
   - At least one approval from a maintainer
   - All reviewer comments must be addressed
   - No unresolved merge conflicts

6. **Merge strategy**: Squash and merge into `main` with a clean commit message.

7. **Delete the branch** after merging.

## Code Style Guide

### Frontend (React + TypeScript)

- **TypeScript**: Use strict mode. Avoid `any` types when possible.
- **Components**: Use functional components with hooks. One component per file.
- **File naming**: PascalCase for components (`UserProfile.tsx`), camelCase for utilities (`formatDate.ts`)
- **Imports**: Order: React → third-party → internal modules → styles
- **State management**: Use React hooks (useState, useReducer) or Context API. Avoid Redux unless necessary.
- **CSS**: Use Tailwind CSS utility classes. Avoid custom CSS unless absolutely necessary.
- **Formatting**: Use Prettier with the project's configuration.

### Backend (Python + FastAPI)

- **Python version**: 3.11+
- **Type hints**: Use type hints for all function parameters and return values.
- **Naming**: snake_case for variables/functions, PascalCase for classes, UPPER_CASE for constants
- **File structure**: Routes in `routes/`, models in `models/`, services in `services/`, schemas in `schemas/`
- **API design**: Follow RESTful conventions. Use Pydantic models for request/response validation.
- **Error handling**: Use HTTPException with appropriate status codes.
- **Formatting**: Use Black with line length 88. Use isort for import sorting.

### General

- **Documentation**: Write docstrings for all public functions, classes, and modules.
- **Logging**: Use structured logging. Don't use print statements.
- **Secrets**: Never commit API keys, passwords, or tokens. Use environment variables.

## Testing Requirements

### Frontend Testing

- **Framework**: Vitest + React Testing Library
- **Coverage**: Minimum 80% for new code
- **Test types**:
  - Unit tests for utility functions and hooks
  - Component tests for UI components
  - Integration tests for user flows
- **Run tests**: `npm test` or `yarn test`

### Backend Testing

- **Framework**: pytest
- **Coverage**: Minimum 85% for new code
- **Test types**:
  - Unit tests for services and utilities
  - Integration tests for API endpoints
  - Database tests with test fixtures
- **Run tests**: `pytest` or `pytest --cov`

### Testing Guidelines

- Write tests before or alongside code (TDD encouraged)
- Mock external services (Auth0, AWS, etc.)
- Use factories or fixtures for test data
- Test edge cases and error conditions
- Avoid testing implementation details; test behavior

## Getting Started

1. Clone the repository: `git clone https://github.com/your-org/dataset-playground.git`
2. Install dependencies:
   - Frontend: `cd frontend && npm install`
   - Backend: `cd backend && pip install -r requirements.txt`
3. Set up environment variables (see `.env.example`)
4. Run locally:
   - Frontend: `npm run dev`
   - Backend: `uvicorn app.main:app --reload`
5. Run tests before submitting a PR

Thank you for contributing!
# AGENTS.md

## Project Overview

**Dataset Playground** is a web application for exploring, visualizing, and manipulating datasets. Users can upload CSV/JSON/Parquet files, preview data, run basic transformations, and generate charts. The app supports multi-user workspaces with Auth0 authentication.

**Stack:** React + TypeScript (frontend), Python FastAPI (backend), PostgreSQL (database), Auth0 (auth), Tailwind CSS (styling), Docker + AWS ECS/Elastic Beanstalk (deployment).

**Agent Target:** `antigravity`

---

## Agent Roles

### 1. Architect (A)
**Responsibilities:**
- Define system architecture, data flow, and component hierarchy.
- Maintain `ARCHITECTURE.md` and `DATA_MODEL.md`.
- Review and approve all significant design decisions.
- Resolve cross-cutting concerns (auth, deployment, state management).
- Hand off finalized specs to Frontend and Backend agents.

### 2. Frontend Agent (FE)
**Responsibilities:**
- Implement React + TypeScript components, pages, and routing.
- Integrate with backend APIs (REST/GraphQL).
- Manage client-side state (React Query, Zustand, or Context).
- Apply Tailwind CSS styling and ensure responsive design.
- Write unit/integration tests for UI components.
- Hand off completed features to QA for verification.

### 3. Backend Agent (BE)
**Responsibilities:**
- Develop FastAPI endpoints, models, and business logic.
- Design and manage PostgreSQL schema and migrations.
- Implement Auth0 authentication and authorization middleware.
- Write unit/integration tests for APIs and services.
- Prepare Dockerfiles and deployment configurations.
- Hand off completed APIs to QA for verification.

### 4. QA Agent (QA)
**Responsibilities:**
- Review all PRs for correctness, edge cases, and security.
- Write end-to-end tests (Playwright/Cypress) and integration tests.
- Perform manual exploratory testing.
- Log bugs and verify fixes.
- Approve or reject handoffs from FE and BE.
- Report regressions to Architect.

---

## Coordination Rules

1. **Communication:** All agents must use the `#dataset-playground` channel. Tag roles: `@architect`, `@frontend`, `@backend`, `@qa`.
2. **Task Tracking:** Use GitHub Projects or a shared Kanban board. Statuses: `Backlog`, `In Progress`, `In Review`, `Done`.
3. **Branch Naming:** `feat/<agent-role>/<short-description>` (e.g., `feat/fe/data-upload-form`).
4. **PR Conventions:** Every PR must include:
   - Description of changes
   - Link to related issue/ticket
   - Screenshots (for UI changes)
   - Test evidence (passing CI, coverage report)
5. **Review Requirements:**
   - FE PRs require approval from QA and optionally Architect.
   - BE PRs require approval from QA and optionally Architect.
   - Architecture changes require Architect approval.
6. **Daily Sync:** 10-minute standup at 09:00 UTC. Each agent reports: what I did yesterday, what I'll do today, blockers.

---

## Shared Context Files List

These files are maintained by the Architect and referenced by all agents:

| File | Purpose | Owner |
|------|---------|-------|
| `ARCHITECTURE.md` | High-level system design, data flow, component tree | Architect |
| `DATA_MODEL.md` | Database schema, relationships, migrations plan | Architect |
| `API_SPEC.md` | OpenAPI/Swagger spec for all endpoints | Architect (updated by BE) |
| `AUTH_FLOW.md` | Auth0 integration details, token handling, roles | Architect |
| `DEPLOYMENT.md` | Docker setup, AWS ECS/EB config, environment vars | Architect |
| `TESTING_STRATEGY.md` | Unit, integration, e2e testing guidelines | QA |
| `CONVENTIONS.md` | Code style, naming, folder structure, commit messages | Architect |
| `CHANGELOG.md` | Release notes and breaking changes | All |

---

## Handoff Protocols

### Handoff from Architect to FE/BE
1. Architect creates a detailed spec issue/ticket with:
   - Acceptance criteria
   - API contracts (if applicable)
   - UI mockups or wireframes (if applicable)
   - Database changes (if applicable)
2. Architect assigns the issue to FE or BE.
3. FE/BE acknowledges by moving the issue to `In Progress`.

### Handoff from FE to QA
1. FE opens a PR with feature complete and tests passing.
2. FE tags `@qa` in the PR with a comment: `Ready for QA: <feature name>`.
3. QA reviews, runs e2e tests, and either:
   - Approves (moves issue to `Done`), or
   - Requests changes (moves issue back to `In Progress`).

### Handoff from BE to QA
1. BE opens a PR with API endpoints, tests, and Swagger docs updated.
2. BE tags `@qa` in the PR with a comment: `Ready for QA: <endpoint name>`.
3. QA reviews, calls endpoints via Swagger/Postman, checks error handling, and either:
   - Approves (moves issue to `Done`), or
   - Requests changes (moves issue back to `In Progress`).

### Handoff from QA to Architect (for release)
1. QA runs full regression suite and verifies all issues in the milestone are `Done`.
2. QA creates a release summary issue with:
   - List of features/bugfixes
   - Test coverage report
   - Known issues (if any)
3. Architect reviews and approves the release.
4. Architect triggers deployment pipeline.

### Emergency Handoff
If a critical bug is found in production:
1. QA immediately tags `@architect` and `@backend` (or `@frontend` depending on layer).
2. Architect triages and assigns a hotfix issue.
3. FE/BE works on a dedicated `hotfix/` branch.
4. QA verifies the fix and Architect deploys.

---

**Agent Target:** `antigravity`
# Healthcare Case Review Assistant — MVP Engineering Documentation

This repository-ready documentation package is the source of truth for building the Healthcare Case Review Assistant MVP.

## Product intent
The product assists hospital utilization-management / prior-authorization reviewers by locating evidence in synthetic longitudinal patient records, mapping evidence to synthetic medical-necessity criteria, explaining criterion-level findings, and producing a non-binding overall AI recommendation. A qualified human reviewer always makes the final workflow decision.

## Mandatory build sequence
1. Read `00-project-overview.md` through `06-external-services-and-data-setup.md`.
2. Read `AGENTS.md` before any code is generated.
3. Build the frontend first using only the documents under `frontend/` and mock service implementations.
4. Validate the frontend acceptance criteria before backend integration.
5. Build the backend using the documents under `backend/`.
6. Follow `IMPLEMENTATION-ROADMAP.md` for exact phase ordering and exit criteria.
7. Use `ENGINEER_IMPLEMENTATION_GUIDE.md` as the hands-on learning/build guide.

## Document index
### Core product and architecture
- `00-project-overview.md` — detailed project description, problem, users, value, MVP scope.
- `01-requirements-analysis.md` — formal requirements, constraints, acceptance criteria.
- `02-product-specification.md` — exact product behavior and state rules.
- `03-domain-model.md` — canonical vocabulary, entities, enums, invariants.
- `04-system-architecture.md` — target architecture and dependency boundaries.
- `05-end-to-end-workflows.md` — product and engineering workflows from data generation to final review.
- `06-external-services-and-data-setup.md` — official setup/reference guide for all external services and libraries.

### Frontend handoff package
- `frontend/01-frontend-build-spec.md`
- `frontend/02-ui-ux-design-system.md`
- `frontend/03-frontend-architecture.md`
- `frontend/04-services-layer-contract.md`
- `frontend/05-mock-services-and-fixtures.md`
- `frontend/06-screen-by-screen-specification.md`

### Backend / AI handoff package
- `backend/01-backend-specification.md`
- `backend/02-database-and-data-model.md`
- `backend/03-rest-api-contract.md`
- `backend/04-synthetic-data-pipeline.md`
- `backend/05-ai-analysis-pipeline.md`
- `backend/06-retrieval-and-grounding.md`
- `backend/07-evaluation-specification.md`
- `backend/08-security-and-audit.md`

### Build control
- `IMPLEMENTATION-ROADMAP.md` — phase-by-phase coding-agent execution plan.
- `ENGINEER_IMPLEMENTATION_GUIDE.md` — step-by-step guide for the engineer, from installation to AI evaluation and future model training.
- `AGENTS.md` — non-negotiable rules for coding agents.

## Canonical technology decisions
### Frontend
Next.js + React + TypeScript + Tailwind CSS + TanStack Query. React built-in state only for local UI state. No Zustand in MVP.

### Backend
Python + FastAPI + PostgreSQL + pgvector + LangGraph + OpenAI API. REST only.

### Data
Synthea-generated synthetic FHIR R4 records plus project-generated synthetic prior-authorization requests, synthetic medical-necessity policies, and explicit ground truth.

### Authentication
Simple email/password authentication with pre-created reviewer accounts. Secure password hashing and bearer-token authentication. No registration, MFA, SSO, or password reset in MVP.

## Non-negotiable safety/product principle
The AI is decision support only. It must never autonomously issue the final authorization determination. Final decisions belong to a qualified human reviewer.

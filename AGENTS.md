# AGENTS.md — Mandatory Coding-Agent Rules

These rules are binding for every coding agent working on this repository.

## 1. Source of truth
1. The Markdown specifications in this repository are authoritative.
2. Do not invent features, states, routes, fields, domain terminology, business rules, or dependencies not defined by the documents.
3. If two documents appear inconsistent, use this precedence order: `01-requirements-analysis.md` -> `02-product-specification.md` -> `03-domain-model.md` -> architecture documents -> frontend/backend implementation documents.
4. Do not silently resolve a genuine contradiction. Record it in a `SPEC_ISSUES.md` file and stop only that conflicting implementation task. Continue independent work.

## 2. Clean Code requirements
Implementation must follow Clean Code principles without copying proprietary book text.
- Use meaningful, domain-specific names.
- Keep functions, methods, classes, components, and modules focused on one responsibility.
- Prefer explicit behavior over clever abstractions.
- Keep dependencies pointed inward toward stable contracts/domain concepts.
- Minimize duplication, but do not create premature abstractions.
- Avoid boolean-flag-heavy APIs when an enum/value object communicates intent better.
- Avoid hidden side effects.
- Prefer immutable domain records where the product requires auditability.
- Keep controllers/routes thin; business rules belong in application/domain services.
- Keep React presentation components free of data-access logic.
- Write tests around business invariants, not implementation details.
- Delete dead code; do not leave commented-out implementations.

## 3. Frontend architecture boundary — strict
React components, pages, and hooks MUST NOT:
- call `fetch`, Axios, or HTTP clients directly;
- import mock fixture data directly;
- import database or backend implementation details;
- call OpenAI or any external provider;
- contain backend business rules.

All external data access MUST flow through typed domain service interfaces. Frontend phase uses mock implementations. Backend integration later swaps in API implementations without rewriting UI behavior.

## 4. Backend layering
Use clear layers:
- API/transport: FastAPI routers, request validation, HTTP mapping.
- Application: orchestration/use cases/authorization checks.
- Domain: entities, enums, invariants, policy logic independent of FastAPI/PostgreSQL/OpenAI.
- Infrastructure: database repositories, OpenAI client, embeddings, pgvector, job worker, FHIR adapters.

Routes must not contain SQL, LLM prompts, embedding code, or domain decision rules.

## 5. AI safety and grounding
- AI never makes the legally/clinically final authorization decision.
- AI overall recommendation is exactly one of: `CRITERIA_APPEAR_SATISFIED`, `CRITERIA_APPEAR_NOT_SATISFIED`, `ADDITIONAL_DOCUMENTATION_NEEDED`.
- Criterion status is exactly one of: `SUPPORTED`, `NOT_SUPPORTED`, `INSUFFICIENT_EVIDENCE`.
- Every clinical fact in an AI rationale must be traceable to a cited source passage.
- Do not display uncalibrated per-case confidence scores.
- Never fabricate evidence, passages, dates, diagnoses, medications, tests, or policy requirements.
- If evidence is missing, say it is missing.

## 6. Synthetic data only
- Never add real patient data.
- Never add PHI.
- Never copy proprietary payer policy language.
- Use Synthea FHIR data and project-owned synthetic policies/cases only.
- Include clear seed values for reproducibility where generation is deterministic.

## 7. Auditability
The following records are append-only/immutable in MVP after creation:
- saved reviewer notes;
- AI analysis versions;
- activity events;
- final completed review state.
Do not implement delete/edit/reopen shortcuts that violate the specification.

## 8. Scope discipline
Explicitly out of MVP unless a document says otherwise:
- notifications;
- urgency/priority tiers;
- automatic case assignment;
- case release/reassignment;
- physician login/workflow after escalation;
- admin role;
- document upload by reviewers;
- SSO/MFA/self-registration/password reset;
- Kubernetes;
- cloud deployment requirement;
- calibrated confidence scoring;
- production HIPAA compliance certification;
- model fine-tuning/training as a required MVP runtime component.

## 9. Tests
No phase is complete until its acceptance tests pass. At minimum:
- unit tests for domain/state rules;
- service contract tests;
- API tests for backend phase;
- retrieval/evaluation tests for AI phase;
- end-to-end happy path and failure path.

## 10. Security
- Never commit `.env`, secrets, API keys, access tokens, or plaintext passwords.
- Passwords must be securely hashed in the real backend.
- Reviewer-facing errors must not expose stack traces or provider details.
- Technical failures belong in backend logs.

## 11. Documentation maintenance
When implementation intentionally changes an approved design, update the relevant specification in the same change. Do not allow code and docs to silently diverge.


## Git and Commit Discipline

Commits are milestone-based, not time-based.

After completing a meaningful unit of work:

1. Finish the implementation completely.
2. Run all relevant tests, type checks, lint checks, and other verification required for that part of the project.
3. Fix all failures before committing.
4. Review the changed files and remove temporary code, debugging statements, dead code, and unintended modifications.
5. Confirm the implementation satisfies the applicable specification and roadmap acceptance criteria.
6. Only then create a Git commit.

Do not commit:

* partially implemented features,
* failing tests,
* broken builds,
* unresolved type errors,
* temporary debugging code,
* commented-out experimental code,
* secrets or `.env` files,
* unrelated changes bundled into the same commit.

Each commit should represent one coherent, completed change.

Prefer small-to-medium commits that correspond to meaningful milestones such as:

* `feat: add backend health endpoint and database connection`
* `feat: implement reviewer authentication`
* `feat: add Synthea FHIR ingestion pipeline`
* `feat: implement vector evidence retrieval`
* `feat: add hybrid retrieval and reranking`
* `feat: implement criterion analysis workflow`
* `test: add retrieval evaluation suite`
* `refactor: separate analysis orchestration from API layer`

Before every commit, run the checks appropriate to the affected part of the repository.

### Frontend changes

At minimum:

* tests
* type checking
* linting
* build, when applicable

### Backend changes

At minimum:

* backend test suite
* linting/static checks configured for the project
* application startup verification when relevant
* database/migration verification when relevant

### AI and retrieval changes

In addition to normal backend checks:

* relevant evaluation tests
* regression checks against existing evaluation data
* confirmation that previously passing grounding/retrieval behavior has not unexpectedly degraded

### Phase completion

When an entire roadmap phase is complete:

1. Run the full verification required by that phase.
2. Confirm its exit gate is satisfied.
3. Mark the corresponding checklist items in `IMPLEMENTATION-ROADMAP.md`.
4. Create a clean milestone commit.

Do not begin the next major roadmap phase until the current phase has passed its required checks and been committed.

Commit messages must describe what was completed, not what is planned.

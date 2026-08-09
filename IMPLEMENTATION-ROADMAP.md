# IMPLEMENTATION ROADMAP — Coding-Agent Execution Checklist

This file controls implementation order and progress tracking. Do not jump to later phases because they appear more interesting.

## How to use this checklist
- Mark an item complete only after the implementation and its required verification are complete.
- Do not mark a phase complete until every required task, test/check, and exit criterion in that phase is satisfied.
- Do not skip gates. A gate exists to prevent downstream work from being built on an unverified foundation.
- If implementation behavior appears ambiguous, consult the authoritative specification documents before coding. Do not invent requirements.
- Future-version features must not be added during MVP implementation unless the specifications are formally updated first.

---

# Global session checklist
At the beginning of every coding-agent session:

- [ ] Read `AGENTS.md`.
- [ ] Read core documents relevant to the current phase.
- [ ] Read the phase-specific documents listed below.
- [ ] Inspect existing code and tests before modifying anything.
- [ ] Confirm the current phase and do not implement later-phase scope.
- [ ] Run all required checks before ending the session.
- [ ] Update documentation only when an approved implementation detail must be recorded.

---

# Phase 0 — Repository foundation

## Inputs
- All core docs
- `AGENTS.md`

## Tasks
- [x] Initialize the Git repository.
- [x] Create root folders `frontend/`, `backend/`, and `docs/` if docs are moved into the repository; preserve this documentation package.
- [x] Add a root `.gitignore` covering Node, Python, `.env`, caches, build artifacts, and Synthea-generated bulk output if it is not intended for version control.
- [x] Add `.env.example` placeholders without secrets.
- [x] Add a root README linking the specification documents.

## Do not
- [x] Do not implement business logic.
- [x] Do not install or depend on cloud services.
- [x] Do not add Docker or Kubernetes.

## Exit criteria
- [x] Repository is clean.
- [x] Documentation is preserved and discoverable.
- [x] Secrets and local generated artifacts are ignored.

**Phase 0 complete only when every applicable item above is checked.**

---

# Phase 1 — Frontend scaffold

## Read first
- `frontend/01-frontend-build-spec.md`
- `frontend/02-ui-ux-design-system.md`
- `frontend/03-frontend-architecture.md`

## Tasks
- [x] Scaffold the current Next.js App Router project with TypeScript and ESLint.
- [x] Install and configure Tailwind using the current official documentation.
- [x] Install TanStack Query.
- [x] Enable TypeScript strict mode.
- [x] Create the exact documented frontend folder architecture.
- [x] Create domain enums, models, permission helpers, and validators.
- [x] Create the application shell and protected-route/auth-context mechanism.

## Required checks
- [x] Development server runs successfully.
- [x] Type checking passes.
- [x] Linting passes.
- [x] Basic navigation shell renders correctly.
- [x] No backend calls exist.
- [x] No mock fixture is imported directly into a page or component.

## Exit criteria
- [x] Frontend scaffold matches the documented architecture.
- [x] All required checks above pass.

**Phase 1 complete only when every item above is checked.**

---

# Phase 2 — Frontend services and mocks

## Read first
- `frontend/04-services-layer-contract.md`
- `frontend/05-mock-services-and-fixtures.md`

## Tasks
- [x] Define all frontend service interfaces.
- [x] Define the service error hierarchy.
- [x] Build the in-memory mock store.
- [x] Create 3 reviewer fixtures.
- [x] Create 18–25 realistic case fixtures covering all documented states and procedures.
- [x] Create evidence fixtures.
- [x] Create patient timeline fixtures.
- [x] Create activity timeline fixtures.
- [x] Create AI Quality/evaluation fixtures.
- [x] Implement mock service methods with realistic delays.
- [x] Implement controlled mock error conditions.
- [x] Implement mock case claiming behavior.
- [x] Implement mock save-progress behavior.
- [x] Implement mock immutable-note behavior.
- [x] Implement mock read-only ownership rules.
- [x] Implement mock analysis-version behavior.
- [x] Implement service contract tests.

## Required tests
- [x] Valid login succeeds.
- [x] Invalid login fails safely.
- [x] Unassigned case can be claimed.
- [x] Competing claim produces the documented conflict behavior.
- [x] Owner can mutate an active claimed case where permitted.
- [x] Non-owner cannot mutate a claimed case.
- [x] Saved reviewer notes are immutable.
- [x] Final-decision validation rules are enforced.
- [x] Search works.
- [x] Filters work.

## Exit criteria
- [x] All mock behavior is reachable only through service contracts.
- [x] Pages/components/hooks do not directly import mock fixtures.
- [x] Contract tests pass.

**Phase 2 complete only when every item above is checked.**

---

# Phase 3 — Frontend screens and workflows

## Read first
- `frontend/06-screen-by-screen-specification.md`

## Build order
- [x] Login screen.
- [x] Shared Case Queue.
- [x] My Cases.
- [x] Case Detail read-only modes.
- [x] Claim behavior.
- [x] Evidence passage panel.
- [x] Patient Timeline.
- [x] Reviewer Notes and Activity Timeline.
- [x] Criterion override workflow.
- [x] Save Progress workflow.
- [x] Final Decision workflow.
- [x] AI analysis version history.
- [x] AI Quality page.

## Required scenario demo — reviewer A
- [x] Log in as reviewer A.
- [x] Open a Ready case.
- [x] Claim the case.
- [x] Inspect AI-identified evidence.
- [x] Open an exact cited passage.
- [x] Inspect the broader patient timeline.
- [x] Add an immutable reviewer note.
- [x] Override one criterion with a required reason.
- [x] Save progress.
- [x] Complete the case with a valid final decision.
- [x] Confirm the completed case becomes read-only.

## Required scenario demo — reviewer B
- [x] Log in as reviewer B.
- [x] Open a case claimed by reviewer A.
- [x] Confirm the case is visible in read-only mode.
- [x] Open a completed case belonging to reviewer A.
- [x] Confirm the completed case is read-only.

## Required failure scenario
- [x] Open an `Analysis Failed` case.
- [x] Confirm case metadata is visible.
- [x] Confirm reviewer-facing failure text is safe and understandable.
- [x] Confirm no technical stack trace is exposed in the UI.

## Required checks
- [x] All documented mock-backed screens are functional.
- [x] Accessibility basics pass.
- [x] Type checking passes.
- [x] Linting passes.
- [x] Frontend tests pass.
- [x] Refresh persistence is intentionally not implemented.

## Exit criteria
- [x] Entire reviewer MVP workflow can be demonstrated without a backend.
- [x] Frontend feature scope is frozen at the documented MVP boundary.
- [x] Notifications, admin functionality, uploads, automatic assignment, SSO, and other future-version features have not been added.

**FREEZE FRONTEND FEATURE SCOPE HERE.**

**Phase 3 complete only when every item above is checked.**

---

# Phase 4 — Backend scaffold and database

## Read first
- `backend/01-backend-specification.md`
- `backend/02-database-and-data-model.md`
- `backend/08-security-and-audit.md`

## Tasks
- [ ] Create the Python virtual environment and dependency project.
- [ ] Scaffold the documented layered FastAPI structure.
- [ ] Configure Pydantic settings/environment configuration.
- [ ] Install and connect local PostgreSQL.
- [ ] Install and enable pgvector.
- [ ] Add SQLAlchemy/Alembic or the chosen consistent database layer defined by the project docs.
- [ ] Implement migrations for the documented schema.
- [ ] Implement the database health check.
- [ ] Implement repository patterns without placing business logic in routes.

## Required checks
- [ ] A clean database can be created from zero using migrations.
- [ ] pgvector extension is enabled successfully.
- [ ] FastAPI health endpoint works.
- [ ] Backend can connect to PostgreSQL.
- [ ] Architecture boundaries conform to `AGENTS.md`.

## Exit criteria
- [ ] Backend foundation is reproducible from documented setup instructions.
- [ ] Database schema can be recreated cleanly.
- [ ] Required checks pass.

**Phase 4 complete only when every item above is checked.**

---

# Phase 5 — Authentication and non-AI domain API

## Read first
- `backend/03-rest-api-contract.md`
- FastAPI security documentation linked in `06-external-services-and-data-setup.md`

## Tasks
- [ ] Seed 3 reviewer accounts with securely hashed passwords.
- [ ] Implement login/token behavior.
- [ ] Implement `/auth/me`.
- [ ] Implement case repositories/use cases with database seed fixtures initially.
- [ ] Implement shared case listing.
- [ ] Implement My Cases listing.
- [ ] Implement case detail.
- [ ] Implement atomic claim behavior.
- [ ] Implement immutable reviewer notes.
- [ ] Implement save-review-progress behavior.
- [ ] Implement criterion override behavior and required reasons.
- [ ] Implement final-decision behavior and validation rules.
- [ ] Implement activity events.
- [ ] Implement timeline and evidence endpoints against temporary seeded records if needed.

## Required tests
- [ ] Authentication tests pass.
- [ ] Claim atomicity/race-condition test passes.
- [ ] Owner/non-owner read-only rules pass.
- [ ] Decision validation tests pass.
- [ ] Note immutability tests pass.
- [ ] Completed-case immutability tests pass.

## Exit criteria
- [ ] All documented non-AI REST API behavior works against PostgreSQL.
- [ ] Authorization is enforced server-side rather than trusted to the UI.

**Phase 5 complete only when every item above is checked.**

---

# Phase 6 — Synthea and FHIR ingestion

## Read first
- `backend/04-synthetic-data-pipeline.md`
- Data chapters in `ENGINEER_IMPLEMENTATION_GUIDE.md`

## Tasks
- [ ] Install Java.
- [ ] Install Synthea.
- [ ] Generate a 10-patient FHIR R4 batch using seed 42.
- [ ] Inspect generated FHIR Bundles manually.
- [ ] Inspect the required resource types used by the MVP.
- [ ] Implement the FHIR parser for the documented resource subset.
- [ ] Normalize records while preserving raw/source JSON where specified.
- [ ] Write the ingestion CLI.
- [ ] Validate referential integrity.
- [ ] Re-run ingestion from a clean state.
- [ ] Scale to 100 patients only after small-batch tests pass.

## Required checks
- [ ] Generated data is synthetic only.
- [ ] FHIR source identity is preserved.
- [ ] Patient/resource relationships resolve correctly.
- [ ] A patient timeline can be reconstructed from ingested data.
- [ ] Ingestion is reproducible from the command line.

## Exit criteria
- [ ] A fresh Synthea batch can be generated and ingested reproducibly.

**Phase 6 complete only when every item above is checked.**

---

# Phase 7 — Synthetic policies, case generator, and ground truth

## Tasks
- [ ] Implement one original synthetic medical-necessity policy definition for Lumbar Spine MRI.
- [ ] Implement one original synthetic medical-necessity policy definition for CT Chest with Contrast.
- [ ] Implement one original synthetic medical-necessity policy definition for Cervical Fusion with Disc Removal.
- [ ] Implement one original synthetic medical-necessity policy definition for Facet Joint Intervention.
- [ ] Implement one original synthetic medical-necessity policy definition for Radiation Therapy.
- [ ] Implement deterministic policy-rule schema.
- [ ] Implement scenario generators.
- [ ] Create generated/free-text synthetic notes only where needed for realistic cases.
- [ ] Create expected criterion statuses.
- [ ] Create expected evidence facts/passages.
- [ ] Create expected overall recommendations.
- [ ] Assign patient-level train/validation/test or development/evaluation splits as specified.
- [ ] Store generated cases and ground truth.
- [ ] Generate the dataset validation report.

## Required manual validation gate
- [ ] Manually inspect at least 5 Lumbar Spine MRI cases.
- [ ] Manually inspect at least 5 CT Chest with Contrast cases.
- [ ] Manually inspect at least 5 Cervical Fusion cases.
- [ ] Manually inspect at least 5 Facet Joint Intervention cases.
- [ ] Manually inspect at least 5 Radiation Therapy cases.
- [ ] Confirm each inspected case is internally coherent.
- [ ] Confirm each inspected case has correct ground truth.
- [ ] Confirm no proprietary payer policy text or real PHI is included.

## Exit criteria
- [ ] Ground-truth dataset is trustworthy enough to evaluate retrieval and AI analysis.

**DO NOT PROCEED TO AI QUALITY CLAIMS UNTIL THIS GATE PASSES.**

**Phase 7 complete only when every item above is checked.**

---

# Phase 8 — Embeddings and retrieval baselines

## Read first
- `backend/06-retrieval-and-grounding.md`

## Tasks
- [ ] Generate evidence passages from normalized clinical source data.
- [ ] Assign stable passage identifiers.
- [ ] Preserve source/patient/document metadata required for traceability.
- [ ] Configure the OpenAI embedding model through environment configuration.
- [ ] Generate embeddings for passages.
- [ ] Store embedding model/version metadata.
- [ ] Store embeddings in pgvector.
- [ ] Implement vector retrieval.
- [ ] Implement lexical retrieval baseline.
- [ ] Implement the retrieval evaluation harness for Recall@K and other documented metrics.
- [ ] Record lexical baseline results.
- [ ] Record vector baseline results.

## Required debugging checks
- [ ] Retrieval debug output shows the query.
- [ ] Retrieval debug output shows expected evidence IDs.
- [ ] Retrieval debug output shows returned passage IDs and ranks.
- [ ] Retrieved passages belong to the correct patient/case context.
- [ ] Exact source passages remain reconstructable.

## Exit criteria
- [ ] Vector and lexical retrieval baselines are measured rather than judged by appearance.
- [ ] Baseline metrics are stored separately for later comparison.

**Phase 8 complete only when every item above is checked.**

---

# Phase 9 — Hybrid retrieval

## Tasks
- [ ] Implement the documented RRF or selected hybrid retrieval strategy.
- [ ] Apply required metadata filtering.
- [ ] Tune K/merge parameters on validation data only.
- [ ] Compare lexical-only retrieval.
- [ ] Compare vector-only retrieval.
- [ ] Compare hybrid retrieval.
- [ ] Add reranking if specified by the retrieval architecture/configuration.
- [ ] Compare hybrid + reranking if implemented.
- [ ] Evaluate evidence recall.
- [ ] Evaluate reasonable precision/relevance.
- [ ] Record retrieval latency and relevant cost information.
- [ ] Choose the retrieval configuration based on measured results rather than preference.
- [ ] Freeze `retrieval_config_version` for the first AI pipeline.

## Exit criteria
- [ ] Baseline versus selected retrieval metrics are documented.
- [ ] Selected configuration has an explicit evidence-based rationale.

**Phase 9 complete only when every item above is checked.**

---

# Phase 10 — LangGraph AI analysis

## Read first
- `backend/05-ai-analysis-pipeline.md`

## Tasks
- [ ] Define Pydantic structured criterion-output schemas.
- [ ] Define LangGraph state.
- [ ] Implement case-loading node(s).
- [ ] Implement policy/criteria-loading node(s).
- [ ] Implement evidence-retrieval node(s).
- [ ] Implement criterion-assessment OpenAI adapter and prompt(s).
- [ ] Restrict criterion status to the documented enum values.
- [ ] Require evidence identifiers for grounded clinical claims.
- [ ] Require a short criterion rationale.
- [ ] Implement output validation.
- [ ] Implement grounding/citation validation.
- [ ] Implement deterministic overall recommendation aggregation.
- [ ] Ensure AI cannot recommend physician escalation.
- [ ] Implement immutable analysis persistence/versioning.
- [ ] Add unit tests using a mocked model/provider.
- [ ] Add integration tests.
- [ ] Run a small live OpenAI API smoke test.

## Safety/grounding gate
- [ ] No AI analysis is persisted if it references nonexistent evidence.
- [ ] No AI analysis is persisted if it references evidence belonging to the wrong patient/case.
- [ ] Unsupported clinical facts fail validation rather than being silently accepted.

## Exit criteria
- [ ] One complete case can run through analysis end to end with traceable evidence.
- [ ] Structured output and grounding tests pass.

**Phase 10 complete only when every item above is checked.**

---

# Phase 11 — Background jobs and retry semantics

## Tasks
- [ ] Implement `analysis_jobs` persistence.
- [ ] Implement the background worker command/process.
- [ ] Implement safe database locking/claiming for queued jobs.
- [ ] Implement attempt 1.
- [ ] Implement retry attempt 2 for recoverable failures.
- [ ] Implement retry attempt 3 for recoverable failures.
- [ ] Map exhausted/unrecoverable failures to `Analysis Failed`.
- [ ] Store technical error details in backend logs only.
- [ ] Store/expose a safe reviewer-facing failure message.
- [ ] Implement automatic analysis queuing when a new source-document version enters the data flow.
- [ ] Preserve prior AI analysis versions.
- [ ] Prevent reviewer-initiated manual reanalysis in the MVP.

## Required demonstrations
- [ ] Successful first-attempt analysis.
- [ ] Transient failure followed by successful retry.
- [ ] Three-attempt exhausted failure resulting in `Analysis Failed`.
- [ ] Failed case remains visible and can be opened read-only.
- [ ] Case is not claimable until initial analysis succeeds.

## Exit criteria
- [ ] Background analysis lifecycle is deterministic, observable, and tested.

**Phase 11 complete only when every item above is checked.**

---

# Phase 12 — Real backend integration into frontend

## Mandatory rule
**Do not modify UI behavior to fit the backend. Implement `Api*Service` adapters that satisfy the existing frontend service contracts.**

## Tasks
- [ ] Implement the centralized API client inside the documented services/api boundary.
- [ ] Implement authentication token/session mapping.
- [ ] Implement `ApiAuthService`.
- [ ] Implement `ApiCaseService`.
- [ ] Implement `ApiPatientService`.
- [ ] Implement `ApiReviewService`.
- [ ] Implement `ApiEvaluationService`.
- [ ] Map backend DTOs to frontend domain models inside service/adaptor boundaries.
- [ ] Swap service composition by environment/configuration.
- [ ] Keep mock mode available for frontend isolation and tests.
- [ ] Confirm no page/component/hook makes direct HTTP calls.

## Required end-to-end scenario
- [ ] Repeat the full Phase 3 reviewer-A scenario using the real backend.
- [ ] Repeat the reviewer-B read-only scenario using the real backend.
- [ ] Repeat the Analysis Failed scenario using the real backend.

## Exit criteria
- [ ] Same frontend behavior works with real backend services.
- [ ] UI components did not need backend-specific rewrites.

**Phase 12 complete only when every item above is checked.**

---

# Phase 13 — Evaluation system

## Read first
- `backend/07-evaluation-specification.md`

## Tasks
- [ ] Implement evaluation-run tables/services.
- [ ] Implement retrieval-quality metrics.
- [ ] Implement criterion-assessment metrics.
- [ ] Implement overall-recommendation metrics.
- [ ] Implement citation/grounding metrics.
- [ ] Implement missing-information detection metrics.
- [ ] Implement unsupported-claim metrics.
- [ ] Implement per-procedure breakdowns.
- [ ] Implement failure taxonomy capture.
- [ ] Run the frozen configuration on validation data.
- [ ] Inspect failures and classify them by root cause.
- [ ] Fix data, retrieval, or pipeline defects based on measured failure categories.
- [ ] Re-run validation after approved fixes.
- [ ] Freeze the final MVP configuration.
- [ ] Run the held-out test set only after tuning is complete.
- [ ] Store test metrics and failure examples.
- [ ] Wire AI Quality REST endpoints.
- [ ] Wire the read-only AI Quality frontend page to real evaluation data.

## Integrity rules
- [ ] Never rewrite held-out test ground truth to improve model numbers.
- [ ] Never tune against the final held-out test set.
- [ ] Never present synthetic evaluation as clinical validation.

## Exit criteria
- [ ] AI performance is supported by reproducible metrics and inspectable failures.
- [ ] AI Quality page reflects stored evaluation runs rather than fabricated dashboard numbers.

**Phase 13 complete only when every item above is checked.**

---

# Phase 14 — MVP acceptance verification

## Requirements verification
- [ ] Run every applicable acceptance requirement in `01-requirements-analysis.md`.
- [ ] Verify all five procedure types are represented and functional.
- [ ] Verify reviewer authentication works.
- [ ] Verify mixed shared queue works.
- [ ] Verify search and filtering work.
- [ ] Verify My Cases includes active and completed claimed cases.
- [ ] Verify claim-unassigned workflow works.
- [ ] Verify claimed cases remain visible read-only to other reviewers.
- [ ] Verify claimed cases cannot be released in MVP.
- [ ] Verify save-progress behavior works.
- [ ] Verify reviewer notes are immutable and attributed with author/time/status.
- [ ] Verify activity timeline records required events.
- [ ] Verify AI analyses are versioned and preserved.
- [ ] Verify new-document data flow creates a new AI analysis version.
- [ ] Verify no manual reviewer reanalysis action exists.
- [ ] Verify `Analysis Failed` transparency and read-only inspection work.
- [ ] Verify retry semantics work.
- [ ] Verify exact evidence passage citation behavior works.
- [ ] Verify broader patient timeline is available for independent human review.
- [ ] Verify criterion-level AI assessments include status, evidence, and grounded rationale.
- [ ] Verify no unsupported clinical claim is accepted without cited evidence.
- [ ] Verify no per-case confidence score is shown.
- [ ] Verify criterion override requires a reason.
- [ ] Verify overall AI recommendation is limited to the three documented states.
- [ ] Verify AI cannot recommend physician escalation.
- [ ] Verify human final decision options are exactly the documented MVP options.
- [ ] Verify Deny always requires rationale.
- [ ] Verify Escalate for Physician Review always requires rationale.
- [ ] Verify Approve requires rationale when overriding AI.
- [ ] Verify Request More Information requires missing-document/evidence details.
- [ ] Verify escalated cases become `Pending Physician Review`, read-only, and unresolved.
- [ ] Verify completed cases become permanently read-only in MVP.
- [ ] Verify AI Quality page is available read-only to reviewers.
- [ ] Verify no out-of-scope future features were accidentally implemented.

## Create `MVP_VERIFICATION_REPORT.md`
- [ ] Record verification date.
- [ ] Record Git commit/tag.
- [ ] Record environment details.
- [ ] Record automated test results.
- [ ] Record evaluation run ID.
- [ ] Record actual evaluation metrics.
- [ ] Record known limitations.
- [ ] Add screenshots/demo link if applicable.
- [ ] Include explicit statement that synthetic evaluation is not clinical validation.

## Final exit
- [ ] All required automated tests pass.
- [ ] All required business-rule tests pass.
- [ ] MVP acceptance requirements pass or documented blockers are explicitly resolved.
- [ ] Documentation matches implemented behavior.
- [ ] Repository contains no real PHI or proprietary payer policy text.
- [ ] Secrets are not committed.
- [ ] MVP baseline is tagged/released.
- [ ] Future-version features remain deferred.

# MVP COMPLETE

Do not add future features before the verified MVP baseline is tagged/released.

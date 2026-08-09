# 05 — End-to-End Workflows

This file defines product workflows and build workflows. Follow it instead of inventing missing transitions.

# Part A — Runtime product workflows

## A1. Synthetic data -> claimable case
1. Generate Synthea patient batch using fixed seed.
2. Export FHIR R4.
3. Ingestion pipeline validates each Bundle/resource.
4. Normalize supported resources into internal clinical records.
5. Create evidence passages and embeddings.
6. Case generator selects a patient/history compatible with one of five procedure scenarios.
7. Case generator creates synthetic authorization request.
8. Assign synthetic policy/version.
9. Generate/store ground truth independent of runtime AI output.
10. Create AuthorizationCase with `PENDING_ANALYSIS`.
11. Append `CASE_CREATED`.
12. Create AnalysisJob attempt 1, `QUEUED`.
13. status -> `ANALYZING` when worker starts.
14. AI workflow produces criterion assessments/evidence/recommendation.
15. Grounding validator verifies evidence references.
16. Persist immutable AIAnalysis version 1.
17. status -> `READY_FOR_REVIEW`.
18. Append `ANALYSIS_SUCCEEDED`.

## A2. Failed AI analysis
1. Worker encounters recoverable failure.
2. Persist technical error details in server log/reference.
3. Append retry event.
4. Retry up to 2 additional times (3 total attempts).
5. If a later attempt succeeds, continue normal path.
6. If attempt 3 fails, status -> `ANALYSIS_FAILED`.
7. Persist reviewer-safe message.
8. Case remains visible and openable read-only.
9. No reviewer retry action exists.

## A3. Reviewer login
1. Reviewer opens `/login`.
2. Enters pre-created email/password.
3. Frontend calls AuthService.
4. Real backend verifies hashed password.
5. Token returned.
6. Frontend stores token using selected simple client mechanism for MVP and attaches it through API service layer.
7. User enters Case Queue.

## A4. Claim case
1. Reviewer opens Ready case.
2. Selects Claim Case.
3. API atomically checks unassigned + ready.
4. If valid: assign current reviewer, status -> In Review, append activity.
5. If race lost: return conflict; UI refreshes to read-only claimed state.
6. Case cannot be released.

## A5. Review case
1. Owner sees current AI overall recommendation.
2. Owner reviews ordered criteria.
3. Each criterion shows AI status, rationale, citations.
4. Clicking citation opens exact passage viewer.
5. Reviewer may open full patient timeline for independent verification.
6. Reviewer may override criterion status; reason mandatory.
7. Reviewer may attach existing timeline evidence to criterion.
8. Reviewer may add immutable free-text note.
9. Reviewer may Save Progress and leave.
10. Other reviewers may inspect case read-only throughout.

## A6. Approve
1. Owner selects Approve.
2. If approval conflicts with AI/required override rule, rationale mandatory; otherwise optional.
3. Server validates.
4. Persist FinalReviewDecision.
5. status -> Completed.
6. append final-decision activity.
7. case becomes permanently read-only.

## A7. Deny
1. Owner selects Deny.
2. Rationale mandatory.
3. Server validates.
4. Persist decision.
5. status -> Completed.
6. terminal read-only.

## A8. Request More Information
1. Owner selects Request More Information.
2. Exact missing documentation/evidence text mandatory.
3. Persist decision/event.
4. status -> Needs More Information.
5. No reviewer upload button.
6. If backend data flow later ingests new document, create new source-data version and new analysis job/version.

## A9. New documentation -> new AI version
1. Backend ingestion receives synthetic new documentation associated with case patient.
2. Store clinical record/passages.
3. Increment source data version.
4. append `DOCUMENTATION_INGESTED`.
5. queue analysis for new source version.
6. prior AIAnalysis remains immutable.
7. when successful, current analysis points to new version.
8. UI exposes previous version history.

## A10. Escalate to Physician
1. Owner selects Escalate.
2. Rationale mandatory.
3. Persist decision/handoff event.
4. status -> Pending Physician Review.
5. No physician workflow exists in MVP.
6. case is read-only and unresolved.

# Part B — Engineering implementation workflow

## B1. Phase 0 — repository and docs
- create repository;
- copy entire documentation package;
- add `.gitignore`, `.env.example` placeholders only;
- coding agents must read `AGENTS.md`.

Exit: no application code required.

## B2. Phase 1 — frontend-only application
Use `frontend/` docs only plus core product/domain docs.
- scaffold Next.js/TypeScript/Tailwind/TanStack Query;
- create domain frontend types;
- define service interfaces;
- implement mock services with in-memory state;
- implement 3 fake reviewer identities;
- implement realistic case fixtures across five procedures/statuses;
- implement routes/screens;
- implement read/write rules in UI through service behavior;
- no direct backend calls;
- no persistence across browser refresh required.

Exit: all frontend acceptance tests pass with mock services.

## B3. Phase 2 — backend foundation
- create Python environment;
- scaffold FastAPI layered project;
- configure settings/env;
- install PostgreSQL + pgvector;
- create migrations/schema;
- seed reviewer accounts;
- implement auth;
- implement non-AI case/review APIs.

Exit: API contract tests pass for auth/case ownership/notes/final decision rules using seeded DB fixtures.

## B4. Phase 3 — synthetic clinical data pipeline
- install Synthea and Java requirement;
- generate tiny FHIR R4 batch first;
- build parser/normalizer;
- load clinical records;
- build synthetic policy definitions;
- build deterministic case + ground-truth generator;
- scale batch after validation.

Exit: one patient -> one valid case -> stored policy/ground truth reproducibly.

## B5. Phase 4 — retrieval
- create evidence passages;
- configure OpenAI embeddings;
- persist vectors in pgvector;
- implement lexical retrieval;
- implement vector retrieval;
- implement hybrid merge/rerank approach;
- create retrieval evaluation tests.

Exit: expected evidence for curated development cases appears within configured top-K at target recall.

## B6. Phase 5 — AI analysis graph
- define Pydantic structured outputs;
- implement LangGraph state and nodes;
- implement criterion assessment prompts;
- implement grounding validator;
- deterministic overall recommendation logic where possible;
- persist immutable analysis versions;
- background jobs + retries.

Exit: end-to-end case analysis works without UI and passes structured-output/grounding tests.

## B7. Phase 6 — frontend/backend integration
- implement `Api*Service` implementations only;
- switch dependency configuration from mocks to APIs;
- do not rewrite pages/components;
- resolve DTO mapping at service boundary.

Exit: frontend feature parity with mock version using real backend.

## B8. Phase 7 — evaluation
- generate evaluation dataset with ground truth;
- run full analysis;
- calculate required metrics;
- classify failures;
- expose read-only metrics endpoint;
- AI Quality page uses real metrics.

Exit: metrics reproducible from command/script and visible in UI.

## B9. Phase 8 — MVP verification
Run full scenario suite:
- successful analysis;
- failed analysis after retries;
- claim race;
- non-owner read-only;
- save/resume;
- immutable notes;
- criterion override;
- all four final decisions;
- new-document/new-analysis version;
- completed case read-only;
- AI Quality page.

No new features are added during verification.

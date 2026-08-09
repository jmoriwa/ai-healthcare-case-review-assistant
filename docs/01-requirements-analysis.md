# 01 — Requirements Analysis

## 1. Objective
Define unambiguous MVP requirements for the Healthcare Case Review Assistant. Every implementation must satisfy these requirements unless explicitly marked future scope.

## 2. Stakeholders
### Primary stakeholder
Utilization-management nurse / prior-authorization specialist.

### Secondary stakeholders represented indirectly
- physician reviewer (handoff only; no user account/workflow in MVP);
- hospital UM leadership (quality/transparency interest);
- engineering/project owner (evaluation and system reliability).

## 3. Functional requirements
### FR-AUTH
- **FR-AUTH-001** The backend SHALL support pre-created reviewer accounts.
- **FR-AUTH-002** Reviewer authentication SHALL use email/password.
- **FR-AUTH-003** Passwords SHALL be securely hashed in persistent storage.
- **FR-AUTH-004** Successful authentication SHALL issue a bearer access token or equivalent simple secure token accepted by protected REST endpoints.
- **FR-AUTH-005** The MVP SHALL NOT support registration, MFA, password reset, or SSO.

### FR-QUEUE
- **FR-QUEUE-001** The system SHALL show one shared queue containing cases across all five procedure types.
- **FR-QUEUE-002** All cases have equal priority in MVP; no urgency/priority field shall affect ordering.
- **FR-QUEUE-003** Reviewers SHALL be able to search by patient identifier/name surrogate and filter by procedure type and case status.
- **FR-QUEUE-004** Cases with successful initial AI analysis SHALL be claimable if unassigned.
- **FR-QUEUE-005** Cases in analysis or analysis-failed state SHALL NOT be claimable.
- **FR-QUEUE-006** Once claimed, a case SHALL NOT be released or reassigned in MVP.
- **FR-QUEUE-007** Claimed cases remain visible to all reviewers.
- **FR-QUEUE-008** Non-owner reviewers may open claimed cases read-only.

### FR-MYCASES
- **FR-MY-001** Each reviewer SHALL have a My Cases view.
- **FR-MY-002** My Cases SHALL show both active and completed cases owned by that reviewer.

### FR-CASE-STATUS
Canonical statuses are defined in `03-domain-model.md`. At minimum the system SHALL represent:
- Pending Analysis
- Analyzing
- Ready for Review
- Analysis Failed
- In Review
- Needs More Information
- Pending Physician Review
- Completed

### FR-CLAIM
- **FR-CLAIM-001** Claiming an eligible case SHALL atomically assign the case to the authenticated reviewer and move it to `In Review`.
- **FR-CLAIM-002** Two reviewers SHALL NOT successfully claim the same case.

### FR-ANALYSIS
- **FR-AI-001** AI analysis SHALL run asynchronously.
- **FR-AI-002** Recoverable analysis failures SHALL receive at most two retries after the initial attempt (three total attempts).
- **FR-AI-003** After all attempts fail, case status SHALL be `Analysis Failed`.
- **FR-AI-004** Failed cases SHALL remain visible and openable read-only.
- **FR-AI-005** Reviewer-facing error text SHALL be user-friendly and SHALL NOT expose stack traces/provider details.
- **FR-AI-006** Technical failure details SHALL be logged server-side.
- **FR-AI-007** A new document arriving through the backend data flow SHALL create a new analysis version automatically.
- **FR-AI-008** Reviewers SHALL NOT manually trigger re-analysis in MVP.
- **FR-AI-009** Reviewers SHALL NOT manually upload clinical documents in MVP.

### FR-CRITERIA
- **FR-CRIT-001** Every case SHALL reference one synthetic medical-necessity policy version.
- **FR-CRIT-002** The policy SHALL contain ordered criteria.
- **FR-CRIT-003** The AI SHALL assign each criterion exactly one status: `SUPPORTED`, `NOT_SUPPORTED`, `INSUFFICIENT_EVIDENCE`.
- **FR-CRIT-004** Each criterion assessment SHALL contain a short rationale.
- **FR-CRIT-005** Every factual clinical statement in the rationale SHALL be supported by at least one linked evidence passage.
- **FR-CRIT-006** Each evidence link SHALL resolve to an exact source passage/field that can be shown to the reviewer.
- **FR-CRIT-007** The assigned reviewer MAY override an AI criterion status.
- **FR-CRIT-008** A criterion override SHALL require a reason and SHALL be recorded in activity/audit history.
- **FR-CRIT-009** The assigned reviewer MAY attach additional evidence that already exists in the patient timeline to a criterion. New external evidence ingestion is out of scope.

### FR-OVERALL-AI
The AI overall recommendation SHALL be exactly one of:
- `CRITERIA_APPEAR_SATISFIED`
- `CRITERIA_APPEAR_NOT_SATISFIED`
- `ADDITIONAL_DOCUMENTATION_NEEDED`

The AI SHALL NOT recommend `Escalate for Physician Review`.

### FR-PATIENT-TIMELINE
- Default case review SHALL prioritize AI-selected evidence.
- Reviewer SHALL have an explicit action to view the broader patient timeline.
- Timeline SHALL be read-only.
- Citation interaction SHALL open/highlight the exact supporting passage or structured source field.

### FR-NOTES
- Assigned reviewer SHALL be able to add free-text notes.
- Saved notes SHALL be immutable in MVP.
- Notes SHALL be visible read-only to all reviewers.
- Every note SHALL record author, timestamp, and case status at creation.

### FR-SAVE
- Assigned reviewer SHALL be able to save an in-progress review and resume later.
- Real backend SHALL persist review draft state.
- Frontend mock implementation does not need refresh persistence.

### FR-FINAL-DECISION
Allowed human decisions:
1. `APPROVE`
2. `DENY`
3. `REQUEST_MORE_INFORMATION`
4. `ESCALATE_FOR_PHYSICIAN_REVIEW`

Rules:
- Approve: rationale optional unless any overall/criterion AI outcome is being overridden as part of completion.
- Deny: rationale mandatory.
- Request More Information: missing documentation/evidence description mandatory; resulting case status `Needs More Information`.
- Escalate: rationale mandatory; resulting case status `Pending Physician Review`.
- Pending Physician Review is read-only/unresolved in MVP.
- Completed cases are permanently read-only in MVP.

### FR-ACTIVITY
Activity timeline SHALL include at least:
- case created;
- analysis queued/started/succeeded/failed;
- case claimed;
- status changes;
- reviewer note added;
- AI recommendation/version generated;
- criterion override;
- reviewer decision submitted;
- overall AI disagreement/override;
- new documentation ingested.

### FR-EVALUATION
- Reviewer navigation SHALL include a read-only `AI Quality` page.
- Page SHALL expose aggregate quality metrics and representative failure examples.
- Reviewers SHALL NOT be able to change model/evaluation configuration.
- Required MVP evaluation dimensions are defined in `backend/07-evaluation-specification.md`.
- No uncalibrated per-case confidence score SHALL be displayed.

## 4. Data requirements
- Synthetic data only.
- Canonical raw clinical format: FHIR R4.
- Source generator: Synthea.
- Five procedure types represented.
- Synthetic policy text must be project-authored and clearly labeled non-clinical/demo.
- Ground truth must exist independently of model outputs.
- Generation must support reproducible seeds.
- If future training is performed, split at patient level to prevent leakage.

## 5. Non-functional requirements
### NFR-CODE
- Follow Clean Code principles.
- Strong typing at service/API/domain boundaries.
- High cohesion, low coupling.
- No direct frontend data-provider access outside services.

### NFR-ACCESSIBILITY
- Keyboard-operable primary workflow.
- Visible focus states.
- Semantic labels/forms/tables.
- WCAG-aware contrast and non-color-only status communication.

### NFR-PERFORMANCE
MVP local targets, not clinical SLAs:
- Queue read response target: < 1s excluding intentional frontend mock delay.
- Case detail target: < 1s for DB/API portion excluding analysis job.
- AI analysis may be asynchronous and longer-running; UI must never block on an open request.

### NFR-RELIABILITY
- Claim must be atomic.
- Immutable records must not be updated/deleted through reviewer APIs.
- Analysis jobs must be idempotent by `(case_id, source_version)`.

### NFR-SECURITY
- Secure password hashing.
- Bearer token auth.
- Authorization checks on every mutation.
- No secrets in source control.
- No stack traces exposed to UI.

### NFR-OBSERVABILITY
- Structured backend logs.
- Correlation ID / job ID for analysis failures.
- Capture model name/version, prompt version, retrieval configuration, and source version in each analysis record.

## 6. Constraints
- Single developer plus coding agents.
- No Docker requirement for MVP.
- No cloud requirement for MVP.
- OpenAI API is the only required paid external runtime service.
- PostgreSQL/pgvector, FastAPI, LangGraph, Synthea are local/free open-source components.

## 7. Out of scope
Notifications, priority tiers, automatic assignment, case release/reassignment, reviewer uploads, admin role, physician user workflow, SSO/MFA, self-registration, password reset, production EHR/payer integrations, production compliance certification, Kubernetes, cloud deployment, and required custom model training.

## 8. Acceptance criteria — MVP
The MVP SHALL be considered complete only when:
1. three pre-created reviewers can authenticate;
2. mixed queue shows all five procedure categories;
3. searching/filtering works;
4. only analyzed/ready cases can be claimed;
5. concurrent claim race is safely handled;
6. owner can edit, non-owner is read-only;
7. exact evidence passages can be opened from criteria;
8. patient timeline is available as secondary verification;
9. review progress persists in real backend;
10. notes are immutable and attributed;
11. AI analysis versions are immutable and comparable;
12. failed analysis remains visible after three total attempts;
13. final decision validation rules are enforced server-side;
14. completed/Pending Physician Review cases are read-only;
15. AI Quality page displays evaluation metrics from backend or realistic frontend mocks;
16. evaluation suite can score ground-truth synthetic cases;
17. no real patient data or proprietary payer policy text is present.

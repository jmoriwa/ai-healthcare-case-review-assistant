# Backend 01 — Backend Specification

## 1. Objective
Implement the persistent, auditable system of record and AI-analysis runtime for the Healthcare Case Review Assistant MVP.

## 2. Stack
- Python
- FastAPI
- Pydantic
- PostgreSQL
- pgvector
- LangGraph
- OpenAI API
- SQLAlchemy + Alembic recommended for ORM/migrations (or an equivalent explicit PostgreSQL mapping stack chosen once and used consistently)

No GraphQL. Docker not required. Celery/Redis not required.

## 3. Layering
```text
app/
  main.py
  api/
    dependencies.py
    routers/
  application/
    auth/
    cases/
    reviews/
    evaluation/
  domain/
    entities/
    enums.py
    errors.py
    policies.py
  infrastructure/
    db/
      models/
      repositories/
      migrations/
    auth/
    fhir/
    openai/
    retrieval/
  ai/
    graph.py
    state.py
    nodes/
    prompts/
    schemas/
    validators/
  jobs/
    worker.py
    service.py
  evaluation/
  settings/
  logging/
```

## 4. API conventions
- prefix `/api/v1`;
- JSON except OAuth2 login form if FastAPI OAuth2 password flow is used;
- UUID path IDs;
- ISO 8601 UTC timestamps;
- canonical enum wire values from domain model;
- consistent error envelope;
- OpenAPI docs enabled in development.

Recommended error envelope:
```json
{
  "error": {
    "code": "CASE_NOT_CLAIMABLE",
    "message": "This case is not available to claim.",
    "details": null,
    "request_id": "..."
  }
}
```

Never expose stack traces.

## 5. Authentication
Use secure password hashing and signed bearer JWT following FastAPI's secure tutorial pattern: https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/

MVP behavior:
- reviewer accounts seeded via migration/seed command;
- login only;
- no registration/password reset;
- inactive reviewer denied.

## 6. Authorization
Every write use case checks authenticated reviewer and case state.
Rules are backend-enforced even if UI hides controls.

Examples:
- claim: any active reviewer if case Ready + unassigned;
- add note/save/override/final decision: assigned reviewer only and state permits edit;
- reads: any authenticated reviewer;
- completed/pending-physician writes: forbidden.

## 7. Case claiming concurrency
Claim must be atomic. Use a DB transaction with conditional update or row lock.
Expected behavior:
```sql
UPDATE authorization_cases
SET assigned_reviewer_id = :reviewer_id, status = 'IN_REVIEW'
WHERE id = :case_id
  AND assigned_reviewer_id IS NULL
  AND status = 'READY_FOR_REVIEW';
```
Require affected-row count = 1; otherwise return conflict/not-claimable. Append activity in same transaction.

## 8. Review persistence
### Mutable while in review
- review draft fields;
- current owner working selections if modeled as replaceable draft.

### Append-only
- reviewer notes;
- criterion override events (if correcting an earlier override, append a newer override rather than edit historical record);
- reviewer evidence links if audit semantics require append-only;
- activity events;
- AI analysis versions;
- final review decisions.

## 9. Final decision validation
Central application/domain validator.

Pseudo-rules:
```text
if DENY and rationale blank -> invalid
if ESCALATE and rationale blank -> invalid
if REQUEST_MORE_INFORMATION and missingDocumentation blank -> invalid
if APPROVE and approvalIsAIOverride and rationale blank -> invalid
```

Submit operation must be transactionally safe and idempotency-aware. Once terminal, duplicate submissions return conflict/immutable state rather than creating extra final decisions.

## 10. Background analysis job
Use DB-backed jobs.

### Worker operation
1. fetch/lock oldest queued job;
2. mark Running/startedAt;
3. update case Analyzing;
4. execute graph;
5. on success persist analysis in transaction + set appropriate status;
6. on retryable exception: if attempt <3 create/queue next attempt (or reset same logical job with incremented attempt according to chosen schema) and log retry;
7. on final failure: mark final failed + case Analysis Failed.

One worker is sufficient for MVP, but locking must avoid duplicate processing.

## 11. Analysis idempotency
Logical unique key: `(case_id, source_data_version, analysis_pipeline_version)` or simpler `(case_id, source_data_version)` for MVP. Reprocessing identical source version must not create arbitrary duplicate current analyses unless explicitly versioned for a new pipeline experiment.

## 12. FHIR ingestion
Support only required resource subset. Raw FHIR JSON must remain available for traceability, but UI/search uses normalized records/passages.

Validate:
- resourceType;
- patient reference;
- resource id;
- relevant date/time;
- extractable text/structured fields.

Unknown resources can be ignored with structured log, not crash whole bundle.

## 13. Retrieval service
Expose application/AI-facing function conceptually:
```python
retrieve_evidence(
    patient_id,
    criterion,
    source_data_version,
    top_k
) -> list[EvidenceCandidate]
```
Must enforce patient and source-version filtering before ranking.

## 14. OpenAI adapter
Centralize provider calls. Domain and graph nodes should depend on interfaces/adapter functions, not SDK client construction.

Store for every analysis:
- configured model identifier;
- prompt version;
- structured output schema version;
- retrieval config version.

## 15. Structured outputs
Use Pydantic models and OpenAI structured-output capability when supported by configured model. Official guide: https://developers.openai.com/api/docs/guides/structured-outputs

Never parse critical status from arbitrary prose when structured output is available.

## 16. Logging
Structured logs with:
- request ID;
- case ID where relevant;
- job ID;
- analysis ID;
- event/action;
- duration;
- retry attempt;
- exception class for technical logs.

Do not log secrets or entire raw clinical bundles by default.

## 17. Commands/scripts
Repository should expose documented commands/scripts for:
- run API;
- run worker;
- migrate DB;
- seed reviewers;
- ingest Synthea batch;
- generate cases;
- backfill embeddings;
- run evaluation suite.

Exact tool may be Makefile/Taskfile/Python CLI; keep cross-platform usability in mind for Windows.

## 18. Backend definition of done
- schema/migrations reproducible;
- seeded login works;
- APIs satisfy contract;
- claim race safe;
- audit immutability enforced;
- synthetic FHIR ingestion works;
- evidence retrieval works;
- background analysis and retries work;
- versioned AI output persisted;
- evaluation runner produces metrics;
- all tests pass.

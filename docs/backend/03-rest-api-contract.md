# Backend 03 — REST API Contract

Base: `/api/v1`
Authentication: Bearer token for all endpoints except login/health.

## 1. Health
### GET `/health`
200:
```json
{"status":"ok"}
```
No secret/provider detail.

## 2. Authentication
### POST `/auth/token`
If using OAuth2PasswordRequestForm: form fields `username` (email) and `password`.
200:
```json
{
  "access_token":"<token>",
  "token_type":"bearer",
  "reviewer": {
    "id":"uuid",
    "email":"avery.reviewer@example.test",
    "displayName":"Avery Johnson"
  }
}
```
401 generic invalid credentials.

### GET `/auth/me`
200 reviewer DTO.

## 3. Cases
### GET `/cases`
Query:
- `search` optional
- `procedure_type` optional
- `status` optional

200 array or simple page object. Choose one and keep frontend mapper consistent. Recommended:
```json
{"items":[...],"total":24}
```

### GET `/cases/mine`
Same filters, current authenticated reviewer ownership.

### GET `/cases/{case_id}`
Returns case detail including policy summary, current AI analysis summary, assignment and final decision summary.
404 if absent.

### POST `/cases/{case_id}/claim`
No body.
200 updated case.
409 if not claimable or race lost.

### GET `/cases/{case_id}/activity`
Chronological list.

### GET `/cases/{case_id}/analysis-versions`
List immutable version summaries newest first.

### GET `/cases/{case_id}/analysis-versions/{analysis_id}`
Full AI analysis including criteria/evidence refs.

## 4. Patient/evidence
### GET `/cases/{case_id}/timeline`
Returns timeline only for case patient.

### GET `/cases/{case_id}/evidence/{evidence_id}`
Verifies evidence belongs to same patient/source context accessible through case.
Returns exact passage/context.

## 5. Review state
### GET `/cases/{case_id}/review`
Current draft, overrides, reviewer evidence links, notes relevant to current owner/context.
Read available to all reviewers; edit permission derived separately.

### PUT `/cases/{case_id}/review/progress`
Owner only.
Body:
```json
{
  "draftFinalDecision": null,
  "draftFinalRationale": "optional",
  "draftMissingDocumentation": null
}
```
200 review state.
403 non-owner/read-only.
409 terminal/wrong state.

### POST `/cases/{case_id}/notes`
Owner only while editable.
```json
{"body":"Reviewer note text"}
```
201 immutable note.
422 blank.

### POST `/cases/{case_id}/criterion-overrides`
Owner only.
```json
{
  "analysisId":"uuid",
  "criterionId":"uuid",
  "reviewerStatus":"SUPPORTED",
  "reason":"Relevant evidence exists in the timeline..."
}
```
201 override.
422 reason blank/invalid status.

### POST `/cases/{case_id}/reviewer-evidence`
Owner only.
```json
{"criterionId":"uuid","evidenceId":"uuid"}
```
201 link.
Validation verifies evidence belongs to case patient/source.

### POST `/cases/{case_id}/decisions`
Owner only.
```json
{
  "decision":"DENY",
  "rationale":"Required synthetic criterion remains unsupported.",
  "missingDocumentation":null
}
```

Validation:
- Deny rationale required;
- Escalate rationale required;
- RequestMoreInfo missingDocumentation required;
- Approve rationale if overriding AI per application rule.

Response 201 updated case/final decision.
409 terminal or incompatible state.

## 6. AI Quality
### GET `/ai-quality/overview`
200:
```json
{
  "evaluationRunId":"uuid",
  "datasetSplit":"TEST",
  "caseCount":250,
  "metrics": {
    "overallRecommendationAccuracy":0.91,
    "criterionAccuracy":0.93,
    "evidenceRecall":0.90,
    "citationAccuracy":0.97,
    "missingInformationDetection":0.92,
    "unsupportedClaimRate":0.02,
    "reviewerOverrideRate":0.08
  },
  "byProcedure":[...]
}
```
Actual metrics only; no fabricated production claims.

### GET `/ai-quality/failures`
Optional query: `limit`, `procedure_type`, `category`.
Returns representative evaluation failures.

## 7. Internal/developer endpoints
Prefer CLI/scripts instead of public endpoints for ingestion/generation/evaluation. If internal endpoints are created, do not expose them in normal reviewer navigation and protect them appropriately in development.

## 8. Error codes
Suggested stable codes:
- `INVALID_CREDENTIALS`
- `CASE_NOT_FOUND`
- `CASE_NOT_CLAIMABLE`
- `CASE_READ_ONLY`
- `CASE_OWNED_BY_ANOTHER_REVIEWER`
- `INVALID_DECISION`
- `RATIONALE_REQUIRED`
- `MISSING_DOCUMENTATION_REQUIRED`
- `INVALID_CRITERION_OVERRIDE`
- `EVIDENCE_NOT_IN_CASE`
- `ANALYSIS_NOT_FOUND`
- `SERVICE_UNAVAILABLE`

## 9. HTTP semantics
- 200 reads/updates where appropriate;
- 201 append/create record;
- 401 unauthenticated;
- 403 authenticated but not permitted;
- 404 not found;
- 409 state/concurrency conflict;
- 422 validation;
- 500 generic internal error with request ID.

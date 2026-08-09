# 03 — Canonical Domain Model

## 1. Naming rule
These names are canonical. Agents must not create synonyms for the same domain concept without updating this document.

## 2. Enums
### ProcedureType
- `LUMBAR_SPINE_MRI`
- `CT_CHEST_WITH_CONTRAST`
- `CERVICAL_FUSION_WITH_DISC_REMOVAL`
- `FACET_JOINT_INTERVENTION`
- `RADIATION_THERAPY`

### CaseStatus
- `PENDING_ANALYSIS`
- `ANALYZING`
- `READY_FOR_REVIEW`
- `ANALYSIS_FAILED`
- `IN_REVIEW`
- `NEEDS_MORE_INFORMATION`
- `PENDING_PHYSICIAN_REVIEW`
- `COMPLETED`

### CriterionStatus
- `SUPPORTED`
- `NOT_SUPPORTED`
- `INSUFFICIENT_EVIDENCE`

### AIRecommendation
- `CRITERIA_APPEAR_SATISFIED`
- `CRITERIA_APPEAR_NOT_SATISFIED`
- `ADDITIONAL_DOCUMENTATION_NEEDED`

### ReviewerDecision
- `APPROVE`
- `DENY`
- `REQUEST_MORE_INFORMATION`
- `ESCALATE_FOR_PHYSICIAN_REVIEW`

### AnalysisJobStatus
- `QUEUED`
- `RUNNING`
- `SUCCEEDED`
- `FAILED_RETRYABLE`
- `FAILED_FINAL`

### ActivityEventType
At minimum:
- `CASE_CREATED`
- `DOCUMENTATION_INGESTED`
- `ANALYSIS_QUEUED`
- `ANALYSIS_STARTED`
- `ANALYSIS_RETRY`
- `ANALYSIS_SUCCEEDED`
- `ANALYSIS_FAILED`
- `CASE_CLAIMED`
- `CASE_STATUS_CHANGED`
- `NOTE_ADDED`
- `CRITERION_OVERRIDDEN`
- `REVIEW_PROGRESS_SAVED`
- `FINAL_DECISION_SUBMITTED`
- `AI_RECOMMENDATION_OVERRIDDEN`

## 3. Core entities
### Reviewer
- id: UUID
- email: unique normalized email
- displayName
- passwordHash (backend only)
- isActive
- createdAt

No role enum required beyond reviewer in MVP.

### Patient
Normalized project representation of a synthetic FHIR patient.
- id: UUID internal
- fhirPatientId
- displayName
- birthDate
- sex/gender field as available from synthetic FHIR
- sourceGenerationSeed/batchId

### ClinicalRecord
Normalized searchable unit representing a FHIR resource or note-like document.
- id
- patientId
- fhirResourceType
- fhirResourceId
- encounterId optional
- occurredAt/effectiveAt
- recordLabel
- normalizedText
- rawFhirJson reference/storage
- sourceVersion

### EvidencePassage
Small immutable retrieval unit.
- id
- clinicalRecordId
- patientId
- text
- startOffset/endOffset if applicable
- structuredFieldPath optional
- occurredAt
- metadata
- embedding vector infrastructure field

### MedicalPolicy
- id
- procedureType
- name
- version
- effectiveDate synthetic
- syntheticDisclaimer
- isActive

### PolicyCriterion
- id
- policyId
- code (stable within policy version)
- ordinal
- title
- description
- ruleDefinition machine-readable JSON

### AuthorizationCase
- id
- patientId
- procedureType
- policyId
- sourceDataVersion
- status
- assignedReviewerId nullable
- createdAt
- updatedAt

### AnalysisJob
- id
- caseId
- sourceDataVersion
- status
- attemptNumber (1..3)
- queuedAt
- startedAt nullable
- finishedAt nullable
- publicFailureCode/message nullable
- technicalErrorReference nullable

### AIAnalysis
Immutable version.
- id
- caseId
- versionNumber
- sourceDataVersion
- modelIdentifier
- promptVersion
- retrievalConfigVersion
- overallRecommendation
- overallRationale
- createdAt

### CriterionAssessment
Immutable child of AIAnalysis.
- id
- aiAnalysisId
- criterionId
- status
- rationale

### AssessmentEvidence
- criterionAssessmentId
- evidencePassageId
- evidenceRole/supportType optional
- rank/order

### ReviewDraft
Current mutable owner work state while case is editable.
- caseId unique
- reviewerId
- draftFinalDecision nullable
- draftFinalRationale nullable
- updatedAt

### CriterionOverride
Append-only reviewer correction relative to a particular AI analysis/criterion.
- id
- caseId
- aiAnalysisId
- criterionId
- reviewerId
- originalAIStatus
- reviewerStatus
- reason
- createdAt

### ReviewerEvidenceLink
Optional reviewer attachment of existing timeline evidence.
- id
- caseId
- criterionId
- evidencePassageId/clinicalRecordId
- reviewerId
- createdAt

### ReviewerNote
Immutable.
- id
- caseId
- reviewerId
- caseStatusAtCreation
- body
- createdAt

### FinalReviewDecision
Immutable after submission.
- id
- caseId
- reviewerId
- decision
- rationale nullable by validation rules
- missingDocumentation nullable except required for Request More Information
- aiRecommendationAtDecision
- createdAt

### ActivityEvent
Append-only.
- id
- caseId
- eventType
- actorType
- actorReviewerId nullable
- metadata JSON
- createdAt

### EvaluationCaseGroundTruth
- caseId
- expectedOverallRecommendation
- expectedCriterionStatuses map/list
- expectedEvidencePassageIds or evidence facts
- expectedMissingDocumentation labels
- datasetSplit (`TRAIN`/`VALIDATION`/`TEST` reserved even if MVP uses evaluation only)

## 4. Invariants
1. `assignedReviewerId` may transition from null to one reviewer exactly once in MVP.
2. `COMPLETED` and `PENDING_PHYSICIAN_REVIEW` are terminal/read-only.
3. `READY_FOR_REVIEW` requires a successful current AI analysis.
4. An Analysis Failed case has no claim operation.
5. AIAnalysis rows are never updated after creation.
6. ReviewerNote rows are never updated/deleted through MVP reviewer workflows.
7. ActivityEvent rows are append-only.
8. Final decision rules are validated server-side regardless of frontend validation.
9. An AI rationale cannot be persisted unless evidence references pass grounding validation rules defined in backend AI docs.
10. All evidence linked to a case must belong to that case's patient/source version.

## 5. Read/write authorization summary
- Unassigned ready case: all authenticated reviewers read; any one may atomically claim.
- Claimed/in-review: assigned reviewer writes; others read.
- Failed/pending-analysis: all reviewers read; no reviewer writes.
- Completed/pending-physician: all reviewers read; no reviewer writes.

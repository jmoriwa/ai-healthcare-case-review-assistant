# Frontend 04 — Services Layer Contract

This contract is the critical seam between frontend-first development and real backend integration.

## 1. General rules
- All methods return Promises.
- All IDs are strings in frontend domain.
- Date/time values returned to UI models are ISO 8601 strings or converted consistently at service boundary.
- Services enforce domain-appropriate errors.
- UI never accesses mock fixtures directly.

## 2. Shared types
Conceptual TypeScript shapes (names are normative; exact interface syntax may vary without changing semantics):

```ts
type CaseId = string;
type ReviewerId = string;
type CriterionId = string;
type EvidenceId = string;

interface PageResult<T> {
  items: T[];
  total: number;
}
```
MVP may load all mock rows without pagination, but service signatures should support `limit/offset` or page structure if chosen consistently. Do not implement complex pagination unless needed.

## 3. AuthService
```ts
interface AuthService {
  login(input: { email: string; password: string }): Promise<AuthSession>;
  logout(): Promise<void>;
  getCurrentReviewer(): Promise<Reviewer | null>;
}
```
`AuthSession` contains current Reviewer and optional token string for API implementation. Components must not parse token claims for business logic.

## 4. CaseService
```ts
interface CaseService {
  listCases(filters: CaseFilters): Promise<CaseSummary[]>;
  listMyCases(filters: CaseFilters): Promise<CaseSummary[]>;
  getCase(caseId: CaseId): Promise<CaseDetail>;
  claimCase(caseId: CaseId): Promise<CaseDetail>;
  getAnalysisVersions(caseId: CaseId): Promise<AIAnalysisSummary[]>;
  getAnalysisVersion(caseId: CaseId, analysisId: string): Promise<AIAnalysisDetail>;
  getActivity(caseId: CaseId): Promise<ActivityEvent[]>;
}
```

### CaseFilters
- `search?: string`
- `procedureType?: ProcedureType | 'ALL'`
- `status?: CaseStatus | 'ALL'`

## 5. PatientService
```ts
interface PatientService {
  getTimeline(caseId: CaseId): Promise<PatientTimelineItem[]>;
  getEvidencePassage(caseId: CaseId, evidenceId: EvidenceId): Promise<EvidencePassageDetail>;
}
```
Timeline is accessed by case to avoid UI accidentally requesting arbitrary patients.

## 6. ReviewService
```ts
interface ReviewService {
  getReviewState(caseId: CaseId): Promise<ReviewState>;
  saveProgress(caseId: CaseId, input: SaveReviewProgressInput): Promise<ReviewState>;
  addNote(caseId: CaseId, input: { body: string }): Promise<ReviewerNote>;
  overrideCriterion(caseId: CaseId, input: CriterionOverrideInput): Promise<ReviewState>;
  attachExistingEvidence(caseId: CaseId, input: AttachEvidenceInput): Promise<ReviewState>;
  submitFinalDecision(caseId: CaseId, input: FinalDecisionInput): Promise<CaseDetail>;
}
```

### CriterionOverrideInput
- `criterionId`
- `analysisId`
- `status`
- `reason` required

### AttachEvidenceInput
- `criterionId`
- `evidenceId`

### FinalDecisionInput
- `decision`
- `rationale?: string`
- `missingDocumentation?: string`

Service must validate according to product rules and return `ValidationError` for invalid input.

## 7. EvaluationService
```ts
interface EvaluationService {
  getQualityOverview(): Promise<AIQualityOverview>;
  getFailureExamples(): Promise<AIQualityFailureExample[]>;
}
```
May be combined into one call if implementation keeps domain shape clean.

## 8. Domain shapes required by screens
### CaseSummary
- id
- patientDisplayName
- procedureType
- status
- assignedReviewer nullable
- createdAt
- updatedAt

### CaseDetail
- summary fields
- requestedService
- policy summary
- currentAnalysis nullable
- ownerPermissions
- finalDecision nullable

### AIAnalysisDetail
- id
- versionNumber
- generatedAt
- overallRecommendation
- overallRationale
- criteria: CriterionAssessment[]

### CriterionAssessment
- criterionId
- ordinal
- title
- description
- aiStatus
- aiRationale
- evidenceRefs
- reviewerOverride nullable
- reviewerAddedEvidence

### EvidenceReference
- evidenceId
- label
- date nullable
- previewText

### EvidencePassageDetail
- id
- sourceType
- sourceLabel
- sourceRecordId
- date nullable
- fullContext
- highlightedText OR highlight offsets/structuredFieldPath sufficient for UI highlighting

### ReviewState
- caseId
- reviewerId
- criterionOverrides
- reviewerEvidenceLinks
- notes
- draftFinalDecision nullable
- draftFinalRationale nullable
- updatedAt

### ActivityEvent
- id
- type
- actorLabel
- occurredAt
- description

## 9. Error mapping contract
Mock and API implementations must map equivalent situations:
- invalid credentials -> AuthenticationError;
- case absent -> NotFoundError;
- claim race -> ConflictError;
- non-owner mutation -> ForbiddenError;
- invalid final decision -> ValidationError;
- transient mock/API failure -> ServiceUnavailableError.

## 10. Replacement test
The frontend services architecture is accepted only if switching from mocks to API implementations requires changing service composition/configuration and DTO mappers, **not page/component business logic**.

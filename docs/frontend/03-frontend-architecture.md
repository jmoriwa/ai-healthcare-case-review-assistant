# Frontend 03 — Frontend Architecture

## 1. Folder structure
Recommended exact structure:
```text
src/
  app/
    (auth)/
      login/page.tsx
    (protected)/
      layout.tsx
      queue/page.tsx
      my-cases/page.tsx
      cases/[caseId]/page.tsx
      ai-quality/page.tsx
    providers.tsx
  components/
    layout/
    cases/
    review/
    evidence/
    timeline/
    quality/
    common/
  domain/
    enums.ts
    models.ts
    validators.ts
    permissions.ts
  hooks/
    auth/
    cases/
    reviews/
    patients/
    evaluation/
  services/
    contracts/
      AuthService.ts
      CaseService.ts
      ReviewService.ts
      PatientService.ts
      EvaluationService.ts
    mock/
      MockAuthService.ts
      MockCaseService.ts
      MockReviewService.ts
      MockPatientService.ts
      MockEvaluationService.ts
      mockStore.ts
    api/                  # added during backend integration
      ApiAuthService.ts
      ApiCaseService.ts
      ApiReviewService.ts
      ApiPatientService.ts
      ApiEvaluationService.ts
    index.ts              # dependency selection/composition
  mocks/
    fixtures/
  query/
    keys.ts
    client.ts
  lib/
    dates.ts
    formatting.ts
  test/
```

## 2. Dependency direction
```text
Pages/Components
      ↓
Hooks + domain validators
      ↓
Service contracts
      ↓
Mock implementation OR API implementation
```
Domain types must not import service implementations.

## 3. Service composition
`services/index.ts` exposes configured service instances. Frontend phase selects mocks. Later environment/config selects API implementations. Components do not import mock/api classes.

Example conceptual API:
```ts
export const services = {
  auth: new MockAuthService(store),
  cases: new MockCaseService(store),
  reviews: new MockReviewService(store),
  patients: new MockPatientService(store),
  evaluation: new MockEvaluationService(store),
};
```
Later only composition changes.

## 4. Domain models vs transport DTOs
Frontend domain models are stable UI/business concepts. `Api*Service` is responsible for mapping JSON DTOs into those models if naming/format differs.

Do not allow backend snake_case details to leak throughout components.

## 5. Local UI state
Use `useState` for ephemeral display state:
- open evidence panel;
- active tab;
- local filter controls before query update;
- confirmation dialog state.

Use `useReducer` for a genuinely multi-step local form if helpful.
Do not create global Context for server data already handled by TanStack Query.

## 6. Server/mock state
TanStack Query handles asynchronous state even when source is mock service Promise. This ensures front-end behavior matches later API behavior.

## 7. Permission helpers
Centralize helpers such as:
```text
canClaimCase(case, reviewer)
canEditCase(case, reviewer)
isCaseReadOnly(case, reviewer)
requiresFinalRationale(decision, aiRecommendation, reviewState)
```
UI uses them for presentation, but service/backend must independently enforce rules.

## 8. Validation helpers
Centralized domain validators return structured errors. No duplicate final-decision rules in multiple forms.

## 9. Mock store
One in-memory mutable store owned by mock service layer. UI never imports it.
Store may hold:
- current reviewer;
- reviewers;
- cases;
- timelines;
- notes;
- activity;
- quality metrics.

Refresh resets store intentionally.

## 10. Error types
Define frontend service errors:
- `AuthenticationError`
- `NotFoundError`
- `ConflictError`
- `ForbiddenError`
- `ValidationError`
- `ServiceUnavailableError`

Mock services should throw same categories that API services will map from HTTP responses.

## 11. Testing strategy
### Unit
- permission helpers;
- validation helpers;
- formatting/mappers.

### Service contract behavior
Run same behavior suite against mocks now and API services later where possible.

### Component
- case owner vs non-owner;
- decision validation;
- immutable note rendering;
- evidence panel opening exact passage;
- analysis failed screen.

### Browser/e2e optional but recommended
One full mock happy path and one conflict/read-only path.

## 12. Clean Code rules
- prefer one component responsibility;
- split visual card from mutation orchestration when complexity grows;
- avoid >3-level prop drilling by colocating composition or narrow Context only when justified;
- no giant `CasePage.tsx` with all logic;
- do not abstract every button/input; build shared components only for repeated semantics.

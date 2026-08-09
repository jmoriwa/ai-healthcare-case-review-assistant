# Frontend 01 — Build Specification

## 1. Objective
Build a complete mock-backed reviewer application before any real backend exists. The frontend must exercise the entire MVP workflow while strictly isolating data access behind service interfaces.

## 2. Stack
- Next.js App Router
- React
- TypeScript strict mode
- Tailwind CSS
- TanStack Query
- React built-in state (`useState`, `useReducer`, Context only where justified)

No Zustand, Redux, GraphQL, direct API clients in components, or browser persistence requirement.

## 3. Required routes
```text
/login
/queue
/my-cases
/cases/[caseId]
/ai-quality
```
Optional internal/utility route only if needed for development, not visible in navigation.

## 4. Auth behavior in frontend phase
Use `MockAuthService` with 3 fake reviewers. Login accepts mock credentials defined in fixtures. Auth state only needs to survive normal client-side navigation; refresh persistence is not required.

Unauthenticated access to protected routes redirects to `/login`.

## 5. Required pages
### Login
- application identity/wordmark text;
- email;
- password;
- sign in;
- mock credentials helper may be shown in dev/demo UI;
- invalid credentials state.

### Shared Case Queue
- search;
- procedure filter;
- status filter;
- data table;
- empty/filter-empty states;
- realistic loading and error states;
- links to case detail.

### My Cases
Same table language, scoped to current reviewer ownership, including active and completed.

### Case Detail
Must support all status modes:
- Pending Analysis — read-only processing state;
- Analyzing — read-only;
- Ready — read-only until Claim Case;
- Analysis Failed — read-only failure view;
- In Review owner — full editable review workflow;
- In Review non-owner — read-only with ownership banner;
- Needs More Information — owner status/context with no upload control;
- Pending Physician Review — read-only terminal handoff;
- Completed — read-only final record.

### AI Quality
Read-only metrics and representative failures.

## 6. Case detail required sections
1. case header;
2. requested procedure and synthetic policy identity;
3. current AI recommendation;
4. criterion-by-criterion cards;
5. evidence passage interaction;
6. patient timeline secondary view;
7. reviewer notes;
8. activity timeline;
9. AI analysis version history;
10. owner review controls / final decision panel when editable.

## 7. Data access rule
All route/page/component data must come from hooks that call service interfaces. Example:
```text
CaseTable -> useCases() -> CaseService.listCases()
CasePage -> useCase(id) -> CaseService.getCase()
ClaimButton -> useClaimCase() -> CaseService.claimCase()
```

Prohibited:
```ts
fetch('/api/cases')
import { cases } from '@/mocks/cases'
```
inside UI components/pages/hooks.

## 8. Query keys
Use stable factories, e.g.:
```text
['auth','current']
['cases', filters]
['cases','mine', reviewerId, filters]
['case', caseId]
['case', caseId, 'timeline']
['case', caseId, 'activity']
['ai-quality']
```
Do not scatter raw query-key arrays throughout components; centralize factories.

## 9. Mutations
Required frontend mutations:
- login/logout;
- claim case;
- save progress;
- add note;
- override criterion;
- attach existing evidence to criterion;
- submit final decision.

Mutation success should invalidate/update relevant queries through TanStack Query, not manually coordinate dozens of component states.

## 10. Loading/error behavior
Mock services intentionally delay responses. Every async screen must have:
- loading skeleton/spinner appropriate to density;
- recoverable error message;
- retry button for frontend read failure where sensible;
- no technical exception dumps.

Analysis Failed is a **domain status**, not the same as a frontend network error.

## 11. Ownership behavior
Frontend must communicate permission state visually:
- owner: editable controls shown;
- non-owner: banner `Claimed by <name>. You have read-only access.`;
- terminal: `This case is closed and read-only.`;
- failed: `AI analysis could not be completed. This case is not available for review.`

Do not rely on hiding buttons alone; service layer mock must also reject unauthorized mutations.

## 12. Form validation
Mirror backend rules:
- override reason required;
- deny rationale required;
- physician escalation rationale required;
- request-more-information missing-doc text required;
- approve rationale required only when documented override condition applies.

Use explicit validator functions/domain helpers rather than duplicated ad-hoc checks.

## 13. Accessibility
- table headers semantic;
- labels tied to form inputs;
- buttons use descriptive names;
- status icons include text;
- evidence side panel/modal traps/manages focus appropriately;
- ESC closes dismissible overlays;
- keyboard operation for tabular/navigation actions;
- do not use color alone to indicate criterion status.

## 14. Responsive scope
Desktop-first enterprise workflow. Must remain usable at common laptop widths. Mobile optimization is not a primary MVP requirement, but layout must not become unusable on tablet/narrow browser.

## 15. Frontend definition of done
- routes complete;
- all states represented by fixtures;
- all backend interactions route through services;
- service mocks simulate behavior/errors/delays;
- no persistence across refresh intentionally;
- unit/component tests cover validation and permission-critical UI;
- no console errors/warnings in normal flows;
- TypeScript strict checks and lint pass;
- mock flow can demo login -> queue -> claim -> review -> note -> override -> save -> final decision -> read-only.

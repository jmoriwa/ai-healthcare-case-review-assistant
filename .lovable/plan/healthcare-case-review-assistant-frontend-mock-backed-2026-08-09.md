# Healthcare Case Review Assistant — Frontend (mock-backed)

Build the complete reviewer application against in-memory mock services, so the whole
MVP workflow is demoable before any backend exists. Nothing in the UI talks to a network.

## Stack note

The specs assume Next.js App Router. This project runs on TanStack Start, which is the
only supported framework here. Every layer below the routing folder — domain, services,
hooks, query keys, components — is ported unchanged. Only the route files differ:
file-based TanStack routes instead of `app/(group)/page.tsx`.

Route mapping:

```text
/login              src/routes/login.tsx
/queue              src/routes/_protected.queue.tsx
/my-cases           src/routes/_protected.my-cases.tsx
/cases/:caseId      src/routes/_protected.cases.$caseId.tsx
/ai-quality         src/routes/_protected.ai-quality.tsx
/                   redirects to /queue (or /login when signed out)
```

`_protected.tsx` is the pathless layout: app shell + auth gate + `<Outlet />`.

## Layers

```text
routes/components  ->  hooks  ->  service contracts  ->  mock implementations
```

- `src/domain/` — enums, models, validators, permissions. No imports from services.
- `src/services/contracts/` — `AuthService`, `CaseService`, `ReviewService`,
  `PatientService`, `EvaluationService`.
- `src/services/mock/` — mock implementations plus a single in-memory `mockStore`
  cloned from immutable fixtures at load. Simulated latency and injectable errors.
- `src/services/index.ts` — the only composition point; swapping in `api/` later
  changes this file alone.
- `src/hooks/` — TanStack Query wrappers; components never see a service directly.
- `src/query/keys.ts` — centralized key factories.
- Components never import fixtures or call fetch. Enforced by review, not tooling.

## Fixtures

22 cases covering all five procedure types and every status, with the status counts the
spec requires (5+ ready/unassigned, 3 in-review by current reviewer, 2 by another,
2 completed, plus needs-more-info, pending-physician, failed, analyzing, pending, and
2 cases with multiple AI analysis versions). 3 reviewers with `.test` emails and demo
passwords shown in a login helper. Each detailed case gets 3–5 synthetic criteria,
evidence passages with exact highlight offsets, and 8–25 timeline items including
deliberately irrelevant ones. All policy text is clearly synthetic and labeled.

## Screens

1. **Login** — wordmark, email/password, generic invalid-credentials message, demo
   credential picker.
2. **Case Queue** — search + procedure + status filters, clear-filters, compact table
   (Case ID, Patient, Procedure, Status, Assigned Reviewer, Created, Updated), skeleton
   loading, retryable error, filter-empty state.
3. **My Cases** — same table, Active / Completed tabs, scoped to signed-in reviewer.
4. **Case Detail** — all nine status modes rendered correctly: header with claim button
   or read-only banner, requested service + synthetic policy, AI recommendation card with
   version history, criterion cards (AI assessment and reviewer override shown side by
   side, never replaced), evidence links opening a right drawer with the exact highlighted
   span, tabs for Patient Timeline / Notes / Activity, and an owner-only Reviewer Decision
   panel with conditional required rationale and a confirmation step that states the
   terminal consequence.
5. **AI Quality** — restrained metric cards, metric definitions, table of representative
   failures. No decorative charts.

## Design system

Enterprise-calm: neutral surfaces, one restrained accent, subtle borders, dense but
disciplined spacing, system sans with mono only for identifiers. No gradients, glow,
glassmorphism, or hero typography. All values as semantic tokens in `src/styles.css`.
Status is always icon + text, never color alone.

## Permissions and validation

`domain/permissions.ts` derives editability from status + ownership; `domain/validators.ts`
holds the required-rationale rules (override reason, deny rationale, escalation rationale,
missing-information text). Mock services independently reject non-owner mutations with a
`ForbiddenError` so hiding a button is never the only defense.

## Accessibility

Semantic table headers, labels bound to inputs, visible focus, focus-trapped drawer with
ESC to close, errors associated with fields, full keyboard path through
login → queue → claim → review → decision.

## Build order

1. Design tokens + app shell + common components
2. Domain, contracts, mock store, fixtures, services composition
3. Query keys and hooks
4. Login and auth gate
5. Queue and My Cases
6. Case Detail (read modes, then review workflow, then decision panel)
7. AI Quality
8. Pass over states, empty/error coverage, accessibility, and head metadata per route

## Out of scope

No backend, no persistence across refresh (intentional per spec), no upload workflow, no
notifications/admin/settings/physician pages, no case release after claim.

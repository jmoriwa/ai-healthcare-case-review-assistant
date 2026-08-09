# Frontend 05 — Mock Services and Fixtures

## 1. Purpose
Make the frontend behave like a real application before backend exists, while keeping mocks disposable.

## 2. Reviewers
Create exactly 3 fake reviewer accounts, e.g.:
1. `Avery Johnson` — `avery.reviewer@example.test`
2. `Morgan Lee` — `morgan.reviewer@example.test`
3. `Jordan Patel` — `jordan.reviewer@example.test`

Use clearly fake `.test` emails. Define simple demo passwords in mock-only fixture documentation/UI. Do not reuse these as backend production secrets.

## 3. Required fixture coverage
At least 18–25 mock cases so tables feel realistic. Must include every procedure type and every important status.

Minimum examples:
- 5+ Ready for Review unassigned;
- 3 In Review owned by current reviewer;
- 2 In Review owned by another reviewer;
- 2 Completed;
- 1 Needs More Information;
- 1 Pending Physician Review;
- 1 Analysis Failed;
- 1 Analyzing;
- 1 Pending Analysis;
- at least 2 cases with >1 AI analysis version.

## 4. Procedure coverage
Each of five procedures must have at least 3 cases with differing AI recommendations/status patterns across fixture set.

## 5. Mock policy/criteria realism
Each case should have 3–5 synthetic criteria. Never paste real payer policy text. Use clearly synthetic descriptions following product templates.

## 6. Evidence fixtures
Every `SUPPORTED`/`NOT_SUPPORTED` criterion that relies on a factual statement should have evidence references sufficient for the AI rationale.
`INSUFFICIENT_EVIDENCE` may have zero evidence or contextual evidence demonstrating why required support is absent, but rationale must not fabricate absence proof beyond available data.

Evidence passage detail must include exact highlighted text for UI demonstration.

## 7. Patient timeline fixtures
Each detailed case should have 8–25 timeline items to make secondary verification meaningful:
- Encounter
- Condition
- Observation/Lab
- MedicationRequest
- Procedure
- DiagnosticReport
- note/DocumentReference-like record

Not every timeline item should be relevant. This demonstrates why evidence retrieval matters.

## 8. Mock store behavior
Use one in-memory store with clone/reset from immutable initial fixtures on application reload.

State transitions must match backend contract:
- claim changes assignment/status;
- addNote appends immutable note;
- saveProgress updates mutable draft only;
- override appends/updates current reviewer review state without changing AI assessment;
- submit final decision sets terminal/status state as specified;
- non-owner mutations throw ForbiddenError.

## 9. Simulated delays
Use bounded randomized or deterministic delays, e.g. 250–900ms for reads and 400–1200ms for mutations. Tests should be able to override/disable delay.

## 10. Simulated errors
Provide controlled error injection, not random flaky behavior in every session.
Recommended approach:
- optional dev config or fixture flag `simulateNextError`;
- one predefined case/operation that can demonstrate service unavailable;
- claim conflict simulation by mutating store before claim in test.

Do not make demo unusable through uncontrolled random failures.

## 11. Analysis state simulation
Frontend does not need a real background worker. Provide fixtures for Pending/Analyzing/Failed and optionally a demo helper that transitions an Analyzing fixture after delay. This helper must remain entirely inside mock service layer.

## 12. New-document reanalysis simulation
Provide at least one fixture with AI analysis v1 and v2 so version history UI can be built. No reviewer upload control. A mock developer-only internal transition may demonstrate source version update if useful, but it must not appear as an MVP reviewer action.

## 13. AI Quality fixture
Example realistic-but-clearly-demo metrics, e.g.:
- overall recommendation accuracy: 0.91
- criterion accuracy: 0.93
- evidence recall: 0.90
- citation accuracy: 0.97
- missing-info detection: 0.92
- unsupported-claim rate: 0.02
- reviewer override rate: 0.08

Include per-procedure breakdown and 4–6 failure examples.
UI should label metrics `Demo evaluation metrics` while mocked.

## 14. Mock service contract tests
Test:
- invalid login;
- claim success;
- claim conflict;
- owner mutation success;
- non-owner mutation forbidden;
- immutable note append;
- deny without rationale invalid;
- request-info without missing text invalid;
- escalation without rationale invalid;
- completion changes to read-only;
- search/filter behavior.

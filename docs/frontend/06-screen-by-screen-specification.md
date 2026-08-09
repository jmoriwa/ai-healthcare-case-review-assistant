# Frontend 06 — Screen-by-Screen Specification

## Screen 1 — Login (`/login`)
### Visible
- product title `Healthcare Case Review Assistant`
- subtitle `Utilization Management Review`
- email input
- password input
- Sign In button
- inline authentication error area
- optional demo reviewer credential selector/helper

### Behavior
- submit disabled only while request active;
- successful login -> `/queue`;
- invalid credentials -> generic message;
- Enter submits form.

---

## Screen 2 — Shared Case Queue (`/queue`)
### Header
- `Case Queue`
- brief description `Cases become claimable after AI analysis is ready.`

### Controls
- search input;
- procedure dropdown;
- status dropdown;
- clear filters if filters active.

### Table columns
Case ID | Patient | Procedure | Status | Assigned Reviewer | Created | Updated

### Row interaction
Open detail via case ID/patient link.
No priority column.

### States
- loading skeleton table;
- service error with Retry;
- no matching cases;
- populated.

---

## Screen 3 — My Cases (`/my-cases`)
Same table semantics, scoped to signed-in reviewer.
May use tabs `Active` / `Completed` or a status filter, but both active and completed must be accessible.

---

## Screen 4 — Case Detail (`/cases/[caseId]`)
### Header block
- Case ID
- Patient synthetic display name + basic demographics if specified in model
- Procedure
- Status
- Assigned reviewer
- Claim Case button only when eligible
- read-only banner where applicable

### Requested Service / Policy summary
- requested procedure
- synthetic policy name/version
- explicit `Synthetic demo policy — not clinical guidance` label

### AI Recommendation section
- recommendation label
- analysis version
- generated timestamp
- overall rationale
- version history control when >1

### Criteria section
For each ordered criterion:
- criterion rule;
- AI status;
- rationale;
- evidence link(s);
- reviewer override state if any;
- Change Assessment only for owner/editable;
- Add Existing Evidence only for owner/editable.

### Evidence interaction
Evidence link opens panel with exact highlight.

### Secondary tabs/sections
- Patient Timeline
- Notes
- Activity

### Notes
Owner editable: Add Note form.
Everyone: immutable note list.

### Action bar
Owner/editable:
- Save Progress
- Reviewer Decision section

### Final decision form
Choice -> conditional fields -> Review/Confirm -> Submit.
Confirmation explains terminal behavior for Completed/Escalated states.

---

## Case Detail mode: Ready for Review
- evidence visible;
- no review mutation controls until claimed;
- Claim Case prominent;
- timeline readable.

## Mode: In Review — owner
Full controls.

## Mode: In Review — non-owner
- ownership banner;
- no Claim/Save/Note/Override/Decision controls;
- all evidence/notes/activity readable.

## Mode: Analysis Failed
Replace AI review content with:
- `AI analysis could not be completed.`
- safe explanatory message;
- case metadata/source version;
- failure time;
- activity timeline may show attempts;
- no retry/claim.

## Mode: Pending/Analyzing
- processing status and case metadata;
- no claim;
- no fake percentage-progress bar unless backend provides meaningful progress (MVP does not).

## Mode: Needs More Information
- show submitted missing-document request;
- owner and others can inspect;
- no upload action;
- if current spec treats this as awaiting backend data flow, present that clearly.

## Mode: Pending Physician Review
- show escalation rationale and reviewer;
- read-only handoff state;
- text: physician workflow is outside current system scope.

## Mode: Completed
- final decision;
- final rationale if provided;
- AI recommendation at decision time;
- criterion overrides;
- notes/activity;
- permanently read-only.

---

## Screen 5 — AI Quality (`/ai-quality`)
### Header
`AI Quality`
Description: aggregate evaluation of synthetic ground-truth cases. No per-case confidence.

### Metrics
- Overall recommendation accuracy
- Criterion assessment accuracy
- Evidence recall
- Citation accuracy
- Missing-information detection
- Unsupported-claim rate
- Reviewer override rate

### Procedure breakdown
Table: procedure | cases evaluated | recommendation accuracy | criterion accuracy | evidence recall | citation accuracy.

### Failure examples
At least:
- case ID
- procedure
- expected
- observed
- failure category
- explanation
- optional link to case.

When frontend-only: visible badge `Demo evaluation metrics`.

---

## Evidence Passage Panel specification
### Header
source label + date + type.
### Body
full context with exact evidence highlighted.
### Footer metadata
source record ID; close control.
No edit.

---

## Criterion Override dialog/form
Fields:
- current AI status read-only;
- new reviewer status required;
- reason textarea required;
- optional existing-evidence picker.
Submit creates transparent reviewer override; does not replace AI output.

---

## Final Decision confirmation
Display chosen decision and entered rationale/missing info.
For Approve/Deny: warn case becomes Completed/read-only.
For Escalate: warn case moves to Pending Physician Review/read-only in MVP.
Request More Information moves to Needs More Information and remains awaiting external data flow.

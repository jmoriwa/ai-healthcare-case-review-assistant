# 02 — Product Specification

## 1. Product navigation
Authenticated reviewer navigation contains exactly:
- **Case Queue**
- **My Cases**
- **AI Quality**
- Reviewer identity menu with Sign Out

No Notifications, Admin, Settings, Uploads, or Physician pages in MVP.

## 2. Core case states and behavior
| Status | Meaning | Claimable | Editable by reviewer | Visible |
|---|---|---:|---:|---:|
| Pending Analysis | job has not started | No | No | Yes |
| Analyzing | AI job active/retrying | No | No | Yes |
| Ready for Review | analysis success, unassigned | Yes | No until claimed | Yes |
| Analysis Failed | all attempts failed | No | No | Yes |
| In Review | claimed by reviewer | No | Owner only | Yes |
| Needs More Information | reviewer needs missing evidence; no upload workflow in MVP | No | Owner read/write notes only as defined; no new docs via UI | Yes |
| Pending Physician Review | escalated handoff | No | No | Yes |
| Completed | final closed outcome | No | No | Yes |

If new documentation is ingested by backend data flow for a non-Completed/non-Pending-Physician case, create a new source version, queue a new AI analysis version, and expose status accordingly. Completed and Pending Physician Review are terminal for MVP.

## 3. Shared Case Queue
### Table columns
- Case ID
- Patient display name (synthetic)
- Requested procedure
- Current status
- Assigned reviewer (Unassigned or reviewer display name)
- Created at
- Last updated

No priority column.

### Search
Single search field searches case ID and patient display name/identifier. Search is case-insensitive.

### Filters
- Procedure: All + five values
- Status: All + canonical statuses
- Assignment: All / Unassigned / Assigned (optional UI convenience; if omitted from frontend, not required by MVP)

### Row actions
- Ready + Unassigned: `Open` and visible `Claim Case` inside detail; avoid destructive claim directly from table unless confirmation is implemented.
- Claimed by current reviewer: `Open` editable.
- Claimed by another reviewer: `Open` read-only.
- Analysis Failed: `Open` read-only.
- Completed/Pending Physician Review: `Open` read-only.

## 4. Claim flow
1. Reviewer opens `Ready for Review` case.
2. Header displays `Unassigned` and `Claim Case` button.
3. User selects Claim Case.
4. Service calls atomic claim operation.
5. On success: case assigned to current reviewer, status -> `In Review`.
6. On conflict: show "This case was claimed by another reviewer. The case is now read-only." Refresh case data.
7. Claimed case cannot be released in MVP.

## 5. Case Review page layout
Recommended desktop structure:
- top header: case ID, synthetic patient name, procedure, status, owner;
- left/main column: AI overall recommendation + ordered criteria;
- right contextual panel: case summary / requested service / policy identity / reviewer actions;
- tabs or secondary sections: Evidence, Patient Timeline, Activity.

Do not design as a chat interface.

## 6. AI overall recommendation card
Display:
- current AI recommendation label;
- analysis version (e.g., v2);
- generated timestamp;
- short case-level rationale limited to evidence-backed conclusions;
- link/control to view prior versions when >1 version exists.

Do not display a numeric confidence percentage.

## 7. Criterion card
Every criterion displays:
- ordinal number;
- criterion title;
- criterion description/rule;
- AI status (`Supported`, `Not Supported`, `Insufficient Evidence`);
- AI rationale;
- one or more linked evidence references, or explicit `No qualifying evidence located`;
- reviewer status if overridden;
- override reason if overridden;
- optional reviewer-added evidence selected from existing patient timeline.

### Evidence citation behavior
Clicking a citation opens a passage viewer (side panel/modal) containing:
- source type;
- source title/record label;
- date;
- exact highlighted passage or normalized structured field;
- source record identifier;
- context around passage sufficient for interpretation.

## 8. Patient Timeline
Secondary verification view; not default.
Chronological list of relevant available clinical records such as Encounter, Condition, Observation, Procedure, MedicationRequest, DiagnosticReport, DocumentReference-derived note.

Timeline is read-only. It supports basic type/date inspection but no complex filtering is required for MVP.

## 9. Reviewer criterion override
Owner selects `Change assessment`.
Required inputs:
- new status (one of criterion statuses);
- reason (non-empty free text);
- optionally attach an existing timeline evidence item.

On save:
- do not mutate AI assessment;
- create reviewer override record;
- display both AI and reviewer status;
- append activity event.

## 10. Review notes
Owner may add free-text note at any time while case is editable.
- note text required;
- save creates immutable note;
- display author, timestamp, case status at creation;
- all reviewers may read it;
- no edit/delete action in MVP.

## 11. Save Progress
Owner may select Save Progress.
Persist:
- reviewer criterion overrides;
- selected reviewer-added existing evidence;
- draft final rationale if present;
- other structured reviewer choices explicitly represented by data model.

Saving progress does not complete the case.

## 12. Final Decision panel
Buttons/options:
- Approve
- Deny
- Request More Information
- Escalate for Physician Review

### Validation
#### Approve
Rationale optional if human conclusion aligns with AI and there are no unresolved override conditions. If approving contrary to the AI recommendation, rationale required.

#### Deny
Rationale required always.

#### Request More Information
Required field: `Missing documentation or evidence`.
Resulting status: `Needs More Information`.
This is not terminal, but reviewer upload/inbound-document workflow is outside UI. Backend data flow may later ingest a document and reanalyze.

#### Escalate
Rationale required always.
Resulting status: `Pending Physician Review`.
Terminal/read-only for MVP.

### Completion rule
`Approve` and `Deny` produce `Completed` status and permanent read-only behavior.

## 13. Analysis Failed detail
Read-only screen includes:
- case metadata;
- procedure;
- creation time;
- source data version;
- user-friendly failure message;
- timestamp of final failure;
- no technical stack trace;
- no Retry button in reviewer UI.

## 14. AI analysis version history
When new documentation is ingested, prior AI analysis remains preserved.
Version history displays:
- version number;
- source-data version;
- generated timestamp;
- overall recommendation;
- optionally summary of criterion changes.

Selecting an older version is read-only.

## 15. Activity timeline
Chronological events with timestamp, event name, actor (`System`, `AI Analysis Worker`, or Reviewer), and concise details.

## 16. AI Quality page
Read-only aggregate metrics:
- overall recommendation accuracy;
- criterion assessment accuracy;
- evidence recall;
- citation accuracy;
- missing-information detection accuracy/recall;
- unsupported-claim rate;
- reviewer override/disagreement rate;
- performance by procedure type.

Also display representative failure cases with:
- case/procedure;
- expected vs observed;
- failure category;
- concise explanation;
- link to synthetic case if available.

No configuration controls.

## 17. Procedure-specific synthetic policy templates
The following are **illustrative project-owned criteria**, not clinical guidance or payer policy.

### Lumbar Spine MRI
Example synthetic criteria:
1. persistent relevant symptoms above a synthetic minimum duration;
2. documented conservative treatment attempt;
3. qualifying neurological/red-flag documentation OR defined synthetic exception;
4. absence/presence of required prior imaging/documentation as specified by synthetic policy.

### CT Chest with Contrast
1. documented indication matching synthetic policy category;
2. recent supporting clinical evaluation;
3. required prior study/lab information where synthetic policy demands it;
4. no documented contraindication data requirement missing.

### Cervical Fusion with Disc Removal
1. qualifying diagnosis/symptom pattern;
2. imaging evidence present;
3. conservative management history unless synthetic exception applies;
4. specialist evaluation documented;
5. exclusion/contraindication checks.

### Facet Joint Intervention
1. chronic pain duration threshold;
2. conservative management attempted;
3. imaging/clinical findings align with synthetic rule;
4. prior intervention timing/response if applicable;
5. exclusion conditions absent or documented.

### Radiation Therapy
1. confirmed synthetic oncology diagnosis/pathology evidence;
2. staging/clinical context available;
3. treatment plan and site documented;
4. required prior treatment/consultation evidence;
5. missing critical oncology documentation results in insufficient evidence.

Exact machine-readable policy definitions are specified in backend data-pipeline documentation.

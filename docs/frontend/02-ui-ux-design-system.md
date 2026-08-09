# Frontend 02 — UI/UX Design System

## 1. Design intent
A serious enterprise healthcare application: calm, trustworthy, information-dense, accessible, and optimized for reviewers handling many cases. It must not look like a consumer chatbot, neon AI startup, or marketing landing page.

## 2. Principles
1. Evidence before decoration.
2. Information hierarchy must be obvious at a glance.
3. AI content is visually identifiable but not glamorized.
4. Human decision controls are more important than AI branding.
5. Dense does not mean cramped: use disciplined spacing and alignment.
6. Status must use icon/text/label, not color alone.
7. Avoid modal overload; use side panels for evidence context where practical.

## 3. Layout
### Global shell
- fixed/consistent left navigation or top + side enterprise shell;
- content max-width generous enough for case review;
- header contains product name and signed-in reviewer;
- navigation labels: Case Queue, My Cases, AI Quality.

### Case-review layout
At >= 1200px:
- main evidence/criteria column approximately 2/3;
- contextual/actions column approximately 1/3;
- timeline/activity may use tabs/full-width lower section.

At narrower widths stack intelligently; do not hide critical evidence.

## 4. Visual tone
Use neutral backgrounds, restrained accent use, subtle borders, high legibility. Avoid gradients, glassmorphism, glowing AI elements, oversized hero text, animated decorative backgrounds.

## 5. Typography
Use a highly readable system/sans stack. Define tokens for:
- page title;
- section title;
- card title;
- body;
- metadata/caption;
- monospace only for identifiers when useful.

Do not use novelty fonts.

## 6. Spacing/density
Define spacing tokens and reuse consistently. Tables can be compact but must retain 44px-ish actionable row/control targets where possible for accessibility.

## 7. Status components
Create reusable `StatusBadge` with text + semantic icon where appropriate.

### Case status display labels
- Pending Analysis
- Analyzing
- Ready for Review
- Analysis Failed
- In Review
- Needs More Information
- Pending Physician Review
- Completed

### Criterion status labels
- Supported
- Not Supported
- Insufficient Evidence

### AI recommendation labels
- Criteria Appear Satisfied
- Criteria Appear Not Satisfied
- Additional Documentation Needed

Do not label AI recommendation as "Approved" or "Denied".

## 8. Table design
Queue table must support rapid scanning.
Recommended:
- sticky header when scrolling;
- sortable UI only if actually implemented; do not show fake sort affordances;
- status badge;
- clear ownership field;
- row hover/focus state;
- row click optional, but always expose clear accessible link/action.

## 9. Criterion card design
Each card should visually separate:
1. criterion rule;
2. AI status/rationale;
3. evidence links;
4. human override if present.

If human overrides AI, do not replace/hide AI output. Show both:
```text
AI assessment: Insufficient Evidence
Reviewer assessment: Supported
Override reason: ...
```
This supports transparency.

## 10. Evidence passage panel
Prefer right-side drawer/panel on desktop.
Contents:
- source record label;
- date;
- type;
- exact highlighted passage;
- nearby context;
- source ID.

Highlight only the evidence span; surrounding context should remain readable.

## 11. Patient timeline
Chronological cards/rows with date, resource type, title/summary, and expandable details. Avoid pretending the timeline is a full EHR. It is an MVP verification view.

## 12. Notes
Immutable-note visual treatment resembles audit entries:
- author;
- timestamp;
- case status at note creation;
- note body.
No edit/delete icons.

## 13. Activity timeline
Compact chronological entries. System/AI/Reviewer actor should be labeled explicitly.

## 14. Final decision controls
Human final decision area must be visually distinct from AI recommendation.
Use heading like `Reviewer Decision`.
Buttons should not imply that the AI is taking action.

Danger/irreversible finalization requires confirmation step summarizing:
- chosen decision;
- required rationale/missing info;
- statement that Completed/Pending Physician Review becomes read-only in MVP.

## 15. AI Quality page
Use restrained metric cards/table/chart only where it improves comprehension. Required content can be text + tables; do not create decorative charts without need.
Show definitions/tooltips for metrics so reviewers understand them.

## 16. Empty states
Examples:
- no cases match filters;
- no notes yet;
- no prior AI versions;
- criterion has no evidence;
- no completed cases in My Cases.

Empty states must be factual, not whimsical.

## 17. Error states
Distinguish:
- frontend/service request error;
- domain `Analysis Failed` state;
- authorization/read-only state;
- validation errors.

## 18. Component inventory
At minimum:
- AppShell
- Navigation
- ReviewerMenu
- PageHeader
- SearchInput
- ProcedureFilter
- StatusFilter
- CaseTable
- CaseStatusBadge
- OwnershipBadge
- CaseHeader
- AIRecommendationCard
- AnalysisVersionSelector
- CriterionCard
- CriterionStatusBadge
- EvidenceLink
- EvidencePassagePanel
- PatientTimeline
- ReviewerNotes
- AddNoteForm
- ActivityTimeline
- CriterionOverrideForm
- SaveProgressBar/ActionArea
- FinalDecisionPanel
- ConfirmationDialog
- QualityMetricCard
- FailureExampleTable/Card
- LoadingSkeletons
- InlineError

## 19. Accessibility acceptance
- full login/queue/case primary flow possible with keyboard;
- focus visible;
- modal/drawer focus managed;
- form errors announced/associated;
- color contrast checked;
- no status meaning conveyed solely by red/green.

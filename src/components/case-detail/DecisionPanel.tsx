import { useState } from "react";
import type { ReviewerDecision } from "@/domain/enums";
import { REVIEWER_DECISIONS } from "@/domain/enums";
import { REVIEWER_DECISION_LABELS } from "@/domain/labels";
import type { FinalDecision, FinalDecisionInput } from "@/domain/models";
import { validateFinalDecision } from "@/domain/validators";
import { formatDateTime } from "@/lib/dates";
import { Button } from "@/components/common/Button";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { Field, TextArea } from "@/components/common/Field";
import { InlineError } from "@/components/common/Feedback";
import { ConfirmationDialog } from "@/components/common/Overlays";

export function DecisionPanel({
  draftSummary,
  finalDecision,
  canEdit,
  hasOverrideAgainstRecommendation,
  lastSavedAt,
  isSavingDraft,
  isSubmitting,
  onSaveDraft,
  onSubmit,
}: {
  draftSummary: string;
  finalDecision: FinalDecision | null;
  canEdit: boolean;
  hasOverrideAgainstRecommendation: boolean;
  lastSavedAt: string | null;
  isSavingDraft: boolean;
  isSubmitting: boolean;
  onSaveDraft: (summary: string) => Promise<void>;
  onSubmit: (input: FinalDecisionInput) => Promise<void>;
}) {
  const [summary, setSummary] = useState(draftSummary);
  const [decision, setDecision] = useState<ReviewerDecision | null>(null);
  const [rationale, setRationale] = useState("");
  const [missingInformation, setMissingInformation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (finalDecision) {
    return (
      <Card>
        <CardHeader title="Final decision" description="This review has been submitted and is read-only." />
        <CardBody className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {REVIEWER_DECISION_LABELS[finalDecision.decision]}
          </p>
          <p className="text-meta">
            {finalDecision.reviewer.displayName} · {formatDateTime(finalDecision.submittedAt)}
          </p>
          {finalDecision.rationale ? (
            <p className="whitespace-pre-wrap text-sm text-foreground">{finalDecision.rationale}</p>
          ) : null}
          {finalDecision.missingInformation ? (
            <p className="whitespace-pre-wrap text-sm text-foreground">
              Missing information: {finalDecision.missingInformation}
            </p>
          ) : null}
        </CardBody>
      </Card>
    );
  }

  function requestSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = validateFinalDecision(
      { decision, rationale, missingInformation },
      { hasOverrideAgainstRecommendation },
    );
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    setIsConfirmOpen(true);
  }

  async function confirmSubmit() {
    if (!decision) return;
    setIsConfirmOpen(false);
    const input: FinalDecisionInput = { decision, rationale: rationale.trim() };
    if (decision === "REQUEST_MORE_INFORMATION") {
      input.missingInformation = missingInformation.trim();
    }
    await onSubmit(input);
  }

  return (
    <Card>
      <CardHeader
        title="Reviewer decision"
        description="You are accountable for this determination. The AI assessment is advisory only."
      />
      <CardBody className="space-y-4">
        <Field
          label="Working summary"
          htmlFor="draft-summary"
          hint={
            lastSavedAt ? `Last saved ${formatDateTime(lastSavedAt)}` : "Not saved yet"
          }
        >
          <TextArea
            id="draft-summary"
            value={summary}
            disabled={!canEdit}
            onChange={(event) => setSummary(event.target.value)}
          />
        </Field>
        {canEdit ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={isSavingDraft}
            onClick={() => void onSaveDraft(summary)}
          >
            {isSavingDraft ? "Saving…" : "Save progress"}
          </Button>
        ) : null}

        {canEdit ? (
          <form onSubmit={requestSubmit} className="space-y-4 border-t border-border pt-4">
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-foreground">Decision</legend>
              {REVIEWER_DECISIONS.map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    name="final-decision"
                    value={value}
                    checked={decision === value}
                    onChange={() => setDecision(value)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  {REVIEWER_DECISION_LABELS[value]}
                </label>
              ))}
            </fieldset>

            <Field
              label="Rationale"
              htmlFor="decision-rationale"
              hint="Required for denials, escalations, and approvals that differ from the AI recommendation."
            >
              <TextArea
                id="decision-rationale"
                value={rationale}
                onChange={(event) => setRationale(event.target.value)}
              />
            </Field>

            {decision === "REQUEST_MORE_INFORMATION" ? (
              <Field
                label="Missing information"
                htmlFor="decision-missing"
                hint="Describe the specific documentation the requesting provider must supply."
              >
                <TextArea
                  id="decision-missing"
                  value={missingInformation}
                  onChange={(event) => setMissingInformation(event.target.value)}
                />
              </Field>
            ) : null}

            {error ? <InlineError title="Cannot submit decision" message={error} /> : null}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Submit decision"}
            </Button>
          </form>
        ) : null}
      </CardBody>

      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Submit final decision?"
        description={
          decision
            ? `You are recording "${REVIEWER_DECISION_LABELS[decision]}". Submitted decisions cannot be edited.`
            : ""
        }
        confirmLabel="Submit decision"
        onConfirm={() => void confirmSubmit()}
      />
    </Card>
  );
}

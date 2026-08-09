import { useState } from "react";
import { CRITERION_STATUSES } from "@/domain/enums";
import { CRITERION_STATUS_LABELS, RECORD_TYPE_LABELS } from "@/domain/labels";
import type {
  AIAnalysisDetail,
  CriterionOverride,
  EvidenceId,
  MedicalPolicySummary,
  PolicyCriterion,
} from "@/domain/models";
import type { CriterionStatus } from "@/domain/enums";
import { validateOverrideReason } from "@/domain/validators";
import { formatDate, formatDateTime } from "@/lib/dates";
import { Button } from "@/components/common/Button";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { Field, SelectInput, TextArea } from "@/components/common/Field";
import { CriterionStatusBadge } from "@/components/common/StatusBadge";
import { EmptyState, InlineError } from "@/components/common/Feedback";

export function CriteriaPanel({
  policy,
  analysis,
  overrides,
  canEdit,
  isSaving,
  onOverride,
  onOpenEvidence,
}: {
  policy: MedicalPolicySummary;
  analysis: AIAnalysisDetail | null;
  overrides: CriterionOverride[];
  canEdit: boolean;
  isSaving: boolean;
  onOverride: (input: {
    criterionId: string;
    status: CriterionStatus;
    reason: string;
  }) => Promise<void>;
  onOpenEvidence: (evidenceId: EvidenceId) => void;
}) {
  return (
    <Card>
      <CardHeader
        title="Policy criteria"
        description={`${policy.name} · v${policy.version} · effective ${formatDate(policy.effectiveDate)}`}
      />
      <CardBody className="space-y-3">
        <p className="rounded-md border border-border bg-caution-surface px-3 py-2 text-xs text-caution-foreground">
          {policy.syntheticDisclaimer}
        </p>

        {analysis === null ? (
          <EmptyState
            title="No AI assessment available"
            description="Criteria assessments appear once an analysis has completed for this case."
          />
        ) : (
          <ul className="space-y-3">
            {policy.criteria.map((criterion) => (
              <CriterionRow
                key={criterion.id}
                criterion={criterion}
                assessment={analysis.assessments.find((item) => item.criterionId === criterion.id)}
                override={overrides.find((item) => item.criterionId === criterion.id)}
                canEdit={canEdit}
                isSaving={isSaving}
                onOverride={onOverride}
                onOpenEvidence={onOpenEvidence}
              />
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function CriterionRow({
  criterion,
  assessment,
  override,
  canEdit,
  isSaving,
  onOverride,
  onOpenEvidence,
}: {
  criterion: PolicyCriterion;
  assessment: AIAnalysisDetail["assessments"][number] | undefined;
  override: CriterionOverride | undefined;
  canEdit: boolean;
  isSaving: boolean;
  onOverride: (input: {
    criterionId: string;
    status: CriterionStatus;
    reason: string;
  }) => Promise<void>;
  onOpenEvidence: (evidenceId: EvidenceId) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<CriterionStatus>(
    override?.status ?? assessment?.status ?? "INSUFFICIENT_EVIDENCE",
  );
  const [reason, setReason] = useState(override?.reason ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = validateOverrideReason(reason);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    await onOverride({ criterionId: criterion.id, status, reason: reason.trim() });
    setIsEditing(false);
  }

  return (
    <li className="rounded-md border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {criterion.code}. {criterion.rule}
          </p>
          <p className="text-meta">{criterion.guidance}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {assessment ? <CriterionStatusBadge status={assessment.status} prefix="AI" /> : null}
          {override ? <CriterionStatusBadge status={override.status} prefix="Reviewer" /> : null}
        </div>
      </div>

      {assessment ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-foreground">{assessment.rationale}</p>
          {assessment.evidence.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {assessment.evidence.map((evidence) => (
                <li key={evidence.id}>
                  <button
                    type="button"
                    onClick={() => onOpenEvidence(evidence.id)}
                    aria-label={`View the cited passage from ${evidence.recordLabel}`}
                    className="rounded-md border border-border-strong bg-card px-2 py-1 text-left text-xs text-foreground hover:bg-secondary"
                  >
                    <span className="font-medium">{evidence.recordLabel}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {RECORD_TYPE_LABELS[evidence.recordType]} ·{" "}
                      {formatDate(evidence.occurredAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-meta">No supporting passages were cited for this criterion.</p>
          )}
        </div>
      ) : null}

      {override ? (
        <p className="mt-3 rounded-md border border-border bg-neutral-surface px-3 py-2 text-xs text-foreground">
          <span className="font-medium">
            Overridden to {CRITERION_STATUS_LABELS[override.status]} by{" "}
            {override.reviewer.displayName}
          </span>{" "}
          · {formatDateTime(override.createdAt)}
          <br />
          {override.reason}
        </p>
      ) : null}

      {canEdit && !isEditing ? (
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
            {override ? "Update assessment" : "Disagree with AI"}
          </Button>
        </div>
      ) : null}

      {canEdit && isEditing ? (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3 border-t border-border pt-3">
          <Field label="Your assessment" htmlFor={`${criterion.id}-status`}>
            <SelectInput
              id={`${criterion.id}-status`}
              value={status}
              onChange={(event) => setStatus(event.target.value as CriterionStatus)}
            >
              {CRITERION_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {CRITERION_STATUS_LABELS[value]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field
            label="Reason"
            htmlFor={`${criterion.id}-reason`}
            hint="Required. Explain the clinical basis for your assessment."
          >
            <TextArea
              id={`${criterion.id}-reason`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>
          {error ? <InlineError title="Cannot save override" message={error} /> : null}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save assessment"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsEditing(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </li>
  );
}

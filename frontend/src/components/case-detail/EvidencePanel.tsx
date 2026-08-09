import { RECORD_TYPE_LABELS } from "@/domain/labels";
import type { CaseId, EvidenceId } from "@/domain/models";
import { formatDateTime } from "@/lib/dates";
import { SidePanel } from "@/components/common/Overlays";
import { InlineError, LoadingRegion, errorMessage } from "@/components/common/Feedback";
import { useEvidencePassage } from "@/hooks/patients/usePatients";

export function EvidencePanel({
  caseId,
  evidenceId,
  onClose,
}: {
  caseId: CaseId;
  evidenceId: EvidenceId | null;
  onClose: () => void;
}) {
  const query = useEvidencePassage(caseId, evidenceId);

  return (
    <SidePanel
      open={evidenceId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Source passage"
    >
      {query.isPending ? <LoadingRegion label="Loading source record…" /> : null}
      {query.error ? (
        <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : null}
      {query.data ? (
        <div className="space-y-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">{query.data.recordLabel}</p>
            <p className="text-meta">
              {RECORD_TYPE_LABELS[query.data.recordType]} · {formatDateTime(query.data.occurredAt)}{" "}
              · {query.data.sourceRecordId}
            </p>
          </div>
          <p className="whitespace-pre-wrap rounded-md border border-border bg-neutral-surface p-3 text-sm leading-relaxed text-foreground">
            <span className="text-muted-foreground">{query.data.contextBefore}</span>
            <mark className="rounded bg-caution-surface px-0.5 text-caution-foreground">
              {query.data.highlightedText}
            </mark>
            <span className="text-muted-foreground">{query.data.contextAfter}</span>
          </p>
          <p className="text-meta">
            Highlighted text is the passage the assistant cited. Always confirm against the full
            record before deciding.
          </p>
        </div>
      ) : null}
    </SidePanel>
  );
}

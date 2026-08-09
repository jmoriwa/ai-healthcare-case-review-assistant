import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { EmptyState, InlineError, LoadingRegion, errorMessage } from "@/components/common/Feedback";
import { ACTIVITY_EVENT_LABELS, RECORD_TYPE_LABELS } from "@/domain/labels";
import type { ActivityEvent, CaseId } from "@/domain/models";
import { formatDateTime } from "@/lib/dates";
import { usePatientTimeline } from "@/hooks/patients/usePatients";

export function TimelinePanel({ caseId }: { caseId: CaseId }) {
  const query = usePatientTimeline(caseId);

  return (
    <Card>
      <CardHeader
        title="Patient record timeline"
        description="Synthetic clinical history relevant to this request, newest first."
      />
      {query.isPending ? <LoadingRegion label="Loading patient records…" /> : null}
      {query.error ? (
        <CardBody>
          <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
        </CardBody>
      ) : null}
      {query.data && query.data.length === 0 ? (
        <EmptyState
          title="No clinical records"
          description="No documentation has been ingested for this patient yet."
        />
      ) : null}
      {query.data && query.data.length > 0 ? (
        <ul className="divide-y divide-border">
          {query.data.map((item) => (
            <li key={item.id} className="space-y-1 px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{item.title}</span>
                <span className="text-meta">
                  {RECORD_TYPE_LABELS[item.recordType]} · {formatDateTime(item.occurredAt)}
                </span>
              </div>
              <p className="text-sm text-foreground">{item.summary}</p>
              <p className="text-meta">{item.details}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

export function ActivityPanel({
  events,
  isLoading,
  error,
  onRetry,
}: {
  events: ActivityEvent[] | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardHeader title="Case activity" description="System, AI, and reviewer events." />
      {isLoading ? <LoadingRegion label="Loading activity…" /> : null}
      {error ? (
        <CardBody>
          <InlineError message={errorMessage(error)} onRetry={onRetry} />
        </CardBody>
      ) : null}
      {events ? (
        <ol className="divide-y divide-border">
          {events.map((event) => (
            <li key={event.id} className="space-y-0.5 px-4 py-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {ACTIVITY_EVENT_LABELS[event.type]}
                </span>
                <span className="text-meta">{formatDateTime(event.occurredAt)}</span>
              </div>
              <p className="text-meta">
                {event.actorName} · {event.description}
              </p>
            </li>
          ))}
        </ol>
      ) : null}
    </Card>
  );
}

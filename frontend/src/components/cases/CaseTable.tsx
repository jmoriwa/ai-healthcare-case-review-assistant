import { Link } from "@tanstack/react-router";
import type { CaseSummary } from "@/domain/models";
import { PROCEDURE_LABELS } from "@/domain/labels";
import { formatDateTime } from "@/lib/dates";
import { CaseStatusBadge, OwnershipBadge } from "@/components/common/StatusBadge";
import { EmptyState, InlineError, TableSkeleton, errorMessage } from "@/components/common/Feedback";

export function CaseTable({
  cases,
  isLoading,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  currentReviewerId,
}: {
  cases: CaseSummary[] | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  emptyTitle: string;
  emptyDescription: string;
  currentReviewerId: string | undefined;
}) {
  if (isLoading) {
    return <TableSkeleton />;
  }
  if (error) {
    return (
      <div className="p-4">
        <InlineError message={errorMessage(error)} onRetry={onRetry} />
      </div>
    );
  }
  if (!cases || cases.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Prior authorization cases</caption>
        <thead>
          <tr className="border-b border-border bg-neutral-surface text-left">
            <th scope="col" className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
              Case
            </th>
            <th scope="col" className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
              Patient
            </th>
            <th scope="col" className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
              Procedure
            </th>
            <th scope="col" className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
              Status
            </th>
            <th scope="col" className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
              Assigned
            </th>
            <th scope="col" className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
              Updated
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {cases.map((item) => (
            <tr key={item.id} className="hover:bg-secondary/60">
              <td className="px-4 py-3 align-middle">
                <Link
                  to="/cases/$caseId"
                  params={{ caseId: item.id }}
                  className="font-medium text-primary hover:underline"
                >
                  {item.caseNumber}
                </Link>
              </td>
              <td className="px-4 py-3 align-middle text-foreground">{item.patient.displayName}</td>
              <td className="px-4 py-3 align-middle text-foreground">
                {PROCEDURE_LABELS[item.procedureType]}
              </td>
              <td className="px-4 py-3 align-middle">
                <CaseStatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3 align-middle">
                <OwnershipBadge
                  reviewerName={
                    item.assignedReviewer
                      ? item.assignedReviewer.id === currentReviewerId
                        ? "You"
                        : item.assignedReviewer.displayName
                      : null
                  }
                />
              </td>
              <td className="px-4 py-3 align-middle text-meta">{formatDateTime(item.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

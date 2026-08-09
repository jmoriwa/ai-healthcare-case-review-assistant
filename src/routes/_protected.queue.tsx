import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/common/Card";
import { CaseTable } from "@/components/cases/CaseTable";
import { CaseFilterBar, DEFAULT_CASE_FILTERS } from "@/components/cases/CaseFilterBar";
import { PageHeader } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCases } from "@/hooks/cases/useCases";

export const Route = createFileRoute("/_protected/queue")({
  head: () => ({
    meta: [
      { title: "Case Queue — Case Review Assistant" },
      {
        name: "description",
        content:
          "Shared queue of prior authorization cases awaiting AI-assisted clinical review.",
      },
      { property: "og:title", content: "Case Queue — Case Review Assistant" },
      {
        property: "og:description",
        content: "Browse and filter every prior authorization case in the review queue.",
      },
    ],
  }),
  component: QueuePage,
});

function QueuePage() {
  const [filters, setFilters] = useState(DEFAULT_CASE_FILTERS);
  const { reviewer } = useAuth();
  const query = useCases(filters);

  return (
    <>
      <PageHeader
        title="Case Queue"
        description="All prior authorization cases. Claim a case that is ready for review to record a decision."
      />
      <Card>
        <CaseFilterBar filters={filters} onChange={setFilters} />
        <CaseTable
          cases={query.data}
          isLoading={query.isPending}
          error={query.error}
          onRetry={() => void query.refetch()}
          emptyTitle="No cases match these filters"
          emptyDescription="Adjust the search term, procedure type, or status filter to see more cases."
          currentReviewerId={reviewer?.id}
        />
      </Card>
    </>
  );
}

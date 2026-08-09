import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/common/Card";
import { CaseTable } from "@/components/cases/CaseTable";
import { CaseFilterBar, DEFAULT_CASE_FILTERS } from "@/components/cases/CaseFilterBar";
import { PageHeader } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/auth/useAuth";
import { useMyCases } from "@/hooks/cases/useCases";

export const Route = createFileRoute("/_protected/my-cases")({
  head: () => ({
    meta: [
      { title: "My Cases — Case Review Assistant" },
      {
        name: "description",
        content: "Cases you have claimed, including in-review and completed reviews.",
      },
      { property: "og:title", content: "My Cases — Case Review Assistant" },
      {
        property: "og:description",
        content: "Track the prior authorization cases assigned to you.",
      },
    ],
  }),
  component: MyCasesPage,
});

function MyCasesPage() {
  const [filters, setFilters] = useState(DEFAULT_CASE_FILTERS);
  const { reviewer } = useAuth();
  const query = useMyCases(reviewer?.id ?? "", filters);

  return (
    <>
      <PageHeader
        title="My Cases"
        description="Cases currently assigned to you, plus reviews you have already submitted."
      />
      <Card>
        <CaseFilterBar filters={filters} onChange={setFilters} />
        <CaseTable
          cases={query.data}
          isLoading={query.isPending}
          error={query.error}
          onRetry={() => void query.refetch()}
          emptyTitle="You have no claimed cases"
          emptyDescription="Claim a case from the Case Queue to start a review."
          currentReviewerId={reviewer?.id}
        />
      </Card>
    </>
  );
}

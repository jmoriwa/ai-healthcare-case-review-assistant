import { createFileRoute } from "@tanstack/react-router";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { InlineError, LoadingRegion, errorMessage } from "@/components/common/Feedback";
import { PageHeader } from "@/components/layout/AppShell";
import { PROCEDURE_LABELS } from "@/domain/labels";
import { formatDate, formatDateTime } from "@/lib/dates";
import { useQualityReport } from "@/hooks/evaluation/useQualityReport";

export const Route = createFileRoute("/_protected/ai-quality")({
  head: () => ({
    meta: [
      { title: "AI Quality — Case Review Assistant" },
      {
        name: "description",
        content: "Offline evaluation metrics and known failure modes for the case analysis model.",
      },
      { property: "og:title", content: "AI Quality — Case Review Assistant" },
      {
        property: "og:description",
        content: "Understand how the AI assistant is evaluated and where it is known to fail.",
      },
    ],
  }),
  component: AIQualityPage,
});

function AIQualityPage() {
  const query = useQualityReport();

  return (
    <>
      <PageHeader
        title="AI Quality"
        description="Offline evaluation results on a held-out set of synthetic cases. The assistant supports reviewers; it never makes coverage decisions."
      />

      {query.isPending ? <LoadingRegion label="Loading evaluation report…" /> : null}
      {query.error ? (
        <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : null}

      {query.data ? (
        <div className="space-y-5">
          <p className="text-meta">
            Generated {formatDateTime(query.data.generatedAt)} across {query.data.analysesEvaluated}{" "}
            evaluated analyses.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {query.data.metrics.map((metric) => (
              <Card key={metric.key}>
                <CardBody className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {metric.value}
                  </p>
                  <p className="text-meta">{metric.definition}</p>
                </CardBody>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader
              title="Known failure modes"
              description="Representative examples where the assistant produced an unreliable assessment."
            />
            <ul className="divide-y divide-border">
              {query.data.failures.map((failure) => (
                <li key={failure.id} className="space-y-1 px-4 py-3">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {failure.failureMode}
                    </span>
                    <span className="text-meta">
                      {failure.caseNumber} · {PROCEDURE_LABELS[failure.procedureType]} ·{" "}
                      {formatDate(failure.observedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{failure.description}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}
    </>
  );
}

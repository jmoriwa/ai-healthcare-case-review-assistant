import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { InlineError, LoadingRegion, Skeleton, errorMessage } from "@/components/common/Feedback";
import { SelectInput } from "@/components/common/Field";
import {
  AIRecommendationBadge,
  CaseStatusBadge,
  OwnershipBadge,
} from "@/components/common/StatusBadge";
import { CriteriaPanel } from "@/components/case-detail/CriteriaPanel";
import { DecisionPanel } from "@/components/case-detail/DecisionPanel";
import { EvidencePanel } from "@/components/case-detail/EvidencePanel";
import { NotesPanel } from "@/components/case-detail/NotesPanel";
import { ActivityPanel, TimelinePanel } from "@/components/case-detail/TimelinePanel";
import { PROCEDURE_LABELS } from "@/domain/labels";
import { describeReadOnlyReason } from "@/domain/permissions";
import { formatAge, formatDate, formatDateTime } from "@/lib/dates";
import { useCaseWorkspace } from "@/hooks/cases/useCaseWorkspace";

export const Route = createFileRoute("/_protected/cases/$caseId")({
  head: () => ({
    meta: [
      { title: "Case Review — Case Review Assistant" },
      {
        name: "description",
        content:
          "Review the AI criteria assessment, patient record, and evidence for a prior authorization case.",
      },
      { property: "og:title", content: "Case Review — Case Review Assistant" },
      {
        property: "og:description",
        content: "Evidence-linked criteria review workspace for a single prior authorization case.",
      },
    ],
  }),
  component: CaseDetailPage,
});

function CaseDetailPage() {
  const { caseId } = Route.useParams();
  const workspace = useCaseWorkspace(caseId);
  const {
    reviewer,
    caseQuery,
    reviewQuery,
    activityQuery,
    versionsQuery,
    historicalAnalysis,
    caseDetail,
    analysis,
    overrides,
    isViewingHistorical,
    hasOverrideAgainstRecommendation,
    canEdit,
    canClaim,
    readOnlyReason,
    evidenceId,
    selectedAnalysisId,
    claim,
    saveProgress,
    addNote,
    overrideCriterion,
    submitDecision,
    actions,
  } = workspace;

  if (caseQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (caseQuery.error || !caseDetail) {
    return (
      <InlineError
        title="This case could not be loaded"
        message={errorMessage(caseQuery.error)}
        onRetry={() => void caseQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <h1 className="text-page-title">
            {caseDetail.caseNumber} · {PROCEDURE_LABELS[caseDetail.procedureType]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {caseDetail.patient.displayName} · {formatAge(caseDetail.patient.birthDate)} yrs ·{" "}
            {caseDetail.patient.sex} · DOB {formatDate(caseDetail.patient.birthDate)} · FHIR{" "}
            {caseDetail.patient.fhirPatientId}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <CaseStatusBadge status={caseDetail.status} />
            <OwnershipBadge
              reviewerName={
                caseDetail.assignedReviewer
                  ? caseDetail.assignedReviewer.id === reviewer?.id
                    ? "You"
                    : caseDetail.assignedReviewer.displayName
                  : null
              }
            />
            {caseDetail.currentAnalysis ? (
              <AIRecommendationBadge recommendation={caseDetail.currentAnalysis.recommendation} />
            ) : null}
          </div>
        </div>

        {canClaim ? (
          <Button onClick={actions.claimCase} disabled={claim.isPending}>
            {claim.isPending ? "Claiming…" : "Claim case"}
          </Button>
        ) : null}
      </div>

      {claim.error ? <InlineError message={errorMessage(claim.error)} /> : null}

      {readOnlyReason ? (
        <p className="rounded-md border border-border bg-info-surface px-3 py-2 text-sm text-info-foreground">
          {describeReadOnlyReason(readOnlyReason, caseDetail.assignedReviewer?.displayName)}
        </p>
      ) : null}

      {caseDetail.analysisFailureReason ? (
        <InlineError title="AI analysis failed" message={caseDetail.analysisFailureReason} />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          {caseDetail.currentAnalysis ? (
            <Card>
              <CardBody className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-card-title">AI assessment summary</p>
                    <p className="text-meta">
                      {analysis
                        ? `Version ${analysis.version} · ${analysis.modelLabel} · generated ${formatDateTime(analysis.generatedAt)}`
                        : null}
                    </p>
                  </div>
                  {versionsQuery.data && versionsQuery.data.length > 1 ? (
                    <label className="text-xs text-muted-foreground">
                      Version
                      <SelectInput
                        className="mt-1 h-9 w-48"
                        value={selectedAnalysisId ?? caseDetail.currentAnalysis.id}
                        onChange={(event) => workspace.selectAnalysisVersion(event.target.value)}
                      >
                        {versionsQuery.data.map((version) => (
                          <option key={version.id} value={version.id}>
                            v{version.version}
                            {version.isCurrent ? " (current)" : ""} ·{" "}
                            {formatDate(version.generatedAt)}
                          </option>
                        ))}
                      </SelectInput>
                    </label>
                  ) : null}
                </div>
                {isViewingHistorical ? (
                  <p className="rounded-md border border-border bg-caution-surface px-3 py-2 text-xs text-caution-foreground">
                    You are viewing a superseded analysis version. It is read-only history.
                  </p>
                ) : null}
                {historicalAnalysis.isFetching ? <LoadingRegion label="Loading version…" /> : null}
                {analysis ? (
                  <p className="text-sm leading-relaxed text-foreground">
                    {analysis.overallRationale}
                  </p>
                ) : null}
                <p className="text-meta">
                  This assessment is decision support only. Verify every cited passage before
                  recording a determination.
                </p>
              </CardBody>
            </Card>
          ) : null}

          <CriteriaPanel
            policy={caseDetail.policy}
            analysis={analysis}
            overrides={overrides}
            canEdit={canEdit && !isViewingHistorical}
            isSaving={overrideCriterion.isPending}
            onOverride={async (input) => {
              await overrideCriterion.mutateAsync(input);
            }}
            onOpenEvidence={workspace.openEvidence}
          />

          <TimelinePanel caseId={caseId} />
        </div>

        <div className="space-y-5">
          {reviewQuery.isPending ? <LoadingRegion label="Loading review state…" /> : null}
          {reviewQuery.error ? (
            <InlineError
              message={errorMessage(reviewQuery.error)}
              onRetry={() => void reviewQuery.refetch()}
            />
          ) : null}
          {reviewQuery.data ? (
            <>
              <DecisionPanel
                draftSummary={reviewQuery.data.draftSummary}
                finalDecision={reviewQuery.data.finalDecision}
                canEdit={canEdit}
                hasOverrideAgainstRecommendation={hasOverrideAgainstRecommendation}
                lastSavedAt={reviewQuery.data.lastSavedAt}
                isSavingDraft={saveProgress.isPending}
                isSubmitting={submitDecision.isPending}
                onSaveDraft={actions.saveDraft}
                onSubmit={actions.submitDecision}
              />
              <NotesPanel
                notes={reviewQuery.data.notes}
                canEdit={canEdit}
                isSaving={addNote.isPending}
                onAddNote={actions.addNote}
              />
            </>
          ) : null}

          <ActivityPanel
            events={activityQuery.data}
            isLoading={activityQuery.isPending}
            error={activityQuery.error}
            onRetry={() => void activityQuery.refetch()}
          />
        </div>
      </div>

      <EvidencePanel caseId={caseId} evidenceId={evidenceId} onClose={workspace.closeEvidence} />
    </div>
  );
}

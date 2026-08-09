import { useState } from "react";
import type { EvidenceId, FinalDecisionInput, SaveReviewProgressInput } from "@/domain/models";
import { canClaimCase, canEditReview, getReadOnlyReason } from "@/domain/permissions";
import { hasOverrideAgainstRecommendation } from "@/domain/review";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useAnalysisVersion,
  useAnalysisVersions,
  useCase,
  useCaseActivity,
  useClaimCase,
} from "@/hooks/cases/useCases";
import {
  useAddNote,
  useOverrideCriterion,
  useReviewState,
  useSaveProgress,
  useSubmitFinalDecision,
} from "@/hooks/reviews/useReview";

/**
 * Orchestrates every query, mutation and derived flag the case review
 * workspace needs, so the route component stays presentational.
 */
export function useCaseWorkspace(caseId: string) {
  const { reviewer } = useAuth();
  const [evidenceId, setEvidenceId] = useState<EvidenceId | null>(null);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);

  const caseQuery = useCase(caseId);
  const reviewQuery = useReviewState(caseId);
  const activityQuery = useCaseActivity(caseId);
  const versionsQuery = useAnalysisVersions(caseId);
  const historicalAnalysis = useAnalysisVersion(caseId, selectedAnalysisId);

  const claim = useClaimCase(caseId);
  const saveProgress = useSaveProgress(caseId);
  const addNote = useAddNote(caseId);
  const overrideCriterion = useOverrideCriterion(caseId);
  const submitDecision = useSubmitFinalDecision(caseId);

  const caseDetail = caseQuery.data;
  const overrides = reviewQuery.data?.overrides ?? [];
  const analysis =
    selectedAnalysisId && historicalAnalysis.data
      ? historicalAnalysis.data
      : caseDetail?.currentAnalysis;

  return {
    caseId,
    reviewer,
    caseQuery,
    reviewQuery,
    activityQuery,
    versionsQuery,
    historicalAnalysis,
    caseDetail,
    analysis,
    overrides,
    isViewingHistorical: Boolean(
      selectedAnalysisId && analysis && analysis.id !== caseDetail?.currentAnalysis?.id,
    ),
    hasOverrideAgainstRecommendation: hasOverrideAgainstRecommendation(
      caseDetail?.currentAnalysis?.assessments,
      overrides,
    ),
    canEdit: caseDetail ? canEditReview(caseDetail, reviewer?.id) : false,
    canClaim: caseDetail ? canClaimCase(caseDetail, reviewer?.id) : false,
    readOnlyReason: caseDetail ? getReadOnlyReason(caseDetail, reviewer?.id) : null,
    evidenceId,
    openEvidence: setEvidenceId,
    closeEvidence: () => setEvidenceId(null),
    selectedAnalysisId,
    selectAnalysisVersion: (versionId: string) => {
      setSelectedAnalysisId(versionId === caseDetail?.currentAnalysis?.id ? null : versionId);
    },
    claim,
    saveProgress,
    addNote,
    overrideCriterion,
    submitDecision,
    actions: {
      claimCase: () => claim.mutate(),
      saveDraft: async (draftSummary: string) => {
        const input: SaveReviewProgressInput = { draftSummary };
        await saveProgress.mutateAsync(input);
      },
      addNote: async (body: string) => {
        await addNote.mutateAsync({ body });
      },
      submitDecision: async (input: FinalDecisionInput) => {
        await submitDecision.mutateAsync(input);
      },
    },
  };
}

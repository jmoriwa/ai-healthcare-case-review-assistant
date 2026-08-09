import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CaseId,
  CriterionOverrideInput,
  FinalDecisionInput,
  SaveReviewProgressInput,
} from "@/domain/models";
import { queryKeys } from "@/query/keys";
import { services } from "@/services";

export function useReviewState(caseId: CaseId) {
  return useQuery({
    queryKey: queryKeys.caseReview(caseId),
    queryFn: () => services.reviews.getReviewState(caseId),
  });
}

function useReviewMutation<TInput, TResult>(
  caseId: CaseId,
  mutationFn: (input: TInput) => Promise<TResult>,
  options?: { invalidateCase?: boolean },
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.caseReview(caseId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.caseActivity(caseId) });
      if (options?.invalidateCase) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.case(caseId) });
        void queryClient.invalidateQueries({ queryKey: ["cases"] });
      }
    },
  });
}

export function useSaveProgress(caseId: CaseId) {
  return useReviewMutation(caseId, (input: SaveReviewProgressInput) =>
    services.reviews.saveProgress(caseId, input),
  );
}

export function useAddNote(caseId: CaseId) {
  return useReviewMutation(caseId, (input: { body: string }) =>
    services.reviews.addNote(caseId, input),
  );
}

export function useOverrideCriterion(caseId: CaseId) {
  return useReviewMutation(caseId, (input: CriterionOverrideInput) =>
    services.reviews.overrideCriterion(caseId, input),
  );
}

export function useSubmitFinalDecision(caseId: CaseId) {
  return useReviewMutation(
    caseId,
    (input: FinalDecisionInput) => services.reviews.submitFinalDecision(caseId, input),
    { invalidateCase: true },
  );
}

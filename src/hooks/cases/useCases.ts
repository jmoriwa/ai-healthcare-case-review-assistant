import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CaseFilters, CaseId } from "@/domain/models";
import { queryKeys } from "@/query/keys";
import { services } from "@/services";

export function useCases(filters: CaseFilters) {
  return useQuery({
    queryKey: queryKeys.cases(filters),
    queryFn: () => services.cases.listCases(filters),
  });
}

export function useMyCases(reviewerId: string, filters: CaseFilters) {
  return useQuery({
    queryKey: queryKeys.myCases(reviewerId, filters),
    queryFn: () => services.cases.listMyCases(filters),
  });
}

export function useCase(caseId: CaseId) {
  return useQuery({
    queryKey: queryKeys.case(caseId),
    queryFn: () => services.cases.getCase(caseId),
  });
}

export function useAnalysisVersions(caseId: CaseId) {
  return useQuery({
    queryKey: queryKeys.caseAnalysisVersions(caseId),
    queryFn: () => services.cases.getAnalysisVersions(caseId),
  });
}

export function useAnalysisVersion(caseId: CaseId, analysisId: string | null) {
  return useQuery({
    queryKey: queryKeys.caseAnalysisVersion(caseId, analysisId ?? "none"),
    queryFn: () => services.cases.getAnalysisVersion(caseId, analysisId!),
    enabled: analysisId !== null,
  });
}

export function useCaseActivity(caseId: CaseId) {
  return useQuery({
    queryKey: queryKeys.caseActivity(caseId),
    queryFn: () => services.cases.getActivity(caseId),
  });
}

export function useClaimCase(caseId: CaseId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => services.cases.claimCase(caseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.case(caseId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.caseActivity(caseId) });
      void queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

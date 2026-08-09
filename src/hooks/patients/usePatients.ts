import { useQuery } from "@tanstack/react-query";
import type { CaseId, EvidenceId } from "@/domain/models";
import { queryKeys } from "@/query/keys";
import { services } from "@/services";

export function usePatientTimeline(caseId: CaseId) {
  return useQuery({
    queryKey: queryKeys.caseTimeline(caseId),
    queryFn: () => services.patients.getTimeline(caseId),
  });
}

export function useEvidencePassage(caseId: CaseId, evidenceId: EvidenceId | null) {
  return useQuery({
    queryKey: queryKeys.evidencePassage(caseId, evidenceId ?? "none"),
    queryFn: () => services.patients.getEvidencePassage(caseId, evidenceId!),
    enabled: evidenceId !== null,
  });
}

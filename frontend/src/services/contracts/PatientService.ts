import type {
  CaseId,
  EvidenceId,
  EvidencePassageDetail,
  PatientTimelineItem,
} from "@/domain/models";

export interface PatientService {
  getTimeline(caseId: CaseId): Promise<PatientTimelineItem[]>;
  getEvidencePassage(caseId: CaseId, evidenceId: EvidenceId): Promise<EvidencePassageDetail>;
}

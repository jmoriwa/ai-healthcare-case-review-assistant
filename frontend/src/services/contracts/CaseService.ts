import type {
  AIAnalysisDetail,
  AIAnalysisSummary,
  ActivityEvent,
  CaseDetail,
  CaseFilters,
  CaseId,
  CaseSummary,
} from "@/domain/models";

export interface CaseService {
  listCases(filters: CaseFilters): Promise<CaseSummary[]>;
  listMyCases(filters: CaseFilters): Promise<CaseSummary[]>;
  getCase(caseId: CaseId): Promise<CaseDetail>;
  claimCase(caseId: CaseId): Promise<CaseDetail>;
  getAnalysisVersions(caseId: CaseId): Promise<AIAnalysisSummary[]>;
  getAnalysisVersion(caseId: CaseId, analysisId: string): Promise<AIAnalysisDetail>;
  getActivity(caseId: CaseId): Promise<ActivityEvent[]>;
}

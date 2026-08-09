export const queryKeys = {
  currentReviewer: () => ["auth", "current"] as const,
  cases: (filters: unknown) => ["cases", filters] as const,
  myCases: (reviewerId: string, filters: unknown) =>
    ["cases", "mine", reviewerId, filters] as const,
  case: (caseId: string) => ["case", caseId] as const,
  caseTimeline: (caseId: string) => ["case", caseId, "timeline"] as const,
  caseActivity: (caseId: string) => ["case", caseId, "activity"] as const,
  caseReview: (caseId: string) => ["case", caseId, "review"] as const,
  caseAnalysisVersions: (caseId: string) => ["case", caseId, "analyses"] as const,
  caseAnalysisVersion: (caseId: string, analysisId: string) =>
    ["case", caseId, "analyses", analysisId] as const,
  evidencePassage: (caseId: string, evidenceId: string) =>
    ["case", caseId, "evidence", evidenceId] as const,
  aiQuality: () => ["ai-quality"] as const,
} as const;

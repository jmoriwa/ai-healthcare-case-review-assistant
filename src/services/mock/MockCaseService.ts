import { ConflictError, NotFoundError, UnauthorizedError } from "@/domain/errors";
import type {
  AIAnalysisDetail,
  AIAnalysisSummary,
  ActivityEvent,
  CaseDetail,
  CaseFilters,
  CaseId,
  CaseSummary,
} from "@/domain/models";
import { POLICY_FIXTURES } from "@/mocks/fixtures/policies";
import type { CaseService } from "@/services/contracts/CaseService";
import { clone, delay, mockStore } from "./mockStore";

function matchesFilters(caseSummary: CaseSummary, filters: CaseFilters): boolean {
  const search = filters.search?.trim().toLowerCase();
  if (search) {
    const haystack = [
      caseSummary.caseNumber,
      caseSummary.patient.displayName,
      caseSummary.patient.fhirPatientId,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(search)) return false;
  }
  if (filters.procedureType && filters.procedureType !== "ALL") {
    if (caseSummary.procedureType !== filters.procedureType) return false;
  }
  if (filters.status && filters.status !== "ALL") {
    if (caseSummary.status !== filters.status) return false;
  }
  return true;
}

function requireReviewerId(): string {
  const session = mockStore.getSession();
  if (!session) throw new UnauthorizedError();
  return session.reviewer.id;
}

export class MockCaseService implements CaseService {
  async listCases(filters: CaseFilters): Promise<CaseSummary[]> {
    await delay();
    requireReviewerId();
    return clone(
      mockStore
        .getState()
        .cases.filter((item) => matchesFilters(item, filters))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    );
  }

  async listMyCases(filters: CaseFilters): Promise<CaseSummary[]> {
    await delay();
    const reviewerId = requireReviewerId();
    return clone(
      mockStore
        .getState()
        .cases.filter(
          (item) => item.assignedReviewer?.id === reviewerId && matchesFilters(item, filters),
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    );
  }

  async getCase(caseId: CaseId): Promise<CaseDetail> {
    await delay(360);
    requireReviewerId();
    return clone(this.readCase(caseId));
  }

  async claimCase(caseId: CaseId): Promise<CaseDetail> {
    await delay(480);
    const reviewerId = requireReviewerId();
    const state = mockStore.getState();
    const record = state.cases.find((item) => item.id === caseId);
    if (!record) throw new NotFoundError("Case not found.");
    if (record.assignedReviewer && record.assignedReviewer.id !== reviewerId) {
      throw new ConflictError(
        "This case was claimed by another reviewer. The case is now read-only.",
      );
    }
    if (record.status !== "READY_FOR_REVIEW") {
      throw new ConflictError("This case is no longer available to claim.");
    }
    const reviewer = state.reviewers.find((item) => item.id === reviewerId)!;
    const now = new Date().toISOString();
    record.assignedReviewer = reviewer;
    record.status = "IN_REVIEW";
    record.updatedAt = now;
    state.activity[caseId] = [
      ...(state.activity[caseId] ?? []),
      {
        id: `${caseId}-act-claim-${now}`,
        type: "CASE_CLAIMED",
        actor: "REVIEWER",
        actorName: reviewer.displayName,
        occurredAt: now,
        description: `Case claimed by ${reviewer.displayName}.`,
      },
    ];
    return clone(this.readCase(caseId));
  }

  async getAnalysisVersions(caseId: CaseId): Promise<AIAnalysisSummary[]> {
    await delay(260);
    requireReviewerId();
    const analyses = mockStore.getState().analyses[caseId] ?? [];
    return clone(
      analyses.map(({ id, version, generatedAt, recommendation, isCurrent }) => ({
        id,
        version,
        generatedAt,
        recommendation,
        isCurrent,
      })),
    );
  }

  async getAnalysisVersion(caseId: CaseId, analysisId: string): Promise<AIAnalysisDetail> {
    await delay(300);
    requireReviewerId();
    const analysis = (mockStore.getState().analyses[caseId] ?? []).find(
      (item) => item.id === analysisId,
    );
    if (!analysis) throw new NotFoundError("Analysis version not found.");
    return clone(analysis);
  }

  async getActivity(caseId: CaseId): Promise<ActivityEvent[]> {
    await delay(300);
    requireReviewerId();
    const events = mockStore.getState().activity[caseId] ?? [];
    return clone([...events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)));
  }

  private readCase(caseId: CaseId): CaseDetail {
    const state = mockStore.getState();
    const record = state.cases.find((item) => item.id === caseId);
    if (!record) throw new NotFoundError("Case not found.");
    const analyses = state.analyses[caseId] ?? [];
    return {
      ...record,
      policy: POLICY_FIXTURES[record.procedureType],
      currentAnalysis: analyses.find((item) => item.isCurrent) ?? null,
      analysisFailureReason: state.analysisFailureReasons[caseId] ?? null,
    };
  }
}

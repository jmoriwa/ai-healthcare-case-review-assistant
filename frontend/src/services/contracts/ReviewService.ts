import type {
  CaseId,
  CriterionOverrideInput,
  FinalDecisionInput,
  ReviewState,
  ReviewerNote,
  SaveReviewProgressInput,
} from "@/domain/models";

export interface ReviewService {
  getReviewState(caseId: CaseId): Promise<ReviewState>;
  saveProgress(caseId: CaseId, input: SaveReviewProgressInput): Promise<ReviewState>;
  addNote(caseId: CaseId, input: { body: string }): Promise<ReviewerNote>;
  overrideCriterion(caseId: CaseId, input: CriterionOverrideInput): Promise<ReviewState>;
  submitFinalDecision(caseId: CaseId, input: FinalDecisionInput): Promise<ReviewState>;
}

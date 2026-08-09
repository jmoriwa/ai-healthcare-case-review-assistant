import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "@/domain/errors";
import type {
  CaseId,
  CaseSummary,
  CriterionOverrideInput,
  FinalDecisionInput,
  ReviewState,
  Reviewer,
  ReviewerNote,
  SaveReviewProgressInput,
} from "@/domain/models";
import { canEditReview } from "@/domain/permissions";
import { validateNoteBody, validateOverrideReason } from "@/domain/validators";
import type { ReviewService } from "@/services/contracts/ReviewService";
import { clone, delay, mockStore } from "./mockStore";

interface OwnedCaseContext {
  record: CaseSummary;
  reviewer: Reviewer;
  reviewState: ReviewState;
}

function requireEditableCase(caseId: CaseId): OwnedCaseContext {
  const session = mockStore.getSession();
  if (!session) throw new UnauthorizedError();
  const state = mockStore.getState();
  const record = state.cases.find((item) => item.id === caseId);
  if (!record) throw new NotFoundError("Case not found.");
  if (!canEditReview(record, session.reviewer.id)) {
    throw new ForbiddenError("You do not have edit access to this case.");
  }
  const reviewState = state.reviewStates[caseId];
  if (!reviewState) throw new NotFoundError("Review state not found.");
  return { record, reviewer: session.reviewer, reviewState };
}

type ReviewActivityType =
  | "NOTE_ADDED"
  | "CRITERION_OVERRIDDEN"
  | "REVIEW_PROGRESS_SAVED"
  | "FINAL_DECISION_SUBMITTED"
  | "CASE_STATUS_CHANGED";

function recordActivity(
  caseId: CaseId,
  event: { type: ReviewActivityType; actorName: string; description: string },
): void {
  const state = mockStore.getState();
  const now = new Date().toISOString();
  state.activity[caseId] = [
    ...(state.activity[caseId] ?? []),
    {
      id: `${caseId}-act-${event.type}-${now}`,
      type: event.type,
      actor: "REVIEWER",
      actorName: event.actorName,
      occurredAt: now,
      description: event.description,
    },
  ];
}

export class MockReviewService implements ReviewService {
  async getReviewState(caseId: CaseId): Promise<ReviewState> {
    await delay(300);
    if (!mockStore.getSession()) throw new UnauthorizedError();
    const reviewState = mockStore.getState().reviewStates[caseId];
    if (!reviewState) throw new NotFoundError("Review state not found.");
    return clone(reviewState);
  }

  async saveProgress(caseId: CaseId, input: SaveReviewProgressInput): Promise<ReviewState> {
    await delay(420);
    const { reviewState, reviewer } = requireEditableCase(caseId);
    reviewState.draftSummary = input.draftSummary;
    reviewState.lastSavedAt = new Date().toISOString();
    recordActivity(caseId, {
      type: "REVIEW_PROGRESS_SAVED",
      actorName: reviewer.displayName,
      description: "Reviewer saved draft review progress.",
    });
    return clone(reviewState);
  }

  async addNote(caseId: CaseId, input: { body: string }): Promise<ReviewerNote> {
    await delay(360);
    const { reviewState, reviewer, record } = requireEditableCase(caseId);
    const validation = validateNoteBody(input.body);
    if (!validation.ok) throw new ValidationError(validation.message);

    const note: ReviewerNote = {
      id: `${caseId}-note-${reviewState.notes.length + 1}-${Date.now()}`,
      body: input.body.trim(),
      author: reviewer,
      createdAt: new Date().toISOString(),
      caseStatusAtCreation: record.status,
    };
    reviewState.notes = [...reviewState.notes, note];
    recordActivity(caseId, {
      type: "NOTE_ADDED",
      actorName: reviewer.displayName,
      description: "Reviewer added an immutable note.",
    });
    return clone(note);
  }

  async overrideCriterion(caseId: CaseId, input: CriterionOverrideInput): Promise<ReviewState> {
    await delay(420);
    const { reviewState, reviewer } = requireEditableCase(caseId);
    const validation = validateOverrideReason(input.reason);
    if (!validation.ok) throw new ValidationError(validation.message);

    const existing = reviewState.overrides.find((item) => item.criterionId === input.criterionId);
    const next = {
      criterionId: input.criterionId,
      status: input.status,
      reason: input.reason.trim(),
      reviewer,
      createdAt: new Date().toISOString(),
      attachedEvidenceIds: input.attachedEvidenceIds ?? existing?.attachedEvidenceIds ?? [],
    };
    reviewState.overrides = existing
      ? reviewState.overrides.map((item) => (item.criterionId === input.criterionId ? next : item))
      : [...reviewState.overrides, next];

    recordActivity(caseId, {
      type: "CRITERION_OVERRIDDEN",
      actorName: reviewer.displayName,
      description: "Reviewer recorded an assessment that differs from the AI output.",
    });
    return clone(reviewState);
  }

  async submitFinalDecision(caseId: CaseId, input: FinalDecisionInput): Promise<ReviewState> {
    await delay(560);
    const { reviewState, reviewer, record } = requireEditableCase(caseId);
    if (reviewState.finalDecision) {
      throw new ForbiddenError("A final decision has already been submitted for this case.");
    }

    const currentAnalysis = (mockStore.getState().analyses[caseId] ?? []).find(
      (item) => item.isCurrent,
    );
    const hasOverrideAgainstRecommendation = reviewState.overrides.some((override) => {
      const assessment = currentAnalysis?.assessments.find(
        (item) => item.criterionId === override.criterionId,
      );
      return assessment ? assessment.status !== override.status : false;
    });

    const validation = validateFinalDecision(
      {
        decision: input.decision,
        rationale: input.rationale,
        missingInformation: input.missingInformation ?? "",
      },
      { hasOverrideAgainstRecommendation },
    );
    if (!validation.ok) throw new ValidationError(validation.message);

    const submittedAt = new Date().toISOString();
    const missingInformation = input.missingInformation?.trim();
    reviewState.finalDecision = {
      decision: input.decision,
      rationale: input.rationale.trim(),
      submittedAt,
      reviewer,
      ...(missingInformation ? { missingInformation } : {}),
    };
    reviewState.lastSavedAt = submittedAt;

    const nextStatus =
      input.decision === "ESCALATE_FOR_PHYSICIAN_REVIEW"
        ? "PENDING_PHYSICIAN_REVIEW"
        : input.decision === "REQUEST_MORE_INFORMATION"
          ? "NEEDS_MORE_INFORMATION"
          : "COMPLETED";
    record.status = nextStatus;
    record.updatedAt = submittedAt;

    recordActivity(caseId, {
      type: "FINAL_DECISION_SUBMITTED",
      actorName: reviewer.displayName,
      description: "Reviewer submitted a final decision.",
    });
    recordActivity(caseId, {
      type: "CASE_STATUS_CHANGED",
      actorName: reviewer.displayName,
      description: `Case status changed to ${nextStatus}.`,
    });
    return clone(reviewState);
  }
}

import type { CriterionStatus, ReviewerDecision } from "./enums";

export type ValidationResult = { ok: true } | { ok: false; message: string };

const ok: ValidationResult = { ok: true };

function requireText(value: string, message: string, minLength = 10): ValidationResult {
  return value.trim().length >= minLength ? ok : { ok: false, message };
}

export function validateOverrideReason(reason: string): ValidationResult {
  return requireText(
    reason,
    "An override reason is required and must explain the disagreement with the AI assessment.",
  );
}

export interface FinalDecisionDraft {
  decision: ReviewerDecision | null;
  rationale: string;
  missingInformation: string;
}

export interface FinalDecisionContext {
  hasOverrideAgainstRecommendation: boolean;
}

export function validateFinalDecision(
  draft: FinalDecisionDraft,
  context: FinalDecisionContext,
): ValidationResult {
  if (!draft.decision) {
    return { ok: false, message: "Select a decision before continuing." };
  }
  switch (draft.decision) {
    case "DENY":
      return requireText(draft.rationale, "A denial rationale is required.");
    case "ESCALATE_FOR_PHYSICIAN_REVIEW":
      return requireText(draft.rationale, "An escalation rationale is required.");
    case "REQUEST_MORE_INFORMATION":
      return requireText(
        draft.missingInformation,
        "Describe the specific documentation that is missing.",
      );
    case "APPROVE":
      return context.hasOverrideAgainstRecommendation
        ? requireText(
            draft.rationale,
            "An approval rationale is required because your assessment differs from the AI recommendation.",
          )
        : ok;
  }
}

export function validateNoteBody(body: string): ValidationResult {
  return body.trim().length > 0 ? ok : { ok: false, message: "A note cannot be empty." };
}

export function isCriterionStatusChange(
  aiStatus: CriterionStatus,
  overrideStatus: CriterionStatus,
): boolean {
  return aiStatus !== overrideStatus;
}

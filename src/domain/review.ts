import type { CriterionAssessment, CriterionOverride } from "./models";

/**
 * Single source of truth for "does the reviewer disagree with the AI?".
 * Used by the decision UI and by the review service when validating a
 * submission, so both sides derive the flag identically.
 */
export function hasOverrideAgainstRecommendation(
  assessments: readonly CriterionAssessment[] | undefined,
  overrides: readonly Pick<CriterionOverride, "criterionId" | "status">[],
): boolean {
  return overrides.some((override) => {
    const assessment = assessments?.find((item) => item.criterionId === override.criterionId);
    return assessment ? assessment.status !== override.status : false;
  });
}

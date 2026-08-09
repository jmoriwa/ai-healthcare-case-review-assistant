import type { CaseStatus } from "./enums";
import type { CaseSummary, ReviewerId } from "./models";

export type CaseAccessMode = "EDITABLE" | "READ_ONLY";

export type ReadOnlyReason =
  | "AWAITING_ANALYSIS"
  | "UNCLAIMED"
  | "ANALYSIS_FAILED"
  | "OTHER_REVIEWER"
  | "TERMINAL";

const TERMINAL_STATUSES: CaseStatus[] = ["COMPLETED", "PENDING_PHYSICIAN_REVIEW"];

export function isTerminalStatus(status: CaseStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function isOwnedBy(caseSummary: CaseSummary, reviewerId: ReviewerId | undefined): boolean {
  return Boolean(reviewerId) && caseSummary.assignedReviewer?.id === reviewerId;
}

export function canClaimCase(
  caseSummary: CaseSummary,
  reviewerId: ReviewerId | undefined,
): boolean {
  return (
    Boolean(reviewerId) &&
    caseSummary.status === "READY_FOR_REVIEW" &&
    caseSummary.assignedReviewer === null
  );
}

export function canEditReview(
  caseSummary: CaseSummary,
  reviewerId: ReviewerId | undefined,
): boolean {
  if (!isOwnedBy(caseSummary, reviewerId)) return false;
  return caseSummary.status === "IN_REVIEW" || caseSummary.status === "NEEDS_MORE_INFORMATION";
}

export function getReadOnlyReason(
  caseSummary: CaseSummary,
  reviewerId: ReviewerId | undefined,
): ReadOnlyReason | null {
  if (canEditReview(caseSummary, reviewerId)) return null;
  if (isTerminalStatus(caseSummary.status)) return "TERMINAL";
  if (caseSummary.status === "ANALYSIS_FAILED") return "ANALYSIS_FAILED";
  if (caseSummary.status === "PENDING_ANALYSIS" || caseSummary.status === "ANALYZING") {
    return "AWAITING_ANALYSIS";
  }
  if (caseSummary.assignedReviewer && !isOwnedBy(caseSummary, reviewerId)) return "OTHER_REVIEWER";
  return "UNCLAIMED";
}

export function describeReadOnlyReason(
  reason: ReadOnlyReason,
  assignedReviewerName?: string,
): string {
  switch (reason) {
    case "OTHER_REVIEWER":
      return `Claimed by ${assignedReviewerName ?? "another reviewer"}. You have read-only access.`;
    case "TERMINAL":
      return "This case is closed and read-only.";
    case "ANALYSIS_FAILED":
      return "AI analysis could not be completed. This case is not available for review.";
    case "AWAITING_ANALYSIS":
      return "AI analysis has not finished. This case is not yet available for review.";
    case "UNCLAIMED":
      return "Claim this case to record a review.";
  }
}

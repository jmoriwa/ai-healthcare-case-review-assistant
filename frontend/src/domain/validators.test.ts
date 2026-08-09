import { describe, expect, it } from "vitest";
import {
  isCriterionStatusChange,
  validateFinalDecision,
  validateNoteBody,
  validateOverrideReason,
  type FinalDecisionDraft,
} from "@/domain/validators";

function draft(overrides: Partial<FinalDecisionDraft> = {}): FinalDecisionDraft {
  return { decision: null, rationale: "", missingInformation: "", ...overrides };
}

const LONG = "The imaging report does not document the required conservative therapy.";

describe("criterion override reason", () => {
  it("requires a substantive reason", () => {
    expect(validateOverrideReason("").ok).toBe(false);
    expect(validateOverrideReason("   ").ok).toBe(false);
    expect(validateOverrideReason("nope").ok).toBe(false);
  });

  it("accepts a reason that explains the disagreement", () => {
    expect(validateOverrideReason(LONG).ok).toBe(true);
  });

  it("detects when a reviewer status differs from the AI status", () => {
    expect(isCriterionStatusChange("SUPPORTED", "NOT_SUPPORTED")).toBe(true);
    expect(isCriterionStatusChange("SUPPORTED", "SUPPORTED")).toBe(false);
  });
});

describe("final decision validation", () => {
  const noOverride = { hasOverrideAgainstRecommendation: false };
  const withOverride = { hasOverrideAgainstRecommendation: true };

  it("requires a decision to be selected", () => {
    expect(validateFinalDecision(draft(), noOverride).ok).toBe(false);
  });

  it("always requires a rationale for Deny", () => {
    expect(validateFinalDecision(draft({ decision: "DENY" }), noOverride).ok).toBe(false);
    expect(validateFinalDecision(draft({ decision: "DENY", rationale: LONG }), noOverride).ok).toBe(
      true,
    );
  });

  it("always requires a rationale for Escalate", () => {
    const d = "ESCALATE_FOR_PHYSICIAN_REVIEW" as const;
    expect(validateFinalDecision(draft({ decision: d }), noOverride).ok).toBe(false);
    expect(validateFinalDecision(draft({ decision: d, rationale: LONG }), noOverride).ok).toBe(
      true,
    );
  });

  it("requires missing-document details for Request More Information", () => {
    const d = "REQUEST_MORE_INFORMATION" as const;
    expect(validateFinalDecision(draft({ decision: d, rationale: LONG }), noOverride).ok).toBe(
      false,
    );
    expect(
      validateFinalDecision(draft({ decision: d, missingInformation: LONG }), noOverride).ok,
    ).toBe(true);
  });

  it("allows Approve without a rationale when the reviewer agrees with the AI", () => {
    expect(validateFinalDecision(draft({ decision: "APPROVE" }), noOverride).ok).toBe(true);
  });

  it("requires a rationale for Approve when the reviewer overrode the AI", () => {
    expect(validateFinalDecision(draft({ decision: "APPROVE" }), withOverride).ok).toBe(false);
    expect(
      validateFinalDecision(draft({ decision: "APPROVE", rationale: LONG }), withOverride).ok,
    ).toBe(true);
  });
});

describe("note validation", () => {
  it("rejects empty notes and accepts short substantive ones", () => {
    expect(validateNoteBody("   ").ok).toBe(false);
    expect(validateNoteBody("Verified PT records.").ok).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import type { CaseStatus } from "@/domain/enums";
import type { CaseSummary, Reviewer } from "@/domain/models";
import {
  canClaimCase,
  canEditReview,
  describeReadOnlyReason,
  getReadOnlyReason,
  isTerminalStatus,
} from "@/domain/permissions";

const owner: Reviewer = {
  id: "rvw-a",
  email: "a@example.test",
  displayName: "Avery",
  isActive: true,
};
const other: Reviewer = {
  id: "rvw-b",
  email: "b@example.test",
  displayName: "Morgan",
  isActive: true,
};

function makeCase(status: CaseStatus, assignedReviewer: Reviewer | null = null): CaseSummary {
  return {
    id: "case-1",
    caseNumber: "PA-1001",
    patient: {
      id: "p1",
      displayName: "Test Patient",
      birthDate: "1970-01-01",
      sex: "female",
      fhirPatientId: "fhir-1",
    },
    procedureType: "LUMBAR_SPINE_MRI",
    status,
    assignedReviewer,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("claiming", () => {
  it("allows claiming an unassigned case that is ready for review", () => {
    expect(canClaimCase(makeCase("READY_FOR_REVIEW"), owner.id)).toBe(true);
  });

  it("rejects claiming a case already assigned to someone else", () => {
    expect(canClaimCase(makeCase("READY_FOR_REVIEW", other), owner.id)).toBe(false);
  });

  it("rejects claiming a case that is not ready for review", () => {
    for (const status of ["PENDING_ANALYSIS", "ANALYZING", "ANALYSIS_FAILED"] as CaseStatus[]) {
      expect(canClaimCase(makeCase(status), owner.id)).toBe(false);
    }
  });

  it("rejects claiming when signed out", () => {
    expect(canClaimCase(makeCase("READY_FOR_REVIEW"), undefined)).toBe(false);
  });
});

describe("edit access", () => {
  it("grants edit access to the owning reviewer while in review", () => {
    expect(canEditReview(makeCase("IN_REVIEW", owner), owner.id)).toBe(true);
    expect(canEditReview(makeCase("NEEDS_MORE_INFORMATION", owner), owner.id)).toBe(true);
  });

  it("gives another reviewer read-only access to a claimed case", () => {
    const claimed = makeCase("IN_REVIEW", other);
    expect(canEditReview(claimed, owner.id)).toBe(false);
    expect(getReadOnlyReason(claimed, owner.id)).toBe("OTHER_REVIEWER");
    expect(describeReadOnlyReason("OTHER_REVIEWER", other.displayName)).toContain("Morgan");
  });

  it("treats Completed and Pending Physician Review as terminal read-only states", () => {
    for (const status of ["COMPLETED", "PENDING_PHYSICIAN_REVIEW"] as CaseStatus[]) {
      expect(isTerminalStatus(status)).toBe(true);
      const terminal = makeCase(status, owner);
      expect(canEditReview(terminal, owner.id)).toBe(false);
      expect(getReadOnlyReason(terminal, owner.id)).toBe("TERMINAL");
    }
  });

  it("keeps failed-analysis cases read-only with a specific reason", () => {
    const failed = makeCase("ANALYSIS_FAILED", owner);
    expect(canEditReview(failed, owner.id)).toBe(false);
    expect(getReadOnlyReason(failed, owner.id)).toBe("ANALYSIS_FAILED");
    expect(describeReadOnlyReason("ANALYSIS_FAILED")).not.toContain("undefined");
  });

  it("reports unclaimed cases as claimable rather than blocked", () => {
    expect(getReadOnlyReason(makeCase("READY_FOR_REVIEW"), owner.id)).toBe("UNCLAIMED");
  });

  it("reports pre-analysis cases as awaiting analysis", () => {
    expect(getReadOnlyReason(makeCase("PENDING_ANALYSIS"), owner.id)).toBe("AWAITING_ANALYSIS");
    expect(getReadOnlyReason(makeCase("ANALYZING"), owner.id)).toBe("AWAITING_ANALYSIS");
  });
});

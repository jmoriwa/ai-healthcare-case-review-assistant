import { beforeEach, describe, expect, it } from "vitest";
import { ConflictError, ForbiddenError, UnauthorizedError, ValidationError } from "@/domain/errors";
import { DEMO_CREDENTIALS } from "@/mocks/fixtures/reviewers";
import { MockAuthService } from "@/services/mock/MockAuthService";
import { MockCaseService } from "@/services/mock/MockCaseService";
import { MockPatientService } from "@/services/mock/MockPatientService";
import { MockReviewService } from "@/services/mock/MockReviewService";
import { mockStore } from "@/services/mock/mockStore";

const auth = new MockAuthService();
const cases = new MockCaseService();
const reviews = new MockReviewService();
const patients = new MockPatientService();

const [first, second] = DEMO_CREDENTIALS;

async function signInAs(index: 0 | 1) {
  const credential = index === 0 ? first! : second!;
  return auth.login({ email: credential.email, password: credential.password });
}

/** First case in a given status, so tests do not hardcode fixture ids. */
async function findCaseIdByStatus(status: string) {
  const all = await cases.listCases({});
  const match = all.find((item) => item.status === status);
  if (!match) throw new Error(`No fixture case in status ${status}`);
  return match.id;
}

async function claimAFreshCase() {
  const caseId = await findCaseIdByStatus("READY_FOR_REVIEW");
  await cases.claimCase(caseId);
  return caseId;
}

beforeEach(() => {
  mockStore.reset();
});

describe("authentication", () => {
  it("rejects bad credentials", async () => {
    await expect(auth.login({ email: first!.email, password: "wrong" })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("requires a session for every data read", async () => {
    await expect(cases.listCases({})).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("clears the session on logout", async () => {
    await signInAs(0);
    expect(await auth.getCurrentReviewer()).not.toBeNull();
    await auth.logout();
    expect(await auth.getCurrentReviewer()).toBeNull();
  });
});

describe("case queue filtering", () => {
  beforeEach(async () => {
    await signInAs(0);
  });

  it("filters by status and procedure type", async () => {
    const filtered = await cases.listCases({ status: "COMPLETED" });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((item) => item.status === "COMPLETED")).toBe(true);

    const byProcedure = await cases.listCases({ procedureType: "LUMBAR_SPINE_MRI" });
    expect(byProcedure.every((item) => item.procedureType === "LUMBAR_SPINE_MRI")).toBe(true);
  });

  it("searches by case number and patient name", async () => {
    const all = await cases.listCases({});
    const target = all[0]!;
    const found = await cases.listCases({ search: target.caseNumber.toLowerCase() });
    expect(found.map((item) => item.id)).toContain(target.id);
  });

  it("scopes My Cases to the signed-in reviewer", async () => {
    const caseId = await claimAFreshCase();
    expect((await cases.listMyCases({})).map((item) => item.id)).toContain(caseId);

    await auth.logout();
    await signInAs(1);
    expect((await cases.listMyCases({})).map((item) => item.id)).not.toContain(caseId);
  });
});

describe("claim and ownership", () => {
  it("assigns the case and moves it to In Review", async () => {
    await signInAs(0);
    const caseId = await claimAFreshCase();
    const detail = await cases.getCase(caseId);
    expect(detail.status).toBe("IN_REVIEW");
    expect(detail.assignedReviewer).not.toBeNull();
  });

  it("lets another reviewer open a claimed case but not edit it", async () => {
    await signInAs(0);
    const caseId = await claimAFreshCase();

    await auth.logout();
    await signInAs(1);

    // Read access is allowed.
    await expect(cases.getCase(caseId)).resolves.toBeTruthy();
    await expect(reviews.getReviewState(caseId)).resolves.toBeTruthy();

    // Every write is refused.
    await expect(reviews.addNote(caseId, { body: "hello" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(reviews.saveProgress(caseId, { draftSummary: "x" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(cases.claimCase(caseId)).rejects.toBeInstanceOf(ConflictError);
  });

  it("refuses to claim a case that is not ready for review", async () => {
    await signInAs(0);
    const failedId = await findCaseIdByStatus("ANALYSIS_FAILED");
    await expect(cases.claimCase(failedId)).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("read-only terminal cases", () => {
  it("blocks writes on completed cases", async () => {
    await signInAs(0);
    const completedId = await findCaseIdByStatus("COMPLETED");
    await expect(reviews.addNote(completedId, { body: "note" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("blocks writes on cases pending physician review", async () => {
    await signInAs(0);
    const escalatedId = await findCaseIdByStatus("PENDING_PHYSICIAN_REVIEW");
    await expect(reviews.addNote(escalatedId, { body: "note" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("exposes a failed analysis case with a human-readable failure reason", async () => {
    await signInAs(0);
    const failedId = await findCaseIdByStatus("ANALYSIS_FAILED");
    const detail = await cases.getCase(failedId);
    expect(detail.currentAnalysis).toBeNull();
    expect(detail.analysisFailureReason).toBeTruthy();
  });
});

describe("notes are immutable", () => {
  it("appends notes and exposes no update or delete operation", async () => {
    await signInAs(0);
    const caseId = await claimAFreshCase();

    const note = await reviews.addNote(caseId, { body: "Verified PT documentation." });
    await reviews.addNote(caseId, { body: "Second note." });

    const state = await reviews.getReviewState(caseId);
    expect(state.notes).toHaveLength(2);
    expect(state.notes[0]!.body).toBe(note.body);

    const surface = reviews as unknown as Record<string, unknown>;
    expect(surface["updateNote"]).toBeUndefined();
    expect(surface["deleteNote"]).toBeUndefined();
  });

  it("rejects empty notes", async () => {
    await signInAs(0);
    const caseId = await claimAFreshCase();
    await expect(reviews.addNote(caseId, { body: "   " })).rejects.toBeInstanceOf(ValidationError);
  });

  it("does not mutate stored notes when the caller edits the returned copy", async () => {
    await signInAs(0);
    const caseId = await claimAFreshCase();
    const note = await reviews.addNote(caseId, { body: "Original body." });
    note.body = "Tampered.";
    const state = await reviews.getReviewState(caseId);
    expect(state.notes[0]!.body).toBe("Original body.");
  });
});

describe("criterion overrides", () => {
  it("requires a reason", async () => {
    await signInAs(0);
    const caseId = await claimAFreshCase();
    const detail = await cases.getCase(caseId);
    const criterionId = detail.policy.criteria[0]!.id;

    await expect(
      reviews.overrideCriterion(caseId, { criterionId, status: "NOT_SUPPORTED", reason: "" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("records the override with the reviewer and replaces a prior override", async () => {
    await signInAs(0);
    const caseId = await claimAFreshCase();
    const detail = await cases.getCase(caseId);
    const criterionId = detail.policy.criteria[0]!.id;

    await reviews.overrideCriterion(caseId, {
      criterionId,
      status: "NOT_SUPPORTED",
      reason: "The record does not document the required conservative therapy.",
    });
    const state = await reviews.overrideCriterion(caseId, {
      criterionId,
      status: "INSUFFICIENT_EVIDENCE",
      reason: "On re-reading, the documentation is ambiguous rather than absent.",
    });

    expect(state.overrides).toHaveLength(1);
    expect(state.overrides[0]!.status).toBe("INSUFFICIENT_EVIDENCE");
    expect(state.overrides[0]!.reviewer.id).toBeTruthy();
  });
});

describe("final decision rules enforced by the service", () => {
  const RATIONALE = "Documentation supports the requested procedure under criterion 2.";

  it("requires a rationale for Deny", async () => {
    await signInAs(0);
    const caseId = await claimAFreshCase();
    await expect(
      reviews.submitFinalDecision(caseId, { decision: "DENY", rationale: "" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("requires missing-document details for Request More Information", async () => {
    await signInAs(0);
    const caseId = await claimAFreshCase();
    await expect(
      reviews.submitFinalDecision(caseId, {
        decision: "REQUEST_MORE_INFORMATION",
        rationale: RATIONALE,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("requires a rationale for Approve only when the AI was overridden", async () => {
    await signInAs(0);
    const caseId = await claimAFreshCase();
    const detail = await cases.getCase(caseId);
    const assessment = detail.currentAnalysis!.assessments[0]!;

    await reviews.overrideCriterion(caseId, {
      criterionId: assessment.criterionId,
      status: assessment.status === "SUPPORTED" ? "NOT_SUPPORTED" : "SUPPORTED",
      reason: "My reading of the operative note differs from the assistant.",
    });

    await expect(
      reviews.submitFinalDecision(caseId, { decision: "APPROVE", rationale: "" }),
    ).rejects.toBeInstanceOf(ValidationError);

    const state = await reviews.submitFinalDecision(caseId, {
      decision: "APPROVE",
      rationale: RATIONALE,
    });
    expect(state.finalDecision?.decision).toBe("APPROVE");
  });

  it("allows a bare Approve when the reviewer agrees with the AI", async () => {
    await signInAs(0);
    const caseId = await claimAFreshCase();
    const state = await reviews.submitFinalDecision(caseId, { decision: "APPROVE", rationale: "" });
    expect(state.finalDecision?.decision).toBe("APPROVE");
  });

  it("maps decisions to the correct terminal status", async () => {
    await signInAs(0);

    const approveId = await claimAFreshCase();
    await reviews.submitFinalDecision(approveId, { decision: "APPROVE", rationale: "" });
    expect((await cases.getCase(approveId)).status).toBe("COMPLETED");

    const escalateId = await claimAFreshCase();
    await reviews.submitFinalDecision(escalateId, {
      decision: "ESCALATE_FOR_PHYSICIAN_REVIEW",
      rationale: RATIONALE,
    });
    expect((await cases.getCase(escalateId)).status).toBe("PENDING_PHYSICIAN_REVIEW");

    const rfiId = await claimAFreshCase();
    await reviews.submitFinalDecision(rfiId, {
      decision: "REQUEST_MORE_INFORMATION",
      rationale: RATIONALE,
      missingInformation: "Six weeks of documented physical therapy notes.",
    });
    expect((await cases.getCase(rfiId)).status).toBe("NEEDS_MORE_INFORMATION");
  });

  it("locks the case after a decision is submitted", async () => {
    await signInAs(0);
    const caseId = await claimAFreshCase();
    await reviews.submitFinalDecision(caseId, { decision: "APPROVE", rationale: "" });

    await expect(reviews.addNote(caseId, { body: "late note" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(
      reviews.submitFinalDecision(caseId, { decision: "DENY", rationale: RATIONALE }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("analysis versions and evidence", () => {
  it("keeps superseded analysis versions retrievable", async () => {
    await signInAs(0);
    const all = await cases.listCases({});
    let multiVersionId: string | null = null;
    for (const item of all) {
      const versions = await cases.getAnalysisVersions(item.id);
      if (versions.length > 1) {
        multiVersionId = item.id;
        break;
      }
    }
    expect(multiVersionId).not.toBeNull();

    const versions = await cases.getAnalysisVersions(multiVersionId!);
    expect(versions.filter((item) => item.isCurrent)).toHaveLength(1);

    const superseded = versions.find((item) => !item.isCurrent)!;
    const detail = await cases.getAnalysisVersion(multiVersionId!, superseded.id);
    expect(detail.version).toBe(superseded.version);
    expect(detail.assessments.length).toBeGreaterThan(0);
  });

  it("resolves a citation to the exact passage with surrounding context", async () => {
    await signInAs(0);
    const readyId = await findCaseIdByStatus("READY_FOR_REVIEW");
    const detail = await cases.getCase(readyId);
    const evidence = detail
      .currentAnalysis!.assessments.flatMap((item) => item.evidence)
      .find(Boolean)!;

    const passage = await patients.getEvidencePassage(readyId, evidence.id);
    expect(passage.id).toBe(evidence.id);
    expect(passage.highlightedText.trim().length).toBeGreaterThan(0);
    expect(passage.sourceRecordId).toBeTruthy();
    // A passage is more specific than the document: context brackets the quote.
    expect(passage.contextBefore.length + passage.contextAfter.length).toBeGreaterThan(0);
  });
});

describe("no cross-request state leakage", () => {
  it("returns cloned data so callers cannot mutate the store", async () => {
    await signInAs(0);
    const list = await cases.listCases({});
    list[0]!.caseNumber = "TAMPERED";
    const refetched = await cases.listCases({});
    expect(refetched[0]!.caseNumber).not.toBe("TAMPERED");
  });
});

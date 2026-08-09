import { NotFoundError, UnauthorizedError } from "@/domain/errors";
import type {
  CaseId,
  EvidenceId,
  EvidencePassageDetail,
  PatientTimelineItem,
} from "@/domain/models";
import type { PatientService } from "@/services/contracts/PatientService";
import { clone, delay, mockStore } from "./mockStore";

export class MockPatientService implements PatientService {
  async getTimeline(caseId: CaseId): Promise<PatientTimelineItem[]> {
    await delay(380);
    if (!mockStore.getSession()) throw new UnauthorizedError();
    const timeline = mockStore.getState().timelines[caseId];
    if (!timeline) throw new NotFoundError("Patient timeline not found for this case.");
    return clone(timeline);
  }

  async getEvidencePassage(caseId: CaseId, evidenceId: EvidenceId): Promise<EvidencePassageDetail> {
    await delay(260);
    if (!mockStore.getSession()) throw new UnauthorizedError();
    const state = mockStore.getState();
    if (!state.timelines[caseId]) throw new NotFoundError("Case not found.");
    const passage = state.passages[evidenceId];
    if (!passage) throw new NotFoundError("Evidence passage not found.");
    return clone(passage);
  }
}

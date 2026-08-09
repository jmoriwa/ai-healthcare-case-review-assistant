import { UnauthorizedError } from "@/domain/errors";
import type { QualityReport } from "@/domain/models";
import type { EvaluationService } from "@/services/contracts/EvaluationService";
import { clone, delay, mockStore } from "./mockStore";

export class MockEvaluationService implements EvaluationService {
  async getQualityReport(): Promise<QualityReport> {
    await delay(400);
    if (!mockStore.getSession()) throw new UnauthorizedError();
    return clone(mockStore.getState().quality);
  }
}

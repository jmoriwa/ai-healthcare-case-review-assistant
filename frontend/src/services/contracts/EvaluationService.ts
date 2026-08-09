import type { QualityReport } from "@/domain/models";

export interface EvaluationService {
  getQualityReport(): Promise<QualityReport>;
}

import type { AuthService } from "./contracts/AuthService";
import type { CaseService } from "./contracts/CaseService";
import type { EvaluationService } from "./contracts/EvaluationService";
import type { PatientService } from "./contracts/PatientService";
import type { ReviewService } from "./contracts/ReviewService";
import { MockAuthService } from "./mock/MockAuthService";
import { MockCaseService } from "./mock/MockCaseService";
import { MockEvaluationService } from "./mock/MockEvaluationService";
import { MockPatientService } from "./mock/MockPatientService";
import { MockReviewService } from "./mock/MockReviewService";

export interface Services {
  auth: AuthService;
  cases: CaseService;
  reviews: ReviewService;
  patients: PatientService;
  evaluation: EvaluationService;
}

/**
 * Composition root. Swapping the mock phase for a real backend changes only
 * this file: the contracts and every consumer above stay untouched.
 */
export const services: Services = {
  auth: new MockAuthService(),
  cases: new MockCaseService(),
  reviews: new MockReviewService(),
  patients: new MockPatientService(),
  evaluation: new MockEvaluationService(),
};

import type {
  AIRecommendation,
  ActivityActor,
  ActivityEventType,
  CaseStatus,
  ClinicalRecordType,
  CriterionStatus,
  ProcedureType,
  ReviewerDecision,
} from "./enums";

export type CaseId = string;
export type ReviewerId = string;
export type CriterionId = string;
export type EvidenceId = string;

export interface PageResult<T> {
  items: T[];
  total: number;
}

export interface Reviewer {
  id: ReviewerId;
  email: string;
  displayName: string;
  isActive: boolean;
}

export interface AuthSession {
  reviewer: Reviewer;
  token?: string;
}

export interface PatientSummary {
  id: string;
  displayName: string;
  birthDate: string;
  sex: "female" | "male" | "other" | "unknown";
  fhirPatientId: string;
}

export interface CaseSummary {
  id: CaseId;
  caseNumber: string;
  patient: PatientSummary;
  procedureType: ProcedureType;
  status: CaseStatus;
  assignedReviewer: Reviewer | null;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyCriterion {
  id: CriterionId;
  code: string;
  ordinal: number;
  rule: string;
  guidance: string;
}

export interface MedicalPolicySummary {
  id: string;
  name: string;
  version: string;
  effectiveDate: string;
  syntheticDisclaimer: string;
  criteria: PolicyCriterion[];
}

export interface EvidenceReference {
  id: EvidenceId;
  recordLabel: string;
  recordType: ClinicalRecordType;
  occurredAt: string;
  snippet: string;
}

export interface EvidencePassageDetail {
  id: EvidenceId;
  recordLabel: string;
  recordType: ClinicalRecordType;
  occurredAt: string;
  sourceRecordId: string;
  contextBefore: string;
  highlightedText: string;
  contextAfter: string;
}

export interface CriterionAssessment {
  criterionId: CriterionId;
  status: CriterionStatus;
  rationale: string;
  evidence: EvidenceReference[];
}

export interface AIAnalysisSummary {
  id: string;
  version: number;
  generatedAt: string;
  recommendation: AIRecommendation;
  isCurrent: boolean;
}

export interface AIAnalysisDetail extends AIAnalysisSummary {
  overallRationale: string;
  assessments: CriterionAssessment[];
  modelLabel: string;
}

export interface CriterionOverride {
  criterionId: CriterionId;
  status: CriterionStatus;
  reason: string;
  reviewer: Reviewer;
  createdAt: string;
  attachedEvidenceIds: EvidenceId[];
}

export interface ReviewerNote {
  id: string;
  body: string;
  author: Reviewer;
  createdAt: string;
  caseStatusAtCreation: CaseStatus;
}

export interface FinalDecision {
  decision: ReviewerDecision;
  rationale: string;
  missingInformation?: string;
  submittedAt: string;
  reviewer: Reviewer;
}

export interface ReviewState {
  caseId: CaseId;
  draftSummary: string;
  overrides: CriterionOverride[];
  notes: ReviewerNote[];
  finalDecision: FinalDecision | null;
  lastSavedAt: string | null;
}

export interface PatientTimelineItem {
  id: string;
  recordType: ClinicalRecordType;
  occurredAt: string;
  title: string;
  summary: string;
  details: string;
}

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  actor: ActivityActor;
  actorName: string;
  occurredAt: string;
  description: string;
}

export interface CaseDetail extends CaseSummary {
  policy: MedicalPolicySummary;
  currentAnalysis: AIAnalysisDetail | null;
  analysisFailureReason: string | null;
}

export interface CaseFilters {
  search?: string;
  procedureType?: ProcedureType | "ALL";
  status?: CaseStatus | "ALL";
}

export interface SaveReviewProgressInput {
  draftSummary: string;
}

export interface CriterionOverrideInput {
  criterionId: CriterionId;
  status: CriterionStatus;
  reason: string;
  attachedEvidenceIds?: EvidenceId[];
}

export interface FinalDecisionInput {
  decision: ReviewerDecision;
  rationale: string;
  missingInformation?: string;
}

export interface QualityMetric {
  key: string;
  label: string;
  value: string;
  definition: string;
}

export interface QualityFailureExample {
  id: string;
  caseNumber: string;
  procedureType: ProcedureType;
  failureMode: string;
  description: string;
  observedAt: string;
}

export interface QualityReport {
  generatedAt: string;
  analysesEvaluated: number;
  metrics: QualityMetric[];
  failures: QualityFailureExample[];
}

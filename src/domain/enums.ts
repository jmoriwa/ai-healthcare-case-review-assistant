export const PROCEDURE_TYPES = [
  "LUMBAR_SPINE_MRI",
  "CT_CHEST_WITH_CONTRAST",
  "CERVICAL_FUSION_WITH_DISC_REMOVAL",
  "FACET_JOINT_INTERVENTION",
  "RADIATION_THERAPY",
] as const;
export type ProcedureType = (typeof PROCEDURE_TYPES)[number];

export const CASE_STATUSES = [
  "PENDING_ANALYSIS",
  "ANALYZING",
  "READY_FOR_REVIEW",
  "ANALYSIS_FAILED",
  "IN_REVIEW",
  "NEEDS_MORE_INFORMATION",
  "PENDING_PHYSICIAN_REVIEW",
  "COMPLETED",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CRITERION_STATUSES = ["SUPPORTED", "NOT_SUPPORTED", "INSUFFICIENT_EVIDENCE"] as const;
export type CriterionStatus = (typeof CRITERION_STATUSES)[number];

export const AI_RECOMMENDATIONS = [
  "CRITERIA_APPEAR_SATISFIED",
  "CRITERIA_APPEAR_NOT_SATISFIED",
  "ADDITIONAL_DOCUMENTATION_NEEDED",
] as const;
export type AIRecommendation = (typeof AI_RECOMMENDATIONS)[number];

export const REVIEWER_DECISIONS = [
  "APPROVE",
  "DENY",
  "REQUEST_MORE_INFORMATION",
  "ESCALATE_FOR_PHYSICIAN_REVIEW",
] as const;
export type ReviewerDecision = (typeof REVIEWER_DECISIONS)[number];

export type AnalysisJobStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED_RETRYABLE"
  | "FAILED_FINAL";

export type ActivityEventType =
  | "CASE_CREATED"
  | "DOCUMENTATION_INGESTED"
  | "ANALYSIS_QUEUED"
  | "ANALYSIS_STARTED"
  | "ANALYSIS_RETRY"
  | "ANALYSIS_SUCCEEDED"
  | "ANALYSIS_FAILED"
  | "CASE_CLAIMED"
  | "CASE_STATUS_CHANGED"
  | "NOTE_ADDED"
  | "CRITERION_OVERRIDDEN"
  | "REVIEW_PROGRESS_SAVED"
  | "FINAL_DECISION_SUBMITTED"
  | "AI_RECOMMENDATION_OVERRIDDEN";

export type ActivityActor = "SYSTEM" | "AI" | "REVIEWER";

export type ClinicalRecordType =
  | "Encounter"
  | "Condition"
  | "Observation"
  | "MedicationRequest"
  | "Procedure"
  | "DiagnosticReport"
  | "DocumentReference";

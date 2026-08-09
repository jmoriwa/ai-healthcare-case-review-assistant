import type {
  AIRecommendation,
  ActivityEventType,
  CaseStatus,
  ClinicalRecordType,
  CriterionStatus,
  ProcedureType,
  ReviewerDecision,
} from "./enums";

export const PROCEDURE_LABELS: Record<ProcedureType, string> = {
  LUMBAR_SPINE_MRI: "Lumbar Spine MRI",
  CT_CHEST_WITH_CONTRAST: "CT Chest with Contrast",
  CERVICAL_FUSION_WITH_DISC_REMOVAL: "Cervical Fusion with Disc Removal",
  FACET_JOINT_INTERVENTION: "Facet Joint Intervention",
  RADIATION_THERAPY: "Radiation Therapy",
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  PENDING_ANALYSIS: "Pending Analysis",
  ANALYZING: "Analyzing",
  READY_FOR_REVIEW: "Ready for Review",
  ANALYSIS_FAILED: "Analysis Failed",
  IN_REVIEW: "In Review",
  NEEDS_MORE_INFORMATION: "Needs More Information",
  PENDING_PHYSICIAN_REVIEW: "Pending Physician Review",
  COMPLETED: "Completed",
};

export const CRITERION_STATUS_LABELS: Record<CriterionStatus, string> = {
  SUPPORTED: "Supported",
  NOT_SUPPORTED: "Not Supported",
  INSUFFICIENT_EVIDENCE: "Insufficient Evidence",
};

export const AI_RECOMMENDATION_LABELS: Record<AIRecommendation, string> = {
  CRITERIA_APPEAR_SATISFIED: "Criteria Appear Satisfied",
  CRITERIA_APPEAR_NOT_SATISFIED: "Criteria Appear Not Satisfied",
  ADDITIONAL_DOCUMENTATION_NEEDED: "Additional Documentation Needed",
};

export const REVIEWER_DECISION_LABELS: Record<ReviewerDecision, string> = {
  APPROVE: "Approve",
  DENY: "Deny",
  REQUEST_MORE_INFORMATION: "Request More Information",
  ESCALATE_FOR_PHYSICIAN_REVIEW: "Escalate for Physician Review",
};

export const RECORD_TYPE_LABELS: Record<ClinicalRecordType, string> = {
  Encounter: "Encounter",
  Condition: "Condition",
  Observation: "Observation / Lab",
  MedicationRequest: "Medication Request",
  Procedure: "Procedure",
  DiagnosticReport: "Diagnostic Report",
  DocumentReference: "Clinical Note",
};

export const ACTIVITY_EVENT_LABELS: Record<ActivityEventType, string> = {
  CASE_CREATED: "Case created",
  DOCUMENTATION_INGESTED: "Documentation ingested",
  ANALYSIS_QUEUED: "Analysis queued",
  ANALYSIS_STARTED: "Analysis started",
  ANALYSIS_RETRY: "Analysis retried",
  ANALYSIS_SUCCEEDED: "Analysis succeeded",
  ANALYSIS_FAILED: "Analysis failed",
  CASE_CLAIMED: "Case claimed",
  CASE_STATUS_CHANGED: "Status changed",
  NOTE_ADDED: "Note added",
  CRITERION_OVERRIDDEN: "Criterion overridden",
  REVIEW_PROGRESS_SAVED: "Review progress saved",
  FINAL_DECISION_SUBMITTED: "Final decision submitted",
  AI_RECOMMENDATION_OVERRIDDEN: "AI recommendation overridden",
};

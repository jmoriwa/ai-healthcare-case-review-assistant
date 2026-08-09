import type { ClinicalRecordType, CriterionStatus } from "@/domain/enums";
import type {
  AIAnalysisDetail,
  ActivityEvent,
  CaseSummary,
  CriterionAssessment,
  EvidencePassageDetail,
  EvidenceReference,
  PatientTimelineItem,
  QualityReport,
  Reviewer,
  ReviewState,
} from "@/domain/models";
import { PROCEDURE_LABELS } from "@/domain/labels";
import { CASE_SEEDS, type CaseSeed } from "./caseSeeds";
import { POLICY_FIXTURES } from "./policies";
import { REVIEWER_FIXTURES } from "./reviewers";

export interface MockState {
  reviewers: Reviewer[];
  cases: CaseSummary[];
  analyses: Record<string, AIAnalysisDetail[]>;
  reviewStates: Record<string, ReviewState>;
  timelines: Record<string, PatientTimelineItem[]>;
  activity: Record<string, ActivityEvent[]>;
  passages: Record<string, EvidencePassageDetail>;
  analysisFailureReasons: Record<string, string>;
  quality: QualityReport;
}

const STATUS_PATTERNS: Record<0 | 1 | 2, CriterionStatus[]> = {
  0: ["SUPPORTED", "SUPPORTED", "SUPPORTED", "SUPPORTED", "SUPPORTED"],
  1: ["SUPPORTED", "NOT_SUPPORTED", "SUPPORTED", "SUPPORTED", "NOT_SUPPORTED"],
  2: ["SUPPORTED", "INSUFFICIENT_EVIDENCE", "SUPPORTED", "INSUFFICIENT_EVIDENCE", "SUPPORTED"],
};

const RATIONALES: Record<CriterionStatus, string> = {
  SUPPORTED:
    "Retrieved passages contain a dated statement that matches the requirement in this criterion.",
  NOT_SUPPORTED:
    "Retrieved passages contain a dated statement that directly conflicts with the requirement in this criterion.",
  INSUFFICIENT_EVIDENCE:
    "No retrieved passage states the fact this criterion requires. Absence of a supporting passage is not proof the fact is untrue.",
};

const TIMELINE_TEMPLATES: Array<{
  recordType: ClinicalRecordType;
  title: string;
  summary: string;
  details: string;
}> = [
  {
    recordType: "Encounter",
    title: "Primary care office visit",
    summary: "Routine follow-up for ongoing musculoskeletal complaint.",
    details:
      "Synthetic encounter record. Patient reports continued discomfort. Functional limitations discussed and a follow-up interval agreed.",
  },
  {
    recordType: "Condition",
    title: "Chronic pain, documented onset",
    summary: "Coded condition with a recorded onset date.",
    details: "Synthetic condition record with clinical status active and a verified onset date.",
  },
  {
    recordType: "Observation",
    title: "Basic metabolic panel",
    summary: "Creatinine and electrolytes within reference range.",
    details:
      "Synthetic laboratory result. Creatinine 0.9 mg/dL, eGFR above 90. Collected during a routine draw.",
  },
  {
    recordType: "MedicationRequest",
    title: "Anti-inflammatory medication order",
    summary: "Scheduled course with a documented review date.",
    details: "Synthetic medication order with prescriber instructions and a stated duration.",
  },
  {
    recordType: "Procedure",
    title: "Physical therapy session",
    summary: "Session logged as part of a structured therapy course.",
    details:
      "Synthetic procedure record documenting attendance and an outcome statement from the therapist.",
  },
  {
    recordType: "DiagnosticReport",
    title: "Plain radiograph report",
    summary: "Imaging reviewed by the radiologist with a documented impression.",
    details:
      "Synthetic diagnostic report. Impression notes degenerative change without acute finding.",
  },
  {
    recordType: "DocumentReference",
    title: "Specialist consultation note",
    summary: "Narrative assessment and plan authored by the consulting clinician.",
    details:
      "Synthetic clinical note describing examination findings, prior treatment, and the proposed next step.",
  },
  {
    recordType: "Encounter",
    title: "Telehealth check-in",
    summary: "Brief virtual visit unrelated to the requested service.",
    details: "Synthetic encounter record covering an unrelated seasonal complaint.",
  },
  {
    recordType: "Observation",
    title: "Vital signs recorded",
    summary: "Routine vitals captured at intake.",
    details: "Synthetic observation record. Blood pressure, pulse, and temperature within range.",
  },
  {
    recordType: "DocumentReference",
    title: "Administrative correspondence",
    summary: "Non-clinical letter stored with the record.",
    details: "Synthetic document reference containing scheduling correspondence only.",
  },
  {
    recordType: "Condition",
    title: "Historical resolved condition",
    summary: "Condition marked resolved several years ago.",
    details: "Synthetic condition record retained for history; not relevant to the current request.",
  },
  {
    recordType: "Procedure",
    title: "Prior diagnostic injection",
    summary: "Procedure performed with a documented response interval.",
    details:
      "Synthetic procedure record noting the level treated and the duration of reported relief.",
  },
];

function timelineDate(caseIndex: number, offset: number): string {
  const date = new Date(Date.UTC(2026, 0, 5, 9, 0, 0));
  date.setUTCDate(date.getUTCDate() + caseIndex * 3 + offset * 11);
  return date.toISOString();
}

function shiftHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString();
}

function buildTimeline(seed: CaseSeed, caseIndex: number): PatientTimelineItem[] {
  const count = 8 + (caseIndex % 5) * 4;
  return Array.from({ length: Math.min(count, 25) }, (_, itemIndex) => {
    const template = TIMELINE_TEMPLATES[(itemIndex + caseIndex) % TIMELINE_TEMPLATES.length]!;
    return {
      id: `${seed.id}-tl-${itemIndex + 1}`,
      recordType: template.recordType,
      occurredAt: timelineDate(caseIndex, itemIndex),
      title: template.title,
      summary: template.summary,
      details: template.details,
    };
  }).reverse();
}

function buildEvidence(
  seed: CaseSeed,
  criterionCode: string,
  status: CriterionStatus,
  timeline: PatientTimelineItem[],
  index: number,
): { references: EvidenceReference[]; passages: EvidencePassageDetail[] } {
  if (status === "INSUFFICIENT_EVIDENCE") {
    return { references: [], passages: [] };
  }
  const count = status === "SUPPORTED" ? 2 : 1;
  const references: EvidenceReference[] = [];
  const passages: EvidencePassageDetail[] = [];

  for (let n = 0; n < count; n += 1) {
    const source = timeline[(index * 2 + n) % timeline.length]!;
    const id = `${seed.id}-${criterionCode}-ev${n + 1}`;
    const highlighted =
      status === "SUPPORTED"
        ? "Symptoms have persisted beyond the documented threshold despite the completed conservative course."
        : "The documented interval falls short of the duration this requirement specifies.";
    references.push({
      id,
      recordLabel: source.title,
      recordType: source.recordType,
      occurredAt: source.occurredAt,
      snippet: highlighted,
    });
    passages.push({
      id,
      recordLabel: source.title,
      recordType: source.recordType,
      occurredAt: source.occurredAt,
      sourceRecordId: source.id,
      contextBefore:
        "Synthetic excerpt. The clinician summarised the interval history and reviewed prior management before the passage below. ",
      highlightedText: highlighted,
      contextAfter:
        " The remainder of the note covers unrelated preventive care topics and scheduling for the next visit.",
    });
  }
  return { references, passages };
}

function buildAnalyses(
  seed: CaseSeed,
  timeline: PatientTimelineItem[],
): { analyses: AIAnalysisDetail[]; passages: EvidencePassageDetail[] } {
  if (seed.analysisVersions === 0) return { analyses: [], passages: [] };

  const criteria = POLICY_FIXTURES[seed.procedureType].criteria;
  const passages: EvidencePassageDetail[] = [];
  const analyses: AIAnalysisDetail[] = [];

  for (let version = 1; version <= seed.analysisVersions; version += 1) {
    const isCurrent = version === seed.analysisVersions;
    const pattern = STATUS_PATTERNS[isCurrent ? seed.pattern : 2];
    const assessments: CriterionAssessment[] = criteria.map((criterion, index) => {
      const status = pattern[index % pattern.length]!;
      const evidence = isCurrent
        ? buildEvidence(seed, criterion.code, status, timeline, index)
        : { references: [], passages: [] };
      passages.push(...evidence.passages);
      return {
        criterionId: criterion.id,
        status,
        rationale: RATIONALES[status],
        evidence: evidence.references,
      };
    });

    const hasUnsupported = assessments.some((a) => a.status === "NOT_SUPPORTED");
    const hasGap = assessments.some((a) => a.status === "INSUFFICIENT_EVIDENCE");

    analyses.push({
      id: `${seed.id}-analysis-v${version}`,
      version,
      generatedAt: shiftHours(seed.createdAt, 4 * version),
      isCurrent,
      recommendation: hasUnsupported
        ? "CRITERIA_APPEAR_NOT_SATISFIED"
        : hasGap
          ? "ADDITIONAL_DOCUMENTATION_NEEDED"
          : "CRITERIA_APPEAR_SATISFIED",
      modelLabel: `demo-analysis-engine v${version}.0`,
      overallRationale: hasUnsupported
        ? "At least one criterion conflicts with the retrieved documentation. This is a non-binding assessment for reviewer consideration."
        : hasGap
          ? "One or more criteria lack a retrieved passage that states the required fact. This is a non-binding assessment for reviewer consideration."
          : "Every criterion is matched by a retrieved passage. This is a non-binding assessment for reviewer consideration.",
      assessments,
    });
  }

  return { analyses, passages };
}

function buildActivity(seed: CaseSeed, reviewers: Reviewer[]): ActivityEvent[] {
  const assigned = reviewers.find((r) => r.id === seed.assignedReviewerId) ?? null;
  const events: ActivityEvent[] = [
    {
      id: `${seed.id}-act-1`,
      type: "CASE_CREATED",
      actor: "SYSTEM",
      actorName: "Intake pipeline",
      occurredAt: seed.createdAt,
      description: `Case opened for ${PROCEDURE_LABELS[seed.procedureType]}.`,
    },
    {
      id: `${seed.id}-act-2`,
      type: "DOCUMENTATION_INGESTED",
      actor: "SYSTEM",
      actorName: "Intake pipeline",
      occurredAt: shiftHours(seed.createdAt, 1),
      description: "Synthetic clinical records normalized into the case source version.",
    },
    {
      id: `${seed.id}-act-3`,
      type: "ANALYSIS_QUEUED",
      actor: "SYSTEM",
      actorName: "Analysis scheduler",
      occurredAt: shiftHours(seed.createdAt, 2),
      description: "Analysis job queued.",
    },
  ];

  if (seed.status === "ANALYSIS_FAILED") {
    events.push({
      id: `${seed.id}-act-4`,
      type: "ANALYSIS_RETRY",
      actor: "SYSTEM",
      actorName: "Analysis scheduler",
      occurredAt: shiftHours(seed.createdAt, 3),
      description: "Analysis retried after a retryable failure.",
    });
    events.push({
      id: `${seed.id}-act-5`,
      type: "ANALYSIS_FAILED",
      actor: "SYSTEM",
      actorName: "Analysis scheduler",
      occurredAt: shiftHours(seed.createdAt, 4),
      description: "All analysis attempts failed. Case is not available for review.",
    });
    return events;
  }

  if (seed.analysisVersions > 0) {
    events.push({
      id: `${seed.id}-act-4`,
      type: "ANALYSIS_STARTED",
      actor: "AI",
      actorName: "Analysis engine",
      occurredAt: shiftHours(seed.createdAt, 3),
      description: "Evidence retrieval and criterion assessment started.",
    });
    for (let version = 1; version <= seed.analysisVersions; version += 1) {
      events.push({
        id: `${seed.id}-act-succeeded-${version}`,
        type: "ANALYSIS_SUCCEEDED",
        actor: "AI",
        actorName: "Analysis engine",
        occurredAt: shiftHours(seed.createdAt, 4 * version),
        description: `AI analysis version ${version} produced.`,
      });
    }
  }

  if (assigned) {
    events.push({
      id: `${seed.id}-act-claimed`,
      type: "CASE_CLAIMED",
      actor: "REVIEWER",
      actorName: assigned.displayName,
      occurredAt: shiftHours(seed.updatedAt, -6),
      description: `Case claimed by ${assigned.displayName}.`,
    });
  }

  if (seed.status === "COMPLETED" || seed.status === "PENDING_PHYSICIAN_REVIEW") {
    events.push({
      id: `${seed.id}-act-final`,
      type: "FINAL_DECISION_SUBMITTED",
      actor: "REVIEWER",
      actorName: assigned?.displayName ?? "Reviewer",
      occurredAt: seed.updatedAt,
      description:
        seed.status === "COMPLETED"
          ? "Final reviewer decision recorded. Case closed."
          : "Case escalated for physician review.",
    });
  }

  if (seed.status === "NEEDS_MORE_INFORMATION") {
    events.push({
      id: `${seed.id}-act-nmi`,
      type: "CASE_STATUS_CHANGED",
      actor: "REVIEWER",
      actorName: assigned?.displayName ?? "Reviewer",
      occurredAt: seed.updatedAt,
      description: "Reviewer requested additional documentation.",
    });
  }

  return events;
}

function buildReviewState(seed: CaseSeed, reviewers: Reviewer[]): ReviewState {
  const assigned = reviewers.find((r) => r.id === seed.assignedReviewerId) ?? null;
  const state: ReviewState = {
    caseId: seed.id,
    draftSummary: "",
    overrides: [],
    notes: [],
    finalDecision: null,
    lastSavedAt: null,
  };
  if (!assigned) return state;

  state.notes.push({
    id: `${seed.id}-note-1`,
    body: "Opened the case and confirmed the requested procedure matches the referenced synthetic policy version.",
    author: assigned,
    createdAt: shiftHours(seed.updatedAt, -5),
    caseStatusAtCreation: "IN_REVIEW",
  });

  if (seed.status === "COMPLETED") {
    state.finalDecision = {
      decision: "APPROVE",
      rationale:
        "Documentation reviewed against every criterion. Recorded as approved for this synthetic demonstration case.",
      submittedAt: seed.updatedAt,
      reviewer: assigned,
    };
  }

  if (seed.status === "PENDING_PHYSICIAN_REVIEW") {
    state.finalDecision = {
      decision: "ESCALATE_FOR_PHYSICIAN_REVIEW",
      rationale:
        "Clinical judgement on the proposed treatment course exceeds the scope of this review. Escalated for physician assessment.",
      submittedAt: seed.updatedAt,
      reviewer: assigned,
    };
  }

  if (seed.status === "NEEDS_MORE_INFORMATION") {
    state.notes.push({
      id: `${seed.id}-note-2`,
      body: "Requested the dated therapy completion summary. No upload workflow exists in this MVP.",
      author: assigned,
      createdAt: seed.updatedAt,
      caseStatusAtCreation: "NEEDS_MORE_INFORMATION",
    });
  }

  return state;
}

const QUALITY_REPORT: QualityReport = {
  generatedAt: "2026-08-08T06:00:00.000Z",
  analysesEvaluated: 240,
  metrics: [
    {
      key: "grounding-rate",
      label: "Grounding rate",
      value: "96.3%",
      definition:
        "Share of criterion rationales where every factual claim maps to a retrieved passage in the case record.",
    },
    {
      key: "criterion-agreement",
      label: "Reviewer agreement",
      value: "88.1%",
      definition:
        "Share of criterion assessments a reviewer left unchanged after completing their review.",
    },
    {
      key: "gap-precision",
      label: "Insufficient-evidence precision",
      value: "82.7%",
      definition:
        "Share of Insufficient Evidence assessments where the reviewer also found no supporting documentation.",
    },
    {
      key: "retrieval-recall",
      label: "Evidence retrieval recall",
      value: "91.4%",
      definition:
        "Share of reviewer-attached passages that the retrieval step had already surfaced for that criterion.",
    },
    {
      key: "analysis-success",
      label: "Analysis completion rate",
      value: "97.9%",
      definition: "Share of queued analysis jobs that reached a successful terminal state.",
    },
    {
      key: "median-latency",
      label: "Median analysis latency",
      value: "3m 41s",
      definition: "Median wall-clock time from analysis queued to analysis succeeded.",
    },
  ],
  failures: [
    {
      id: "fail-1",
      caseNumber: "UM-2026-0873",
      procedureType: "LUMBAR_SPINE_MRI",
      failureMode: "Duration misread",
      description:
        "Symptom onset was recorded in a scanned narrative. Retrieval surfaced the encounter but not the onset sentence, producing Insufficient Evidence where documentation existed.",
      observedAt: "2026-07-29T14:20:00.000Z",
    },
    {
      id: "fail-2",
      caseNumber: "UM-2026-0912",
      procedureType: "CT_CHEST_WITH_CONTRAST",
      failureMode: "Stale lab selected",
      description:
        "A renal function result from a prior year was cited as current. Reviewer overrode the criterion and attached the recent panel.",
      observedAt: "2026-07-31T09:05:00.000Z",
    },
    {
      id: "fail-3",
      caseNumber: "UM-2026-0940",
      procedureType: "RADIATION_THERAPY",
      failureMode: "Partial plan match",
      description:
        "Planning note contained modality and dose but not fractionation. The assessment treated the criterion as satisfied instead of flagging the gap.",
      observedAt: "2026-08-02T16:45:00.000Z",
    },
    {
      id: "fail-4",
      caseNumber: "UM-2026-0958",
      procedureType: "CERVICAL_FUSION_WITH_DISC_REMOVAL",
      failureMode: "Level mismatch",
      description:
        "Imaging findings at an adjacent level were cited for the symptomatic level. Reviewer corrected the assessment with a documented reason.",
      observedAt: "2026-08-04T11:10:00.000Z",
    },
    {
      id: "fail-5",
      caseNumber: "UM-2026-0977",
      procedureType: "FACET_JOINT_INTERVENTION",
      failureMode: "Unrelated passage retrieved",
      description:
        "A telehealth note about an unrelated complaint was retrieved as conservative-care evidence. Reviewer removed the citation.",
      observedAt: "2026-08-06T08:30:00.000Z",
    },
  ],
};

export function buildInitialState(): MockState {
  const reviewers = REVIEWER_FIXTURES.map((reviewer) => ({ ...reviewer }));
  const state: MockState = {
    reviewers,
    cases: [],
    analyses: {},
    reviewStates: {},
    timelines: {},
    activity: {},
    passages: {},
    analysisFailureReasons: {},
    quality: QUALITY_REPORT,
  };

  CASE_SEEDS.forEach((seed, caseIndex) => {
    const timeline = buildTimeline(seed, caseIndex);
    const { analyses, passages } = buildAnalyses(seed, timeline);

    state.cases.push({
      id: seed.id,
      caseNumber: seed.caseNumber,
      patient: seed.patient,
      procedureType: seed.procedureType,
      status: seed.status,
      assignedReviewer: reviewers.find((r) => r.id === seed.assignedReviewerId) ?? null,
      createdAt: seed.createdAt,
      updatedAt: seed.updatedAt,
    });

    state.timelines[seed.id] = timeline;
    state.analyses[seed.id] = analyses;
    state.activity[seed.id] = buildActivity(seed, reviewers);
    state.reviewStates[seed.id] = buildReviewState(seed, reviewers);
    passages.forEach((passage) => {
      state.passages[passage.id] = passage;
    });
    if (seed.status === "ANALYSIS_FAILED") {
      state.analysisFailureReasons[seed.id] =
        "Evidence retrieval exhausted all retry attempts for this case's source version.";
    }
  });

  return state;
}

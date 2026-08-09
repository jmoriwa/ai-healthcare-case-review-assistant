import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CircleSlash,
  ClipboardCheck,
  FileQuestion,
  Loader2,
  Lock,
  UserCheck,
} from "lucide-react";
import type { ComponentType } from "react";
import type { AIRecommendation, CaseStatus, CriterionStatus } from "@/domain/enums";
import {
  AI_RECOMMENDATION_LABELS,
  CASE_STATUS_LABELS,
  CRITERION_STATUS_LABELS,
} from "@/domain/labels";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "info" | "positive" | "negative" | "caution";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-border-strong bg-neutral-surface text-foreground",
  info: "border-info/30 bg-info-surface text-info-foreground",
  positive: "border-positive/30 bg-positive-surface text-positive-foreground",
  negative: "border-negative/30 bg-negative-surface text-negative-foreground",
  caution: "border-caution/30 bg-caution-surface text-caution-foreground",
};

function Badge({
  tone,
  icon: Icon,
  children,
  className,
}: {
  tone: Tone;
  icon: ComponentType<{ className?: string }>;
  children: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {children}
    </span>
  );
}

const CASE_STATUS_STYLES: Record<
  CaseStatus,
  { tone: Tone; icon: ComponentType<{ className?: string }> }
> = {
  PENDING_ANALYSIS: { tone: "neutral", icon: CircleDashed },
  ANALYZING: { tone: "info", icon: Loader2 },
  READY_FOR_REVIEW: { tone: "info", icon: ClipboardCheck },
  ANALYSIS_FAILED: { tone: "negative", icon: CircleSlash },
  IN_REVIEW: { tone: "caution", icon: UserCheck },
  NEEDS_MORE_INFORMATION: { tone: "caution", icon: FileQuestion },
  PENDING_PHYSICIAN_REVIEW: { tone: "info", icon: Lock },
  COMPLETED: { tone: "positive", icon: CheckCircle2 },
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const { tone, icon } = CASE_STATUS_STYLES[status];
  return (
    <Badge tone={tone} icon={icon}>
      {CASE_STATUS_LABELS[status]}
    </Badge>
  );
}

const CRITERION_STYLES: Record<
  CriterionStatus,
  { tone: Tone; icon: ComponentType<{ className?: string }> }
> = {
  SUPPORTED: { tone: "positive", icon: CheckCircle2 },
  NOT_SUPPORTED: { tone: "negative", icon: CircleSlash },
  INSUFFICIENT_EVIDENCE: { tone: "caution", icon: AlertTriangle },
};

export function CriterionStatusBadge({
  status,
  prefix,
}: {
  status: CriterionStatus;
  prefix?: string;
}) {
  const { tone, icon } = CRITERION_STYLES[status];
  return (
    <Badge tone={tone} icon={icon}>
      {prefix ? `${prefix}: ${CRITERION_STATUS_LABELS[status]}` : CRITERION_STATUS_LABELS[status]}
    </Badge>
  );
}

const RECOMMENDATION_STYLES: Record<
  AIRecommendation,
  { tone: Tone; icon: ComponentType<{ className?: string }> }
> = {
  CRITERIA_APPEAR_SATISFIED: { tone: "positive", icon: CheckCircle2 },
  CRITERIA_APPEAR_NOT_SATISFIED: { tone: "negative", icon: CircleSlash },
  ADDITIONAL_DOCUMENTATION_NEEDED: { tone: "caution", icon: AlertTriangle },
};

export function AIRecommendationBadge({ recommendation }: { recommendation: AIRecommendation }) {
  const { tone, icon } = RECOMMENDATION_STYLES[recommendation];
  return (
    <Badge tone={tone} icon={icon}>
      {AI_RECOMMENDATION_LABELS[recommendation]}
    </Badge>
  );
}

export function OwnershipBadge({ reviewerName }: { reviewerName: string | null }) {
  return reviewerName ? (
    <Badge tone="neutral" icon={UserCheck}>
      {reviewerName}
    </Badge>
  ) : (
    <Badge tone="neutral" icon={CircleDashed}>
      Unassigned
    </Badge>
  );
}

# Backend 07 — Evaluation Specification

## 1. Purpose
Prove the system is performing against known synthetic ground truth rather than judging outputs by how plausible they sound.

## 2. Evaluation layers
Evaluate separately:
1. data integrity;
2. retrieval;
3. criterion assessment;
4. grounding/citations;
5. overall recommendation;
6. runtime reliability;
7. human disagreement (after reviewer interactions exist).

Do not collapse everything into one accuracy number.

## 3. Dataset discipline
- ground truth generated independently by synthetic case generator;
- tune prompts/retrieval on development/validation data;
- report final metrics on held-out patient-level test set;
- record evaluation-run config.

## 4. Required metrics
### Overall recommendation accuracy
`correct overall recommendations / evaluated cases`

### Criterion assessment accuracy
`correct criterion statuses / total evaluated criteria`

Also compute per-class precision/recall/F1 for Supported, Not Supported, Insufficient Evidence because class imbalance can hide failures.

### Evidence Recall@K
For criterion expected evidence set R and retrieved top-K set K:
`|R ∩ K| / |R|`
Report K explicitly.

### Citation accuracy
Operational definition for MVP:
`number of cited evidence links that truly support the associated factual assessment / total cited links`
Because synthetic ground truth knows supporting facts/passages, implement deterministic/annotated matching where possible. For generated narrative variations, a secondary evaluator may be needed, but never rely solely on the same production model without review.

### Missing-information detection
Measure ability to correctly identify criteria intentionally generated as insufficient/missing. Report recall for `INSUFFICIENT_EVIDENCE` at minimum.

### Unsupported-claim rate
`AI factual claims/rationales failing grounding/support checks / total evaluated factual claims or assessments`.
For MVP, define at assessment-level if claim-level extraction is too complex:
`assessments with unsupported factual content / total assessments`.
Document exact implementation.

### Reviewer override rate
`cases or criterion assessments overridden by human / reviewed cases or assessments`.
Display both case-level and criterion-level if available; MVP UI may show one clearly labeled metric.

### Analysis job success rate
Successful final analyses / queued analyses; also retry rate and final failure count.

### Latency/cost (engineering metric)
Track average/p50/p95 analysis duration and OpenAI usage/cost estimate when available. This can stay engineering-facing even if not required on reviewer AI Quality screen.

## 5. Per-procedure breakdown
All core metrics must be breakable by five procedure types. This prevents strong simple-procedure performance from masking weak oncology/surgery cases.

## 6. Failure taxonomy
Every incorrect case/criterion should receive one or more categories:
- `DATA_GENERATION_ERROR`
- `FHIR_NORMALIZATION_ERROR`
- `RETRIEVAL_MISS`
- `RETRIEVAL_RANKING_ERROR`
- `STALE_EVIDENCE_SELECTED`
- `CRITERION_INTERPRETATION_ERROR`
- `INSUFFICIENT_EVIDENCE_MISCLASSIFIED`
- `CONTRADICTORY_EVIDENCE_HANDLING_ERROR`
- `CITATION_MISMATCH`
- `UNSUPPORTED_CLAIM`
- `OVERALL_AGGREGATION_ERROR`
- `STRUCTURED_OUTPUT_FAILURE`
- `PROVIDER_RUNTIME_FAILURE`

## 7. Evaluation runner
CLI conceptual:
```text
python -m app.evaluation.run --split validation --name baseline-v1
python -m app.evaluation.run --split test --name final-mvp-v1
```

For each case:
1. run/locate analysis using frozen config;
2. compare criterion statuses;
3. compare expected evidence/retrieval;
4. evaluate citations/grounding;
5. compare overall recommendation;
6. store case result/failure categories;
7. aggregate metrics.

## 8. Baselines
Before claiming improvement, record baselines:
### Retrieval
- lexical-only;
- vector-only;
- hybrid.

### AI assessment
At minimum compare one simple baseline prompt/retrieval configuration with final configuration. Do not create meaningless baselines solely for a better number.

## 9. Acceptance targets
Initial targets are engineering goals, not clinical validation claims. Recommended MVP goals to aim for on synthetic held-out test set:
- citation accuracy >= 0.95;
- evidence Recall@K >= 0.90 for chosen K;
- criterion accuracy >= 0.90;
- overall recommendation accuracy >= 0.90;
- insufficient-evidence recall >= 0.90;
- unsupported-assessment rate <= 0.02.

If not met, MVP can still be documented as a prototype, but do not falsely report targets as achieved. Use failure analysis to iterate.

## 10. AI Quality UI selection
Expose latest designated evaluation run, not arbitrary development run.
Include:
- evaluation date;
- synthetic test case count;
- metrics;
- procedure breakdown;
- representative failures.

Clearly state metrics are from synthetic evaluation, not real clinical validation.

## 11. Regression testing
Maintain a small deterministic regression set of difficult cases. Every prompt/retrieval change runs regression before full test evaluation.

## 12. Human review feedback
Criterion overrides and final AI disagreement are product feedback signals. Do not automatically train on them in MVP. Store them for analysis only.

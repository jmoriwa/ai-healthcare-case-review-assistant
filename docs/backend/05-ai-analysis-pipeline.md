# Backend 05 — AI Analysis Pipeline

## 1. Objective
Produce transparent criterion assessments and an overall recommendation from patient-specific evidence without allowing unsupported clinical claims.

## 2. Design principle
The LLM does semantic interpretation; deterministic code controls workflow, validation, state transitions, identity, persistence, and recommendation aggregation where rules can be explicit.

## 3. LangGraph state
Conceptual typed state:
```text
case_id
patient_id
source_data_version
policy_id
criteria[]
retrieval_results_by_criterion{}
criterion_assessments[]
validation_errors[]
overall_recommendation
overall_rationale
analysis_metadata
```
Do not store raw secrets in graph state.

Official LangGraph docs: https://docs.langchain.com/oss/python/langgraph/overview

## 4. Nodes
### Node 1 — load_case
Pure repository/application read. Validate case/source version.

### Node 2 — load_policy
Load ordered synthetic criteria.

### Node 3 — build_retrieval_queries
Prefer deterministic query templates combining:
- criterion title/description;
- procedure;
- known terminology aliases from project dictionary.
LLM query expansion optional only if measured helpful.

### Node 4 — retrieve_evidence
Call RetrievalService per criterion. Patient + source version filters are mandatory.

### Node 5 — rerank_select
Apply configured hybrid/rerank strategy. Keep original rank/scores for debugging/evaluation.

### Node 6 — assess_criterion
For each criterion, provide only:
- criterion text;
- procedure/context necessary;
- selected evidence passages with stable IDs;
- explicit output schema.

Structured output:
```json
{
  "status":"SUPPORTED|NOT_SUPPORTED|INSUFFICIENT_EVIDENCE",
  "rationale":"short evidence-grounded rationale",
  "evidence_ids":["..."]
}
```

### Node 7 — validate_assessments
Validate enum/schema, evidence IDs belong to supplied candidates, rationale non-empty.

### Node 8 — grounding_validator
Critical rule: any cited evidence ID must exist and belong to patient/source version. For MVP, require every assessment rationale that states a clinical fact to cite at least one evidence ID. Additional automated factual-claim verification may be heuristic/evaluator, but unsupported citations must hard-fail analysis persistence.

### Node 9 — derive_overall_recommendation
Use deterministic logic first.
Recommended initial logic:
- if any required criterion is `INSUFFICIENT_EVIDENCE` -> `ADDITIONAL_DOCUMENTATION_NEEDED`;
- else if any required criterion is `NOT_SUPPORTED` -> `CRITERIA_APPEAR_NOT_SATISFIED`;
- else all required criteria Supported -> `CRITERIA_APPEAR_SATISFIED`.

If policy includes OR/exception logic, evaluate machine-readable policy rule deterministically from criterion statuses. Do not ask LLM to invent aggregation.

### Node 10 — create_overall_rationale
Can use deterministic templating to summarize counts/key criteria, or LLM with strict evidence/assessment context. Prefer deterministic/template for MVP to reduce hallucination.

### Node 11 — persist_analysis
Application/infrastructure action after graph succeeds. Persist immutable AIAnalysis + criterion/evidence links transactionally.

## 5. Prompt design
System instructions must state:
- synthetic decision-support context;
- never make final authorization decision;
- only use supplied evidence;
- do not infer undocumented facts;
- missing evidence -> Insufficient Evidence;
- cite evidence IDs exactly;
- concise rationale.

Do not include hidden clinical knowledge as substitute for the synthetic policy. The policy criterion is the authority for the demo.

## 6. Structured output
Use OpenAI structured outputs when supported. Official guide: https://developers.openai.com/api/docs/guides/structured-outputs

Define Pydantic model corresponding exactly to three criterion statuses and evidence-id list.

## 7. OpenAI model configuration
Do not hardcode a specific model in docs/code. Use a currently supported model capable of structured outputs and sufficient reasoning, selected by configuration and cost/quality experiment.

Track:
- model name;
- request latency;
- token usage where SDK provides it;
- prompt version.

## 8. Retry categories
### Retryable
- transient OpenAI network/service error;
- rate limit after backoff;
- malformed/failed structured output validation if retry strategy permits;
- temporary DB connection issue outside committed transaction.

### Non-retryable/final
- missing policy;
- invalid case referential integrity;
- unsupported procedure configuration;
- no patient/source data due dataset bug;
- persistent grounding violation after controlled model retry.

Job-level max attempts remains 3 total. Node-internal retries must not create an unbounded multiplication of calls; document total call budget.

## 9. New documentation behavior
New source data version creates a fresh analysis. Never modify old assessment rows. Current analysis pointer/selection is based on newest successful source version.

## 10. Human override separation
Reviewer overrides are separate data. Never edit AIAnalysis to match reviewer. AI Quality can later compare disagreements.

## 11. No confidence score
Do not ask the model for percent confidence. Evaluation is aggregate and empirically measured.

## 12. Pipeline tests
- all-Supported scenario -> satisfied;
- one Not Supported -> not satisfied;
- one Insufficient -> additional documentation;
- evidence ID hallucinated -> validator rejects;
- evidence from wrong patient -> validator rejects;
- missing criterion -> failure;
- structured-output invalid -> controlled retry/failure;
- old analysis remains after source update.

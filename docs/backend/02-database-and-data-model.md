# Backend 02 — Database and Data Model

## 1. Database
PostgreSQL with pgvector extension.

Enable:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Use UUID primary keys. Store timestamps as timezone-aware (`timestamptz`).

## 2. Recommended tables
Exact physical names are normative unless implementation has a documented migration reason.

### reviewers
```text
id uuid PK
email varchar unique not null
display_name varchar not null
password_hash varchar not null
is_active boolean not null default true
created_at timestamptz not null
```
Index normalized/lower email or store normalized value.

### patients
```text
id uuid PK
fhir_patient_id varchar unique not null
display_name varchar not null
birth_date date nullable
gender varchar nullable
generation_batch_id uuid nullable
generation_seed bigint nullable
created_at timestamptz not null
```

### clinical_records
```text
id uuid PK
patient_id uuid FK patients not null
fhir_resource_type varchar not null
fhir_resource_id varchar not null
encounter_reference varchar nullable
occurred_at timestamptz nullable
record_label varchar not null
normalized_text text not null
raw_fhir jsonb not null
source_data_version integer not null
created_at timestamptz not null
UNIQUE(patient_id, fhir_resource_type, fhir_resource_id, source_data_version)
```

### evidence_passages
Embedding dimension depends on configured embedding model and must be fixed in migration/config for a given embedding table/version. Do not guess dimension; read model documentation/result and define explicitly.
```text
id uuid PK
clinical_record_id uuid FK not null
patient_id uuid FK not null
source_data_version integer not null
passage_index integer not null
text text not null
structured_field_path varchar nullable
start_offset integer nullable
end_offset integer nullable
occurred_at timestamptz nullable
metadata jsonb not null default '{}'
embedding vector(<configured_dimension>) nullable
embedding_model varchar nullable
created_at timestamptz not null
UNIQUE(clinical_record_id, passage_index)
```
Indexes:
- patient_id, source_data_version;
- occurred_at;
- optional full-text GIN index on `to_tsvector('english', text)`;
- vector HNSW only after performance measurement.

### medical_policies
```text
id uuid PK
procedure_type varchar not null
name varchar not null
version varchar not null
effective_date date nullable
synthetic_disclaimer text not null
policy_definition jsonb not null
is_active boolean not null
created_at timestamptz not null
UNIQUE(procedure_type, version)
```

### policy_criteria
```text
id uuid PK
policy_id uuid FK not null
code varchar not null
ordinal integer not null
title varchar not null
description text not null
rule_definition jsonb not null
UNIQUE(policy_id, code)
UNIQUE(policy_id, ordinal)
```

### authorization_cases
```text
id uuid PK
patient_id uuid FK not null
procedure_type varchar not null
policy_id uuid FK not null
source_data_version integer not null
status varchar not null
assigned_reviewer_id uuid FK nullable
requested_service_details jsonb not null
created_at timestamptz not null
updated_at timestamptz not null
```
Indexes: status; assigned_reviewer_id; procedure_type; created_at.

### analysis_jobs
```text
id uuid PK
case_id uuid FK not null
source_data_version integer not null
attempt_number integer not null CHECK 1..3
status varchar not null
public_failure_code varchar nullable
public_failure_message text nullable
technical_error_reference varchar nullable
queued_at timestamptz not null
started_at timestamptz nullable
finished_at timestamptz nullable
created_at timestamptz not null
UNIQUE(case_id, source_data_version, attempt_number)
```

### ai_analyses
Immutable.
```text
id uuid PK
case_id uuid FK not null
version_number integer not null
source_data_version integer not null
model_identifier varchar not null
prompt_version varchar not null
retrieval_config_version varchar not null
overall_recommendation varchar not null
overall_rationale text not null
created_at timestamptz not null
UNIQUE(case_id, version_number)
UNIQUE(case_id, source_data_version)  -- MVP if one current pipeline result per source version
```

### criterion_assessments
Immutable.
```text
id uuid PK
ai_analysis_id uuid FK not null
criterion_id uuid FK not null
status varchar not null
rationale text not null
created_at timestamptz not null
UNIQUE(ai_analysis_id, criterion_id)
```

### assessment_evidence
```text
criterion_assessment_id uuid FK not null
evidence_passage_id uuid FK not null
rank integer not null
PRIMARY KEY (criterion_assessment_id, evidence_passage_id)
```

### review_drafts
At most one current draft per case.
```text
case_id uuid PK/FK
reviewer_id uuid FK not null
draft_final_decision varchar nullable
draft_final_rationale text nullable
draft_missing_documentation text nullable
updated_at timestamptz not null
```

### criterion_overrides
Append-only.
```text
id uuid PK
case_id uuid FK not null
ai_analysis_id uuid FK not null
criterion_id uuid FK not null
reviewer_id uuid FK not null
original_ai_status varchar not null
reviewer_status varchar not null
reason text not null
created_at timestamptz not null
```
Current effective override = latest by created_at for criterion/current review context; history preserved.

### reviewer_evidence_links
```text
id uuid PK
case_id uuid FK not null
criterion_id uuid FK not null
evidence_passage_id uuid FK not null
reviewer_id uuid FK not null
created_at timestamptz not null
```

### reviewer_notes
Immutable.
```text
id uuid PK
case_id uuid FK not null
reviewer_id uuid FK not null
case_status_at_creation varchar not null
body text not null
created_at timestamptz not null
```
No update/delete reviewer endpoint.

### final_review_decisions
Append semantics depend on Request More Information. For terminal Approve/Deny/Escalate, only one terminal decision. To support Needs More Information history, use decision events rather than one unique case row.
```text
id uuid PK
case_id uuid FK not null
reviewer_id uuid FK not null
decision varchar not null
rationale text nullable
missing_documentation text nullable
ai_analysis_id uuid FK not null
ai_recommendation_at_decision varchar not null
created_at timestamptz not null
```
Application rules prevent invalid duplicate terminal decision.

### activity_events
Append-only.
```text
id uuid PK
case_id uuid FK not null
event_type varchar not null
actor_type varchar not null
actor_reviewer_id uuid FK nullable
metadata jsonb not null default '{}'
created_at timestamptz not null
```
Index `(case_id, created_at)`.

### evaluation_ground_truth
```text
id uuid PK
case_id uuid FK unique not null
expected_overall_recommendation varchar not null
expected_missing_information jsonb not null
split varchar not null
scenario_difficulty varchar nullable
generator_version varchar not null
created_at timestamptz not null
```

### evaluation_criterion_ground_truth
```text
id uuid PK
ground_truth_id uuid FK not null
criterion_id uuid FK not null
expected_status varchar not null
expected_evidence_facts jsonb not null
expected_evidence_passage_ids jsonb nullable
UNIQUE(ground_truth_id, criterion_id)
```

### evaluation_runs
```text
id uuid PK
name varchar not null
model_identifier varchar not null
prompt_version varchar not null
retrieval_config_version varchar not null
dataset_split varchar not null
started_at timestamptz not null
finished_at timestamptz nullable
metrics jsonb nullable
```

### evaluation_case_results
```text
id uuid PK
evaluation_run_id uuid FK not null
case_id uuid FK not null
analysis_id uuid FK nullable
is_overall_correct boolean nullable
failure_categories jsonb not null
metric_details jsonb not null
UNIQUE(evaluation_run_id, case_id)
```

## 3. Terminal-state enforcement
Application layer is primary. Optionally add DB check/trigger only if it does not duplicate complex rules opaquely. Prefer explicit transactional application code plus tests.

## 4. Deletion policy
MVP development may reset entire synthetic DB through explicit developer command. Reviewer-facing APIs must not expose deletes for notes, activity, analyses, decisions, cases.

## 5. Versioning
### Source data version
Increment when new documentation for a case becomes available through ingestion.

### AI analysis version
Monotonic per case. Each successful source version generates new AI analysis.

### Prompt/retrieval config
String identifiers stored with analysis, e.g. `criterion-assessment-v1`, `hybrid-v1`.

## 6. Migration requirements
Every schema change uses migration. Never rely on auto-create tables in normal app startup after initial prototype.

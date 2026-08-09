# Backend 04 — Synthetic Data Pipeline

## 1. Goal
Create reproducible, realistic synthetic longitudinal records and prior-authorization scenarios with independent ground truth. The runtime AI must not generate its own evaluation labels.

## 2. Source
Synthea official:
- https://synthetichealth.github.io/synthea/
- https://github.com/synthetichealth/synthea

Synthea supports FHIR R4 and seed/population-size CLI arguments. Its data is synthetic and intended for Health IT development.

## 3. MVP data-development stages
### Stage 1 — 10 patients
Validate Synthea install and inspect FHIR.

### Stage 2 — 100 patients
Validate parser/normalizer and case eligibility logic.

### Stage 3 — target population
Generate enough patients to yield a realistic evaluation set across five procedures. Do not set a huge number blindly; instrument eligibility yield. A practical development target can be 1,000–5,000 source patients, then scale if needed.

The MVP needs enough **cases**, not necessarily a giant training dataset because initial AI uses existing OpenAI models rather than supervised training.

## 4. FHIR ingestion subset
Parse Bundle entries and normalize:
- Patient
- Encounter
- Condition
- Observation
- Procedure
- MedicationRequest
- DiagnosticReport
- DocumentReference if available

FHIR reference: https://www.hl7.org/fhir/R4/

## 5. Normalization rules
For each resource, produce:
- stable source identity;
- patient reference;
- encounter reference when available;
- clinically meaningful timestamp;
- human-readable normalized text;
- searchable metadata;
- raw JSON.

Examples:
### Condition text
`Condition: <display>; onset: <date>; clinical status: <status>`

### Observation
`Observation: <display>; value: <value unit>; effective: <date>`

### MedicationRequest
`Medication: <display>; authored: <date>; status: <status>`

Do not use an LLM to normalize deterministic structured FHIR fields unless necessary. Prefer code.

## 6. Synthetic free-text notes
Synthea FHIR may not provide rich narrative notes sufficient for every scenario. The project case generator may create synthetic note-like documents from structured synthetic facts using deterministic templates. If an LLM is used to vary language, ground truth must derive from the underlying structured facts, not from model interpretation.

Store generated note provenance:
- generator version;
- seed;
- source facts;
- synthetic flag.

## 7. Policy definitions
Each procedure gets one MVP synthetic policy version. Store both human-readable criterion text and machine-readable generation rule.

Example conceptual rule JSON:
```json
{
  "type":"all",
  "conditions":[
    {"fact":"symptom_duration_days","operator":">=","value":42},
    {"fact":"conservative_therapy_completed","operator":"==","value":true}
  ]
}
```

Policy generator/runtime evaluator for ground truth must be deterministic. These rules are project demo rules, not clinical guidelines.

## 8. Five scenario generators
Each procedure module exposes conceptually:
```python
generate_case(patient_snapshot, rng) -> GeneratedCase | None
```
It decides eligibility and creates:
- requested service details;
- policy version;
- source evidence facts;
- optional distractor records;
- ground-truth criterion statuses;
- expected overall recommendation;
- missing-information labels;
- difficulty tag.

## 9. Ground-truth generation strategy
Never ask the same runtime LLM to label ground truth.

Use deterministic generation facts. Example:
- criterion requires documented conservative therapy;
- case generator knows whether a qualifying therapy record was inserted;
- therefore expected status is deterministic.

### Status generation
- `SUPPORTED`: qualifying fact/evidence intentionally present.
- `NOT_SUPPORTED`: evidence intentionally demonstrates criterion is not met where semantically appropriate.
- `INSUFFICIENT_EVIDENCE`: required evidence intentionally omitted/ambiguous.

Be careful: absence of evidence is not automatically evidence of a negative. Use `INSUFFICIENT_EVIDENCE` for missing documentation.

## 10. Difficulty distribution
Include:
- straightforward;
- distractor-heavy;
- stale evidence;
- contradictory notes;
- multiple encounters;
- near-threshold dates;
- missing required documentation;
- similar but non-qualifying evidence.

Store `scenario_difficulty`.

## 11. Data splits
Even though MVP does not require training, generate stable patient-level split assignments now:
- 70% train/reserved development
- 15% validation
- 15% test
or a documented alternative.

All cases for one patient stay in one split. Never split passages from one patient across train/test if future model training uses them.

Evaluation claims should use held-out test split after tuning retrieval/prompts on development/validation.

## 12. Procedure balance
Target roughly balanced evaluation counts across five procedures. Do not force exact equal source-patient counts; balance the generated **case evaluation set**.

## 13. Reproducibility
Every generation run records:
- Synthea commit/release if known;
- Synthea seed;
- project generator version;
- project random seed;
- policy version;
- timestamp;
- generation parameters.

## 14. Pipeline CLI
Recommended commands:
```text
python -m app.cli.generate_synthea_manifest ...   # optional wrapper
python -m app.cli.ingest_fhir --path <dir> --batch-id ...
python -m app.cli.generate_cases --seed 42 --target-per-procedure 100
python -m app.cli.embed_passages --batch-id ...
python -m app.cli.validate_dataset
```
Names may vary, behavior must exist and be documented.

## 15. Dataset validation report
Before AI evaluation, output:
- number patients ingested;
- resources by type;
- cases by procedure/status/ground-truth recommendation;
- criteria status distribution;
- difficulty distribution;
- split counts;
- missing raw/source references;
- duplicate IDs;
- cases without evidence where support expected.

Fail validation on broken referential integrity.

## 16. No-overfitting note
Because MVP is prompt/retrieval based, overfitting primarily means repeatedly tuning prompts/retrieval on the test set. Keep test cases untouched until final evaluation. Future supervised training must use patient-level splits and a larger training set appropriate to the selected model/task.

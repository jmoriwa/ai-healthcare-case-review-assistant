# ENGINEER IMPLEMENTATION GUIDE
## Healthcare Case Review Assistant — From Blank Machine to End-to-End AI MVP

This guide is written for a junior-to-mid software engineer who can program but is learning production-style AI engineering, FHIR, vector retrieval, LangGraph orchestration, and rigorous evaluation.

It is deliberately separate from the coding-agent specifications. Use agents to accelerate implementation, but use this guide to understand what they are building and to verify that the system is correct.

---

# 0. What you are actually building

The MVP is not "a chatbot for medical records." It is a pipeline:

```text
Synthetic longitudinal health record
        ↓
Prior-authorization case + synthetic policy
        ↓
Evidence indexing/retrieval
        ↓
AI criterion assessment
        ↓
Grounding/citation validation
        ↓
Overall AI recommendation
        ↓
Human reviewer workflow
        ↓
Evaluation against known synthetic ground truth
```

The hardest/most valuable engineering is in the middle: data quality, retrieval, grounding, reproducibility, failure handling, and evaluation.

The MVP does **not** require training a foundation model. You initially use an existing OpenAI model. A later chapter explains how to train/fine-tune a smaller classification model as an optional future learning exercise.

---

# 1. Install your base development tools

The examples assume Windows PowerShell where platform-specific commands matter.

## 1.1 Git
Install Git from the official Git site and verify:
```powershell
git --version
```

## 1.2 Node.js
Install an active LTS Node release supported by the current Next.js version.
Verify:
```powershell
node --version
npm --version
```

Do not copy a hard-coded old Node version from a blog. Check current Next.js requirements: https://nextjs.org/docs

## 1.3 Python
Install a current stable Python 3 version compatible with FastAPI/LangGraph/OpenAI packages.
Verify:
```powershell
python --version
pip --version
```

Once selected, pin it in the repository with a `.python-version` or README requirement.

## 1.4 Java for Synthea
Synthea's current repository requires Java JDK 17 or newer and recommends LTS releases. Source: https://github.com/synthetichealth/synthea

Verify:
```powershell
java -version
```

## 1.5 PostgreSQL
Official Windows installer information: https://www.postgresql.org/download/windows/

Install PostgreSQL and remember:
- server port (typically 5432);
- local superuser/admin username;
- password you set;
- pgAdmin optional.

Verify in PowerShell/terminal if `psql` is on PATH:
```powershell
psql --version
```
If not, use pgAdmin initially or add PostgreSQL bin directory to PATH.

---

# 2. Create the repository

Recommended:
```powershell
mkdir healthcare-case-review-assistant
cd healthcare-case-review-assistant
git init
mkdir frontend
mkdir backend
```

Copy this documentation package into `docs/` or keep it at root. Put `AGENTS.md` at repo root so coding agents see it.

Create `.gitignore` before generating data. Do not commit:
- `.env`
- `.venv`
- `node_modules`
- Next.js build output
- Python caches
- large raw Synthea outputs unless intentionally versioned small fixtures.

---

# 3. Build the frontend first

Follow the frontend docs exactly. This guide only explains why.

The strict service layer means the UI is not coupled to your backend. A component asks for `CaseService.getCase()`; today it receives a mock, later it receives FastAPI data. This protects you from rewriting the frontend while the AI/backend architecture evolves.

## 3.1 Scaffold
Use current official Next.js instructions. Example pattern:
```powershell
cd frontend
npx create-next-app@latest .
```
Select TypeScript, App Router, ESLint. Follow current Tailwind integration per official docs:
https://tailwindcss.com/docs/installation/framework-guides/nextjs

Install TanStack Query:
```powershell
npm install @tanstack/react-query
```
Official: https://tanstack.com/query/latest/docs/framework/react/installation

## 3.2 What to understand before moving on
You should be able to explain:
- React components render UI;
- TanStack Query manages async/server-like state;
- service interfaces hide where data comes from;
- mock services simulate API behavior;
- React local state handles ephemeral UI only.

## 3.3 Do not continue until
You can log into mock frontend, claim a case, open exact evidence, save progress, override criterion, complete a case, and see read-only state—all without a backend.

---

# 4. Create the Python backend environment

```powershell
cd ..\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

You may choose `uv` for package management if you prefer. Consistency matters more than tool choice.

Install core packages according to current compatible versions. Conceptually:
```powershell
pip install fastapi "uvicorn[standard]" pydantic-settings sqlalchemy alembic psycopg[binary] pgvector pyjwt pwdlib openai langgraph
```
Package names/versions can change. Verify against official docs before pinning.

Then freeze/pin dependencies after you have a working combination.

Run a hello-world FastAPI app and open:
```text
http://127.0.0.1:8000/docs
```
FastAPI docs: https://fastapi.tiangolo.com/

### Understand
FastAPI is the HTTP transport, not the place where AI/business rules live.

---

# 5. Create your PostgreSQL database

Using `psql` as an example:
```sql
CREATE DATABASE healthcare_case_review;
CREATE USER case_review_app WITH PASSWORD '<local-dev-password>';
GRANT ALL PRIVILEGES ON DATABASE healthcare_case_review TO case_review_app;
```
Exact permissions may need PostgreSQL-version/schema adjustments; follow current PostgreSQL docs.

Create `.env` in backend:
```env
DATABASE_URL=postgresql+psycopg://case_review_app:<password>@localhost:5432/healthcare_case_review
OPENAI_API_KEY=
OPENAI_CHAT_MODEL=
OPENAI_EMBEDDING_MODEL=
JWT_SECRET_KEY=<long-random-local-secret>
ACCESS_TOKEN_EXPIRE_MINUTES=60
APP_ENV=development
LOG_LEVEL=INFO
```

Never commit it.

---

# 6. Install and understand pgvector

## 6.1 What a vector database is in this project
A clinical passage such as:

```text
Patient reports low back pain for approximately nine weeks despite physical therapy.
```

is converted by an embedding model into a vector:

```text
[0.012, -0.341, 0.227, ...]
```

Similar meanings tend to produce vectors near each other in embedding space. pgvector lets PostgreSQL store and compare those vectors.

It does **not** reason about medical necessity. It helps retrieve candidate evidence.

Official pgvector repository: https://github.com/pgvector/pgvector

## 6.2 Install pgvector
Installation differs by OS/PostgreSQL packaging. Follow the exact Windows instructions/release options in current pgvector documentation or use a PostgreSQL distribution that packages the extension. Do not improvise by downloading unknown binaries.

Once extension is installed on server:
```sql
\c healthcare_case_review
CREATE EXTENSION IF NOT EXISTS vector;
```

Verify:
```sql
SELECT extname FROM pg_extension WHERE extname='vector';
```
Expected: one row `vector`.

## 6.3 Important concept: vector dimension
Your embedding column has a fixed dimension associated with the selected embedding model. **Do not guess it.** Generate one embedding or read current official model documentation, inspect its vector length, and set migration accordingly.

## 6.4 Start exact, not HNSW
pgvector performs exact nearest-neighbor search by default. For an MVP with a small patient-specific search space, exact search is simpler and gives full recall. Only add HNSW after profiling. Official pgvector docs explain HNSW/IVFFlat tradeoffs.

### Do not continue until
You can insert a few test vectors and query nearest rows successfully.

---

# 7. Implement database migrations and authentication before AI

Do not build LangGraph first.

Create tables/migrations from `backend/02-database-and-data-model.md`.

Then implement reviewer login.

FastAPI secure tutorial:
https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/

Understand:
- a password hash is stored, never the plaintext password;
- login verifies password against hash;
- server signs a token;
- protected endpoints identify the reviewer from token;
- UI identity is not trusted just because browser sends a reviewer ID.

Seed three reviewers through a script. Test `/auth/token`, `/auth/me`.

### Do not continue until
A wrong password fails, a valid account receives token, and protected route rejects missing token.

---

# 8. Install Synthea and generate your first patients

Official repository: https://github.com/synthetichealth/synthea
Official overview: https://synthetichealth.github.io/synthea/

## 8.1 Clone outside or under tooling directory
```powershell
git clone https://github.com/synthetichealth/synthea.git
cd synthea
```

## 8.2 Generate only 10 first
Current Synthea supports seed/population options and FHIR export. On Windows:
```powershell
.\run_synthea.bat -s 42 -p 10 --exporter.fhir.export=true
```

Inspect output directory.

## 8.3 Open one FHIR JSON file
You will likely see a FHIR `Bundle` containing resources.
FHIR R4 official: https://www.hl7.org/fhir/R4/

Learn to identify:
- `resourceType`;
- `id`;
- `subject.reference`/patient references;
- date fields;
- coding/display/value fields.

## 8.4 FHIR mental model
FHIR is a standard way to represent healthcare data as composable resources.

`Patient` = who.
`Encounter` = care interaction.
`Condition` = diagnosis/problem.
`Observation` = measurement/finding.
`Procedure` = procedure performed.
`MedicationRequest` = medication order/request.
`DiagnosticReport` = grouped diagnostic findings/report.
`DocumentReference` = reference/metadata for a document/note.

You are **not** building a FHIR server. You are consuming a useful subset.

### Do not continue until
You can manually trace at least one Condition/Observation/Procedure back to a Patient and explain the timestamps/fields you will normalize.

---

# 9. Build the FHIR parser/normalizer

The raw JSON is not ideal for search/UI. Normalize each supported resource into a `ClinicalRecord`.

Example:
FHIR Observation:
```json
{
  "resourceType":"Observation",
  "id":"obs-1",
  "subject":{"reference":"Patient/p1"},
  "code":{"coding":[{"display":"Example lab"}]},
  "valueQuantity":{"value":12.3,"unit":"mg/dL"}
}
```
Normalized text might be:
```text
Observation: Example lab = 12.3 mg/dL.
```

Important: write deterministic code for structured fields. Do not spend OpenAI tokens to rephrase every FHIR row.

Store raw JSON too so you can prove where normalized evidence came from.

### Test
Given known fixture resource, assert patient ID, resource ID, normalized text and date.

---

# 10. Build synthetic policies before retrieval

Create one JSON/YAML/Python policy definition per procedure. They are fictional demo rules.

Example structure:
```json
{
  "procedureType":"LUMBAR_SPINE_MRI",
  "version":"demo-v1",
  "criteria":[
    {
      "code":"LSMRI-C1",
      "title":"Persistent symptoms",
      "description":"Synthetic criterion requiring documented symptom duration.",
      "rule": {"fact":"symptom_duration_days","operator":">=","value":42}
    }
  ]
}
```

Keep human-readable and machine-readable rule together.

Why? The human-readable text is what AI evaluates; the machine rule is what your synthetic generator uses to create ground truth.

---

# 11. Create authorization cases and ground truth

This is one of the most important parts of the project.

## 11.1 Do not let OpenAI generate truth
Your generator knows which facts it inserted/withheld.

Example:
```text
Policy requires physical therapy.
Generator intentionally creates 8-week PT record.
Ground truth = SUPPORTED.
Expected evidence = that PT record/passage.
```

Another case:
```text
Policy requires recent neurological documentation.
Generator omits it.
Ground truth = INSUFFICIENT_EVIDENCE.
```

## 11.2 Create distractors
A useful case should have irrelevant records. Otherwise retrieval is trivial.

## 11.3 Create edge cases gradually
First make simple cases correct. Then add:
- stale dates;
- contradictions;
- near thresholds;
- similar non-qualifying evidence;
- lots of irrelevant history.

### Do not continue until
For at least five cases per procedure, you can manually read records and agree with the generator's ground truth.

---

# 12. Create evidence passages

## Structured resources
Usually each meaningful normalized record can be one passage.

## Narrative notes
Split by paragraphs/sections. Preserve passage-to-source mapping.

Every passage must answer:
- which patient?
- which source record?
- which source version?
- which exact text/field?
- when did it occur?

Without that identity, citations are impossible to trust.

---

# 13. Generate embeddings with OpenAI

Official embeddings guide:
https://developers.openai.com/api/docs/guides/embeddings

Set API key in `.env`, never source.

## 13.1 First experiment
Embed 10 passages only.
Inspect:
- response vector length;
- model identifier;
- latency;
- usage/cost if provided.

Then create DB migration/vector column matching dimension.

## 13.2 Batch responsibly
Do not re-embed same passage every server startup. Persist embedding and `embedding_model`.

If text or embedding model changes, create a migration/backfill strategy/version.

### Understand
Embedding generation is preprocessing/indexing. Query-time embedding converts the policy/retrieval query into the same vector space.

---

# 14. Implement vector retrieval baseline

For one criterion:
1. construct a query string from title/description/procedure;
2. generate query embedding;
3. filter DB to correct patient + source version;
4. nearest-neighbor search;
5. return top K passages.

Print a debugging table:
```text
Rank | Passage ID | Distance | Date | Text preview | Is expected evidence?
```

Do not judge by one case. Run across validation cases.

---

# 15. Implement lexical retrieval baseline

PostgreSQL full-text search can find exact words that semantic retrieval may underweight.

For each criterion, run lexical top K restricted to patient/source.

Again measure expected evidence recall.

### Understand
Vector and lexical retrieval fail differently. That is why the project uses hybrid retrieval.

---

# 16. Build hybrid retrieval

A simple robust approach is Reciprocal Rank Fusion (RRF): combine ranks rather than incompatible raw scores.

Conceptually:
```text
vector results: A, B, C, D
lexical results: C, E, A, F
RRF => A/C rise because multiple methods support them
```

Tune on validation set:
- vector K;
- lexical K;
- final K.

Do not touch held-out test set while tuning.

### Your first major engineering result
Create a table:
```text
Method       Evidence Recall@K
Lexical      0.xx
Vector       0.xx
Hybrid       0.xx
```
If hybrid is not better, investigate instead of assuming architecture is superior.

---

# 17. Learn LangGraph before using it

Official overview:
https://docs.langchain.com/oss/python/langgraph/overview

LangGraph gives you explicit state and node transitions. It is useful because your analysis is a workflow, not a single prompt.

Do not put every line of code inside LangGraph. Nodes call ordinary services.

Your graph:
```text
load_case
  ↓
load_policy
  ↓
retrieve_evidence
  ↓
assess_criteria
  ↓
validate_grounding
  ↓
derive_overall_recommendation
  ↓
persist
```

### Exercise
Before OpenAI, build the graph with fake criterion assessments. Make sure state moves correctly.

---

# 18. Implement structured criterion assessment

Official structured-output guide:
https://developers.openai.com/api/docs/guides/structured-outputs

Define Pydantic model:
```python
class CriterionAssessmentOutput(BaseModel):
    status: Literal["SUPPORTED", "NOT_SUPPORTED", "INSUFFICIENT_EVIDENCE"]
    rationale: str
    evidence_ids: list[str]
```

Prompt sends only:
- synthetic criterion;
- selected evidence candidates with IDs;
- procedure context needed;
- strict rules.

The model may only return supplied evidence IDs.

### Key safety rule
If required evidence is not present, `INSUFFICIENT_EVIDENCE` is preferable to inventing a conclusion.

---

# 19. Grounding validation

Never trust model output just because JSON schema is valid.

After output:
```text
for evidence_id in response.evidence_ids:
    assert id was in supplied candidates
    assert passage.patient_id == case.patient_id
    assert passage.source_version == case.source_version
```

If it references a nonexistent ID, reject/retry/fail. Do not silently remove it and display the rest as trustworthy.

For MVP, enforce at least one evidence reference for factual Supported/Not Supported assessments. Insufficient Evidence can have none.

---

# 20. Derive overall recommendation in code

Do not use another LLM call if simple deterministic rules suffice.

Initial logic:
```text
if any criterion == INSUFFICIENT_EVIDENCE:
    ADDITIONAL_DOCUMENTATION_NEEDED
else if any required criterion == NOT_SUPPORTED:
    CRITERIA_APPEAR_NOT_SATISFIED
else:
    CRITERIA_APPEAR_SATISFIED
```

When OR/exception rules exist, evaluate the policy's machine-readable rule tree.

This makes the system easier to test and explain.

---

# 21. Persist immutable AI analysis versions

When analysis succeeds, store:
- version;
- source-data version;
- model;
- prompt version;
- retrieval config;
- overall result;
- each criterion status/rationale;
- evidence links.

Do not overwrite old analysis after new documentation.

This is how you answer in an interview:
> "We preserved analysis provenance so we could reproduce and compare decisions after the source record changed."

---

# 22. Build the background worker

Why background jobs? AI analysis can take seconds and may retry. The browser should not hold one huge request open.

MVP uses database-backed queue.

Pseudo worker loop:
```text
find queued job with row lock
mark running
execute graph
if success -> persist + Ready
if retryable and attempt < 3 -> queue next attempt
else -> Analysis Failed
```

Run API and worker in separate terminals locally.

### Test deliberately
Make OpenAI adapter throw a simulated transient error to verify retry behavior without spending API calls.

---

# 23. Connect frontend through Api services

Now implement `ApiCaseService`, etc.

Do **not** rewrite UI.

If backend JSON differs from frontend domain model, map it inside API service.

Switch composition from:
```text
MockCaseService
```
to:
```text
ApiCaseService
```

If you find yourself changing every page, your service boundary was not clean enough.

---

# 24. Evaluation — the part that proves the project works

Do not say "the AI seems accurate."

Your generator already stored truth.

## 24.1 Retrieval evaluation
For each criterion:
- expected evidence passage/fact set;
- retrieved top K.

Compute Recall@K.

Example:
Expected 2 relevant passages, retrieved top 5 contains both => Recall@5 = 1.0.
Contains one => 0.5.

## 24.2 Criterion confusion matrix
Statuses are three-class classification.
Build confusion matrix and per-class precision/recall/F1.

If model rarely predicts Not Supported, plain accuracy can hide it.

## 24.3 Overall recommendation accuracy
Compare deterministic aggregate output with expected ground truth.

## 24.4 Citation accuracy
Sample/check whether cited passage actually contains/supports the generated fact. Because your synthetic generator knows source facts, make this as deterministic as practical.

## 24.5 Unsupported-claim failures
Create an evaluator that flags rationales whose facts are not traceable to selected passages. For MVP you may evaluate at assessment level and manually audit a sample.

## 24.6 Failure taxonomy
For each error decide:
- data bug?
- retrieval miss?
- wrong rank?
- model interpretation?
- stale evidence?
- citation mismatch?
- aggregation bug?

This is much more useful than blindly changing prompts.

---

# 25. How to debug a wrong answer

## Scenario A — correct evidence never retrieved
This is retrieval/data problem.
Check:
1. was source ingested?
2. was correct passage created?
3. is patient/source version correct?
4. embedding exists?
5. lexical text preserves important term?
6. query quality?
7. K too low?
8. hybrid merge pushing it down?

Do not edit the LLM prompt first.

## Scenario B — correct evidence retrieved, model status wrong
This is likely criterion interpretation/prompt/model problem.
Check:
1. exact criterion text;
2. evidence context quality;
3. contradictory evidence;
4. structured instructions;
5. model output and rationale.

## Scenario C — status right, citation wrong
Grounding/citation selection problem. Tighten allowed evidence IDs and validator.

## Scenario D — criteria correct, overall recommendation wrong
This is deterministic aggregation/policy rule bug. Do not blame LLM.

## Scenario E — system invents facts
Treat as serious. Check prompt, evidence scope, citation validator. Never accept a polished rationale without support.

---

# 26. Measure before optimizing

Track at least:
- evidence recall;
- criterion accuracy/F1;
- overall recommendation accuracy;
- citation accuracy;
- insufficient-evidence recall;
- unsupported rate;
- analysis latency;
- retries/failures;
- approximate OpenAI cost.

Change one configuration family at a time and record results.

---

# 27. Optional future learning: train a smaller model

**This is not required for MVP.** Do it only after the end-to-end system and evaluation suite work.

A useful supervised task:

Input:
```text
Synthetic policy criterion + retrieved evidence
```
Output:
```text
SUPPORTED / NOT_SUPPORTED / INSUFFICIENT_EVIDENCE
```

## 27.1 Build dataset
Export examples from generated ground truth:
```json
{
  "patient_group_id":"...",
  "criterion":"...",
  "evidence":"...",
  "label":"SUPPORTED"
}
```

## 27.2 Prevent leakage
Split by patient before training. All examples from one patient stay in one split.

## 27.3 Start with a baseline
Before deep learning:
- majority class baseline;
- maybe TF-IDF + logistic regression as sanity baseline.

Then choose a small transformer classifier suitable for text classification through Hugging Face. Do not jump to a huge model.

## 27.4 Install learning stack
Conceptually:
```powershell
pip install torch transformers datasets scikit-learn evaluate
```
Use official current installation instructions for PyTorch/Hugging Face appropriate to your hardware.

## 27.5 Training flow
```text
load train/validation
↓
tokenize
↓
map labels to IDs
↓
train small transformer
↓
monitor validation loss/F1
↓
early stop/select best checkpoint
↓
evaluate once on held-out test
```

## 27.6 What overfitting looks like
Training performance rises while validation performance stalls/falls. Mitigate with:
- more diverse data;
- fewer epochs;
- regularization/model size choices;
- early stopping;
- better split integrity.

## 27.7 Compare to LLM
Evaluate same held-out cases:
```text
LLM approach
Small trained classifier
Hybrid/routing approach
```
Compare quality, latency and cost. A smaller classifier may be useful if it is sufficiently accurate for a narrow task, but never replace evidence/audit structure merely because it is cheaper.

## 27.8 LoRA/PEFT later
Parameter-efficient fine-tuning can be explored later for generative/open models, but it is not the first training exercise for this MVP. Learn the classification pipeline and evaluation discipline first.

---

# 28. What you should be able to explain in an interview

By the end, you should confidently answer:
- Why Synthea instead of real health records?
- What is FHIR R4?
- How did you convert FHIR resources into retrieval passages?
- What is an embedding?
- Why PostgreSQL + pgvector?
- Why hybrid retrieval?
- How did you measure retrieval quality?
- Why LangGraph rather than one huge prompt?
- Which logic is deterministic vs LLM-based?
- How do you prevent hallucinated citations?
- What happens when OpenAI fails?
- Why is analysis asynchronous?
- How are previous AI versions preserved?
- How can a human override AI while preserving accountability?
- What metrics prove the system works?
- What are the limitations of synthetic evaluation?

If you cannot explain a component, inspect it before allowing an agent to add more complexity.

---

# 29. Recommended personal build checkpoints

## Checkpoint 1
Frontend mock workflow complete.

## Checkpoint 2
FastAPI + PostgreSQL + real reviewer login complete.

## Checkpoint 3
10 Synthea patients ingested.

## Checkpoint 4
One synthetic policy + one generated case with correct ground truth.

## Checkpoint 5
One correct evidence passage retrieved by lexical and vector search.

## Checkpoint 6
Hybrid retrieval measured on a small validation set.

## Checkpoint 7
One criterion assessed with structured OpenAI output and valid citation.

## Checkpoint 8
One complete case analyzed through LangGraph.

## Checkpoint 9
Background worker/retry works.

## Checkpoint 10
Frontend uses real backend without UI rewrite.

## Checkpoint 11
Held-out evaluation report generated.

Only then call MVP end-to-end.

---

# 30. Official references bookmark list

## Healthcare/data
- Synthea: https://synthetichealth.github.io/synthea/
- Synthea GitHub: https://github.com/synthetichealth/synthea
- HL7 FHIR R4: https://www.hl7.org/fhir/R4/
- CMS prior authorization rule: https://www.cms.gov/newsroom/fact-sheets/cms-interoperability-prior-authorization-final-rule-cms-0057-f
- Optum workflow context: https://business.optum.com/en/operations-technology/clinical-decision-support/interqual/autoreview.html

## Backend/AI
- FastAPI: https://fastapi.tiangolo.com/
- FastAPI auth/JWT: https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/
- PostgreSQL: https://www.postgresql.org/docs/
- pgvector: https://github.com/pgvector/pgvector
- LangGraph: https://docs.langchain.com/oss/python/langgraph/overview
- OpenAI API quickstart: https://developers.openai.com/api/docs/quickstart
- OpenAI embeddings: https://developers.openai.com/api/docs/guides/embeddings
- OpenAI structured outputs: https://developers.openai.com/api/docs/guides/structured-outputs

## Frontend
- Next.js: https://nextjs.org/docs
- TanStack Query: https://tanstack.com/query/latest/docs/framework/react/installation
- Tailwind + Next.js: https://tailwindcss.com/docs/installation/framework-guides/nextjs

---

# Final rule
Use coding agents as implementation accelerators, not as the source of architectural truth. The specifications, tests, synthetic ground truth, and measured evaluation results are the source of truth.

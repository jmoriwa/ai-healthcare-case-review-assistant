# 06 — External Services, Libraries, and Data Setup

Use official documentation first. Versions change; pin tested versions in lockfiles/requirements after the first working setup.

## 1. Synthea — synthetic patients
### Purpose
Generate realistic-but-not-real longitudinal patient records without PHI.

### Official sources
- Project: https://synthetichealth.github.io/synthea/
- GitHub/commands: https://github.com/synthetichealth/synthea

Synthea supports FHIR R4 output and generation parameters including population size and random seed. Current source requirements state Java JDK 17+ and provide `run_synthea`/`run_synthea.bat` commands.

### Minimal validation run
Windows:
```powershell
git clone https://github.com/synthetichealth/synthea.git
cd synthea
.\run_synthea.bat -s 42 -p 10 --exporter.fhir.export=true
```
macOS/Linux:
```bash
git clone https://github.com/synthetichealth/synthea.git
cd synthea
./run_synthea -s 42 -p 10 --exporter.fhir.export=true
```
Confirm output contains FHIR JSON under Synthea output directory before building ingestion.

### MVP rule
Generate a tiny batch first. Do not begin with 10,000 patients. Scale only after parser/case generator is validated.

## 2. HL7 FHIR R4
### Purpose
Canonical raw synthetic clinical-data format.

### Official source
https://www.hl7.org/fhir/R4/

CMS-0057-F also specifically identifies FHIR Release 4.0.1 for relevant interoperability requirements: https://www.cms.gov/newsroom/fact-sheets/cms-interoperability-prior-authorization-final-rule-cms-0057-f

### Resources expected in project
- Patient
- Encounter
- Condition
- Observation
- Procedure
- MedicationRequest
- DiagnosticReport
- DocumentReference where available/useful
- CarePlan optional if useful

Do not attempt full FHIR-server compliance. Parse the subset needed for the synthetic case-review workflow.

## 3. PostgreSQL
### Purpose
Primary relational database.

### Official download/docs
- Downloads: https://www.postgresql.org/download/
- Windows: https://www.postgresql.org/download/windows/
- Docs: https://www.postgresql.org/docs/

MVP local development may use installed PostgreSQL directly. Docker is not required.

## 4. pgvector
### Purpose
Store/query evidence embeddings inside PostgreSQL.

### Official source
https://github.com/pgvector/pgvector

pgvector supports exact nearest-neighbor search by default and HNSW/IVFFlat indexes for approximate search. Start exact for small MVP datasets; add HNSW only after measuring a need.

After installation in the target DB:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 5. Python
Use a currently supported Python 3.x release compatible with chosen packages; document exact tested version in repository (for example `.python-version`).

Recommended local setup:
```bash
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate
```

Dependency management may use `uv` or pip. Choose one and keep it consistent. If using `uv`, pin lockfile.

## 6. FastAPI
### Purpose
REST API.

### Official docs
- https://fastapi.tiangolo.com/
- Security intro: https://fastapi.tiangolo.com/tutorial/security/
- Password hashing + JWT example: https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/

Do not use the intentionally insecure simple tutorial token implementation in production-like MVP code. Use the secure hashing/JWT pattern.

## 7. LangGraph
### Purpose
Explicit orchestration of AI analysis workflow.

### Official docs
https://docs.langchain.com/oss/python/langgraph/overview

Install current compatible package per official docs and pin it after validation. LangGraph core is used locally; hosted LangGraph/LangSmith services are not required for MVP.

## 8. OpenAI API
### Purpose
- embeddings for evidence passages;
- semantic criterion/evidence assessment and structured generation.

### Official docs
- Quickstart: https://developers.openai.com/api/docs/quickstart
- Embeddings: https://developers.openai.com/api/docs/guides/embeddings
- Structured outputs: https://developers.openai.com/api/docs/guides/structured-outputs

### Account/billing note
ChatGPT subscription and API billing are separate. Configure an API key in environment variable only.

Example environment:
```env
OPENAI_API_KEY=...
OPENAI_CHAT_MODEL=<chosen-supported-model>
OPENAI_EMBEDDING_MODEL=<chosen-supported-embedding-model>
```

Do not hardcode a model name in domain logic. Keep it configuration-driven because model availability/pricing changes.

## 9. Next.js / React / TypeScript
### Official docs
- Next.js: https://nextjs.org/docs
- App Router getting started: https://nextjs.org/learn/dashboard-app/getting-started

Scaffold with current `create-next-app` and TypeScript/App Router. Pin Node version in repository (`.nvmrc` or equivalent) after validation.

## 10. Tailwind CSS
### Official Next.js installation
https://tailwindcss.com/docs/installation/framework-guides/nextjs

Use current official instructions; Tailwind setup has changed across major versions, so do not rely on old blog tutorials.

## 11. TanStack Query
### Purpose
Server-state querying/mutations against service interfaces.

### Official docs
- Install: https://tanstack.com/query/latest/docs/framework/react/installation
- Quick start: https://tanstack.com/query/latest/docs/framework/react/quick-start

Components/hooks call service methods; TanStack Query is not permission to bypass the services layer.

## 12. Optional development tools
- Git/GitHub
- VS Code
- pgAdmin or `psql`
- Postman/Insomnia optional; FastAPI `/docs` is sufficient for most API exploration.

## 13. `.env.example`
Commit only names/placeholders:
```env
APP_ENV=development
DATABASE_URL=postgresql+<driver>://<user>:<password>@localhost:<port>/<db>
OPENAI_API_KEY=
OPENAI_CHAT_MODEL=
OPENAI_EMBEDDING_MODEL=
JWT_SECRET_KEY=
ACCESS_TOKEN_EXPIRE_MINUTES=60
LOG_LEVEL=INFO
```

## 14. What costs money
Required libraries/database/data generator are free/open source for local use. OpenAI API usage is metered/paid. Cloud hosting is not required for MVP.

## 15. Source-of-truth links for healthcare problem context
- Optum InterQual AutoReview: https://business.optum.com/en/operations-technology/clinical-decision-support/interqual/autoreview.html
- CMS Interoperability and Prior Authorization Final Rule: https://www.cms.gov/newsroom/fact-sheets/cms-interoperability-prior-authorization-final-rule-cms-0057-f

These sources justify the real workflow category; they do not grant permission to copy proprietary criteria or claim clinical equivalence.

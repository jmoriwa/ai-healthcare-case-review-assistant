# Healthcare Case Review Assistant

An evidence-grounded AI system that helps utilization management and prior authorization reviewers evaluate healthcare cases faster, while keeping the final decision with a qualified human reviewer.

The system analyzes synthetic longitudinal patient records, compares available clinical evidence against medical-necessity criteria, identifies missing documentation, and produces a structured recommendation with citations to the exact supporting evidence.

> **Important:** This project uses synthetic patient data only. It is an educational and engineering prototype and is not intended for clinical use or represented as HIPAA-compliant or clinically validated.

---

## Why This Project Exists

Prior authorization and medical-necessity review can require healthcare professionals to manually search through large patient records to answer relatively specific questions:

* Has the patient experienced symptoms for the required duration?
* Has conservative treatment already been attempted?
* Are the necessary clinical findings documented?
* Are required tests or imaging results available?
* Does the available documentation satisfy each medical-necessity criterion?
* What information is still missing?

The information required to answer these questions may be distributed across encounters, clinical notes, medications, procedures, observations, diagnostic reports, and other records.

The goal of this project is not to replace the reviewer.

The goal is to reduce the amount of manual information retrieval required before the reviewer can make an informed decision.

---

## Core Principle

**AI assists. Humans decide.**

The AI can:

1. analyze available documentation,
2. identify relevant evidence,
3. evaluate individual medical-necessity criteria,
4. explain its reasoning,
5. identify missing documentation,
6. provide an overall recommendation.

The AI cannot issue the final authorization decision.

A human reviewer reviews the AI assessment and the underlying evidence before selecting the final disposition.

---

## MVP Scope

The MVP models a hospital utilization-management workflow involving five prior-authorization procedure types:

* Lumbar Spine MRI
* CT Chest with Contrast
* Cervical Fusion with Disc Removal
* Facet Joint Intervention
* Radiation Therapy

Cases from all procedure types appear together in a shared reviewer work queue.

### AI Recommendation States

The AI can produce one of three overall recommendations:

* **Criteria Appear Satisfied**
* **Criteria Appear Not Satisfied**
* **Additional Documentation Needed**

Each individual medical-necessity criterion is evaluated as:

* **Supported**
* **Not Supported**
* **Insufficient Evidence**

Every clinical claim in the AI rationale must be linked to supporting evidence.

---

## Human Review Workflow

Reviewers can:

* sign in using individual reviewer accounts,
* view a shared queue of analyzed cases,
* search and filter cases,
* claim unassigned cases,
* view their active and completed cases,
* review AI-identified evidence,
* open the broader patient timeline when needed,
* inspect the exact passage supporting an AI claim,
* override an AI criterion assessment,
* provide a required reason for an override,
* add immutable reviewer notes,
* save review progress,
* request additional documentation,
* approve or deny a case,
* escalate a case for physician review,
* inspect the complete case activity history.

Other reviewers may open claimed cases in read-only mode to support transparency and accountability.

Completed cases are permanently read-only in the MVP.

---

## Final Human Decisions

A reviewer can select:

* **Approve**
* **Deny**
* **Request More Information**
* **Escalate for Physician Review**

Rules include:

* Deny always requires a rationale.
* Escalation always requires a rationale.
* Request More Information requires the reviewer to identify the missing documentation.
* Approve requires additional rationale when overriding the AI recommendation.
* Any criterion-level AI override requires a reason.

Physician review itself is outside the MVP. Escalated cases enter a `Pending Physician Review` state.

---

## Evidence Grounding

The system is designed around a simple rule:

> **No clinical claim without evidence.**

AI-generated assessments include citations to the source evidence used to support each conclusion.

A reviewer can open a citation and inspect the exact supporting passage rather than searching through the entire patient record.

When evidence is unavailable, the system should report insufficient evidence instead of inventing an answer.

---

## Synthetic Healthcare Data

The project uses **Synthea** to generate realistic synthetic longitudinal patient records.

FHIR R4 resources may include:

* Patient
* Encounter
* Condition
* Observation
* Procedure
* MedicationRequest
* DiagnosticReport
* CarePlan
* AllergyIntolerance

No real patient health information is used.

The project also generates:

* synthetic prior-authorization requests,
* original synthetic medical-necessity policies,
* policy criteria,
* expected supporting evidence,
* missing-evidence scenarios,
* ground-truth criterion labels,
* ground-truth overall recommendations.

This provides a controlled dataset for measuring whether the AI is actually performing correctly.

---

## System Architecture

```text
                    Frontend
            React + TypeScript
                     |
                     v
             Service Contracts
                     |
                     v
               FastAPI REST API
                     |
        +------------+-------------+
        |            |             |
        v            v             v
 PostgreSQL       pgvector     Background Jobs
        |            |             |
        +------------+-------------+
                     |
                     v
              LangGraph Workflow
                     |
            +--------+--------+
            |                 |
            v                 v
       Retrieval          OpenAI API
            |                 |
            +--------+--------+
                     |
                     v
            Grounded AI Analysis
                     |
                     v
              Human Reviewer
```

---

## Technology Stack

### Frontend

* React
* TypeScript
* TanStack Router / Start
* TanStack Query
* React built-in state
* Service-interface architecture
* Mock service implementations for frontend-first development

### Backend

* Python
* FastAPI
* REST API
* PostgreSQL
* pgvector
* LangGraph
* OpenAI API

### Data

* Synthea
* HL7 FHIR R4
* Synthetic medical-necessity policies
* Synthetic labeled prior-authorization cases

### AI / Retrieval

* Embeddings
* Vector retrieval
* Lexical retrieval
* Hybrid search
* Metadata filtering
* Reranking
* Structured LLM outputs
* Evidence grounding
* Citation verification

### Evaluation

The project evaluates more than whether an answer "looks correct."

Metrics include:

* criterion assessment accuracy,
* overall recommendation accuracy,
* evidence recall,
* retrieval precision,
* citation correctness,
* missing-information detection,
* unsupported-claim rate,
* performance by procedure type,
* reviewer override rate,
* latency and processing performance.

---

## Frontend Architecture

The frontend follows a strict dependency boundary:

```text
Routes / Components
        |
        v
       Hooks
        |
        v
 Service Interfaces
        |
        v
Mock or API Implementation
```

UI components are prohibited from directly accessing:

* backend endpoints,
* mock fixtures,
* databases,
* AI providers.

This allows the frontend to run completely against mock services while the backend is under development.

When the real backend is ready, only the service implementations need to change.

---

## Current Project Status

### Completed

* [x] Product requirements
* [x] MVP specification
* [x] System architecture
* [x] Domain model
* [x] Frontend architecture
* [x] Service contracts
* [x] Mock service layer
* [x] Reviewer authentication UI
* [x] Shared case queue
* [x] My Cases
* [x] Case claiming
* [x] Read-only reviewer access
* [x] Criterion-level AI assessment UI
* [x] Evidence passage viewer
* [x] Patient timeline
* [x] AI override workflow
* [x] Reviewer notes
* [x] Final-decision workflow
* [x] Case activity timeline
* [x] AI analysis version history
* [x] AI Quality dashboard
* [x] Frontend automated tests

The mock-backed frontend currently has **46 passing behavioral tests**.

### In Progress

* [ ] FastAPI backend foundation
* [ ] PostgreSQL schema
* [ ] pgvector setup
* [ ] Real reviewer authentication
* [ ] Synthea/FHIR ingestion
* [ ] Synthetic authorization-case generator
* [ ] Hybrid retrieval pipeline
* [ ] LangGraph case-analysis workflow
* [ ] OpenAI integration
* [ ] Background analysis processing
* [ ] Grounding and citation validation
* [ ] Evaluation pipeline
* [ ] Real frontend/backend integration

---

## Repository Structure

```text
.
├── frontend/
│   ├── src/
│   │   ├── domain/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── components/
│   │   ├── routes/
│   │   └── mocks/
│   └── ...
│
├── backend/
│   └── ...
│
├── docs/
│   ├── frontend/
│   ├── backend/
│   └── ...
│
├── AGENTS.md
├── IMPLEMENTATION-ROADMAP.md
├── ENGINEER_IMPLEMENTATION_GUIDE.md
└── README.md
```

---

## Engineering Principles

This project emphasizes maintainability and clear system boundaries.

Key principles include:

* clear and meaningful naming,
* single-responsibility components and services,
* high cohesion and low coupling,
* centralized business rules,
* explicit domain types,
* dependency inversion through service interfaces,
* minimal duplication,
* deterministic logic where an LLM is unnecessary,
* strict evidence traceability,
* testable business rules,
* human oversight for consequential decisions.

The goal is to use AI only where AI adds value rather than making every part of the application "AI-powered."

---

## AI Reliability

A major goal of the project is to determine **why the system fails**, not simply calculate an overall accuracy score.

Potential failure categories include:

```text
Retrieval failure
Evidence ranking failure
Missing evidence not detected
Incorrect criterion interpretation
Unsupported clinical claim
Incorrect citation
Stale evidence used
Conflicting evidence mishandled
Overall recommendation error
Workflow failure
```

Failures are analyzed at the component level so improvements can target the actual source of error.

---

## MVP Boundaries

The following are intentionally outside the MVP:

* real patient data,
* autonomous authorization decisions,
* production hospital deployment,
* physician-review workflow,
* EHR integration,
* payer integration,
* reviewer self-registration,
* enterprise SSO,
* MFA,
* admin roles,
* automatic case assignment,
* notifications,
* reviewer document uploads,
* Kubernetes,
* calibrated per-case AI confidence scores.

These may be explored in future versions after the core workflow has been validated.

---

## Safety and Healthcare Disclaimer

This repository is a software engineering and AI research prototype.

It:

* uses synthetic patient data,
* is not a medical device,
* is not clinically validated,
* is not intended to provide medical advice,
* is not intended to autonomously approve or deny healthcare services,
* is not represented as HIPAA compliant,
* requires human review for all final case decisions.

Any real-world deployment would require substantially more work in clinical validation, security, privacy, regulatory compliance, interoperability, organizational governance, and production monitoring.

---

## Project Goal

The technical goal is to build and evaluate an end-to-end AI engineering system that demonstrates:

* healthcare data engineering,
* FHIR processing,
* information retrieval,
* vector databases,
* LLM orchestration,
* grounded generation,
* human-in-the-loop AI,
* evaluation,
* failure analysis,
* backend engineering,
* frontend engineering,
* auditability,
* production-oriented software architecture.

The broader goal is to explore how AI can reduce the information-processing burden placed on healthcare professionals while preserving human judgment for decisions that affect patient care.

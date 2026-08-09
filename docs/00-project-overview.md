# 00 — Project Overview

## 1. Project name
**Healthcare Case Review Assistant**

Subtitle: **Evidence-grounded clinical documentation review for utilization management**

## 2. Problem statement
Hospital utilization-management and prior-authorization teams must determine whether available clinical documentation supports the medical-necessity criteria associated with a requested service. This work is information-heavy: reviewers repeatedly inspect longitudinal EHR data, notes, diagnoses, procedures, medications, labs, imaging reports, and other records, then compare those facts with policy requirements.

The burden is not merely "too much text." The core operational problems are:
1. Relevant evidence is dispersed across many records and encounters.
2. Reviewers spend time finding evidence rather than applying professional judgment.
3. Missing documentation may not be obvious until late in review.
4. Manual review can be inconsistent and error-prone.
5. AI-generated summaries are unsafe if they are not traceable to source evidence.
6. High-stakes workflows require human accountability, audit history, and transparent disagreements with automation.

Optum describes medical-necessity review as labor-intensive because clinical staff repeatedly comb through EHR data to find what is needed for each review. Its InterQual AutoReview product is an example of the same real workflow category: extracting EHR data and mapping it into a medical-necessity review workflow. See: https://business.optum.com/en/operations-technology/clinical-decision-support/interqual/autoreview.html

CMS is also moving prior authorization toward interoperable electronic workflows. CMS-0057-F requires certain impacted payers to support a FHIR-based Prior Authorization API beginning in 2027, including documentation requirements, request/response, approval/denial information, and requests for more information. See: https://www.cms.gov/newsroom/fact-sheets/cms-interoperability-prior-authorization-final-rule-cms-0057-f

## 3. Product purpose
The MVP assists a utilization-management reviewer by:
- loading an authorization case after automated analysis is complete;
- presenting the requested procedure and synthetic policy criteria;
- surfacing the exact clinical passages that the AI identified as evidence for each criterion;
- assigning each criterion one evidence status;
- generating a short evidence-grounded rationale per criterion;
- producing a non-binding overall AI recommendation;
- highlighting missing evidence;
- allowing the reviewer to inspect the broader patient timeline;
- allowing a human reviewer to override AI findings with mandatory rationale;
- recording immutable notes and activity history;
- preserving versioned AI analyses;
- exposing aggregate AI quality metrics to reviewers.

The system **does not** replace a clinician or utilization-management reviewer.

## 4. Primary user
**Hospital Utilization Management Nurse / Prior-Authorization Specialist**

The MVP has one product role but 2–3 separate reviewer accounts so ownership and transparency can be demonstrated.

### Reviewer goals
- find relevant evidence faster;
- understand exactly why the AI reached a conclusion;
- verify evidence independently when needed;
- identify missing documentation early;
- preserve professional judgment;
- create an accountable review trail.

## 5. Five MVP procedure types
The mixed work queue contains cases from these procedure categories:
1. Lumbar Spine MRI
2. CT Chest with Contrast
3. Cervical Fusion with Disc Removal
4. Facet Joint Intervention / Injection
5. Radiation Therapy

These are product test categories, not clinical guidance. All medical-necessity criteria in the MVP are synthetic and project-owned.

## 6. AI responsibility boundary
### AI may
- retrieve evidence;
- map evidence to criteria;
- mark a criterion `Supported`, `Not Supported`, or `Insufficient Evidence`;
- explain the criterion assessment using cited passages only;
- identify missing documentation;
- generate one overall recommendation.

### AI may not
- issue the final authorization decision;
- recommend escalation to a physician;
- invent clinical facts;
- cite evidence it did not retrieve;
- display an unvalidated confidence score;
- alter reviewer notes or prior analysis versions.

### Overall AI recommendation values
- `Criteria Appear Satisfied`
- `Criteria Appear Not Satisfied`
- `Additional Documentation Needed`

## 7. Human responsibility boundary
The assigned reviewer makes the final workflow decision:
- Approve
- Deny
- Request More Information
- Escalate for Physician Review

Human escalation is not an AI recommendation.

Reviewer rationale rules:
- Approve: rationale optional unless overriding AI.
- Deny: rationale always required.
- Request More Information: exact missing documentation/evidence always required.
- Escalate for Physician Review: rationale always required.
- Any criterion-level AI override: reason always required.

## 8. Realism without real patient data
The project uses Synthea, an open-source synthetic patient generator that produces realistic-but-not-real health histories and can export HL7 FHIR R4. Synthea data is explicitly intended for Health IT development and is free from real-patient privacy restrictions. Sources:
- https://synthetichealth.github.io/synthea/
- https://github.com/synthetichealth/synthea

FHIR R4 is the canonical raw clinical data format for the project because it is a real healthcare data-exchange standard. Source: https://www.hl7.org/fhir/R4/

## 9. MVP product experience
The normal sequence is:
1. synthetic clinical data enters through the backend data flow;
2. a case and matching synthetic policy are created;
3. the case is analyzed asynchronously;
4. only successfully analyzed cases become claimable;
5. reviewer claims an unassigned case;
6. other reviewers can still inspect it read-only;
7. assigned reviewer inspects AI-selected evidence and may open the patient timeline;
8. reviewer can save progress;
9. reviewer may override criterion status, with required reason;
10. reviewer makes final decision;
11. completed cases become permanently read-only;
12. all material actions appear in the case activity timeline.

## 10. Why this matters as an AI engineering project
This project demonstrates more than an LLM wrapper. The meaningful engineering work is:
- FHIR ingestion and normalization;
- reproducible synthetic-data generation;
- domain-grounded case generation and ground truth;
- vector and lexical retrieval;
- evidence passage identity and traceability;
- structured LLM output;
- deterministic workflow orchestration;
- asynchronous analysis jobs;
- failure handling and retries;
- audit-safe versioning;
- human-in-the-loop review;
- evaluation of evidence recall, citation accuracy, recommendation correctness, and unsupported claims.

## 11. MVP success definition
The MVP is successful when a reviewer can sign in, see a realistic mixed queue, claim a case after AI analysis, inspect criterion-by-criterion evidence and rationales, verify source passages, inspect a broader patient timeline, save progress, record notes, make a final human decision, and view AI quality metrics; and when the backend can reproducibly generate and evaluate synthetic cases end to end.

## 12. Explicit future-version ideas
Not part of MVP:
- automatic routing/assignment;
- urgency tiers;
- notifications;
- reviewer document uploads;
- admin role and correction permissions;
- physician-review workflow after escalation;
- SSO/MFA;
- payer/EHR production integration;
- deployment hardening and formal compliance programs;
- calibrated per-case confidence;
- broader procedures/specialties;
- trained/fine-tuned task model as a required component.

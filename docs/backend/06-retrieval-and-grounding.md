# Backend 06 — Retrieval and Grounding

## 1. Goal
Find the evidence passages most relevant to a specific synthetic policy criterion while preserving exact source traceability.

## 2. Why hybrid retrieval
Clinical records contain both semantic concepts and exact terms/codes/dates. Vector-only retrieval can miss lexical specifics; keyword-only can miss paraphrases. MVP should implement and evaluate:
1. lexical baseline;
2. vector baseline;
3. hybrid retrieval;
4. optional lightweight reranking if it measurably improves results.

## 3. Evidence passage creation
### Structured FHIR resources
Prefer one compact passage per meaningful resource/fact rather than arbitrary character chunks.
Example Observation passage:
```text
Observation: Hemoglobin A1c = 7.2 %. Effective date: 2026-04-15.
```
Structured field path identifies source.

### Narrative notes
Chunk by paragraphs/sections where possible. Do not split every N characters blindly. Preserve:
- clinical note ID;
- date;
- section;
- offsets/span;
- patient/source version.

For MVP, a reasonable initial max chunk size can be tested (e.g. a few hundred tokens), but choose based on evaluation, not as immutable requirement.

## 4. Embeddings
OpenAI embedding official guide: https://developers.openai.com/api/docs/guides/embeddings

Generate embedding once per passage/model version and store in pgvector.
Persist `embedding_model` so re-embedding can be managed if model changes.

## 5. Vector database
pgvector official: https://github.com/pgvector/pgvector

Start exact search for small data:
```sql
SELECT id, text, embedding <=> :query_embedding AS distance
FROM evidence_passages
WHERE patient_id = :patient_id
  AND source_data_version = :version
ORDER BY embedding <=> :query_embedding
LIMIT :k;
```
Operator depends on selected distance/operator class; choose consistently with embeddings and document it.

## 6. Lexical search
Use PostgreSQL full-text search or a simple ranked lexical strategy. Recommended PostgreSQL FTS:
- generated/expression `to_tsvector('english', text)`;
- GIN index when needed;
- `websearch_to_tsquery`/`plainto_tsquery` according to controlled query design.

## 7. Hybrid merge
Simple MVP method: Reciprocal Rank Fusion (RRF) or normalized weighted rank combination.
RRF avoids comparing incompatible raw score scales.

Conceptual:
```text
lexical top 20
vector top 20
    ↓
RRF merge
    ↓
top 10 candidate evidence
```
Then optional reranker/top selection.

## 8. Metadata filters
Always apply:
- patient_id;
- source_data_version.
Optional criterion-aware filters:
- date window if synthetic policy explicitly requires it;
- resource types;
- procedure/encounter metadata.
Do not filter so aggressively that recall collapses without evaluation.

## 9. Reranking
MVP can begin without a paid reranker. Options:
- deterministic rule boost (recency/resource relevance);
- LLM small rerank call only if measured and affordable;
- later local cross-encoder.

Do not add a new paid provider merely to claim reranking.

## 10. Evidence identity
Every candidate sent to LLM has an opaque stable evidence ID, e.g. `EVID-<uuid-short>` in prompt mapping. Model must select from supplied IDs only.

Persistence uses actual UUID. Prompt alias maps safely back to UUID.

## 11. Grounding validation
Before persisting assessment:
1. evidence ID exists in candidates;
2. evidence belongs to correct patient;
3. evidence belongs to source data version;
4. criterion assessment references only supplied evidence;
5. rationale exists;
6. for Supported/Not Supported, at least one evidence item normally required;
7. for Insufficient Evidence, evidence may be empty; rationale must describe missing/insufficient documentation without inventing a negative fact.

## 12. Retrieval evaluation
For each ground-truth criterion, know expected evidence facts/passages.
Metrics:
- Recall@K = fraction of expected relevant evidence recovered in top K;
- Precision@K optional/useful;
- MRR for first relevant result;
- procedure-specific Recall@K.

Primary MVP retrieval target should emphasize high recall because human/LLM cannot reason over evidence that was never retrieved. Tune K and hybrid strategy on validation set.

## 13. Debug artifact
For each evaluation failure, save:
- criterion;
- query text;
- lexical ranks;
- vector ranks/distances;
- merged ranks;
- selected evidence;
- expected evidence.

This makes retrieval errors diagnosable.

## 14. Retrieval configuration version
Persist a config identifier containing or pointing to:
- embedding model;
- passage strategy version;
- lexical query strategy;
- vector K;
- lexical K;
- merge method/weights;
- final K;
- reranker version if any.

Example `hybrid-rrf-v1`.

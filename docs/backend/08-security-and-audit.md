# Backend 08 — Security and Audit

## 1. Scope statement
The MVP uses synthetic patient data and is **not** represented as HIPAA-certified or production-ready for PHI. Nevertheless, build security/audit patterns consistent with a sensitive healthcare workflow so architecture can mature later.

## 2. Authentication
- pre-created reviewer accounts;
- secure password hashing (FastAPI current example uses modern password hashing tooling; follow official secure guide);
- signed bearer token;
- short reasonable token expiration for development;
- disabled/inactive account support.

Official guide: https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/

## 3. Password rules
MVP seed passwords may be developer-defined but:
- never store plaintext in DB;
- seed script hashes them;
- do not commit real reusable personal passwords;
- use `.test` reviewer emails.

## 4. Authorization
Server-side checks for every mutation.
Read access: authenticated reviewers.
Write access: assigned reviewer only while state permits.
No admin override.

## 5. Audit principles
### Immutable history
Do not update/delete:
- AI analyses;
- reviewer notes;
- activity events;
- submitted terminal decisions.

### Actor identity
Every reviewer-created record stores reviewer ID. Activity events identify System/Worker/Reviewer.

### Timestamps
Server-generated UTC timestamps. Do not trust browser timestamp for authoritative audit record.

## 6. Activity metadata
Keep metadata minimal and non-secret. Examples:
- previous/new status;
- analysis version;
- decision type;
- override criterion ID;
- job attempt.

Do not copy full note/clinical text into activity metadata when canonical record exists elsewhere.

## 7. Secrets
Environment only:
- OpenAI key;
- JWT secret;
- DB password.

`.gitignore` must include `.env` and local secret files. Commit `.env.example` only.

## 8. Logging
Reviewer-facing response contains request ID, not traceback.
Backend log can contain exception stack and technical context but should avoid raw whole patient bundles/prompts by default.

Never log:
- passwords;
- access tokens;
- OpenAI API keys.

## 9. Prompt/data leakage
Because data is synthetic, PHI risk is absent in MVP, but still send only evidence relevant to current synthetic case/criterion to OpenAI. This follows data-minimization and makes future production adaptation easier.

## 10. SQL/database safety
Use parameterized ORM/query APIs. Never build SQL with untrusted string interpolation. Validate enums/UUIDs via Pydantic/domain types.

## 11. CORS
During local frontend/backend development, allow only configured local frontend origin(s), not blanket wildcard when credentials/auth semantics make that unsafe.

## 12. Rate/abuse controls
Not a primary MVP concern for a local single-developer system. Still prevent accidental duplicate AI jobs through idempotency and state checks to control cost.

## 13. Audit tests
- non-owner mutation forbidden;
- note update/delete endpoint absent;
- AI analysis update endpoint absent;
- terminal case mutation forbidden;
- actor/timestamp recorded;
- claim ownership event recorded;
- retry/failure activity recorded;
- override reason preserved.

## 14. Future production requirements explicitly not claimed
Real deployment would require formal threat modeling, PHI handling controls, encryption/key management, identity federation, least privilege, compliance/security review, data-retention policy, vendor BAAs as applicable, EHR integration security, incident response, audit retention, and organizational clinical governance. These are not MVP certification claims.

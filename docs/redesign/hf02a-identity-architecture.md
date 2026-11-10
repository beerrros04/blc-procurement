# HF02-A — Persistent Identity Architecture (Revision 01)

**Status:** RESOLVED & IMPLEMENTED — READY FOR PRODUCT OWNER REVIEW  
**Scope:** HF02-A Identity Foundation only (`ADR-ID-001`, `ADR-ID-002`, `ADR-ID-003`)  
**HF02-B:** NOT AUTHORIZED

## 1. Overview & Architectural Decisions

Following ADR-ID-001, SQLite serves as the authoritative, durable source of application account identity. The previous blocker (reliance on volatile in-memory seed maps with no lifecycle or non-reuse guarantees) is fully resolved through the addition of persistent master and audit tables (`app_users`, `app_user_audit`, `app_retired_user_ids`).

### Separation of Concerns (ADR-ID-002)
The architecture strictly decouples four distinct concerns:
1. **Application Account (`app_users`)**: System credentials, canonical immutable identifier (`id`), legacy identifier mapping (`legacy_id`), profile attributes (`email`, `full_name`, `branch`), and account lifecycle state.
2. **Employee Identity**: Real-world organizational identity verified by Admin using the `Organization_BLC` reference workbook and physical/HR proof documents.
3. **Organizational Assignment (`org_assignments`)**: Unit-to-supervisor linkages created and maintained by Admin, explicitly referencing verified and active accounts.
4. **Approval Authority / Eligibility (`eligible()`)**: Dynamic resolver that computes assignment eligibility strictly failing-closed if any assigned identity is unverified, inactive, or invalid. (No approval snapshot or progression engine is implemented; HF02-B remains unauthorized).

## 2. Canonical Identity Model & Durability (ADR-ID-001)

- **Immutable Canonical Identifier**: Every user has a persistent canonical `id` (UUID or persistent identifier generated upon creation).
- **Name/Email Independence**: Primary identity is never derived from name, email, or job title. Mutations to `full_name` or `email` update profile records and audit logs while preserving the exact canonical `id`.
- **Non-Reuse Guarantee**: When an identity is retired or deactivated, its identifier is recorded in `app_retired_user_ids`. Any future attempt to register or create an account with a retired identifier is permanently rejected with `409 IDENTIFIER_RETIRED`.
- **Legacy Mapping & Backwards Compatibility**: The `legacy_id` field indexes legacy identifiers (e.g., `usr-admin-01`, `usr-pemohon-01`, `usr-ayu-01`). Existing document references (`ownerId`, `stage1ApproverEmail`), JWT tokens, and historical records resolve deterministically to canonical user records without altering existing data.

## 3. Account Lifecycle Foundation (ADR-ID-003)

Accounts transition strictly through defined lifecycle states:
- `UNVERIFIED`: Initial state upon creation / migration before identity validation and activation.
- `ACTIVE`: Active account permitted to participate in assignments if verified.
- `INACTIVE`: Deactivated account (resigned, retired, or suspended). Deactivated users are immediately excluded from approval eligibility, cannot be assigned to new units, and their existing active assignments are flagged for Admin review.

Historical decisions, document ownership, and approval history remain unaltered when an account transitions to `INACTIVE`.

## 4. Identity Verification Mechanism (ADR-ID-002)

- Verification is an explicit Admin action; automatic verification via name matching is strictly forbidden.
- Verification metadata is recorded directly in `app_users` and logged in `app_user_audit`:
  - `verification_status`: `UNVERIFIED` | `VERIFIED` | `REJECTED`
  - `verified_at`: ISO 8601 timestamp of verification
  - `verified_by`: Admin user ID
  - `verification_proof`: Reference string identifying evidence used (e.g. workbook row, SK Direksi, KTP, or HR contract).

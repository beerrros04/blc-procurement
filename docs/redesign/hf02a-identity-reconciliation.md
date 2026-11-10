# HF02-A — Identity Reconciliation & Verification Matrix (Revision 01)

**Status:** IMPLEMENTED  
**Authoritative Reference:** Workbook `11. Organization BLC_Nov2026 - 09112026.xlsx` (`Organization_BLC`)  
**Enforcement Policy:** ADR-ID-002: Strict separation of workbook organizational references from application account verification. Auto-verification by name resemblance is strictly prohibited.

## 1. Reconciliation Policy & Verification Workflow

1. **Non-Automatic Matching**: Names in the workbook `Organization_BLC` serve as an organizational structure reference only. Resemblance of names (e.g. "Ayu Martina" vs "Bu Ayu") is never treated as verification proof.
2. **Explicit Verification API**: Admin must perform explicit verification via `POST /api/v1/organization/users/:id/verify` (or `org.verifyUser`), providing a concrete `proofReference` (e.g. employee ID card, appointment letter / SK, or verified workbook row).
3. **Audit Trail**: Every verification action logs the Admin actor ID, timestamp, and proof reference in `app_user_audit`.
4. **Seed Status Policy**: All non-bootstrap accounts seeded into `app_users` begin in `verification_status: 'UNVERIFIED'` and `status: 'UNVERIFIED'`. Only the root Admin account is bootstrapped as `ACTIVE` and `VERIFIED` to enable initial administration.

## 2. Seed Identity Reconciliation Baseline

| Employee / Role | Organizational Position (Workbook) | System Account ID / Legacy ID | Initial Migration State | Verification Requirement for Granting Assignment |
|---|---|---|---|---|
| Admin Local | System Administrator | `usr-admin-01` | `ACTIVE`, `VERIFIED` | Root bootstrap identity (`Bootstrap administrative identity`). |
| Ayu Martina | Finance & HRGA GM (C17:C18) | `usr-ayu-01` | `UNVERIFIED`, `UNVERIFIED` | Requires Admin verification with proof reference before unit assignment. |
| Hery Sugiarto | Director (H12:H13) | `usr-bod-hery` | `UNVERIFIED`, `UNVERIFIED` | Requires Admin verification with corporate resolution before assignment. |
| Koji Hashimoto | President Director (AY4:AY5) | `usr-bod-hashimoto` | `UNVERIFIED`, `UNVERIFIED` | Requires Admin verification with corporate resolution before assignment. |
| Erika Ayu Fitriana | Finance Supervisor (C25/C28:C29) | `usr-keuangan-01` | `UNVERIFIED`, `UNVERIFIED` | Requires Admin verification with employee contract before assignment. |
| Dewi Lestari | Staff Pemohon (Staff Logistik) | `usr-pemohon-01` | `UNVERIFIED`, `UNVERIFIED` | Requires Admin verification with HR master before assignment. |
| Hendra | Atasan Langsung (Surabaya) | `usr-atasan-01` | `UNVERIFIED`, `UNVERIFIED` | Requires Admin verification with Branch Manager SK before assignment. |

## 3. Operational Assignment Protection

- Any attempt to assign an unverified user (`createAssignment` or `updateAssignment`) is blocked with HTTP 422 (`USER_UNVERIFIED`).
- Any attempt to assign an inactive user is blocked with HTTP 422 (`USER_INACTIVE`).
- The resolver `eligible(unitId)` returns `IDENTITY_UNVERIFIED` or `IDENTITY_INACTIVE` if any active supervisor does not hold verified, active status, ensuring zero unverified authority leak.

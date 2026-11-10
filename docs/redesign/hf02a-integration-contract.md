# HF02-A — Integration Contract & API Specification (Revision 01)

**Status:** APPROVED FOR HF02-A SCOPE  
**Scope:** Identity and Organization Foundation only. HF02-B approval engine integration remains UNAUTHORIZED.

## 1. Authentication & Backward Compatibility

- Bearer JWT authentication via `Authorization: Bearer <token>`.
- Existing `/api/v1/auth/login` and `/api/v1/me` remain fully functional.
- JWT claims continue to carry `id`, `email`, `fullName`, `role`, `branch`, and `branchScope`.
- Document ownership references (`ownerId: 'usr-pemohon-01'`, `stage1ApproverEmail: 'atasan@blc.co.id'`) remain compatible via `legacy_id` mapping.

## 2. Organization & Identity REST API Contract

All endpoints below require authentication with `role === 'ADMIN'`. Non-admin requests receive `403 FORBIDDEN_ROLE`.

### Organizational Storage & Units
- `GET /api/v1/organization/readiness`: Returns storage and identity readiness.
- `GET /api/v1/organization/units`: Lists all organizational units.
- `POST /api/v1/organization/units`: `{ name: string }` -> creates unit (201).
- `GET /api/v1/organization/units/:unitId/assignments`: Lists assignments for unit.
- `GET /api/v1/organization/units/:unitId/eligible`: Returns `{ status, userIds }`.
  - Possible status values:
    - `AVAILABLE`: Active, verified supervisor candidates available.
    - `NO_ASSIGNMENT`: Unit has no active supervisor assignment.
    - `IDENTITY_UNVERIFIED`: Active assignment exists but assigned supervisor has not been verified.
    - `IDENTITY_INACTIVE`: Active assignment exists but assigned supervisor is deactivated (`INACTIVE`).
    - `IDENTITY_INVALID`: Active assignment references an unknown/deleted user.

### Organizational Assignments
- `GET /api/v1/organization/assignments`: Lists all assignments (optional `?unitId=...`).
- `POST /api/v1/organization/assignments`: `{ unitId: string, supervisorUserId: string }` -> creates assignment (201).
  - Rejects with `422 USER_UNVERIFIED` if user is unverified.
  - Rejects with `422 USER_INACTIVE` if user is inactive.
- `PATCH /api/v1/organization/assignments/:id`: Updates unit, supervisor, or active flag.
- `POST /api/v1/organization/assignments/:id/deactivate`: Shortcut to deactivate assignment.
- `GET /api/v1/organization/assignments/review-needed`: Returns list of quarantined assignments where supervisor is unverified, inactive, or missing.

### Identity Management (ADR-ID-001, ADR-ID-002, ADR-ID-003)
- `GET /api/v1/organization/users`: Lists users. Optional query filters: `?status=...&verificationStatus=...`.
- `POST /api/v1/organization/users`: `{ email, fullName, role?, branch?, branchScope?, id?, legacyId? }` -> creates user (201).
- `GET /api/v1/organization/users/:id`: Returns user master details.
- `PATCH /api/v1/organization/users/:id`: Updates name, email, branch. Canonical `id` is immutable.
- `POST /api/v1/organization/users/:id/verify`: `{ proofReference: string }` -> records Admin verification metadata.
- `POST /api/v1/organization/users/:id/lifecycle`: `{ status: 'UNVERIFIED' | 'ACTIVE' | 'INACTIVE', reason?: string }` -> updates lifecycle state.
- `POST /api/v1/organization/users/:id/deactivate`: `{ reason?: string }` -> shortcut to set lifecycle status to `INACTIVE`.
- `POST /api/v1/organization/users/:id/retire`: `{ reason: string }` -> permanently retires user ID to prevent reuse.

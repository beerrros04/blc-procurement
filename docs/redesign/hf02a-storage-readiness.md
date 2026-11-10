# HF02-A — Organizational Storage & Identity Readiness (Revision 01)

**Endpoint:** `GET /api/v1/organization/readiness`  
**Authorization:** ADMIN role required (`FORBIDDEN_ROLE` 403 on non-admin)

## 1. Readiness State Schema

The readiness endpoint performs non-destructive health checks against the persistent SQLite storage:
- `configured: boolean`: Whether `OrganizationRepository` is configured in runtime options.
- `reachable: boolean`: Whether the target SQLite file exists and is accessible.
- `schema`:
  - `COMPATIBLE`: All 7 required schema objects exist and match canonical DDL (`org_units`, `org_assignments`, `org_assignment_audit`, `org_assignment_active_unique`, `app_users`, `app_user_audit`, `app_retired_user_ids`), and `org_schema_version` equals 2.
  - `MIGRATION_REQUIRED`: Database has legacy v1 schema (missing version marker or `version=1`) or is absent.
  - `INCOMPATIBLE`: Schema is partially applied, corrupted, or has unverified table structures. Mutations fail-closed with HTTP 503.
  - `UNAVAILABLE`: Database file is missing or unreadable.
- `identity`:
  - `AVAILABLE`: All active assignments link to valid accounts in persistent `app_users` without ID collisions.
  - `DUPLICATE_IDS`: Detected conflicting or duplicated user identifiers in runtime seed or persistent master.
  - `INVALID_REFERENCES`: Detected active assignment referencing non-existent user accounts.
- `assignments`:
  - `PRESENT`: Active assignments exist in the database.
  - `EMPTY`: No active assignments exist.
  - `UNKNOWN`: Storage not reachable.

## 2. Assignment Review Quarantine (`review-needed`)

When accounts are deactivated (`INACTIVE`) or pending verification (`UNVERIFIED`), existing assignments are quarantined rather than deleted, ensuring audit preservation:
- Endpoint: `GET /api/v1/organization/assignments/review-needed`
- Returns all active assignment records with `SUPERVISOR_NOT_FOUND`, `SUPERVISOR_UNVERIFIED`, or `SUPERVISOR_INACTIVE`.
- Ensures administrators can inspect and reassign units before operational approval workflows are enabled.

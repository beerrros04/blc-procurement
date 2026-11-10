# HF02-A — Database Migration Runbook (Revision 01)

**Target:** Schema Version 2 (Additive persistent identity foundation)  
**Safety Guarantees:** Transactional (`BEGIN IMMEDIATE ... COMMIT`), foreign keys enabled (`PRAGMA foreign_keys=ON`), idempotent, rollback on failure, non-destructive to existing workspace payloads and organizational data.

## 1. Migration Overview

The migration function `migrateOrganization(path: string)` safely transitions any SQLite database from either uninitialized (`ABSENT`) or HF-01 (`v1` legacy) to HF02-A Revision 01 (`v2` persistent identity).

### Schema Version 2 Additions:
1. `app_users`: Canonical persistent user master table with lifecycle status (`UNVERIFIED`, `ACTIVE`, `INACTIVE`) and verification status (`UNVERIFIED`, `VERIFIED`, `REJECTED`).
2. `app_user_audit`: Full audit trail of user creation, attribute modifications, verification proofs, and lifecycle changes.
3. `app_retired_user_ids`: Tombstone registry guaranteeing that retired identifiers can never be recycled or reused.
4. `org_schema_version`: Updated to version 2 (`CHECK(version=2)`).

## 2. Pre-Migration Checklist

1. **Operational Isolation**: Do NOT run migrations against live production databases without change authorization. All development and testing must use isolated temporary databases (`tmpdir()`).
2. **Backup**: Take an immutable snapshot of the SQLite file before applying migrations.
3. **Integrity Pre-check**: Verify `PRAGMA integrity_check` on the database file.
4. **Writers Paused**: Ensure no concurrent processes are writing to the database file during schema migration.

## 3. Migration Procedure

Execute migration via application bootstrap or CLI script:
```typescript
import { migrateOrganization } from './server/organization';

migrateOrganization('/path/to/target.sqlite');
```

The migration automatically:
1. Inspects current `schemaState`. If `INCOMPATIBLE`, immediately aborts and throws `DomainError(503, 'ORGANIZATION_SCHEMA_INCOMPATIBLE')`.
2. Creates missing tables with `IF NOT EXISTS`.
3. Upgrades `org_schema_version` to version 2.
4. Seeds default accounts from `SEEDED_USERS` if `app_users` is empty:
   - Root Admin (`usr-admin-01`): Seeded as `ACTIVE` and `VERIFIED` with bootstrap audit log.
   - Non-admin seeded users: Seeded as `UNVERIFIED` and `UNVERIFIED` per ADR-ID-002.
5. Commits atomically.

## 4. Idempotency & Re-run Verification

Running `migrateOrganization(path)` multiple times consecutively produces no errors, no duplicate records, and leaves all data intact. Schema status will report `COMPATIBLE`.

## 5. Rollback Strategy

If rollback is necessary:
1. Stop the application server.
2. Restore the pre-migration SQLite snapshot.
3. Validate database file integrity using `PRAGMA integrity_check`.
4. Verify checksum of `workspace` payload.
5. Restart the server and verify `/api/v1/organization/readiness`.

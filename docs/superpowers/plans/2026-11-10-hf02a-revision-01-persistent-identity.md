# HOTFIX BR-APP-001 — HF02-A Revision 01 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a persistent identity and account lifecycle foundation in SQLite to resolve the HF02-A identity blockers, establishing canonical user IDs, identity verification, account lifecycle, and organizational assignment integrity without altering existing approval workflows.

**Architecture:** Extend SQLite organization schema to include `app_users`, `app_user_audit`, and `app_retired_user_ids`. Decouple application account identity from organizational assignments and approval authority. Provide Admin verification and lifecycle APIs with audit logging. Update `OrganizationRepository` resolver and assignment validation to enforce active, verified identity. Maintain backwards compatibility with legacy seed IDs, JWT claims, and existing document references.

**Tech Stack:** Node.js, TypeScript, SQLite (`node:sqlite DatabaseSync`), Vitest.

**Spec:** HF02-A Revision 01 prompt and ADR-ID-001, ADR-ID-002, ADR-ID-003.

## Global Constraints

- Scope: Resolve HF02-A identity blockers only.
- HF02-B: NOT AUTHORIZED. Do not implement approval snapshot, progression, reassignment, or stage engine.
- SQLite is the authoritative persistent store for application user identity.
- Canonical `user_id` is immutable and unique (UUID or stable persistent identifier); cannot be reused or changed.
- Separate application account, employee identity, organizational assignment, and approval authority.
- Unverified identity remains `UNVERIFIED`.
- No auto-verification through name matching.
- Account lifecycle states: `UNVERIFIED`, `ACTIVE`, `INACTIVE`.
- Assignments linked to deactivated users must be identifiable for Admin review.
- Preserve existing authentication compatibility and document ownership references.
- All migrations must be safe, repeatable, and idempotent. Use isolated test fixtures; do not touch operational databases.

## Review Focus

1. **ID Immutability & Non-Reuse**: Changing a user's name or email must never alter `user_id`; retired IDs cannot be re-assigned.
2. **Eligibility Fail-Closed**: Unverified, inactive, or non-existent identities assigned to an org unit must cause `eligible(unitId)` to return an error/unverified status, never granting approval authority.
3. **Admin-Only Lifecycle & Verification**: Non-Admin tokens must receive 403 on all identity management mutations; every verification must record Admin actor, timestamp, and proof reference.
4. **Assignment Quarantining / Review**: Deactivating an active supervisor makes their unit assignment invalid and identifiable in review queries without deleting audit/historical records.
5. **Backwards Compatibility**: Existing `usr-pemohon-01`, `usr-atasan-01`, `usr-ayu-01`, etc. seed identifiers and existing JWT tokens remain resolvable via canonical identity mapping.

---

### Task 1: Persistent Identity Schema & Migration

**Files:**
- Modify: `server/organization.ts`
- Test: `server/organization.test.ts`

**Steps:**
- [ ] Define SQLite DDL for `app_users`, `app_user_audit`, and `app_retired_user_ids`.
- [ ] Update `migrateOrganization(path)` to idempotently create and migrate schema from v1 to v2.
- [ ] Update `schemaState(db)` to recognize v1 (legacy requiring migration) and v2 (compatible).
- [ ] Implement seed migration helper that populates `app_users` from `SEEDED_USERS` with canonical UUIDs and legacy ID mapping if table is empty.
- [ ] Write tests verifying migration repeatability, schema compatibility, and legacy seed migration.

### Task 2: User Master Repository & ID Immutability

**Files:**
- Modify: `server/organization.ts`
- Test: `server/organization.test.ts`

**Steps:**
- [ ] Implement user repository methods in `OrganizationRepository`:
  - `createUser(input, actorUserId)`
  - `getUser(idOrLegacyId)`
  - `listUsers(filter?)`
  - `updateUser(id, patch, actorUserId)`
  - `retireUser(id, reason, actorUserId)`
- [ ] Enforce unique constraints on `email`, `id`, `legacy_id`.
- [ ] Enforce that updating `fullName`, `email`, or `branch` preserves the canonical `id`.
- [ ] Ensure retired IDs are written to `app_retired_user_ids` and rejected on subsequent creation attempts.
- [ ] Write unit tests verifying ID immutability across restarts and attribute updates, and rejection of duplicate or reused IDs.

### Task 3: Identity Verification & Account Lifecycle Foundation

**Files:**
- Modify: `server/organization.ts`
- Test: `server/organization.test.ts`

**Steps:**
- [ ] Implement `verifyUser(id, proofReference, actorAdminId)`:
  - Enforce actor must be Admin.
  - Updates `verification_status = 'VERIFIED'`, `verified_at`, `verified_by`, `verification_proof`.
  - Records audit row in `app_user_audit`.
- [ ] Implement `setUserLifecycle(id, status, actorAdminId, reason?)`:
  - Transitions lifecycle state (`UNVERIFIED`, `ACTIVE`, `INACTIVE`).
  - Records audit row in `app_user_audit`.
- [ ] Implement `listAssignmentsNeedingReview()`:
  - Finds all active assignments where the supervisor user is either not found, `UNVERIFIED`, or `INACTIVE`.
- [ ] Write unit tests verifying verification metadata, lifecycle transitions, and assignment review detection.

### Task 4: Organizational Assignment & Eligibility Integration

**Files:**
- Modify: `server/organization.ts`
- Test: `server/organization.test.ts`

**Steps:**
- [ ] Update `createAssignment` and `updateAssignment`:
  - Resolve supervisor identity against `app_users`.
  - Validate that supervisor exists, has `verification_status === 'VERIFIED'`, and `status === 'ACTIVE'`.
  - Reject unverified (`USER_UNVERIFIED`) or inactive (`USER_INACTIVE`) supervisors with 422.
- [ ] Update `eligible(unitId)`:
  - Return `{ status: 'NO_ASSIGNMENT', userIds: [] }` if no active assignment.
  - If any active assignment has an unverified supervisor: return `{ status: 'IDENTITY_UNVERIFIED', userIds: [] }`.
  - If any active assignment has an inactive supervisor: return `{ status: 'IDENTITY_INACTIVE', userIds: [] }`.
  - If any active assignment has an unknown supervisor: return `{ status: 'IDENTITY_INVALID', userIds: [] }`.
  - Return `{ status: 'AVAILABLE', userIds: [...] }` only when all active supervisors are verified and active.
- [ ] Update `readiness()`:
  - Include identity verification and review-needed assignment status in readiness report.
- [ ] Write tests verifying that unverified and inactive users cannot be assigned or gain eligibility.

### Task 5: Admin REST Endpoints & Authorization in Express App

**Files:**
- Modify: `server/app.ts`
- Test: `server/organization.test.ts`

**Steps:**
- [ ] Add Admin routes under `/api/v1/organization/`:
  - `GET /api/v1/organization/users`: list users with filtering.
  - `POST /api/v1/organization/users`: create user (Admin only).
  - `GET /api/v1/organization/users/:id`: get user details.
  - `PATCH /api/v1/organization/users/:id`: update user details.
  - `POST /api/v1/organization/users/:id/verify`: verify identity with proof reference.
  - `POST /api/v1/organization/users/:id/lifecycle`: update lifecycle state.
  - `POST /api/v1/organization/users/:id/deactivate`: deactivate user shortcut.
  - `GET /api/v1/organization/assignments/review-needed`: list assignments requiring review.
- [ ] Verify that non-Admin tokens receive 403 `FORBIDDEN_ROLE`.
- [ ] Verify existing auth routes (`/api/v1/auth/login`, `/api/v1/me`) and procurement document endpoints remain completely unaffected.

### Task 6: Full Test Suite Verification & Documentation Deliverables

**Files:**
- Modify: `docs/redesign/hf02a-identity-architecture.md`
- Modify: `docs/redesign/hf02a-identity-reconciliation.md`
- Modify: `docs/redesign/hf02a-storage-readiness.md`
- Modify: `docs/redesign/hf02a-migration-runbook.md`
- Modify: `docs/redesign/hf02a-integration-contract.md`
- Modify: `docs/redesign/hf02a-test-report.md`
- Modify: `docs/redesign/hotfix-br-app-001-hf02a.md`
- Test: `npm test`, `npm run build`

**Steps:**
- [ ] Run full test suite (`npm test`) and typecheck/build (`npm run build`).
- [ ] Update all six HF02-A technical reports with the implemented persistent identity architecture, reconciliation matrix, schema v2 migration runbook, and test evidence.
- [ ] Create the comprehensive HF02-A Revision 01 Completion Report in `docs/redesign/hotfix-br-app-001-hf02a.md`.
- [ ] Update graphify if appropriate per user rules.

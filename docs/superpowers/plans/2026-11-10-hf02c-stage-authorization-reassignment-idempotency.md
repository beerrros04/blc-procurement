# HF02-C Stage Authorization, In-Flight Reassignment & Request Idempotency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Secure and integrate the ApprovalStageEngine with server-authenticated authorization, Admin-governed in-flight reassignment, persistent request idempotency (`X-Idempotency-Key`), concurrency protection, and cross-storage consistency.

**Architecture:**
- SQLite schema additions: `approval_stage_reassignments`, `approval_idempotency_records`, `cross_storage_sync_records`, and a unique constraint on `approval_decisions(stage_id)`.
- Stage engine enhancements in `server/stage-engine.ts`: In-flight reassignment (`reassignStage`), idempotency check & caching, conditional state transitions, and cross-storage coordination.
- Isolated backend integration in `server/app.ts`: Dedicated REST routes for stage actions guarded by authenticated server identity (JWT principal), canonical user validation, and idempotency headers, leaving operational production endpoints completely untouched.
- Full verification: Automated unit, integration, concurrency, and cross-storage partial-failure recovery tests.

**Tech Stack:** Node.js, TypeScript, SQLite (`node:sqlite`), Vitest, Express-compatible HTTP server.

**Spec:** User prompt for `HOTFIX BR-APP-001 — HF02-C`.

## Global Constraints
- AUTHORIZED: HF02-C ONLY.
- LOCKED / UNAUTHORIZED: HF02-D, Phase 01 presentation redesign.
- Do NOT modify production operational endpoints (`server/repository.ts` and legacy `/api/v1/documents/:id/decisions` remain untouched).
- Do NOT run migrations on operational databases (`blc-local.sqlite`). All testing in isolated temporary databases (`tmpdir()`).
- STOP after delivering the HF02-C completion report.

---

## Tasks

### Task 1: SQLite Schema Additions & Data Model
- [ ] Add `approval_stage_reassignments` table.
- [ ] Add `approval_idempotency_records` table with primary key `(key, user_id)` and status `IN_PROGRESS`, `COMPLETED`, `FAILED`.
- [ ] Add `cross_storage_sync_records` table for durable dual-phase tracking (`PREPARED`, `COMMITTED`, `COMPENSATED`, `RECONCILED`).
- [ ] Add unique index on `approval_decisions(stage_id)` to prevent duplicate terminal decisions at the DB engine level.

### Task 2: Stage-Level Decision Authorization & Trusted Principal Validation (HF02C-001, HF02C-002)
- [ ] Enhance `recordStageDecision` to accept authenticated server principal (`authenticatedUser: AppUserRecord`).
- [ ] Validate lifecycle: reject `INACTIVE` (422 `APPROVER_INACTIVE`) or `UNVERIFIED` (422 `APPROVER_UNVERIFIED`).
- [ ] Validate resource authorization: authenticated user ID must match `stage.assignedApproverId` (or mapped legacy ID); reject others with 403 `FORBIDDEN_APPROVER`.
- [ ] Validate stage state: only `PENDING` stage can be decided; reject `WAITING` with 409 `STAGE_NOT_ACTIVE`.

### Task 3: In-Flight Approver Reassignment (HF02C-003)
- [ ] Implement `reassignStage(input, orgRepo)` in `ApprovalStageEngine`:
  - Validate actor is authenticated, active, verified Admin (`FORBIDDEN_ROLE`).
  - Validate stage is in non-terminal state (`WAITING` or `PENDING`); reject `APPROVED`/`REJECTED` with 409 `STAGE_ALREADY_COMPLETED`.
  - Validate replacement approver exists, is ACTIVE, and VERIFIED.
  - Require non-empty `reason` (`REASSIGNMENT_REASON_REQUIRED`).
  - Keep original submission snapshot immutable (do NOT mutate `approval_assignment_snapshots`).
  - Update `approval_stages.assigned_approver_id` and `approver_name`.
  - Insert record into `approval_stage_reassignments`.
  - Insert audit entry into `approval_stage_assignment_audit` with `action = 'STAGE_REASSIGNMENT'`.
  - Revoke old approver authority immediately.

### Task 4: Persistent Request Idempotency & Concurrency Protection (HF02C-004, HF02C-005)
- [ ] Implement idempotency checking in `recordStageDecision`:
  - Compute payload fingerprint (SHA-256 of `{ decision, comment }`).
  - Check `approval_idempotency_records`:
    - Same key + same user + same payload -> return cached response.
    - Same key + same user + different payload -> throw 409 `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`.
  - If new key, insert `IN_PROGRESS`, execute, update to `COMPLETED` with serialized response JSON.
- [ ] Concurrency protection:
  - SQLite `BEGIN IMMEDIATE` transaction locking.
  - Conditional atomic update `UPDATE approval_stages SET status = ?, completed_at = ? WHERE id = ? AND status = 'PENDING'`.
  - Throw 409 `CONCURRENT_MODIFICATION` if row count is 0.

### Task 5: Cross-Storage Consistency Strategy & Recovery (HF02C-006)
- [ ] Implement `CrossStorageCoordinator` / methods in `server/stage-engine.ts`:
  - Dual-phase durable log: Write `cross_storage_sync_records` (`PREPARED`).
  - Execute stage engine decision.
  - Synchronize document repository state.
  - Update log to `COMMITTED`.
  - If document write fails, compensate SQLite stage (rollback stage to PENDING, remove decision) and mark `COMPENSATED`.
  - Implement `reconcileCrossStorage(documentId)` to detect and repair any desynchronized records.

### Task 6: Isolated Backend Endpoint Integration (HF02C-007, HF02C-008)
- [ ] In `server/app.ts`:
  - Add route `POST /api/v1/stages/:stageId/decisions`:
    - Authenticated principal extraction from JWT (`req.user`).
    - Header `X-Idempotency-Key` extraction.
    - Execute stage decision with cross-storage synchronization.
  - Add route `POST /api/v1/stages/:stageId/reassign`:
    - Admin authorization check.
    - Execute `reassignStage`.
  - Add route `GET /api/v1/documents/:documentId/workflow`:
    - Return workflow instance, stages, snapshots, and reassignments.
  - Add route `POST /api/v1/documents/:documentId/submit-stage-workflow`:
    - Create stage workflow with cross-storage coordination.
  - Keep operational production routes completely untouched.

### Task 7: Automated Test Suite (TDD)
- [ ] Create `server/stage-engine-c.test.ts` covering:
  - Authorization & trust boundary tests (8 tests).
  - Reassignment tests (8 tests).
  - Idempotency & concurrency tests (7 tests).
  - Cross-storage consistency & partial failure recovery tests (6 tests).
  - Backend API integration tests (6 tests).
  - Totaling 35+ new tests.
- [ ] Run full test suite (`npm test`) -> Ensure 250+ tests pass with 0 failures.
- [ ] Run production build (`npm run build`) -> Exit code 0.
- [ ] Run `graphify update .` -> Synchronize knowledge graph.

### Task 8: Documentation & Completion Report
- [ ] Write `docs/redesign/hotfix-br-app-001-hf02c.md` with:
  - Executive summary.
  - Sections 1 to 13 covering all deliverables.
  - Actual test evidence and code references.
  - Risk assessment and HF02-D readiness.
- [ ] Present completion report and HALT execution.

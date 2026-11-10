# BLC PROCUREMENT PRO — DB-01 IMPLEMENTATION PLAN
## Branch Master Foundation Implementation

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement dynamic Branch Master (`branches`, `branch_audit`), Admin CRUD & deactivation management API with REG-05 active transaction guards, user `primary_branch_id` integration, and explicit legacy reconciliation without altering the operational database or breaking the 315 existing regression tests.

**Architecture:**
- Create `server/branch-engine.ts` managing SQLite relational tables (`branches`, `branch_audit`) and domain repository `BranchRepository`.
- Extend `app_users` in `server/organization.ts` with `primary_branch_id REFERENCES branches(id)`.
- Connect branch deactivation to `DocumentRepository` in `server/repository.ts` to enforce REG-05 (rejection of deactivation if active transactions or open financial obligations exist).
- Expose Admin REST endpoints under `/api/v1/branches*` in `server/app.ts` with backend role checks (`role === 'ADMIN'`).
- All testing runs in isolated SQLite instances (`:memory:` or temporary test files in `tmpdir()`), leaving `.data/blc-local.sqlite` untouched.

**Tech Stack:** Node.js, TypeScript, SQLite (`node:sqlite DatabaseSync`), Vitest.

**Spec & Authorities:**
- BLC Procurement Guide v3, November 2026.
- Database Architecture Specification v1 (`docs/database/database-architecture-v1.md`).
- Master Data Schema Proposal (`docs/database/master-data-schema-proposal.md`).
- Product Owner Decisions: ADR-DB-001, ADR-DB-002, REG-03, REG-05.

---

## Global Constraints

- **Phase Authorization:** DB-01 Development and Isolated Testing ONLY.
- **Production Database Freeze:** Do NOT modify, alter, or run migrations on `.data/blc-local.sqlite`.
- **Scope Boundary:** DB-02 through DB-06 remain LOCKED and UNAUTHORIZED.
- **No Name Guessing:** Do NOT guess user branch from name or email. Unmapped accounts are placed in `docs/database/branch-reconciliation-report.md`.
- **No Dummy Data:** Do NOT fill random or arbitrary branch IDs to satisfy foreign keys.
- **No Hard Delete:** `DELETE FROM branches` is strictly forbidden. Penonaktifan menggunakan soft deactivation (`status = 'INACTIVE'`).
- **Compatibility Preservation:** Preserve existing PR, PO, AV, RB, RC, GR, PV, Payment Record, Stage Engine, and 315 automated regression tests.
- **Backend Authorization:** Enforce Admin verification on the server (`req.user.role === 'ADMIN'`), not merely frontend routing.

---

## Review Focus & Critical Verification Criteria

1. **Admin CRUD & Code Uniqueness:** Admin can create/update branches; duplicate branch code (case-insensitive) is rejected with HTTP 409 / unique constraint.
2. **Non-Admin Mutation Protection:** Non-Admin users (`PEMOHON`, `ATASAN`, `KEUANGAN`, `BOD_*`) are rejected with HTTP 403 `FORBIDDEN_ROLE` on all branch mutation endpoints.
3. **REG-05 Active Transaction Guard:** Deactivation of a branch is blocked (HTTP 409 `BRANCH_HAS_ACTIVE_TRANSACTIONS`) if any active document exists (`SUBMITTED`/`IN_REVIEW`), any PO/AV/RB still needs PV, any PV is `UNPAID`, or any open draft exists.
4. **Primary Branch Integrity:** User `primary_branch_id` must point to a valid active branch; assigning an `INACTIVE` branch to a new user is rejected with HTTP 422 `BRANCH_INACTIVE`.
5. **Historical Context Preservation:** Document transactions retain snapshot branch names; updating or deactivating a branch does not alter historical document text or approval snapshots.
6. **Concurrent Safety:** Concurrent document submission during branch deactivation is serialized via SQLite transaction lock to prevent race conditions.

---

## Implementation Tasks

### Task 1: Isolated Branch Master SQLite Schema & Migration Engine (DB01-01)

**Files:**
- Create: `server/branch-engine.ts`
- Create: `server/branch-engine.test.ts`

**Steps:**
- [ ] Define TypeScript types and interfaces:
  - `BranchRecord`: `id`, `code`, `name`, `address`, `status: 'ACTIVE' | 'INACTIVE'`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.
  - `BranchAuditRecord`: `id`, `branchId`, `actorUserId`, `action: 'CREATE' | 'UPDATE' | 'DEACTIVATE' | 'ACTIVATE'`, `at`, `beforeJson`, `afterJson`.
  - `CreateBranchInput`, `UpdateBranchPatch`.
- [ ] Define SQLite DDL:
  - Table `branches`:
    ```sql
    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      address TEXT,
      status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_branches_code_unique ON branches(code);
    CREATE INDEX IF NOT EXISTS idx_branches_status ON branches(status);
    ```
  - Table `branch_audit`:
    ```sql
    CREATE TABLE IF NOT EXISTS branch_audit (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL REFERENCES branches(id),
      actor_user_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('CREATE', 'UPDATE', 'DEACTIVATE', 'ACTIVATE')),
      at TEXT NOT NULL,
      before_json TEXT,
      after_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_branch_audit_branch ON branch_audit(branch_id);
    ```
  - Seeding 7 official branches: `brc-bks` (Bekasi), `brc-cbn` (Cibinong), `brc-mdn` (Medan), `brc-sby` (Surabaya), `brc-pku` (Pekanbaru), `brc-mks` (Makassar), `brc-smd` (Samarinda).
- [ ] Implement `migrateBranchMaster(db: DatabaseSync): void` with version tracking (`branch_schema_version = 1`), idempotency, and immediate transaction rollback on error.
- [ ] Write unit tests in `server/branch-engine.test.ts` verifying isolated table creation, unique constraint enforcement on `code`, seeding, and idempotent re-execution.

---

### Task 2: Branch Repository & REG-05 Deactivation Guard (DB01-01, DB01-04)

**Files:**
- Modify: `server/branch-engine.ts`
- Test: `server/branch-engine.test.ts`

**Steps:**
- [ ] Implement class `BranchRepository`:
  - `listBranches(status?: 'ACTIVE' | 'INACTIVE'): BranchRecord[]`
  - `getBranchById(id: string): BranchRecord | null`
  - `getBranchByCode(code: string): BranchRecord | null`
  - `createBranch(input: CreateBranchInput, actorId: string): BranchRecord`:
    - Validates code (uppercase alfanumeric 2-6 chars).
    - Checks code uniqueness (throws `DUPLICATE_BRANCH_CODE`).
    - Inserts into `branches` and logs to `branch_audit`.
  - `updateBranch(id: string, patch: UpdateBranchPatch, actorId: string): BranchRecord`:
    - Checks branch existence.
    - Validates unique code if patched.
    - Inserts audit log with before/after state.
  - `deactivateBranch(id: string, actorId: string, activeTxChecker?: (branchNameOrCode: string) => { activeCount: number; blockingReasons: string[] }): BranchRecord`:
    - Fetches branch; verifies it is currently `ACTIVE`.
    - If `activeTxChecker` provided, queries for blocking transactions.
    - If blocking transactions > 0, throws `DomainError('Cabang tidak dapat dinonaktifkan karena masih memiliki transaksi aktif atau kewajiban terbuka.', 409, 'BRANCH_HAS_ACTIVE_TRANSACTIONS', { count, reasons })`.
    - Updates status to `INACTIVE` and records audit.
  - `activateBranch(id: string, actorId: string): BranchRecord`.
- [ ] Connect `activeTxChecker` to query `DocumentRepository`:
  - Evaluates documents with `d.branch === branch.name || d.branch === branch.code`:
    - `d.status === 'SUBMITTED' || d.status === 'IN_REVIEW'` (in-flight approval).
    - `d.docType IN ('PO', 'AV', 'RB') && d.status === 'APPROVED' && (!hasPV || pv.paymentStatus === 'UNPAID')` (pending PV or payment).
    - `d.docType === 'PV' && d.paymentStatus === 'UNPAID'` (unpaid voucher).
    - `d.status === 'DRAFT'` (open draft).
- [ ] Write unit tests in `server/branch-engine.test.ts` proving REG-05 blocking behavior and clean deactivation when no active transactions exist.

---

### Task 3: User Primary Branch Integration & Legacy Reconciliation (DB01-03)

**Files:**
- Modify: `server/organization.ts`
- Test: `server/organization.test.ts`

**Steps:**
- [ ] Add migration step to `server/organization.ts`:
  - Dynamically check `PRAGMA table_info('app_users')`.
  - If `primary_branch_id` is missing, run `ALTER TABLE app_users ADD COLUMN primary_branch_id TEXT REFERENCES branches(id);`.
  - Create index `CREATE INDEX IF NOT EXISTS idx_app_users_primary_branch ON app_users(primary_branch_id);`.
- [ ] Implement explicit legacy branch reconciliation mapping:
  - Explicit dictionary mapping:
    - `'Bekasi' => 'brc-bks'`
    - `'Cibinong' => 'brc-cbn'`
    - `'Medan' => 'brc-mdn'`
    - `'Surabaya' => 'brc-sby'`
    - `'Pekanbaru' => 'brc-pku'`
    - `'Makassar' => 'brc-mks'`
    - `'Samarinda' => 'brc-smd'`
  - Unmapped accounts are flagged in reconciliation output without automated guessing.
- [ ] Update `OrganizationRepository`:
  - In `createUser` and `updateUser`, validate that `primary_branch_id` (or resolved branch) references an `ACTIVE` branch in `branches`.
  - Reject assignment of `INACTIVE` branch with HTTP 422 `BRANCH_INACTIVE`.
  - Expose `primary_branch_id` on `AppUserRecord`.
- [ ] Write tests in `server/organization.test.ts` verifying:
  - User primary branch persistence.
  - Inactive branch rejection on user creation/update.
  - Existing user identities and roles remain untouched.

---

### Task 4: Admin Branch Management REST API (DB01-02)

**Files:**
- Modify: `server/app.ts`
- Test: `server/server.test.ts`

**Steps:**
- [ ] Register branch routes in `server/app.ts`:
  - `GET /api/v1/branches`: List branches (filtered by `?status=ACTIVE|INACTIVE`, accessible to all authenticated users per REG-03).
  - `GET /api/v1/branches/:id`: Get branch detail (accessible to all authenticated users).
  - `POST /api/v1/branches`: Create branch (Admin-only).
  - `PUT /api/v1/branches/:id`: Update branch (Admin-only).
  - `POST /api/v1/branches/:id/deactivate`: Deactivate branch (Admin-only, executes REG-05 checks).
  - `POST /api/v1/branches/:id/activate`: Activate branch (Admin-only).
- [ ] Add middleware / inline verification:
  - If `user.role !== 'ADMIN'` on POST/PUT endpoints, return HTTP 403 `FORBIDDEN_ROLE`.
- [ ] Write end-to-end integration tests in `server/server.test.ts`:
  - Admin can create and update branch.
  - Non-Admin gets 403 on mutation endpoints.
  - Deactivation with active documents returns HTTP 409.
  - Deactivation of empty branch returns HTTP 200.

---

### Task 5: Concurrency Safety & Race Condition Protection (DB01-04)

**Files:**
- Modify: `server/branch-engine.ts`
- Test: `server/branch-engine.test.ts`

**Steps:**
- [ ] Protect branch deactivation against concurrent document submission:
  - Wrap check-and-deactivate in SQLite `BEGIN IMMEDIATE` transaction or repository mutex lock.
  - Test scenario: simultaneous document submission and branch deactivation request.
  - Verify that deactivation cannot succeed while an active transaction is being committed for that branch.

---

### Task 6: Baseline Regression & Full Verification (DB01-05)

**Files:**
- Test: `server/branch-engine.test.ts`, `server/organization.test.ts`, `server/server.test.ts`, `server/stage-engine-*.test.ts`
- Build: `npm run build`

**Steps:**
- [ ] Run full test suite (`npm test`). Confirm all 315 existing tests pass + all new DB-01 tests pass.
- [ ] Run TypeScript type check and production build (`tsc --noEmit && vite build`).
- [ ] Verify `.data/blc-local.sqlite` remains completely untouched.
- [ ] Generate reconciliation artifact: `docs/database/branch-reconciliation-report.md`.

---

### Task 7: DB-01 Completion Report & Stage Gate Enforcement

**Files:**
- Create: `docs/database/db01-completion-report.md`

**Steps:**
- [ ] Assemble DB-01 Completion Report containing:
  1. Executive Summary.
  2. Implemented Components (`branches`, `branch_audit`, API endpoints, User primary branch).
  3. REG-05 Verification Evidence.
  4. Test Execution Evidence (all passing).
  5. Changed Files Summary.
  6. Migration Runbook for future deployment.
- [ ] STOP and submit report. Await explicit PO authorization before opening Phase DB-02.

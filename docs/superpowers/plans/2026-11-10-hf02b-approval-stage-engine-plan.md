# HOTFIX BR-APP-001 — HF02-B Implementation Plan
## Approval Snapshot & Independent Stage Engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an isolated internal approval stage engine with submission-time approver snapshots, independent stage lifecycles, and stage-specific decision records, guaranteeing that multi-role users must make independent decisions without auto-skipping, preserving existing BOD parallel approval and legacy document compatibility.

**Architecture:** Implement `ApprovalStageEngine` in `server/stage-engine.ts` backed by SQLite relational tables (`approval_workflows`, `approval_stages`, `approval_assignment_snapshots`, `approval_decisions`). Integrate snapshot resolution with `OrganizationRepository` and `app_users` identity master. Enforce strict stage state machine transitions and transaction safety.

**Tech Stack:** Node.js, TypeScript, SQLite (`node:sqlite DatabaseSync`), Vitest.

**Spec:** HF02-B prompt, BR-APP-001, ADR-ID-001, ADR-ID-002, ADR-ID-003.

## Global Constraints

- Current Authorization: HF02-B ONLY.
- HF02-C and HF02-D remain LOCKED and UNAUTHORIZED.
- Do NOT modify UI or approval stepper presentation.
- Do NOT activate the new engine directly on production/live API endpoints during HF02-B.
- Do NOT perform reassignment of active documents.
- Do NOT modify operational database or run production migrations.
- Do NOT allow automatic verification of seed accounts or name-matching verification.
- Every approval stage must have a unique, persistent `stage_id`.
- One approval decision only completes one stage; multi-role users must perform independent actions per stage.
- Admin is NEVER used as a fallback approver.
- All testing uses isolated SQLite instances in `tmpdir()`.

## Review Focus

1. **Multi-Role Independent Decision**: When User A is assigned to both Stage 1 and Stage 2, approving Stage 1 leaves Stage 2 `PENDING` (not approved, not skipped); Stage 2 requires a separate decision creating a distinct decision record.
2. **Snapshot Immutability**: Modifying unit assignments in `OrganizationRepository` after document submission does not alter the snapshot or approver of existing workflow instances.
3. **Fail-Closed Snapshot Creation**: If unit assignment is missing, unverified, or inactive, submission snapshot creation fails completely with no partial records left behind.
4. **BOD Parallel Integrity**: In Stage 3, Hery and Hashimoto can approve in either order; approval by one leaves document in `IN_REVIEW`, and only approval by both completes the workflow; rejection by one transitions the other to `WAITING` and rejects the workflow.
5. **Legacy Compatibility & PM Controls**: Document ownership, JWT claims, and legacy approvals remain functional; bootstrap Admin is never auto-assigned as fallback; non-bootstrap Admins require explicit verification.

---

### Task 1: Existing Approval Workflow Inspection & Baseline Verification (HF02B-001)

**Files:**
- Read: `server/repository.ts`
- Read: `src/types/document.ts`
- Test: `npm test`

**Steps:**
- [ ] Inspect existing document submission, approval, rejection, and revision behaviors in `server/repository.ts`.
- [ ] Document the existing approval workflow rules, stage sequence, BOD parallel completion, and rejection resets.
- [ ] Verify repository test baseline (confirm 176 tests pass before starting modifications).

### Task 2: Approval Stage Data Model & SQLite Schema (HF02B-002, HF02B-004)

**Files:**
- Create: `server/stage-engine.ts`
- Test: `server/stage-engine.test.ts`

**Steps:**
- [ ] Define TypeScript types and interfaces:
  - `WorkflowInstance`, `ApprovalStageRecord`, `AssignmentSnapshot`, `ApprovalDecisionRecord`.
  - Stage statuses: `WAITING`, `PENDING`, `APPROVED`, `REJECTED`.
  - Workflow statuses: `ACTIVE`, `COMPLETED`, `REJECTED`, `CANCELLED`.
- [ ] Define SQLite DDL for:
  - `approval_workflows`
  - `approval_assignment_snapshots`
  - `approval_stages`
  - `approval_decisions`
- [ ] Implement migration function `migrateApprovalEngine(db: DatabaseSync)` with transaction safety and idempotency.
- [ ] Write schema verification tests proving table creation and re-run safety.

### Task 3: Submission-Time Approver Snapshot Engine (HF02B-003)

**Files:**
- Modify: `server/stage-engine.ts`
- Test: `server/stage-engine.test.ts`

**Steps:**
- [ ] Implement `createSubmissionWorkflow(docContext, options)`:
  - For standard documents (PR, PO, AV, RB, RC):
    - Resolve Stage 1 supervisor from `OrganizationRepository` for applicant's unit.
    - Validate approver is active and verified in `app_users`.
    - Fail-closed if assignment missing (`NO_ASSIGNMENT`), unverified (`APPROVER_UNVERIFIED`), or inactive (`APPROVER_INACTIVE`).
    - Create immutable `AssignmentSnapshot`.
    - Create Stage 1 (`PENDING`), Stage 2 (`WAITING`), Stage 3A & 3B (`WAITING`).
  - For PV:
    - Stage 1 pre-completed; Stage 2 is `PENDING`, Stage 3A & 3B `WAITING`.
- [ ] Ensure transactional atomicity: if snapshot fails, rollback completely.
- [ ] Write unit tests verifying snapshot immutability against subsequent org assignment changes.

### Task 4: Independent Stage State Machine & Progression (HF02B-005, HF02B-006, HF02B-007)

**Files:**
- Modify: `server/stage-engine.ts`
- Test: `server/stage-engine.test.ts`

**Steps:**
- [ ] Implement `recordStageDecision(input: { workflowId, stageId, approverUserId, decision, comment })`:
  - Validate stage is `PENDING`. Rejects decisions on `WAITING` or terminal stages.
  - Validate approver matches stage assignment.
  - For `APPROVE`:
    - Mark stage `APPROVED`, set `completed_at`.
    - Record distinct decision in `approval_decisions`.
    - Evaluate progression:
      - Stage 1 approved -> activate Stage 2 (`PENDING`).
      - Stage 2 approved -> activate Stage 3A and 3B (`PENDING`).
      - Stage 3 (BOD parallel): check if both 3A and 3B are approved. If both approved -> workflow `COMPLETED`.
  - For `REJECT`:
    - Require non-empty comment.
    - Mark stage `REJECTED`.
    - If parallel stage active, suspend sibling stage to `WAITING`.
    - Mark workflow `REJECTED`.
    - Record distinct decision in `approval_decisions`.
- [ ] Write unit tests proving:
  - User A approving Stage 1 does NOT complete or skip Stage 2.
  - Stage 2 requires a second distinct decision from User A.
  - Two distinct records exist in `approval_decisions`.
  - BOD parallel approval requires both Hery and Hashimoto.

### Task 5: PM Controls & Legacy Compatibility Verification (HF02B-008, PM-001, PM-002, PM-003)

**Files:**
- Modify: `server/stage-engine.test.ts`
- Test: `server/server.test.ts`, `server/organization.test.ts`

**Steps:**
- [ ] Verify PM-001 (Bootstrap Admin safety: no fallback approver, non-bootstrap admin requires verification).
- [ ] Verify PM-002 (Legacy identity mapping compatibility with JWT, document ownership, and reads).
- [ ] Verify PM-003 (Operational readiness: isolated fixtures only, no operational DB touched).
- [ ] Ensure existing approval endpoints in `server/app.ts` continue to run their existing behavior during HF02-B without regressions.

### Task 6: Documentation & Deliverables (HF02-B Completion Report)

**Files:**
- Create: `docs/redesign/hotfix-br-app-001-hf02b.md`
- Test: `npm test`, `npm run build`

**Steps:**
- [ ] Run full test suite (`npm test`) and production build (`npm run build`).
- [ ] Author `docs/redesign/hotfix-br-app-001-hf02b.md` covering all 14 required deliverable sections.
- [ ] Update knowledge graph (`graphify update .`) per project rules.
- [ ] Submit HF02-B Completion Report and stop for Product Owner review.

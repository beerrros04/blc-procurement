# Document Workspace & Multi-Stage Approval Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, interactive, zero-trade-off frontend document workspace for BLC Procurement covering all 6 document types (PR, PO, AV, RB, RC, PV), a role-switching simulator, multi-stage approval stepper (Atasan → Bu Ayu → BOD Hery & Hashimoto), parent-child data inheritance, and client-side persistence with Vitest test coverage.

**Architecture:** A modular React 19 + TypeScript application. Document domain models and math calculations live in dedicated pure TypeScript modules. State persistence is managed through an extensible localStorage repository pattern with atomic state transitions and append-only audit logging. UI is composed of accessible semantic modals (`<dialog>`), responsive data tables, a role switcher, visual approval steppers, and dedicated document forms.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Vitest 5.1, Native CSS Design Tokens.

**Spec:** [docs/superpowers/specs/2026-11-07-document-workspace-frontend-design.md](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/docs/superpowers/specs/2026-11-07-document-workspace-frontend-design.md)

## Global Constraints

- 100% front-end coverage of all 6 document types (PR, PO, AV, RB, RC, PV) without dropping any operational fields or compromising business rules.
- Approval chain is strictly: Atasan Langsung (Tahap 1) → Bu Ayu (Tahap 2) → BOD: Pak Hery & Hashimoto parallel (Tahap 3) → Finance queue for PV generation and payment. HR is NOT involved in approval.
- Rp5.000.000 is strictly a document validation threshold (mandatory IAM memo for PR, mandatory ParentPRID for PO), NOT a bypass of BOD approval.
- Pure client-side persistence via `localStorage` with error boundaries and data validation.
- All calculations (PPN 11%, PPh, net total, RC balance, outcome types) must be covered with unit tests in Vitest.
- Visual styling must preserve and extend the existing clean design tokens in `src/style.css`.

## Review Focus

1. PO financial calculation edge case: Zero or missing discount/other costs must not produce `NaN` in totalAmount.
2. RC outcome edge cases: Exact zero balance produces `EXACT`, negative balance produces `DEFICIT`, positive balance produces `SURPLUS` with required refund proof.
3. PV generation inheritance: PV grossAmount and payee details must inherit accurately from parent PO/AV/RB or RC deficit.
4. Rejection lifecycle: Rejecting at any stage (Atasan, Ayu, or BOD) resets document status to `DRAFT` in-place and appends reason to `auditLog` without changing document ID.
5. Multi-approver BOD parallel logic: Both Hery and Hashimoto must approve before the document moves to `APPROVED`.

---

### Task 1: Domain Types and Financial Calculation Core

**Files:**
- Create: `src/types/document.ts`
- Create: `src/domain/calculations.ts`
- Test: `src/domain/calculations.test.ts`

**Interfaces:**
- Consumes: None (base domain layer)
- Produces: `DocType`, `ApprovalStage`, `DocumentStatus`, `PRDocument`, `PODocument`, `AVDocument`, `RBDocument`, `RCDocument`, `PVDocument`, `AnyDocument`, `calculatePoTotal`, `calculateRcOutcome`, `calculatePvNet`

- [ ] **Step 1: Write the failing unit tests for calculations**

Create `src/domain/calculations.test.ts` with tests for:
- `calculatePoTotal`: subtotal (Rp10.000.000) + otherCosts (Rp500.000) - discount (Rp200.000) + PPN 11% (Rp1.100.000) - PPh 2% (Rp200.000) = Rp11.200.000.
- `calculateRcOutcome`:
  - Realized (Rp8.000.000) vs AV (Rp10.000.000) -> balance Rp2.000.000, outcome `SURPLUS`.
  - Realized (Rp12.000.000) vs AV (Rp10.000.000) -> balance -Rp2.000.000, outcome `DEFICIT`.
  - Realized (Rp10.000.000) vs AV (Rp10.000.000) -> balance Rp0, outcome `EXACT`.
- `calculatePvNet`: gross (Rp11.200.000) - PPh (Rp200.000) = Rp11.000.000.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement domain types and calculation functions**

Implement `src/types/document.ts` and `src/domain/calculations.ts` exporting exact types and calculation formulas.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all calculation tests pass)

---

### Task 2: Multi-Document Repository and State Machine Store

**Files:**
- Create: `src/store/document-store.ts`
- Test: `src/store/document-store.test.ts`

**Interfaces:**
- Consumes: `src/types/document.ts`, `src/domain/calculations.ts`
- Produces: `loadAllDocuments`, `saveDocument`, `submitDocument`, `approveDocumentStage`, `rejectDocument`, `generatePvFromSource`, `recordPvPayment`

- [ ] **Step 1: Write failing unit tests for document store**

Create `src/store/document-store.test.ts` testing:
- Saving drafts across PR, PO, AV, RB, RC.
- Submitting draft -> moves to `SUBMITTED`, sets Stage 1 (Atasan) to `PENDING`.
- Multi-stage approval:
  - Atasan approves -> Stage 1 APPROVED, Stage 2 (Ayu) PENDING.
  - Bu Ayu approves -> Stage 2 APPROVED, Stage 3 (BOD) PENDING.
  - Hery approves (parallel) -> Hery APPROVED, Hashimoto still PENDING.
  - Hashimoto approves -> Stage 3 APPROVED, document status becomes `APPROVED`.
- Rejection:
  - Rejecting at Stage 2 with reason "Anggaran tidak sesuai" -> document status resets to `DRAFT`, audit log records stage, actor, timestamp, and reason.
- PV Generation:
  - Generates PV from approved PO -> status `UNPAID`, inherits netAmount.
  - Paying PV -> records bank source, reference number, status becomes `PAID`.
- RC Inheritance:
  - Selecting paid AV inherits `avOriginalAmount`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL (store functions not defined)

- [ ] **Step 3: Implement `document-store.ts`**

Implement store with `localStorage` persistence, error handling, sequential/parallel approval engine, and relationship resolvers.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all store and workflow transition tests pass)

---

### Task 3: Visual Approval Stepper and Role Bar Components

**Files:**
- Create: `src/components/RoleSwitcher.tsx`
- Create: `src/components/ApprovalStepper.tsx`
- Modify: `src/style.css`

**Interfaces:**
- Consumes: `src/types/document.ts`
- Produces: `RoleSwitcher` (allows switching between Pemohon, Atasan, Bu Ayu, BOD Hery/Hashimoto, Keuangan), `ApprovalStepper` (displays 3-stage visual progression with badges and timestamps)

- [ ] **Step 1: Write component structures for RoleSwitcher and ApprovalStepper**

Implement `RoleSwitcher.tsx` with clear visual indicator of active role and badge.
Implement `ApprovalStepper.tsx` rendering:
- Step 1: Atasan Langsung (Status + Timestamp/Comment)
- Step 2: Bu Ayu - Verifikator Keuangan (Status + Timestamp/Comment)
- Step 3: BOD - Pak Hery & Hashimoto (Dual parallel badges)

- [ ] **Step 2: Add styles in `src/style.css` for Stepper & Role Bar**

Add CSS classes: `.role-bar`, `.role-chip`, `.role-active`, `.stepper-container`, `.step-card`, `.step-pending`, `.step-approved`, `.step-rejected`.

- [ ] **Step 3: Verify build with type check**

Run: `npm run build`
Expected: PASS (clean TypeScript build)

---

### Task 4: Interactive Document Forms (PR, PO, AV, RB, RC, PV)

**Files:**
- Create: `src/components/forms/FormPR.tsx`
- Create: `src/components/forms/FormPO.tsx`
- Create: `src/components/forms/FormAV.tsx`
- Create: `src/components/forms/FormRB.tsx`
- Create: `src/components/forms/FormRC.tsx`
- Create: `src/components/forms/FormPVPayment.tsx`
- Modify: `src/style.css`

**Interfaces:**
- Consumes: `src/types/document.ts`, `src/domain/calculations.ts`, `src/store/document-store.ts`
- Produces: Reusable modal form components with full validation:
  - `FormPR`: title, branch, purpose, requiredDate, budgetType, subtotalAmount (≥ Rp5M IAM warning), notes.
  - `FormPO`: parent PR selector, category, vendor, payment method (Bank details if transfer), subtotal, otherCosts, discount, PPN 11%, PPh, live total computation.
  - `FormAV`: activityDate, dueDate, amount, disbursement method, bank details.
  - `FormRB`: expense category, transactionDate, items, subtotal, otherCosts, discount, beneficiaryBank.
  - `FormRC`: paid AV selector, auto-fills original amount, realized amount, live balance & outcome badge (SURPLUS/DEFICIT/EXACT), refund proof/reimbursement fields.
  - `FormPVPayment`: bank source, reference number, proof URL, payment date.

- [ ] **Step 1: Implement form components with live calculation and validation**

Write each form module with semantic inputs, error messages, and calculation bindings.

- [ ] **Step 2: Add CSS rules for multi-column form grids and calculation summaries**

Add grid layout styles in `src/style.css` for financial inputs and outcome callouts.

- [ ] **Step 3: Verify build with type check**

Run: `npm run build`
Expected: PASS

---

### Task 5: Document List, Detail Modal, and Main Workspace Shell

**Files:**
- Create: `src/components/DocumentList.tsx`
- Create: `src/components/DocumentDetailModal.tsx`
- Modify: `src/main.tsx`
- Modify: `src/style.css`

**Interfaces:**
- Consumes: All components from Tasks 1-4, `src/store/document-store.ts`
- Produces: Fully interactive main workspace shell with sidebar navigation, metric cards, role-aware actions, document creation, multi-stage approval actions, PV generation, and payment recording.

- [ ] **Step 1: Implement `DocumentList.tsx` and `DocumentDetailModal.tsx`**

- `DocumentList`: Filter by document type, search by title/number, status badge, action buttons (Ubah, Detail, Ajukan, Buat PV, Bayar).
- `DocumentDetailModal`: Shows full document specifications, visual approval stepper, audit log history, and action buttons conditioned on the active simulated role (Approve with note, Reject with required reason).

- [ ] **Step 2: Wire up `src/main.tsx`**

Integrate sidebar tabs (Ringkasan, PR, PO, AV, RB, RC, PV), role bar, document list, creation modals, and action handlers.

- [ ] **Step 3: Update and polish `src/style.css`**

Add responsive sidebar, table wrapping, modal positioning, and button variants.

- [ ] **Step 4: Run tests and build**

Run: `npm test && npm run build`
Expected: PASS

---

### Task 6: End-to-End Simulation Testing & Seed Data

**Files:**
- Create: `src/store/seed-data.ts`
- Create: `src/workspace.test.ts`

**Interfaces:**
- Consumes: `src/store/document-store.ts`, `src/types/document.ts`
- Produces: Verified realistic operational lifecycle and seed data for immediate manual evaluation in browser.

- [ ] **Step 1: Write integration test in `src/workspace.test.ts`**

Simulate complete realistic journey:
1. Pemohon creates PR -> Submits -> Atasan approves -> Bu Ayu approves -> BOD (Hery & Hashimoto) approve -> Status `APPROVED`.
2. Pemohon creates PO referencing approved PR -> Submits -> Approvals complete.
3. Keuangan generates PV from PO -> PV created with `UNPAID`.
4. Keuangan records payment with bank reference -> PV becomes `PAID`.
5. Pemohon creates AV -> Approvals complete -> Keuangan pays AV.
6. Pemohon creates RC referencing paid AV with Surplus -> Approvals complete -> Settled.

- [ ] **Step 2: Implement initial seed data in `src/store/seed-data.ts`**

Provide realistic initial mock data so the workspace opens with sample documents across various stages (Draft, In Review, Approved, Waiting PV, Paid) for immediate preview.

- [ ] **Step 3: Run all test suites**

Run: `npm test && npm run build`
Expected: All unit & integration tests pass with 0 errors.

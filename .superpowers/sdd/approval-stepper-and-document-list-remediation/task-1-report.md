# Task 1 Report: Approver Name Data Integrity & Resolution (Feedback 3)

## Summary
Resolved the issue where stage 1 approval progress indicators in `DocumentList` and approval steppers showed `"Nama belum tersedia: Menunggu"` in tooltips and titles. Replaced the uninformative fallback `"Nama belum tersedia"` with `"Belum ditentukan"`, passed `document.stage1ApproverEmail` into all `displayPersonName` call sites, and ensured data integrity in `server/repository.ts` through `ensureIntegrity()`.

## Changes Made
1. **`src/domain/display-name.ts`**:
   - Replaced `UNKNOWN_PERSON = 'Nama belum tersedia'` with `export const UNKNOWN_PERSON = 'Belum ditentukan'`.
   - Updated signature to `displayPersonName(raw?: string, approverEmail?: string, fallback = UNKNOWN_PERSON): string`.
   - Enhanced resolution logic: when `approverEmail` is provided (e.g., `atasan@blc.co.id`), resolves to `'Pak Hendra'`.
   - If neither name nor email can be resolved, cleanly falls back to `'Belum ditentukan'` (or the caller's custom fallback).

2. **`src/components/ApprovalProgress.tsx`**:
   - Passed `document.stage1ApproverEmail` to `displayPersonName(atasan.assignedTo, document.stage1ApproverEmail)`.
   - Tooltips in compact mode (`DocumentList`) now show `Pak Hendra: Menunggu` (or `Belum ditentukan: Belum dimulai`), never displaying `"Nama belum tersedia"`.

3. **`src/components/ApprovalStepper.tsx`**:
   - Passed `document.stage1ApproverEmail` to `displayPersonName(atasan.assignedTo, document.stage1ApproverEmail)` for Tahap 1 Atasan header.

4. **`server/repository.ts`**:
   - Extracted and enhanced `ensureIntegrity()` method called on repository initialization.
   - For all documents with `stage1ApproverEmail`, ensures `approvalSteps.atasan.assignedTo` matches `resolveApproverName(document.stage1ApproverEmail)`.

5. **Unit Tests**:
   - **`src/domain/display-name.test.ts`**:
     - Verified fallback to `'Belum ditentukan'` for empty/generic inputs.
     - Verified email resolution for `atasan@blc.co.id` -> `Pak Hendra` and unknown email -> `Belum ditentukan`.
     - Verified custom fallback parameter behavior.
   - **`src/components/ApprovalProgress.test.tsx`**:
     - Verified full mode displays `'Pak Hendra'`.
     - Verified compact mode dot tooltip displays `title="Pak Hendra: Belum dimulai"`.
     - Added test verifying unassigned approver falls back to `title="Belum ditentukan: Belum dimulai"` and never contains `Nama belum tersedia`.
   - **`src/components/DocumentDetailModal.test.tsx`**:
     - Updated assertion to verify stepper contains `'Pak Hendra'`.

## Verification & Test Results
Ran `npm test` (`vitest run`):
- Test Files: 16 passed (16)
- Tests: 101 passed (101)
- Failures: 0

```
 RUN  v5.1.0 C:/Users/Bernard/Documents/personal's project/BLC

 ✓ src/components/BentoMetrics.test.tsx (3 tests)
 ✓ src/components/DocumentDetailModal.test.tsx (5 tests)
 ✓ server/server.test.ts (24 tests)
 ✓ src/components/ui/modal-dialog.test.tsx (2 tests)
 ✓ src/store/document-store.test.ts (6 tests)
 ✓ src/domain/payment-label.test.ts (2 tests)
 ✓ src/domain/display-name.test.ts (5 tests)
 ✓ src/lib/currency-format.test.ts (7 tests)
 ✓ src/domain/calculations.test.ts (4 tests)
 ✓ src/components/register-filter.test.ts (9 tests)
 ✓ src/style.test.ts (2 tests)
 ✓ src/domain/branches.test.ts (1 test)
 ✓ src/domain/working-days.test.ts (1 test)
 ✓ src/components/ApprovalProgress.test.tsx (11 tests)
 ✓ src/workspace.test.ts (12 tests)
 ✓ src/components/elera-workspace.test.tsx (7 tests)

 Test Files  16 passed (16)
      Tests  101 passed (101)
```

## Git Commit
- Hash: `faa16864ca377e99f7249a4caa111607330062e6`
- Message: `fix(approval): resolve approver names and replace uninformative fallback with Belum ditentukan`

## Concerns / Regressions
None. All components, pages, server handlers, and unit tests are green.

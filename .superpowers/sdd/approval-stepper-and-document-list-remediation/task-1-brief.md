# Task 1: Approver Name Data Integrity & Resolution (Feedback 3)

## Context & Objectives
User feedback: "Nama belum tersedia?" on `StaffBeranda > DocumentList > td:nth-of-type(5)` tooltip ("Nama belum tersedia: Menunggu").

Requirements:
1. `src/domain/display-name.ts`:
   - Change `UNKNOWN_PERSON` from `'Nama belum tersedia'` to `'Belum ditentukan'`.
   - Update `displayPersonName(raw?: string, approverEmail?: string, fallback = 'Belum ditentukan')`.
   - When `approverEmail` is provided (e.g. `atasan@blc.co.id`), resolve to `'Pak Hendra'`.
   - If approver is genuinely not specified/empty, return `'Belum ditentukan'`.
2. `src/components/ApprovalProgress.tsx`:
   - Line 19: pass `document.stage1ApproverEmail` to `displayPersonName(atasan.assignedTo, document.stage1ApproverEmail)`.
   - Tooltip dot label: `${stage.name}: ${statusText}` will now show `Pak Hendra: Menunggu` (or `Belum ditentukan: Belum dimulai`), never `"Nama belum tersedia"`.
3. `src/components/ApprovalStepper.tsx`:
   - Line 69: pass `document.stage1ApproverEmail` to `displayPersonName(atasan.assignedTo, document.stage1ApproverEmail)`.
4. `server/repository.ts`:
   - In `ensureIntegrity()`, make sure every document with `stage1ApproverEmail` has `approvalSteps.atasan.assignedTo = resolveApproverName(document.stage1ApproverEmail)`.
5. Tests:
   - Update `src/domain/display-name.test.ts` to verify `'Belum ditentukan'` fallback and email resolution.
   - Update `src/components/ApprovalProgress.test.tsx` and `src/components/DocumentDetailModal.test.tsx` to verify resolved names.
   - Run `npm test` and ensure all tests pass.
6. Commit:
   `git commit -m "fix(approval): resolve approver names and replace uninformative fallback with Belum ditentukan"`

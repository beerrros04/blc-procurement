# Task 5 Report: Data Presentation & Table Rigor (DocumentList & ApprovalExplorer)

**Created At:** 2026-11-09T22:39:50+07:00  
**Completed At:** 2026-11-09T22:39:50+07:00  
**Status:** DONE  
**Commit:** `06c6f1507beca796286a0cd1e972b6a208f720f4`  

---

## 1. Objectives & Summary of Changes

Enforced enterprise financial rigor and visual consistency across all document tables:

1. **Numeric Column Rigor & Alignment:**
   - Applied `.th-nominal` and `text-right` to currency table headers (`DocumentList.tsx`, `ApprovalRegisterView`, `ApprovalDocsView`).
   - Applied `.col-nominal`, `text-right`, `tabular-nums`, and `font-mono` with `font-variant-numeric: tabular-nums` to currency amounts in `DocumentList.tsx`, `ApprovalRegisterView`, and `ApprovalDocsView`.
   - Updated `src/components/document-lists.css` to enforce `.th-nominal, .col-nominal { text-align: right !important; font-variant-numeric: tabular-nums; }`.

2. **Standardized 36px Filter Toolbar Controls (`control-height-md`):**
   - Standardized search inputs to 36px height (`h-[36px]` / `control-height-md`).
   - Standardized dropdown selects, reset buttons (`Atur ulang`), branch pills, and category pills across `DocumentList.tsx` and all views of `ApprovalExplorer.tsx` to 36px uniform height.
   - Preserved touch target compliance and responsiveness in `src/components/document-lists.css`.

3. **StatusBadge Integration:**
   - Integrated `<StatusBadge />` in `DocumentList.tsx` table rows (handling both base status and returned revision status).
   - Integrated `<StatusBadge />` in `ApprovalRegisterView` table rows for document status.
   - Integrated `<StatusBadge />` in `ApprovalHistoryView` for decisions/actions.

4. **ApprovalHistoryView & ApprovalDocsView Refinements:**
   - In `ApprovalHistoryView`: applied `data-density="compact"`, formatted timestamps with `tabular-nums font-mono`, and used `<StatusBadge />`.
   - In `ApprovalDocsView`: clearly separated file metadata (size, upload date) from actions (`Lihat` & `Unduh`).

---

## 2. Test Verification

- **TDD Workflow:**
  - Added unit test `ensures currency nominal columns have text-right and tabular-nums styling` in `src/components/elera-workspace.test.tsx`.
  - Verified test failure initially during Red phase (`expected 0 to be greater than 0`).
  - Verified test passed after applying `th-nominal`, `col-nominal`, and `tabular-nums`.
- **Targeted Tests:**
  - `npm test src/components/elera-workspace.test.tsx src/workspace.test.ts`: **20 passed** (2 files).
- **Full Test Suite:**
  - `npm test`: **133 passed** across all 19 test files (0 failures).
- **TypeScript & Production Build:**
  - `npm run build`: `tsc --noEmit && vite build` passed cleanly with 0 errors.

---

## 3. Files Modified & Committed
- `src/components/DocumentList.tsx`
- `src/components/ApprovalExplorer.tsx`
- `src/components/document-lists.css`
- `src/components/elera-workspace.test.tsx`

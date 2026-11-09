# Task 6 Report: Modern Export Modal & Shell Refinement

**Created At:** 2026-11-09T22:56:50+07:00  
**Completed At:** 2026-11-09T22:56:50+07:00  
**Status:** DONE  
**Commit:** `57569e4b92d533218edf571e0bddb7385c6555d2`  

---

## 1. Objectives & Summary of Changes

Elevated `<ExportModal />` to the Enterprise Design System standard (Section 4.9B & Section 10.1) and refined shell transitions:

1. **Enterprise 480px Modal Dialog (`--modal-width-sm`):**
   - Implemented 480px max-width container (`max-w-[480px] w-full`) with Framer Motion `motion.div` using `modalMotionVariants`.
   - Backdrop overlay with subtle backdrop blur (`backdrop-filter: blur(2px)`).
   - Dialog click-outside and escape key cancellation handling.

2. **Interactive Format Radio Cards:**
   - **Excel Spreadsheet / CSV (.csv):** Green `FileSpreadsheet` icon (`#059669`), green selection border (`1.5px solid #059669`), emerald subtle background (`#ECFDF5`), descriptive subtext for 13-column financial table analysis.
   - **PDF Document (.pdf):** Crimson `FileText` icon (`#DC2626`), crimson selection border (`1.5px solid #DC2626`), rose subtle background (`#FEF2F2`), descriptive subtext for printable archival documents.
   - Retained client-side CSV download with UTF-8 BOM (`\uFEFF`) and browser print preview.

3. **Export Scope Summary Card:**
   - Clearly displays `Cakupan Ekspor` header.
   - Shows selected document count (`${documents.length} dokumen`), total estimated value (`rupiah.format(totalEstimatedValue)`), and active filter scope (`Filter: Semua Status • Estimasi: ~240 KB`).

4. **Standardized Action Footer:**
   - Standardized `Batal` button using `btn-ghost secondary`.
   - Standardized `Export File` button using `btn-primary primary` with `Download` icon.

5. **Shell Refinement in `src/main.tsx`:**
   - Added Corporate motion easing (`transition: 'width 0.25s cubic-bezier(0.2, 0, 0, 1)'`) to sidebar rail transitions.
   - Added 3px active crimson accent bar (`borderLeft: '3px solid #DC2626'`, background `#FEF2F2`) on active navigation routes.
   - Added mobile drawer backdrop overlay when `mobileMenuOpen` is active.
   - Wrapped `ExportModal` in Framer Motion `<AnimatePresence>` for smooth entry and exit transitions.

---

## 2. Test Verification

- **TDD Workflow:**
  - Created `src/components/ExportModal.test.tsx` using `renderToStaticMarkup`.
  - Ran `npm test src/components/ExportModal.test.tsx` to verify initial failure (Red phase: expected text and radio cards not found).
  - Implemented `ExportModal.tsx` and updated `src/main.tsx`.
  - Ran `npm test src/components/ExportModal.test.tsx` to verify passing (Green phase: 2 passed).
- **Full Test Suite:**
  - Ran `npm test`: **135 passed** across all 20 test files (0 failures).
- **TypeScript & Production Build:**
  - Ran `npm run build`: `tsc --noEmit && vite build` compiled and bundled with 0 errors.

---

## 3. Files Modified & Committed
- `src/components/ExportModal.tsx`
- `src/components/ExportModal.test.tsx`
- `src/main.tsx`

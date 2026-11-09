# Task 6 Brief: Modern Export Modal & Shell Refinement

## Plan Reference
`docs/superpowers/plans/2026-11-09-enterprise-design-system-and-interactive-motion.md` - Task 6

## Objective
Elevate `<ExportModal />` to the Enterprise Design System standard (Section 4.9B & Section 10.1):
1. Modal width 480px (`--modal-width-sm` / `max-w-[480px] w-full`) with Framer Motion `AnimatePresence` and backdrop blur.
2. Two interactive radio cards for export formats:
   - *Excel Spreadsheet / CSV (.csv)*: green `FileSpreadsheet` icon (`#059669`), green subtle accent on selection, description for tabular analysis.
   - *PDF Document (.pdf)*: crimson `FileText` icon (`#DC2626`), crimson subtle accent on selection, description for printable report.
3. Export scope summary card: displays selected document count, total nominal value, and active filter scope.
4. Clean action footer: Batal (`btn-ghost`) and Export File (`btn-primary`).
5. Shell refinement in `src/main.tsx`: sidebar width transition using Corporate easing (`cubic-bezier(0.2, 0, 0, 1)`), 3px active crimson accent bar, and offcanvas drawer for mobile.

## Files to Modify/Create
- Modify: `src/components/ExportModal.tsx`
- Create: `src/components/ExportModal.test.tsx`
- Modify: `src/main.tsx`

## Step-by-Step Requirements

### Step 1: Write test in `src/components/ExportModal.test.tsx`
Use `renderToStaticMarkup` from `'react-dom/server'` consistent with the rest of the test suite:
```typescript
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { ExportModal } from './ExportModal';
import { INITIAL_SEED_DOCUMENTS } from '../store/seed-data';

describe('ExportModal Component', () => {
  it('renders 480px dialog with XLSX/CSV and PDF radio cards and scope summary', () => {
    const html = renderToStaticMarkup(<ExportModal documents={INITIAL_SEED_DOCUMENTS} onClose={() => {}} />);
    expect(html).toContain('Export Laporan');
    expect(html).toContain('Excel Spreadsheet / CSV (.csv)');
    expect(html).toContain('PDF Document (.pdf)');
    expect(html).toContain(`${INITIAL_SEED_DOCUMENTS.length} dokumen`);
  });

  it('renders export actions and scope information', () => {
    const html = renderToStaticMarkup(<ExportModal documents={INITIAL_SEED_DOCUMENTS} onClose={() => {}} />);
    expect(html).toContain('Batal');
    expect(html).toContain('Export File');
    expect(html).toContain('Cakupan Ekspor');
  });
});
```

### Step 2: Run test to verify failure
Run: `npm test src/components/ExportModal.test.tsx`
Expected: FAIL (text mismatch or missing radio card titles).

### Step 3: Implement polished `ExportModal.tsx` and enhance `src/main.tsx`
1. In `src/components/ExportModal.tsx`:
   - Use `motion.div` with `modalMotionVariants` from `src/lib/motion.ts`.
   - Backdrop overlay with `backdrop-filter: blur(2px)`.
   - Radio cards with clear selection state, clean borders (`1px solid #E4E2DD`), selected border (`1.5px solid #DC2626` or `#059669`).
   - Scope summary box: `${documents.length} dokumen • Filter: Semua Status • Estimasi: ~240 KB`.
   - Retain existing download mechanisms (`CSV` with UTF-8 BOM `\uFEFF` and `PDF` print preview).
2. In `src/main.tsx`:
   - Ensure sidebar transitions smoothly between 240px and 64px using Corporate motion.
   - Active navigation item has 3px crimson bar on the left edge.

### Step 4: Verification & Commit
Run: `npm test src/components/ExportModal.test.tsx`
Ensure all tests pass.
Run full suite: `npm test`.
Commit: `git commit -m "feat(export): polish ExportModal with 480px radio cards and motion transitions"`

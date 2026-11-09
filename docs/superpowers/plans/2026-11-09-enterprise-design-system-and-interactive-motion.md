# Enterprise Design System & Interactive Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the centralized BLC Caready Procurement Pro Enterprise Design System (`Operate` surface mode, Corporate motion archetype, unified tokens, `tabular-nums` financial rigor, and Framer Motion micro-interactions) while preserving all existing workflows, data contracts, and test suites.

**Architecture:** Integrate the complete design token foundation into `src/style.css` with backward-compatible aliases, establish an enterprise Framer Motion utility (`src/lib/motion.ts`), create standardized UI components (`<StatusBadge />`, `<FilterChip />`), upgrade the inline stepper with payment settlement separation, apply tabular formatting to data tables, and polish `<ExportModal />` to the 480px radio-card design.

**Tech Stack:** React 19, TypeScript 5.8, Tailwind CSS v4, Framer Motion v14, Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-09-enterprise-design-system-and-motion-design.md`

## Global Constraints

- Primary Brand Crimson: `--color-primary: #DC2626` / `--accent-caready: #e51937`
- Canvas & Surfaces: Warm Slate canvas `--color-background: #F4F3EF` / `--canvas-bg: #f6f5f3`, card surface `#FFFFFF`, borders `#E4E2DD` / `#ededeb`
- Motion Personality: Corporate archetype (`cubic-bezier(0.2, 0, 0, 1)`), max 0-3% overshoot, `prefers-reduced-motion` compliance
- Financial Rigor: `font-variant-numeric: tabular-nums` and `text-align: right` on all currency / nominal columns
- Zero New Runtime Dependencies: Leverage existing `framer-motion`, `tailwindcss`, and `lucide-react`
- Test Suite Preservation: All 16 test files (107 existing tests) must pass continuously

## Review Focus

- Token coexistence regressions: Ensure legacy CSS variables (`--canvas-bg`, `--border-clean`, `--accent-caready`) remain defined so `style.test.ts` never fails.
- Detail drawer stepper badge text: Ensure `.step-badge` retains exact text ("Disetujui", "Ditolak", "Menunggu Giliran") and class names so `DocumentDetailModal.test.tsx` never breaks.
- Export modal downloads: Ensure CSV export includes UTF-8 BOM `\uFEFF` and headers match existing exports.
- Layout overflow on mobile (320px–375px): Ensure no horizontal page scrollbar is introduced.
- Reduced motion: Ensure all Framer Motion components instantly settle without animation when `prefers-reduced-motion: reduce` is set.

---

### Task 1: Design Tokens & Foundation (CSS & Types)

**Files:**
- Create: `src/types/design-system.types.ts`
- Modify: `src/style.css:1-120`
- Modify: `src/style.test.ts`

**Interfaces:**
- Consumes: Existing CSS variables and design tokens.
- Produces: TypeScript definitions (`ButtonVariant`, `ControlSize`, `DocumentStatus`, `ApprovalStepState`) and comprehensive CSS custom properties in `src/style.css`.

- [ ] **Step 1: Write failing test in `src/style.test.ts` for new design system tokens**

```typescript
it('defines Enterprise Design System tokens and retains backward-compatible Caready aliases', () => {
  const css = readFileSync(resolve(__dirname, 'style.css'), 'utf-8');
  // New Design System tokens
  expect(css).toContain('--palette-primary-600: #DC2626;');
  expect(css).toContain('--palette-neutral-100: #F4F3EF;');
  expect(css).toContain('--color-primary:');
  expect(css).toContain('--color-background:');
  expect(css).toContain('--easing-standard: cubic-bezier(0.2, 0, 0, 1);');
  expect(css).toContain('--elevation-1:');
  // Legacy aliases for existing tests
  expect(css).toContain('--canvas-bg: #f6f5f3;');
  expect(css).toContain('--border-clean: #ededeb;');
  expect(css).toContain('--accent-caready: #e51937;');
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test src/style.test.ts`
Expected: FAIL with missing `--palette-primary-600` or `--easing-standard`.

- [ ] **Step 3: Create `src/types/design-system.types.ts`**

Define TypeScript contracts from Section 9.2 of the specification:
`ButtonVariant`, `ControlSize`, `DocumentStatus`, `ApprovalStepState`, `StepperVariant`, `TableDensity`.

- [ ] **Step 4: Update `src/style.css` with complete Section 9.1 tokens**

Incorporate primitive palettes (`--palette-primary-*`, `--palette-neutral-*`, `--palette-success-*`, `--palette-warning-*`, `--palette-error-*`, `--palette-info-*`), semantic color tokens, typography scales, spacing scale (4px), radius tokens, elevation levels, and corporate motion tokens, while preserving legacy variable definitions as aliases.

- [ ] **Step 5: Run tests to verify all style tests pass**

Run: `npm test src/style.test.ts`
Expected: PASS (all tests pass).

- [ ] **Step 6: Commit**

```bash
git add src/types/design-system.types.ts src/style.css src/style.test.ts
git commit -m "feat(design-system): integrate tokens foundation and typography scale"
```

---

### Task 2: Interactive Motion Engine (`src/lib/motion.ts`)

**Files:**
- Create: `src/lib/motion.ts`
- Create: `src/lib/motion.test.ts`

**Interfaces:**
- Consumes: `framer-motion`
- Produces: `corporateTransition`, `pressableProps`, `hoverableCardProps`, `modalMotionVariants`, `drawerMotionVariants`.

- [ ] **Step 1: Write test in `src/lib/motion.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { corporateTransition, modalMotionVariants, pressableProps } from './motion';

describe('Corporate Motion Engine', () => {
  it('exports corporate cubic-bezier transition curves', () => {
    expect(corporateTransition.ease).toEqual([0.2, 0, 0, 1]);
    expect(corporateTransition.duration).toBe(0.25);
  });

  it('provides scale tap feedback for interactive controls', () => {
    expect(pressableProps.whileTap).toEqual({ scale: 0.98 });
  });

  it('defines modal entrance and exit states', () => {
    expect(modalMotionVariants.hidden.opacity).toBe(0);
    expect(modalMotionVariants.visible.opacity).toBe(1);
    expect(modalMotionVariants.exit.opacity).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test src/lib/motion.test.ts`
Expected: FAIL (module `src/lib/motion.ts` not found).

- [ ] **Step 3: Implement `src/lib/motion.ts`**

Implement Corporate motion archetype helper functions, transition constants (`[0.2, 0, 0, 1]`), variants for modals, drawers, and card hover/tap interactions.

- [ ] **Step 4: Run test to verify pass**

Run: `npm test src/lib/motion.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/motion.ts src/lib/motion.test.ts
git commit -m "feat(motion): add corporate motion engine utilities and variants"
```

---

### Task 3: Modern UI Component System (Buttons, Badges & Chips)

**Files:**
- Create: `src/components/ui/StatusBadge.tsx`
- Create: `src/components/ui/StatusBadge.test.tsx`
- Create: `src/components/ui/FilterChip.tsx`
- Modify: `src/style.css` (button, chip, and form control styles)

**Interfaces:**
- Consumes: `src/types/design-system.types.ts`, `lucide-react`, `src/lib/motion.ts`
- Produces: `<StatusBadge />`, `<FilterChip />`.

- [ ] **Step 1: Write failing test in `src/components/ui/StatusBadge.test.tsx`**

```typescript
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge Component', () => {
  it('renders semantic badge with icon and label for APPROVED / disetujui', () => {
    const html = renderToStaticMarkup(<StatusBadge status="APPROVED" />);
    expect(html).toContain('class="status-badge status-approved"');
    expect(html).toContain('Disetujui');
    expect(html).toContain('svg'); // Lucide check icon
  });

  it('renders semantic badge with icon and label for PAID / lunas', () => {
    const html = renderToStaticMarkup(<StatusBadge status="PAID" />);
    expect(html).toContain('status-paid');
    expect(html).toContain('Lunas');
  });

  it('renders semantic badge with icon and label for REJECTED / ditolak', () => {
    const html = renderToStaticMarkup(<StatusBadge status="REJECTED" />);
    expect(html).toContain('status-rejected');
    expect(html).toContain('Ditolak');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test src/components/ui/StatusBadge.test.tsx`
Expected: FAIL (`StatusBadge` does not exist).

- [ ] **Step 3: Implement `src/components/ui/StatusBadge.tsx` and `src/components/ui/FilterChip.tsx`**

- `StatusBadge`: Maps document statuses (`DRAFT`, `SUBMITTED`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `PAID`) to pill styling (`height: 24px`, `border-radius: 9999px`, padding `2px 10px`) with semantic Lucide icons (`CheckCircle2`, `Clock`, `Eye`, `XCircle`, `RotateCcw`, `CreditCard`).
- `FilterChip`: Renders 32px interactive filter toggle pill with `whileTap={{ scale: 0.98 }}` and active primary red state (`bg: #DC2626, text: #FFF`).
- Update `src/style.css` with `.status-badge`, `.filter-chip`, and standardized `.btn-*` classes.

- [ ] **Step 4: Run test to verify pass**

Run: `npm test src/components/ui/StatusBadge.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/StatusBadge.tsx src/components/ui/StatusBadge.test.tsx src/components/ui/FilterChip.tsx src/style.css
git commit -m "feat(ui): add StatusBadge and FilterChip components with semantic styling"
```

---

### Task 4: Approval Stepper & Payment Settlement Node

**Files:**
- Modify: `src/components/ui/progress-indicator.tsx`
- Modify: `src/components/ui/progress-indicator.css`
- Modify: `src/components/ApprovalProgress.tsx`
- Modify: `src/components/ApprovalProgress.test.tsx`

**Interfaces:**
- Consumes: Document status and payment properties.
- Produces: Enhanced inline table stepper with dedicated vertical divider (`1px solid #E4E2DD`, `height: 16px`) and payment settlement node (`Lunas` or `Menunggu Pembayaran`).

- [ ] **Step 1: Write test in `src/components/ApprovalProgress.test.tsx` for payment settlement divider and node**

```typescript
it('renders separated payment settlement indicator node with vertical divider', () => {
  const doc = structuredClone(INITIAL_SEED_DOCUMENTS[0]);
  doc.status = 'PAID';
  const html = renderToStaticMarkup(<ApprovalProgress document={doc} variant="capsule" />);
  expect(html).toContain('stepper-payment-divider');
  expect(html).toContain('stepper-payment-node');
  expect(html).toContain('Lunas');
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test src/components/ApprovalProgress.test.tsx`
Expected: FAIL (missing `stepper-payment-divider`).

- [ ] **Step 3: Implement payment settlement separator and indicator in `ApprovalProgress.tsx` and `progress-indicator.css`**

Add the 1px vertical divider between step 3 (BoD) and the final payment settlement status dot. Ensure dot reflects `PAID` (emerald `#059669` with `✓`) vs `APPROVED` (amber `#D97706` with `Clock`) vs earlier stages (neutral light grey). Maintain accessible title/tooltip.

- [ ] **Step 4: Run tests to verify all ApprovalProgress and DocumentDetailModal tests pass**

Run: `npm test src/components/ApprovalProgress.test.tsx src/components/DocumentDetailModal.test.tsx`
Expected: PASS (all tests pass).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/progress-indicator.tsx src/components/ui/progress-indicator.css src/components/ApprovalProgress.tsx src/components/ApprovalProgress.test.tsx
git commit -m "feat(stepper): add payment settlement node with dedicated vertical divider"
```

---

### Task 5: Data Presentation & Table Rigor (DocumentList & ApprovalExplorer)

**Files:**
- Modify: `src/components/DocumentList.tsx`
- Modify: `src/components/ApprovalExplorer.tsx`
- Modify: `src/components/document-lists.css`
- Test: `src/components/elera-workspace.test.tsx`, `src/workspace.test.ts`

**Interfaces:**
- Consumes: `<StatusBadge />`, `<FilterChip />`, currency format utilities.
- Produces: High-density, tabular-aligned data tables with right-aligned currency cells and 36px standardized filter bars.

- [ ] **Step 1: Add unit test in `src/components/elera-workspace.test.tsx` asserting tabular right-alignment for currency cells**

```typescript
it('ensures currency nominal columns have text-right and tabular-nums classes', () => {
  const { container } = render(<DocumentList documents={INITIAL_SEED_DOCUMENTS} onSelect={() => {}} />);
  const currencyCells = container.querySelectorAll('td.col-nominal, td.tabular-currency');
  expect(currencyCells.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Update `DocumentList.tsx` and `ApprovalExplorer.tsx`**

- Apply `col-nominal text-right font-variant-numeric: tabular-nums` to all currency/Rupiah cells and headers.
- Integrate `<StatusBadge />` for document status display in table rows.
- Standardize search input, filter select dropdowns, and reset buttons to height `36px` (`control-height-md`).
- Ensure table container has clean horizontal scroll handling with sticky action columns on narrow viewports.

- [ ] **Step 3: Run tests to verify pass**

Run: `npm test src/components/elera-workspace.test.tsx src/workspace.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/DocumentList.tsx src/components/ApprovalExplorer.tsx src/components/document-lists.css src/components/elera-workspace.test.tsx
git commit -m "feat(table): apply tabular-nums right-alignment and standardized filter toolbar"
```

---

### Task 6: Modern Export Modal & Shell Refinement

**Files:**
- Modify: `src/components/ExportModal.tsx`
- Modify: `src/main.tsx`
- Create: `src/components/ExportModal.test.tsx`

**Interfaces:**
- Consumes: `documents: AnyDocument[]`, `onClose: () => void`, `src/lib/motion.ts`
- Produces: 480px animated export modal dialog with interactive format radio cards, export scope summary, and animated sidebar rail.

- [ ] **Step 1: Write test in `src/components/ExportModal.test.tsx`**

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExportModal } from './ExportModal';
import { INITIAL_SEED_DOCUMENTS } from '../store/seed-data';

describe('ExportModal Component', () => {
  it('renders 480px dialog with XLSX/CSV and PDF radio cards and scope summary', () => {
    const handleClose = vi.fn();
    render(<ExportModal documents={INITIAL_SEED_DOCUMENTS} onClose={handleClose} />);
    expect(screen.getByText(/Export Laporan/i)).toBeInTheDocument();
    expect(screen.getByText(/Excel Spreadsheet \/ CSV/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF Document/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${INITIAL_SEED_DOCUMENTS.length} dokumen`, 'i'))).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test src/components/ExportModal.test.tsx`
Expected: FAIL (test file or text mismatch).

- [ ] **Step 3: Implement polished `ExportModal.tsx` and enhance `src/main.tsx` navigation**

- `ExportModal`:
  - 480px modal container (`--modal-width-sm`) with Framer Motion `AnimatePresence` and backdrop blur.
  - Interactive radio cards: Excel Spreadsheet (`.csv` / Excel-compatible) with green accent (`#059669`) and PDF with crimson accent (`#DC2626`).
  - Scope summary box: shows document count, total estimated value, and active scope.
  - Action footer: Batal (`btn-ghost`) and Export File (`btn-primary`).
- `src/main.tsx`:
  - Refine sidebar collapse/expand toggle animation with Corporate easing (`cubic-bezier(0.2, 0, 0, 1)`), 3px active crimson accent bar, and offcanvas drawer for mobile.

- [ ] **Step 4: Run test to verify pass**

Run: `npm test src/components/ExportModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ExportModal.tsx src/components/ExportModal.test.tsx src/main.tsx
git commit -m "feat(export): polish ExportModal with 480px radio cards and motion transitions"
```

---

### Task 7: Full Verification, Daemon Check & Remote Synchronization

**Files:**
- Run full test suite: `npm test`
- Run production build: `npm run build`
- Update knowledge graph: `graphify update .`
- Synchronize git remote: `git push origin main`

- [ ] **Step 1: Execute complete test suite**

Run: `npm test`
Expected: All test files pass (107+ tests, 0 failures).

- [ ] **Step 2: Execute production build**

Run: `npm run build`
Expected: `tsc --noEmit && vite build` completes with 0 errors.

- [ ] **Step 3: Update knowledge graph**

Run: `graphify update .`
Expected: `graph.json` and report updated successfully.

- [ ] **Step 4: Push commits to remote repository**

Run: `git push origin main`
Expected: Pushed successfully to `https://github.com/beerrros04/blc-procurement.git`.

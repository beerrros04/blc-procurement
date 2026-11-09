# UI/UX Overhaul (Elera Architecture) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the entire visual styling, navigation shell, and document inspection interaction of the BLC Procurement portal based on the Elera Healthcare Dashboard design reference (`https://nazday-elera.vercel.app/dashboard`), establishing strict role-based Operations navigation (Dashboard, Pengajuan, Dokumen) while preserving 100% of domain rules and test coverage.

**Architecture:** Implement Elera design tokens in `src/style.css` (warm architectural canvas `#F6F5F3`, crisp `#EDEDEB` borders, charcoal `#191C1A` controls, Caready Red `#E51937` primary pop). Reorganize `src/main.tsx` into a streamlined workspace shell with role-filtered Operations tabs. Upgrade `BentoMetrics.tsx` into a connected `stats-strip`, modernize `DocumentList.tsx` with segmented pill controls, convert `DocumentDetailModal.tsx` into an ergonomic right-side slide-over drawer, and verify with existing Vitest test suites.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide React icons, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-09-ui-ux-elera-overhaul-design.md`

## Global Constraints
- Canvas background must use warm off-white `--canvas-bg: #f6f5f3`.
- Primary brand accent must be Caready Red `#E51937`; dark contrast buttons must use charcoal `#191C1A`.
- Operations navigation must strictly obey role matrix:
  - `Dashboard`: Visible only to `ADMIN`, `AYU`, `BOD_HERY`, `BOD_HASHIMOTO`.
  - `Pengajuan`: Visible to all roles (`PEMOHON`, `ATASAN`, `ADMIN`, `AYU`, `BOD_HERY`, `BOD_HASHIMOTO`, `KEUANGAN`).
  - `Dokumen`: Visible to `ADMIN`, `BOD_HERY`, `BOD_HASHIMOTO`, `AYU`, `KEUANGAN`.
- All currency amounts must render with `tabular-nums` alignment.
- Dropdown for branch selection must always support the 7 official branches (`Bekasi`, `Cibinong`, `Medan`, `Surabaya`, `Pekanbaru`, `Makassar`, `Samarinda`).
- All 41+ Vitest tests must pass without regressions.

## Review Focus
1. When logged in as `PEMOHON` (Dewi Lestari), only "Pengajuan" appears under Operations; "Dashboard" and "Dokumen" must not be rendered.
2. When logged in as `BOD_HERY` or `AYU`, all three Operations tabs ("Dashboard", "Pengajuan", "Dokumen") must appear.
3. Clicking a document's "Tinjau" button must open a right-side slide-over drawer (`s-drawer`) rather than a full-screen blocking modal, allowing the background table context to remain visible.
4. Closing the slide-over drawer via close icon, backdrop click, or ESC key must cleanly dismiss the drawer and return focus.
5. In the stats-strip, metric amounts must format with currency symbols and tabular numerals without layout shifts across screen widths.

---

### Task 1: Design Tokens & Elera Component Classes (`src/style.css`)

**Files:**
- Modify: `src/style.css:1-120`
- Test: `src/style.test.ts` (create)

**Interfaces:**
- Produces: CSS custom properties (`--canvas-bg`, `--surface-card`, `--border-clean`, `--btn-charcoal`, `--accent-caready`) and utility classes (`.stats-strip`, `.stat`, `.s-icon-chip`, `.s-badge`, `.s-tabs`, `.s-action`, `.s-action-dark`, `.s-action-caready`, `.s-drawer`, `.s-drawer-backdrop`).

- [ ] **Step 1: Write the failing test for CSS tokens in `src/style.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Elera Design Tokens in style.css', () => {
  it('defines Elera canvas and Caready corporate palette variables', () => {
    const css = fs.readFileSync(path.resolve(__dirname, 'style.css'), 'utf-8');
    expect(css).toContain('--canvas-bg: #f6f5f3');
    expect(css).toContain('--border-clean: #ededeb');
    expect(css).toContain('--btn-charcoal: #191c1a');
    expect(css).toContain('--accent-caready: #e51937');
    expect(css).toContain('.stats-strip');
    expect(css).toContain('.s-tabs');
    expect(css).toContain('.s-drawer');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/style.test.ts`
Expected: FAIL (variables or classes missing).

- [ ] **Step 3: Implement Elera design tokens and component classes in `src/style.css`**

Add root variables and utility classes:
- `--canvas-bg: #f6f5f3;`
- `--surface-card: #ffffff;`
- `--border-clean: #ededeb;`
- `--border-subtle: #f2f1ed;`
- `--btn-charcoal: #191c1a;`
- `--accent-caready: #e51937;`
- Classes `.stats-strip`, `.stat`, `.s-icon-chip`, `.s-badge`, `.s-tabs`, `.s-action`, `.s-action-dark`, `.s-action-caready`, `.s-drawer`, `.s-drawer-backdrop`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/style.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/style.css src/style.test.ts
git commit -m "feat(ui): define Elera design tokens and utility classes in style.css"
```

---

### Task 2: App Shell & Role-Based Operations Navigation (`src/main.tsx`)

**Files:**
- Modify: `src/main.tsx:50-250`
- Modify: `src/workspace.test.ts`

**Interfaces:**
- Consumes: `AuthAccount`, `UserRole`, `WorkspaceTab` from `src/types/document.ts`.
- Produces: Updated `App` component with role-filtered Operations navigation (`DASHBOARD`, `PENGAJUAN`, `DOKUMEN`) and Elera topbar.

- [ ] **Step 1: Write tests for role-based Operations navigation in `src/workspace.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { getVisibleOperationsNav } from './main'; // or helper exported from main

describe('Operations Navigation Role Filter', () => {
  it('PEMOHON sees only Pengajuan under Operations', () => {
    const nav = getVisibleOperationsNav('PEMOHON');
    expect(nav.map(n => n.id)).toEqual(['PENGAJUAN']);
  });

  it('ATASAN sees only Pengajuan under Operations', () => {
    const nav = getVisibleOperationsNav('ATASAN');
    expect(nav.map(n => n.id)).toEqual(['PENGAJUAN']);
  });

  it('ADMIN, AYU, and BOD see Dashboard, Pengajuan, and Dokumen', () => {
    expect(getVisibleOperationsNav('ADMIN').map(n => n.id)).toEqual(['DASHBOARD', 'PENGAJUAN', 'DOKUMEN']);
    expect(getVisibleOperationsNav('AYU').map(n => n.id)).toEqual(['DASHBOARD', 'PENGAJUAN', 'DOKUMEN']);
    expect(getVisibleOperationsNav('BOD_HERY').map(n => n.id)).toEqual(['DASHBOARD', 'PENGAJUAN', 'DOKUMEN']);
    expect(getVisibleOperationsNav('BOD_HASHIMOTO').map(n => n.id)).toEqual(['DASHBOARD', 'PENGAJUAN', 'DOKUMEN']);
  });

  it('KEUANGAN sees Pengajuan and Dokumen', () => {
    const nav = getVisibleOperationsNav('KEUANGAN');
    expect(nav.map(n => n.id)).toEqual(['PENGAJUAN', 'DOKUMEN']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/workspace.test.ts`
Expected: FAIL with `getVisibleOperationsNav is not defined` or assertion failure.

- [ ] **Step 3: Implement `getVisibleOperationsNav` and update App Shell in `src/main.tsx`**

- Export `getVisibleOperationsNav(role: UserRole)`.
- Restructure navigation sidebar:
  - Group `OPERATIONS`: items `Dashboard`, `Pengajuan`, `Dokumen` filtered by role.
  - Group `AUDIT & INTEGRASI`: `Approval Register`, `Approval History`, `Approval Docs`.
- Restructure Topbar:
  - Clean brand mark + system title `BLC Procurement`.
  - Pill search bar with shortcut chip.
  - Official branch dropdown (`Bekasi`, `Cibinong`, `Medan`, `Surabaya`, `Pekanbaru`, `Makassar`, `Samarinda`, `Semua Cabang`).
  - Active user profile pill with role switcher trigger.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/workspace.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main.tsx src/workspace.test.ts
git commit -m "feat(shell): implement role-based Operations navigation and Elera topbar"
```

---

### Task 3: Telemetry Stats Strip (`src/components/BentoMetrics.tsx`)

**Files:**
- Modify: `src/components/BentoMetrics.tsx`
- Modify: `src/components/BentoMetrics.test.tsx`

**Interfaces:**
- Consumes: `BentoMetricsProps` (`documents: AnyDocument[]`, `onSelectFilter?: (type: DocType | 'ALL') => void`, `className?: string`).
- Produces: Connected horizontal `stats-strip` with icon chips, tabular currency numbers, and status indicators.

- [ ] **Step 1: Update tests in `src/components/BentoMetrics.test.tsx`**

Verify that `BentoMetrics` renders the `.stats-strip` container, contains 4 metric blocks (Total Pengadaan, Menunggu Otorisasi, Verifikasi Keuangan, Realisasi Uang Muka), and applies `tabular-nums` formatting to nominal amounts.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/BentoMetrics.test.tsx`
Expected: FAIL due to expected layout differences.

- [ ] **Step 3: Implement Elera `stats-strip` in `src/components/BentoMetrics.tsx`**

- Structure layout into an outer `.stats-strip` card container (`bg-white rounded-2xl border border-[#EDEDEB] shadow-sm`).
- Implement 4 interconnected metric blocks with vertical dividers (`border-r border-[#EDEDEB]`):
  1. **Total Pengadaan**: Total nominal of all active PR/PO/AV/RB in current period with `.s-icon-chip` and `tabular-nums`.
  2. **Menunggu Otorisasi**: Count of documents in `IN_REVIEW` awaiting Atasan / GM / BoD.
  3. **Verifikasi Keuangan**: Count and nominal of documents awaiting Payment Voucher (PV) or settlement.
  4. **Realisasi Uang Muka**: AV settlement completion indicator.
- Support click interactions to filter document lists when `onSelectFilter` is passed.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/BentoMetrics.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/BentoMetrics.tsx src/components/BentoMetrics.test.tsx
git commit -m "feat(ui): upgrade BentoMetrics to Elera connected stats-strip"
```

---

### Task 4: High-Density Register & Segmented Tabs (`src/components/DocumentList.tsx`)

**Files:**
- Modify: `src/components/DocumentList.tsx`
- Test: `src/components/DocumentList.test.tsx` (create or update)

**Interfaces:**
- Consumes: `documents: AnyDocument[]`, `userRole: UserRole`, `onSelectDocument: (doc: AnyDocument) => void`, `onNewDocument: (type: DocType) => void`.
- Produces: Modernized register view with Elera segmented tabs (`s-tabs`), status badge pills (`s-badge`), and tabular rows.

- [ ] **Step 1: Write unit test in `src/components/DocumentList.test.tsx`**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentList } from './DocumentList';
import { mockDocuments } from '../store/seed-data';

describe('DocumentList Elera Styling', () => {
  it('renders segmented filter tabs with s-tabs container', () => {
    render(<DocumentList documents={mockDocuments} userRole="ADMIN" onSelectDocument={vi.fn()} onNewDocument={vi.fn()} />);
    expect(screen.getByTestId('document-tabs')).toHaveClass('s-tabs');
  });

  it('renders tabular numbers for currency cells', () => {
    render(<DocumentList documents={mockDocuments} userRole="ADMIN" onSelectDocument={vi.fn()} onNewDocument={vi.fn()} />);
    const amounts = screen.getAllByTestId('doc-amount');
    expect(amounts[0]).toHaveClass('tabular-nums');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/DocumentList.test.tsx`
Expected: FAIL (missing `s-tabs` class or data-testid).

- [ ] **Step 3: Implement segmented tabs and high-density table in `src/components/DocumentList.tsx`**

- Wrap document type switcher in `.s-tabs` (`bg-[#E9E8E6] rounded-xl p-1 inline-flex`).
- Render count pills `.s-count` inside each tab.
- Standardize table:
  - Header: uppercase `text-[11px] font-semibold text-[#8A8F89] bg-[#FAFAF9] border-b border-[#EDEDEB]`.
  - Body row: `hover:bg-[#FBFBFA] border-b border-[#F2F1ED] transition-colors`.
  - Currency column: `tabular-nums font-semibold text-[#191C1A]`.
  - Status pill: `.s-badge` (green/amber/red/blue).
  - Action button: `.s-action-caready` or `.s-action` with label "Tinjau".

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/DocumentList.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/DocumentList.tsx src/components/DocumentList.test.tsx
git commit -m "feat(ui): implement Elera segmented tabs and high-density table in DocumentList"
```

---

### Task 5: Slide-Over Inspection Drawer (`src/components/DocumentDetailModal.tsx`)

**Files:**
- Modify: `src/components/DocumentDetailModal.tsx`
- Modify: `src/components/ApprovalProgress.test.tsx`

**Interfaces:**
- Consumes: `document: AnyDocument | null`, `isOpen: boolean`, `onClose: () => void`, `userRole: UserRole`, `onApprove: (...) => void`, `onReject: (...) => void`.
- Produces: Slide-over drawer component (`.s-drawer`) docking to the right side of viewport with smooth transition and backdrop.

- [ ] **Step 1: Write test for slide-over drawer behavior in `src/components/DocumentDetailModal.test.tsx`**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentDetailModal } from './DocumentDetailModal';
import { mockDocuments } from '../store/seed-data';

describe('DocumentDetailModal Slide-Over Drawer', () => {
  it('renders drawer container with right-side slide class when open', () => {
    render(<DocumentDetailModal document={mockDocuments[0]} isOpen={true} onClose={vi.fn()} userRole="ADMIN" />);
    const drawer = screen.getByRole('dialog');
    expect(drawer).toHaveClass('s-drawer');
  });

  it('calls onClose when backdrop or close button is clicked', () => {
    const handleClose = vi.fn();
    render(<DocumentDetailModal document={mockDocuments[0]} isOpen={true} onClose={handleClose} userRole="ADMIN" />);
    fireEvent.click(screen.getByLabelText(/tutup/i));
    expect(handleClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/DocumentDetailModal.test.tsx`
Expected: FAIL (missing `.s-drawer` class).

- [ ] **Step 3: Implement slide-over drawer in `src/components/DocumentDetailModal.tsx`**

- Replace centered modal overlay with:
  - Backdrop: `fixed inset-0 bg-black/25 backdrop-blur-[2px] z-50 transition-opacity`.
  - Drawer Panel: `fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col border-l border-[#EDEDEB] s-drawer animate-in slide-in-from-right duration-200`.
- Drawer Header: Document number, badge status, branch chip, and close button (`s-more`).
- Drawer Body:
  - Stepper Persetujuan (`ApprovalStepper`).
  - Metadata & Items Table with tabular sums.
  - Audit Log Timeline.
- Drawer Footer: Action buttons (`s-action` for Tolak/Revisi, `s-action-caready` for Setujui / Bayar).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/DocumentDetailModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/DocumentDetailModal.tsx src/components/DocumentDetailModal.test.tsx
git commit -m "feat(ui): transform DocumentDetailModal into Elera slide-over inspection drawer"
```

---

### Task 6: Staff Beranda & Pengajuan Hub (`src/components/StaffBeranda.tsx`)

**Files:**
- Modify: `src/components/StaffBeranda.tsx`
- Test: Vitest component test

**Interfaces:**
- Consumes: `documents: AnyDocument[]`, `onNewDocument: (type: DocType) => void`, `onSelectDocument: (doc: AnyDocument) => void`.
- Produces: Modernized Staff Beranda with quick action creation grid and "Daftar Pengajuan Saya" tracking table.

- [ ] **Step 1: Run existing test suite to establish baseline**

Run: `npx vitest run`
Expected: 41+ tests passing.

- [ ] **Step 2: Refactor `src/components/StaffBeranda.tsx` with Elera squircle cards and micro-actions**

- Redesign creation tiles:
  - Grid of squircle cards (`rounded-2xl border border-[#EDEDEB] bg-white p-5 hover:border-[#191C1A] transition-all`).
  - Micro icon chip `.s-icon-chip` for PR, PO, GR, AV, RB, RC.
  - Direct CTA button `.s-action-caready` to launch draft form.
- Redesign "Daftar Pengajuan Saya":
  - High-density list with status pills (`.s-badge`), relative time, and quick view button.

- [ ] **Step 3: Run full Vitest suite to verify no regressions**

Run: `npx vitest run`
Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/StaffBeranda.tsx
git commit -m "feat(ui): modernize StaffBeranda with Elera action cards and submission tracking"
```

---

### Task 7: Comprehensive Verification & Graph Update

**Files:**
- Test all components across workspace.
- Update `graphify-out/graph.json` per `AGENTS.md`.

- [ ] **Step 1: Run entire test suite**

Run: `npm test`
Expected: All tests pass (0 failures).

- [ ] **Step 2: Run production TypeScript compile and Vite build**

Run: `npx tsc --noEmit && npx vite build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 3: Update knowledge graph**

Run: `graphify update . --force`
Expected: Knowledge graph regenerated cleanly.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: complete UI/UX overhaul verification and update knowledge graph"
```

# BLC Procurement UI De-Bloat & Performance Overhaul Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all non-functional UI ornaments, redundant explanatory copy, dead controls, and unnecessary React re-renders/inline style allocations across the prototype so the interface is fast, scannable, and 100% functional.

**Architecture:**
1. **Zero-Ornament Principle:** Every DOM node must either display live dynamic data or trigger a real user action. Static SOP explanations, duplicate headers, fake percentages, decorative SVGs, and dead buttons/checkboxes are deleted.
2. **Compact Control Architecture:** Compress multi-line role simulator cards and modal headers into single-row functional controls so the transaction table and KPI metrics occupy primary viewport space above the fold.
3. **Render & CSS Performance:** Replace inline `style={{ ... }}` object allocations in hot loops (`DocumentList`, `BentoMetrics`, `Sidebar`) with reusable CSS classes in `src/style.css`, memoize derived metrics (`useMemo`), and keep zero background timers (`setInterval`).

**Tech Stack:** React 19, TypeScript, Vite, CSS Custom Properties (`src/style.css`), Vitest.

---

## Audit of Remaining Bloat & Performance Bottlenecks

| Area / File | Bloat / Non-Functional Element | Impact | Action |
|---|---|---|---|
| `src/main.tsx` & `src/components/BentoMetrics.tsx` | Completed in Phase 0: 1s `setInterval` clock, dead `<Bell />` icon, topbar breadcrumb explanation, page-heading paragraph, fake `+12.8%` badge, decorative 64x64 SVG, 3 static SOP boxes, and chart/timeline subtitles. | Triggered full-app re-render every 1s & wasted ~260px vertical space. | **Done (Phase 0)** |
| `src/components/RoleSwitcher.tsx` | Massive 6-card grid where each button has a badge (`Tahap 2`), title (`Bu Ayu (Verifikator)`), and paragraph description (`Review anggaran & kelayakan administrasi keuangan`), plus a 2-line header (`Simulator Peran Pengguna` + subtitle). | Consumes ~180px of prime vertical viewport at the very top of the page for a simple role toggle. | **Task 1:** Convert into a single-row segmented pill bar (`Peran Aktif: [Pemohon] [Atasan] [Bu Ayu] [Pak Hery] [Hashimoto] [Keuangan]`). |
| `src/main.tsx` (Sidebar & Action Bar) | Sidebar bottom profile box (`linear-gradient` card) duplicates the active role already shown in `RoleSwitcher`. Duplicate `Ekspor Laporan` button exists in both `page-heading` and `DocumentList`. Duplicate `+ Buat PR` button exists in both `page-heading` and `BentoMetrics` Card 1. | Redundant controls and visual noise in 3 places. | **Task 2:** Remove duplicate sidebar profile box, remove duplicate `+ PR Baru` in `BentoMetrics`, and keep a single `Ekspor` button in `DocumentList`. |
| `src/components/forms/Form*.tsx` (6 files) | Every modal has `.drawer-head` (`PURCHASE REQUEST` + `Formulir Draf PR`) AND immediately repeats `.form-intro` (`<span>PR</span>` + `Informasi Permintaan Pembelian` + `<p>Formulir inisiasi...</p>`). Also `FormPR.tsx` contains raw LaTeX text `$\ge$`. | Wastes 90px inside every modal popup and repeats the modal title 3 times. | **Task 3:** Delete `.form-intro` across all 6 forms (`FormPR`, `FormPO`, `FormAV`, `FormRB`, `FormRC`, `FormPVPayment`), simplify `.drawer-head` to a single clean title, and fix `$\ge$` to `≥`. |
| `src/components/ExportModal.tsx` | Contains a non-functional checkbox (`includeAll`: `"Sertakan seluruh cabang & riwayat log persetujuan BoD"`) whose state is never read in `handleDownload()`, plus verbose marketing-style subtitles (`NEXGEN DATA EXPORT ENGINE`, long radio descriptions). | Misleads user with a dead checkbox and bloated modal height. | **Task 4:** Remove dead `includeAll` checkbox and state, strip `NEXGEN DATA EXPORT ENGINE` eyebrow and verbose radio subtexts. |
| `src/components/DocumentDetailModal.tsx` & `ApprovalStepper.tsx` | Verbose subtitles (`{docType} SPECIFICATION`, `Progres Persetujuan Berjenjang`, `Wajib keduanya menyetujui`, `Penilai: ...`, `Verifikasi Keuangan & Kelayakan`). | Clutters the approval review modal with static boilerplate text. | **Task 5:** Streamline `ApprovalStepper` and `DocumentDetailModal` to show only stage name, actor, status badge, timestamp, and comment. |
| `src/components/BentoMetrics.tsx` & `src/components/DocumentList.tsx` | Heavy inline `style={{ ... }}` object creation on every table row and chart bar + unmemoized metric aggregations in `BentoMetrics`. | Allocates ratusan objek JS baru setiap render dan memperlambat DOM reconciliation. | **Task 6:** Wrap `BentoMetrics` calculations in `useMemo` and move repeated inline styles to `src/style.css` classes. |

---

## Task-by-Task Implementation Plan

### Task 1: Compress `RoleSwitcher` into a Single-Row Segmented Pill Bar

**Files:**
- Modify: `src/components/RoleSwitcher.tsx`
- Modify: `src/style.css`

- [ ] **Step 1: Replace multi-line card grid in `src/components/RoleSwitcher.tsx` with a compact horizontal segmented bar**
  - Remove `description` paragraph and multi-line header.
  - Render a single flex row: label `Peran:` followed by compact pill buttons (`Pemohon`, `Atasan (Tahap 1)`, `Bu Ayu (Tahap 2)`, `Pak Hery (BoD)`, `Hashimoto (BoD)`, `Keuangan`).
- [ ] **Step 2: Update `.role-simulator-card` and `.role-chip` in `src/style.css`**
  - Reduce padding to `10px 16px`, single-row layout (`display: flex; align-items: center; justify-content: space-between; gap: 12px;`).
- [ ] **Step 3: Verify build & tests**
  - Run: `npm test && npm run build`

---

### Task 2: Deduplicate Controls in `src/main.tsx` & `src/components/BentoMetrics.tsx`

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/components/BentoMetrics.tsx`

- [ ] **Step 1: Remove redundant bottom user profile card from `aside.sidebar` in `src/main.tsx`**
  - The active role is already prominently displayed and interactive in `RoleSwitcher`.
- [ ] **Step 2: Consolidate action buttons**
  - Remove duplicate `Ekspor Laporan` button from `page-heading` in `src/main.tsx` (keep the single `Ekspor` button inside `DocumentList` toolbar next to search).
  - Remove duplicate `+ PR Baru` button inside `BentoMetrics.tsx` Card 1 (keep creation buttons in `page-heading`).
  - Remove `.eyebrow` (`PROCUREMENT PRO`) subtitle in sidebar brand if redundant.
- [ ] **Step 3: Verify build & tests**
  - Run: `npm test && npm run build`

---

### Task 3: Strip Redundant `.form-intro` Headers Across All 6 Modal Forms

**Files:**
- Modify: `src/components/forms/FormPR.tsx`
- Modify: `src/components/forms/FormPO.tsx`
- Modify: `src/components/forms/FormAV.tsx`
- Modify: `src/components/forms/FormRB.tsx`
- Modify: `src/components/forms/FormRC.tsx`
- Modify: `src/components/forms/FormPVPayment.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Remove `<div className="form-intro">...</div>` from all 6 form components**
  - Each modal already has `.drawer-head` with the form title.
- [ ] **Step 2: Remove `.eyebrow` (`PURCHASE REQUEST`, `PURCHASE ORDER`, etc.) from `.drawer-head` in `src/main.tsx`**
  - Keep only the clean `<h2>` title and close button `X`.
- [ ] **Step 3: Fix raw LaTeX `$\ge$` in `FormPR.tsx` and shorten verbose callout text**
  - Replace `$\ge$ Rp 5.000.000` with `≥ Rp 5.000.000 (Wajib lampirkan Memo IAM)`.
- [ ] **Step 4: Verify build & tests**
  - Run: `npm test && npm run build`

---

### Task 4: Remove Dead Checkbox & Verbose Copy in `ExportModal.tsx`

**Files:**
- Modify: `src/components/ExportModal.tsx`

- [ ] **Step 1: Remove unused `includeAll` state and its non-functional checkbox UI**
- [ ] **Step 2: Remove `NEXGEN DATA EXPORT ENGINE` eyebrow, introductory paragraph, and verbose `<small>` descriptions inside radio options**
  - Keep clean format options: `PDF (.pdf)`, `CSV (.csv)`, `Excel (.xlsx)` and the Download/Cancel actions.
- [ ] **Step 3: Verify build & tests**
  - Run: `npm test && npm run build`

---

### Task 5: Streamline `DocumentDetailModal.tsx` & `ApprovalStepper.tsx`

**Files:**
- Modify: `src/components/DocumentDetailModal.tsx`
- Modify: `src/components/ApprovalStepper.tsx`

- [ ] **Step 1: Remove `{document.docType} SPECIFICATION` eyebrow in `DocumentDetailModal.tsx`**
- [ ] **Step 2: Remove static boilerplate descriptions in `ApprovalStepper.tsx`**
  - Remove `Penilai: Atasan Langsung`, `Verifikasi Keuangan & Kelayakan`, and `Wajib keduanya menyetujui` hints so only actual stage status, timestamps, and reviewer comments appear.
- [ ] **Step 3: Verify build & tests**
  - Run: `npm test && npm run build`

---

### Task 6: Memoize Aggregations & Extract Hot-Path Inline Styles to CSS

**Files:**
- Modify: `src/components/BentoMetrics.tsx`
- Modify: `src/components/DocumentList.tsx`
- Modify: `src/style.css`

- [ ] **Step 1: Wrap `BentoMetrics` calculations (`totalVolume`, `pendingForRole`, `moduleStats`, `recentLogs`) in `useMemo([documents, activeRole])`**
- [ ] **Step 2: Extract repeated table cell, badge, and bar-chart inline styles into `src/style.css` classes**
- [ ] **Step 3: Run full verification suite & update Graphify**
  - Run: `npm test`
  - Run: `npm run build`
  - Run: `graphify update .`

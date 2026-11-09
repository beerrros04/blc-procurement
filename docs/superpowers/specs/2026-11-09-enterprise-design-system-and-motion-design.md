# Design Document: BLC Caready Procurement Pro — Enterprise Design System & Interactive Motion

- **Date:** 2026-11-09
- **Author:** Antigravity Engineering & Design System Team
- **Status:** Proposed (Approved in Concept by Partner)
- **Target File Path:** `docs/superpowers/specs/2026-11-09-enterprise-design-system-and-motion-design.md`

---

## 1. Intent & The Why

### 1.1 Context & Background
The BLC Caready Procurement Pro application is a mission-critical financial authorization and procurement management portal. While previous iterations established functional workflows and fixed isolated UI bugs (such as approval stepper connector alignments and approver name mapping), the overall visual identity, interactive depth, and design consistency across screens require elevation to meet enterprise-grade standards (`Operate` surface mode).

The user has provided a comprehensive enterprise design system specification (`blc_caready_procurement_pro_design_system.md`) and requested applying it with modern styling (Tailwind CSS v4) and choreographed interactive motion (Framer Motion) without altering existing page routing, approval workflows, or data models.

### 1.2 Core Objective
Establish a single source of truth for design tokens, elevate the UI to a high-density, crisp enterprise visual language, and introduce purposeful, delightful micro-interactions and transitions using Framer Motion while maintaining 100% backward compatibility with existing tests and business logic.

---

## 2. Goals, Non-Goals & Anti-Goals

### 2.1 Goals
1. **Design System Token Alignment:** Centralize and apply the primitive palettes, semantic color tokens (Crimson `#DC2626`, warm slate `#F4F3EF`, semantic border `#E4E2DD`, AA contrast text), and typography scales with `tabular-nums` support.
2. **Interactive Motion System:** Implement the Corporate motion archetype (`cubic-bezier(0.2, 0, 0, 1)`) via a reusable motion library using `framer-motion`:
   - Interactive hover and tap feedback on cards and buttons.
   - Smooth layout transitions for tabs, segmented stage controls, and sidebar toggling.
   - Elegant entrance/exit animations with backdrop blur for modals and drawers (`AnimatePresence`).
   - Accessible motion honoring `prefers-reduced-motion`.
3. **Component Standardization:**
   - **Buttons:** 6 variants (`primary`, `secondary`, `outlined`, `ghost`, `icon`, `destructive`), 3 heights (`32px`, `36px`, `44px`), and robust loading/disabled states.
   - **Badges & Chips:** Strict separation between `<StatusBadge />` (passive pill with semantic icons), `<FilterChip />` (interactive toggle pill `32px`), `<CategoryChip />`, and `<CounterBadge />`.
   - **Approval Stepper:** Maintain resilient centered connectors, distinguish Current/Waiting (blue/amber) from Rejected (crimson), and present a dedicated vertical divider for payment settlement.
   - **DataTable & Filters:** Numeric column right-alignment, tabular digit alignment, standardized filter controls (`36px`), and sticky actions.
   - **Export Report Modal:** Standardize to 480px width, interactive radio cards for XLSX and PDF formats, export scope summary card, and clear action footer.
4. **Preserve Business Logic & Automated Tests:** Maintain all existing business logic, approval rules, calculation engines, and ensure all 107 existing automated tests pass.

### 2.2 Non-Goals
1. Redesigning or rewriting existing backend API endpoints or SQLite schemas.
2. Changing the core business workflow stages (Pemohon -> Atasan -> GM Ayu -> BoD -> Keuangan).
3. Introducing third-party UI component libraries (such as Radix UI, Headless UI, or Shadcn) that would bloat dependencies or break DOM assertions.

### 2.3 Anti-Goals
1. **No Jarring or Gimmicky Motion:** Avoid video-game-like bouncy overshoots, slow page-blocking transitions, or staggered row-by-row animations in tables that hinder fast data scanning.
2. **No Color Ambiguity:** Never use the primary red brand color for neutral status indicators, waiting badges, or entire data series in charts, which would confuse users into perceiving errors.
3. **No Layout Shift:** Button loading states must not alter button dimensions or shift surrounding controls.

---

## 3. Constraints

1. **Stack Compatibility:** React 19, Vite 6, TypeScript 5.8, Tailwind CSS v4, Framer Motion v14, Lucide React.
2. **Test Suite Integrity:** The repository currently has 16 test files with 107 passing vitest tests. All existing test queries and data-labels (e.g. `td[data-label="Persetujuan"]`, `tr[data-doc-id]`, etc.) must remain intact.
3. **Performance & Bundle:** Zero new external runtime dependencies; leverage existing `framer-motion` and `@tailwindcss/vite`.
4. **Accessibility:** Comply with WCAG 2.2 AA standards (contrast >= 4.5:1 for normal text, >= 3.0:1 for non-text UI controls, keyboard focus ring `2px solid #2563EB`, and `prefers-reduced-motion` suppression).

---

## 4. Approaches Considered & Selected

### Option 1: Tailwind v4 Tokens + Framer Motion Corporate Motion Choreography (Selected)
- **Styling:** Map tokens from Section 9.1 (`--palette-primary-*`, `--color-*`, `--space-*`, `--radius-*`, `--elevation-*`) directly into `src/style.css` (or linked CSS token files), leveraging Tailwind v4's native `@theme` directives and CSS Custom Properties.
- **Motion:** Create a centralized motion helper (`src/lib/motion.ts`) specifying Corporate curves (`cubic-bezier(0.2, 0, 0, 1)`), standardized variants for modals/drawers (`entranceModal`, `slideDrawer`), and micro-interactions (`pressable`, `hoverableCard`). Wrap interactive components with `motion.*` and `AnimatePresence`.
- **Trade-offs:** Zero new dependencies, optimal bundle size, instant visual upgrades, clean separation of concerns, and full test compatibility.
- **Verdict:** Selected and approved by partner.

### Option 2: Radix UI / Headless UI Migration
- **Trade-offs:** Incurs significant rewrite of existing modal dialogs and dropdowns, risks breaking existing tests asserting specific DOM structures, and adds unnecessary package overhead.
- **Verdict:** Dropped.

### Option 3: CSS-Only Animations (No Framer Motion)
- **Trade-offs:** Lacks layout animation capabilities (`layoutId` for tabs), clumsy conditional exit animations for modals/drawers, and significantly less interactive tactile feedback.
- **Verdict:** Dropped.

---

## 5. Architectural Specifications & Component How-To

### 5.1 Design Tokens Architecture (`src/style.css`)
- **Primitive & Semantic Color Tokens:**
  - Primary Brand Red: `--color-primary: #DC2626`, hover `#B91C1C`, pressed `#991B1B`, subtle `#FEF2F2`.
  - Neutral Warm Slate: Canvas `--color-background: #F4F3EF`, surfaces `#FFFFFF`, container `#F8F7F4`, subtle borders `#E4E2DD`, strong borders `#9CA3AF`.
  - Semantic Status: Success (`#065F46` / `#ECFDF5`), Warning (`#92400E` / `#FFFBEB`), Error (`#9F1239` / `#FFF1F2`), Info (`#1E40AF` / `#EFF6FF`).
- **Typography & Tabular Rigor:**
  - Base font family: `Inter`, system sans-serif.
  - Tabular digits: `font-variant-numeric: tabular-nums` applied globally to currency displays, numeric codes, counters, and table columns.
- **Elevation Hierarchy:**
  - Border-first approach (`border: 1px solid var(--color-border)`).
  - Subtle layered elevation shadows: Level 0 (flat), Level 1 (standard card), Level 2 (interactive hover), Level 3 (dropdown/popover), Level 4 (modal overlay).

### 5.2 Motion Architecture (`src/lib/motion.ts`)
- **Corporate Easing Curves:**
  ```typescript
  export const corporateTransition = {
    ease: [0.2, 0, 0, 1] as const,
    duration: 0.25,
  };
  export const modalEnterTransition = {
    ease: [0.05, 0.7, 0.1, 1] as const,
    duration: 0.32,
  };
  export const modalExitTransition = {
    ease: [0.3, 0, 1, 1] as const,
    duration: 0.2,
  };
  ```
- **Micro-interactions:**
  - Button press: `whileTap={{ scale: 0.98 }}`.
  - Quick Action cards: `whileHover={{ y: -2, transition: { duration: 0.15 } }}`.
  - Tab & Filter indicators: Framer Motion `layoutId="active-indicator"` for smooth horizontal sliding under/over active options.
  - Modals & Drawers: Wrapped in `<AnimatePresence>` for smooth entry and exit transitions with blurred backdrops (`backdrop-filter: blur(4px)`).

### 5.3 Component Upgrades
1. **`<AppSidebar />` & `<TopBar />` (`src/main.tsx`):**
   - Active navigation item with 3px crimson bar, `#FEF2F2` background, smooth toggle transition between 240px and 64px, and offcanvas drawer for mobile screens (`< 768px`).
2. **`<DocumentList />` & `<ApprovalExplorer />`:**
   - Table columns with right-aligned currency cells (`text-align: right`, `tabular-nums`).
   - Standardized control bar (`36px` heights for search and filter inputs).
   - Local scroll container with sticky action column for compact viewports.
3. **`<StatusBadge />` & `<FilterChip />`:**
   - Distinct component styling: `<StatusBadge />` as passive pill with 10 semantic states and icons, and `<FilterChip />` as 32px interactive toggle buttons.
4. **`<ApprovalStepper />` & `<ProgressIndicator />`:**
   - Clean, centered flex connectors, correct semantic coloring (blue/amber for in-progress, green for approved, red for rejected), separated payment node with vertical divider.
5. **`<ExportModal />` (`src/components/ExportModal.tsx`):**
   - 480px width, interactive radio cards for XLSX (green accent) and PDF (red accent), info summary card displaying selected documents and active filters, and animated dialog transitions.
6. **`<BentoMetrics />`:**
   - Standardized metric cards with baseline-aligned values, tabular numbers, and clean semantic status pills.

---

## 6. What's Left to the Builder
- Precise refactoring breakdown into safe, incremental, test-backed phases.
- Exact helper utilities for Framer Motion (`src/lib/motion.ts`) that cleanly degrade when `prefers-reduced-motion` is active.
- Styling consolidation in `src/style.css` without breaking existing CSS class names.
- Verification across 320px, 375px, 768px, 1024px, and desktop viewports.

---

## 7. Builder Review Resolutions & Technical Decisions

Following the architectural builder check, all five key technical questions have been resolved with strict fidelity to test contracts and zero-dependency constraints:

1. **Token Coexistence & Brand Identity:**
   - The official BLC brand color (`#DC2626` / `#E51937`) and canvas variables (`--canvas-bg: #f6f5f3`, `--border-clean: #ededeb`, `--accent-caready: #e51937`) are preserved via bidirectional CSS aliases in `src/style.css`.
   - The full token scale from Section 9.1 of the design system (neutral warm slate `--palette-neutral-*`, semantic status palettes, 4px spacing, elevation levels, and typography tokens) is integrated into `src/style.css`. All existing assertions in `src/style.test.ts` pass without regression.
2. **Export Modal Format & Zero Dependencies:**
   - To respect Constraint 3 (zero new runtime dependencies) and Non-Goal 1 (no backend modifications), the spreadsheet export uses client-side Excel-compatible CSV (formatted with UTF-8 BOM `\uFEFF` and tabular columns). In the UI, it is presented as a green-accented *Excel Spreadsheet / CSV (.csv)* radio card and a red-accented *PDF Document (.pdf)* card.
3. **Approval Stepper Payment Settlement Node:**
   - In `src/components/ApprovalProgress.tsx` (the compact inline table stepper), the 3 approval stages (`Atasan`, `Ayu`, `BoD`) are followed by a dedicated vertical separator divider (`1px solid #E4E2DD`, `height: 16px`, `margin: 0 8px`) and a distinct final payment settlement indicator node (emerald for `PAID`, amber for `APPROVED` awaiting disbursement, neutral for earlier stages).
   - In `DocumentDetailModal.tsx`, reviewer nodes strictly preserve their existing `.step-badge` DOM structure to honor test contracts in `DocumentDetailModal.test.tsx`.
4. **Status Badges vs Reviewer Step Badges:**
   - Document-level status pills in tables and headers utilize `<StatusBadge />` with semantic Lucide icons (`CheckCircle2`, `Clock`, `Eye`, `XCircle`, `RotateCcw`, `CreditCard`).
   - Modal timeline step badges remain as styled `.step-badge` pill variants (`.status-waiting`, `.status-pending`, `.status-approved`, `.status-rejected`), ensuring 100% test contract preservation.
5. **Export Scope Summary Data Flow:**
   - The scope summary card in `<ExportModal />` computes metrics directly from the passed `documents` array (total count, currency subtotal, date range) in a self-contained manner, avoiding unnecessary state lifting into `src/main.tsx`.


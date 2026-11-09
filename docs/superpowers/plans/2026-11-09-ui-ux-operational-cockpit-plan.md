# UI/UX Operational Cockpit & Anti-Slop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the BLC Procurement interface from a generic, template-cloned SaaS landing shell (Spike Pro / Bento Grid / fake testimonials) into a high-density, accessible, and honest operational procurement cockpit built on the official BLC Design System (`design.md`).

**Architecture:** 
1. **Operational Cockpit Architecture:** Replace decorative bento boxes and ungrounded aggregations with a role-based Action Queue Bar that surfaces actionable pending approvals, outstanding cash advances (AV), and revision requests directly linked to table filters.
2. **Official Design Token Enforcement:** Purge external template styling (Spike Next.js Pro, Google Sans `@import`, 7-color module rainbow) and standardize on Lato typography, BLC Corporate Red (`#E51937`) brand accent, ISO functional status badges, and 8px-12px radii.
3. **Ergonomic Data Grid & Accessibility:** Fix horizontal overflow at standard enterprise desktop resolutions (956px - 1366px) using sticky action columns, resolve WCAG AA contrast failures (≥ 4.5:1), and make every interactive element keyboard-operable with clear focus states.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Vite, Vitest.

**Spec:** `anti-slop/audit-001-2026-11-09.md`, `design.md`, `PRD.md`.

## Global Constraints

- Never use em dash character (`—`) in UI copy (R-02); use comma, colon, period, or parentheses.
- Maximum active palette: 2-3 core neutral colors + 1 primary accent (`#E51937`) (R-29).
- Status semantic colors must be distinct: Approved (Green `#10B981`), Paid (Blue `#2563EB`), Pending/In Review (Amber `#F59E0B`), Rejected (Red `#EF4444`). Brand red must never be used for pending/review status (R-01, R-09).
- All interactive controls must be native `<button>` or `<a href>` with `cursor: pointer` and visible keyboard focus ring (R-32, R-39).
- All text must meet WCAG AA contrast ratio ≥ 4.5:1 (R-25).
- Zero non-functional demo artifacts or fake testimonials allowed in production code (R-18, R-26, R-38).

## Review Focus

1. **Double-counting bug in metric calculations:** Ensure PR, PO, and PV amounts are never summed together into a single "total procurement value".
2. **Table overflow on 1366px laptops:** Verify that the rightmost action buttons (Detail, Edit, Submit) remain permanently visible and sticky during horizontal scroll.
3. **Form input contrast and focus visibility:** Verify that text inputs in both light background and modal drawers have high-contrast borders and sharp focus rings without blur layers.
4. **Distinction between Approved vs Paid:** Verify that users immediately see whether a document is merely approved versus actually disbursed/paid by Finance.
5. **Keyboard trap and Tab order:** Verify that dialogs and action queue bars can be navigated purely via Tab, Enter, Space, and Escape.

---

### Task 1: Purge AI Slop and Fictional Assets from Sign-In & UI Utilities

**Files:**
- Modify: `src/components/ui/sign-in.tsx`
- Modify: `src/components/ui/sign-in-demo.tsx`
- Delete / Clean: `src/components/ui/demo.tsx`
- Delete / Clean: `src/components/ui/progress-indicator.tsx`

**Interfaces:**
- Consumes: Corporate credentials and demo account list from `src/main.tsx`.
- Produces: Clean, accessible enterprise login form without testimonials or mock Google SSO.

- [ ] **Step 1: Remove `TestimonialCard` and `sampleTestimonials` from `src/components/ui/sign-in.tsx` & `sign-in-demo.tsx`**
  - Delete `TestimonialCard` component and `testimonials` render loop.
  - Replace the right/bottom hero area with clean BLC Corporate branding, emblem logo, and official portal description.
- [ ] **Step 2: Remove mock Google SSO button and `GlassInputWrapper`**
  - Delete `GoogleIcon` and "Continue with Google" button.
  - Replace `GlassInputWrapper` (`backdrop-blur-sm`, `bg-slate-50/70`) with clean semantic input wrapper (`bg-white`, `border-slate-300`, `rounded-lg`).
- [ ] **Step 3: Remove unused external demo files**
  - Remove or clean unused `src/components/ui/demo.tsx` and `src/components/ui/progress-indicator.tsx`.
- [ ] **Step 4: Verify build and test suite**
  - Run: `npm test && npm run build`
  - Expected: PASS with zero broken imports.

---

### Task 2: Standardize `src/style.css` on Official BLC Design Tokens & Purge Spike Pro Template

**Files:**
- Modify: `src/style.css`
- Modify: `index.html`

**Interfaces:**
- Consumes: Official Lato typography scale and BLC Corporate Red palette from `design.md`.
- Produces: CSS custom properties and utility classes complying with antislop rules.

- [ ] **Step 1: Replace Google Sans `@import` with Lato font specification**
  - Remove `@import url('https://fonts.googleapis.com/css2?family=Google+Sans...')` from `src/style.css`.
  - Add official Lato font links in `index.html` with proper `preconnect` and `display=swap`.
- [ ] **Step 2: Strip out "Spike Next.js Pro Architecture" variables and comments**
  - Remove `--spike-amber-subtle`, testimonial keyframe animations (`@keyframes testimonialIn`), and cascading delay classes (`animate-delay-100` to `1400`).
  - Standardize `--card-radius: 10px;` and `--button-radius: 8px;`.
- [ ] **Step 3: Fix contrast ratio on muted and secondary text**
  - Update `--text-secondary` from `#5A6A85` to `#374151` (Medium Gray from `design.md`).
  - Update `--text-muted` from `#7C8FAC` to `#4B5563` (WCAG AA compliant ≥ 4.5:1 against canvas `#F0F5F9`).
- [ ] **Step 4: Verify CSS build**
  - Run: `npm run build`
  - Expected: PASS without CSS syntax warnings.

---

### Task 3: Replace Bento Grid with Operational Action Queue Bar (`ActionQueueBar.tsx`)

**Files:**
- Create: `src/components/ActionQueueBar.tsx`
- Modify: `src/components/BentoMetrics.tsx` (or deprecate in favor of `ActionQueueBar.tsx`)
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `documents: AnyDocument[]`, `activeRole: UserRole`, `onSelectTab: (tab: DocType | 'ALL') => void`.
- Produces: Single high-density, role-filtered action strip showing exact pending tasks, outstanding AVs, and revisions.

- [ ] **Step 1: Create `src/components/ActionQueueBar.tsx` with honest procurement logic**
  - Card 1: **Tugas Menunggu Saya** (Filtered specifically by active role: Head, GM, BoD, Keuangan, or Staff revision).
  - Card 2: **Uang Muka (AV) Beredar** (Sum of paid AVs awaiting RC settlement and Finance confirmation; zero if none).
  - Card 3: **Draf & Perlu Revisi** (Draf pengajuan yang perlu diperbaiki atau disubmit).
  - Card 4: **Status Ringkasan Dokumen** (Tabular breakdown by module without combining them into a misleading single sum).
- [ ] **Step 2: Ensure all interactive filter cards use native semantic buttons with keyboard support**
  - Each counter card is a `<button type="button">` with visible focus ring.
- [ ] **Step 3: Wire `ActionQueueBar` into `src/main.tsx` in place of `BentoMetrics`**
  - Update `main.tsx` to render the clean `ActionQueueBar` above `DocumentList`.
- [ ] **Step 4: Run unit tests**
  - Run: `npm test`
  - Expected: PASS with updated test specs.

---

### Task 4: Fix Status Badge Semantics & Table Responsiveness in `DocumentList.tsx`

**Files:**
- Modify: `src/components/DocumentList.tsx`
- Modify: `src/components/ApprovalStepper.tsx`

**Interfaces:**
- Consumes: Document status and approval step states.
- Produces: Clear, unambiguous status badges and horizontal-scroll-resilient table layout.

- [ ] **Step 1: Fix status badge colors in `getStatusBadge`**
  - `SUBMITTED` / `IN_REVIEW`: Amber `#F59E0B` (`bg: '#FFFBEB'`, `border: '#FDE68A'`).
  - `APPROVED`: Emerald Green `#10B981` (`bg: '#ECFDF5'`, `border: '#A7F3D0'`).
  - `PAID`: Cobalt Blue `#2563EB` (`bg: '#EFF6FF'`, `border: '#BFDBFE'`) to clearly distinguish cash disbursement from paper approval.
  - `REJECTED`: Ruby Red `#EF4444` (`bg: '#FEF2F2'`, `border: '#FECACA'`).
  - `DRAFT`: Neutral Slate Gray `#4B5563` (`bg: '#F3F4F6'`, `border: '#E5E7EB'`).
- [ ] **Step 2: Implement sticky right-0 action column for tables**
  - Add `sticky right-0 bg-white z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]` to the `Aksi` column header and table cells.
  - Ensures action buttons (`Detail`, `Ubah`, `Ajukan`) remain immediately visible on 1366px screens without scrolling.
- [ ] **Step 3: Add explicit accessible labels to icon buttons**
  - Add `aria-label={`Lihat detail dokumen ${doc.docNumber}`}` on detail view buttons.
  - Ensure table rows have semantic zebra striping and high-contrast row borders.
- [ ] **Step 4: Verify in test suite**
  - Run: `npm test`
  - Expected: PASS.

---

### Task 5: Consolidate Module Accents and Clean Up `StaffBeranda.tsx`

**Files:**
- Modify: `src/components/StaffBeranda.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: User role and quick action options.
- Produces: Unified corporate card layout without 7-color rainbow clutter.

- [ ] **Step 1: Consolidate `quickActions` palette**
  - Replace rainbow accents (Purple, Cyan, Orange, Pink) with unified corporate treatment: neutral slate border with BLC Corporate Red active indicators.
  - Module codes (PR, PO, AV, RB, RC, PV) styled with crisp typographic labels.
- [ ] **Step 2: Streamline greeting and KPI summary**
  - Clean greeting header to display user branch, role, and immediate actionable pending tasks.
- [ ] **Step 3: Verify build & tests**
  - Run: `npm test && npm run build`
  - Expected: PASS.

---

### Task 6: End-to-End Verification & Verification Report

**Files:**
- Create: `anti-slop/verification-001-2026-11-09.md`

- [ ] **Step 1: Execute test suite and TypeScript validation**
  - Run: `npm test && npm run build`
- [ ] **Step 2: Inspect accessibility and contrast compliance**
  - Check text contrast across all updated screens.
  - Verify keyboard Tab order, Enter/Space activation, and Escape to close modal drawers.
- [ ] **Step 3: Publish follow-up report**
  - Document all resolved audit numbers (F-01 s/d F-20) in `anti-slop/verification-001-2026-11-09.md`.

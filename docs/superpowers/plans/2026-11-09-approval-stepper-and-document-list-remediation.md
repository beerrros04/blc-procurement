# Implementation Plan: UI/UX Remediation — Approval Stepper & Document List

**Plan Path:** `docs/superpowers/plans/2026-11-09-approval-stepper-and-document-list-remediation.md`  
**Date:** 2026-11-09  
**Status:** In Progress  

---

## 1. Context & Objectives

The user reported critical UI/UX defects with visual evidence:
1. **Broken Stepper Layout in Table Cell (`StaffBeranda > DocumentList > td:nth-of-type(5)`):**
   - Connector line stopped between dot 1 and 2, leaving dot 3 completely disconnected and floating in empty space.
   - Connector bar was an awkward 12px fat rectangle misaligned behind 20px dots.
   - Unresponsive to varying container and viewport widths.
2. **Inconsistent Status Badge in Modal (`DocumentDetailModal > ApprovalStepper > span "Menunggu Giliran"`):**
   - `.step-badge` was completely unstyled (rectangular, zero padding, mismatched typography).
   - Must match the corporate design system: rounded pill (`border-radius: 9999px`), proportional padding (`3px 10px`), 11px bold typography, and semantic color tokens (`status-waiting`, `status-pending`, `status-approved`, `status-rejected`).
3. **Data Integrity Fallback ("Nama belum tersedia?"):**
   - Stepper tooltip rendered `"Nama belum tersedia: Menunggu"`.
   - Root cause: `ApprovalProgress.tsx` and `ApprovalStepper.tsx` did not pass `document.stage1ApproverEmail` to `displayPersonName()`.
   - Furthermore, fallback for unassigned/undetermined approvers must be `"Belum ditentukan"`, not `"Nama belum tersedia"`.
   - Backend `ensureIntegrity()` must ensure all documents resolve `assignedTo` properly.

---

## 2. Architecture & Design Decisions

### A. Data Integrity (`src/domain/display-name.ts` & `ApprovalProgress.tsx`)
- Update `displayPersonName(raw?: string, approverEmail?: string, fallback = 'Belum ditentukan')`.
- If `approverEmail` or `raw` matches `KNOWN_EMAIL_NAMES` (e.g. `atasan@blc.co.id`), resolve to `"Pak Hendra"`.
- If unassigned, return fallback `"Belum ditentukan"` (never `"Nama belum tersedia"`).
- In `ApprovalProgress.tsx` & `ApprovalStepper.tsx`: Pass `document.stage1ApproverEmail` into `displayPersonName`.

### B. Responsive Stepper (`progress-indicator.tsx` & `progress-indicator.css`)
- Remove brittle absolute track with `right: calc(...)`.
- Implement flex-based, 100% responsive step connector layout:
  - Each step item connects to the next via a centered, 2px connector line (`height: 2px; top: 50%; transform: translateY(-50%)`).
  - Smooth semantic coloring:
    - Step 1 approved &rarr; connector 1-2 is `#079982` (emerald).
    - Step 2 approved &rarr; connector 2-3 is `#079982` (emerald).
    - Inactive / waiting &rarr; connector is neutral light gray `#e2e8f0`.
  - Dots are standardized at 20px × 20px with centered icons (`✓`, `×`, active inner dot, or empty).
  - Dots have `title`, `aria-label`, and `role="img"` for tooltips and accessibility.
  - Table cell has `min-width: 120px;` and flexes cleanly without overflow.

### C. Design System Status Badges (`src/style.css` & `ApprovalStepper.tsx`)
- Define `.step-badge` with:
  - `display: inline-flex; align-items: center; gap: 5px;`
  - `padding: 3px 10px; border-radius: 9999px;`
  - `font-size: 11px; font-weight: 700; line-height: 1.3;`
  - `border-width: 1px; border-style: solid;`
- Hook up semantic tokens:
  - `.status-waiting`: bg `#f3f4f6`, border `#e5e7eb`, text `#374151`
  - `.status-pending`: bg `#fffbeb`, border `#fde68a`, text `#92400e`
  - `.status-approved`: bg `#ecfdf5`, border `#a7f3d0`, text `#065f46`
  - `.status-rejected`: bg `#fef2f2`, border `#fecaca`, text `#991b1b`

---

## 3. Step-by-Step Tasks

### Task 1: Approver Name Data Integrity & Resolution (Feedback 3)
- **Files:**
  - `src/domain/display-name.ts`
  - `src/domain/display-name.test.ts`
  - `src/components/ApprovalProgress.tsx`
  - `src/components/ApprovalStepper.tsx`
  - `server/repository.ts`
- **Steps:**
  1. Update `displayPersonName` in `src/domain/display-name.ts` to use fallback `'Belum ditentukan'` instead of `'Nama belum tersedia'`.
  2. In `src/components/ApprovalProgress.tsx`, pass `document.stage1ApproverEmail` to `displayPersonName(atasan.assignedTo, document.stage1ApproverEmail)`.
  3. In `src/components/ApprovalStepper.tsx`, pass `document.stage1ApproverEmail` to `displayPersonName(atasan.assignedTo, document.stage1ApproverEmail)`.
  4. In `server/repository.ts`, ensure `ensureIntegrity()` migrates existing documents so `assignedTo` is populated from `stage1ApproverEmail`.
  5. Update and add unit tests in `src/domain/display-name.test.ts` and `src/components/ApprovalProgress.test.tsx`.
  6. Verify with `npm test`.
  7. Commit: `fix(approval): resolve approver names and replace uninformative fallback with Belum ditentukan`

---

### Task 2: Responsive Stepper Redesign & Connector Line Alignment (Feedback 1)
- **Files:**
  - `src/components/ui/progress-indicator.tsx`
  - `src/components/ui/progress-indicator.css`
  - `src/style.css`
  - `src/components/ApprovalProgress.test.tsx`
- **Steps:**
  1. Redesign `progress-indicator.tsx` and `progress-indicator.css`:
     - Remove broken `right: calc(...)` track.
     - Implement clean flex stepper where each step node between 1 and N has centered 2px connector segments.
     - Ensure connector line spans continuously from dot 1 to dot 2, and dot 2 to dot 3 without gaps, clipping, or detaching.
     - Style compact stepper for table cells (`width: 100%; max-width: 150px; min-width: 100px`).
     - Align dots vertically at 50% with `20px` diameter and crisp borders.
  2. Update unit tests in `src/components/ApprovalProgress.test.tsx` verifying connector classes and accessibility attributes.
  3. Verify with `npm test`.
  4. Commit: `fix(stepper): redesign responsive progress indicator with continuous centered connector lines`

---

### Task 3: Design System Status Badge Consistency & Stepper Polish (Feedback 2)
- **Files:**
  - `src/style.css`
  - `src/components/ApprovalStepper.tsx`
  - `src/components/DocumentDetailModal.test.tsx`
- **Steps:**
  1. In `src/style.css`, add comprehensive `.step-badge` styles matching design system tokens (`border-radius: 9999px`, `padding: 3px 10px`, `font-size: 11px`, `font-weight: 700`, semantic colors).
  2. Polish `ApprovalStepper.tsx` layout in `DocumentDetailModal` (consistent spacing, rounded nodes, clean alignment).
  3. Add unit test in `src/components/DocumentDetailModal.test.tsx` verifying `.step-badge` classes and rendered structure.
  4. Verify with `npm test`.
  5. Commit: `style(badge): apply rounded design system pill badges and polish approval stepper modal`

---

### Task 4: Multi-Viewport Verification & Backend State Refresh
- **Files:**
  - Full suite verification
  - Restart server daemon to reload database state.
- **Steps:**
  1. Run `npm test` (all tests pass).
  2. Run `npm run build` (clean production build).
  3. Restart backend task daemon (`npm run server`) so database state is refreshed.
  4. Test HTTP endpoints and verify live responses.
  5. Push to GitHub `origin main`.

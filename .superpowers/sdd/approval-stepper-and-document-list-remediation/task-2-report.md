# Task 2 Report: Responsive Stepper Redesign & Connector Line Alignment

## Status
**Completed** (Commit `a26f9fc`)

---

## 1. Context & Visual Defect Analysis
- **User Feedback**:
  `StaffBeranda > DocumentList > td:nth-of-type(5)`:
  *"Ini anda sebut sebagai pass test UI? Perbaiki dan sesuaikan dengan responsive"*
- **Root Cause of Defect**:
  1. The legacy implementation used an absolute overlay `.approval-capsule-track` with `style={{ right: calc(...) }}` and a 12px fat grey background bar (`height: 12px; background: #e3e8e4;`).
  2. Because the track's right bound was computed via `calc(${100 / steps.length}% - 10px)` against the container, any slight flex variance or table cell squeeze caused Circle 1 and Circle 2 to sit over a misaligned thick bar.
  3. Circle 3 ended past the calculated track edge, appearing completely detached and floating with no connector line.
  4. The layout was brittle, not truly responsive, and broke whenever table cells adjusted width.

---

## 2. Changes Implemented

### 2.1. `src/components/ui/progress-indicator.tsx`
- **Eliminated Legacy Track**: Completely removed `.approval-capsule-track` and `.approval-capsule-fill`.
- **Pure Flex Pipeline**:
  - Container: `.approval-capsule` / `.approval-capsule--compact`.
  - List: `<ol className="approval-progress approval-progress--capsule ...">`.
  - Steps 1 through $N-1$: flex item with `flex: 1 1 0%; display: flex; align-items: center;`.
  - Last step: `flex: 0 0 auto; display: flex; align-items: center;`.
- **Continuous Connector Line**:
  - Embedded `<span className="step-connector approval-progress-connector ..." aria-hidden="true" />` inside each step $i < N$.
  - Automatically flexes between dot $i$ and dot $i+1$ (`flex: 1 1 0%; margin: 0 6px;`).
  - Outgoing connector turns active emerald (`#079982`) when step $i$ is `APPROVED`.
  - Outgoing connector stays neutral light grey (`#e2e8f0`) when waiting or not yet approved.
- **Accessible, Crisp Dots**:
  - Standardized dots with `role="img"`, `tabIndex={0}`, `aria-label`, and `title` showing `${stage.name}: ${statusText}`.
  - Centered glyph `✓` for approved and `×` for rejected.
  - Hides `.approval-progress-copy` completely in compact mode without DOM alignment shifts.

### 2.2. `src/components/ui/progress-indicator.css` & `src/style.css`
- **Fluid Capsule Dimensions**:
  - `.approval-capsule--compact`: `width: 100%; min-width: 110px; max-width: 160px;`.
  - Table cell `td[data-label="Persetujuan"]`: `vertical-align: middle; min-width: 130px;`.
- **Centered Connector Segment**:
  - Centered vertically at 50% (`height: 2.5px; border-radius: 2px; margin: 0 6px; align-self: center;`).
  - Active color: `#079982` (emerald).
  - Inactive color: `#e2e8f0` (neutral grey).
- **Dot Specifications**:
  - Standardized `20px × 20px`, perfectly round (`border-radius: 50%`), `box-sizing: border-box`, `flex-shrink: 0`.
  - Approved: solid emerald `#079982` with crisp white checkmark `✓`.
  - Pending: ruby border `#e51937` with 3px width (`border: 3px solid #e51937; background: #fff;`).
  - Waiting: slate neutral border `#cbd5e1` with white background.
  - Rejected: crimson `#b42332` with white `×`.
  - Focus indicator: `outline: 2px solid #006cff; outline-offset: 2px;` for keyboard accessibility.

### 2.3. `src/components/ApprovalProgress.test.tsx`
- Added tests verifying:
  - 3-stage documents render 3 dots and exactly 2 connector segments between steps 1 & 2 and steps 2 & 3.
  - Active connector (`is-approved`) is set when the step is approved.
  - Accessible attributes (`role="img"`, `tabindex="0"`, `aria-label`, `title`) are present on all dots.
  - Last step has no trailing connector line.
  - 2-stage documents (PV) render 2 dots and exactly 1 connector line.
  - Rejection marks `×` and checkmarks `✓` render correctly inside the dots.
  - Fixed type assignability for `assignedTo` test.

---

## 3. Verification & Test Results
- **Vitest**:
  ```text
  Test Files  16 passed (16)
       Tests  104 passed (104)
  ```
- **TypeScript**:
  `npx tsc --noEmit` passed with 0 errors.
- **Production Build**:
  `npm run build` completed in 4.17s without warnings.

---

## 4. Commits
- `a26f9fc fix(stepper): redesign responsive progress indicator with continuous centered connector lines`

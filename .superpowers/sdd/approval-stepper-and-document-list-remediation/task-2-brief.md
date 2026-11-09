# Task 2: Responsive Stepper Redesign & Connector Line Alignment (Feedback 1)

## Context & Objectives
User feedback:
`StaffBeranda > DocumentList > td:nth-of-type(5)`
"Ini anda sebut sebagai pass test UI? Perbaiki dan sesuaikan dengan responsive"
Visual defect in screenshot:
- Circle 1 and Circle 2 had a misaligned, 12px fat grey bar.
- Circle 3 was completely detached, floating with no connector line.
- The layout was brittle, misaligned, and did not scale responsively with container width.

## Requirements
1. **Redesign `src/components/ui/progress-indicator.tsx`**:
   - Completely eliminate the broken `.approval-capsule-track` with `style={{ right: calc(...) }}`.
   - Implement an elegant flex-based stepper:
     - Container: `.approval-capsule` / `.approval-capsule--compact`.
     - Ordered list: `<ol className="approval-progress approval-progress--capsule ...">`.
     - Each step item `li.approval-progress-step`:
       - Steps 1 through N-1 have `flex: 1; display: flex; align-items: center;`.
       - Last step has `flex: 0 0 auto;`.
       - Connector line via `.step-connector` or pseudo-element `::after`:
         - Centered vertically at 50% height with `height: 2.5px; border-radius: 2px;`.
         - Connects smoothly from the right edge of dot $i$ to the left edge of dot $i+1$ with clean margins (`margin: 0 6px;`).
         - Transitions to active emerald (`#10b981` / `#079982`) when step $i$ is `APPROVED`.
         - Neutral light grey (`#e2e8f0`) when waiting or not yet approved.
     - Dots:
       - Standardized `20px × 20px` circle with crisp border and centered icon.
       - Approved: solid emerald `#079982` with crisp white checkmark `✓`.
       - Pending: ruby border `#e51937` with 3px width or active core.
       - Waiting: slate neutral border `#cbd5e1` with white background.
       - Rejected: crimson `#b42332` with white `×`.
     - Each dot has `role="img"`, `tabIndex={0}`, `aria-label`, and `title` with `${stage.name}: ${statusText}`.
2. **Responsive Styling in `src/components/ui/progress-indicator.css` & `src/style.css`**:
   - In compact mode (`.approval-capsule--compact`):
     - `width: 100%; max-width: 160px; min-width: 110px;`.
     - Completely hides `.approval-progress-copy` text without breaking DOM alignment.
     - Never clips or wraps awkwardly on smaller viewports.
   - In table cell `td[data-label="Persetujuan"]`:
     - `min-width: 130px; vertical-align: middle;`.
3. **Tests in `src/components/ApprovalProgress.test.tsx`**:
   - Verify all connector lines are rendered between step 1 and 2, and step 2 and 3.
   - Verify compact mode renders all dots with proper `role="img"`, `title`, and status classes.
   - Run `npm test` and ensure all 101+ tests pass.
4. **Commit**:
   `git commit -m "fix(stepper): redesign responsive progress indicator with continuous centered connector lines"`

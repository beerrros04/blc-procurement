# Task 3: Design System Status Badge Consistency & Stepper Polish (Feedback 2)

## Context & Objectives
User feedback:
`div.step-node:nth-of-type(1) > div.step-content:nth-of-type(2) > div.step-title-row > span.step-badge.status-waiting`
Text: "Menunggu Giliran"
Feedback: "Kenapa anda tidak menyesuaikan dengan sekitarnya, mengembangkan menjadi lebih sesuai dengan design system. Lebih rounded, dan ukuran disesuaikan. Sesuaikan pada semua komponen yang sama kondisinya"

Defect:
- `.step-badge` had NO CSS definition, rendering as unstyled raw inline text with zero padding, sharp rectangular corners, and unaligned font size.
- All badge states (`status-waiting`, `status-pending`, `status-approved`, `status-rejected`) in `ApprovalStepper` and surrounding modal components must be styled as rounded pills (`border-radius: 9999px`) matching the corporate design tokens.

## Implementation Details
1. In `src/style.css`:
   - Add `.step-badge` base styling:
     - `display: inline-flex; align-items: center; gap: 5px;`
     - `padding: 3px 10px; border-radius: 9999px;` (pill geometry)
     - `font-size: 11px; font-weight: 700; line-height: 1.3;`
     - `white-space: nowrap; border: 1px solid transparent; letter-spacing: 0.01em;`
   - Explicit styling for status variants:
     - `.step-badge.status-waiting`: background `var(--status-waiting-bg)`, border `var(--status-waiting-border)`, text `var(--status-waiting-text)`.
     - `.step-badge.status-pending`: background `var(--status-pending-bg)`, border `var(--status-pending-border)`, text `var(--status-pending-text)`.
     - `.step-badge.status-approved`: background `var(--status-approved-bg)`, border `var(--status-approved-border)`, text `var(--status-approved-text)`.
     - `.step-badge.status-rejected`: background `var(--status-rejected-bg)`, border `var(--status-rejected-border)`, text `var(--status-rejected-text)`.
   - Ensure `.badge` and `.s-badge` and `.step-badge` have consistent pill radius (`9999px`), appropriate padding, and responsive line-height.
   - Refine `.bod-reviewer` in `ApprovalStepper`:
     - Clean card background (`#f8fafc`), crisp border (`1px solid #e2e8f0`), rounded corners (`10px`), and `display: flex; justify-content: space-between; align-items: center;` for `bod-reviewer-head`.
2. In `src/components/DocumentDetailModal.test.tsx`:
   - Add unit tests verifying that `.step-badge` renders with `.status-waiting`, `.status-pending`, `.status-approved`, and `.status-rejected` in `ApprovalStepper`.
   - Verify that all 4 badges (Atasan, Ayu, Hery, Hashimoto) have the expected status classes and rounded badge semantics.
3. Verify:
   - Run `npm test` and `npm run build` to verify that all tests pass and build succeeds.
4. Commit:
   `git commit -m "style(badge): apply rounded design system pill badges and polish approval stepper modal"`

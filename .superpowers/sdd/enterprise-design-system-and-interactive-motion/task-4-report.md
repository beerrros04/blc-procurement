# Task 4 Report: Approval Stepper & Payment Settlement Node

## Summary
Successfully implemented Task 4 from the Enterprise Design System and Interactive Motion Plan. Enhanced the inline table stepper in `src/components/ApprovalProgress.tsx` and `src/components/ui/progress-indicator.*` by adding a dedicated vertical separator divider (`1px solid var(--color-border, #E4E2DD)`, `height: 16px`, `margin: 0 8px`) and a distinct payment settlement indicator node following the approval stages (`Atasan`, `Ayu`, `BoD`).

## Deliverables
- **`src/components/ui/progress-indicator.tsx`**:
  - Exported `PaymentStatus` interface (`isPaid: boolean; label: string; tone: 'success' | 'warning' | 'neutral'`).
  - Added optional `variant?: string` and `paymentStatus?: PaymentStatus` props to `ProgressIndicatorProps`.
  - When `paymentStatus` is provided, renders:
    - `<span className="stepper-payment-divider" aria-hidden="true" />`
    - `<div className={cn("stepper-payment-node", `is-${paymentStatus.tone}`)} role="img" tabIndex={0} title={`Pembayaran: ${paymentStatus.label}`} aria-label={`Pembayaran: ${paymentStatus.label}`}>...</div>`
    - Renders `✓` for `tone === 'success'`, `<Clock size={11} strokeWidth={2.5} aria-hidden="true" />` for `tone === 'warning'`, and empty dot for `tone === 'neutral'`.
- **`src/components/ui/progress-indicator.css`**:
  - Configured flex layout on `.approval-capsule` and `.approval-capsule--compact` to accommodate inline step track and payment node.
  - Styled `.stepper-payment-divider` (`width: 1px`, `height: 16px`, `background-color: var(--color-border, #e4e2dd)`, `margin: 0 8px`, `flex-shrink: 0`).
  - Styled `.stepper-payment-node`:
    - 20px x 20px circular pill (`border-radius: var(--radius-full, 9999px)`), centered flex content.
    - `.is-success`: background `#059669`, border `1px solid #059669`, text `#ffffff`.
    - `.is-warning`: background `#fffbeb`, border `1.5px solid #d97706`, color `#d97706`.
    - `.is-neutral`: background `#f8f7f4`, border `1px solid #e4e2dd`, color `#9ca3af`.
    - Accessibility focus-visible ring (`outline: 2px solid #006cff; outline-offset: 2px`).
- **`src/components/ApprovalProgress.tsx`**:
  - Extended `ApprovalProgressProps` with optional `variant?: 'capsule' | 'inline' | string`.
  - Computes payment status:
    - `PAID` status (or PV `paymentStatus === 'PAID'`): `{ isPaid: true, label: 'Lunas', tone: 'success' }`
    - `APPROVED` status: `{ isPaid: false, label: 'Menunggu Pembayaran', tone: 'warning' }`
    - Other status (e.g., `DRAFT`, `IN_REVIEW`, etc.): `{ isPaid: false, label: 'Belum Dibayar', tone: 'neutral' }`
  - Passes `variant` and `paymentStatus` to `<ProgressIndicator />`.
- **`src/components/ApprovalProgress.test.tsx`**:
  - Added unit tests for:
    - Separated payment settlement node with vertical divider for `status: 'PAID'` ('Lunas').
    - Waiting payment settlement node with divider for `status: 'DRAFT'` ('Belum Dibayar').
    - Warning payment settlement node with divider for `status: 'APPROVED'` ('Menunggu Pembayaran', 'is-warning').

## Verification
- Followed TDD: Verified initial test failure when `stepper-payment-divider` was missing (3 failed tests).
- Targeted test verification:
  - `npm test src/components/ApprovalProgress.test.tsx` -> 17 passed (17).
  - `npm test src/components/ApprovalProgress.test.tsx src/components/DocumentDetailModal.test.tsx` -> 25 passed (25).
- Full suite verification:
  - `npm test` -> 19 test files passed, 132 tests passed, 0 failures.

## Git Commit
- Commit: `6061dad3970a7ed5f89127b2282a1489ed598e71`
- Message: `feat(stepper): add payment settlement node with dedicated vertical divider`

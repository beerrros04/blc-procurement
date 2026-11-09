# Task 4 Brief: Approval Stepper & Payment Settlement Node

## Plan Reference
`docs/superpowers/plans/2026-11-09-enterprise-design-system-and-interactive-motion.md` - Task 4

## Objective
Enhance the inline table stepper in `src/components/ApprovalProgress.tsx` and `src/components/ui/progress-indicator.*` by adding a dedicated vertical separator divider (`1px solid #E4E2DD`, `height: 16px`, `margin: 0 8px`) and a distinct payment settlement indicator node following the 3 approval stages (Atasan, Ayu, BoD).

## Files to Modify
- Modify: `src/components/ui/progress-indicator.tsx`
- Modify: `src/components/ui/progress-indicator.css`
- Modify: `src/components/ApprovalProgress.tsx`
- Modify: `src/components/ApprovalProgress.test.tsx`

## Step-by-Step Requirements

### Step 1: Write test in `src/components/ApprovalProgress.test.tsx`
```typescript
it('renders separated payment settlement indicator node with vertical divider', () => {
  const doc = structuredClone(INITIAL_SEED_DOCUMENTS[0]);
  doc.status = 'PAID';
  const html = renderToStaticMarkup(<ApprovalProgress document={doc} variant="capsule" />);
  expect(html).toContain('stepper-payment-divider');
  expect(html).toContain('stepper-payment-node');
  expect(html).toContain('Lunas');
});

it('renders waiting payment settlement indicator when document is pending approval', () => {
  const doc = structuredClone(INITIAL_SEED_DOCUMENTS[0]);
  doc.status = 'DRAFT';
  const html = renderToStaticMarkup(<ApprovalProgress document={doc} variant="capsule" />);
  expect(html).toContain('stepper-payment-divider');
  expect(html).toContain('stepper-payment-node');
  expect(html).toContain('Belum Dibayar');
});
```

### Step 2: Run test to verify failure
Run: `npm test src/components/ApprovalProgress.test.tsx`
Expected: FAIL (missing `stepper-payment-divider`).

### Step 3: Implement payment settlement separator and indicator
1. In `src/components/ui/progress-indicator.tsx`:
   - Add optional props:
     - `paymentStatus?: { isPaid: boolean; label: string; tone: 'success' | 'warning' | 'neutral' }`
   - When `paymentStatus` is provided, render:
     - `<span className="stepper-payment-divider" aria-hidden="true" />`
     - `<div className={`stepper-payment-node is-${paymentStatus.tone}`} role="img" tabIndex={0} title={`Pembayaran: ${paymentStatus.label}`} aria-label={`Pembayaran: ${paymentStatus.label}`}>...</div>`
2. In `src/components/ui/progress-indicator.css`:
   - Style `.stepper-payment-divider`:
     ```css
     .stepper-payment-divider {
       width: 1px;
       height: 16px;
       background-color: var(--color-border, #e4e2dd);
       margin: 0 8px;
       flex-shrink: 0;
     }
     ```
   - Style `.stepper-payment-node`:
     - 20px x 20px rounded pill / circle (`border-radius: var(--radius-full, 9999px)`).
     - `.is-success`: bg `#059669`, border `1px solid #059669`, color `#FFFFFF` (renders `✓`).
     - `.is-warning`: bg `#FFFBEB`, border `1.5px solid #D97706`, color `#D97706`.
     - `.is-neutral`: bg `#F8F7F4`, border `1px solid #E4E2DD`, color `#9CA3AF`.
3. In `src/components/ApprovalProgress.tsx`:
   - Calculate payment status:
     - If `document.status === 'PAID'` (or PV payment status): `{ isPaid: true, label: 'Lunas', tone: 'success' }`
     - If `document.status === 'APPROVED'`: `{ isPaid: false, label: 'Menunggu Pembayaran', tone: 'warning' }`
     - Otherwise: `{ isPaid: false, label: 'Belum Dibayar', tone: 'neutral' }`
   - Pass `paymentStatus` to `<ProgressIndicator />`.

### Step 4: Verification & Commit
Run `npm test src/components/ApprovalProgress.test.tsx src/components/DocumentDetailModal.test.tsx`
Ensure all tests pass without regressions.
Run full suite: `npm test`.
Commit: `git commit -m "feat(stepper): add payment settlement node with dedicated vertical divider"`

# Task 3 Brief: Modern UI Component System (Buttons, Badges & Chips)

## Plan Reference
`docs/superpowers/plans/2026-11-09-enterprise-design-system-and-interactive-motion.md` - Task 3

## Objective
Implement standardized enterprise badges and chips with clean semantic styling:
1. `<StatusBadge />` as a passive pill badge (`height: 24px`, `border-radius: 9999px`) mapping document statuses (`DRAFT`, `SUBMITTED`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `PAID`, etc.) to semantic colors and Lucide icons.
2. `<FilterChip />` as an interactive filter toggle button (`height: 32px`, `border-radius: 9999px`) with hover and tap feedback.
3. Standardized button styling (`.btn-primary`, `.btn-secondary`, `.btn-outlined`, `.btn-ghost`, `.btn-destructive`, `.btn-icon`) with 32px (`sm`), 36px (`md`), 44px (`lg`) heights.

## Files to Modify/Create
- Create: `src/components/ui/StatusBadge.tsx`
- Create: `src/components/ui/StatusBadge.test.tsx`
- Create: `src/components/ui/FilterChip.tsx`
- Modify: `src/style.css`

## Step-by-Step Requirements

### Step 1: Write failing test in `src/components/ui/StatusBadge.test.tsx`
```typescript
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge Component', () => {
  it('renders semantic badge with icon and label for APPROVED / disetujui', () => {
    const html = renderToStaticMarkup(<StatusBadge status="APPROVED" />);
    expect(html).toContain('class="status-badge status-approved"');
    expect(html).toContain('Disetujui');
    expect(html).toContain('svg'); // Lucide check icon
  });

  it('renders semantic badge with icon and label for PAID / lunas', () => {
    const html = renderToStaticMarkup(<StatusBadge status="PAID" />);
    expect(html).toContain('status-paid');
    expect(html).toContain('Lunas');
  });

  it('renders semantic badge with icon and label for REJECTED / ditolak', () => {
    const html = renderToStaticMarkup(<StatusBadge status="REJECTED" />);
    expect(html).toContain('status-rejected');
    expect(html).toContain('Ditolak');
  });

  it('renders semantic badge with icon and label for IN_REVIEW / ditinjau', () => {
    const html = renderToStaticMarkup(<StatusBadge status="IN_REVIEW" />);
    expect(html).toContain('status-in_review');
    expect(html).toContain('Ditinjau');
  });

  it('renders semantic badge with icon and label for SUBMITTED / diajukan', () => {
    const html = renderToStaticMarkup(<StatusBadge status="SUBMITTED" />);
    expect(html).toContain('status-submitted');
    expect(html).toContain('Diajukan');
  });
});
```

### Step 2: Run test to verify failure
Run: `npm test src/components/ui/StatusBadge.test.tsx`
Expected: FAIL (`StatusBadge` does not exist).

### Step 3: Implement `src/components/ui/StatusBadge.tsx` and `src/components/ui/FilterChip.tsx`
- `StatusBadge`:
  - Accepts `status: string | DocumentStatus`, `className?: string`, `showIcon?: boolean`.
  - Normalizes status uppercase/lowercase.
  - Returns `span.status-badge.status-{name}` with corresponding Lucide icon (`CheckCircle2` for approved, `Clock` for waiting/submitted, `Eye` for in_review, `XCircle` for rejected, `CreditCard` for paid, `FileEdit` for draft) + Indonesian label.
- `FilterChip`:
  - Accepts `active: boolean`, `count?: number`, `onClick?: () => void`, `children: React.ReactNode`, `className?: string`.
  - Uses `motion.button` from `framer-motion` with `whileTap={{ scale: 0.98 }}` and Corporate transition.
  - Active state: background `#DC2626` (primary red), text `#FFFFFF`, font-weight `600`.
  - Inactive state: background `#FFFFFF`, border `1px solid #E4E2DD`, text `#4B5563`.
- Update `src/style.css`:
  - Add `.status-badge` styling matching Section 4.5: `display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 2px 10px; border-radius: var(--radius-full); font-size: var(--text-label-size); font-weight: 600; line-height: 1; white-space: nowrap;`.
  - Add semantic colors for `.status-badge.status-approved`, `.status-badge.status-paid`, `.status-badge.status-rejected`, `.status-badge.status-in_review`, `.status-badge.status-submitted`, `.status-badge.status-draft`.
  - Add `.filter-chip` styling matching Section 4.5.
  - Add button size classes: `.btn-sm` (32px), `.btn-md` (36px), `.btn-lg` (44px).

### Step 4: Verification & Commit
Run `npm test src/components/ui/StatusBadge.test.tsx` and verify it passes.
Run `npm test` across all files to ensure 0 regressions.
Commit: `git commit -m "feat(ui): add StatusBadge and FilterChip components with semantic styling"`

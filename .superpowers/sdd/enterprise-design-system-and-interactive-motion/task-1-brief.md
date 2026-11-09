# Task 1 Brief: Design Tokens & Foundation (CSS & Types)

## Plan Reference
`docs/superpowers/plans/2026-11-09-enterprise-design-system-and-interactive-motion.md` - Task 1

## Objective
Establish the foundational enterprise design tokens in `src/style.css` and create TypeScript contracts in `src/types/design-system.types.ts`, ensuring 100% backward compatibility with legacy Caready CSS variables so all existing tests in `src/style.test.ts` continue to pass.

## Files to Modify/Create
- Create: `src/types/design-system.types.ts`
- Modify: `src/style.css`
- Modify: `src/style.test.ts`

## Step-by-Step Requirements

### Step 1: Write failing test in `src/style.test.ts`
Add a test asserting that both new enterprise design tokens AND legacy Caready aliases are present:
```typescript
it('defines Enterprise Design System tokens and retains backward-compatible Caready aliases', () => {
  const css = readFileSync(resolve(__dirname, 'style.css'), 'utf-8');
  // New Design System tokens
  expect(css).toContain('--palette-primary-600: #DC2626;');
  expect(css).toContain('--palette-neutral-100: #F4F3EF;');
  expect(css).toContain('--color-primary:');
  expect(css).toContain('--color-background:');
  expect(css).toContain('--easing-standard: cubic-bezier(0.2, 0, 0, 1);');
  expect(css).toContain('--elevation-1:');
  // Legacy aliases for existing tests
  expect(css).toContain('--canvas-bg: #f6f5f3;');
  expect(css).toContain('--border-clean: #ededeb;');
  expect(css).toContain('--accent-caready: #e51937;');
});
```

### Step 2: Run test to verify failure
Run: `npm test src/style.test.ts`
Verify it fails because `--palette-primary-600` or `--easing-standard` is not yet defined.

### Step 3: Create `src/types/design-system.types.ts`
Export the following TypeScript types and interfaces:
```typescript
export type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'ghost' | 'icon' | 'destructive';
export type ControlSize = 'sm' | 'md' | 'lg';

export type DocumentStatus =
  | 'draft'
  | 'diajukan'
  | 'menunggu'
  | 'ditinjau'
  | 'disetujui'
  | 'ditolak'
  | 'revisi'
  | 'dibayarkan'
  | 'lunas'
  | 'inactive';

export type ApprovalStepState =
  | 'pending'
  | 'waiting'
  | 'current'
  | 'approved'
  | 'rejected'
  | 'revision'
  | 'completed';

export type StepperVariant = 'compact' | 'expanded' | 'adaptive';
export type TableDensity = 'regular' | 'compact';
```

### Step 4: Update `src/style.css` with Section 9.1 tokens
Add the complete tokens to `:root` in `src/style.css`:
1. Primitive colors:
   - Primary Crimson: `--palette-primary-50: #FEF2F2;` through `--palette-primary-900: #7F1D1D;` (with `--palette-primary-600: #DC2626;`)
   - Neutral Slate: `--palette-neutral-0: #FFFFFF;` through `--palette-neutral-900: #111827;` (with `--palette-neutral-100: #F4F3EF;`, `--palette-neutral-200: #E4E2DD;`, `--palette-neutral-400: #9CA3AF;`, `--palette-neutral-600: #4B5563;`, `--palette-neutral-700: #374151;`)
   - Semantic status palettes for Success (`#059669`), Warning (`#D97706`), Error (`#E11D48`), Info (`#2563EB`).
2. Semantic variables:
   - `--color-primary: var(--palette-primary-600);`
   - `--color-background: var(--palette-neutral-100);`
   - `--color-surface: var(--palette-neutral-0);`
   - `--color-border: var(--palette-neutral-200);`
   - `--color-border-strong: var(--palette-neutral-400);`
   - `--color-text-primary: var(--palette-neutral-900);`
   - `--color-text-secondary: var(--palette-neutral-600);`
3. Spacing scale (`--space-1: 0.25rem;` to `--space-16: 4rem;`)
4. Radius scale (`--radius-sm: 6px;`, `--radius-md: 8px;`, `--radius-lg: 12px;`, `--radius-xl: 16px;`, `--radius-full: 9999px;`)
5. Elevation levels (`--elevation-0` to `--elevation-4`)
6. Corporate motion tokens:
   - `--duration-instant: 100ms;`
   - `--duration-fast: 150ms;`
   - `--duration-normal: 250ms;`
   - `--duration-moderate: 320ms;`
   - `--duration-error: 350ms;`
   - `--easing-standard: cubic-bezier(0.2, 0, 0, 1);`
   - `--easing-enter: cubic-bezier(0.05, 0.7, 0.1, 1);`
   - `--easing-exit: cubic-bezier(0.3, 0, 1, 1);`
   - Media query `@media (prefers-reduced-motion: reduce)` setting durations to `0.01ms`.
7. **Crucial:** Preserve legacy variables as exact aliases:
   - `--canvas-bg: #f6f5f3;`
   - `--border-clean: #ededeb;`
   - `--accent-caready: #e51937;`
   - And all existing tokens so that no existing test fails.

### Step 5: Verification & Commit
Run `npm test` (all 107+ tests must pass).
Commit: `git commit -m "feat(design-system): integrate tokens foundation and typography scale"`

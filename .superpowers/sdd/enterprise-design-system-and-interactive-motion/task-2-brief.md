# Task 2 Brief: Interactive Motion Engine (`src/lib/motion.ts`)

## Plan Reference
`docs/superpowers/plans/2026-11-09-enterprise-design-system-and-interactive-motion.md` - Task 2

## Objective
Create the enterprise Corporate motion helper module in `src/lib/motion.ts` utilizing `framer-motion`. This module provides standard transitions, micro-interaction props (press and card hover), and animation variants for modals and drawers adhering to the Corporate archetype (`cubic-bezier(0.2, 0, 0, 1)`).

## Files to Modify/Create
- Create: `src/lib/motion.test.ts`
- Create: `src/lib/motion.ts`

## Step-by-Step Requirements

### Step 1: Write failing test in `src/lib/motion.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { corporateTransition, modalMotionVariants, pressableProps, hoverableCardProps, drawerMotionVariants } from './motion';

describe('Corporate Motion Engine', () => {
  it('exports corporate cubic-bezier transition curves', () => {
    expect(corporateTransition.ease).toEqual([0.2, 0, 0, 1]);
    expect(corporateTransition.duration).toBe(0.25);
  });

  it('provides scale tap feedback for interactive controls', () => {
    expect(pressableProps.whileTap).toEqual({ scale: 0.98 });
  });

  it('provides subtle elevation translateY on hoverable cards', () => {
    expect(hoverableCardProps.whileHover).toEqual({ y: -2, transition: { duration: 0.15, ease: [0.2, 0, 0, 1] } });
  });

  it('defines modal entrance and exit states', () => {
    expect(modalMotionVariants.hidden.opacity).toBe(0);
    expect(modalMotionVariants.visible.opacity).toBe(1);
    expect(modalMotionVariants.exit.opacity).toBe(0);
  });

  it('defines mobile drawer entrance and exit states', () => {
    expect(drawerMotionVariants.hidden.x).toBe('-100%');
    expect(drawerMotionVariants.visible.x).toBe(0);
  });
});
```

### Step 2: Run test to verify failure
Run: `npm test src/lib/motion.test.ts`
Expected: FAIL (`./motion` not found).

### Step 3: Implement `src/lib/motion.ts`
Export:
- `corporateTransition`: `{ ease: [0.2, 0, 0, 1] as const, duration: 0.25 }`
- `modalEnterTransition`: `{ ease: [0.05, 0.7, 0.1, 1] as const, duration: 0.32 }`
- `modalExitTransition`: `{ ease: [0.3, 0, 1, 1] as const, duration: 0.2 }`
- `pressableProps`: `{ whileTap: { scale: 0.98 } }`
- `hoverableCardProps`: `{ whileHover: { y: -2, transition: { duration: 0.15, ease: [0.2, 0, 0, 1] as const } } }`
- `modalMotionVariants`:
  ```typescript
  export const modalMotionVariants = {
    hidden: { opacity: 0, scale: 0.98, y: 8 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.32, ease: [0.05, 0.7, 0.1, 1] as const } },
    exit: { opacity: 0, scale: 0.98, y: 8, transition: { duration: 0.2, ease: [0.3, 0, 1, 1] as const } },
  };
  ```
- `drawerMotionVariants`:
  ```typescript
  export const drawerMotionVariants = {
    hidden: { x: '-100%', opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.25, ease: [0.2, 0, 0, 1] as const } },
    exit: { x: '-100%', opacity: 0, transition: { duration: 0.2, ease: [0.3, 0, 1, 1] as const } },
  };
  ```

### Step 4: Verification & Commit
Run `npm test src/lib/motion.test.ts` and verify it passes.
Run `npm test` to verify no regressions.
Commit: `git commit -m "feat(motion): add corporate motion engine utilities and variants"`

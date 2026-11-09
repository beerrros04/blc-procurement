# Task 1 Brief: Design Tokens & Elera Component Classes (`src/style.css`)

## Target Files:
- Modify: `src/style.css`
- Create & Test: `src/style.test.ts`

## Goal:
Introduce the Elera design system custom properties and utility classes in `src/style.css`:
- `--canvas-bg: #f6f5f3`
- `--surface-card: #ffffff`
- `--border-clean: #ededeb`
- `--border-subtle: #f2f1ed`
- `--btn-charcoal: #191c1a`
- `--accent-caready: #e51937`
- Classes: `.stats-strip`, `.stat`, `.s-icon-chip`, `.s-badge`, `.s-tabs`, `.s-action`, `.s-action-dark`, `.s-action-caready`, `.s-drawer`, `.s-drawer-backdrop`

## Steps:
1. Write failing test in `src/style.test.ts` verifying that `src/style.css` contains the above tokens and classes.
2. Run `npx vitest run src/style.test.ts` to confirm test fails.
3. Update `src/style.css` to add the tokens and utility classes cleanly.
4. Run `npx vitest run src/style.test.ts` to confirm test passes.
5. Also run `npx vitest run` to verify no regressions in existing 41 tests.
6. Commit or report back cleanly with test results and diff summary.

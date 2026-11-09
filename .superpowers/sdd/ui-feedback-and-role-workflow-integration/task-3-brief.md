# Task 3: Topbar Header Simplification (Feedback 3)

**Files:**
- Modify: `src/main.tsx`
- Test: `src/workspace.test.ts`

**Interfaces:**
- Topbar header title container: renders only the page title without branch or roleTitle badges.

- [ ] **Step 1: Write failing test**
  In `src/workspace.test.ts`, update assertions to check that topbar contains the workspace tab title, but does not render the branch badge or role title inside `header.topbar > div:first-child`.

- [ ] **Step 2: Run test to verify failure**
  Run: `npx vitest run src/workspace.test.ts`

- [ ] **Step 3: Implement clean topbar**
  In `src/main.tsx` (around lines 775-796):
  Remove `<span className="s-badge gray">{authUser.branch}</span>` and `<span className="s-badge">{authUser.roleTitle}</span>` from `header.topbar > div:first-child`.
  Display clean title: `<h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#191C1A' }}>{title}</h1>`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/workspace.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/main.tsx src/workspace.test.ts
  git commit -m "style(topbar): simplify header title by removing redundant badges"
  ```

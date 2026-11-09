# Task 4: Collapsible Hamburger Sidebar with Icon Navigation (Feedback 4)

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/style.css`
- Test: `src/components/elera-workspace.test.tsx`

**Interfaces:**
- `isSidebarCollapsed: boolean` state in `App`.
- Toggle button with `Menu` icon from `lucide-react`.
- When collapsed:
  - Sidebar width: `72px` with smooth transition.
  - Brand header shows only the logo.
  - Nav anchors show centered icons with `title` tooltip.
  - User footer shows compact avatar and logout icon.

- [ ] **Step 1: Write failing test**
  In `src/components/elera-workspace.test.tsx`, add a test that checks the sidebar hamburger button toggles the `is-collapsed` class on `.sidebar` and retains all route icons.

- [ ] **Step 2: Run test to verify failure**
  Run: `npx vitest run src/components/elera-workspace.test.tsx`
  Expected: FAIL

- [ ] **Step 3: Implement collapsible hamburger sidebar**
  In `src/main.tsx`:
  - Add state `const [sidebarCollapsed, setSidebarCollapsed] = useState(false);`.
  - Add hamburger button with `<Menu size={18} />` in the brand section.
  - Apply `className={`sidebar ${sidebarCollapsed ? 'is-collapsed' : ''}`}`.
  - Add `title={item.label}` on nav link anchors so tooltips appear when collapsed.
  In `src/style.css`:
  - Define `.sidebar.is-collapsed` styling (width `72px`, centered content, hide text labels and badges).

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/components/elera-workspace.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/main.tsx src/style.css src/components/elera-workspace.test.tsx
  git commit -m "feat(sidebar): add collapsible hamburger menu with icon-only mini state"
  ```

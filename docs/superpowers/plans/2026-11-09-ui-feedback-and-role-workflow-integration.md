# UI/UX Feedback and End-to-End Role Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address user design feedback on `/` (clean compact approval progress without verbose text, resolve tagged approver names from API, simplify topbar title by removing redundant badges, implement collapsible hamburger sidebar with icon navigation), and integrate end-to-end multi-role business flows with direct submission and quick role switching.

**Architecture:** 
- Table view uses a compact visual pill stepper without cluttered text labels, keeping detailed step audit logs in `DocumentDetailModal`.
- Approver resolution links `stage1ApproverEmail` directly to seeded corporate user directory (`atasan@blc.co.id` -> `Pak Hendra`) in backend `repository.ts` and `display-name.ts`.
- Forms (`FormPR`, `FormPO`, `FormAV`, `FormRB`, `FormRC`) provide an explicit supervisor selector and a dual-action footer ("Simpan Draf" vs "Simpan & Ajukan Langsung").
- Sidebar implements desktop/mobile collapsible drawer mode via a hamburger trigger, retaining the brand logo and route icon stack with accessible tooltips when collapsed to 72px.
- Workspaces integrate a 1-click test role switcher and role-guided login page to enable verification across Pemohon -> Atasan -> Bu Ayu -> BoD -> Keuangan.

**Tech Stack:** React 19, TypeScript 5.8, Tailwind CSS v4, Lucide React, Vitest 5.1, Node.js SQLite (`node:sqlite`).

**Spec:** User feedback items 1–4 and notes in user prompt dated 2026-11-09.

## Global Constraints
- Keep all existing 89 vitest unit tests passing or strictly updated to match refined signatures.
- Adhere to Ponytail principles: minimal new code, DRY, YAGNI, no over-engineering.
- Maintain Impeccable UI: 60-30-10 color balance (`#F0F5F9` canvas, `#FFFFFF` cards, `#E51937` BLC Red accent), Lato typography, sleek CSS transitions.
- Do not use Start Case or Title Case for headings or section titles.

## Review Focus
1. Collapsed sidebar navigation items must remain accessible via keyboard and display descriptive tooltips so users know where each route navigates.
2. Form submission with "Simpan & Ajukan Langsung" must correctly set document status to `IN_REVIEW` and stage 1 (`atasan`) to `PENDING` so Atasan immediately sees it in Approval Register.
3. Approver name resolution must never produce `'Nama belum tersedia'` for known approvers like `atasan@blc.co.id`.
4. Table approval progress must not overflow table cells on small laptop screens (1366x768).
5. Fast role switching in test mode must preserve active API tokens and refresh document list for the target role.

---

### Task 1: Clean Compact Approval Progress in Document Table (Feedback 1 & 2)

**Files:**
- Modify: `src/components/ui/progress-indicator.tsx`
- Modify: `src/components/ui/progress-indicator.css`
- Modify: `src/components/ApprovalProgress.tsx`
- Modify: `src/components/DocumentList.tsx`
- Test: `src/components/ApprovalProgress.test.tsx`

**Interfaces:**
- `ProgressIndicatorProps`: add `compact?: boolean`
- `ApprovalProgressProps`: add `compact?: boolean`

- [ ] **Step 1: Write the failing test**
  In `src/components/ApprovalProgress.test.tsx`, add a test verifying that when `compact={true}` is passed, the rendered HTML contains only the visual progress track and dots, without stage names or verbose status text labels like `'Belum dimulai'` or `'Ayu Martina'`.

```tsx
it('renders compact mode with only visual dots and no verbose copy', () => {
  const doc = structuredClone(INITIAL_SEED_DOCUMENTS[0]);
  const html = renderToStaticMarkup(<ApprovalProgress document={doc} compact />);
  expect(html).not.toContain('approval-progress-copy');
  expect(html).not.toContain('Belum dimulai');
  expect(html).toContain('approval-progress-dot');
});
```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/components/ApprovalProgress.test.tsx`
  Expected: FAIL (compact prop not supported or `approval-progress-copy` still rendered).

- [ ] **Step 3: Implement minimal compact support**
  In `src/components/ui/progress-indicator.tsx`:
  - Accept `compact?: boolean` in `ProgressIndicator`.
  - When `compact` is true, omit rendering `.approval-progress-copy` and add title/aria-label on each dot for tooltip accessibility.
  In `src/components/ApprovalProgress.tsx`:
  - Forward `compact?: boolean` to `ProgressIndicator`.
  In `src/components/DocumentList.tsx`:
  - Pass `compact={true}` to `<ApprovalProgress document={doc} compact />`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/components/ApprovalProgress.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/ui/progress-indicator.tsx src/components/ui/progress-indicator.css src/components/ApprovalProgress.tsx src/components/DocumentList.tsx src/components/ApprovalProgress.test.tsx
  git commit -m "feat(ui): implement compact visual approval stepper for document table"
  ```

---

### Task 2: Approver Name Resolution from API and Corporate Directory (Feedback 2)

**Files:**
- Modify: `src/domain/display-name.ts`
- Modify: `server/repository.ts`
- Test: `src/domain/display-name.test.ts`
- Test: `server/server.test.ts`

**Interfaces:**
- `displayPersonName(raw?: string, approverEmail?: string): string`
- `ProcurementRepository.createDocument(input, actor)`: resolve `assignedTo` from `stage1ApproverEmail`.

- [ ] **Step 1: Write failing tests**
  In `src/domain/display-name.test.ts`:
  Add test asserting that `displayPersonName(undefined, 'atasan@blc.co.id')` or `displayPersonName('Atasan Langsung', 'atasan@blc.co.id')` resolves to `'Pak Hendra'` (or `'Hendra'`).
  In `server/server.test.ts`:
  Add test verifying that creating a document with `stage1ApproverEmail: 'atasan@blc.co.id'` sets `approvalSteps.atasan.assignedTo` to `'Pak Hendra'` instead of generic `'Atasan Langsung'`.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/domain/display-name.test.ts server/server.test.ts`
  Expected: FAIL

- [ ] **Step 3: Implement approver name mapping**
  In `src/domain/display-name.ts`:
  - Map corporate email addresses (`atasan@blc.co.id` -> `Pak Hendra`, `ayu@blc.co.id` -> `Ayu Martina`, etc.) when `raw` is missing or generic.
  In `server/repository.ts`:
  - In `createDocument`, if `input.stage1ApproverEmail` is supplied, look up `SEEDED_USERS[input.stage1ApproverEmail]` and set `approvalSteps.atasan.assignedTo` to the approver's `fullName` (e.g. `'Pak Hendra'`).

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/domain/display-name.test.ts server/server.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/domain/display-name.ts src/domain/display-name.test.ts server/repository.ts server/server.test.ts
  git commit -m "fix(api): resolve approver name from email and corporate directory"
  ```

---

### Task 3: Topbar Header Simplification (Feedback 3)

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

---

### Task 4: Collapsible Hamburger Sidebar with Icon Navigation (Feedback 4)

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

---

### Task 5: End-to-End Role Integration, Tagged Approver Selection, and Direct Submission (Notes)

**Files:**
- Modify: `src/components/forms/FormPR.tsx`
- Modify: `src/components/forms/FormPO.tsx`
- Modify: `src/components/forms/FormAV.tsx`
- Modify: `src/components/forms/FormRB.tsx`
- Modify: `src/components/forms/FormRC.tsx`
- Modify: `src/components/ui/sign-in.tsx`
- Modify: `src/main.tsx`
- Test: `server/server.test.ts`
- Test: `src/workspace.test.ts`

**Interfaces:**
- Approver Tagging: Select input with predefined approvers (`Pak Hendra (Atasan Langsung) - atasan@blc.co.id`, `Bu Ayu - ayu@blc.co.id`, etc.) and manual entry fallback.
- Form Save & Submit: Callback `onSave(doc: AnyDocument, andSubmit?: boolean)`.
- Quick Role Switcher in main workspace header: Instant switch between corporate accounts without logging out during testing.

- [ ] **Step 1: Write failing test**
  Add integration test in `src/workspace.test.ts` testing that saving with `andSubmit=true` automatically calls submit endpoint and sets document status to `IN_REVIEW`.
  Add test verifying role switcher allows switching active role and updates visible workspace tabs.

- [ ] **Step 2: Run test to verify failure**
  Run: `npx vitest run src/workspace.test.ts`
  Expected: FAIL

- [ ] **Step 3: Implement approver selector, dual action buttons, and quick role switcher**
  In `FormPR`, `FormPO`, `FormAV`, `FormRB`, `FormRC`:
  - Provide a clean approver select dropdown displaying `Pak Hendra (Atasan Langsung - atasan@blc.co.id)`.
  - Add two submit buttons: `<button type="submit" name="action" value="draft">Simpan Draf</button>` and `<button type="submit" name="action" value="submit" className="primary">Ajukan ke Atasan Langsung →</button>`.
  In `src/main.tsx`:
  - Handle `andSubmit` in `handleSaveDoc`: if requested, immediately invoke `handleSubmitDoc(saved.document.id)`.
  - Add a quick test role switcher in the topbar or sidebar footer so testing across Pemohon -> Atasan -> Bu Ayu -> BoD is seamless.
  In `src/components/ui/sign-in.tsx`:
  - Add role descriptions to quick account buttons so users immediately understand each role's authority.

- [ ] **Step 4: Run all tests to verify they pass**
  Run: `npm test && npm run build`
  Expected: All tests pass and build succeeds.

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/forms/ src/components/ui/sign-in.tsx src/main.tsx src/workspace.test.ts server/server.test.ts
  git commit -m "feat(workflow): integrate approver tagging, direct submit, and quick role switcher"
  ```

---

### Task 6: Final Verification & Smoke Test

- [ ] **Step 1: Run full Vitest suite**
  Run: `npm test`
  Expected: 100% pass across all unit and integration test files.

- [ ] **Step 2: Run production build**
  Run: `npm run build`
  Expected: Successful bundle generation with no TypeScript errors.

- [ ] **Step 3: Verify running dev server on localhost:5173**
  Verify HTTP 200 and test the UI in browser.

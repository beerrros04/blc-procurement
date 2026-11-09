# Task 1: Clean Compact Approval Progress in Document Table (Feedback 1 & 2)

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

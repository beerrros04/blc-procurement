# Task 5 Brief: Data Presentation & Table Rigor (DocumentList & ApprovalExplorer)

## Plan Reference
`docs/superpowers/plans/2026-11-09-enterprise-design-system-and-interactive-motion.md` - Task 5

## Objective
Enforce enterprise financial rigor and visual consistency across all document tables:
1. All currency / nominal columns and their table headers must be right-aligned (`text-align: right`) with `font-variant-numeric: tabular-nums`.
2. Standardize filter toolbars in `DocumentList.tsx` and `ApprovalExplorer.tsx` to 36px control height (`control-height-md`).
3. Integrate `<StatusBadge />` in table rows for document status.
4. Support sticky actions and overflow containment on compact screens.

## Files to Modify
- Modify: `src/components/DocumentList.tsx`
- Modify: `src/components/ApprovalExplorer.tsx`
- Modify: `src/components/document-lists.css`
- Test: `src/components/elera-workspace.test.tsx`

## Step-by-Step Requirements

### Step 1: Add unit test in `src/components/elera-workspace.test.tsx`
```typescript
it('ensures currency nominal columns have text-right and tabular-nums styling', () => {
  const { container } = render(<DocumentList documents={INITIAL_SEED_DOCUMENTS} onSelect={() => {}} />);
  const currencyCells = container.querySelectorAll('td.col-nominal, td.tabular-currency');
  expect(currencyCells.length).toBeGreaterThan(0);
  currencyCells.forEach((cell) => {
    expect(cell.className).toMatch(/text-right|col-nominal/);
  });
});
```

### Step 2: Update `src/components/DocumentList.tsx` and `src/components/ApprovalExplorer.tsx`
- In `DocumentList.tsx`:
  - Ensure table header for Nominal has `text-right` / `th-nominal`.
  - Ensure `td` for Nominal has `col-nominal text-right font-variant-numeric: tabular-nums`.
  - Replace raw status text with `<StatusBadge status={d.status} />`.
  - Standardize search input, filter selects, and action buttons to height 36px (`h-[36px]`).
- In `ApprovalExplorer.tsx`:
  - In `ApprovalRegisterView`: ensure nominal columns are right-aligned with `tabular-nums`. Set filter dropdowns and `Reset Filter` button to 36px uniform height.
  - In `ApprovalHistoryView`: apply `density="compact"` with `tabular-nums` timestamp (`DD MMM YYYY, HH:mm`) and `<StatusBadge status={log.action} />`.
  - In `ApprovalDocsView`: separate file metadata from action buttons (`Lihat` & `Unduh`).
- In `document-lists.css`:
  - Add helper classes:
    ```css
    .th-nominal, .col-nominal {
      text-align: right !important;
      font-variant-numeric: tabular-nums;
    }
    ```

### Step 3: Verification & Commit
Run: `npm test src/components/elera-workspace.test.tsx src/workspace.test.ts`
Ensure all tests pass.
Run full suite: `npm test` (all 113+ tests must pass).
Commit: `git commit -m "feat(table): apply tabular-nums right-alignment and standardized filter toolbar"`

# Task 2: Approver Name Resolution from API and Corporate Directory (Feedback 2)

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
  - Map corporate email addresses (`atasan@blc.co.id` -> `Pak Hendra`, `ayu@blc.co.id` -> `Ayu Martina`, `pemohon@blc.co.id` -> `Dewi Lestari`, etc.) when `raw` is missing or generic.
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

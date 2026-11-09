# Task 2 Brief: App Shell & Role-Based Operations Navigation (`src/main.tsx`)

## Target Files:
- Modify: `src/main.tsx`
- Modify / Create: `src/workspace.test.ts`

## Goal:
1. Reorganize navigation under the `Operations` group according to strict role permissions:
   - `Dashboard`: Visible only for `ADMIN`, `AYU` (GM), `BOD_HERY`, `BOD_HASHIMOTO`
   - `Pengajuan`: Visible for **all roles** (`PEMOHON`, `ATASAN`, `ADMIN`, `AYU`, `BOD_HERY`, `BOD_HASHIMOTO`, `KEUANGAN`)
   - `Dokumen`: Visible for `ADMIN`, `BOD_HERY`, `BOD_HASHIMOTO`, `AYU`, `KEUANGAN`
2. Export helper function `getVisibleOperationsNav(role: UserRole)` for testing.
3. Streamline Topbar:
   - Clean brand mark + system title `BLC Procurement`.
   - Global search pill with shortcut chip.
   - Official branch dropdown (`Bekasi`, `Cibinong`, `Medan`, `Surabaya`, `Pekanbaru`, `Makassar`, `Samarinda`, `Semua Cabang`).
   - Profile & Role Switcher pill.
4. Ensure default active tab upon login respects role:
   - If user has access to `DASHBOARD`, default to `DASHBOARD`.
   - If user is `PEMOHON` or `ATASAN`, default to `PENGAJUAN`.

## Verification:
- `npx vitest run src/workspace.test.ts` passes.
- Full suite `npx vitest run` passes with 0 regressions.

# Task 5: End-to-End Role Integration, Tagged Approver Selection, and Direct Submission (Notes)

## Context and User Requirements
The user gave the following critical feedback:
"Notes. Sebenarnya project ini jauh dari kata siap seperti halnya :
Sistem login belum menggambarkan masing masing role, seharusnya sudah menginisiasi terkait dengan sistem login dan bagaimana role itu dapat diterapkan.
- Alur bisnis belum diterapkan dengan baik, karena berdasarkan uji coba pengisian belum terintegrasi dengan masing masing peran role."

To resolve this completely:
1. **Forms Approver Tagging & Direct Submission (`FormPR`, `FormPO`, `FormAV`, `FormRB`, `FormRC`)**:
   - Provide an approver selection component/field with corporate approver options:
     - `atasan@blc.co.id`: "Pak Hendra (Atasan Langsung) - atasan@blc.co.id" (default selection)
     - `ayu@blc.co.id`: "Ayu Martina (GM / Penyetuju Tahap 2) - ayu@blc.co.id"
     - Custom email input option if needed.
   - Dual action buttons on every submission form:
     - Button 1: "Simpan Draf" (`andSubmit = false`)
     - Button 2: "Ajukan ke Atasan Langsung →" (`andSubmit = true`)
   - `onSave(doc: AnyDocument, andSubmit?: boolean)` is called with `andSubmit`.
2. **`handleSaveDoc` in `src/main.tsx`**:
   - Accepts `(doc: AnyDocument, andSubmit = false)`.
   - When `andSubmit` is true: after document creation/update, immediately calls `handleSubmitDoc(saved.document.id)`, transitioning the document from `DRAFT` to `IN_REVIEW`.
3. **Quick Test Role Switcher (`src/main.tsx` / `Topbar`)**:
   - Provide an interactive Role Switcher in `Topbar` or workspace header during testing, allowing 1-click role switching between all 7 corporate accounts:
     - Dewi Lestari (`PEMOHON`) - Staff Pemohon
     - Pak Hendra (`ATASAN`) - Atasan Tahap 1
     - Bu Ayu (`AYU`) - GM / Penyetuju Tahap 2
     - Pak Hery (`BOD_HERY`) - Direksi BoD
     - Koji Hashimoto (`BOD_HASHIMOTO`) - Direksi BoD
     - Erika Ayu Fitriana (`KEUANGAN`) - Finance Keuangan
     - Admin Lokal (`ADMIN`) - Administrator
   - Switching instantly updates `authUser`, refetches documents, and shows the exact tabs, permissions, and approval registers for that role.
4. **Clarified Login Page (`src/components/ui/sign-in.tsx`)**:
   - Add clear descriptive role subtitles or explanations for each quick account card so anyone opening the login screen immediately understands each role's authority and function in the workflow.
5. **Testing**:
   - Integration tests in `src/workspace.test.ts` verifying:
     - Saving with `andSubmit = true` calls the submit endpoint and sets status to `IN_REVIEW` with stage 1 assigned to Pak Hendra.
     - Role switching updates active tabs and permissions.
   - Full Vitest suite passes (`npm test`).

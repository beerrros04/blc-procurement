# Phase 00 ? Component inventory

| Kelompok | Source | Kegunaan / dependencies |
|---|---|---|
| Shell | `src/main.tsx` Topbar, Sidebar, App | Navigasi, autentikasi, state dan API orchestration, modal routing |
| Workspace | `StaffBeranda.tsx`, `BentoMetrics.tsx`, `DocumentList.tsx`, `ApprovalExplorer.tsx` | dashboard, register, history, docs, daftar/filter/tabel |
| Domain overlay | `DocumentDetailModal.tsx`, `ExportModal.tsx` | detail/keputusan dan ekspor |
| Forms | `forms/FormPR.tsx`, `FormPO.tsx`, `FormGR.tsx`, `FormAV.tsx`, `FormRB.tsx`, `FormRC.tsx`, `FormPV.tsx`, `FormPVPayment.tsx`, `TaxFields.tsx`, `ApproverSelect.tsx` | input spesifik dokumen, pajak dan approver |
| Approval/status | `ApprovalProgress.tsx`, `ApprovalStepper.tsx`, `ui/progress-indicator.tsx`, `ui/StatusBadge.tsx`, `ui/FilterChip.tsx` | visual progress, status, filter; bukan sumber otoritas workflow |
| Reusable primitives | `ui/button.tsx`, `badge.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `textarea.tsx`, `table.tsx`, `dialog.tsx`, `sheet.tsx`, `tooltip.tsx` | local shadcn-style/CVA/Radix; tingkat adopsi berbeda |
| Lain | `ui/modal-dialog.tsx`, `ui/sign-in.tsx`, `ui/demo.tsx`, `RoleSwitcher.tsx` | custom modal, login, contoh dan role UI |
| Helpers | `src/domain/calculations.ts`, branches, working-days, display-name, payment-label; `src/lib/currency-format.ts`, read-attachment, motion, utils | pertahankan kontrak dan semantik saat mengganti tampilan |

Styles: `src/style.css`, `components/document-detail.css`, `document-lists.css`, `ui/progress-indicator.css`. Inventaris didasarkan pada file dan import; demo tidak otomatis merupakan halaman produksi.

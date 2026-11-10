# Phase 00 ? Page inventory
Navigasi adalah state `WorkspaceTab` di `src/main.tsx`, bukan router URL terpisah; link hash ditangani preventDefault. Akses di bawah berarti visibility UI, bukan jaminan otorisasi API.

| Halaman / entry | Source / tab | Role menu | Aksi dan dependencies |
|---|---|---|---|
| Login | `src/components/ui/sign-in.tsx`, App tanpa sesi | Semua | email/password, quick profile, bantuan; `api.ts`, Button/Input/Label/Card/Badge |
| Executive dashboard | `main.tsx` DASHBOARD, `BentoMetrics.tsx`, `ApprovalExplorer.tsx` | ADMIN, AYU, BOD_HERY, BOD_HASHIMOTO | KPI, modul, activity, register, detail, export |
| Staff workspace / Pengajuan | `StaffBeranda.tsx`, `DocumentList.tsx`, PENGAJUAN/BERANDA | Semua tujuh role pada menu | buat form, daftar, cari/filter, detail, export; aksi aktual dibatasi role/status |
| Dokumen / jenis | `DocumentList.tsx`, ALL/PR/PO/GR/AV/RB/RC/PV | ADMIN, AYU, BOD keduanya, KEUANGAN untuk menu Dokumen | filter jenis/cabang/status, cari, detail, aksi dokumen |
| Approval Register | `ApprovalExplorer.tsx` REGISTER | Semua role melalui menu audit | cari dan filter jenis, cabang, progres, tindak lanjut; detail dan approval progress |
| Approval History | file sama HISTORY | Semua role melalui menu audit | cari, filter aksi, buka detail; berasal dari auditLog |
| Approval Docs | file sama DOCS | Semua role melalui menu audit | daftar lampiran, pencarian, buka detail/attachment; ketersediaan data dibatasi API |
| Detail | `DocumentDetailModal.tsx`, overlay dari daftar | Role yang dapat membuka daftar | status, data, lampiran, approval/reject dan aksi terkait sesuai role/status |
| Form PR/PO/GR/AV/RB/RC | `components/forms/Form*.tsx`, `ModalDialog` | Tombol create terlihat di workspace; API create hanya PEMOHON | draft, input domain dan lampiran, submit; GR alur khusus |
| Form PV & pembayaran | `FormPV.tsx`, `FormPVPayment.tsx` | Finance melalui aksi yang sesuai | generate PV dan catat pembayaran |
| Export | `ExportModal.tsx` | tombol topbar dan daftar | CSV 13 kolom atau print browser untuk PDF |

`RoleSwitcher.tsx` dan `ui/demo.tsx` juga ada di repository; keberadaan file tidak membuktikan bahwa keduanya adalah route aktif. Role visibility server dan UI dirinci pada `00-role-permissions.md`.

## Koreksi REV-001
Quick create di StaffBeranda hanya dirender untuk PEMOHON (`StaffBeranda.tsx:161`); baris form di atas jangan dibaca sebagai tombol create yang terlihat untuk semua role. Matrix per viewport dan role ada di `00-visual-coverage-matrix.md`.

# Graph Report - betta  (2026-11-09)

## Corpus Check
- 101 files · ~104,663 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .css 4, (none) 2, .example 1)

## Summary
- 1100 nodes · 2015 edges · 65 communities (62 shown, 3 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 170 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7fba1834`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Model data konseptual PostgreSQL
- Email thread evidence and Finance feedback
- Kolom yang terlihat pada RC_Drafts
- Rancangan proses bisnis
- package.json
- SharePoint Site Pages and Notebook
- Reimbursement (RB) request form
- generate-figcraft-design.mjs
- SharePoint home page (Beranda) and registers
- repository.ts
- Formulir draf permintaan pembelian (PR)
- Formulir PO pada screenshot Capture 018
- Spesifikasi Desain UI/UX: BLC Procurement (Elera Architecture Adaptation)
- Cash Advance Realization (RC) request form
- ApprovalHistory SharePoint list and skip reasons
- ApprovalExplorer.tsx
- Kolom terlihat pada daftar RB_Drafts
- AV_Drafts SharePoint list
- TypeScript configuration
- Graph navigation
- document-store.ts
- Ringkasan pengajuan procurement
- 5.2 Skema Data & Spesifikasi Formulir
- Bukti email dan rancangan hak akses
- Daftar PV_Drafts di SharePoint
- Antrean dokumen menunggu pembuatan PV
- Pustaka ApprovalDocs
- components.json
- progress.md
- main.tsx
- 2. Resolusi Temuan Detail (F-01 s/d F-09)
- Task 1 Brief: Design Tokens & Elera Component Classes (`src/style.css`)
- Rencana alur pengajuan BLC — untuk review
- react
- Daftar Temuan Bernomor (Numbered Findings)
- App
- Rencana review: perapian UI dan pemeriksaan alur BLC
- DocumentList.tsx
- Task 2 Brief: App Shell & Role-Based Operations Navigation (`src/main.tsx`)
- SDD ledger — plan: docs/superpowers/plans/2026-11-09-ui-ux-elera-overhaul-plan.md
- Laporan Verifikasi Perbaikan Anti-Slop #001: BLC Procurement System
- Persiapan integrasi SharePoint
- Review Focus
- AnyDocument
- BentoMetrics.tsx
- 2. Daftar Gap & Plot Hole Antara Panduan v3/v4, Email, dan Aplikasi Saat Ini
- Kebutuhan produk procurement dan pembayaran
- Rencana Perbaikan UI dan Progress Persetujuan
- Must fix
- Tampilan daftar SharePoint tanpa baris data
- Rancangan teknis modular monolith
- BLC Procurement Design System & UI Kit Specification
- BentoMetrics.tsx
- Formulir AV Drafts untuk uang muka
- Rincian Tugas Pelaksanaan
- Tampilan daftar draf PO
- Review Focus
- 2. Temuan Audit Berdasarkan Tingkat Keparahan (P0 - P3) & Kaidah Anti-Slop
- Alur RB historis dan pengecualian aturan lama
- Bagian informasi umum PR
- Bagian nilai dan pajak PR
- Data tambahan dan pewarisan dari PO
- Informasi umum AV
- SDD ledger — plan: docs/superpowers/plans/2026-11-09-ui-ux-impeccable-taste-audit-and-plan.md

## God Nodes (most connected - your core abstractions)
1. `App()` - 45 edges
2. `ProcurementRepository` - 31 edges
3. `AnyDocument` - 31 edges
4. `react` - 29 edges
5. `Percakapan Outlook BLC Procurement, 26 Oktober–4 November 2026` - 29 edges
6. `DocumentList()` - 23 edges
7. `Bukti email dan rancangan hak akses` - 23 edges
8. `UserRole` - 22 edges
9. `Beranda Sistem Persetujuan Pembelian` - 22 edges
10. `Daftar Temuan Bernomor (Numbered Findings)` - 21 edges

## Surprising Connections (you probably didn't know these)
- `2. Kebocoran informasi rekening bank melalui `auditLog` dan respons endpoint mutasi, serta bug kotak rekening kosong di UI` --references--> `visibleDocument()`  [INFERRED]
  docs/superpowers/specs/2026-11-09-ponytail-business-flow-audit.md → server/app.ts
- `[F-04] Clickable `div` Tanpa Semantik Button & Keyboard Access — **RESOLVED**` --references--> `ApprovalRegisterView()`  [INFERRED]
  anti-slop/verification-002-2026-11-09.md → src/components/ApprovalExplorer.tsx
- `Task 5: Slide-Over Inspection Drawer (`src/components/DocumentDetailModal.tsx`)` --references--> `ApprovalStepper()`  [INFERRED]
  docs/superpowers/plans/2026-11-09-ui-ux-elera-overhaul-plan.md → src/components/ApprovalStepper.tsx
- `Task 6: Memoize Aggregations & Extract Hot-Path Inline Styles to CSS` --references--> `BentoMetrics()`  [INFERRED]
  docs/superpowers/plans/2026-11-07-ui-debloat-and-performance.md → src/components/BentoMetrics.tsx
- `Fase 4: Integrasi Frontend–Backend, Pengujian E2E & Kesiapan Rilis` --references--> `DocumentDetailModal()`  [INFERRED]
  docs/superpowers/plans/2026-11-07-production-roadmap-and-architecture.md → src/components/DocumentDetailModal.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pengajuan RC dan konfirmasi keuangan historis** — docs_media_powerautomate_fireshot_capture_015___mail___bernard_wilson___outlook____outlook_cloud_microsoft__rc_flow, docs_media_powerautomate_fireshot_capture_015___mail___bernard_wilson___outlook____outlook_cloud_microsoft__rc_one_av, docs_media_powerautomate_fireshot_capture_015___mail___bernard_wilson___outlook____outlook_cloud_microsoft__rc_paid, docs_media_powerautomate_fireshot_capture_015___mail___bernard_wilson___outlook____outlook_cloud_microsoft__rc_outcomes [EXTRACTED 1.00]
- **Tiga pilihan hasil realisasi** — docs_media_powerautomate_fireshot_capture_023___blc_procurement___rc_drafts_request_result_type, docs_media_powerautomate_fireshot_capture_023___blc_procurement___rc_drafts_request_return_company, docs_media_powerautomate_fireshot_capture_023___blc_procurement___rc_drafts_request_return_employee, docs_media_powerautomate_fireshot_capture_023___blc_procurement___rc_drafts_request_equal_ca [EXTRACTED 1.00]
- **Alasan berbeda untuk status skipped** — docs_media_powerautomate_fireshot_capture_013_blc_procurement_approvalhistory_all_items_caready_sharepoint_com_previous_approval, docs_media_powerautomate_fireshot_capture_013_blc_procurement_approvalhistory_all_items_caready_sharepoint_com_self_approval, docs_media_powerautomate_fireshot_capture_013_blc_procurement_approvalhistory_all_items_caready_sharepoint_com_unused_stage [INFERRED 0.95]
- **RB/RC: keputusan paralel dan otorisasi** — prd_parallel_rbrc, dbd_approval_groups, tdd_access, tdd_parallel_concurrency, ipd_parallel_access_tests [INFERRED 0.95]

## Communities (65 total, 3 thin omitted)

### Community 0 - "Model data konseptual PostgreSQL"
Cohesion: 0.14
Nodes (15): Tugas dan peristiwa persetujuan, Kelompok paralel dengan tugas per penyetuju, Transaksi atomik, audit, dan outbox, Model data konseptual PostgreSQL, Migrasi SharePoint dan rekonsiliasi, Versi kebijakan workflow, Identitas Entra dan penugasan role berversi, Cutover dan rekonsiliasi (+7 more)

### Community 1 - "Email thread evidence and Finance feedback"
Cohesion: 0.13
Nodes (22): Ayu: fungsi Keuangan dan masukan pengguna, Bukti pembayaran dipindai berwarna, Tenggat RC: dua hari kerja setelah kegiatan selesai, Percakapan Outlook BLC Procurement, 26 Oktober–4 November 2026, Usulan konfirmasi RC oleh salah satu anggota Finance, Finance mengakses ApprovalDocs dan dokumen induk PV, Ekspor Finance atas data pengajuan dan pembayaran, Hery dan Hashimoto dalam alur persetujuan historis (+14 more)

### Community 2 - "Kolom yang terlihat pada RC_Drafts"
Cohesion: 0.15
Nodes (13): Kolom Branch pada RC_Drafts, Kolom CADoc pada RC_Drafts, Tampilan RC_Drafts kosong saat tangkapan diambil, Kolom yang terlihat pada RC_Drafts, Kolom ID pada RC_Drafts, Navigasi draf PR, PO, AV, RB, RC, PV dan daftar persetujuan, Daftar RC_Drafts, Kolom ResultType pada RC_Drafts (+5 more)

### Community 3 - "Rancangan proses bisnis"
Cohesion: 0.21
Nodes (13): Realisasi uang muka AV dan RC, Rancangan proses bisnis, Pengecualian PO rutin atau mobilisasi, Penerima pengingat RC historis, Kebijakan penolakan pada kelompok paralel belum diputuskan, Nilai terutang dan pembayaran PV, Hasil realisasi RC: sisa, kekurangan, atau sama, Tenggat dan pengingat realisasi (+5 more)

### Community 4 - "package.json"
Cohesion: 0.06
Nodes (45): dependencies, clsx@^2.1.1, framer-motion@^14.10.1, lucide-react@^1.70.0, react@^19.0.0, react-dom@^19.0.0, tailwind-merge@^3.7.0, tw-animate-css@^1.4.0 (+37 more)

### Community 5 - "SharePoint Site Pages and Notebook"
Cohesion: 0.15
Nodes (13): Navigasi ApprovalRegister, Halaman Beranda.aspx, Tampilan halaman dikelompokkan berdasarkan pembuat, Halaman CollabHome.aspx, Navigasi AV_Drafts, Navigasi PO_Drafts, Navigasi PR_Drafts, Navigasi RB_Drafts (+5 more)

### Community 6 - "Reimbursement (RB) request form"
Cohesion: 0.08
Nodes (25): RB: nilai dan pajak, RB: persetujuan, RB Attachments — lampiran, RB Branch — cabang, RB BudgetType — jenis anggaran, RB DiscountAmount — diskon, RB: informasi umum, RB HasPPN — penanda PPN (+17 more)

### Community 7 - "generate-figcraft-design.mjs"
Cohesion: 0.05
Nodes (30): b, badges, chips, colors, cover, exportBtns, exportCard, graySwatches (+22 more)

### Community 8 - "SharePoint home page (Beranda) and registers"
Cohesion: 0.16
Nodes (22): AV uang muka, Pengumuman batas sistem, Beranda Sistem Persetujuan Pembelian, Buku besar pengajuan, Catatan pembayaran, Dokumen persetujuan, GR laporan penerimaan, PV memilih dokumen induk PO AV RB (+14 more)

### Community 9 - "repository.ts"
Cohesion: 0.06
Nodes (33): Hasil pemeriksaan F-01 sampai F-17, AppServerOptions, BLCAppServer, canViewAttachments(), createAppServer(), handleFetch(), extractAuthUser(), jsonResponse() (+25 more)

### Community 10 - "Formulir draf permintaan pembelian (PR)"
Cohesion: 0.18
Nodes (11): Bagian pengajuan PR, Formulir draf permintaan pembelian (PR), Bagian IAM untuk nilai sebelum pajak mulai Rp5 juta, Bagian lainnya PR, Kontrol lampiran pada formulir PR, Nomor IAM yang disetujui, Nomor PR yang disetujui bila berlaku, Penyetuju tahap 1 dipilih pemohon dan ditandai wajib (+3 more)

### Community 11 - "Formulir PO pada screenshot Capture 018"
Cohesion: 0.15
Nodes (14): Subtotal, biaya lain, diskon, PPN dan PPh, Unggah lampiran PO, Informasi umum PO, Kolom wajib PO: judul, cabang, tujuan, jenis anggaran dan kategori biaya, Nomor IAM dan nomor kontrak PO, Referensi ParentPRID pada PO, Metode pembayaran PO wajib, Formulir PO pada screenshot Capture 018 (+6 more)

### Community 12 - "Spesifikasi Desain UI/UX: BLC Procurement (Elera Architecture Adaptation)"
Cohesion: 0.12
Nodes (16): 1. Latar Belakang & Tujuan Transformasi (The Why & Intent), 2. Design Tokens, Tipografi & Bentuk (Shapes & Tokens), 3. Matriks Peran & Navigasi Sidebar (`Operations`), 4. Visual Blueprint & Layout Wireframe, 5. Rencana Tahapan Eksekusi Terstruktur, A. Palet Warna Resmi (Caready Red x Elera Neutral), A. Tampilan 1: Cockpit Eksekutif (`activeTab === 'DASHBOARD'`), Arah Solusi (Elera Architecture) (+8 more)

### Community 13 - "Cash Advance Realization (RC) request form"
Cohesion: 0.15
Nodes (17): Lampiran RC, Cabang dan jenis anggaran RC, CADoc: pilih AV milik pemohon yang telah dibayar, Detail rekening karyawan untuk Return to Employee, Realisasi sama dengan cash advance, Penyetuju tahap pertama adalah atasan langsung, Formulir Realisasi Cash Advance (RC), Biaya lain dan diskon realisasi (+9 more)

### Community 14 - "ApprovalHistory SharePoint list and skip reasons"
Cohesion: 0.23
Nodes (15): Riwayat lama: tiga alasan tahap dilewati, Kolom riwayat keputusan dan pelacakan, Riwayat respons persetujuan SharePoint, Contoh komentar pemeriksaan perjalanan dinas dan aktivitas HR, Komentar kasus mobilisasi nasional ke Finance dan BOD, Hasil approve, reject dan skipped, Contoh penolakan terkait metode pembayaran, Skip karena penyetuju telah menyetujui tahap sebelumnya (+7 more)

### Community 15 - "ApprovalExplorer.tsx"
Cohesion: 0.22
Nodes (17): 1. Ringkasan Diagnostik Impeccable Health Score, [F-01] Approval Register, History, dan Docs Rusak di Layar Mobile (< 600px) — **RESOLVED**, openAttachment(), ApprovalDocsView(), ApprovalHistoryView(), ApprovalRegisterView(), CATEGORY_LABELS, filterRegisterDocuments() (+9 more)

### Community 16 - "Kolom terlihat pada daftar RB_Drafts"
Cohesion: 0.09
Nodes (22): Tampilan All Items pada daftar RB_Drafts, Navigasi ApprovalRegister, Navigasi PR, PO, AV, RB, RC dan PV Drafts, Tombol Edit in grid view, Daftar RB_Drafts tampak kosong pada saat tangkapan, Pilihan Export, Workflows dan Integrate, Kolom Branch, Kolom ID (+14 more)

### Community 17 - "AV_Drafts SharePoint list"
Cohesion: 0.18
Nodes (11): Aksi New dan Edit in grid view, Aksi Share Copy link dan Export, Kolom Branch dan Purpose pada AV_Drafts, Kolom ID dan Title pada AV_Drafts, Kolom PaymentDueDate pada AV_Drafts, Kolom VendorName dan ParentPOID pada AV_Drafts, Kontrol Workflows Integrate dan Details, Navigasi draf PR PO AV RB RC PV dan ApprovalRegister (+3 more)

### Community 18 - "TypeScript configuration"
Cohesion: 0.15
Nodes (12): compilerOptions, baseUrl, jsx, lib, module, moduleResolution, noEmit, paths (+4 more)

### Community 20 - "document-store.ts"
Cohesion: 0.06
Nodes (60): Document Workspace & Multi-Stage Approval Frontend Implementation Plan, Global Constraints, Review Focus, Task 1: Domain Types and Financial Calculation Core, Task 2: Multi-Document Repository and State Machine Store, Task 3: Visual Approval Stepper and Role Bar Components, Task 5: Document List, Detail Modal, and Main Workspace Shell, Task 6: End-to-End Simulation Testing & Seed Data (+52 more)

### Community 21 - "Ringkasan pengajuan procurement"
Cohesion: 0.19
Nodes (12): Kolom berlabel Dibayarkan, Kolom nomor, judul, jenis dan pemohon, Indikator empat tahap persetujuan, Kolom total pengajuan, Kolom waktu dibuat, Baris pengajuan cash advance dan realisasi, Judul PV menampilkan rujukan dokumen PO, AV atau RB, PV dapat disetujui dan belum dibayar (+4 more)

### Community 22 - "5.2 Skema Data & Spesifikasi Formulir"
Cohesion: 0.10
Nodes (19): 1. Maksud dan Tujuan (Intent & The Why), 1. Purchase Request (PR), 2. Purchase Order (PO), 2. Sasaran, Batasan Cakupan, dan Anti-Sasaran (Goals, Non-Goals, Anti-Goals), 3. Batasan Teknis (Constraints), 3. Cash Advance (AV), 4. Pendekatan yang Dipertimbangkan (Approaches), 4. Reimbursement (RB) (+11 more)

### Community 23 - "Bukti email dan rancangan hak akses"
Cohesion: 0.15
Nodes (14): Usulan tingkat HR 1, Ayu 2, Hery dan Hashimoto 3, Urutan lengkap RB/RC masih belum pasti, Nama penerima terlihat; alamat email lengkap tidak terlihat, Pencocokan catatan pembayaran terhadap PV, Alamat email lengkap tidak tampak pada screenshot, Bukti email dan rancangan hak akses, Pemohon memilih penyetuju pertama; RC menyebut atasan, Tingkat, peran dan tugas berbeda (+6 more)

### Community 24 - "Daftar PV_Drafts di SharePoint"
Cohesion: 0.18
Nodes (11): Tampilan All Items pada PV_Drafts, Navigasi draf dan riwayat persetujuan BLC Procurement, Kolom Draft pada daftar PV, Daftar PV_Drafts kosong pada saat tangkapan, Kolom InvoiceNo pada daftar PV, Kolom ParentDoc pada daftar PV, Kolom PaymentDueDate pada daftar PV, Kolom PaymentMethod pada daftar PV (+3 more)

### Community 25 - "Antrean dokumen menunggu pembuatan PV"
Cohesion: 0.33
Nodes (6): Antrean dokumen menunggu pembuatan PV, Notifikasi AV kepada Finance pernah tidak diterima, Status pembayaran dan filter bayar hanya pada PV, Menunggu PV, kegagalan PDF, notifikasi dan audit, Antrean menunggu PV dan dokumen induk, Notifikasi AV dan PDF pernah bermasalah

### Community 26 - "Pustaka ApprovalDocs"
Cohesion: 0.18
Nodes (12): Tautan ApprovalHistory, Tautan ApprovalRegister, Pustaka ApprovalDocs, Tangkapan pustaka ApprovalDocs BLC Procurement, Label kolom Indonesia dan Jepang, Kolom dokumen dan metadata, Tautan daftar draf PR, PO, AV, RB, RC, dan PV, Tampilan folder kosong pada tangkapan (+4 more)

### Community 27 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 30 - "main.tsx"
Cohesion: 0.13
Nodes (17): Task 2: App Shell & Role-Based Operations Navigation (`src/main.tsx`), lucide-react, ExportModal(), handleDownload(), ExportModalProps, extractFinanceExportFields(), ROLE_DEFINITIONS, RoleSwitcherProps (+9 more)

### Community 31 - "2. Resolusi Temuan Detail (F-01 s/d F-09)"
Cohesion: 0.13
Nodes (12): 2. Resolusi Temuan Detail (F-01 s/d F-09), 3. Hasil Pengujian Otomatis, [F-02] Formulir Modal Tidak Memiliki Focus Trap & Escape Handler — **RESOLVED**, [F-03] Kontras Teks Muted Gagal Standar WCAG AA — **RESOLVED**, [F-04] Clickable `div` Tanpa Semantik Button & Keyboard Access — **RESOLVED**, [F-05] Disonansi Palet Warna Dokumen (Eliminasi Palette Bloat) — **RESOLVED**, [F-06] Ketiadaan Print Stylesheet (@media print) pada Fitur Cetak PDF — **RESOLVED**, [F-07] Hamburan Gaya Inline (Inline Style Bloat) & Radius Arbitrer — **RESOLVED** (+4 more)

### Community 32 - "Task 1 Brief: Design Tokens & Elera Component Classes (`src/style.css`)"
Cohesion: 0.40
Nodes (4): Goal:, Steps:, Target Files:, Task 1 Brief: Design Tokens & Elera Component Classes (`src/style.css`)

### Community 33 - "Rencana alur pengajuan BLC — untuk review"
Cohesion: 0.07
Nodes (27): Bukti dan batas pemeriksaan, Hal lain yang ditanyakan notes, Keputusan yang dipertahankan, P0 — Kebenaran data, privasi, dan definisi, P1 — Tata letak dan kejelasan tindakan, P2 — Keterkaitan dokumen dan isian yang sudah direncanakan, P3 — Aturan bisnis dan kesiapan integrasi, Pemeriksaan wajib pada setiap tahap implementasi (+19 more)

### Community 34 - "react"
Cohesion: 0.07
Nodes (56): [F-08] Ketiadaan Masking Format Mata Uang pada Input Nilai Rupiah — **RESOLVED**, Task 4: Interactive Document Forms (PR, PO, AV, RB, RC, PV), Fase 1: Finalisasi UI/UX & Pembersihan Bloat (Frontend Polish), Audit of Remaining Bloat & Performance Bottlenecks, Keputusan Fiksasi Alur Bisnis (Terkunci), Pengembangan Alur Bisnis Terfiksasi & Perbaikan Temuan Ponytail — Implementation Plan, Tasks, Task 5: Format Masking Input Mata Uang (Live Currency Formatting) pada Formulir Pengadaan (+48 more)

### Community 35 - "Daftar Temuan Bernomor (Numbered Findings)"
Cohesion: 0.07
Nodes (26): Audit UI/UX Anti-Slop #001: BLC Procurement System, Daftar Temuan Bernomor (Numbered Findings), [F-01] HIGH — Fictional Testimonials pada Layar Sign-In, [F-02] HIGH — Tombol Google SSO dan Kontrol Interaktif Fiktif pada Sign-In, [F-03] HIGH — Perhitungan Nilai dan Metrik Pengadaan Menggandakan Dokumen Induk & Turunan, [F-04] HIGH — Adopsi Mentah Template "Spike Next.js Pro Architecture", [F-05] HIGH — Horizontal Overflow pada Resolusi Kerja Standar (956px - 1366px), [F-06] HIGH — Kontras Teks Muted Gagal Standar Aksesibilitas WCAG AA (+18 more)

### Community 36 - "App"
Cohesion: 0.18
Nodes (19): api(), clearApiToken(), hasApiToken(), setApiToken(), App(), completeLogin(), handleApproveDoc(), handleConfirmGeneratePv() (+11 more)

### Community 37 - "Rencana review: perapian UI dan pemeriksaan alur BLC"
Cohesion: 0.13
Nodes (14): 0. Pulihkan pratinjau dan ambil baseline, 1. Perapian kerangka, navigasi dan halaman masuk, 2. Beranda, daftar dokumen dan pekerjaan per peran, 3. Detail, persetujuan dan formulir, 4. Tindakan yang saat ini menyesatkan, 5. Pemeriksaan akhir dan pembaruan catatan, Arah visual yang diusulkan, Dasar pemeriksaan saat penyusunan (+6 more)

### Community 38 - "DocumentList.tsx"
Cohesion: 0.23
Nodes (12): canCreatePvFromDoc(), DocumentList(), getDocAmount(), getDocTypeVisual(), getStatusBadge(), requiresRoleAction(), rupiah, actions (+4 more)

### Community 39 - "Task 2 Brief: App Shell & Role-Based Operations Navigation (`src/main.tsx`)"
Cohesion: 0.40
Nodes (4): Goal:, Target Files:, Task 2 Brief: App Shell & Role-Based Operations Navigation (`src/main.tsx`), Verification:

### Community 40 - "SDD ledger — plan: docs/superpowers/plans/2026-11-09-ui-ux-elera-overhaul-plan.md"
Cohesion: 0.40
Nodes (4): Lanjutan 9 November, Pre-flight & Plan Summary, SDD ledger — plan: docs/superpowers/plans/2026-11-09-ui-ux-elera-overhaul-plan.md, Tasks Progress

### Community 41 - "Laporan Verifikasi Perbaikan Anti-Slop #001: BLC Procurement System"
Cohesion: 0.40
Nodes (4): Hasil Verifikasi Otomatis, Laporan Verifikasi Perbaikan Anti-Slop #001: BLC Procurement System, Ringkasan Eksekusi, Status Perbaikan Tiap Temuan

### Community 42 - "Persiapan integrasi SharePoint"
Cohesion: 0.40
Nodes (4): Catatan teknis, Keputusan sebelum integrasi, Persiapan integrasi SharePoint, Tahapan migrasi

### Community 43 - "Review Focus"
Cohesion: 0.20
Nodes (9): Global Constraints, Review Focus, Task 1: Purge AI Slop and Fictional Assets from Sign-In & UI Utilities, Task 2: Standardize `src/style.css` on Official BLC Design Tokens & Purge Spike Pro Template, Task 3: Replace Bento Grid with Operational Action Queue Bar (`ActionQueueBar.tsx`), Task 4: Fix Status Badge Semantics & Table Responsiveness in `DocumentList.tsx`, Task 5: Consolidate Module Accents and Clean Up `StaffBeranda.tsx`, Task 6: End-to-End Verification & Verification Report (+1 more)

### Community 44 - "AnyDocument"
Cohesion: 0.16
Nodes (15): DashboardMetrics, ApprovalDocsViewProps, ApprovalHistoryViewProps, ApprovalRegisterViewProps, DocLibraryItem, HistoryRow, RegisterFilters, DocumentDetailModalProps (+7 more)

### Community 45 - "BentoMetrics.tsx"
Cohesion: 0.10
Nodes (20): 1. Rancangan Database Production (PostgreSQL Schema & Integrity), 2. Rancangan Backend & Arsitektur API (Fastify + TypeScript), 3. Finalisasi Touch pada UI/UX (Menuju Production), 4. Master Tasklist Pengembangan Menuju Production (Urutan Eksekusi), A. Skema Tabel Utama & Cara Penerapannya, A. Struktur Monorepo / Paket Kode, B. Kontrak Endpoint REST API (`/api/v1`), BLC Procurement Production Roadmap, Architecture & Tasklist (+12 more)

### Community 46 - "2. Daftar Gap & Plot Hole Antara Panduan v3/v4, Email, dan Aplikasi Saat Ini"
Cohesion: 0.17
Nodes (11): 1. Kronologi Perubahan Alur Bisnis dari Screenshot Email (26 Okt – 4 Nov 2026), 2. Daftar Gap & Plot Hole Antara Panduan v3/v4, Email, dan Aplikasi Saat Ini, Analisis Fiksasi Alur Bisnis, Evolusi Email, & Gap / Plot Hole, Plot Hole 1: Siklus Hidup `PV` — Dokumen Berpersetujuan (`Ayu -> Hery -> Hashimoto`) vs Terbit Instan (`APPROVED`), Plot Hole 2: Modul `GR` (Laporan Penerimaan Barang/Jasa) Belum Ada di Aplikasi, Plot Hole 3: Aturan PO terhadap PR Induk (`1 PR : 1 PO`, Plafon Nilai PR, & Larangan Kata `"Realisasi"`), Plot Hole 4: Batas Plafon Sistem Rp 50.000.000 per Pengajuan (`Total`), Plot Hole 5: Mekanisme Penolakan Penyetuju (`REJECT`) — Edit Dokumen yang Sama vs Dokumen Baru + `PreviousRegisterID` (+3 more)

### Community 47 - "Kebutuhan produk procurement dan pembayaran"
Cohesion: 0.15
Nodes (13): Aturan persetujuan bertahap, Rencana irisan awal draf PR, Validasi draf PR, Halaman BLC Procurement draf PR, Persetujuan bertahap dan riwayat, Design system aplikasi kerja, Kebutuhan produk procurement dan pembayaran, Status approval terpisah dari pembayaran (+5 more)

### Community 48 - "Rencana Perbaikan UI dan Progress Persetujuan"
Cohesion: 0.12
Nodes (21): 1. Nama orang untuk tampilan dan sumber status, 2. Adaptasi progress indicator dan drawer, 3. Daftar pengajuan dan filter register, 4. Strip metrik dan sidebar, 5. Verifikasi menyeluruh, Batasan global, Fokus peninjauan, Kondisi awal proyek (+13 more)

### Community 49 - "Must fix"
Cohesion: 0.17
Nodes (11): 1. Mass-assignment pada `updateDocument` memungkinkan Pemohon menyetujui dokumennya sendiri (`status: 'APPROVED'`), 2. Kebocoran informasi rekening bank melalui `auditLog` dan respons endpoint mutasi, serta bug kotak rekening kosong di UI, 3. Deadlock alur bisnis `RC` berstatus `DEFICIT` (Kekurangan Dana Uang Muka) antara pembuatan PV, pembayaran PV, dan konfirmasi Finance, 4. Status BoD paralel menggantung (`PENDING`) ketika salah satu anggota Direksi menolak (`REJECT`) dokumen, 7. Koneksi SQLite dibuka-tutup pada setiap operasi dan `idempotencyCache` tumbuh tanpa batas, 8. Pewarisan data antar-dokumen (`PR -> PO -> AV -> RC`) dan pilihan tarif pajak belum seragam, 9. Perhitungan `pendingForRoleCount` untuk `ATASAN` dan kolom ekspor CSV belum akurat untuk audit Finance, Must fix (+3 more)

### Community 50 - "Tampilan daftar SharePoint tanpa baris data"
Cohesion: 0.17
Nodes (12): BLC Procurement Notebook, Untitled Page pada notebook, Untitled Section pada notebook, Tampilan daftar SharePoint tanpa baris data, Kolom Title, Branch, Purpose dan RequiredDate, Kolom BudgetType, Kolom SubtotalAmount, PPN, OtherCosts, DiscountAmount, TotalAmount dan Currency, Kolom PRNo dan IAMNo (+4 more)

### Community 51 - "Rancangan teknis modular monolith"
Cohesion: 0.18
Nodes (11): Hak berdasarkan tindakan, peran dan cakupan, Login Microsoft 365 dipilih pengguna, Autentikasi dan otorisasi server, API REST pengajuan dan pembayaran, Backend Node.js dan Fastify, Frontend React dan TypeScript, Keputusan paralel atomik dan idempoten, Kontrol izin dokumen aplikasi dan SharePoint (+3 more)

### Community 52 - "BLC Procurement Design System & UI Kit Specification"
Cohesion: 0.22
Nodes (8): 1. Adaptasi Palet Warna (NEXGEN Blue → BLC Corporate Red), 2. Tipografi (Lato Typeface Hierarchy), 3. Komponen UI Kit Utama (Mengikuti Layout Slide 4_3), 4. Breakpoint Responsif, A. Palet Utama (Main Brand Palette), B. Palet Netral (Neutral Grays - 100% Mengikuti Standar NEXGEN), BLC Procurement Design System & UI Kit Specification, C. Palet Pendukung Status (Functional Support Colors)

### Community 53 - "BentoMetrics.tsx"
Cohesion: 0.19
Nodes (12): Task 3: Telemetry Stats Strip (`src/components/BentoMetrics.tsx`), ACTIVITY_LABELS, BentoMetrics(), BentoMetricsProps, formatCompactRupiah(), getDocAmount(), MODULE_NAMES, ROLE_TITLES (+4 more)

### Community 54 - "Formulir AV Drafts untuk uang muka"
Cohesion: 0.18
Nodes (11): Penyetuju tahap pertama dipilih pemohon, Permintaan pengajuan AV, Formulir AV Drafts untuk uang muka, Biaya lain dan diskon AV, Lampiran formulir AV, Transfer sebagai metode pembayaran AV, Nilai dan pajak AV, Metode dan tujuan pembayaran AV (+3 more)

### Community 55 - "Rincian Tugas Pelaksanaan"
Cohesion: 0.20
Nodes (9): Global Constraints, Review Focus, Rincian Tugas Pelaksanaan, Task 1: Harmonisasi Token Desain, Kontras Warna WCAG AA, dan Reduced Motion, Task 2: Standardisasi Modal Dialog (Focus Trap, Escape Handler, dan Focus Restoration), Task 3: Overhaul Approval Explorer (Aksesibilitas Semantik, Eliminasi Palette Bloat, dan Mobile Card Stack), Task 4: Pembersihan Gaya Inline & Penyatuan Desain Komponen (BentoMetrics, StaffBeranda, Topbar), Task 6: Verifikasi Menyeluruh, Audit Ulang Impeccable & Anti-Slop, dan Pembaruan Knowledge Graph (+1 more)

### Community 56 - "Tampilan daftar draf PO"
Cohesion: 0.22
Nodes (9): Alur PR, PO, GR, dan PV, Relasi dokumen request_links, Tampilan daftar kosong pada saat tangkapan, Kolom umum draf PO: judul, cabang, tujuan, tanggal kebutuhan dan anggaran, Kolom nominal draf PO: subtotal, PPN, biaya lain, diskon, total dan mata uang, Kolom permintaan submit dan penyetuju pertama pada draf PO, Tampilan daftar draf PO, Kolom referensi draf PO: nomor PO, PR induk dan IAM (+1 more)

### Community 57 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, Review Focus, Task 1: Design Tokens & Elera Component Classes (`src/style.css`), Task 4: High-Density Register & Segmented Tabs (`src/components/DocumentList.tsx`), Task 5: Slide-Over Inspection Drawer (`src/components/DocumentDetailModal.tsx`), Task 6: Staff Beranda & Pengajuan Hub (`src/components/StaffBeranda.tsx`), Task 7: Comprehensive Verification & Graph Update, UI/UX Overhaul (Elera Architecture) Implementation Plan

### Community 58 - "2. Temuan Audit Berdasarkan Tingkat Keparahan (P0 - P3) & Kaidah Anti-Slop"
Cohesion: 0.29
Nodes (6): 1. Impeccable Diagnostic Health Score (5 Dimensi), 2. Temuan Audit Berdasarkan Tingkat Keparahan (P0 - P3) & Kaidah Anti-Slop, Audit UI/UX Impeccable & Taste-Skills #002: BLC Procurement System, [P0] BLOCKING / HIGH, [P1] MAJOR / HIGH, [P2] MINOR / MEDIUM

### Community 59 - "Alur RB historis dan pengecualian aturan lama"
Cohesion: 0.33
Nodes (6): Alur RB historis dan pengecualian aturan lama, Alur RC historis dan konfirmasi Keuangan, Alur RC historis: atasan, Bu Ira (HR), Hery, Hashimoto, konfirmasi Finance, Jalur historis RB dan RC, RB historis: atasan, Ira HR, Hery, Hashimoto, RC historis: atasan, Ira HR, Hery, Hashimoto, Keuangan

### Community 60 - "Bagian informasi umum PR"
Cohesion: 0.33
Nodes (6): Cabang ditandai wajib pada formulir PR, Bagian informasi umum PR, Jenis anggaran ditandai wajib pada formulir PR, Judul ditandai wajib pada formulir PR, Tanggal kebutuhan tidak ditandai wajib pada formulir PR, Tujuan pembelian ditandai wajib pada formulir PR

### Community 61 - "Bagian nilai dan pajak PR"
Cohesion: 0.40
Nodes (5): Biaya lain seperti ongkos kirim, Nilai potongan, Bagian nilai dan pajak PR, Opsi PPN dan kolom nilai PPN, Subtotal sebelum pajak dan biaya lain ditandai wajib

### Community 62 - "Data tambahan dan pewarisan dari PO"
Cohesion: 0.40
Nodes (5): Jenis anggaran AV tanpa PO, Cabang AV tanpa PO, Data tambahan dan pewarisan dari PO, Penerima atau pemasok AV tanpa PO, Referensi riwayat pengajuan ulang AV

### Community 63 - "Informasi umum AV"
Cohesion: 0.40
Nodes (5): Informasi umum AV, Judul dan tujuan AV tanpa PO, Referensi PO yang telah disetujui, Tanggal jatuh tempo pembayaran AV, Tanggal selesai kegiatan dan tenggat realisasi

### Community 64 - "SDD ledger — plan: docs/superpowers/plans/2026-11-09-ui-ux-impeccable-taste-audit-and-plan.md"
Cohesion: 0.50
Nodes (3): Pre-flight, Progress, SDD ledger — plan: docs/superpowers/plans/2026-11-09-ui-ux-impeccable-taste-audit-and-plan.md

## Knowledge Gaps
- **188 isolated node(s):** `Tugas dan peristiwa persetujuan`, `Versi kebijakan workflow`, `Identitas Entra dan penugasan role berversi`, `Validasi matriks jenis, cabang, nilai, orang dan tindakan`, `UAT dan pengujian lintas fase` (+183 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 523 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Rancangan proses bisnis` connect `Rancangan proses bisnis` to `SharePoint home page (Beranda) and registers`, `ApprovalHistory SharePoint list and skip reasons`, `Kebutuhan produk procurement dan pembayaran`, `Bukti email dan rancangan hak akses`, `Tampilan daftar draf PO`, `Alur RB historis dan pengecualian aturan lama`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `AnyDocument` (e.g. with `Task 1: Domain Types and Financial Calculation Core` and `2. Adaptasi progress indicator dan drawer`) actually correct?**
  _`AnyDocument` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Tugas dan peristiwa persetujuan`, `Versi kebijakan workflow`, `Identitas Entra dan penugasan role berversi` to the rest of the system?**
  _188 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Model data konseptual PostgreSQL` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `document-store.ts` to `react`, `package.json`, `DocumentList.tsx`, `generate-figcraft-design.mjs`, `repository.ts`, `Rencana Perbaikan UI dan Progress Persetujuan`, `BentoMetrics.tsx`, `2. Resolusi Temuan Detail (F-01 s/d F-09)`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `Email thread evidence and Finance feedback` be split into smaller, more focused modules?**
  _Cohesion score 0.1341991341991342 - nodes in this community are weakly interconnected._
- **Why does `Paket kebutuhan BLC Procurement` connect `Kebutuhan produk procurement dan pembayaran` to `Model data konseptual PostgreSQL`, `Rancangan proses bisnis`, `Tampilan daftar SharePoint tanpa baris data`, `Rancangan teknis modular monolith`, `BLC Procurement Design System & UI Kit Specification`, `Bukti email dan rancangan hak akses`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
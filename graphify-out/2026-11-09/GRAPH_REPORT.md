# Graph Report - betta  (2026-11-09)

## Corpus Check
- 91 files · ~100,377 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .css 4, (none) 2, .example 1)

## Summary
- 1054 nodes · 1894 edges · 54 communities (51 shown, 3 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 137 edges (avg confidence: 0.94)
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
- Purchase Request (PR) form
- Cash Advance (AV) request form
- Spesifikasi Desain UI/UX: BLC Procurement (Elera Architecture Adaptation)
- Cash Advance Realization (RC) request form
- ApprovalHistory SharePoint list and skip reasons
- ApprovalExplorer.tsx
- GRDocument
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
- document.ts
- readAttachment
- Task 1 Brief: Design Tokens & Elera Component Classes (`src/style.css`)
- Rencana alur pengajuan BLC — untuk review
- Tasks
- Daftar Temuan Bernomor (Numbered Findings)
- App
- Rencana review: perapian UI dan pemeriksaan alur BLC
- main.tsx
- Task 2 Brief: App Shell & Role-Based Operations Navigation (`src/main.tsx`)
- SDD ledger — plan: docs/superpowers/plans/2026-11-09-ui-ux-elera-overhaul-plan.md
- Laporan Verifikasi Perbaikan Anti-Slop #001: BLC Procurement System
- Persiapan integrasi SharePoint
- Review Focus
- FormRC
- BentoMetrics.tsx
- 2. Daftar Gap & Plot Hole Antara Panduan v3/v4, Email, dan Aplikasi Saat Ini
- Kebutuhan produk procurement dan pembayaran
- Rencana Perbaikan UI dan Progress Persetujuan
- Must fix
- Tampilan daftar SharePoint tanpa baris data
- Rancangan teknis modular monolith
- BLC Procurement Design System & UI Kit Specification
- calculations.ts

## God Nodes (most connected - your core abstractions)
1. `App()` - 44 edges
2. `ProcurementRepository` - 31 edges
3. `AnyDocument` - 31 edges
4. `Percakapan Outlook BLC Procurement, 26 Oktober–4 November 2026` - 29 edges
5. `react` - 27 edges
6. `DocumentList()` - 23 edges
7. `Bukti email dan rancangan hak akses` - 23 edges
8. `UserRole` - 22 edges
9. `Beranda Sistem Persetujuan Pembelian` - 22 edges
10. `Daftar Temuan Bernomor (Numbered Findings)` - 21 edges

## Surprising Connections (you probably didn't know these)
- `2. Kebocoran informasi rekening bank melalui `auditLog` dan respons endpoint mutasi, serta bug kotak rekening kosong di UI` --references--> `visibleDocument()`  [INFERRED]
  docs/superpowers/specs/2026-11-09-ponytail-business-flow-audit.md → server/app.ts
- `Task 6: Memoize Aggregations & Extract Hot-Path Inline Styles to CSS` --references--> `BentoMetrics()`  [INFERRED]
  docs/superpowers/plans/2026-11-07-ui-debloat-and-performance.md → src/components/BentoMetrics.tsx
- `Fase 4: Integrasi Frontend–Backend, Pengujian E2E & Kesiapan Rilis` --references--> `DocumentDetailModal()`  [INFERRED]
  docs/superpowers/plans/2026-11-07-production-roadmap-and-architecture.md → src/components/DocumentDetailModal.tsx
- `2. Adaptasi progress indicator dan drawer` --references--> `AnyDocument`  [INFERRED]
  docs/superpowers/plans/2026-11-09-rencana-feedback-ui-dan-progress.md → src/types/document.ts
- `Tasks` --references--> `visibleDocument()`  [INFERRED]
  docs/superpowers/plans/2026-11-09-pengembangan-alur-bisnis-plan.md → server/app.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pengajuan RC dan konfirmasi keuangan historis** — docs_media_powerautomate_fireshot_capture_015___mail___bernard_wilson___outlook____outlook_cloud_microsoft__rc_flow, docs_media_powerautomate_fireshot_capture_015___mail___bernard_wilson___outlook____outlook_cloud_microsoft__rc_one_av, docs_media_powerautomate_fireshot_capture_015___mail___bernard_wilson___outlook____outlook_cloud_microsoft__rc_paid, docs_media_powerautomate_fireshot_capture_015___mail___bernard_wilson___outlook____outlook_cloud_microsoft__rc_outcomes [EXTRACTED 1.00]
- **Tiga pilihan hasil realisasi** — docs_media_powerautomate_fireshot_capture_023___blc_procurement___rc_drafts_request_result_type, docs_media_powerautomate_fireshot_capture_023___blc_procurement___rc_drafts_request_return_company, docs_media_powerautomate_fireshot_capture_023___blc_procurement___rc_drafts_request_return_employee, docs_media_powerautomate_fireshot_capture_023___blc_procurement___rc_drafts_request_equal_ca [EXTRACTED 1.00]
- **Alasan berbeda untuk status skipped** — docs_media_powerautomate_fireshot_capture_013_blc_procurement_approvalhistory_all_items_caready_sharepoint_com_previous_approval, docs_media_powerautomate_fireshot_capture_013_blc_procurement_approvalhistory_all_items_caready_sharepoint_com_self_approval, docs_media_powerautomate_fireshot_capture_013_blc_procurement_approvalhistory_all_items_caready_sharepoint_com_unused_stage [INFERRED 0.95]
- **RB/RC: keputusan paralel dan otorisasi** — prd_parallel_rbrc, dbd_approval_groups, tdd_access, tdd_parallel_concurrency, ipd_parallel_access_tests [INFERRED 0.95]

## Communities (54 total, 3 thin omitted)

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
Cohesion: 0.15
Nodes (17): Usulan tingkat HR 1, Ayu 2, Hery dan Hashimoto 3, Realisasi uang muka AV dan RC, Rancangan proses bisnis, Pengecualian PO rutin atau mobilisasi, Penerima pengingat RC historis, Kebijakan penolakan pada kelompok paralel belum diputuskan, Nilai terutang dan pembayaran PV, Hasil realisasi RC: sisa, kekurangan, atau sama (+9 more)

### Community 4 - "package.json"
Cohesion: 0.06
Nodes (45): dependencies, clsx@^2.1.1, framer-motion@^14.10.1, lucide-react@^1.70.0, react@^19.0.0, react-dom@^19.0.0, tailwind-merge@^3.7.0, tw-animate-css@^1.4.0 (+37 more)

### Community 5 - "SharePoint Site Pages and Notebook"
Cohesion: 0.15
Nodes (13): Navigasi ApprovalRegister, Halaman Beranda.aspx, Tampilan halaman dikelompokkan berdasarkan pembuat, Halaman CollabHome.aspx, Navigasi AV_Drafts, Navigasi PO_Drafts, Navigasi PR_Drafts, Navigasi RB_Drafts (+5 more)

### Community 6 - "Reimbursement (RB) request form"
Cohesion: 0.04
Nodes (48): Alur RB historis dan pengecualian aturan lama, Tampilan All Items pada daftar RB_Drafts, Navigasi ApprovalRegister, Navigasi PR, PO, AV, RB, RC dan PV Drafts, Tombol Edit in grid view, Daftar RB_Drafts tampak kosong pada saat tangkapan, Pilihan Export, Workflows dan Integrate, Kolom Branch (+40 more)

### Community 7 - "generate-figcraft-design.mjs"
Cohesion: 0.05
Nodes (30): b, badges, chips, colors, cover, exportBtns, exportCard, graySwatches (+22 more)

### Community 8 - "SharePoint home page (Beranda) and registers"
Cohesion: 0.16
Nodes (22): AV uang muka, Pengumuman batas sistem, Beranda Sistem Persetujuan Pembelian, Buku besar pengajuan, Catatan pembayaran, Dokumen persetujuan, GR laporan penerimaan, PV memilih dokumen induk PO AV RB (+14 more)

### Community 9 - "repository.ts"
Cohesion: 0.06
Nodes (39): Hasil pemeriksaan F-01 sampai F-17, Task 2: App Shell & Role-Based Operations Navigation (`src/main.tsx`), AppServerOptions, BLCAppServer, canViewAttachments(), createAppServer(), handleFetch(), extractAuthUser() (+31 more)

### Community 10 - "Purchase Request (PR) form"
Cohesion: 0.06
Nodes (31): Alur PR, PO, GR, dan PV, Relasi dokumen request_links, Tampilan daftar kosong pada saat tangkapan, Kolom umum draf PO: judul, cabang, tujuan, tanggal kebutuhan dan anggaran, Kolom nominal draf PO: subtotal, PPN, biaya lain, diskon, total dan mata uang, Kolom permintaan submit dan penyetuju pertama pada draf PO, Tampilan daftar draf PO, Kolom referensi draf PO: nomor PO, PR induk dan IAM (+23 more)

### Community 11 - "Cash Advance (AV) request form"
Cohesion: 0.06
Nodes (35): Subtotal, biaya lain, diskon, PPN dan PPh, Unggah lampiran PO, Penyetuju tahap pertama dipilih pemohon, Informasi umum PO, Kolom wajib PO: judul, cabang, tujuan, jenis anggaran dan kategori biaya, Nomor IAM dan nomor kontrak PO, Referensi ParentPRID pada PO, Metode pembayaran PO wajib (+27 more)

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
Cohesion: 0.05
Nodes (59): Global Constraints, Review Focus, Task 1: Design Tokens & Elera Component Classes (`src/style.css`), Task 3: Telemetry Stats Strip (`src/components/BentoMetrics.tsx`), Task 4: High-Density Register & Segmented Tabs (`src/components/DocumentList.tsx`), Task 5: Slide-Over Inspection Drawer (`src/components/DocumentDetailModal.tsx`), Task 6: Staff Beranda & Pengajuan Hub (`src/components/StaffBeranda.tsx`), Task 7: Comprehensive Verification & Graph Update (+51 more)

### Community 16 - "GRDocument"
Cohesion: 0.29
Nodes (6): Keputusan Fiksasi Alur Bisnis (Terkunci), Pengembangan Alur Bisnis Terfiksasi & Perbaikan Temuan Ponytail — Implementation Plan, FormPVProps, PvGenerationPayload, rupiah, GRDocument

### Community 17 - "AV_Drafts SharePoint list"
Cohesion: 0.18
Nodes (11): Aksi New dan Edit in grid view, Aksi Share Copy link dan Export, Kolom Branch dan Purpose pada AV_Drafts, Kolom ID dan Title pada AV_Drafts, Kolom PaymentDueDate pada AV_Drafts, Kolom VendorName dan ParentPOID pada AV_Drafts, Kontrol Workflows Integrate dan Details, Navigasi draf PR PO AV RB RC PV dan ApprovalRegister (+3 more)

### Community 18 - "TypeScript configuration"
Cohesion: 0.15
Nodes (12): compilerOptions, baseUrl, jsx, lib, module, moduleResolution, noEmit, paths (+4 more)

### Community 20 - "document-store.ts"
Cohesion: 0.08
Nodes (31): Document Workspace & Multi-Stage Approval Frontend Implementation Plan, Global Constraints, Review Focus, Task 2: Multi-Document Repository and State Machine Store, Task 5: Document List, Detail Modal, and Main Workspace Shell, Task 6: End-to-End Simulation Testing & Seed Data, 6. Duplikasi penuh state machine bisnis di sisi klien (`src/store/document-store.ts`, `src/draft.ts`, `src/draft-store.ts`), react-dom (+23 more)

### Community 21 - "Ringkasan pengajuan procurement"
Cohesion: 0.19
Nodes (12): Kolom berlabel Dibayarkan, Kolom nomor, judul, jenis dan pemohon, Indikator empat tahap persetujuan, Kolom total pengajuan, Kolom waktu dibuat, Baris pengajuan cash advance dan realisasi, Judul PV menampilkan rujukan dokumen PO, AV atau RB, PV dapat disetujui dan belum dibayar (+4 more)

### Community 22 - "5.2 Skema Data & Spesifikasi Formulir"
Cohesion: 0.10
Nodes (19): 1. Maksud dan Tujuan (Intent & The Why), 1. Purchase Request (PR), 2. Purchase Order (PO), 2. Sasaran, Batasan Cakupan, dan Anti-Sasaran (Goals, Non-Goals, Anti-Goals), 3. Batasan Teknis (Constraints), 3. Cash Advance (AV), 4. Pendekatan yang Dipertimbangkan (Approaches), 4. Reimbursement (RB) (+11 more)

### Community 23 - "Bukti email dan rancangan hak akses"
Cohesion: 0.16
Nodes (15): Alur RC historis dan konfirmasi Keuangan, Urutan lengkap RB/RC masih belum pasti, Nama penerima terlihat; alamat email lengkap tidak terlihat, Alur RC historis: atasan, Bu Ira (HR), Hery, Hashimoto, konfirmasi Finance, Alamat email lengkap tidak tampak pada screenshot, Bukti email dan rancangan hak akses, Pemohon memilih penyetuju pertama; RC menyebut atasan, Jalur historis RB dan RC (+7 more)

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

### Community 30 - "document.ts"
Cohesion: 0.15
Nodes (19): Task 1: Domain Types and Financial Calculation Core, 5. Validasi server pada `submitDocument` belum menegakkan aturan kelengkapan wajib PR, PO, AV, dan RC, rupiah, FormRBProps, FormRCProps, rupiah, calculateRcOutcome(), ApprovalStage (+11 more)

### Community 31 - "readAttachment"
Cohesion: 0.18
Nodes (17): 10. Dukungan rincian baris item (`LineItem[]`) pada dokumen PR dan PO, react, FormAVProps, FormGRProps, rupiah, FormPOProps, rupiah, FormPRProps (+9 more)

### Community 32 - "Task 1 Brief: Design Tokens & Elera Component Classes (`src/style.css`)"
Cohesion: 0.40
Nodes (4): Goal:, Steps:, Target Files:, Task 1 Brief: Design Tokens & Elera Component Classes (`src/style.css`)

### Community 33 - "Rencana alur pengajuan BLC — untuk review"
Cohesion: 0.07
Nodes (27): Bukti dan batas pemeriksaan, Hal lain yang ditanyakan notes, Keputusan yang dipertahankan, P0 — Kebenaran data, privasi, dan definisi, P1 — Tata letak dan kejelasan tindakan, P2 — Keterkaitan dokumen dan isian yang sudah direncanakan, P3 — Aturan bisnis dan kesiapan integrasi, Pemeriksaan wajib pada setiap tahap implementasi (+19 more)

### Community 34 - "Tasks"
Cohesion: 0.11
Nodes (22): Task 4: Interactive Document Forms (PR, PO, AV, RB, RC, PV), Fase 1: Finalisasi UI/UX & Pembersihan Bloat (Frontend Polish), Audit of Remaining Bloat & Performance Bottlenecks, Tasks, 6. Apa yang Didelegasikan ke Builder (Left to Builder), ExportModal(), handleDownload(), ExportModalProps (+14 more)

### Community 35 - "Daftar Temuan Bernomor (Numbered Findings)"
Cohesion: 0.07
Nodes (26): Audit UI/UX Anti-Slop #001: BLC Procurement System, Daftar Temuan Bernomor (Numbered Findings), [F-01] HIGH — Fictional Testimonials pada Layar Sign-In, [F-02] HIGH — Tombol Google SSO dan Kontrol Interaktif Fiktif pada Sign-In, [F-03] HIGH — Perhitungan Nilai dan Metrik Pengadaan Menggandakan Dokumen Induk & Turunan, [F-04] HIGH — Adopsi Mentah Template "Spike Next.js Pro Architecture", [F-05] HIGH — Horizontal Overflow pada Resolusi Kerja Standar (956px - 1366px), [F-06] HIGH — Kontras Teks Muted Gagal Standar Aksesibilitas WCAG AA (+18 more)

### Community 36 - "App"
Cohesion: 0.17
Nodes (21): api(), clearApiToken(), hasApiToken(), setApiToken(), App(), completeLogin(), handleApproveDoc(), handleConfirmGeneratePv() (+13 more)

### Community 37 - "Rencana review: perapian UI dan pemeriksaan alur BLC"
Cohesion: 0.13
Nodes (14): 0. Pulihkan pratinjau dan ambil baseline, 1. Perapian kerangka, navigasi dan halaman masuk, 2. Beranda, daftar dokumen dan pekerjaan per peran, 3. Detail, persetujuan dan formulir, 4. Tindakan yang saat ini menyesatkan, 5. Pemeriksaan akhir dan pembaruan catatan, Arah visual yang diusulkan, Dasar pemeriksaan saat penyusunan (+6 more)

### Community 38 - "main.tsx"
Cohesion: 0.15
Nodes (19): lucide-react, canCreatePvFromDoc(), DocumentList(), getDocAmount(), getDocTypeVisual(), getStatusBadge(), requiresRoleAction(), rupiah (+11 more)

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

### Community 44 - "FormRC"
Cohesion: 0.36
Nodes (5): FormRC(), handleAvSelect(), handleDateChange(), handleFileChange(), addWorkingDays()

### Community 45 - "BentoMetrics.tsx"
Cohesion: 0.08
Nodes (23): Task 3: Visual Approval Stepper and Role Bar Components, 1. Rancangan Database Production (PostgreSQL Schema & Integrity), 2. Rancangan Backend & Arsitektur API (Fastify + TypeScript), 3. Finalisasi Touch pada UI/UX (Menuju Production), 4. Master Tasklist Pengembangan Menuju Production (Urutan Eksekusi), A. Skema Tabel Utama & Cara Penerapannya, A. Struktur Monorepo / Paket Kode, B. Kontrak Endpoint REST API (`/api/v1`) (+15 more)

### Community 46 - "2. Daftar Gap & Plot Hole Antara Panduan v3/v4, Email, dan Aplikasi Saat Ini"
Cohesion: 0.17
Nodes (11): 1. Kronologi Perubahan Alur Bisnis dari Screenshot Email (26 Okt – 4 Nov 2026), 2. Daftar Gap & Plot Hole Antara Panduan v3/v4, Email, dan Aplikasi Saat Ini, Analisis Fiksasi Alur Bisnis, Evolusi Email, & Gap / Plot Hole, Plot Hole 1: Siklus Hidup `PV` — Dokumen Berpersetujuan (`Ayu -> Hery -> Hashimoto`) vs Terbit Instan (`APPROVED`), Plot Hole 2: Modul `GR` (Laporan Penerimaan Barang/Jasa) Belum Ada di Aplikasi, Plot Hole 3: Aturan PO terhadap PR Induk (`1 PR : 1 PO`, Plafon Nilai PR, & Larangan Kata `"Realisasi"`), Plot Hole 4: Batas Plafon Sistem Rp 50.000.000 per Pengajuan (`Total`), Plot Hole 5: Mekanisme Penolakan Penyetuju (`REJECT`) — Edit Dokumen yang Sama vs Dokumen Baru + `PreviousRegisterID` (+3 more)

### Community 47 - "Kebutuhan produk procurement dan pembayaran"
Cohesion: 0.15
Nodes (13): Aturan persetujuan bertahap, Rencana irisan awal draf PR, Validasi draf PR, Halaman BLC Procurement draf PR, Persetujuan bertahap dan riwayat, Design system aplikasi kerja, Kebutuhan produk procurement dan pembayaran, Status approval terpisah dari pembayaran (+5 more)

### Community 48 - "Rencana Perbaikan UI dan Progress Persetujuan"
Cohesion: 0.14
Nodes (13): 1. Nama orang untuk tampilan dan sumber status, 2. Adaptasi progress indicator dan drawer, 3. Daftar pengajuan dan filter register, 4. Strip metrik dan sidebar, 5. Verifikasi menyeluruh, Batasan global, Fokus peninjauan, Kondisi awal proyek (+5 more)

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

### Community 53 - "calculations.ts"
Cohesion: 0.29
Nodes (7): PoCalculationInput, PoCalculationResult, PvCalculationInput, PvCalculationResult, RcCalculationInput, RcCalculationResult, RcOutcomeType

## Knowledge Gaps
- **188 isolated node(s):** `Tugas dan peristiwa persetujuan`, `Versi kebijakan workflow`, `Identitas Entra dan penugasan role berversi`, `Validasi matriks jenis, cabang, nilai, orang dan tindakan`, `UAT dan pengujian lintas fase` (+183 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 501 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Rancangan proses bisnis` connect `Rancangan proses bisnis` to `Reimbursement (RB) request form`, `SharePoint home page (Beranda) and registers`, `Purchase Request (PR) form`, `ApprovalHistory SharePoint list and skip reasons`, `Kebutuhan produk procurement dan pembayaran`, `Bukti email dan rancangan hak akses`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `AnyDocument` (e.g. with `Task 1: Domain Types and Financial Calculation Core` and `2. Adaptasi progress indicator dan drawer`) actually correct?**
  _`AnyDocument` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Tugas dan peristiwa persetujuan`, `Versi kebijakan workflow`, `Identitas Entra dan penugasan role berversi` to the rest of the system?**
  _188 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Model data konseptual PostgreSQL` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `document-store.ts` to `package.json`, `main.tsx`, `generate-figcraft-design.mjs`, `repository.ts`, `FormRC`, `ApprovalExplorer.tsx`, `readAttachment`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `Email thread evidence and Finance feedback` be split into smaller, more focused modules?**
  _Cohesion score 0.1341991341991342 - nodes in this community are weakly interconnected._
- **Why does `Alur RB historis dan pengecualian aturan lama` connect `Reimbursement (RB) request form` to `Rancangan proses bisnis`, `Bukti email dan rancangan hak akses`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
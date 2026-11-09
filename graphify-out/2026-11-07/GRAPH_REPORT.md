# Graph Report - BLC  (2026-11-07)

## Corpus Check
- 60 files · ~65,537 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .figcraft 1, .css 1)

## Summary
- 813 nodes · 1398 edges · 37 communities (32 shown, 5 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 89 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `77bb1023`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Approval workflow, architecture, and data model
- Email thread evidence and Finance feedback
- Ringkasan pengajuan procurement
- Rancangan proses bisnis
- package.json
- SharePoint Site Pages and Notebook
- Reimbursement (RB) request form
- generate-figcraft-design.mjs
- SharePoint home page (Beranda) and registers
- repository.ts
- Purchase Request (PR) form
- Cash Advance (AV) request form
- AnyDocument
- Cash Advance Realization (RC) request form
- ApprovalHistory SharePoint list and skip reasons
- RC_Drafts SharePoint list
- ApprovalDocs document library
- AV_Drafts SharePoint list
- TypeScript configuration
- Graph navigation
- main.tsx
- draft-store.ts
- 5.2 Skema Data & Spesifikasi Formulir
- Bukti email dan rancangan hak akses
- Daftar PV_Drafts di SharePoint
- Antrean dokumen menunggu pembuatan PV
- MockStorage
- components.json
- progress.md
- MemoryStorage
- Audit of Remaining Bloat & Performance Bottlenecks
- dependencies
- ApprovalStepper.tsx
- sign-in.tsx
- vite.config.ts
- scripts

## God Nodes (most connected - your core abstractions)
1. `App()` - 38 edges
2. `Percakapan Outlook BLC Procurement, 26 Oktober–4 November 2026` - 29 edges
3. `ProcurementRepository` - 26 edges
4. `AnyDocument` - 26 edges
5. `Bukti email dan rancangan hak akses` - 23 edges
6. `Beranda Sistem Persetujuan Pembelian` - 22 edges
7. `react` - 20 edges
8. `Rancangan proses bisnis` - 19 edges
9. `DocType` - 18 edges
10. `UserRole` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Task 3: Visual Approval Stepper and Role Bar Components` --references--> `ApprovalStepper()`  [INFERRED]
  docs/superpowers/plans/2026-11-07-document-workspace-frontend.md → src/components/ApprovalStepper.tsx
- `Audit of Remaining Bloat & Performance Bottlenecks` --references--> `ApprovalStepper()`  [INFERRED]
  docs/superpowers/plans/2026-11-07-ui-debloat-and-performance.md → src/components/ApprovalStepper.tsx
- `Audit of Remaining Bloat & Performance Bottlenecks` --references--> `BentoMetrics()`  [INFERRED]
  docs/superpowers/plans/2026-11-07-ui-debloat-and-performance.md → src/components/BentoMetrics.tsx
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

## Communities (37 total, 5 thin omitted)

### Community 0 - "Approval workflow, architecture, and data model"
Cohesion: 0.05
Nodes (47): Aturan persetujuan bertahap, Tugas dan peristiwa persetujuan, Kelompok paralel dengan tugas per penyetuju, Transaksi atomik, audit, dan outbox, Model data konseptual PostgreSQL, Migrasi SharePoint dan rekonsiliasi, Versi kebijakan workflow, Identitas Entra dan penugasan role berversi (+39 more)

### Community 1 - "Email thread evidence and Finance feedback"
Cohesion: 0.13
Nodes (22): Ayu: fungsi Keuangan dan masukan pengguna, Bukti pembayaran dipindai berwarna, Percakapan Outlook BLC Procurement, 26 Oktober–4 November 2026, Usulan konfirmasi RC oleh salah satu anggota Finance, Finance mengakses ApprovalDocs dan dokumen induk PV, Ekspor Finance atas data pengajuan dan pembayaran, Hery dan Hashimoto dalam alur persetujuan historis, Bu Ira: pemeriksaan HR atas RB (+14 more)

### Community 2 - "Ringkasan pengajuan procurement"
Cohesion: 0.19
Nodes (12): Kolom berlabel Dibayarkan, Kolom nomor, judul, jenis dan pemohon, Indikator empat tahap persetujuan, Kolom total pengajuan, Kolom waktu dibuat, Baris pengajuan cash advance dan realisasi, Judul PV menampilkan rujukan dokumen PO, AV atau RB, PV dapat disetujui dan belum dibayar (+4 more)

### Community 3 - "Rancangan proses bisnis"
Cohesion: 0.16
Nodes (15): Usulan tingkat HR 1, Ayu 2, Hery dan Hashimoto 3, Realisasi uang muka AV dan RC, Rancangan proses bisnis, Alur RC historis dan konfirmasi Keuangan, Pengecualian PO rutin atau mobilisasi, Penerima pengingat RC historis, Kebijakan penolakan pada kelompok paralel belum diputuskan, Hasil realisasi RC: sisa, kekurangan, atau sama (+7 more)

### Community 4 - "package.json"
Cohesion: 0.13
Nodes (21): devDependencies, autoprefixer@^10.6.2, postcss@^8.5.32, tailwindcss@^4.3.5, tsx@^4.23.15, @types/node@^26.6.6, @types/react@^19.0.0, @types/react-dom@^19.0.0 (+13 more)

### Community 5 - "SharePoint Site Pages and Notebook"
Cohesion: 0.08
Nodes (25): BLC Procurement Notebook, Untitled Page pada notebook, Untitled Section pada notebook, Navigasi ApprovalRegister, Halaman Beranda.aspx, Tampilan halaman dikelompokkan berdasarkan pembuat, Halaman CollabHome.aspx, Navigasi AV_Drafts (+17 more)

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
Nodes (41): AppServerOptions, BLCAppServer, createAppServer(), handleFetch(), extractAuthUser(), jsonResponse(), parseJsonBody(), authenticateCredentials() (+33 more)

### Community 10 - "Purchase Request (PR) form"
Cohesion: 0.06
Nodes (31): Alur PR, PO, GR, dan PV, Relasi dokumen request_links, Tampilan daftar kosong pada saat tangkapan, Kolom umum draf PO: judul, cabang, tujuan, tanggal kebutuhan dan anggaran, Kolom nominal draf PO: subtotal, PPN, biaya lain, diskon, total dan mata uang, Kolom permintaan submit dan penyetuju pertama pada draf PO, Tampilan daftar draf PO, Kolom referensi draf PO: nomor PO, PR induk dan IAM (+23 more)

### Community 11 - "Cash Advance (AV) request form"
Cohesion: 0.06
Nodes (35): Subtotal, biaya lain, diskon, PPN dan PPh, Unggah lampiran PO, Penyetuju tahap pertama dipilih pemohon, Informasi umum PO, Kolom wajib PO: judul, cabang, tujuan, jenis anggaran dan kategori biaya, Nomor IAM dan nomor kontrak PO, Referensi ParentPRID pada PO, Metode pembayaran PO wajib (+27 more)

### Community 12 - "AnyDocument"
Cohesion: 0.06
Nodes (48): BLC Procurement UI De-Bloat & Performance Overhaul Plan, Task 2: Deduplicate Controls in `src/main.tsx` & `src/components/BentoMetrics.tsx`, Task 3: Strip Redundant `.form-intro` Headers Across All 6 Modal Forms, Task 4: Remove Dead Checkbox & Verbose Copy in `ExportModal.tsx`, Task 5: Streamline `DocumentDetailModal.tsx` & `ApprovalStepper.tsx`, Task 6: Memoize Aggregations & Extract Hot-Path Inline Styles to CSS, Task-by-Task Implementation Plan, lucide-react (+40 more)

### Community 13 - "Cash Advance Realization (RC) request form"
Cohesion: 0.15
Nodes (17): Lampiran RC, Cabang dan jenis anggaran RC, CADoc: pilih AV milik pemohon yang telah dibayar, Detail rekening karyawan untuk Return to Employee, Realisasi sama dengan cash advance, Penyetuju tahap pertama adalah atasan langsung, Formulir Realisasi Cash Advance (RC), Biaya lain dan diskon realisasi (+9 more)

### Community 14 - "ApprovalHistory SharePoint list and skip reasons"
Cohesion: 0.23
Nodes (15): Riwayat lama: tiga alasan tahap dilewati, Kolom riwayat keputusan dan pelacakan, Riwayat respons persetujuan SharePoint, Contoh komentar pemeriksaan perjalanan dinas dan aktivitas HR, Komentar kasus mobilisasi nasional ke Finance dan BOD, Hasil approve, reject dan skipped, Contoh penolakan terkait metode pembayaran, Skip karena penyetuju telah menyetujui tahap sebelumnya (+7 more)

### Community 15 - "RC_Drafts SharePoint list"
Cohesion: 0.15
Nodes (13): Kolom Branch pada RC_Drafts, Kolom CADoc pada RC_Drafts, Tampilan RC_Drafts kosong saat tangkapan diambil, Kolom yang terlihat pada RC_Drafts, Kolom ID pada RC_Drafts, Navigasi draf PR, PO, AV, RB, RC, PV dan daftar persetujuan, Daftar RC_Drafts, Kolom ResultType pada RC_Drafts (+5 more)

### Community 16 - "ApprovalDocs document library"
Cohesion: 0.18
Nodes (12): Tautan ApprovalHistory, Tautan ApprovalRegister, Pustaka ApprovalDocs, Tangkapan pustaka ApprovalDocs BLC Procurement, Label kolom Indonesia dan Jepang, Kolom dokumen dan metadata, Tautan daftar draf PR, PO, AV, RB, RC, dan PV, Tampilan folder kosong pada tangkapan (+4 more)

### Community 17 - "AV_Drafts SharePoint list"
Cohesion: 0.18
Nodes (11): Aksi New dan Edit in grid view, Aksi Share Copy link dan Export, Kolom Branch dan Purpose pada AV_Drafts, Kolom ID dan Title pada AV_Drafts, Kolom PaymentDueDate pada AV_Drafts, Kolom VendorName dan ParentPOID pada AV_Drafts, Kontrol Workflows Integrate dan Details, Navigasi draf PR PO AV RB RC PV dan ApprovalRegister (+3 more)

### Community 18 - "TypeScript configuration"
Cohesion: 0.15
Nodes (12): compilerOptions, baseUrl, jsx, lib, module, moduleResolution, noEmit, paths (+4 more)

### Community 20 - "main.tsx"
Cohesion: 0.07
Nodes (60): Task 1: Domain Types and Financial Calculation Core, Task 2: Multi-Document Repository and State Machine Store, react, rupiah, ExportModal(), FormAVProps, FormPOProps, rupiah (+52 more)

### Community 21 - "draft-store.ts"
Cohesion: 0.23
Nodes (9): vitest@^5.1.0, vitest, DraftErrors, DraftInput, Draft, DraftStorage, readDrafts(), saveDraft() (+1 more)

### Community 22 - "5.2 Skema Data & Spesifikasi Formulir"
Cohesion: 0.10
Nodes (19): 1. Maksud dan Tujuan (Intent & The Why), 1. Purchase Request (PR), 2. Purchase Order (PO), 2. Sasaran, Batasan Cakupan, dan Anti-Sasaran (Goals, Non-Goals, Anti-Goals), 3. Batasan Teknis (Constraints), 3. Cash Advance (AV), 4. Pendekatan yang Dipertimbangkan (Approaches), 4. Reimbursement (RB) (+11 more)

### Community 23 - "Bukti email dan rancangan hak akses"
Cohesion: 0.19
Nodes (13): Urutan lengkap RB/RC masih belum pasti, Nama penerima terlihat; alamat email lengkap tidak terlihat, Alamat email lengkap tidak tampak pada screenshot, Bukti email dan rancangan hak akses, Pemohon memilih penyetuju pertama; RC menyebut atasan, Jalur historis RB dan RC, Keputusan matriks, delegasi, skip, pajak dan migrasi, Matriks kemampuan awal belum disahkan (+5 more)

### Community 24 - "Daftar PV_Drafts di SharePoint"
Cohesion: 0.13
Nodes (15): Nilai terutang dan pembayaran PV, Status persetujuan dan pembayaran terpisah, Tampilan All Items pada PV_Drafts, Navigasi draf dan riwayat persetujuan BLC Procurement, Kolom Draft pada daftar PV, Daftar PV_Drafts kosong pada saat tangkapan, Kolom InvoiceNo pada daftar PV, Kolom ParentDoc pada daftar PV (+7 more)

### Community 25 - "Antrean dokumen menunggu pembuatan PV"
Cohesion: 0.33
Nodes (6): Antrean dokumen menunggu pembuatan PV, Notifikasi AV kepada Finance pernah tidak diterima, Status pembayaran dan filter bayar hanya pada PV, Menunggu PV, kegagalan PDF, notifikasi dan audit, Antrean menunggu PV dan dokumen induk, Notifikasi AV dan PDF pernah bermasalah

### Community 27 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 31 - "Audit of Remaining Bloat & Performance Bottlenecks"
Cohesion: 0.06
Nodes (31): Document Workspace & Multi-Stage Approval Frontend Implementation Plan, Global Constraints, Review Focus, Task 3: Visual Approval Stepper and Role Bar Components, Task 4: Interactive Document Forms (PR, PO, AV, RB, RC, PV), Task 5: Document List, Detail Modal, and Main Workspace Shell, Task 6: End-to-End Simulation Testing & Seed Data, 1. Rancangan Database Production (PostgreSQL Schema & Integrity) (+23 more)

### Community 32 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, clsx@^2.1.1, framer-motion@^14.10.1, lucide-react@^1.70.0, react@^19.0.0, react-dom@^19.0.0, tailwind-merge@^3.7.0, tw-animate-css@^1.4.0 (+5 more)

### Community 33 - "ApprovalStepper.tsx"
Cohesion: 0.26
Nodes (9): ApprovalStepper(), ApprovalStepperProps, formatDate(), getDecisionBadge(), ProgressIndicatorDemo(), ProgressIndicator(), ProgressIndicatorProps, cn() (+1 more)

### Community 34 - "sign-in.tsx"
Cohesion: 0.33
Nodes (8): sampleTestimonials, SignInPageDemo(), GlassInputWrapper(), GoogleIcon(), SignInPage(), SignInPageProps, Testimonial, TestimonialCard()

### Community 35 - "vite.config.ts"
Cohesion: 0.25
Nodes (6): @tailwindcss/vite@^4.3.5, vite@^6.3.0, @vitejs/plugin-react@^4.4.0, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 36 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, server, test

## Knowledge Gaps
- **188 isolated node(s):** `Tugas dan peristiwa persetujuan`, `Versi kebijakan workflow`, `Identitas Entra dan penugasan role berversi`, `Validasi matriks jenis, cabang, nilai, orang dan tindakan`, `UAT dan pengujian lintas fase` (+183 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 370 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Rancangan proses bisnis` connect `Rancangan proses bisnis` to `Approval workflow, architecture, and data model`, `Reimbursement (RB) request form`, `SharePoint home page (Beranda) and registers`, `Purchase Request (PR) form`, `ApprovalHistory SharePoint list and skip reasons`, `Bukti email dan rancangan hak akses`, `Daftar PV_Drafts di SharePoint`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **What connects `Tugas dan peristiwa persetujuan`, `Versi kebijakan workflow`, `Identitas Entra dan penugasan role berversi` to the rest of the system?**
  _188 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Approval workflow, architecture, and data model` be split into smaller, more focused modules?**
  _Cohesion score 0.0467687074829932 - nodes in this community are weakly interconnected._
- **Why does `Realisasi uang muka AV dan RC` connect `Rancangan proses bisnis` to `AV_Drafts SharePoint list`, `Cash Advance (AV) request form`, `Cash Advance Realization (RC) request form`, `RC_Drafts SharePoint list`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `Email thread evidence and Finance feedback` be split into smaller, more focused modules?**
  _Cohesion score 0.1341991341991342 - nodes in this community are weakly interconnected._
- **Why does `Paket kebutuhan BLC Procurement` connect `Approval workflow, architecture, and data model` to `Rancangan proses bisnis`, `SharePoint Site Pages and Notebook`, `Bukti email dan rancangan hak akses`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.12554112554112554 - nodes in this community are weakly interconnected._
# Graph Report - BLC  (2026-11-07)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 412 nodes · 524 edges · 20 communities (19 shown, 1 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Approval workflow, architecture, and data model
- Email thread evidence and Finance feedback
- Payment voucher (PV) and payment status
- Business rules, authority levels, and RB/RC flow
- Dependencies and package configuration
- SharePoint Site Pages and Notebook
- Reimbursement (RB) request form
- PR/PO flow and PO drafts
- SharePoint home page (Beranda) and registers
- RB_Drafts SharePoint list
- Purchase Request (PR) form
- Cash Advance (AV) request form
- PR draft frontend and store implementation
- Cash Advance Realization (RC) request form
- ApprovalHistory SharePoint list and skip reasons
- RC_Drafts SharePoint list
- ApprovalDocs document library
- AV_Drafts SharePoint list
- TypeScript configuration
- Graph navigation

## God Nodes (most connected - your core abstractions)
1. `Percakapan Outlook BLC Procurement, 26 Oktober–4 November 2026` - 29 edges
2. `Beranda Sistem Persetujuan Pembelian` - 22 edges
3. `Bukti email dan rancangan hak akses` - 21 edges
4. `Rancangan proses bisnis` - 18 edges
5. `Formulir Realisasi Cash Advance (RC)` - 14 edges
6. `Riwayat respons persetujuan SharePoint` - 13 edges
7. `BLC Procurement: daftar Site Pages` - 13 edges
8. `Kebutuhan produk procurement dan pembayaran` - 12 edges
9. `Tampilan daftar AV_Drafts SharePoint` - 11 edges
10. `Daftar PV_Drafts di SharePoint` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Usulan konfirmasi Finance RC oleh satu anggota tim` --references--> `Usulan konfirmasi RC oleh salah satu anggota Finance`  [EXTRACTED]
  TEMUAN-EMAIL-DAN-HAK-AKSES.md → docs/media/Powerautomate/FireShot Capture 015 - Mail - Bernard Wilson - Outlook - [outlook.cloud.microsoft].png
- `RB historis: atasan, Ira HR, Hery, Hashimoto` --references--> `Alur RB historis: atasan, Bu Ira (HR), Hery, Hashimoto`  [EXTRACTED]
  TEMUAN-EMAIL-DAN-HAK-AKSES.md → docs/media/Powerautomate/FireShot Capture 015 - Mail - Bernard Wilson - Outlook - [outlook.cloud.microsoft].png
- `RC historis: atasan, Ira HR, Hery, Hashimoto, Keuangan` --references--> `Alur RC historis: atasan, Bu Ira (HR), Hery, Hashimoto, konfirmasi Finance`  [EXTRACTED]
  TEMUAN-EMAIL-DAN-HAK-AKSES.md → docs/media/Powerautomate/FireShot Capture 015 - Mail - Bernard Wilson - Outlook - [outlook.cloud.microsoft].png
- `Percakapan Outlook BLC Procurement, 26 Oktober–4 November 2026` --references--> `Pengingat RC ke pemohon dan atasan, CC Ayu`  [EXTRACTED]
  docs/media/Powerautomate/FireShot Capture 015 - Mail - Bernard Wilson - Outlook - [outlook.cloud.microsoft].png → TEMUAN-EMAIL-DAN-HAK-AKSES.md
- `Screenshot email perkembangan BLC Procurement` --references--> `Percakapan Outlook BLC Procurement, 26 Oktober–4 November 2026`  [EXTRACTED]
  TEMUAN-EMAIL-DAN-HAK-AKSES.md → docs/media/Powerautomate/FireShot Capture 015 - Mail - Bernard Wilson - Outlook - [outlook.cloud.microsoft].png

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pengajuan RC dan konfirmasi keuangan historis** — docs_media_powerautomate_fireshot_capture_015___mail___bernard_wilson___outlook____outlook_cloud_microsoft__rc_flow, docs_media_powerautomate_fireshot_capture_015___mail___bernard_wilson___outlook____outlook_cloud_microsoft__rc_one_av, docs_media_powerautomate_fireshot_capture_015___mail___bernard_wilson___outlook____outlook_cloud_microsoft__rc_paid, docs_media_powerautomate_fireshot_capture_015___mail___bernard_wilson___outlook____outlook_cloud_microsoft__rc_outcomes [EXTRACTED 1.00]
- **Tiga pilihan hasil realisasi** — docs_media_powerautomate_fireshot_capture_023___blc_procurement___rc_drafts_request_result_type, docs_media_powerautomate_fireshot_capture_023___blc_procurement___rc_drafts_request_return_company, docs_media_powerautomate_fireshot_capture_023___blc_procurement___rc_drafts_request_return_employee, docs_media_powerautomate_fireshot_capture_023___blc_procurement___rc_drafts_request_equal_ca [EXTRACTED 1.00]
- **Alasan berbeda untuk status skipped** — docs_media_powerautomate_fireshot_capture_013_blc_procurement_approvalhistory_all_items_caready_sharepoint_com_previous_approval, docs_media_powerautomate_fireshot_capture_013_blc_procurement_approvalhistory_all_items_caready_sharepoint_com_self_approval, docs_media_powerautomate_fireshot_capture_013_blc_procurement_approvalhistory_all_items_caready_sharepoint_com_unused_stage [INFERRED 0.95]
- **RB/RC: keputusan paralel dan otorisasi** — prd_parallel_rbrc, dbd_approval_groups, tdd_access, tdd_parallel_concurrency, ipd_parallel_access_tests [INFERRED 0.95]

## Communities (20 total, 1 thin omitted)

### Community 0 - "Approval workflow, architecture, and data model"
Cohesion: 0.06
Nodes (39): Aturan persetujuan bertahap, Tugas dan peristiwa persetujuan, Kelompok paralel dengan tugas per penyetuju, Transaksi atomik, audit, dan outbox, Model data konseptual PostgreSQL, Migrasi SharePoint dan rekonsiliasi, Versi kebijakan workflow, Identitas Entra dan penugasan role berversi (+31 more)

### Community 1 - "Email thread evidence and Finance feedback"
Cohesion: 0.09
Nodes (30): Ayu: fungsi Keuangan dan masukan pengguna, Nama penerima terlihat; alamat email lengkap tidak terlihat, Bukti pembayaran dipindai berwarna, Percakapan Outlook BLC Procurement, 26 Oktober–4 November 2026, Usulan konfirmasi RC oleh salah satu anggota Finance, Finance mengakses ApprovalDocs dan dokumen induk PV, Ekspor Finance atas data pengajuan dan pembayaran, Hery dan Hashimoto dalam alur persetujuan historis (+22 more)

### Community 2 - "Payment voucher (PV) and payment status"
Cohesion: 0.08
Nodes (27): Nilai terutang dan pembayaran PV, Status persetujuan dan pembayaran terpisah, Tampilan All Items pada PV_Drafts, Navigasi draf dan riwayat persetujuan BLC Procurement, Kolom Draft pada daftar PV, Daftar PV_Drafts kosong pada saat tangkapan, Kolom InvoiceNo pada daftar PV, Kolom ParentDoc pada daftar PV (+19 more)

### Community 3 - "Business rules, authority levels, and RB/RC flow"
Cohesion: 0.11
Nodes (27): Usulan tingkat HR 1, Ayu 2, Hery dan Hashimoto 3, Realisasi uang muka AV dan RC, Rancangan proses bisnis, Alur RB historis dan pengecualian aturan lama, Alur RC historis dan konfirmasi Keuangan, Pengecualian PO rutin atau mobilisasi, Penerima pengingat RC historis, Kebijakan penolakan pada kelompok paralel belum diputuskan (+19 more)

### Community 4 - "Dependencies and package configuration"
Cohesion: 0.10
Nodes (25): dependencies, react@^19.0.0, react-dom@^19.0.0, devDependencies, @types/react@^19.0.0, @types/react-dom@^19.0.0, typescript@^5.8.0, vite@^6.3.0 (+17 more)

### Community 5 - "SharePoint Site Pages and Notebook"
Cohesion: 0.08
Nodes (25): BLC Procurement Notebook, Untitled Page pada notebook, Untitled Section pada notebook, Navigasi ApprovalRegister, Halaman Beranda.aspx, Tampilan halaman dikelompokkan berdasarkan pembuat, Halaman CollabHome.aspx, Navigasi AV_Drafts (+17 more)

### Community 6 - "Reimbursement (RB) request form"
Cohesion: 0.08
Nodes (25): RB: nilai dan pajak, RB: persetujuan, RB Attachments — lampiran, RB Branch — cabang, RB BudgetType — jenis anggaran, RB DiscountAmount — diskon, RB: informasi umum, RB HasPPN — penanda PPN (+17 more)

### Community 7 - "PR/PO flow and PO drafts"
Cohesion: 0.09
Nodes (23): Alur PR, PO, GR, dan PV, Relasi dokumen request_links, Tampilan daftar kosong pada saat tangkapan, Kolom umum draf PO: judul, cabang, tujuan, tanggal kebutuhan dan anggaran, Kolom nominal draf PO: subtotal, PPN, biaya lain, diskon, total dan mata uang, Kolom permintaan submit dan penyetuju pertama pada draf PO, Tampilan daftar draf PO, Kolom referensi draf PO: nomor PO, PR induk dan IAM (+15 more)

### Community 8 - "SharePoint home page (Beranda) and registers"
Cohesion: 0.16
Nodes (22): AV uang muka, Pengumuman batas sistem, Beranda Sistem Persetujuan Pembelian, Buku besar pengajuan, Catatan pembayaran, Dokumen persetujuan, GR laporan penerimaan, PV memilih dokumen induk PO AV RB (+14 more)

### Community 9 - "RB_Drafts SharePoint list"
Cohesion: 0.09
Nodes (22): Tampilan All Items pada daftar RB_Drafts, Navigasi ApprovalRegister, Navigasi PR, PO, AV, RB, RC dan PV Drafts, Tombol Edit in grid view, Daftar RB_Drafts tampak kosong pada saat tangkapan, Pilihan Export, Workflows dan Integrate, Kolom Branch, Kolom ID (+14 more)

### Community 10 - "Purchase Request (PR) form"
Cohesion: 0.09
Nodes (22): Bagian pengajuan PR, Biaya lain seperti ongkos kirim, Cabang ditandai wajib pada formulir PR, Nilai potongan, Formulir draf permintaan pembelian (PR), Bagian IAM untuk nilai sebelum pajak mulai Rp5 juta, Bagian informasi umum PR, Jenis anggaran ditandai wajib pada formulir PR (+14 more)

### Community 11 - "Cash Advance (AV) request form"
Cohesion: 0.10
Nodes (21): Penyetuju tahap pertama dipilih pemohon, Permintaan pengajuan AV, Jenis anggaran AV tanpa PO, Formulir AV Drafts untuk uang muka, Biaya lain dan diskon AV, Cabang AV tanpa PO, Data tambahan dan pewarisan dari PO, Informasi umum AV (+13 more)

### Community 12 - "PR draft frontend and store implementation"
Cohesion: 0.19
Nodes (13): vitest, DraftErrors, DraftInput, Draft, DraftStorage, readDrafts(), saveDraft(), validateDraft() (+5 more)

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
Cohesion: 0.18
Nodes (10): compilerOptions, jsx, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

## Knowledge Gaps
- **188 isolated node(s):** `Tugas dan peristiwa persetujuan`, `Versi kebijakan workflow`, `Identitas Entra dan penugasan role berversi`, `Validasi matriks jenis, cabang, nilai, orang dan tindakan`, `UAT dan pengujian lintas fase` (+183 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 211 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Rancangan proses bisnis` connect `Business rules, authority levels, and RB/RC flow` to `Approval workflow, architecture, and data model`, `Payment voucher (PV) and payment status`, `PR/PO flow and PO drafts`, `SharePoint home page (Beranda) and registers`, `ApprovalHistory SharePoint list and skip reasons`?**
  _High betweenness centrality (0.453) - this node is a cross-community bridge._
- **What connects `Tugas dan peristiwa persetujuan`, `Versi kebijakan workflow`, `Identitas Entra dan penugasan role berversi` to the rest of the system?**
  _188 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Approval workflow, architecture, and data model` be split into smaller, more focused modules?**
  _Cohesion score 0.05897435897435897 - nodes in this community are weakly interconnected._
- **Why does `Paket kebutuhan BLC Procurement` connect `Approval workflow, architecture, and data model` to `Business rules, authority levels, and RB/RC flow`, `SharePoint Site Pages and Notebook`?**
  _High betweenness centrality (0.227) - this node is a cross-community bridge._
- **Should `Email thread evidence and Finance feedback` be split into smaller, more focused modules?**
  _Cohesion score 0.09425287356321839 - nodes in this community are weakly interconnected._
- **Why does `Realisasi uang muka AV dan RC` connect `Business rules, authority levels, and RB/RC flow` to `AV_Drafts SharePoint list`, `Cash Advance (AV) request form`, `Cash Advance Realization (RC) request form`, `RC_Drafts SharePoint list`?**
  _High betweenness centrality (0.223) - this node is a cross-community bridge._
- **Should `Payment voucher (PV) and payment status` be split into smaller, more focused modules?**
  _Cohesion score 0.07936507936507936 - nodes in this community are weakly interconnected._
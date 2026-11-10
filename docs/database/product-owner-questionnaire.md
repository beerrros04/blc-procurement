# PRODUCT OWNER QUESTIONNAIRE — PHASE 00
**Project:** BLC Caready Procurement Pro  
**Audit Scope:** Requirements Discovery & Business Decision Questionnaire (AUDIT-008)  
**Status:** AUTHORIZED — AUDIT ONLY  
**Review Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Executive Summary & Tujuan Kuesioner

Dokumen kuesioner ini disusun secara terstruktur untuk mengumpulkan keputusan bisnis otoritatif dari **Product Owner** dan **Project Manager** sebelum perancangan teknis dan implementasi skema basis data lanjutan (Phase 01) dieksekusi.

Setiap pertanyaan disusun dengan menyajikan:
- **Pertanyaan Bisnis:** Konteks operasional yang memerlukan ketetapan manajemen.
- **Kondisi Implementasi Saat Ini:** Fakta teknis pada basis kode saat audit dilakukan.
- **Pilihan Jawaban (Options):** Skenario solusi bisnis yang dapat dipilih.
- **Rekomendasi Teknis:** Solusi yang paling efisien, aman, dan mematuhi best-practice.
- **Konsekuensi Setiap Pilihan:** Dampak terhadap biaya, waktu pengerjaan, kompleksitas, dan kebiasaan pengguna.
- **Prioritas Keputusan (`P0` / `P1` / `P2`):** Tingkat urgensi keputusan terhadap kesiapan rilis produksi.

---

## 2. Kelompok 1: Users & Roles (Pengguna & Hak Akses)

### Pertanyaan 1.1: Multi-Role vs Single-Role Per Pengguna
- **Pertanyaan Bisnis:**
  Apakah seorang karyawan di BLC diperbolehkan memiliki lebih dari satu peran aplikasi secara bersamaan (misal: satu akun dapat bertindak sebagai *Pemohon* untuk divisinya sendiri, sekaligus bertindak sebagai *Atasan* atau *Verifikator Keuangan*)?
- **Kondisi Implementasi Saat Ini:**
  Tabel `app_users` memiliki satu kolom string `role TEXT` (misal: `PEMOHON` atau `ATASAN`). Namun, mesin stage engine ([`server/stage-engine.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/stage-engine.ts)) mengecek kewenangan approval berdasarkan penugasan stage (`assigned_approver_id`), bukan semata-mata string role pengguna.
- **Pilihan Jawaban:**
  - **Opsi A (Rekomendasi):** **Hybrid Contextual Role.** Pengguna memiliki satu peran utama di `app_users`, namun kewenangan approval melekat pada penugasan divisi/stage organisasi. Ayu Martina tetap terdaftar dengan hak akses Keuangan, namun dapat menjadi Atasan untuk divisinya.
  - **Opsi B:** **Relasional Multi-Role (RBAC Penuh).** Membuat tabel `user_roles (user_id, role_name)` di mana satu pengguna dapat memiliki banyak role sekaligus.
  - **Opsi C:** **Strict Single Role.** Setiap akun hanya boleh memiliki 1 role kaku. Jika Ayu ingin mengajukan draf, ia harus menggunakan akun pemohon terpisah.
- **Rekomendasi Teknis:**
  Pilih **Opsi A**. Opsi ini sudah terbukti bekerja sempurna pada pengujian BR-APP-001 (Ayu dapat menyetujui Tahap 1 dan Tahap 2 secara independen tanpa perlu berganti akun atau menambah tabel baru).
- **Konsekuensi:**
  - *Opsi A:* Paling sederhana, nol biaya refactoring, sudah lulus uji otomatis 315 tests.
  - *Opsi B:* Membutuhkan refactoring skema `app_users`, token JWT, dan middleware otorisasi di seluruh endpoint.
  - *Opsi C:* Menimbulkan beban administratif bagi pengguna yang harus mengelola banyak email/login.
- **Prioritas Keputusan:** **`P0` (Kritis untuk Desain Akun)**.

---

### Pertanyaan 1.2: Mekanisme Autentikasi Produksi (SSO Microsoft Entra ID vs Local Credentials)
- **Pertanyaan Bisnis:**
  Kapan sistem procurement akan dihubungkan ke login resmi Microsoft 365 (Entra ID OIDC)? Apakah rilis awal menggunakan akun lokal ber-password?
- **Kondisi Implementasi Saat Ini:**
  Saat ini sistem menggunakan JWT HMAC-SHA256 lokal dengan password terenkripsi pada repositori organisasi, dengan catatan shortcut: `// shortcut: local HMAC-SHA256 JWT, upgrade to Microsoft Entra ID OIDC when IT tenant credentials are provisioned`.
- **Pilihan Jawaban:**
  - **Opsi A (Rekomendasi):** Gunakan **Local Seeded & Managed Accounts** untuk rilis awal, lalu aktifkan Microsoft SSO pada Phase 02 saat kredensial Azure/Entra ID Tenant telah disiapkan oleh Tim IT Pusat.
  - **Opsi B:** Tunda peluncuran sistem sampai integrasi Microsoft Entra ID selesai dikonfigurasi.
- **Rekomendasi Teknis:**
  Pilih **Opsi A**. Memungkinkan peluncuran operasional segera tanpa terhambat birokrasi penyediaan Azure App Registration.
- **Konsekuensi:**
  - *Opsi A:* Akun dikelola oleh Administrator lokal BLC via menu Manajemen Pengguna.
  - *Opsi B:* Peluncuran sistem tertunda menunggu perizinan infrastruktur cloud IT.
- **Prioritas Keputusan:** **`P1` (Tinggi)**.

---

## 3. Kelompok 2: Branches (Pengelolaan Kantor Cabang)

### Pertanyaan 2.1: Migrasi Master Cabang ke Database Relasional
- **Pertanyaan Bisnis:**
  Apakah daftar kantor cabang BLC cukup dibatasi pada 7 cabang yang ada saat ini, atau manajemen memerlukan kemampuan untuk menambah, mengedit, atau menonaktifkan cabang secara mandiri dari aplikasi?
- **Kondisi Implementasi Saat Ini:**
  7 cabang resmi (`Bekasi`, `Cibinong`, `Medan`, `Surabaya`, `Pekanbaru`, `Makassar`, `Samarinda`) di-hardcode pada file TypeScript [`src/domain/branches.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/domain/branches.ts).
- **Pilihan Jawaban:**
  - **Opsi A (Rekomendasi):** Buat tabel database `branches (id, code, name, address, active, created_at)` dengan seed otomatis 7 cabang eksisting, dan sediakan API pengelolaan untuk Administrator.
  - **Opsi B:** Pertahankan sebagai konstanta TypeScript statis jika rencana ekspansi cabang belum ada dalam 12 bulan ke depan.
- **Rekomendasi Teknis:**
  Pilih **Opsi A**. Memberikan fleksibilitas operasional dan memungkinkan penomoran akuntansi berbasis kode cabang resmi (misal: `BKS`, `SBY`).
- **Konsekuensi:**
  - *Opsi A:* Perlu 1 tabel baru dan 1 endpoint API admin. Frontend beralih dari import statis ke fetch dropdown.
  - *Opsi B:* Nol pengerjaan backend, tetapi setiap penambahan cabang wajib melibatkan developer.
- **Prioritas Keputusan:** **`P1` (Tinggi)**.

---

## 4. Kelompok 3: Divisions & Organization (Struktur Organisasi & Divisi)

### Pertanyaan 3.1: Hirarki Subordinasi Unit Organisasi
- **Pertanyaan Bisnis:**
  Apakah BLC membutuhkan struktur hirarki divisi (contoh: Direktorat Operasional membawahi Divisi Logistik dan Divisi Armada), atau struktur unit datar (*flat list*) sudah memadai untuk persetujuan pengadaan?
- **Kondisi Implementasi Saat Ini:**
  Tabel `org_units` menyimpan daftar divisi secara datar tanpa relasi *parent-child*.
- **Pilihan Jawaban:**
  - **Opsi A (Rekomendasi):** Pertahankan **Struktur Datar (*Flat Units*)** untuk alur persetujuan saat ini, karena persetujuan pengadaan hanya bergantung pada Atasan Langsung dari unit terkait.
  - **Opsi B:** Tambahkan kolom `parent_unit_id REFERENCES org_units(id)` untuk mendukung pelaporan struktural bertingkat.
- **Rekomendasi Teknis:**
  Pilih **Opsi A** untuk Phase 01. Jika pelaporan anggaran konsolidasi per direktorat dibutuhkan di masa depan, tambahkan Opsi B.
- **Konsekuensi:**
  - *Opsi A:* Sangat cepat, sederhana, dan meminimalkan kerumitan form pemilihan divisi.
  - *Opsi B:* Menambah kompleksitas antarmuka manajemen organisasi di frontend.
- **Prioritas Keputusan:** **`P2` (Sedang)**.

---

## 5. Kelompok 4: Document Types & Numbering (Jenis & Penomoran Dokumen)

### Pertanyaan 4.1: Penomoran Dokumen Formal per Cabang vs Global
- **Pertanyaan Bisnis:**
  Bagaimana format resmi penomoran dokumen di BLC? Apakah nomor urut bersifat global per tahun (misal: `PO-2026-0001`), atau wajib menyertakan kode cabang dan kode divisi (misal: `PO/BKS/FIN/2026/0001`)?
- **Kondisi Implementasi Saat Ini:**
  Penomoran saat ini menggunakan format global tahunan: `${docType}-${year}-${seq.padStart(4, '0')}` (contoh: `PR-2026-0001`, `PO-2026-0001`) yang dikelola oleh tabel `workspace.sequences`.
- **Pilihan Jawaban:**
  - **Opsi A (Rekomendasi):** Pertahankan format global tahunan `${docType}-${year}-XXXX` yang bersih dan mudah dilacak.
  - **Opsi B:** Ubah menjadi format berbasis cabang dan departemen: `${docType}/${BRANCH_CODE}/${DEPT_CODE}/${YEAR}/${SEQ}`.
- **Rekomendasi Teknis:**
  Pilih **Opsi A** kecuali Bagian Akuntansi Pusat mewajibkan pemisahan nomor buku per cabang pada Opsi B.
- **Konsekuensi:**
  - *Opsi A:* Konsisten dengan data uji yang sudah berjalan dan tidak menimbulkan sequence gap antar-cabang.
  - *Opsi B:* Memerlukan tabel pengelola sequence terpisah per kombinasi cabang dan departemen.
- **Prioritas Keputusan:** **`P1` (Tinggi untuk Kepatuhan Audit)**.

---

## 6. Kelompok 5: Approval Configuration (Kewenangan & Tahapan Persetujuan)

### Pertanyaan 6.1: Delegasi Persetujuan Saat Approver Cuti / Berhalangan
- **Pertanyaan Bisnis:**
  Bagaimana prosedur operasional jika seorang pejabat approver (misal: Atasan Langsung atau salah satu Direksi BoD) sedang cuti atau berhalangan sementara?
- **Kondisi Implementasi Saat Ini:**
  Tersedia fitur *In-Flight Reassignment* ([`server/stage-engine.ts:L389`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/stage-engine.ts#L389)) di mana Administrator resmi dapat mengalihkan approver pada tahap yang sedang `PENDING`, disertai pencatatan alasan wajib pada tabel `approval_stage_reassignments`.
- **Pilihan Jawaban:**
  - **Opsi A (Rekomendasi):** Gunakan mekanisme **Admin-Driven Reassignment** yang sudah ada. Jika approver berhalangan, admin memindahkan tahap tersebut ke pejabat pengganti dengan audit trail.
  - **Opsi B:** Tambahkan fitur **Self-Delegation**, di mana pengguna dapat menetapkan pendelegasian mandiri sebelum mengambil cuti untuk rentang tanggal tertentu.
- **Rekomendasi Teknis:**
  Pilih **Opsi A** untuk peluncuran awal. Mekanisme ini sudah teruji dan aman dari risiko penyalahgunaan wewenang.
- **Konsekuensi:**
  - *Opsi A:* Nol biaya pengembangan tambahan, kontrol terpusat di Administrator.
  - *Opsi B:* Memerlukan tabel baru `approval_delegations` dan pengecekan tanggal dinamis pada engine.
- **Prioritas Keputusan:** **`P2` (Sedang)**.

---

## 7. Kelompok 6: Vendors & Banking (Master Rekanan & Rekening Bank)

### Pertanyaan 7.1: Kewenangan Pendaftaran & Verifikasi Master Vendor
- **Pertanyaan Bisnis:**
  Siapa pihak yang berwenang mendaftarkan dan memverifikasi data vendor rekanan baru ke dalam sistem? Apakah staf pemohon boleh mendaftarkan vendor baru, atau pendaftaran harus melalui Tim Procurement / Keuangan Pusat?
- **Kondisi Implementasi Saat Ini:**
  Tidak ada master vendor. Pemohon mengetik langsung nama dan rekening vendor di formulir PO.
- **Pilihan Jawaban:**
  - **Opsi A (Rekomendasi):** **Centralized Vendor Approval (Procurement Control).** Hanya Administrator atau Tim Keuangan yang dapat mendaftarkan dan mengaktifkan vendor ke master data. Pemohon di cabang hanya dapat memilih vendor yang sudah aktif (*Approved Vendor List*).
  - **Opsi B:** **Open Registration with Verification.** Pemohon dapat mendaftarkan draft vendor baru saat membuat PO, namun PO tidak dapat disetujui sampai vendor tersebut diverifikasi oleh Keuangan.
  - **Opsi C:** Tetap memperbolehkan input teks bebas tanpa master vendor (Status Quo).
- **Rekomendasi Teknis:**
  Pilih **Opsi A** (atau Opsi B jika operasional di cabang membutuhkan kecepatan pendaftaran rekanan lokal darurat). Sangat dilarang memilih Opsi C karena membuka celah penipuan rekening dan duplikasi data.
- **Konsekuensi:**
  - *Opsi A:* Tata kelola keuangan sangat aman, data belanja terstandarisasi, risiko salah transfer 0%.
  - *Opsi C:* Rentan kecurangan dan kesalahan fatal transfer dana perusahaan.
- **Prioritas Keputusan:** **`P0` (Sangat Kritis — Blocker Produksi)**.

---

### Pertanyaan 7.2: Pengelolaan Rekening Kas Perusahaan (Source Bank)
- **Pertanyaan Bisnis:**
  Berapa banyak rekening kas/bank internal yang dimiliki PT BLC Caready untuk pembayaran pengadaan operasional (misal: BCA Pusat, Mandiri Cabang, Kas Kecil Kasir)?
- **Kondisi Implementasi Saat Ini:**
  Kasir/staf keuangan mengetik manual nama rekening sumber saat mencatat pelunasan Payment Voucher (nilai default: `'BCA Operasional Pusat'`).
- **Pilihan Jawaban:**
  - **Opsi A (Rekomendasi):** Buat tabel `company_bank_accounts` yang menyimpan daftar rekening resmi BLC beserta cabangnya. Staf Keuangan wajib memilih dari dropdown rekening aktif saat pelunasan.
  - **Opsi B:** Tetap membiarkan input teks bebas seperti saat ini.
- **Rekomendasi Teknis:**
  Pilih **Opsi A**.
- **Konsekuensi:**
  - *Opsi A:* Mencegah salah ketik nama rekening dan memudahkan rekonsiliasi buku bank bulanan.
  - *Opsi B:* Rawan inkonsistensi nama bank pada laporan kas keluar.
- **Prioritas Keputusan:** **`P0` (Kritis untuk Akurasi Kas)**.

---

## 8. Kelompok 7: Budget & Payment (Anggaran & Mekanisme Pembayaran)

### Pertanyaan 8.1: Validasi Nilai Pengadaan Terhadap Plafon Anggaran (Budget Enforcement)
- **Pertanyaan Bisnis:**
  Apakah sistem wajib menolak secara otomatis pengajuan PR/PO/AV/RB jika total pengeluaran divisi pada bulan berjalan telah melebihi alokasi anggaran (pagu anggaran), atau verifikasi kecukupan anggaran sepenuhnya diserahkan kepada penilaian subjektif Atasan Langsung dan Direksi saat memberikan persetujuan?
- **Kondisi Implementasi Saat Ini:**
  Sistem hanya mencatat label jenis anggaran (`OPEX`, `CAPEX`, `PROJECT`) tanpa pengecekan nominal plafon. Dokumen dengan nilai berapapun dapat disubmit selama formatnya valid.
- **Pilihan Jawaban:**
  - **Opsi A (Rekomendasi):** **Approval-Based Control (SOP Human Approval).** Menyerahkan kontrol pengeluaran kepada evaluasi berjenjang Atasan Langsung, Verifikator Keuangan (Ayu), dan Direksi (Hery & Hashimoto) tanpa hard-stop otomatis dari sistem.
  - **Opsi B:** **System-Enforced Budget Cap.** Sistem wajib memiliki modul anggaran bulanan per divisi dan menolak submission jika saldo anggaran tidak mencukupi (memerlukan memo khusus jika *over-budget*).
- **Rekomendasi Teknis:**
  Pilih **Opsi A** untuk peluncuran awal. Opsi B memerlukan integrasi ke data anggaran akuntansi perusahaan dan modul revisi anggaran yang cukup kompleks.
- **Konsekuensi:**
  - *Opsi A:* Proses bisnis berjalan fleksibel tanpa terhambat data master plafon anggaran yang belum tentu siap dari Tim Budgeting.
  - *Opsi B:* Membutuhkan penambahan tabel master alokasi anggaran dan modul maintenance anggaran tahunan.
- **Prioritas Keputusan:** **`P1` (Tinggi)**.

---

## 9. Kelompok 8: Data Lifecycle & Retention (Arsip & Retensi Dokumen)

### Pertanyaan 9.1: Kebijakan Penghapusan & Retensi Dokumen
- **Pertanyaan Bisnis:**
  Bagaimana kebijakan retensi untuk draf dokumen yang dibatalkan atau dokumen pengadaan yang telah ditolak (*REJECTED*)? Apakah data disimpan selamanya (*forever archive*), atau dihapus setelah periode tertentu?
- **Kondisi Implementasi Saat Ini:**
  Tidak ada fitur *hard delete* untuk dokumen transaksi yang sudah disubmit atau ditolak. Draf dokumen dapat diperbaiki dan diajukan ulang. Seluruh riwayat transaksi tersimpan permanen. Lampiran hanya dapat dihapus jika dokumen masih berstatus `DRAFT`.
- **Pilihan Jawaban:**
  - **Opsi A (Rekomendasi):** **Permanent Retention with Soft Cancellation.** Seluruh dokumen transaksi (Draft, Approved, Rejected, Paid) disimpan permanen untuk kepatuhan audit perpajakan (minimal 10 tahun).
  - **Opsi B:** Fitur penghapusan draf kedaluwarsa (misal: draf yang tidak disentuh lebih dari 90 hari otomatis dipindahkan ke arsip sampah).
- **Rekomendasi Teknis:**
  Pilih **Opsi A**. Sangat sesuai dengan standar audit kepatuhan korporasi dan hukum perpajakan Indonesia.
- **Konsekuensi:**
  - *Opsi A:* Integritas jejak rekam audit terjamin 100%, data historis selalu dapat ditelusuri.
  - *Opsi B:* Memerlukan background worker terjadwal untuk pembersihan data.
- **Prioritas Keputusan:** **`P2` (Sedang)**.

---

## 10. Formulir Ringkasan Pengambilan Keputusan Product Owner

Untuk memudahkan konfirmasi, Product Owner dapat memberikan tanda persetujuan atau arahan pada tabel rekapitulasi di bawah ini:

| No | Topik Keputusan | Pilihan Rekomendasi | Arahan / Keputusan Product Owner | Tanda Tangan / Tanggal |
|:---:|---|:---:|---|:---:|
| 1.1 | Multi-Role vs Single-Role | **Opsi A (Hybrid Contextual)** | `[ ] Setuju  [ ] Opsi Lain: _____` | ____________________ |
| 1.2 | Mekanisme Login Produksi | **Opsi A (Local Managed Seed)** | `[ ] Setuju  [ ] Opsi Lain: _____` | ____________________ |
| 2.1 | Migrasi Master Cabang | **Opsi A (Tabel Database `branches`)** | `[ ] Setuju  [ ] Opsi Lain: _____` | ____________________ |
| 3.1 | Hirarki Subordinasi Divisi | **Opsi A (Flat Unit Organisasi)** | `[ ] Setuju  [ ] Opsi Lain: _____` | ____________________ |
| 4.1 | Format Penomoran Dokumen | **Opsi A (Global Tahunan)** | `[ ] Setuju  [ ] Opsi Lain: _____` | ____________________ |
| 6.1 | Delegasi Approver Cuti | **Opsi A (Admin In-Flight Reassign)** | `[ ] Setuju  [ ] Opsi Lain: _____` | ____________________ |
| 7.1 | Pendaftaran Master Vendor | **Opsi A (Centralized Procurement)** | `[ ] Setuju  [ ] Opsi Lain: _____` | ____________________ |
| 7.2 | Master Rekening Bank BLC | **Opsi A (Tabel `company_bank_accounts`)**| `[ ] Setuju  [ ] Opsi Lain: _____` | ____________________ |
| 8.1 | Kontrol Plafon Anggaran | **Opsi A (Approval-Based SOP)** | `[ ] Setuju  [ ] Opsi Lain: _____` | ____________________ |
| 9.1 | Retensi Data & Arsip | **Opsi A (Permanent Retention)** | `[ ] Setuju  [ ] Opsi Lain: _____` | ____________________ |

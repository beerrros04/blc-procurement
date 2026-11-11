# BLC Procurement Pro — Pemetaan Komposisi 4 Layar Lanjutan (Phase 02 Preparation)

**Status:** PREPARE ONLY — PENDING DASHBOARD PO VISUAL APPROVAL  
**Aturan:** JANGAN MERENDER ULANG LAYAR SEBELUM DASHBOARD DISETUJUI.  
**Dasar Desain:** Meminjam fondasi visual terpadu dari `phase02-frozen-design-foundation.md`.

---

## 1. Layar 01: Procurement Register (`Dokumen Pengadaan`)

### Tujuan
Pusat pencarian, monitoring, dan filter dokumen pengadaan lintas cabang (sesuai kewenangan baca REG-03).

### Komposisi Tata Letak
- **Shell & Navigation:** Shell 24px, sidebar 240px dengan link "Dokumen" berstatus `selected`, header 75px dengan pencarian global.
- **Page Heading:**
  - Title: "Dokumen Pengadaan" (34px bold).
  - Subtitle: "Cari, filter, dan pantau seluruh dokumen yang dapat Anda akses."
  - Action: Tombol primary "＋ Buat pengajuan".
- **Top Quick Metrics (4 Card KPI):**
  - KPI 1: Semua Dokumen (Total hitungan dokumen yang dapat diakses).
  - KPI 2: Perlu Diproses (Dokumen aktif dalam antrean approval / revisi).
  - KPI 3: Menunggu PV (Khusus dokumen selesai approval yang siap diproses Finance).
  - KPI 4: Selesai / Dibayar (Arsip dokumen tuntas).
- **Filter Toolbar Container (Card Surface 18px):**
  - Input pencarian cepat nomor/judul/vendor.
  - Dropdown Tipe Dokumen (Semua, PR, PO, AV, RB, PV, GR).
  - Dropdown Status Dokumen (Semua, Draft, Submitted, In Review, Approved, Rejected, Paid).
  - Dropdown / Filter Chip Cabang (Surabaya, Bekasi, Medan, Cibinong, dll. sesuai master `OFFICIAL_BRANCHES`).
  - Date Range Picker (Bulan / Tahun).
- **Data Table Container (Card Surface 18px):**
  - Kolom: Nomor Dokumen & Badge Tipe | Judul & Keperluan | Cabang | Nilai Nominal (Tabular) | Status Badge | Tahap / Penyetuju Aktif | Aksi ("Lihat Detail").
  - Empty & Loading State: Ilustrasi netral tanpa pergeseran layout.
- **Responsivitas (Mobile <= 800px):**
  - Tabel beralih otomatis menjadi Card List bertumpuk dengan nomor dokumen, status badge di kanan atas, nominal tebal, dan tombol aksi berukuran minimal 44px touch target.

---

## 2. Layar 02: Procurement Form (`Formulir PR / PO / AV / RB`)

### Tujuan
Alur pembuatan dan perbaikan pengajuan pengadaan oleh Pemohon dengan validasi bertahap.

### Komposisi Tata Letak
- **Shell & Navigation:** Layout 2-kolom form standar (Formulir Utama 70% : Ringkasan Estimasi & Tahap 30%).
- **Page Heading:**
  - Breadcrumb: Dokumen > Pengajuan Baru > Purchase Request (PR).
  - Title: "Buat Pengajuan Purchase Request" (34px bold).
  - Subtitle: "Lengkapi data pengadaan dan lampiran sebelum diajukan ke atasan."
  - Status Tag: Badge "Draf" di samping judul.
- **Kolom Kiri — Formulir Utama (Card Surface 18px):**
  - *Seksi 1: Informasi Dasar* — Judul Pengadaan (wajib, focus border crimson/blue), Cabang Pengaju (dropdown dari master branch), Tipe Anggaran (OPEX / CAPEX), Tanggal Kebutuhan.
  - *Seksi 2: Rincian Barang / Kebutuhan* — Tabel baris barang dinamis (Deskripsi, Kuantitas, Satuan, Estimasi Harga Satuan, Subtotal per baris).
  - *Seksi 3: Penomoran Eksternal & Referensi* — Nomor IAM (jika ada), Nomor Dokumen Referensi (PO/PR terkait).
  - *Seksi 4: Penetapan Penyetuju Awal* — Pilihan Atasan Langsung dari master workflow assignment yang valid (mencegah penugasan invalid atau self-approval tanpa audit).
  - *Seksi 5: Lampiran Dokumen* — Drag-and-drop file upload container dengan preview nama file dan ukuran.
  - *Form Actions:* Baris aksi tetap di bawah: Batal (ghost), Simpan Draf (secondary), Ajukan Dokumen (primary crimson).
- **Kolom Kanan — Ringkasan Real-Time (Card Surface 18px, Sticky Desktop):**
  - Total Estimasi Nominal (teks 34px bold tabular).
  - Rincian Kalkulasi: Subtotal barang, perkiraan diskon, estimasi biaya lain.
  - Workflow Preview Step Indicator: Diagram garis vertikal 3 tahap: (1) Atasan Langsung -> (2) Reviewer / Tim Teknis -> (3) Direksi / Finance.
- **Responsivitas (Mobile <= 800px):**
  - Ringkasan nominal bertumpuk di bagian atas form agar pemohon selalu menyadari total nilai pengajuan; form field menjadi 1 kolom vertikal penuh.

---

## 3. Layar 03: Approval Workspace (`Persetujuan Dokumen`)

### Tujuan
Meja kerja terpusat bagi Atasan, Reviewer, dan Direksi untuk meninjau detail pengajuan dan memberikan keputusan (Setuju / Tolak / Kembalikan).

### Komposisi Tata Letak
- **Shell & Navigation:** Master-detail split layout (Daftar Antrean Tugas 35% : Lembar Kerja Detail Dokumen 65%).
- **Kolom Kiri — Antrean Persetujuan (Card Surface 18px):**
  - Tab Switcher: "Menunggu Keputusan Saya" (dengan count badge merah) dan "Riwayat Keputusan Saya".
  - List Item Antrean: Nomor PR/PO/AV/RB, Tipe badge, Nama Pemohon, Cabang, Nominal (teks tebal), Waktu Tunggu / Deadline SLA.
  - Selection State: Kartu yang dipilih mendapat highlight border crimson `#dc2626` dan latar `#fdf0f0`.
- **Kolom Kanan — Lembar Tinjauan Dokumen (Card Surface 18px):**
  - *Header Detail:* Nomor dokumen, status saat ini, tanggal diajukan, total nominal besar.
  - *Stage Engine Tracker:* Komponen horizontal stepper tahapan persetujuan:
    - Stage 1 (Atasan): Selesai (centang hijau + tanggal + nama penyetuju).
    - Stage 2 (Reviewer/Aktif): Aktif berkedip / highlight amber ("Menunggu keputusan Anda").
    - Stage 3 (Direksi): Menunggu giliran.
  - *Tabs Isi Dokumen:* Tab "Rincian Pengadaan", Tab "Lampiran & IAM", Tab "Audit Trail & Catatan".
  - *Kotak Keputusan (Decision Action Bar):*
    - Input Catatan Persetujuan / Alasan Penolakan (wajib diisi saat tolak/revisi).
    - Tombol Aksi: "Tolak Pengajuan" (destructive border red), "Kembalikan Draf ke Pemohon" (secondary amber), "Setujui Pengajuan" (primary crimson `#dc2626`).
- **Responsivitas (Mobile <= 800px):**
  - Tampilan master-detail beralih menjadi navigasi dua langkah: List antrean terlebih dahulu; klik dokumen membuka layar penuh detail persetujuan dengan decision action bar menempel di bottom screen.

---

## 4. Layar 04: Finance & Payment Workspace (`Keuangan & Pembayaran`)

### Tujuan
Ruang kerja operasional tim Keuangan untuk menerbitkan Payment Voucher (PV) atas dokumen yang sudah tervalidasi, mengelola antrean approval PV, dan mencatat transaksi pembayaran bank/kas.

### Komposisi Tata Letak
- **Shell & Navigation:** Dashboard operasional keuangan dengan tab status alur kerja.
- **Page Heading:**
  - Title: "Keuangan & Pembayaran" (34px bold).
  - Subtitle: "Kelola penerbitan Payment Voucher dan pencatatan pembayaran dokumen pengadaan."
  - Action: "Lihat register keuangan".
- **Finance Specific KPIs (4 Cards, Section C):**
  - KPI 1 (Feature Crimson): Dokumen Siap Dibuatkan PV (PR/PO/AV/RB selesai approval penuh, belum ber-PV).
  - KPI 2: PV Dalam Proses Persetujuan (PV diajukan ke Finance Reviewer / Hery / Hashimoto).
  - KPI 3: PV Siap Dibayar (PV berstatus APPROVED penuh, menunggu mutasi bayar).
  - KPI 4: Pembayaran Tercatat Bulan Ini (Nominal dan total payment record berhasil).
- **Panel Kerja 1 — Sumber Dokumen Menunggu PV (Card Surface 18px):**
  - Daftar dokumen sumber dengan nomor dokumen, cabang, nominal validasi, dan tombol "Buat Payment Voucher" (menjalankan alur penerbitan eksplisit oleh Finance, tanpa auto-create siluman).
- **Panel Kerja 2 — Antrean & Catat Pembayaran PV (Card Surface 18px):**
  - Daftar PV yang telah selesai approval (status APPROVED) lengkap dengan nomor rekening vendor, nominal bersih, dan form popover "Catat Pembayaran" (Input: Tanggal Bayar, Nomor Bukti Transfer Bank, Akun Kas/Bank, Catatan).
  - Catatan integritas: Status approval dipisahkan tegas dari status eksekusi pembayaran; tidak mencampur aduk status "APPROVED" dengan status "PAID".
- **Responsivitas (Mobile <= 800px):**
  - Panel bertumpuk rapi 1 kolom, KPI 2x2 grid, tombol aksi ramah sentuhan.

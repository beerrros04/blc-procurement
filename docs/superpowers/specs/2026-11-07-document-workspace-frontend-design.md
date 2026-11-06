# Desain Front-End: Ruang Kerja Siklus Dokumen Pengadaan dan Pembayaran BLC (BLC Procurement)

**Tanggal:** 7 November 2026  
**Status:** Siap untuk Perencanaan Implementasi (Diselaraskan dengan Keputusan Pengguna)  
**Cakupan:** Antarmuka Front-End Interaktif Lengkap (Fase 1 IPD)  

---

## 1. Maksud dan Tujuan (Intent & The Why)

Sistem pengadaan dan persetujuan BLC saat ini berjalan di atas SharePoint Lists dan Microsoft Power Automate. Pengguna membutuhkan sistem antarmuka web modern mandiri yang:
1. Menyediakan fleksibilitas antarmuka pengguna (UI/UX) yang ramah bagi pemohon, penyetuju, dan tim Keuangan.
2. Membebaskan alur bisnis dari keterbatasan bawaan formulir SharePoint dan Power Automate flows yang kaku.
3. Mengakomodasi seluruh variasi formulir pengadaan operasional (PR, PO, AV, RB, RC, PV) beserta aturan bisnis historis yang telah teridentifikasi dari data operasional (ambang batas nilai, kalkulasi pajak, pewarisan data antar-dokumen, dan pembagian peran).
4. Menyediakan prototipe interaktif yang dapat dicoba secara nyata sebelum integrasi backend, database PostgreSQL, dan integrasi Microsoft 365 Entra ID diimplementasikan.

---

## 2. Sasaran, Batasan Cakupan, dan Anti-Sasaran (Goals, Non-Goals, Anti-Goals)

### Sasaran (Goals)
- **Cakupan 6 Dokumen Utuh:** Menyediakan formulir pembuatan dan pengubahan draf untuk seluruh jenis dokumen transaksi:
  1. **PR** (*Purchase Request* / Permintaan Pembelian)
  2. **PO** (*Purchase Order* / Pesanan Pembelian)
  3. **AV** (*Advance* / Uang Muka Operasional & Perjalanan Dinas)
  4. **RB** (*Reimbursement* / Penggantian Biaya)
  5. **RC** (*Realization Cash Advance* / Realisasi Uang Muka)
  6. **PV** (*Payment Voucher* / Voucher Pembayaran oleh Keuangan)
- **Pewarisan Data (Inheritance):** Mendukung pemilihan dokumen induk valid (PO merujuk PR; RC merujuk AV yang berstatus *Paid*; PV merujuk PO/AV/RB yang *Approved* atau selisih RC).
- **Logika & Validasi Bisnis (Business Rules):**
  - PR/PO: Pemeriksaan ambang Rp5.000.000 (bagian IAM pada PR, keharusan ParentPRID pada PO kecuali kategori rutin/mobilisasi).
  - PO: Metode pembayaran transfer bank mewajibkan Bank, No Rekening, dan Nama Penerima. Perhitungan matematis: Subtotal + Biaya Lain - Diskon + PPN (11%) - PPh = Total Terutang.
  - RC: Validasi 1 AV : 1 RC. Evaluasi 3 skenario penyelesaian (Sisa dana kembali, Kurang dana reimburse, atau Sama/nihil).
  - PV: Pemisahan status persetujuan (*Approval Status*) dari status pembayaran (*Payment Status*).
- **Simulasi Alur Persetujuan & Multi-Peran:** Menyediakan switcher peran lokal (*Pemohon*, *Penyetuju: Atasan / Ayu / BOD*, *Keuangan*) untuk mensimulasikan transisi status: Draf → Diajukan → Disetujui/Ditolak (dengan catatan alasan) → Menunggu PV → Dibayar. HR tidak terlibat dalam persetujuan transaksi pengadaan/pembayaran.
- **Penyimpanan Lokal Andal:** Data prototipe tersimpan di `localStorage` dengan penanganan skema yang aman dan teruji unit test (Vitest).

### Di Luar Sasaran (Non-Goals)
- Integrasi jaringan langsung ke SharePoint / Power Automate nyata (prototipe ini adalah aplikasi mandiri).
- Buku besar akuntansi umum (General Ledger), posting jurnal, dan penggantian modul ERP Odoo secara menyeluruh.
- Pembayaran otomatis melalui API bank (catatan pembayaran adalah pencatatan bukti transfer manual).

### Anti-Sasaran (Anti-Goals)
- Mengorbankan kelengkapan kolom formulir operasional demi kesederhanaan prototipe (pengguna secara eksplisit meminta Opsi 1 tanpa pemangkasan kolom/trade-off).
- Mengizinkan mutasi data langsung antar-pengguna tanpa validasi hubungan dokumen induk.
- Menghapus riwayat penolakan atau catatan revisi saat pengajuan diubah.

---

## 3. Batasan Teknis (Constraints)

- **Frontend Stack:** React 19, TypeScript 5.8, Vite 6, CSS native/design system token (tanpa dependensi UI framework eksternal berat yang tidak diperlukan).
- **Pengujian:** Vitest 5 untuk validasi model bisnis, kalkulasi nominal, pewarisan data, dan operasi store.
- **Aksesibilitas & Standar Kerja:** Mendukung navigasi keyboard, modal dialog semantik (`<dialog>`), kontras warna yang jelas, serta penamaan bahasa Indonesia yang konsisten dengan istilah operasional BLC.

---

## 4. Pendekatan yang Dipertimbangkan (Approaches)

1. **Opsi A: Alur Dokumen Terpadu (*Document Workspace & Lifecycle*) — DIPILIH**
   Membangun ruang kerja modular yang langsung mencakup 6 jenis dokumen (PR, PO, AV, RB, RC, PV) dengan skema formulir lengkap, pewarisan data antar-dokumen, dan simulasi transisi status serta peran.
   *Keputusan Pengguna:* Dipilih secara eksplisit "tanpa ada sisi yang di-trade off", artinya seluruh variasi input dan validasi diimplementasikan secara komprehensif.

2. **Opsi B: Rantai Proses Bertahap (*Chained Increments*) — DITOLAK**
   Hanya membangun PR → PO → PV terlebih dahulu, menunda AV/RB/RC. Ditolak karena menunda verifikasi alur uang muka dan realisasi kas yang menjadi titik krusial operasional.

3. **Opsi C: Portal Berorientasi Peran dengan Form Sederhana — DITOLAK**
   Membuat portal multi-peran tetapi memangkas detail kolom formulir. Ditolak karena detail kolom (rekening bank, rincian pajak, 3 hasil RC) adalah inti kebutuhan pengguna.

---

## 5. Rincian Desain Antarmuka & Modul (Detailed Design)

### 5.1 Navigasi Ruang Kerja & Tampilan Utama
- **Sidebar Navigasi:**
  - *Ringkasan & Tugas* (Menampilkan metrik draf saya, dokumen butuh tindakan, dan antrean PV)
  - *Permintaan Pembelian (PR)*
  - *Pesanan Pembelian (PO)*
  - *Uang Muka (AV)*
  - *Penggantian Biaya (RB)*
  - *Realisasi Kas (RC)*
  - *Voucher Pembayaran (PV)*
- **Header & Role Switcher:**
  - Menampilkan profil peran aktif untuk simulasi: `Pemohon (Staff Cabang/Pusat)` | `Penyetuju: Atasan Langsung` | `Penyetuju: Bu Ayu (Finance Verifier)` | `Penyetuju: BOD (Pak Hery & Hashimoto)` | `Keuangan (Pencatatan Pembayaran & Rekonsiliasi PV)`. HR tidak memiliki peran persetujuan dalam siklus pengadaan & pembayaran ini.

### 5.2 Skema Data & Spesifikasi Formulir

#### 1. Purchase Request (PR)
- Kolom: `id`, `docNumber` (format PR-YYYYMM-XXXX), `title`, `branch`, `purpose`, `requiredDate`, `budgetType`, `subtotalAmount`, `isIamRequired` (jika subtotal ≥ Rp5.000.000), `notes`, `status`, `createdAt`.

#### 2. Purchase Order (PO)
- Kolom: `id`, `docNumber` (PO-YYYYMM-XXXX), `parentPrId` (opsional jika rutin/mobilisasi, wajib jika ≥ Rp5.000.000), `poCategory` (*Standard*, *Routine*, *Mobilization*), `title`, `branch`, `purpose`, `requiredDate`, `vendorName`, `paymentMethod` (*Bank Transfer* / *Cash*), `bankDetails` (`bankName`, `accountNumber`, `accountHolder`), `subtotal`, `otherCosts`, `discount`, `ppnRate` (default 11%), `ppnAmount`, `pphRate`, `pphAmount`, `totalAmount`, `status`.

#### 3. Cash Advance (AV)
- Kolom: `id`, `docNumber` (AV-YYYYMM-XXXX), `parentPoId` (opsional), `title`, `branch`, `purpose`, `activityDate`, `paymentDueDate`, `amount`, `disbursementMethod` (*Transfer* / *Cash*), `bankDetails`, `status`.

#### 4. Reimbursement (RB)
- Kolom: `id`, `docNumber` (RB-YYYYMM-XXXX), `title`, `branch`, `expenseCategory`, `transactionDate`, `subtotal`, `otherCosts`, `discount`, `totalAmount`, `beneficiaryBank` (`bankName`, `accountNumber`, `accountHolder`), `attachmentCount`, `status`.

#### 5. Realization Cash Advance (RC)
- Kolom: `id`, `docNumber` (RC-YYYYMM-XXXX), `parentAvId` (wajib, hanya AV berstatus *Paid*), `avOriginalAmount` (diwariskan), `realizedAmount`, `balanceAmount` (`avOriginalAmount - realizedAmount`), `outcomeType`:
  - `SURPLUS` (Realisasi < AV): Sisa dana dikembalikan, wajib lampirkan bukti setor pengembalian.
  - `DEFICIT` (Realisasi > AV): Kekurangan dana, wajib sertakan rekening karyawan untuk penggantian (memicu PV selisih).
  - `EXACT` (Realisasi == AV): Nihil, konfirmasi penyelesaian administrasi.
- Kolom `activityCompletedDate`, `submissionDeadline` (H+2 hari kerja), `status`.

#### 6. Payment Voucher (PV)
- Kolom: `id`, `pvNumber` (PV-YYYYMM-XXXX), `sourceDocType` (`PO` | `AV` | `RB` | `RC_DEFICIT`), `sourceDocId`, `vendorOrPayeeName`, `beneficiaryBank`, `grossAmount`, `pphDeduction`, `netAmountToPay`, `paymentStatus` (*Pending* | *Paid*), `paymentDetails` (`paidAt`, `sourceBank`, `referenceNumber`, `proofUrl`), `approvalStatus`.

### 5.3 Simulasi Alur Transisi Status & Mesin Persetujuan (Approval Engine)
- **Mesin Persetujuan Multi-Tahap (Multi-Stage Pipeline):**
  - Rantai persetujuan operasional utuh berlaku untuk semua pengajuan: **Atasan Langsung → Bu Ayu → BOD (Pak Hery & Hashimoto)**.
  - **Klarifikasi Otorisasi:**
    - HR sama sekali **tidak terlibat** dalam alur persetujuan pengadaan maupun pembayaran.
    - Ambang batas Rp5.000.000 adalah **murni aturan kelengkapan data/lampiran** (kewajiban melampirkan memo IAM pada formulir PR dan keharusan mencantumkan `parentPrId` pada formulir PO), **bukan** pemotong jalur persetujuan. Seluruh dokumen transaksi tetap wajib melalui persetujuan penuh hingga BOD.
  - Tahapan persetujuan sekuensial:
    - **Tahap 1:** Atasan Langsung (Persetujuan operasional dasar pemohon).
    - **Tahap 2:** Bu Ayu (Review dan verifikasi keuangan).
    - **Tahap 3:** BOD: Pak Hery & Hashimoto (Otorisasi direksi, dapat menyetujui secara paralel).
  - Tampilan *Visual Stepper*: Menampilkan progres tahapan persetujuan secara transparan (Tahap 1: Atasan → Tahap 2: Bu Ayu → Tahap 3: BOD) dengan indikator siapa yang sedang menunggu tindakan (*pending*), siapa yang sudah menyetujui (*approved* dengan stempel waktu), atau alasan jika ditolak (*rejected*). Dokumen yang telah disetujui oleh BOD berstatus *Approved* dan masuk ke antrean Keuangan.
- **Tindakan Pemohon:** *Simpan Draf* → *Ajukan Permintaan (Submit)* → *Revisi Draf jika Ditolak*.
- **Siklus Penolakan (Rejection Lifecycle):**
  - Dokumen yang ditolak kembali ke status `DRAFT` secara *in-place* disertai riwayat log audit (*append-only audit log*: waktu, nama penyetuju, dan alasan penolakan wajib). ID transaksi dipertahankan tanpa membuat duplikasi nomor dokumen.
- **Tindakan Penyetuju:** *Setujui (Approve)* → melangkah ke tahap berikutnya; atau *Tolak (Reject dengan Catatan Wajib)*.
- **Kardinalitas Dokumen ke PV (1:1 Settlement):**
  - Setiap dokumen PO, AV, RB yang telah disetujui penuh (*Fully Approved*) atau RC berselisih kurang (*Deficit*) menghasilkan 1 PV definitif untuk pelunasan nilai `netAmountToPay`.
- **Tindakan Keuangan:**
  - PV berstatus *Pre-approved* dari dokumen induk yang sah.
  - Keuangan melakukan verifikasi rekonsiliasi faktur/rekening → Mencatat bukti transfer & bank sumber → Menandai *Paid*.

### 5.4 Model Data & Struktur Rincian
- **Header Finansial & Catatan Baris:**
  - Mengikuti pola SharePoint operasional (Capture 016, 018), formulir menangkap ringkasan angka finansial terverifikasi (`subtotal`, `ppn`, `pph`, `otherCosts`, `discount`, `totalAmount`) dipadukan dengan deskripsi rincian barang/keperluan terstruktur.
  - Struktur data dirancang modular dan extensible sehingga penambahan tabel multi-baris dinamis (*line items*) di masa depan dapat diadopsi tanpa mengubah skema inti.

---

## 6. Apa yang Didelegasikan ke Builder (Left to Builder)

- Pemisahan modular komponen React (misal: `DocumentList`, `DocumentDetailModal`, `FormPR`, `FormPO`, `FormAV`, `FormRB`, `FormRC`, `FormPV`, `RoleBar`).
- Struktur arsitektur store (`src/store/`) untuk mengelola koleksi draf dan dokumen aktif per jenis dengan pemisahan storage key yang rapi atau unified store yang tersinkronisasi.
- Styling kelas CSS yang memperluas design tokens yang sudah ada di [src/style.css](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/src/style.css) tanpa merusak tata letak yang bersih dan teruji.
- Cakupan unit test komprehensif di Vitest untuk memastikan kalkulasi finansial (pajak/diskon/selisih RC) 100% presisi.

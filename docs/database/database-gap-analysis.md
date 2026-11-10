# BUSINESS REQUIREMENTS GAP ANALYSIS — PHASE 00
**Project:** BLC Caready Procurement Pro  
**Audit Scope:** Gap Analysis against Panduan BLC v3 & BR-APP-001 (AUDIT-007)  
**Status:** AUTHORIZED — AUDIT ONLY  
**Review Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Executive Summary & Metodologi Evaluasi

Analisis kesenjangan (*Gap Analysis*) ini membandingkan implementasi arsitektur basis data eksisting terhadap kebutuhan bisnis operasional PT BLC Caready, khususnya:
1. **Panduan BLC Procurement v3 (Oktober 2026)**.
2. **Struktur Organisasi Resmi BLC**.
3. **Business Rule BR-APP-001** (Independent multi-stage approvals & anti-auto-skip).
4. **Hasil Gate Hotfix HF-01 hingga HF02-D**.

### Klasifikasi Tingkat Urgensi (Priority Taxonomy)
- **`P0` (Kritis / Blocker Transaksi & Keamanan):** Kesenjangan yang berpotensi menyebabkan kegagalan otorisasi, kebocoran data, kecurangan transaksi (fraud), atau kerusakan integritas data transaksi. Wajib diselesaikan sebelum peluncuran produksi.
- **`P1` (Tinggi / Blocker Operasional Master Data):** Kesenjangan yang menyulitkan tim operasional mengelola data harian tanpa intervensi teknis/developer (misal: pendaftaran rekanan, penambahan cabang).
- **`P2` (Sedang / Enhancements):** Penyempurnaan arsitektur yang tidak memblokir fungsi inti bisnis dan dapat dijadwalkan pada fase rilis lanjutan.

> [!NOTE]
> **Prinsip Arsitektur:** Tidak semua enumerasi statis (static enum) harus dipindahkan ke database. Nilai yang merepresentasikan mesin status (*finite state machine*) atau kontrak protokol kode (seperti `DocumentStatus`, `DocType`, `PaymentMethod`) lebih aman dipertahankan sebagai enum/const karena penambahannya selalu memerlukan perubahan logika kode aplikasi. Sebaliknya, entitas yang bertambah/berubah secara dinamis dalam bisnis harian (seperti `Vendors`, `Bank Accounts`, `Branches`) **wajib** dipindahkan ke tabel database.

---

## 2. Matriks Gap Analysis Bisnis & Database

| Komponen Bisnis | Implementasi Eksisting Saat Ini | Perilaku Bisnis yang Diwajibkan (Panduan v3 & SOP) | Analisis Kesenjangan (Gap) | Prioritas | Rekomendasi Teknis & Justifikasi Bisnis |
|---|---|---|---|:---:|---|
| **Master Vendor / Rekanan** | Tidak ada tabel `vendors`. Nama vendor dan kode opsional diketik bebas di form PO/GR/PV. | Rekanan pengadaan harus terdaftar resmi, diverifikasi izin & NPWP-nya, memiliki histori PO, serta nomor rekening valid. | **Ketiadaan Master Vendor:** Rawan kesalahan ketik nama vendor yang sama, risiko rekening fiktif/salah transfer, tidak ada jejak performa rekanan. | **`P0`** | **Buat tabel relasional `vendors` dan `vendor_bank_accounts`:** Rekanan dikelola terpusat oleh Admin/Keuangan. Pemohon hanya memilih dari dropdown vendor terverifikasi. |
| **Rekening Bank Perusahaan** | String teks bebas diisi saat pelunasan PV, default `'BCA Operasional Pusat'`. | Pembayaran hanya boleh ditarik dari rekening resmi kas/bank BLC Caready yang sah sesuai cabang dan peruntukan dana. | **Ketiadaan Master Rekening BLC:** Tidak ada validasi daftar rekening internal, risiko kesalahan pencatatan buku kas oleh kasir. | **`P0`** | **Buat tabel `company_bank_accounts`:** Dropdown sumber dana saat pelunasan PV mengambil dari rekening internal aktif BLC. |
| **Pagu & Alokasi Anggaran** | Field teks bebas `budgetType` (`OPEX`, `CAPEX`, `PROJECT`) tanpa validasi nominal. | Setiap departemen/cabang memiliki pagu anggaran tahunan/bulanan. Pengeluaran tidak boleh melebihi plafon tanpa memo khusus. | **Ketiadaan Validasi Anggaran:** Sistem tidak membatasi nilai pengadaan terhadap sisa pagu anggaran divisi. | **`P1`** | **Pertahankan enum `budgetType` di level form, tambahkan modul `budget_allocations` di fase berikutnya:** P0 tidak mendesak jika approval direksi sudah mencakup kontrol pengeluaran. |
| **Master Cabang (Branches)** | Array statis 7 string di [`src/domain/branches.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/domain/branches.ts) (`Bekasi`, `Cibinong`, dll.). | Cabang BLC memiliki kode resmi, alamat kantor, status aktif/tutup, dan keterikatan dengan otorisasi staf cabang. | **Cabang Hardcoded:** Penambahan cabang baru memerlukan compile & redeploy kode sumber. Tidak ada kode akuntansi cabang. | **`P1`** | **Pindahkan cabang ke tabel database `branches`:** Berikan kolom `id`, `code` (e.g. `BKS`), `name`, dan `active`. Tetap sediakan caching pada aplikasi. |
| **Jabatan (Job Positions)** | Tidak ada tabel. Jabatan hanya dicantumkan sebagai keterangan teks di data seed pengguna. | Struktur kepegawaian BLC memiliki jenjang jabatan resmi (Staff, Supervisor, Manager, GM, Direksi) untuk kontrol limit nominal. | **Ketiadaan Master Jabatan:** Tidak ada kontrol hirarki berbasis jabatan formal karyawan. | **`P2`** | **Buat tabel `job_positions` atau kolom `position` pada `app_users`:** Menghubungkan profil pengguna dengan jabatan formal untuk tampilan profil dan audit. |
| **Hirarki Organisasi (Divisi)** | Tabel datar `org_units` tanpa hubungan subordinasi vertikal. | Struktur organisasi korporat memiliki direktorat, divisi, dan departemen berhirarki. | **Ketiadaan Parent-Child Unit:** Semua unit dianggap sejajar, tidak ada agregasi laporan per direktorat. | **`P2`** | **Tambahkan kolom `parent_unit_id` opsional pada `org_units`:** Cukup untuk mendukung subordinasi tanpa merombak logika penugasan supervisor yang sudah berjalan. |
| **Penyimpanan Transaksi Dokumen** | Tersimpan sebagai JSON blob raksasa pada baris tunggal tabel `workspace`. | Transaksi pengadaan ribuan dokumen harus dapat dicari, difilter, dan diagregasi secara performant tanpa risiko lock I/O. | **Keterbatasan Skalabilitas JSON Blob:** Serialisasi seluruh database pada setiap operasi `flush()` dapat menimbulkan latensi dan race condition pada volume tinggi. | **`P1`** | **Dekomposisi bertahap ke tabel relasional:** Pindahkan dokumen PR/PO/AV/RB/PV dan line items ke tabel relasional tersendiri pada Phase 01. |
| **Otorisasi Approval (BR-APP-001)** | Mesin `approval_stages` dan `approval_decisions` di SQLite dengan snapshot immutable. | Aturan BR-APP-001: Satu approver di multi-tahap wajib memutuskan independen, anti-auto-skip, audit trail lengkap. | **Tidak Ada Gap:** Implementasi telah diverifikasi 100% lulus pada HF02-C dan HF02-D (315 automated tests). | **`PASS`** | **Pertahankan arsitektur saat ini:** Struktur stage engine dan snapshot submission sudah sangat patuh dan matang. |
| **Kategori Lampiran Dokumen** | Enum statis `AttachmentCategoryType` dengan validasi file SHA-256 dan storage lokal. | Dokumen wajib dilampiri berkas bukti sah (Foto untuk GR Barang, BAST untuk Jasa, Kuitansi untuk RB, Refund untuk Kasbon). | **Penyimpanan Masih di Disk Lokal Server:** Berkas di `.data/uploads/` rentan hilang jika container ephemeral di-restart tanpa persistent volume. | **`P1`** | **Pertahankan enum kategori (karena terikat aturan validasi kode), alihkan storage fisik ke Cloud/S3/SharePoint:** Sesuai rencana jangka panjang IT. |
| **Jenis & Status Dokumen** | Enum TypeScript statis (`DocType`, `DocumentStatus`). | 7 jenis dokumen dan 6 status siklus hidup dokumen pengadaan. | **Tidak Ada Gap Fungsional:** Perubahan jenis atau status dokumen secara alami memerlukan perubahan kode logika bisnis. | **`P2`** | **Tetap pertahankan sebagai Static Enum / CHECK Constraint:** Tidak ada urgensi memindahkan jenis dokumen ke database karena alur kode terikat erat padanya. |

---

## 3. Rincian Kesenjangan Prioritas P0 (Kritis untuk Produksi)

### GAP-P0-01: Ketiadaan Master Vendor & Rekening Bank Rekanan
- **Dampak Bisnis:**
  - Pemohon pengadaan di berbagai cabang dapat mengetik nama vendor yang sama dengan berbagai variasi penulisan (misal: "PT Astra Otoparts", "Astra Otoparts Tbk", "PT. Astra"). Hal ini mengakibatkan data belanja terfragmentasi dan menyulitkan negosiasi harga korporat (*corporate volume discount*).
  - Nomor rekening bank rekanan disalin manual dari penawaran harga atau PO sebelumnya. Jika ada kesalahan ketik satu digit, pencairan dana akan gagal atau bahkan salah transfer ke pihak lain.
  - Pembayaran ke rekening bank pribadi staf atau pihak fiktif sulit dideteksi secara sistemik tanpa adanya *approved vendor list*.
- **Solusi yang Dibutuhkan:**
  - Tabel `vendors`: `id`, `code`, `name`, `tax_id_npwp`, `address`, `phone`, `email`, `is_active`.
  - Tabel `vendor_bank_accounts`: `id`, `vendor_id`, `bank_name`, `account_number`, `account_holder`, `is_primary`.
  - Pada formulir PO, field `vendorName` diubah dari text input bebas menjadi dropdown pencarian vendor yang aktif.

### GAP-P0-02: Ketiadaan Master Rekening Bank Internal Perusahaan (BLC Cash Accounts)
- **Dampak Bisnis:**
  - Saat Staf Keuangan mengeksekusi pelunasan Payment Voucher ([`FormPVPayment.tsx`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/forms/FormPVPayment.tsx)), sumber rekening diisi manual melalui input teks bebas.
  - Kesalahan pengetikan nama bank/rekening sumber menyulitkan rekonsiliasi bank harian oleh Tim Akuntansi dan Treasury.
- **Solusi yang Dibutuhkan:**
  - Tabel `company_bank_accounts`: `id`, `bank_name`, `account_number`, `account_name`, `branch_assignment`, `is_active`.
  - Dropdown wajib dipilih saat mencatat pembayaran PV.

---

## 4. Kesenjangan Prioritas P1 (Operasional & Skalabilitas)

### GAP-P1-01: Cabang Masih Dikelola via Kode Sumber (Static Enum)
- **Dampak Bisnis:**
  - Pembukaan cabang baru atau perubahan nama kantor cabang mengharuskan tim developer mengubah kode sumber TypeScript dan melakukan redeploy aplikasi.
- **Solusi yang Dibutuhkan:**
  - Migrasikan 7 cabang resmi ke tabel SQLite `branches` dengan skema migrasi otomatis. Tambahkan API administrasi cabang khusus Administrator.

### GAP-P1-02: Penyimpanan Dokumen JSON Blob Terpadu (`workspace.payload`)
- **Dampak Teknis:**
  - Ukuran file database akan cepat membengkak seiring akumulasi transaksi.
  - Setiap pembaruan dokumen memerlukan penulisan ulang seluruh berkas JSON state, menciptakan resiko konkurensi pada lingkungan multi-user yang padat.
- **Solusi yang Dibutuhkan:**
  - Jadwalkan pemisahan dokumen transaksi ke tabel-tabel terpisah (`pr_documents`, `po_documents`, `pv_documents`, `line_items`) pada Phase 01.

---

## 5. Ringkasan Justifikasi: Mengapa Enum Statis Tertentu Harus Dipertahankan

Berdasarkan prinsip kesederhanaan senior (*ponytail*), beberapa komponen **SANGAT TEPAT** dipertahankan sebagai enum statis:

1. **`DocType` (PR, PO, AV, RB, RC, GR, PV):**
   - *Alasan:* Setiap tipe dokumen memiliki logika bisnis, validasi, rumus perhitungan, dan form antarmuka yang sangat unik dan berbeda di kode sumber. Menambahkan jenis dokumen baru di tabel database tanpa menulis kode controller/frontend baru tidak akan membuat dokumen tersebut dapat diproses.
2. **`DocumentStatus` (DRAFT, SUBMITTED, IN_REVIEW, APPROVED, REJECTED, PAID):**
   - *Alasan:* Status dokumen adalah representasi dari finite-state machine (FSM). Transisi antar-status diatur oleh aturan validasi ketat di backend. Mengubah status secara bebas di database berisiko merusak alur kerja.
3. **`AttachmentCategoryType` (IAM_MEMO, QUOTATION, RECEIPT, PHOTO, BAST, dll.):**
   - *Alasan:* Aturan wajib lampiran terikat langsung pada logika kode (misal: GR Jasa memeriksa kategori `BAST`). Kategori baru yang dibuat tanpa integrasi kode tidak akan memiliki efek validasi bisnis.

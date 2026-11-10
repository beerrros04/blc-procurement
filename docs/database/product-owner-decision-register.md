# PRODUCT OWNER DECISION REGISTER — PHASE 00
**Project:** BLC Caready Procurement Pro  
**Document:** Outstanding Business & Architectural Decisions (Section 11)  
**Status:** IN REVIEW — DECISIONS REQUIRED FROM PRODUCT OWNER  
**Review Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Executive Summary

Dokumen ini mencatat keputusan-keputusan bisnis dan arsitektur yang **belum dijawab atau belum difiksasi** oleh Product Owner, yang secara langsung berdampak pada rancangan skema database, aturan otorisasi, dan strategi migrasi.

> [!IMPORTANT]
> Sesuai instruksi tata kelola, **tim teknis / AI agent tidak boleh memutuskan pertanyaan-pertanyaan ini atas nama Product Owner**. Rekomendasi teknis yang disajikan bersifat usulan solusi terbaik (*best practice recommendations*) untuk menjadi bahan pertimbangan Product Owner.

---

## 2. Register Keputusan Bisnis yang Memerlukan Arahan PO

### REG-01: Kewenangan Pengelolaan Master Vendor & Rekening Rekanan
- **Pertanyaan Bisnis:**
  Siapa pihak yang berwenang mendaftarkan vendor baru dan menyetujui perubahan nomor rekening rekanan? Apakah Staf Pemohon di cabang boleh mendaftarkan vendor rekanan lokal, atau pendaftaran harus eksklusif oleh Tim Procurement / Keuangan Pusat?
- **Kondisi Eksisting Saat Ini:**
  Tidak ada master vendor. Pemohon di cabang mana saja dapat mengetik nama dan rekening vendor apa saja pada formulir PO.
- **Pilihan Solusi (Options):**
  - **Opsi A (Rekomendasi):** *Centralized Vendor Master.* Hanya Tim Procurement / Administrator dan Tim Keuangan Pusat yang dapat membuat, mengedit, dan mengaktifkan vendor. Pemohon di cabang hanya dapat memilih vendor yang sudah aktif (*Approved Vendor List*).
  - **Opsi B:** *Decentralized Request with Central Verification.* Pemohon dapat mengajukan draf vendor baru saat membuat PO, namun dokumen PO tidak dapat disetujui sampai vendor tersebut diverifikasi oleh Keuangan Pusat.
  - **Opsi C:** *Unrestricted Local Vendor Creation.* Pemohon langsung dapat mendaftarkan vendor tanpa persetujuan terpusat.
- **Rekomendasi Teknis:** **Opsi A** (atau Opsi B jika kecepatan operasional cabang sangat mendesak). Opsi C sangat tidak disarankan karena rawan fraud rekening fiktif.
- **Dampak Model Data:**
  - Opsi A: Tabel `vendors` hanya membutuhkan kolom status `ACTIVE / INACTIVE`.
  - Opsi B: Tabel `vendors` membutuhkan status `DRAFT / PENDING_VERIFICATION / VERIFIED / REJECTED` dan tracking `requested_by`.
- **Dampak Keamanan:** Menutup celah pencairan dana ke rekening rekanan yang tidak sah.
- **Dampak Migrasi:** Vendor hasil ekstraksi PO eksisting akan berstatus `DRAFT` hingga diverifikasi Keuangan.
- **Prioritas:** **`P0` (Kritis untuk Desain Skema Vendor)**.

---

### REG-02: Kebijakan Persetujuan Perubahan Rekening Vendor (Vendor Bank Account Approval)
- **Pertanyaan Bisnis:**
  Jika vendor yang sudah terdaftar mengalami perubahan nomor rekening bank, apakah perubahan tersebut memerlukan persetujuan khusus (misal: verifikasi dua orang / *maker-checker* dari Tim Keuangan), atau cukup diperbarui langsung oleh Admin?
- **Kondisi Eksisting Saat Ini:**
  Nomor rekening disalin bebas per PO.
- **Pilihan Solusi (Options):**
  - **Opsi A (Rekomendasi):** *Maker-Checker Approval.* Perubahan nomor rekening wajib melampirkan surat keterangan resmi dari vendor dan disetujui oleh Supervisor Keuangan sebelum rekening baru tersebut aktif.
  - **Opsi B:** *Direct Admin Update with Audit Trail.* Admin/Keuangan langsung memperbarui rekening di database dengan pencatatan otomatis pada `vendor_audit`.
- **Rekomendasi Teknis:** **Opsi A**. Kasus penipuan transfer bisnis (*business email compromise*) sering menargetkan perubahan rekening vendor.
- **Dampak Model Data:** Tabel `vendor_bank_accounts` memerlukan kolom `verified_by`, `verified_at`, dan `status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'INACTIVE'`.
- **Dampak Keamanan:** Proteksi terhadap pencurian dana perusahaan melalui perubahan rekening siluman.
- **Dampak Migrasi:** Rendah (hanya mempengaruhi alur mutasi baru).
- **Prioritas:** **`P1` (Tinggi)**.

---

### REG-03: Batasan Visibilitas Transaksi Antar-Cabang (Cross-Branch Data Visibility)
- **Pertanyaan Bisnis:**
  Apakah staf di suatu cabang (misal: Pemohon atau Atasan di Cabang Surabaya) diperbolehkan melihat dokumen pengadaan dari cabang lain (misal: Cabang Bekasi atau Medan)?
- **Kondisi Eksisting Saat Ini:**
  Diatur oleh kolom `app_users.branch_scope`. Jika `branch_scope = '*'`, pengguna dapat melihat dokumen semua cabang. Jika `branch_scope = 'Surabaya'`, pengguna hanya melihat dokumen cabangnya sendiri. Namun, pada level endpoint API tertentu, isolasi ini belum ditegakkan 100% secara konsisten.
- **Pilihan Solusi (Options):**
  - **Opsi A (Rekomendasi):** *Strict Branch Isolation for Branch Roles, Global for Central Roles.* Pemohon dan Atasan cabang hanya dapat melihat dan menyetujui transaksi dari cabang domisilinya (`branch_scope = branch`). Tim Keuangan Pusat, Administrator, dan Direksi memiliki hak visibilitas global (`branch_scope = '*'`).
  - **Opsi B:** *Open Corporate Visibility.* Seluruh karyawan dapat melihat seluruh dokumen pengadaan di semua cabang (transparansi terbuka), namun hak menyetujui tetap dibatasi sesuai penugasan.
- **Rekomendasi Teknis:** **Opsi A**. Melindungi kerahasiaan operasional cabang dan mencegah kebocoran informasi komersial internal.
- **Dampak Model Data:** Penambahan filter `branch_id` wajib pada setiap query dokumen di repository.
- **Dampak Keamanan:** Penegakan *Least Privilege Principle*.
- **Dampak Migrasi:** Rendah (hanya perlu memastikan seluruh seeded users terkonfigurasi `branch_scope` dengan tepat).
- **Prioritas:** **`P1` (Tinggi)**.

---

### REG-04: Hubungan Antara Cabang, Divisi, dan Jabatan (Branch-Division-Position Matrix)
- **Pertanyaan Bisnis:**
  Apakah struktur divisi bersifat global (misal: Divisi "Operation" ada di semua cabang dan memiliki atasan masing-masing), atau unit organisasi didefinisikan spesifik per cabang (misal: "Operation Cabang Surabaya", "Operation Cabang Bekasi")?
- **Kondisi Eksisting Saat Ini:**
  Unit organisasi pada `org_units` bersifat global tanpa kolom cabang (misal: "Finance & Accounting", "Operation"). Namun penugasan atasan pada `org_assignments` bersifat independen per kombinasi unit dan user.
- **Pilihan Solusi (Options):**
  - **Opsi A (Rekomendasi):** *Global Divisions with Branch Assignment Context.* Divisi bersifat umum (misal: "Operation"), namun saat penugasan supervisor (`org_assignments`), penugasan dapat dikaitkan dengan cabang tertentu.
  - **Opsi B:** *Branch-Specific Units.* Setiap cabang memiliki unit organisasinya sendiri di tabel (misal: "Operation - Surabaya", "Operation - Bekasi").
  - **Opsi C:** *Status Quo (Flat Units).* Tetap mempertahankan unit saat ini tanpa mengikat cabang ke divisi, karena atasan sudah ditentukan langsung oleh pemohon dari divisinya.
- **Rekomendasi Teknis:** **Opsi C** untuk saat ini (paling sederhana dan sudah terbukti berhasil), dapat dievolusikan ke Opsi A pada Phase 02.
- **Dampak Model Data:** Jika Opsi A dipilih, `org_assignments` membutuhkan kolom `branch_id REFERENCES branches(id)`.
- **Dampak Keamanan:** Menjamin Atasan Surabaya tidak menyetujui pengajuan staf Bekasi untuk divisi yang sama.
- **Prioritas:** **`P1` (Tinggi)**.

---

### REG-05: Prosedur Penonaktifan Cabang dengan Transaksi Aktif (Branch Deactivation Handling)
- **Pertanyaan Bisnis:**
  Bagaimana prosedur sistem jika sebuah kantor cabang dinonaktifkan (`status = 'INACTIVE'`), namun masih terdapat dokumen pengadaan di cabang tersebut yang sedang dalam proses approval (`SUBMITTED` / `IN_REVIEW`) atau menunggu pembayaran PV (`UNPAID`)?
- **Kondisi Eksisting Saat Ini:**
  Belum ada fitur penonaktifan cabang (cabang masih berupa array statis).
- **Pilihan Solusi (Options):**
  - **Opsi A (Rekomendasi):** *Graceful Inactive with In-Flight Drain.* Penonaktifan cabang memblokir pembuatan dokumen draf baru untuk cabang tersebut (`POST /api/v1/documents`), namun memperbolehkan dokumen yang sedang berjalan untuk diselesaikan sampai status `PAID` atau `REJECTED`.
  - **Opsi B:** *Strict Block.* Penonaktifan cabang memblokir seluruh aktivitas termasuk approval dan pembayaran, mengharuskan Admin memindahkan (*reassign*) seluruh transaksi aktif ke cabang lain terlebih dahulu.
- **Rekomendasi Teknis:** **Opsi A**. Memberikan kontinuitas operasional yang aman tanpa macetnya tagihan vendor.
- **Dampak Model Data:** Logika validasi pada `submitDocument` dan `createDocument` memeriksa `branch.status === 'ACTIVE'`.
- **Dampak Keamanan:** Mencegah pembukaan pengadaan baru pada cabang yang telah ditutup.
- **Prioritas:** **`P2` (Sedang)**.

---

### REG-06: Cakupan Master Rekening Kas Perusahaan (Company Bank Account Scope)
- **Pertanyaan Bisnis:**
  Apakah rekening kas/bank operasional PT BLC Caready bersifat terpusat nasional (seluruh cabang dibayar dari rekening pusat, misal: BCA Pusat), atau setiap cabang memiliki rekening operasionalnya masing-masing (misal: BCA Cabang Surabaya, Mandiri Cabang Medan)?
- **Kondisi Eksisting Saat Ini:**
  Staf Keuangan mengetik manual nama rekening saat pelunasan PV, default: `'BCA Operasional Pusat'`.
- **Pilihan Solusi (Options):**
  - **Opsi A (Rekomendasi):** *Hybrid Scope with Branch Tagging.* Tabel `company_bank_accounts` memiliki kolom `branch_scope`. Nilai `'*'` berarti rekening tersebut dapat digunakan untuk membayar transaksi dari cabang mana saja (rekening pusat). Jika bernilai kode cabang tertentu (misal: `'SBY'`), rekening tersebut hanya muncul untuk pelunasan transaksi cabang Surabaya.
  - **Opsi B:** *Strict Centralized Accounts.* Seluruh transaksi pembayaran procurement hanya menggunakan rekening kas pusat.
- **Rekomendasi Teknis:** **Opsi A**. Fleksibel untuk mendukung rekening kas pusat maupun kas kecil/rekening operasional cabang.
- **Dampak Model Data:** Kolom `branch_scope TEXT NOT NULL DEFAULT '*'` pada tabel `company_bank_accounts`.
- **Dampak Keamanan:** Mencegah kasir cabang menggunakan rekening operasional milik cabang lain.
- **Prioritas:** **`P1` (Tinggi)**.

---

## 3. Formulir Lembar Pengesahan Product Owner

| No | Register ID | Rekomendasi Teknis | Keputusan Product Owner | Catatan Khusus / Tanggal |
|:---:|---|---|---|---|
| 1 | **REG-01** | Opsi A (Centralized Vendor Master) | `[ ] Setuju  [ ] Opsi Lain: _____` | |
| 2 | **REG-02** | Opsi A (Maker-Checker Bank Approval) | `[ ] Setuju  [ ] Opsi Lain: _____` | |
| 3 | **REG-03** | Opsi A (Strict Branch Isolation) | `[ ] Setuju  [ ] Opsi Lain: _____` | |
| 4 | **REG-04** | Opsi C (Flat Units with Context) | `[ ] Setuju  [ ] Opsi Lain: _____` | |
| 5 | **REG-05** | Opsi A (Graceful Inactive Drain) | `[ ] Setuju  [ ] Opsi Lain: _____` | |
| 6 | **REG-06** | Opsi A (Hybrid Scope Account) | `[ ] Setuju  [ ] Opsi Lain: _____` | |

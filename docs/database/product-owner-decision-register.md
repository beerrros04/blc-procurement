# PRODUCT OWNER DECISION REGISTER — PHASE 00
## Final Design Addendum & Decisions Sign-Off

**Project:** BLC Caready Procurement Pro  
**Document:** Product Owner Decisions Register & Review Addendum  
**Status:** DESIGN FINALIZED — AWAITING IMPLEMENTATION APPROVAL  
**Scope:** Finalisasi REG-01–REG-06 dan DB-REVIEW-01–03  
**Implementation:** NOT AUTHORIZED  
**Production Migration:** LOCKED  
**Review Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Executive Summary

Dokumen ini merupakan catatan resmi keputusan arsitektur dan bisnis yang telah **ditetapkan secara final oleh Product Owner** (**ADR-DB-001 s/d ADR-DB-007**, **REG-01 s/d REG-06**, serta resolusi desain **DB-REVIEW-01 s/d DB-REVIEW-03**).

> [!IMPORTANT]
> Seluruh keputusan di bawah ini mengikat (*binding*). Rekomendasi awal tim teknis mengenai *strict branch isolation*, *hierarchical organization*, dan *branch-scoped bank accounts* telah secara resmi **DIGANTIKAN (SUPERSEDED)** oleh keputusan final Product Owner.
> 
> Status dokumen: **DESIGN FINALIZED**. Tidak ada skema baru yang boleh dibuat atau dimigrasikan ke database operasional sebelum adanya otorisasi implementasi resmi dari Product Owner.

---

## 2. Matriks Keputusan Arsitektur Final (Confirmed Architecture Decisions)

| ID | Status | Keputusan Final Product Owner | Catatan Integrasi Teknis |
|---|:---:|---|---|
| **ADR-DB-001** | **DECIDED** | Dynamic Branch Master, Admin-only | Tabel `branches` dikelola eksklusif oleh Administrator. |
| **ADR-DB-002** | **DECIDED** | One primary branch per user | Setiap pengguna memiliki satu `primary_branch_id`. Transaksi historis tetap menyimpan snapshot nama cabang. |
| **ADR-DB-003** | **DECIDED** | One primary application role, approval assignment terpisah | Satu role utama aplikasi (`role`), kewenangan approval dipisahkan ke stage engine sesuai BR-APP-001. |
| **ADR-DB-004** | **DECIDED** | Organization managed by Admin | Struktur unit dan penugasan supervisor dikelola oleh Admin. |
| **ADR-DB-005** | **DECIDED** | Fixed document types | 7 tipe dokumen (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`) dipertahankan sebagai static enum; tidak dibuatkan tabel dinamis. |
| **ADR-DB-006** | **DECIDED** | Centralized vendors and vendor bank accounts | Master vendor dan rekening terpusat. Transaksi historis membekukan data rekening saat submission. |
| **ADR-DB-007** | **DECIDED** | BLC source bank accounts managed by Finance/Admin | Master rekening kas BLC dikelola Admin & Keuangan, berstatus aktif/nonaktif. |
| **REG-01** | **DECIDED** | Vendor master managed by Admin only | Hanya Admin yang berwenang membuat atau mengubah master rekanan. |
| **REG-02** | **DECIDED** | Vendor bank account changes require Maker–Checker | Perubahan nomor rekening vendor wajib melalui pengajuan Maker dan persetujuan Checker berbeda (`maker_user_id !== checker_user_id`). |
| **REG-03** | **DECIDED** | Global document read access | Seluruh pengguna sah dapat melihat dokumen lintas cabang. *Read access ≠ Mutation authority*. |
| **REG-04** | **DECIDED** | Flat organizational units with branch and position attributes | Unit organisasi datar tanpa parent-child hierarchy. Atribut jabatan adalah informasi organisasi, bukan bukti kewenangan approval. |
| **REG-05** | **DECIDED** | Branch deactivation rejected while active transactions exist | Penonaktifan cabang ditolak keras jika masih memiliki transaksi aktif atau kewajiban terbuka. |
| **REG-06** | **DECIDED** | BLC bank accounts available to all branches | Semua rekening aktif PT BLC Caready tersedia untuk seluruh cabang tanpa mandatory `branch_scope`. |

---

## 3. Rincian Keputusan Bisnis REG-01 s/d REG-06

### REG-01: Kewenangan Pengelolaan Master Vendor
- **Status:** **`DECIDED`**
- **Keputusan PO:** **Centralized Vendor Master (Admin-Only)**.
- **Aturan:**
  1. Hanya pengguna dengan peran `ADMIN` yang memiliki hak akses Create dan Update pada tabel `vendors`.
  2. Staf Pemohon di cabang tidak dapat mengetik nama vendor bebas; pemohon memilih dari vendor yang berstatus `ACTIVE`.
  3. Menggantikan usulan draf lokal dari cabang.

---

### REG-02: Kebijakan Persetujuan Perubahan Rekening Vendor (Maker–Checker)
- **Status:** **`DECIDED`**
- **Keputusan PO:** **Wajib Alur Maker–Checker Dua Admin Berbeda**.
- **Aturan:**
  1. Pengajuan perubahan atau penambahan rekening rekanan diajukan oleh Admin sebagai **Maker**.
  2. Pemeriksaan dan persetujuan dilakukan oleh Admin lain sebagai **Checker**.
  3. Validasi ketat: `maker_user_id !== checker_user_id` (larangan *self-approval*).
  4. Entitas baru diusulkan: `vendor_bank_account_change_requests`.
  5. Rekening baru/rekening yang diubah **tidak boleh digunakan** dalam transaksi sebelum disetujui Checker.
  6. Jika hanya ada 1 Admin aktif, perubahan rekening tetap tertahan menunggu Checker sah berikutnya (tidak ada auto-approval fallback).

---

### REG-03: Batasan Visibilitas Transaksi Antar-Cabang (Cross-Branch Visibility)
- **Status:** **`DECIDED`**
- **Keputusan PO:** **Global Document Read Access**.
- **Klarifikasi Penting (Superseded Recommendation):**
  - Rekomendasi teknis awal mengenai *Strict Branch Isolation* (isolasi pembacaan berdasarkan cabang) **RESMI DIGANTIKAN**.
  - Seluruh pengguna terautentikasi dan sah berhak membaca daftar serta detail dokumen di seluruh cabang (*open operational transparency*).
  - **Prinsip Utama: Read Access $\neq$ Mutation Authority.**
    - Read: Seluruh pengguna terautentikasi lintas cabang.
    - Create/Edit: Staf Pemohon sesuai kepemilikan dokumen.
    - Approval: Approver hanya dapat menyetujui stage yang ditugaskan eksplisit kepadanya. Hak membaca dokumen cabang lain tidak memberikan hak menyetujui dokumen tersebut.
    - Finance: Keuangan memproses pencairan dan pencatatan kas sesuai wewenang.
    - Masking finansial tetap ditegakkan: Nomor rekening bank lengkap tetap disamarkan dari pengguna non-finansial.

---

### REG-04: Hubungan Antara Cabang, Divisi, dan Jabatan
- **Status:** **`DECIDED`**
- **Keputusan PO:** **Flat Organizational Units with Branch and Position Attributes**.
- **Klarifikasi Penting (Superseded Recommendation):**
  - Rekomendasi awal mengenai *Hierarchical Parent-Child Units* (`parent_unit_id`) **RESMI DIGANTIKAN**. Sistem menggunakan struktur datar (*flat*).
  - Entitas `org_units` menyimpan unit organisasi datar dengan atribut `branch_id` dan `status`.
  - Atribut jabatan (*job_title* / *position_label*) pada profil pengguna adalah data deskriptif organisasi, **bukan bukti kewenangan approval**.
  - Kantor Pusat atau unit yang melayani multi-cabang direpresentasikan secara eksplisit, bukan diasumsikan dari penamaan.
  - Kewenangan persetujuan atasan tetap menggunakan penugasan organisasi (`org_assignments`) dan snapshot submission.
  - Referensi resmi: Worksheet `Organization_BLC` pada workbook operasional resmi; rekonsiliasi wajib berbasis identifier pengguna yang terverifikasi, bukan pencocokan nama otomatis.

---

### REG-05: Prosedur Penonaktifan Cabang (Controlled Branch Deactivation)
- **Status:** **`DECIDED`**
- **Keputusan PO:** **Tolak Penonaktifan Jika Masih Terdapat Transaksi Aktif (Reject While Active Transactions Exist)**.
- **Klarifikasi Penting (Superseded Recommendation):**
  - Usulan awal mengenai *Graceful Inactive with In-Flight Drain* **RESMI DIGANTIKAN**.
  - Backend wajib memeriksa transaksi aktif dan kewajiban terbuka sebelum penonaktifan cabang disahkan.
  - Transaksi penghambat mencakup:
    - Dokumen berstatus `SUBMITTED` atau `IN_REVIEW`.
    - Dokumen yang membutuhkan tindakan lanjutan.
    - PO, AV, atau RB yang masih membutuhkan PV.
    - PV yang belum lunas (`UNPAID`).
    - Payment workflow yang belum selesai.
    - Draf yang belum dibatalkan/ditutup.
  - Jika ditemukan transaksi aktif, permintaan penonaktifan **DITOLAK KERAS** dengan kode error eksplisit serta rincian jenis dan jumlah transaksi penghambat.
  - Pengguna aktif yang terdaftar pada cabang tersebut wajib direkonsiliasi terlebih dahulu sebelum cabang diizinkan nonaktif.
  - Tidak ada penghapusan fisik (*no hard delete*).

---

### REG-06: Cakupan Master Rekening Kas Perusahaan (Company Bank Account Scope)
- **Status:** **`DECIDED`**
- **Keputusan PO:** **All Active BLC Bank Accounts Available to All Branches**.
- **Klarifikasi Penting (Superseded Recommendation):**
  - Usulan awal mengenai kolom wajib `branch_scope` **RESMI DIGANTIKAN**.
  - Seluruh rekening kas/bank aktif PT BLC Caready bersifat global dan dapat digunakan untuk pelunasan transaksi dari seluruh cabang.
  - Tidak diperlukan pembatasan relasi tabel cabang-rekening.
  - Pengelolaan dilakukan oleh Tim Keuangan dan Admin. Rekening `INACTIVE` tidak boleh dipilih untuk transaksi baru.

---

## 4. Resolusi Masalah Desain Teknis (DB-REVIEW-01 s/d DB-REVIEW-03)

### DB-REVIEW-01: Resolusi Struktur Organisasi
- **Status:** **`DESIGN RESOLVED`**
- **Hasil:**
  - Mengadopsi model unit organisasi datar (*Flat Units*).
  - Skema proposal `org_units` menghapus kolom `parent_unit_id`.
  - Penugasan supervisor menggunakan `org_assignments` yang mengaitkan unit dan supervisor terverifikasi.
  - Pengguna dapat menjadi supervisor untuk beberapa unit jika terdapat penugasan sah.
  - Mutasi cabang atau unit tidak mempengaruhi approval snapshot historis.

---

### DB-REVIEW-02: Snapshot Data Perbankan Transaksi Finansial
- **Status:** **`DESIGN RESOLVED`**
- **Hasil:** **Freeze Transaction Banking Data at Submission**.
  - **PO Lifecycle:**
    - Draft: Pemohon memilih vendor aktif dan rekening vendor aktif yang telah disetujui Maker-Checker.
    - Submission: Menyalin dan membekukan snapshot perbankan secara permanen (`vendor_id`, `legal_name`, `vendor_bank_account_id`, `bank_name`, `account_number`, `account_holder_name`, `snapshot_timestamp`). Perubahan master vendor pasca-submission tidak mengubah data PO. Koreksi wajib melalui alur revisi sah, bukan *silent overwrite*.
  - **PV Lifecycle:**
    - Diterbitkan melalui tindakan eksplisit Tim Keuangan.
    - Untuk PV dari PO: Mengunci rekening tujuan persis dari snapshot PO yang disetujui, bukan mengambil nomor rekening terkini dari master vendor.
    - Pada submission PV: Data rekening dikunci kembali dalam konteks transaksi PV.
  - **Payment Record:**
    - Terhubung ke Approved PV, rekening sumber BLC yang valid, nominal persis, tanggal, dan informasi rekening tujuan dari transaksi PV.
    - Perubahan master rekening perusahaan setelah pembayaran tidak mengubah data historis.
  - **Keamanan:** Penyamaran (*masking*) nomor rekening tetap aktif pada antarmuka umum; data sensitif hanya dapat diakses dengan permission keuangan/admin.

---

### DB-REVIEW-03: Pencadangan & Pemulihan SQLite WAL
- **Status:** **`DESIGN RESOLVED`**
- **Hasil:** **Consistent Backup and Verified Restore Protocol**.
  - Menghindari penyalinan file `.sqlite` aktif secara sembarangan saat WAL aktif.
  - Menggunakan SQLite Online Backup API atau snapshot point-in-time yang konsisten.
  - Menyertakan metadata versi skema, manifest backup, dan checksum SHA-256.
  - Mengoordinasikan pencadangan antara database SQLite dengan penyimpanan dokumen transaksi (`workspace`) dan berkas unggahan (`attachments`).
  - Prosedur pengujian pemulihan wajib: `PRAGMA integrity_check;`, `PRAGMA foreign_key_check;`, validasi integritas transaksi & approval, serta *restore rehearsal* di lingkungan terisolasi.

---

## 5. Ringkasan Status Akhir & Lembar Pengesahan

| Register / Review ID | Status Akhir | Keputusan Binding Product Owner |
|:---:|:---:|---|
| **REG-01** | **DECIDED** | Centralized Vendor Master (Admin-Only). |
| **REG-02** | **DECIDED** | Maker–Checker untuk Penambahan/Perubahan Rekening Vendor (`maker_user_id !== checker_user_id`). |
| **REG-03** | **DECIDED** | Global Document Read Access (Read $\neq$ Mutation Authority; Sensitive Data Masked). |
| **REG-04** | **DECIDED** | Flat Organizational Units with Branch & Position Attributes (No Hierarchy). |
| **REG-05** | **DECIDED** | Controlled Branch Deactivation: Ditolak Keras Jika Transaksi Aktif / Kewajiban Terbuka Ada. |
| **REG-06** | **DECIDED** | Seluruh Rekening Kas BLC Aktif Tersedia untuk Semua Cabang (Tanpa Branch Scope). |
| **DB-REVIEW-01** | **DESIGN RESOLVED** | Resolusi Struktur Organisasi Datar & Penugasan Eksplisit. |
| **DB-REVIEW-02** | **DESIGN RESOLVED** | Pembekuan Snapshot Data Rekening Transaksi Finansial Saat Submission (PO, PV, Payment). |
| **DB-REVIEW-03** | **DESIGN RESOLVED** | Standar Backup Konsisten SQLite WAL & Rehearsal Verifikasi Restore Lintas Storage. |

> [!NOTE]
> Seluruh keputusan telah disinkronkan ke dalam dokumen arsitektur v1:
> - [`docs/database/database-architecture-v1.md`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/docs/database/database-architecture-v1.md)
> - [`docs/database/master-data-schema-proposal.md`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/docs/database/master-data-schema-proposal.md)
> - [`docs/database/relational-integrity-review.md`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/docs/database/relational-integrity-review.md)
> - [`docs/database/database-hardening-plan.md`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/docs/database/database-hardening-plan.md)
> - [`docs/database/migration-and-reconciliation-plan.md`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/docs/database/migration-and-reconciliation-plan.md)
> - [`docs/database/database-test-plan.md`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/docs/database/database-test-plan.md)

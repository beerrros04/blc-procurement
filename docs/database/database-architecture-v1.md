# BLC PROCUREMENT PRO — DATABASE ARCHITECTURE v1
## Master Data Foundation, Relational Integrity & Production Hardening

**Project:** BLC Caready Procurement Pro  
**Document:** Database Architecture Specification v1  
**Status:** AUTHORIZED — DOCUMENTATION REVISION ONLY  
**Reference:** BLC Procurement Guide v3, November 2026  
**Scope:** Finalisasi REG-01–REG-06, DB-REVIEW-01–03, dan Rekonsiliasi REC-01–REC-04  
**Implementation:** LOCKED  
**Production Migration:** LOCKED  
**Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Executive Summary

Dokumen ini merupakan cetak biru (*architectural blueprint*) perkuatan basis data BLC Caready Procurement Pro v1. Perancangan ini didasarkan pada temuan audit komprehensif ([`docs/database/database-inventory-audit.md`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/docs/database/database-inventory-audit.md)), panduan resmi BLC Procurement Guide v3, tujuh keputusan arsitektur awal (**ADR-DB-001** s/d **ADR-DB-007**), enam keputusan bisnis (**REG-01** s/d **REG-06**), tiga resolusi desain (**DB-REVIEW-01** s/d **DB-REVIEW-03**), dan empat rekonsiliasi teknis Project Manager (**REC-01** s/d **REC-04**).

> [!IMPORTANT]
> **Status: AUTHORIZED — DOCUMENTATION REVISION ONLY.**  
> Seluruh rekomendasi teknis awal mengenai *strict branch isolation*, *hierarchical organization*, dan *branch-scoped bank accounts* telah **SECARA RESMI DIGANTIKAN (SUPERSEDED)** oleh keputusan final Product Owner.
> 
> Tidak ada perubahan skema fisik atau eksekusi migrasi yang boleh dijalankan pada database operasional sebelum otorisasi implementasi resmi dikeluarkan.

### Prinsip Utama Arsitektur v1:
1. **Preserve What Works:** Mempertahankan komponen yang telah terbukti tangguh dan lulus uji pada HF02-A hingga HF02-D (khususnya *Independent Stage Engine*, *Submission Snapshot*, dan *Idempotency Records*).
2. **Centralized Master Foundation:** Memindahkan entitas master dinamis (**Cabang**, **Vendor**, **Rekening Vendor**, dan **Rekening Kas Perusahaan**) ke tabel relasional mandiri dengan kontrol Administrator dan Keuangan.
3. **Decoupled Approval Authority:** Menjaga pemisahan tegas antara *Primary Application Role* dengan hak persetujuan approval (*Approval Authority*) sesuai BR-APP-001.
4. **Historical & Financial Immutability (Snapshot Freezing):** Membekukan data rekanan dan perbankan transaksi secara permanen saat submission dokumen; mutasi master data tidak mengubah transaksi historis secara retrospektif (DB-REVIEW-02).
5. **Maker–Checker Dual-Control:** Penambahan dan pembaruan rekening vendor wajib melalui pengajuan Maker dan persetujuan Checker oleh Admin yang berbeda dengan constraint fisik database (REG-02, REC-04).
6. **Global Read Transparency vs. Strict Mutation Authority:** Seluruh pengguna yang terautentikasi dapat membaca dokumen lintas cabang, namun kewenangan approval tetap terkunci pada assigned approver (REG-03).
7. **Controlled Branch Deactivation:** Penonaktifan cabang ditolak keras jika masih memiliki transaksi aktif atau kewajiban terbuka (REG-05).
8. **Document Type Integrity & RC Settlement:** Mempertahankan dokumen `RC` (*Realisasi Kasbon*) sebagai pasangan wajib siklus `AV`, serta memisahkan konsep dokumen transaksi, bukti lampiran, dan `PaymentRecord` (REC-01).
9. **Partial Payment & Multiple PV Support:** Mendukung pembayaran bertahap (termin) pada PO dengan pengendalian saldo terutang (*Outstanding Balance*) untuk mencegah overpayment (REC-02).
10. **Safe Additive Table Migration:** Menjamin migrasi tabel eksisting `org_units` dilakukan secara aditif tanpa merusak struktur dan data operasional (REC-03).

---

## 2. Kepatuhan Terhadap Keputusan Bisnis Product Owner

| Keputusan PO | Komponen Arsitektur v1 | Implementasi Teknis & Mitigasi Risiko |
|---|---|---|
| **ADR-DB-001 — Dynamic Branch Master** | Tabel `branches` | Identifier stabil (`id`), kode cabang unik (`code`), status `ACTIVE/INACTIVE`, mutasi terbatas Admin. |
| **ADR-DB-002 — User Primary Branch** | Kolom `app_users.primary_branch_id` | Menghubungkan pengguna ke `branches(id)`. Transaksi historis tetap menyimpan nama cabang pada saat dibuat. |
| **ADR-DB-003 — Application Roles** | Atribut `app_users.role` + Engine Snapshot | Satu role aplikasi utama. Kewenangan approval diberikan melalui penugasan stage (`approval_stage_assignments`) dan divisi (`org_assignments`), bukan global role. |
| **ADR-DB-004 — Organizational Structure** | Tabel `org_units` + `org_assignments` | Struktur unit organisasi dan penugasan supervisor dikelola oleh Admin. |
| **ADR-DB-005 — Fixed Document Types** | Enum TypeScript `DocType` & SQL Constraints | 7 jenis pengadaan (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`) dipertahankan sebagai enum statis terintegrasi (REC-01). |
| **ADR-DB-006 — Centralized Vendor Master** | Tabel `vendors` & `vendor_bank_accounts` | Vendor master terpusat dengan stable ID, NPWP, deduplikasi kode, dan rekening terhubung. Transaksi historis menyimpan snapshot permanen. |
| **ADR-DB-007 — BLC Source Bank Accounts** | Tabel `company_bank_accounts` | Master rekening kas BLC dikelola Admin/Keuangan dengan status `ACTIVE/INACTIVE`. |
| **REG-01 — Vendor Master Admin-Only** | Tabel `vendors` & Access Gate | Hanya Admin yang berwenang membuat atau mengubah master rekanan. |
| **REG-02 — Maker–Checker Vendor Bank** | Tabel `vendor_bank_account_change_requests` | Perubahan nomor rekening vendor wajib melalui Maker dan Checker Admin berbeda (`maker_user_id !== checker_user_id`). |
| **REG-03 — Global Document Read Access** | Query Layer & Security Filters | Seluruh pengguna sah dapat melihat daftar dan detail dokumen lintas cabang. *Read access ≠ Mutation authority*. Nomor rekening lengkap disamarkan (*masked*). |
| **REG-04 — Flat Organizational Units** | Tabel `org_units` (Flat) | Unit organisasi datar tanpa parent-child hierarchy. Jabatan adalah atribut profil, bukan kewenangan approval. |
| **REG-05 — Controlled Branch Deactivation** | Validation Service & Integrity Checks | Permintaan penonaktifan cabang ditolak jika ada dokumen aktif (`SUBMITTED`/`IN_REVIEW`), PV belum dibayar, atau draf terbuka. |
| **REG-06 — Global BLC Bank Accounts** | Tabel `company_bank_accounts` (No Branch Scope) | Seluruh rekening kas BLC aktif tersedia untuk semua cabang (tanpa mandatory `branch_scope`). |
| **DB-REVIEW-01 — Flat Org Structure** | Domain Organization & Repository | Mengadopsi flat units; pencocokan identitas berbasis user ID terverifikasi (referensi worksheet `Organization_BLC`). |
| **DB-REVIEW-02 — Banking Data Freeze** | Snapshot Mechanism on PO, PV, Payment | Data rekening dibekukan saat submission. PV dari PO mengunci rekening tujuan dari transaksi PO, bukan master vendor. |
| **DB-REVIEW-03 — SQLite WAL Backup & Restore** | Backup & Recovery Protocol | SQLite Online Backup API, verifikasi checksum, koordinasi berkas lampiran, serta pengujian `PRAGMA integrity_check`. |
| **REC-01 — Document Type Reconciliation** | Types, Repository & Domain Models | Mempertahankan `RC` sebagai dokumen pertanggungjawaban kasbon resmi; memisahkan `DocType` dengan `PaymentRecord`. |
| **REC-02 — Partial Payment & Multi-PV** | Invariant & Balance Calculation | Mendukung multi-PV untuk PO bertahap dengan batas maksimum saldo kewajiban (*Outstanding Balance*). |
| **REC-03 — Safe Table Migration** | Migration Engine (`org_units`) | Prosedur aditif berbasis `PRAGMA table_info` dan upgrade `org_schema_version = 3` tanpa merusak tabel eksisting. |
| **REC-04 — Maker–Checker Hardening** | DDL Check Constraints & Atomic API | Penegakan database constraint `maker <> checker` dan pencegahan race condition persetujuan ganda. |

---

## 3. Matriks Klasifikasi Komponen Arsitektur (Architecture Inventory)

| Komponen Arsitektur | Klasifikasi Status | Evaluasi Teknis & Tindakan Hardening v1 |
|---|:---:|---|
| **`app_users`** | `EXISTING — Requires hardening` | Dipertahankan. Ditambahkan kolom `primary_branch_id REFERENCES branches(id)` dan `organization_unit_id`. Atribut `job_title` diperjelas sebagai data deskriptif organisasi. |
| **`app_user_audit`** | `EXISTING — Reuse` | Sangat matang. Dipertahankan tanpa perubahan skema. |
| **`app_retired_user_ids`** | `EXISTING — Reuse` | Mencegah daur ulang ID kanonikal `usr-*`. Dipertahankan. |
| **`org_units`** | `EXISTING — Safe Migration (REC-03)` | Diperluas secara aditif dari 4 kolom eksisting menjadi entitas unit datar dengan penambahan `code`, `branch_id`, `status`, `updated_at`, dan `updated_by`. |
| **`org_assignments`** | `EXISTING — Reuse` | Memiliki partial unique index `org_assignment_active_unique`. Dipertahankan. |
| **`org_assignment_audit`** | `EXISTING — Reuse` | Jejak audit mutasi atasan langsung. Dipertahankan. |
| **`approval_workflows`** | `EXISTING — Reuse` | Instance alur persetujuan per dokumen. Dipertahankan. |
| **`approval_assignment_snapshots`** | `EXISTING — Reuse` | Kunci integritas penugasan submission. Dipertahankan 100%. |
| **`approval_stages`** | `EXISTING — Reuse` | Pengendali status tahapan sekuensial dan paralel. Dipertahankan. |
| **`approval_decisions`** | `EXISTING — Reuse` | Keputusan individual dengan index unik per stage. Dipertahankan. |
| **`approval_stage_reassignments`** | `EXISTING — Reuse` | Audit in-flight reassignment Admin. Dipertahankan. |
| **`approval_idempotency_records`** | `EXISTING — Reuse` | Idempotency multi-dimensi. Dipertahankan. |
| **`cross_storage_sync_records`** | `EXISTING — Reuse` | Pengendali sinkronisasi 2 fase SQLite dan dokumen. Dipertahankan. |
| **`approval_stage_assignments`** | `EXISTING — Reuse` | Penugasan default Stage 2 & 3. Dipertahankan. |
| **`approval_stage_assignment_audit`**| `EXISTING — Reuse` | Audit penugasan stage global. Dipertahankan. |
| **`workspace` (JSON Payload)** | `EXISTING — Requires hardening` | Menampung dokumen transaksi pengadaan. Diperkuat dengan validasi referensial master SQLite dan snapshot perbankan permanen. |
| **`branches`** | `NEW PROPOSAL — Gated` | Tabel baru `branches` untuk master cabang dinamis yang dikelola Admin. |
| **`branch_audit`** | `NEW PROPOSAL — Gated` | Tabel audit perubahan master cabang. |
| **`vendors`** | `NEW PROPOSAL — Gated` | Tabel master vendor terpusat dengan stable ID dan NPWP. |
| **`vendor_bank_accounts`** | `NEW PROPOSAL — Gated` | Tabel rekening vendor dengan status `ACTIVE/INACTIVE`. |
| **`vendor_bank_account_change_requests`** | `NEW PROPOSAL — Hardened (REC-04)` | Entitas Maker–Checker dengan database CHECK constraints dan pencegahan self-approval. |
| **`vendor_audit`** | `NEW PROPOSAL — Gated` | Tabel audit mutasi vendor dan rekening. |
| **`company_bank_accounts`** | `NEW PROPOSAL — Gated` | Tabel rekening kas BLC (global untuk seluruh cabang tanpa mandatory branch scope). |
| **`company_bank_account_audit`** | `NEW PROPOSAL — Gated` | Tabel audit rekening kas perusahaan. |
| **`DocType` (7 Jenis)** | `STATIC ENUM — Confirmed (REC-01)` | `PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV` (7 tipe dokumen statis terpadu). |
| **`DocumentStatus`** | `STATIC ENUM — Confirmed` | Status FSM statis (`DRAFT` s/d `PAID`). |

---

## 4. Rekonsiliasi Rantai Nilai Pengadaan & Pembayaran Sebagian (REC-01 & REC-02)

### 4.1. Rantai Rujukan Dokumen Pengadaan:
```mermaid
flowchart TD
    PR[1. Purchase Requisition] -->|parentPrId (1:1)| PO[2. Purchase Order]
    PO -->|parentPoId (1:N)| GR[3. Goods Receipt]
    PO -->|sourceDocId (1:N Bertahap)| PV_PO[4a. Payment Voucher PO]
    
    AV[Advance Kasbon] -->|sourceDocId (1:1)| PV_AV[4b. Payment Voucher AV]
    PV_AV -->|Pencairan Kasbon| PR_AV[Payment Record AV]
    PR_AV -->|Wajib Pertanggungjawaban| RC[5. Realisasi Kasbon / RC]
    RC -->|Outcome DEFICIT| PV_RC[4c. Payment Voucher Selisih RC]
    
    RB[Reimbursement] -->|sourceDocId (1:1)| PV_RB[4d. Payment Voucher RB]
    
    PV_PO -->|Eksekusi Pembayaran| PAYREC[Payment Record Transaksi]
    PV_RC -->|Eksekusi Pembayaran| PAYREC
    PV_RB -->|Eksekusi Pembayaran| PAYREC
```

### 4.2. Aturan Pembayaran Sebagian & Pembayaran Sisa (REC-02):
1. **Purchase Order (PO):**
   - Mendukung pembayaran bertahap (termin) melalui penerbitan beberapa dokumen PV berurutan.
   - Nilai neto PV baru dibatasi oleh sisa kewajiban terutang:
     $$\text{Outstanding Balance} = \text{PO.totalAmount} - \sum \text{PV.netAmountToPay (committed)} - \sum \text{AV.amount (committed)}$$
   - Permintaan PV baru ditolak dengan HTTP 422 `PV_EXCEEDS_SOURCE_AMOUNT` jika nominalnya melampaui `Outstanding Balance`.
   - Transisi status pembayaran PO:
     - `UNPAID`: Belum ada PV yang dicairkan.
     - `PARTIALLY_PAID`: Minimal 1 PV telah lunas dicairkan (`PAID`), namun `Outstanding Balance > 0`.
     - `PAID`: Seluruh nilai kewajiban PO telah lunas dibayarkan (`Outstanding Balance == 0`).
2. **Advance (AV) & Reimbursement (RB):**
   - Tetap menganut kardinalitas 1:1 terhadap PV. Satu dokumen AV atau RB hanya boleh memiliki tepat satu PV aktif.
3. **Penyelesaian Kasbon (RC):**
   - Skenario `SURPLUS`: Karyawan mengembalikan sisa dana, wajib melampirkan `REFUND_PROOF`, tidak menerbitkan PV.
   - Skenario `EXACT`: Realisasi sama persis dengan kasbon, selesai tanpa mutasi kas.
   - Skenario `DEFICIT`: Biaya riil melebihi kasbon, menerbitkan satu PV selisih dengan `sourceDocType: 'RC_DEFICIT'`.

---

## 5. Invarian Arsitektur Wajib (Mandatory Architectural Invariants)

1. **User Branch Invariant:** Setiap pengguna aktif wajib memiliki `primary_branch_id` yang sah dan berstatus `ACTIVE` pada tabel `branches`.
2. **Role & Approval Decoupling Invariant:** Global role `app_users.role` tidak memberikan hak persetujuan approval secara otomatis. Otorisasi menyetujui transaksi HANYA sah jika ID pengguna cocok dengan `approval_stages.assigned_approver_id`.
3. **Snapshot Immutability Invariant:** Sekali dokumen procurement disubmit, seluruh data approver pada `approval_assignment_snapshots` bersifat permanen dan tidak terpengaruh oleh mutasi master data pengguna atau organisasi.
4. **Transaction Banking Snapshot Invariant (DB-REVIEW-02):** Data rekening vendor pada PO dibekukan saat submission. Dokumen PV dari PO wajib menggunakan rekening tujuan persis dari snapshot PO yang disetujui, bukan mengambil nomor rekening terkini dari master vendor.
5. **Maker–Checker Dual-Control Invariant (REG-02 & REC-04):** Pengajuan perubahan rekening vendor wajib memenuhi `maker_user_id <> checker_user_id` pada level database CHECK constraint. Rekening berstatus pending dilarang digunakan dalam formulir PO.
6. **Outstanding Balance Integrity Invariant (REC-02):** Akumulasi nilai pembayaran PV pada suatu PO tidak boleh melebihi nilai total neto PO. Pembatalan/penolakan PV memulihkan kembali saldo komitmen ke dokumen induk.
7. **Document Classification Invariant (REC-01):** Jenis dokumen transaksi dibatasi pada 7 enum statis (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`). `PaymentRecord` bukan merupakan tipe dokumen dan bukan tahap persetujuan approval.
8. **Safe Additive Migration Invariant (REC-03):** Migrasi terhadap tabel `org_units` yang telah ada wajib mendeteksi skema eksisting melalui `PRAGMA table_info`, menerapkan kolom tambahan secara aditif, dan memperbarui `org_schema_version = 3` di dalam transaksi terisolasi.
9. **Global Read Transparency Invariant (REG-03):** Pengguna terautentikasi dapat melihat daftar dan detail dokumen seluruh cabang, namun hak approval tetap terkunci pada assigned approver stage. Nomor rekening lengkap disamarkan (*masked*).
10. **Controlled Branch Deactivation Invariant (REG-05):** Permintaan penonaktifan cabang wajib ditolak jika masih terdapat transaksi aktif (`SUBMITTED`/`IN_REVIEW`), PV belum dibayar, atau draf terbuka.
11. **Disbursement Account Invariant (REG-06):** Pencatatan pelunasan PV hanya boleh memilih rekening kas BLC yang berstatus `ACTIVE` dari `company_bank_accounts` (tersedia global untuk semua cabang).
12. **Zero Orphan Reference Invariant:** Master data tidak boleh dihapus secara fisik (`soft deactivation only`), memastikan keterlacakan data historis tetap utuh seumur hidup sistem.

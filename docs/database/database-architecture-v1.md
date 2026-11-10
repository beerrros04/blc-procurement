# BLC PROCUREMENT PRO — DATABASE ARCHITECTURE v1
## Master Data Foundation, Relational Integrity & Production Hardening

**Project:** BLC Caready Procurement Pro  
**Document:** Database Architecture Specification v1  
**Status:** DESIGN FINALIZED — AWAITING IMPLEMENTATION APPROVAL  
**Scope:** Finalisasi REG-01–REG-06 dan DB-REVIEW-01–03  
**Implementation:** NOT AUTHORIZED  
**Production Migration:** LOCKED  
**Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Executive Summary

Dokumen ini merupakan cetak biru (*architectural blueprint*) perkuatan basis data BLC Caready Procurement Pro v1. Perancangan ini didasarkan pada temuan audit komprehensif ([`docs/database/database-inventory-audit.md`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/docs/database/database-inventory-audit.md)), tujuh keputusan arsitektur awal (**ADR-DB-001** s/d **ADR-DB-007**), enam keputusan bisnis penutup (**REG-01** s/d **REG-06**), dan tiga resolusi peninjauan arsitektur (**DB-REVIEW-01** s/d **DB-REVIEW-03**).

> [!IMPORTANT]
> **Status Dokumen: DESIGN FINALIZED — IMPLEMENTATION NOT AUTHORIZED.**  
> Seluruh rekomendasi teknis awal mengenai *strict branch isolation*, *hierarchical organization*, dan *branch-scoped bank accounts* telah **SECARA RESMI DIGANTIKAN (SUPERSEDED)** oleh keputusan final Product Owner. Tidak ada perubahan skema fisik atau migrasi produksi yang boleh dijalankan sebelum otorisasi resmi dikeluarkan.

### Prinsip Utama Arsitektur v1:
1. **Preserve What Works:** Mempertahankan komponen yang telah terbukti tangguh dan lulus uji pada HF02-A hingga HF02-D (khususnya *Independent Stage Engine*, *Submission Snapshot*, dan *Idempotency Records*).
2. **Centralized Master Foundation:** Memindahkan entitas master dinamis (**Cabang**, **Vendor**, **Rekening Vendor**, dan **Rekening Kas Perusahaan**) ke tabel relasional mandiri dengan kontrol Administrator dan Keuangan.
3. **Decoupled Approval Authority:** Menjaga pemisahan tegas antara *Primary Application Role* dengan hak persetujuan approval (*Approval Authority*) sesuai BR-APP-001.
4. **Historical & Financial Immutability (Snapshot Freezing):** Membekukan data rekanan dan perbankan transaksi secara permanen saat submission dokumen; mutasi master data tidak mengubah transaksi historis secara retrospektif (DB-REVIEW-02).
5. **Maker–Checker Dual-Control:** Penambahan dan pembaruan rekening vendor wajib melalui pengajuan Maker dan persetujuan Checker oleh Admin yang berbeda (REG-02).
6. **Global Read Transparency vs. Strict Mutation Authority:** Seluruh pengguna yang terautentikasi dapat membaca dokumen lintas cabang, namun kewenangan approval tetap terkunci pada assigned approver (REG-03).
7. **Controlled Branch Deactivation:** Penonaktifan cabang ditolak keras jika masih memiliki transaksi aktif atau kewajiban terbuka (REG-05).
8. **Consistent Storage Backup & Recovery:** Standar pencadangan SQLite WAL terkoordinasi dengan penyimpanan berkas dan verifikasi integritas pemulihan (DB-REVIEW-03).

---

## 2. Kepatuhan Terhadap Keputusan Bisnis Product Owner

| Keputusan PO | Komponen Arsitektur v1 | Implementasi Teknis & Mitigasi Risiko |
|---|---|---|
| **ADR-DB-001 — Dynamic Branch Master** | Tabel `branches` | Identifier stabil (`id`), kode cabang unik (`code`), status `ACTIVE/INACTIVE`, mutasi terbatas Admin. |
| **ADR-DB-002 — User Primary Branch** | Kolom `app_users.primary_branch_id` | Menghubungkan pengguna ke `branches(id)`. Transaksi historis tetap menyimpan nama cabang pada saat dibuat. |
| **ADR-DB-003 — Application Roles** | Atribut `app_users.role` + Engine Snapshot | Satu role aplikasi utama. Kewenangan approval diberikan melalui penugasan stage (`approval_stage_assignments`) dan divisi (`org_assignments`), bukan global role. |
| **ADR-DB-004 — Organizational Structure** | Tabel `org_units` + `org_assignments` | Struktur unit organisasi dan penugasan supervisor dikelola oleh Admin. |
| **ADR-DB-005 — Fixed Document Types** | Enum TypeScript `DocType` & SQL Constraints | 7 jenis pengadaan (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`) dipertahankan sebagai enum statis; tidak diperlukan tabel dinamis. |
| **ADR-DB-006 — Centralized Vendor Master** | Tabel `vendors` & `vendor_bank_accounts` | Vendor master terpusat dengan stable ID, NPWP, deduplikasi kode, dan rekening terhubung. Transaksi historis menyimpan snapshot permanen. |
| **ADR-DB-007 — BLC Source Bank Accounts** | Tabel `company_bank_accounts` | Master rekening kas BLC dikelola Admin/Keuangan dengan status `ACTIVE/INACTIVE`. |
| **REG-01 — Vendor Master Admin-Only** | Tabel `vendors` & Access Gate | Hanya Admin yang berwenang membuat atau mengubah master rekanan. |
| **REG-02 — Maker–Checker Vendor Bank** | Tabel `vendor_bank_account_change_requests` | Perubahan nomor rekening vendor wajib diajukan oleh Admin (Maker) dan disetujui Admin lain (Checker) (`maker_user_id !== checker_user_id`). Rekening pending tidak boleh digunakan. |
| **REG-03 — Global Document Read Access** | Query Layer & Security Filters | Seluruh pengguna sah dapat melihat daftar dan detail dokumen lintas cabang. *Read access ≠ Mutation authority*. Nomor rekening lengkap tetap disamarkan (*masked*). |
| **REG-04 — Flat Organizational Units** | Tabel `org_units` (Flat) | Unit organisasi datar tanpa parent-child hierarchy (menggantikan usulan hirarki). Jabatan adalah atribut profil, bukan kewenangan approval. |
| **REG-05 — Controlled Branch Deactivation** | Validation Service & Integrity Checks | Permintaan penonaktifan cabang ditolak jika ada dokumen aktif (`SUBMITTED`/`IN_REVIEW`), PV belum dibayar, atau draf terbuka. |
| **REG-06 — Global BLC Bank Accounts** | Tabel `company_bank_accounts` (No Branch Scope) | Seluruh rekening kas BLC aktif tersedia untuk semua cabang (menggantikan usulan `branch_scope`). |
| **DB-REVIEW-01 — Flat Org Structure** | Domain Organization & Repository | Mengadopsi flat units; pencocokan identitas berbasis user ID terverifikasi (referensi worksheet `Organization_BLC`), bukan tebakan nama otomatis. |
| **DB-REVIEW-02 — Banking Data Freeze** | Snapshot Mechanism on PO, PV, Payment | Data rekening dibekukan saat submission. PV dari PO mengunci rekening tujuan dari transaksi PO, bukan master vendor. |
| **DB-REVIEW-03 — SQLite WAL Backup & Restore** | Backup & Recovery Protocol | SQLite Online Backup API, verifikasi checksum, koordinasi berkas lampiran, serta pengujian `PRAGMA integrity_check`. |

---

## 3. Matriks Klasifikasi Status Komponen Arsitektur

| Komponen Arsitektur | Klasifikasi Status | Evaluasi Teknis & Tindakan Hardening v1 |
|---|:---:|---|
| **`app_users`** | `EXISTING — Requires hardening` | Dipertahankan. Ditambahkan kolom `primary_branch_id REFERENCES branches(id)` dan `organization_unit_id`. Atribut `job_title` diperjelas sebagai informasi deskriptif. |
| **`app_user_audit`** | `EXISTING — Reuse` | Sangat matang. Dipertahankan tanpa perubahan skema. |
| **`app_retired_user_ids`** | `EXISTING — Reuse` | Mencegah daur ulang ID kanonikal `usr-*`. Dipertahankan. |
| **`org_units`** | `EXISTING — Requires hardening` | Dipertahankan sebagai **Flat Organizational Units** (tanpa `parent_unit_id`). Ditambahkan kolom `code`, `branch_id REFERENCES branches(id)`, dan `status`. |
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
| **`vendor_bank_account_change_requests`** | `NEW PROPOSAL — Gated` | Entitas Maker–Checker untuk perubahan rekening vendor (REG-02). |
| **`vendor_audit`** | `NEW PROPOSAL — Gated` | Tabel audit mutasi vendor dan rekening. |
| **`company_bank_accounts`** | `NEW PROPOSAL — Gated` | Tabel rekening kas BLC (global untuk seluruh cabang). |
| **`company_bank_account_audit`** | `NEW PROPOSAL — Gated` | Tabel audit rekening kas perusahaan. |
| **`DocType` & `DocumentStatus`** | `STATIC ENUM — Confirmed by ADR` | Enum statis TypeScript dan SQL CHECK constraints (ADR-DB-005). |

---

## 4. Topologi Penyimpanan & Strategi Pencadangan (DB-REVIEW-03)

### 4.1. Pemisahan Tanggung Jawab Penyimpanan:
1. **Master Data & Integritas Relasional (SQLite WAL):**
   - Cabang, Pengguna, Organisasi, Vendor, Rekening Bank, Workflow State, dan Idempotency disimpan dalam SQLite dengan foreign keys dan constraint ketat.
2. **Dokumen Transaksi Polimorfik (`workspace` Payload):**
   - Transaksi pengadaan (PR, PO, AV, RB, RC, GR, PV) dikelola dalam repository dengan validasi skema runtime dan snapshot relasional permanen.
3. **Berkas Lampiran (Binary Attachments):**
   - Berkas fisik disimpan di `.data/uploads/` dengan metadata dan checksum SHA-256 tersimpan di database.

### 4.2. Strategi Koordinasi Pencadangan & Pemulihan (Consistent Backup):
- **WAL-Aware Backup:** Menggunakan SQLite Online Backup API (`sqlite3_backup_*` atau utility CLI `.backup`) untuk menghasilkan salinan database yang point-in-time consistent tanpa menghentikan pembacaan.
- **Cross-Storage Coordination:**
  1. Kunci transaksi penulisan baru (*write-quiesce*).
  2. Backup database SQLite (`.backup`).
  3. Snapshot data workspace dokumen JSON.
  4. Snapshot berkas lampiran `.data/uploads/`.
  5. Buat manifest cadangan terpadu dengan stempel waktu ISO 8601 dan checksum SHA-256 untuk seluruh komponen.
- **Restore Verification Protocol:**
  - Database hasil pemulihan wajib lolos uji `PRAGMA integrity_check;` dan `PRAGMA foreign_key_check;`.
  - Simulasi rehearsal pemulihan dilakukan secara berkala di lingkungan terisolasi untuk menguji konsistensi relasi transaksi.

---

## 5. Invarian Arsitektur Wajib (Mandatory Architectural Invariants)

1. **User Branch Invariant:** Setiap pengguna aktif wajib memiliki `primary_branch_id` yang sah dan berstatus `ACTIVE` pada tabel `branches`.
2. **Role & Approval Decoupling Invariant:** Global role `app_users.role` tidak memberikan hak persetujuan approval secara otomatis. Otorisasi menyetujui transaksi HANYA sah jika ID pengguna cocok dengan `approval_stages.assigned_approver_id`.
3. **Snapshot Immutability Invariant:** Sekali dokumen procurement disubmit, seluruh data approver pada `approval_assignment_snapshots` bersifat permanen dan tidak terpengaruh oleh mutasi master data pengguna atau organisasi.
4. **Transaction Banking Snapshot Invariant (DB-REVIEW-02):** Data rekening vendor pada PO dibekukan saat submission. Dokumen PV dari PO wajib menggunakan rekening tujuan persis dari snapshot PO yang disetujui, bukan mengambil nomor rekening terkini dari master vendor.
5. **Maker–Checker Invariant (REG-02):** Penambahan atau pembaruan rekening vendor wajib memiliki `maker_user_id !== checker_user_id`. Rekening berstatus pending dilarang digunakan dalam transaksi.
6. **Global Read Transparency Invariant (REG-03):** Pengguna terautentikasi dapat melihat daftar dan detail dokumen seluruh cabang, namun hak approval tetap terkunci pada assigned approver stage. Nomor rekening lengkap tetap disamarkan (*masked*).
7. **Controlled Branch Deactivation Invariant (REG-05):** Permintaan penonaktifan cabang wajib ditolak jika masih terdapat transaksi aktif (`SUBMITTED`/`IN_REVIEW`), PV belum dibayar, atau draf terbuka.
8. **Disbursement Account Invariant (REG-06):** Pencatatan pelunasan PV hanya boleh memilih rekening kas BLC yang berstatus `ACTIVE` dari `company_bank_accounts` (tersedia global untuk semua cabang).
9. **Zero Orphan Reference Invariant:** Master data tidak boleh dihapus secara fisik (`soft deactivation only`), memastikan keterlacakan data historis tetap utuh seumur hidup sistem.

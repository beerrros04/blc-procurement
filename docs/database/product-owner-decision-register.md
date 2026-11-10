# PRODUCT OWNER DECISION REGISTER — PHASE 00
## Final Design Addendum, Reconciliation & Decisions Sign-Off

**Project:** BLC Caready Procurement Pro  
**Document:** Product Owner Decisions Register, Technical Reconciliation & Review Addendum  
**Status:** AUTHORIZED — DOCUMENTATION REVISION ONLY  
**Reference:** BLC Procurement Guide v3, November 2026  
**Scope:** Finalisasi REG-01–REG-06, DB-REVIEW-01–03, dan Rekonsiliasi REC-01–REC-04  
**Implementation:** LOCKED  
**Production Migration:** LOCKED  
**Review Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Executive Summary

Dokumen ini mencatat seluruh keputusan arsitektur dan bisnis yang telah **ditetapkan secara final oleh Product Owner** (**ADR-DB-001 s/d ADR-DB-007**, **REG-01 s/d REG-06**, **DB-REVIEW-01 s/d DB-REVIEW-03**), serta hasil audit rekonsiliasi teknis terhadap empat temuan akhir Project Manager (**REC-01 s/d REC-04**).

> [!IMPORTANT]
> **Status: AUTHORIZED — DOCUMENTATION REVISION ONLY.**  
> Seluruh rekomendasi teknis awal mengenai *strict branch isolation*, *hierarchical organization*, dan *branch-scoped bank accounts* telah **SECARA RESMI DIGANTIKAN (SUPERSEDED)** oleh keputusan Product Owner. Seluruh fase implementasi fisik (**DB-01 s/d DB-06**) dan migrasi database operasional berstatus **LOCKED** hingga persetujuan implementasi resmi diberikan.

---

## 2. Matriks Keputusan Arsitektur Final (Confirmed Architecture Decisions)

| ID | Status | Keputusan Final Product Owner | Catatan Integrasi Teknis |
|---|:---:|---|---|
| **ADR-DB-001** | **DECIDED** | Dynamic Branch Master, Admin-only | Tabel `branches` dikelola eksklusif oleh Administrator. |
| **ADR-DB-002** | **DECIDED** | One primary branch per user | Setiap pengguna memiliki satu `primary_branch_id`. Transaksi historis menyimpan snapshot nama cabang. |
| **ADR-DB-003** | **DECIDED** | One primary application role, approval assignment terpisah | Satu role utama aplikasi (`role`), kewenangan approval dipisahkan ke stage engine sesuai BR-APP-001. |
| **ADR-DB-004** | **DECIDED** | Organization managed by Admin | Struktur unit dan penugasan supervisor dikelola oleh Admin. |
| **ADR-DB-005** | **DECIDED** | Fixed document types | 7 tipe dokumen transaksi (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`) dipertahankan sebagai static enum; tidak dibuatkan tabel dinamis. |
| **ADR-DB-006** | **DECIDED** | Centralized vendors and vendor bank accounts | Master vendor dan rekening terpusat. Transaksi historis membekukan data rekening saat submission. |
| **ADR-DB-007** | **DECIDED** | BLC source bank accounts managed by Finance/Admin | Master rekening kas BLC dikelola Admin & Keuangan, berstatus aktif/nonaktif. |
| **REG-01** | **DECIDED** | Vendor master managed by Admin only | Hanya Admin yang berwenang membuat atau mengubah master rekanan. |
| **REG-02** | **DECIDED** | Vendor bank account changes require Maker–Checker | Perubahan nomor rekening vendor wajib melalui Maker dan Checker berbeda (`maker_user_id !== checker_user_id`). |
| **REG-03** | **DECIDED** | Global document read access | Seluruh pengguna sah dapat melihat dokumen lintas cabang. *Read access ≠ Mutation authority*. |
| **REG-04** | **DECIDED** | Flat organizational units with branch and position attributes | Unit organisasi datar tanpa parent-child hierarchy. Atribut jabatan adalah informasi organisasi, bukan bukti kewenangan approval. |
| **REG-05** | **DECIDED** | Branch deactivation rejected while active transactions exist | Penonaktifan cabang ditolak keras jika masih memiliki transaksi aktif atau kewajiban terbuka. |
| **REG-06** | **DECIDED** | BLC bank accounts available to all branches | Semua rekening aktif PT BLC Caready tersedia untuk seluruh cabang tanpa mandatory `branch_scope`. |
| **DB-REVIEW-01**| **DESIGN RESOLVED** | Resolusi Struktur Organisasi Datar | Model unit datar; rekonsiliasi berbasis worksheet resmi `Organization_BLC` menggunakan identifier pengguna terverifikasi. |
| **DB-REVIEW-02**| **DESIGN RESOLVED** | Freeze Transaction Banking Data at Submission | Pembekuan snapshot rekening rekanan saat submission PO/PV; PV mengunci rekening dari snapshot PO, bukan master vendor. |
| **DB-REVIEW-03**| **DESIGN RESOLVED** | Consistent SQLite WAL Backup & Verified Restore | Standar pencadangan konsisten WAL-aware (SQLite + workspace JSON + attachments) dan pengujian restore rehearsal. |

---

## 3. Hasil Rekonsiliasi Teknis Akhir (REC-01 s/d REC-04)

### REC-01: Rekonsiliasi Jenis Dokumen (Document Type Reconciliation)
- **Status:** **`RECONCILED & DOCUMENTED`**
- **Temuan & Bukti:**
  - Panduan BLC v3 mencatat alur transaksi: PR, PO, AV, RB, PV, GR, dan Payment Record.
  - Kode aplikasi secara aktif mengimplementasikan `RC` (*Realisasi Kasbon / Pertanggungjawaban Uang Muka*) pada [`src/types/document.ts#L1`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/src/types/document.ts#L1), [`server/repository.ts#L424-L445`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/server/repository.ts#L424-L445), formulir frontend [`src/components/forms/FormRC.tsx`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/src/components/forms/FormRC.tsx), dan integrasi tes [`server/server.test.ts#L119-L134`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/server/server.test.ts#L119-L134).
  - Dalam logika akuntansi BLC, setiap Advance Payment (`AV`) yang telah dicairkan **wajib dipertanggungjawabkan**. Dokumen `RC` menangani 3 kemungkinan hasil penyelesaian (*settlement outcome*): `SURPLUS` (kembalian kas ke perusahaan), `DEFICIT` (biaya melebihi kasbon, memicu penerbitan PV selisih `RC_DEFICIT`), dan `EXACT` (pas/nihil).
- **Pemisahan Konseptual:**
  1. **Transactional Document (`DocType`):** `PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`. Memiliki nomor dokumen resmi, lifecycle status, approval workflow, dan audit trail.
  2. **Supporting Attachments (`AttachmentCategoryType`):** Berkas bukti pendukung transaksi (`IAM_MEMO`, `QUOTATION`, `INVOICE`, `RECEIPT`, `PHOTO`, `BAST`, `REFUND_PROOF`, `PAYMENT_PROOF`, `SUPPORTING`, `OTHER`).
  3. **Payment Transaction Record (`PaymentRecord`):** Rekaman eksekusi pencairan kas untuk PV yang telah disetujui, **bukan** jenis dokumen `DocType` tersendiri dan **bukan** tahapan approval baru.
- **Keputusan:** Dokumen `RC` **tetap dipertahankan 100%** di dalam sistem sebagai jenis dokumen resmi pendamping `AV`.

---

### REC-02: Integritas Pembayaran Sebagian & Multi-PV (Partial Payment & Multiple PV)
- **Status:** **`RECONCILED & INVARIANTS DESIGNED`**
- **Temuan & Bukti:**
  - Panduan BLC v3 mengizinkan pembayaran bertahap (termin/sebagian dan pelunasan sisa) pada PO.
  - Kode aplikasi pada [`server/repository.ts#L1085-L1096`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/server/repository.ts#L1085-L1096) (`getCommittedAmountOnPo`) telah menghitung komitmen dana PV dan AV sebelumnya. Namun, dokumen rancangan sebelumnya sempat mencantumkan batasan penyederhanaan "Satu dokumen sumber hanya boleh memiliki tepat satu PV aktif" yang bertentangan dengan kebutuhan pembayaran bertahap.
  - Untuk AV dan RB, batasannya tetap 1 PV karena nilai kasbon/reimbursement bersifat tunggal.
- **Invarian Pembayaran Sebagian yang Dirancang:**
  1. **Outstanding Balance Limit:**
     $$\text{Outstanding Balance} = \text{Source PO Total Net} - \sum \text{PV.netAmountToPay (status } \neq \text{REJECTED, } \neq \text{DRAFT)} - \sum \text{AV.amount (status } \neq \text{REJECTED)}$$
  2. **Pencegahan Overpayment & Double Payment:** Nilai neto PV baru tidak boleh melebihi `Outstanding Balance`.
  3. **Concurrency Protection:** Transaksi penerbitan PV mengunci dokumen PO sumber di database untuk mencegah dua staf keuangan membuat PV parsial secara bersamaan yang bila digabung melebihi sisa kewajiban.
  4. **Pelepasan Komitmen Ditolak:** Jika suatu PV berstatus `REJECTED`, nilai komitmennya dilepaskan kembali secara otomatis ke `Outstanding Balance`.
  5. **Status Pembayaran Bertingkat:** PO berstatus pembayaran `PARTIALLY_PAID` saat minimal 1 PV lunas namun saldo sisa $> 0$, dan berstatus `PAID` saat seluruh kewajiban telah lunas dicairkan.

---

### REC-03: Prosedur Migrasi Aman Tabel Eksisting `org_units` (Existing Table Migration)
- **Status:** **`RECONCILED & RUNBOOK DESIGNED`**
- **Temuan & Bukti:**
  - Tabel `org_units` saat ini telah terpasang fisik di database dengan skema v1: `(id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, created_by TEXT NOT NULL)` ([`server/organization.ts#L49`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/server/organization.ts#L49)).
  - Modul [`server/organization.ts#L64-L105`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/server/organization.ts#L64-L105) menerapkan fungsi penegak `schemaState(db)` yang sangat ketat: jika definisi tabel berbeda tanpa migrasi versi yang sah pada `org_schema_version`, sistem menyatakan database `INCOMPATIBLE` (HTTP 503).
  - Perintah `CREATE TABLE IF NOT EXISTS org_units` tidak dapat menambahkan kolom baru (`code`, `branch_id`, `status`, `updated_at`, `updated_by`).
- **Prosedur Migrasi Aditif Aman (Phase DB-02):**
  1. Periksa `PRAGMA table_info(org_units)`.
  2. Tambahkan kolom yang belum ada menggunakan `ALTER TABLE org_units ADD COLUMN ...`.
  3. Buat indeks parsial/unik baru secara terpisah: `CREATE UNIQUE INDEX IF NOT EXISTS idx_org_units_code ON org_units(code) WHERE code IS NOT NULL;`.
  4. Perbarui `org_schema_version` dari `2` menjadi `3`.
  5. Seluruh proses dibungkus dalam transaksi `BEGIN IMMEDIATE ... COMMIT` dengan rollback otomatis jika terjadi kegagalan.

---

### REC-04: Penguatan Integritas Maker–Checker (Maker–Checker Hardening)
- **Status:** **`RECONCILED & CONSTRAINTS DESIGNED`**
- **Temuan & Bukti:**
  - Entitas `vendor_bank_account_change_requests` diusulkan untuk memenuhi **REG-02**.
  - Diperlukan proteksi ganda: level database (SQL CHECK constraint) dan level backend application logic.
- **Spesifikasi Integritas:**
  1. **Database Check Constraint:**
     ```sql
     CHECK (checker_user_id IS NULL OR maker_user_id <> checker_user_id)
     CHECK ((status = 'PENDING' AND checker_user_id IS NULL AND reviewed_at IS NULL) OR 
            (status IN ('APPROVED', 'REJECTED') AND checker_user_id IS NOT NULL AND reviewed_at IS NOT NULL))
     ```
  2. **Backend Dual-Control Gate:** Endpoint review memverifikasi token Checker berstatus `ADMIN` aktif dan menolak jika `checkerUserId === request.makerUserId` (HTTP 422).
  3. **Concurrency Protection:** Keputusan review dieksekusi dengan kueri atomik `WHERE id = ? AND status = 'PENDING'`. Jika baris yang terpengaruh bernilai 0, permintaan ditolak dengan HTTP 409 `CHANGE_REQUEST_ALREADY_REVIEWED`.

---

## 4. Item Keputusan Bisnis yang Masih Terbuka (Remaining Business Decisions)

Seluruh isu arsitektural telah terselesaikan pada level perancangan. Berikut adalah dua (2) detail kebijakan operasional yang ditandai untuk difinalisasi sebelum fase DB-04 dan DB-05:

| ID Keputusan | Topik Kebijakan | Pertanyaan Spesifik untuk Product Owner | Rekomendasi Solusi Teknis |
|:---:|---|---|---|
| **BD-REC-01** | *Masa Berlaku Perubahan Rekening Vendor (Change Request Expiry)* | Apakah pengajuan perubahan rekening vendor yang berstatus `PENDING` memiliki batas waktu kedaluwarsa (misal: otomatis batal setelah 14 hari kerja jika belum disetujui Checker)? | Diberikan batas waktu 14 hari kalender; setelah itu status berubah menjadi `EXPIRED` untuk mencegah penumpukan antrean usang. |
| **BD-REC-02** | *Toleransi Pembulatan Pajak PV Termin (Rounding Tolerance)* | Pada pembayaran bertahap (termin PO), apakah potongan PPh dipotong proporsional di setiap termin atau seluruhnya diselesaikan pada termin pelunasan terakhir? | Dipotong proporsional per termin sesuai nilai tagihan masing-masing termin, dengan rekonsiliasi selisih pembulatan rupiah di termin terakhir. |

---

## 5. Ringkasan Status Dokumen & Pengesahan

| Komponen | Status Dokumen | Otorisasi Operasional |
|---|:---:|:---:|
| **Dokumentasi Arsitektur Database v1** | `DESIGN FINALIZED` | **AUTHORIZED (Documentation Revision Only)** |
| **Fase Implementasi DB-01 s/d DB-06** | `SPECIFIED & GATED` | **LOCKED (Awaiting PO Authorization)** |
| **Migrasi Database Fisik Produksi** | `NOT STARTED` | **LOCKED (Strict Freeze)** |
| **Baseline 315 Automated Tests** | `VERIFIED 100% PASS` | **PRESERVED** |

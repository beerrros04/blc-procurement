# DATABASE TEST PLAN — PHASE 00
## Master Data Hardening Automated Test Design (Task DBH-007 & REC-01 s/d REC-04)

**Project:** BLC Caready Procurement Pro  
**Document:** Master Data Hardening Automated Test Design (Task DBH-007)  
**Status:** AUTHORIZED — DOCUMENTATION REVISION ONLY  
**Reference:** BLC Procurement Guide v3, November 2026  
**Scope:** Finalisasi REG-01–REG-06, DB-REVIEW-01–03, dan Rekonsiliasi REC-01–REC-04  
**Implementation:** LOCKED  
**Production Migration:** LOCKED  
**Review Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Executive Summary

Dokumen ini merumuskan rancangan pengujian otomatis komprehensif (*Automated Test Plan*) untuk memvalidasi fase pengerjaan **DB-01 hingga DB-06**. Rencana pengujian dirancang untuk memastikan seluruh batasan relasional, kontrol otorisasi, kekebalan snapshot data perbankan transaksi, pembayaran bertahap PO, migrasi aman tabel eksisting, dan keandalan pencadangan terkoordinasi dapat diverifikasi secara objektif.

> [!IMPORTANT]
> Sesuai mandat fase **DESIGN & VERIFICATION ONLY**, seluruh rancangan uji di bawah ini berstatus **`DESIGNED / SPECIFIED`** dan **TIDAK DIKLAIM SEBAGAI PASS DI KODE APLIKASI** sampai fase implementasi resmi disahkan oleh Product Owner. Baseline automated tests eksisting yang saat ini aktif dan lulus 100% adalah **315 pengujian** (30 file tes).

---

## 2. Kategori 1: Master Data Integrity Test Suite

### 2.1. Test Cases Master Cabang (`branches` — ADR-DB-001 & REG-05)
- **TEST-MD-01 (Duplicate Branch Code):**
  - *Deskripsi:* Mencoba membuat cabang baru dengan kode cabang yang sudah ada (misal: mendaftarkan `code: 'BKS'` untuk cabang kedua).
  - *Expected Result:* Database menolak dengan error `SQLITE_CONSTRAINT_UNIQUE` atau aplikasi mengembalikan HTTP 409 `DUPLICATE_BRANCH_CODE`.
- **TEST-MD-02 (Invalid Primary Branch Reference):**
  - *Deskripsi:* Mendaftarkan pengguna baru dengan `primary_branch_id` yang tidak ada di tabel `branches` (misal: `'brc-unknown'`).
  - *Expected Result:* Database menolak dengan error `SQLITE_CONSTRAINT_FOREIGNKEY` saat `PRAGMA foreign_keys=ON`.
- **TEST-MD-03 (Controlled Branch Deactivation Rejection — REG-05):**
  - *Deskripsi:* Mencoba menonaktifkan cabang (`status = 'INACTIVE'`) saat masih terdapat dokumen berstatus `SUBMITTED`/`IN_REVIEW`, PO/AV/RB tanpa PV, atau PV yang belum lunas (`UNPAID`).
  - *Expected Result:* Backend menolak permintaan dengan HTTP 409 `BRANCH_HAS_ACTIVE_TRANSACTIONS`, menyertakan jumlah dan rincian transaksi penghambat.
- **TEST-MD-04 (Prevent Destructive Branch Deletion):**
  - *Deskripsi:* Menjalankan perintah `DELETE FROM branches WHERE id = 'brc-bks'` saat cabang tersebut telah memiliki pengguna atau dokumen.
  - *Expected Result:* Ditolak dengan `SQLITE_CONSTRAINT_TRIGGER` atau `FOREIGN KEY RESTRICT`.

### 2.2. Test Cases Master Organisasi & Migrasi Aman (`org_units` — REG-04 & REC-03)
- **TEST-MD-05 (User Single Primary Role):**
  - *Deskripsi:* Memperbarui pengguna dengan string role di luar daftar resmi yang diizinkan.
  - *Expected Result:* Ditolak dengan HTTP 422 `INVALID_USER_ROLE`.
- **TEST-MD-06 (Safe Additive org_units Migration — REC-03):**
  - *Deskripsi:* Menjalankan prosedur migrasi `migrateOrgUnitsToV3` pada database yang sudah memiliki tabel `org_units` eksisting v1/v2.
  - *Expected Result:* Kolom `code`, `branch_id`, `status`, `updated_at`, dan `updated_by` ditambahkan secara aditif tanpa kehilangan satu pun baris data unit eksisting; `org_schema_version` diperbarui menjadi `3`.
- **TEST-MD-07 (Idempotent Migration Execution — REC-03):**
  - *Deskripsi:* Menjalankan kembali prosedur `migrateOrgUnitsToV3` sebanyak 2 kali setelah berhasil.
  - *Expected Result:* Fungsi keluar tanpa error (*noop*) dan tidak melempar `duplicate column name`.

---

## 3. Kategori 2: Security, Authorization & Maker–Checker Test Suite (REC-04)

- **TEST-SEC-01 (Non-Admin Branch Modification Rejected):**
  - *Deskripsi:* Pengguna dengan peran `PEMOHON`, `ATASAN`, atau `KEUANGAN` memanggil endpoint `POST /api/v1/branches`.
  - *Expected Result:* Ditolak dengan HTTP 403 `FORBIDDEN_ROLE`.
- **TEST-SEC-02 (Non-Admin Vendor Creation Rejected — REG-01):**
  - *Deskripsi:* Pengguna non-Admin mencoba membuat atau mengubah entitas rekanan di `vendors`.
  - *Expected Result:* Ditolak dengan HTTP 403 `FORBIDDEN_ROLE`.
- **TEST-SEC-03 (Maker–Checker Database Constraint Rejection — REC-04):**
  - *Deskripsi:* Mencoba memasukkan baris data pada `vendor_bank_account_change_requests` dengan `maker_user_id === checker_user_id`.
  - *Expected Result:* SQLite menolak secara fisik dengan `SQLITE_CONSTRAINT_CHECK` (`chk_maker_checker_distinct`).
- **TEST-SEC-04 (Maker–Checker Backend Self-Approval Rejection — REC-04):**
  - *Deskripsi:* Admin yang bertindak sebagai pembuat pengajuan (`maker_user_id`) memanggil endpoint review persetujuan untuk pengajuannya sendiri.
  - *Expected Result:* Backend menolak dengan HTTP 422 `MAKER_CHECKER_SELF_APPROVAL_FORBIDDEN`.
- **TEST-SEC-05 (Maker–Checker Concurrency Protection — REC-04):**
  - *Deskripsi:* Dua admin checker mencoba menyetujui request perubahan rekening yang sama secara bersamaan (*concurrent double-approval*).
  - *Expected Result:* Tepat satu permintaan berhasil (HTTP 200), sementara permintaan kedua ditolak dengan HTTP 409 `CHANGE_REQUEST_ALREADY_REVIEWED`.
- **TEST-SEC-06 (Pending Maker–Checker Account Blocked from PO — REG-02 & REC-04):**
  - *Deskripsi:* Staf pemohon mencoba memilih rekening vendor yang masih berstatus `PENDING` pada change request dalam formulir PO.
  - *Expected Result:* Backend menolak dengan HTTP 422 `VENDOR_BANK_ACCOUNT_NOT_APPROVED`.
- **TEST-SEC-07 (Global Document Read Access with Decoupled Approval — REG-03):**
  - *Deskripsi:* Pengguna terautentikasi dari Cabang Surabaya mengakses daftar dan detail dokumen Cabang Bekasi, kemudian mencoba menyetujui tahapan approval dokumen tersebut tanpa penugasan eksplisit.
  - *Expected Result:* Pembacaan dokumen berhasil (HTTP 200), namun upaya approval ditolak keras dengan HTTP 403 `FORBIDDEN_APPROVER`.
- **TEST-SEC-08 (Sensitive Banking Number Masking — REG-03 & DB-REVIEW-02):**
  - *Deskripsi:* Pengguna dengan peran pemohon membaca detail dokumen transaksi yang memuat rekening bank rekanan.
  - *Expected Result:* Nomor rekening disamarkan pada respon JSON (misal: `******1234`), kecuali bagi pengguna dengan wewenang audit keuangan.

---

## 4. Kategori 3: Historical & Financial Integrity Test Suite (REC-01 & REC-02)

- **TEST-HIST-01 (PO Multi-PV Sequential Partial Payments — REC-02):**
  - *Deskripsi:* PO senilai Rp 100.000.000 diterbitkan. Keuangan membuat PV Termin 1 senilai Rp 30.000.000, lalu PV Termin 2 senilai Rp 50.000.000, lalu PV Pelunasan senilai Rp 20.000.000.
  - *Expected Result:* Ketiga PV berhasil dibuat berurutan; saldo terutang berkurang secara konsisten hingga Rp 0; status pembayaran PO berubah dari `UNPAID` $\rightarrow$ `PARTIALLY_PAID` $\rightarrow$ `PAID`.
- **TEST-HIST-02 (PO Overpayment Rejection — REC-02):**
  - *Deskripsi:* PO bernilai neto Rp 50.000.000 telah memiliki PV aktif Rp 40.000.000. Keuangan mencoba menerbitkan PV kedua sebesar Rp 15.000.000.
  - *Expected Result:* Ditolak dengan HTTP 422 `PV_EXCEEDS_SOURCE_AMOUNT` (sisa saldo hanya Rp 10.000.000).
- **TEST-HIST-03 (Rejected PV Releases Committed Amount — REC-02):**
  - *Deskripsi:* PV kedua sebesar Rp 10.000.000 pada tes sebelumnya ditolak oleh Direksi (`REJECTED`).
  - *Expected Result:* Saldo komitmen dilepaskan kembali secara otomatis; sisa saldo PO kembali menjadi Rp 10.000.000 dan dapat dibuatkan PV revisi.
- **TEST-HIST-04 (AV and RB Strict 1:1 PV Cardinality — REC-02):**
  - *Deskripsi:* Dokumen AV atau RB telah memiliki PV aktif. Pengguna mencoba membuat PV kedua untuk AV/RB yang sama.
  - *Expected Result:* Ditolak dengan HTTP 409 `DUPLICATE_PV_FOR_SOURCE`.
- **TEST-HIST-05 (RC Document Advance Settlement Cycle — REC-01):**
  - *Deskripsi:* Dokumen AV dicairkan. Pemohon mengajukan dokumen RC dengan hasil `DEFICIT` sebesar Rp 500.000.
  - *Expected Result:* RC disetujui; Keuangan dapat menerbitkan satu PV selisih (`sourceDocType: 'RC_DEFICIT'`) persis sebesar nilai defisit.
- **TEST-HIST-06 (PO Banking Snapshot Frozen at Submission — DB-REVIEW-02):**
  - *Deskripsi:* Dokumen PO disubmit. Nomor rekening vendor pada master data kemudian diperbarui melalui alur Maker–Checker. Dokumen PO dibuka kembali.
  - *Expected Result:* Dokumen PO tetap memuat nomor rekening lama sesuai snapshot saat submission; master update tidak mengubah transaksi historis.
- **TEST-HIST-07 (PV Locks Destination Account from PO Snapshot — DB-REVIEW-02):**
  - *Deskripsi:* Staf Keuangan menerbitkan Payment Voucher (PV) untuk dokumen PO yang telah disetujui.
  - *Expected Result:* Rekening tujuan PV diambil persis dari snapshot transaksi PO yang disetujui, bukan mengambil nomor rekening terkini dari tabel `vendor_bank_accounts`.

---

## 5. Kategori 4: Migration, Backup & Storage Recovery Test Suite (DB-REVIEW-03)

- **TEST-MIG-01 (Idempotent Repeated Migration):**
  - *Deskripsi:* Skrip migrasi DDL v1 dijalankan sebanyak 3 kali berturut-turut pada database yang sama.
  - *Expected Result:* Seluruh eksekusi berhasil dengan exit code 0 tanpa duplikasi tabel atau data.
- **TEST-MIG-02 (Atomic Rollback on Migration Failure):**
  - *Deskripsi:* Skrip migrasi disimulasikan gagal di tengah jalan (misal: syntax error pada langkah terakhir).
  - *Expected Result:* Transaksi di-rollback penuh, tidak ada tabel setengah jadi yang tersisa di database.
- **TEST-BK-01 (WAL-Aware Online Backup & PRAGMA Verification — DB-REVIEW-03):**
  - *Deskripsi:* Eksekusi pencadangan database aktif menggunakan `.backup` API, kemudian menjalankan verifikasi pada berkas hasil cadangan.
  - *Expected Result:* Berkas hasil cadangan lolos uji `PRAGMA integrity_check;` (`ok`) dan `PRAGMA foreign_key_check;` (0 baris).
- **TEST-BK-02 (Cross-Storage Coordination & Manifest Checksum — DB-REVIEW-03):**
  - *Deskripsi:* Menjalankan prosedur pencadangan terkoordinasi (SQLite WAL + workspace JSON + lampiran).
  - *Expected Result:* File manifest cadangan memuat checksum SHA-256 yang valid untuk seluruh berkas penyimpanan.
- **TEST-BK-03 (Isolated Restore Rehearsal — DB-REVIEW-03):**
  - *Deskripsi:* Memulihkan hasil cadangan ke folder pengujian terisolasi dan menjalankan simulasi query dokumen serta approval state.
  - *Expected Result:* Seluruh data transaksi dan alur approval dapat dibaca konsisten tanpa kehilangan data.

---

## 6. Kategori 5: Baseline Regression Test Suite (Preservation)

Memastikan seluruh **315 pengujian otomatis** eksisting pada 30 file test tetap lulus 100%:
- Workflow PR, PO, AV, RB, RC, GR, PV, dan Payment Record.
- Alur BR-APP-001 (dua keputusan independen untuk approver multi-role).
- Alur persetujuan sekuensial PV (Finance $\rightarrow$ Hery $\rightarrow$ Hashimoto).
- Penerimaan barang GR tanpa antrean approval.
- Pembayaran tepat nominal pada Payment Record.

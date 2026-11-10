# DATABASE TEST PLAN — PHASE 00
## Master Data Hardening Automated Test Design (Task DBH-007)

**Project:** BLC Caready Procurement Pro  
**Document:** Master Data Hardening Automated Test Design (Task DBH-007)  
**Status:** DESIGN FINALIZED — AWAITING IMPLEMENTATION APPROVAL  
**Scope:** Finalisasi REG-01–REG-06 dan DB-REVIEW-01–03  
**Implementation:** NOT AUTHORIZED  
**Production Migration:** LOCKED  
**Review Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Executive Summary

Dokumen ini merumuskan rancangan pengujian otomatis komprehensif (*Automated Test Plan*) untuk memvalidasi fase pengerjaan **DB-01 hingga DB-06**. Rencana pengujian dirancang untuk memastikan seluruh batasan relasional, kontrol otorisasi, kekebalan snapshot data perbankan transaksi, dan keandalan pencadangan terkoordinasi dapat diverifikasi secara objektif.

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

### 2.2. Test Cases Master Organisasi & Pengguna (ADR-DB-002, ADR-DB-004, REG-04, DB-REVIEW-01)
- **TEST-MD-05 (User Single Primary Role):**
  - *Deskripsi:* Memperbarui pengguna dengan string role di luar daftar resmi yang diizinkan.
  - *Expected Result:* Ditolak dengan HTTP 422 `INVALID_USER_ROLE`.
- **TEST-MD-06 (Flat Organizational Units & Job Title Attributes — REG-04):**
  - *Deskripsi:* Memverifikasi pembuatan unit organisasi datar yang terhubung ke `branch_id`, serta memastikan atribut `job_title` tersimpan sebagai deskripsi profil tanpa memberikan approval authority otomatis.
  - *Expected Result:* Unit tersimpan dengan status aktif; approval authority tetap diverifikasi melalui tabel penugasan `org_assignments` dan snapshot.

### 2.3. Test Cases Master Vendor & Rekening (ADR-DB-006, ADR-DB-007, REG-06)
- **TEST-MD-07 (Duplicate Vendor Detection):**
  - *Deskripsi:* Mendaftarkan vendor dengan nomor NPWP yang sama dengan vendor aktif lainnya.
  - *Expected Result:* Ditolak dengan HTTP 409 `DUPLICATE_VENDOR_TAX_ID`.
- **TEST-MD-08 (Vendor Bank Account Relationship & Cascade Prevention):**
  - *Deskripsi:* Mencoba menghapus vendor secara destruktif saat vendor tersebut memiliki rekening pada `vendor_bank_accounts`.
  - *Expected Result:* Ditolak dengan `SQLITE_CONSTRAINT_FOREIGNKEY (RESTRICT)`.
- **TEST-MD-09 (Inactive Company Bank Account Rejection — REG-06):**
  - *Deskripsi:* Mencoba mencatat pelunasan PV menggunakan `company_bank_accounts` yang berstatus `'INACTIVE'`.
  - *Expected Result:* Ditolak dengan HTTP 422 `COMPANY_BANK_ACCOUNT_INACTIVE`.

---

## 3. Kategori 2: Security, Authorization & Maker–Checker Test Suite

- **TEST-SEC-01 (Non-Admin Branch Modification Rejected):**
  - *Deskripsi:* Pengguna dengan peran `PEMOHON`, `ATASAN`, atau `KEUANGAN` memanggil endpoint `POST /api/v1/branches`.
  - *Expected Result:* Ditolak dengan HTTP 403 `FORBIDDEN_ROLE`.
- **TEST-SEC-02 (Non-Admin Vendor Creation Rejected — REG-01):**
  - *Deskripsi:* Pengguna non-Admin mencoba membuat atau mengubah entitas rekanan di `vendors`.
  - *Expected Result:* Ditolak dengan HTTP 403 `FORBIDDEN_ROLE`.
- **TEST-SEC-03 (Maker–Checker Self-Approval Rejected — REG-02):**
  - *Deskripsi:* Admin yang mengajukan perubahan rekening vendor (`maker_user_id`) mencoba menyetujui pengajuannya sendiri (`checker_user_id`).
  - *Expected Result:* Ditolak dengan HTTP 422 `MAKER_CHECKER_SELF_APPROVAL_FORBIDDEN`.
- **TEST-SEC-04 (Pending Maker–Checker Account Blocked from PO — REG-02):**
  - *Deskripsi:* Staf pemohon mencoba memilih rekening vendor yang masih berstatus `PENDING` pada change request dalam formulir PO.
  - *Expected Result:* Backend menolak dengan HTTP 422 `VENDOR_BANK_ACCOUNT_NOT_APPROVED`.
- **TEST-SEC-05 (Global Document Read Access with Decoupled Approval — REG-03):**
  - *Deskripsi:* Pengguna terautentikasi dari Cabang Surabaya mengakses daftar dan detail dokumen Cabang Bekasi, kemudian mencoba menyetujui tahapan approval dokumen tersebut tanpa penugasan eksplisit.
  - *Expected Result:* Pembacaan dokumen berhasil (HTTP 200), namun upaya approval ditolak keras dengan HTTP 403 `FORBIDDEN_APPROVER`.
- **TEST-SEC-06 (Sensitive Banking Number Masking — REG-03 & DB-REVIEW-02):**
  - *Deskripsi:* Pengguna dengan peran pemohon membaca detail dokumen transaksi yang memuat rekening bank rekanan.
  - *Expected Result:* Nomor rekening disamarkan pada respon JSON (misal: `******1234`), kecuali bagi pengguna dengan wewenang audit keuangan.

---

## 4. Kategori 3: Historical & Financial Integrity Test Suite (DB-REVIEW-02)

- **TEST-HIST-01 (Branch Rename Preserves Historical Document Context):**
  - *Deskripsi:* Cabang "Bekasi" diubah namanya menjadi "Bekasi Barat". Dokumen PO yang diterbitkan sebelum perubahan dibuka kembali.
  - *Expected Result:* Dokumen lama tetap menampilkan cabang "Bekasi" sesuai kondisi saat dokumen disetujui.
- **TEST-HIST-02 (PO Banking Snapshot Frozen at Submission — DB-REVIEW-02):**
  - *Deskripsi:* Dokumen PO disubmit. Nomor rekening vendor pada master data kemudian diperbarui melalui alur Maker–Checker. Dokumen PO dibuka kembali.
  - *Expected Result:* Dokumen PO tetap memuat nomor rekening lama sesuai snapshot saat submission; master update tidak mengubah transaksi historis.
- **TEST-HIST-03 (PV Locks Destination Account from PO Snapshot — DB-REVIEW-02):**
  - *Deskripsi:* Staf Keuangan menerbitkan Payment Voucher (PV) untuk dokumen PO yang telah disetujui.
  - *Expected Result:* Rekening tujuan PV diambil persis dari snapshot transaksi PO yang disetujui, bukan mengambil nomor rekening terkini dari tabel `vendor_bank_accounts`.
- **TEST-HIST-04 (Payment Record Immutability on Company Bank Changes):**
  - *Deskripsi:* Rekening kas BLC pada master data dinonaktifkan atau diganti setelah pembayaran PV dicatat.
  - *Expected Result:* Bukti pembayaran historis pada Payment Record tetap mengacu pada data saat pembayaran dicairkan.
- **TEST-HIST-05 (Approval Snapshot Immutability):**
  - *Deskripsi:* Penugasan supervisor pada master organisasi diganti saat dokumen PR sedang `PENDING`.
  - *Expected Result:* Dokumen yang sedang berjalan tetap mewajibkan persetujuan approver lama sesuai snapshot saat submission.

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

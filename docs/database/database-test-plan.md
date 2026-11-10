# DATABASE TEST PLAN — PHASE 00
**Project:** BLC Caready Procurement Pro  
**Document:** Master Data Hardening Automated Test Design (Task DBH-007)  
**Status:** IN REVIEW — TEST DESIGN ONLY (NOT YET EXECUTED IN CODE)  
**Review Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Executive Summary

Dokumen ini merumuskan rancangan pengujian otomatis komprehensif (*Automated Test Plan*) yang akan diimplementasikan pada fase-fase pengerjaan **DB-01 hingga DB-06**. Rencana pengujian ini dirancang untuk memastikan seluruh batasan relasional, kontrol keamanan, kekebalan data historis, dan pengujian regresi terpenuhi sebelum peluncuran ke lingkungan produksi.

> [!IMPORTANT]
> Sesuai mandat fase **DESIGN & VERIFICATION ONLY**, rancangan tes di bawah ini berstatus **`PLANNED / DESIGNED`** dan **TIDAK DIKLAIM SEBAGAI PASS** sampai fase implementasi resmi disahkan oleh Product Owner.

---

## 2. Kategori 1: Master Data Integrity Test Suite

### 2.1. Test Cases Master Cabang (`branches`)
- **TEST-MD-01 (Duplicate Branch Code):**
  - *Deskripsi:* Mencoba membuat cabang baru dengan kode cabang yang sudah ada (misal: mendaftarkan `code: 'BKS'` untuk cabang kedua).
  - *Expected Result:* Database menolak dengan error `SQLITE_CONSTRAINT_UNIQUE` atau aplikasi mengembalikan HTTP 409 `DUPLICATE_BRANCH_CODE`.
- **TEST-MD-02 (Invalid Primary Branch Reference):**
  - *Deskripsi:* Mendaftarkan pengguna baru dengan `primary_branch_id` yang tidak ada di tabel `branches` (misal: `'brc-unknown'`).
  - *Expected Result:* Database menolak dengan error `SQLITE_CONSTRAINT_FOREIGNKEY` saat `PRAGMA foreign_keys=ON`.
- **TEST-MD-03 (Controlled Branch Deactivation):**
  - *Deskripsi:* Menonaktifkan cabang dengan status `'INACTIVE'`, kemudian mencoba mendaftarkan pengguna baru pada cabang tersebut.
  - *Expected Result:* Backend menolak registrasi dengan HTTP 422 `BRANCH_INACTIVE`. Data cabang tetap tersimpan di tabel.
- **TEST-MD-04 (Prevent Destructive Branch Deletion):**
  - *Deskripsi:* Menjalankan perintah `DELETE FROM branches WHERE id = 'brc-bks'` saat cabang tersebut telah memiliki pengguna atau dokumen.
  - *Expected Result:* Ditolak dengan `SQLITE_CONSTRAINT_TRIGGER` atau `FOREIGN KEY RESTRICT`.

### 2.2. Test Cases Master Organisasi & Pengguna
- **TEST-MD-05 (User Single Primary Role):**
  - *Deskripsi:* Memperbarui pengguna dengan string role di luar daftar resmi yang diizinkan.
  - *Expected Result:* Ditolak dengan HTTP 422 `INVALID_USER_ROLE`.
- **TEST-MD-06 (Invalid Organization Hierarchy Loop Prevention):**
  - *Deskripsi:* Mengatur unit A dengan `parent_unit_id = 'A'` (self-reference) atau membuat siklus A $\rightarrow$ B $\rightarrow$ A.
  - *Expected Result:* Ditolak oleh validator domain dengan HTTP 422 `ORGANIZATION_HIERARCHY_CYCLE_DETECTED`.

### 2.3. Test Cases Master Vendor & Rekening
- **TEST-MD-07 (Duplicate Vendor Detection):**
  - *Deskripsi:* Mendaftarkan vendor dengan nomor NPWP yang sama dengan vendor aktif lainnya.
  - *Expected Result:* Ditolak dengan HTTP 409 `DUPLICATE_VENDOR_TAX_ID`.
- **TEST-MD-08 (Vendor Bank Account Relationship & Cascade Prevention):**
  - *Deskripsi:* Mencoba menghapus vendor secara destruktif saat vendor tersebut memiliki rekening pada `vendor_bank_accounts`.
  - *Expected Result:* Ditolak dengan `SQLITE_CONSTRAINT_FOREIGNKEY (RESTRICT)`.
- **TEST-MD-09 (Inactive Company Bank Account Rejection):**
  - *Deskripsi:* Mencoba mencatat pelunasan PV menggunakan `company_bank_accounts` yang berstatus `'INACTIVE'`.
  - *Expected Result:* Ditolak dengan HTTP 422 `COMPANY_BANK_ACCOUNT_INACTIVE`.

---

## 3. Kategori 2: Security & Authorization Test Suite

- **TEST-SEC-01 (Non-Admin Branch Modification Rejected):**
  - *Deskripsi:* Pengguna dengan peran `PEMOHON`, `ATASAN`, atau `KEUANGAN` memanggil endpoint `POST /api/v1/branches`.
  - *Expected Result:* Ditolak dengan HTTP 403 `FORBIDDEN_ROLE`.
- **TEST-SEC-02 (Unauthorized User Verification Rejected):**
  - *Deskripsi:* Pengguna non-Admin mencoba memverifikasi identitas pengguna lain (`POST /api/v1/organization/users/:id/verify`).
  - *Expected Result:* Ditolak dengan HTTP 403 `FORBIDDEN_ROLE`.
- **TEST-SEC-03 (Unauthorized Company Bank Modification Rejected):**
  - *Deskripsi:* Staf pemohon mencoba membuat atau mengubah rekening bank kas perusahaan.
  - *Expected Result:* Ditolak dengan HTTP 403 `FORBIDDEN_ROLE`.
- **TEST-SEC-04 (Role Decoupling Security Gate):**
  - *Deskripsi:* Pengguna dengan global role `ATASAN` mencoba menyetujui dokumen yang tidak menugaskan ID-nya pada stage aktif.
  - *Expected Result:* Ditolak dengan HTTP 403 `FORBIDDEN_APPROVER` (Membuktikan global role tidak memberikan kewenangan approval otomatis).

---

## 4. Kategori 3: Historical & Financial Integrity Test Suite

- **TEST-HIST-01 (Branch Rename Preserves Historical Document Context):**
  - *Deskripsi:* Cabang "Bekasi" diubah namanya menjadi "Bekasi Barat". Dokumen PO yang diterbitkan sebelum perubahan dibuka kembali.
  - *Expected Result:* Dokumen lama tetap menampilkan cabang "Bekasi" sesuai kondisi saat dokumen disetujui.
- **TEST-HIST-02 (Vendor Data Change Preserves Historical Transactions):**
  - *Deskripsi:* Rekening bank vendor di master data diperbarui. Dokumen PO dan PV historis dibuka kembali.
  - *Expected Result:* Dokumen historis tetap menampilkan nomor rekening lama yang berlaku saat transaksi disetujui.
- **TEST-HIST-03 (Company Bank Account Audit Immutability):**
  - *Deskripsi:* Rekening kas BLC diganti. Riwayat pembayaran Payment Record masa lalu diverifikasi.
  - *Expected Result:* Riwayat audit dan rujukan rekening pada Payment Record lama tidak terpengaruh.
- **TEST-HIST-04 (Approval Snapshot Immutability):**
  - *Deskripsi:* Penugasan supervisor pada master organisasi diganti dari Pak Hendra ke Bu Siti saat dokumen PR sedang `PENDING`.
  - *Expected Result:* Dokumen yang sedang berjalan tetap mewajibkan persetujuan Pak Hendra sesuai snapshot saat submission.

---

## 5. Kategori 4: Migration & Engine Storage Test Suite

- **TEST-MIG-01 (Idempotent Repeated Migration):**
  - *Deskripsi:* Skrip migrasi DDL v1 dijalankan sebanyak 3 kali berturut-turut pada database yang sama.
  - *Expected Result:* Seluruh eksekusi berhasil dengan exit code 0 tanpa duplikasi tabel atau data.
- **TEST-MIG-02 (Atomic Rollback on Migration Failure):**
  - *Deskripsi:* Skrip migrasi disimulasikan gagal di tengah jalan (misal: sengaja disisipkan syntax error pada langkah terakhir).
  - *Expected Result:* Transaksi di-rollback penuh, tidak ada tabel setengah jadi yang tersisa di database.
- **TEST-MIG-03 (SQLite Integrity Checks):**
  - *Deskripsi:* Mengeksekusi `PRAGMA integrity_check;` dan `PRAGMA foreign_key_check;` pasca migrasi.
  - *Expected Result:* Mengembalikan nilai `ok` dan 0 baris pelanggaran foreign key.
- **TEST-MIG-04 (Cross-Storage Recovery Re-Verification):**
  - *Deskripsi:* Menyimulasikan kegagalan I/O penulisan repositori dokumen setelah commit SQLite.
  - *Expected Result:* Engine memicu pemulihan kompensasi (*compensated sync record*) dan menjaga integritas dua arah.

---

## 6. Kategori 5: Regression Test Suite (Baseline Preservation)

Memastikan seluruh **315 pengujian otomatis** eksisting pada 30 file test tetap lulus 100%:
- Workflow PR, PO, AV, RB, RC, GR, PV, dan Payment Record.
- Alur BR-APP-001 (dua keputusan independen untuk approver multi-role).
- Alur persetujuan sekuensial PV (Finance $\rightarrow$ Hery $\rightarrow$ Hashimoto).
- Penerimaan barang GR tanpa antrean approval.
- Pembayaran tepat nominal pada Payment Record.

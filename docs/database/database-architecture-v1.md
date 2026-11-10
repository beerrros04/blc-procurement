# BLC PROCUREMENT PRO — DATABASE ARCHITECTURE v1
## Master Data Foundation, Relational Integrity & Production Hardening

**Project:** BLC Caready Procurement Pro  
**Document:** Database Architecture Specification v1  
**Status:** IN REVIEW — HARDENING DESIGN  
**Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Executive Summary

Dokumen ini merupakan cetak biru (*architectural blueprint*) perkuatan basis data BLC Caready Procurement Pro v1. Perancangan ini didasarkan pada temuan audit komprehensif ([`docs/database/database-inventory-audit.md`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/docs/database/database-inventory-audit.md)) dan tujuh (7) keputusan arsitektur bisnis yang telah disetujui Product Owner (**ADR-DB-001** s/d **ADR-DB-007**).

### Prinsip Utama Arsitektur v1:
1. **Preserve What Works:** Mempertahankan komponen yang telah terbukti tangguh dan lulus uji pada HF02-A hingga HF02-D (khususnya *Independent Stage Engine* dan *Snapshot Submission*).
2. **Centralized Master Foundation:** Memindahkan entitas master dinamis (**Cabang**, **Vendor**, **Rekening Vendor**, dan **Rekening Kas Perusahaan**) ke tabel relasional mandiri dengan kontrol Administrator dan Keuangan.
3. **Decoupled Approval Authority:** Menjaga pemisahan tegas antara *Primary Application Role* dengan hak persetujuan approval (*Approval Authority*) sesuai BR-APP-001.
4. **Historical & Financial Immutability:** Memastikan setiap perubahan master data (seperti penggantian rekening vendor atau penamaan ulang cabang) tidak mengubah secara retrospektif data transaksi masa lalu.
5. **Zero-Downtime Additive Migration:** Skema baru dirancang aditif dan kompatibel dengan basis data SQLite eksisting tanpa merusak 315 uji regresi.

---

## 2. Kepatuhan Terhadap Keputusan Bisnis Product Owner

| Keputusan PO | Komponen Arsitektur v1 | Implementasi Teknis & Mitigasi Risiko |
|---|---|---|
| **ADR-DB-001 — Dynamic Branch Master** | Tabel `branches` | Identifier stabil (`id` UUID / string unik), kode cabang unik (`code`), status `active/inactive`, mutasi terbatas Admin. |
| **ADR-DB-002 — User Primary Branch** | Kolom `app_users.primary_branch_id` | Menghubungkan pengguna ke `branches(id)`. Transaksi historis tetap menyimpan nama cabang pada saat dibuat. |
| **ADR-DB-003 — Application Roles** | Atribut `app_users.role` + Engine Snapshot | Satu role aplikasi utama. Kewenangan approval diberikan melalui penugasan stage (`approval_stage_assignments`) dan divisi (`org_assignments`), bukan global role. Multi-role stage approval didukung penuh. |
| **ADR-DB-004 — Organizational Structure** | Tabel `org_units` + `org_assignments` | Struktur unit organisasi dan penugasan supervisor dipertahankan. Snapshot submission mengunci approver saat dokumen diajukan; tidak ada pencocokan nama otomatis. |
| **ADR-DB-005 — Fixed Document Types** | Enum TypeScript `DocType` & SQL Constraints | 7 jenis pengajuan (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`) dipertahankan sebagai enum statis; tidak diperlukan tabel master dinamis. |
| **ADR-DB-006 — Centralized Vendor Master** | Tabel `vendors` & `vendor_bank_accounts` | Vendor master terpusat dengan stable ID, NPWP, deduplikasi kode, dan rekening terhubung. Transaksi historis tetap menyimpan snapshot rekening saat PO diterbitkan. |
| **ADR-DB-007 — BLC Source Bank Accounts** | Tabel `company_bank_accounts` | Master rekening kas BLC dengan status aktif/nonaktif. Dropdown pelunasan PV hanya menampilkan rekening aktif. |

---

## 3. Verifikasi Arsitektur Eksisting (Task DBH-001)

Berdasarkan inspeksi langsung terhadap file sumber:
- [`server/organization.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/organization.ts)
- [`server/stage-engine.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/stage-engine.ts)
- [`server/repository.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts)
- [`server/auth.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/auth.ts)
- [`server/app.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/app.ts)

Berikut adalah klasifikasi status komponen saat ini:

### Matriks Klasifikasi Status Komponen

| Komponen Arsitektur | Klasifikasi Status | Evaluasi Teknis & Tindakan Hardening v1 |
|---|:---:|---|
| **`app_users`** | `EXISTING — Requires hardening` | Dipertahankan. Ditambahkan kolom foreign key `primary_branch_id REFERENCES branches(id)` untuk menggantikan string `branch`. |
| **`app_user_audit`** | `EXISTING — Reuse` | Sangat matang. Dipertahankan tanpa perubahan skema. |
| **`app_retired_user_ids`** | `EXISTING — Reuse` | Mencegah daur ulang ID kanonikal `usr-*`. Dipertahankan. |
| **`org_units`** | `EXISTING — Requires hardening` | Dipertahankan. Ditambahkan kolom opsional `code` dan `active` untuk konsistensi master. |
| **`org_assignments`** | `EXISTING — Reuse` | Memiliki partial unique index `org_assignment_active_unique`. Dipertahankan. |
| **`org_assignment_audit`** | `EXISTING — Reuse` | Jejak audit mutasi atasan langsung. Dipertahankan. |
| **`approval_workflows`** | `EXISTING — Reuse` | Instance alur persetujuan per dokumen. Sangat stabil. Dipertahankan. |
| **`approval_assignment_snapshots`** | `EXISTING — Reuse` | Kunci integritas penugasan submission. Dipertahankan 100%. |
| **`approval_stages`** | `EXISTING — Reuse` | Pengendali status tahapan sekuensial dan paralel. Dipertahankan. |
| **`approval_decisions`** | `EXISTING — Reuse` | Keputusan individual dengan index unik per stage. Dipertahankan. |
| **`approval_stage_reassignments`** | `EXISTING — Reuse` | Audit in-flight reassignment Admin. Dipertahankan. |
| **`approval_idempotency_records`** | `EXISTING — Reuse` | Idempotency multi-dimensi. Dipertahankan. |
| **`cross_storage_sync_records`** | `EXISTING — Reuse` | Pengendali sinkronisasi 2 fase SQLite dan dokumen. Dipertahankan. |
| **`approval_stage_assignments`** | `EXISTING — Reuse` | Penugasan default Stage 2 & 3. Dipertahankan. |
| **`approval_stage_assignment_audit`**| `EXISTING — Reuse` | Audit penugasan stage global. Dipertahankan. |
| **`workspace` (JSON Payload)** | `EXISTING — Requires hardening` | Menampung array dokumen transaksi. Diperkuat dengan validasi referensial terhadap master data pada *application layer* sebelum tahap dekomposisi tabel relasional. |
| **`branches`** | `MISSING — New schema proposed` | Dibangun tabel baru `branches` untuk menggantikan array statis `OFFICIAL_BRANCHES`. |
| **`vendors`** | `MISSING — New schema proposed` | Dibangun tabel baru `vendors` untuk menghentikan input teks bebas pada PO. |
| **`vendor_bank_accounts`** | `MISSING — New schema proposed` | Dibangun tabel baru `vendor_bank_accounts` berelasi 1:N ke vendor. |
| **`company_bank_accounts`** | `MISSING — New schema proposed` | Dibangun tabel baru `company_bank_accounts` untuk rekening kas BLC. |
| **`DocType` & `DocumentStatus`** | `STATIC ENUM — Confirmed by ADR` | Sesuai ADR-DB-005, tetap menggunakan tipe statis TypeScript dan SQL CHECK constraints. |

---

## 4. Topologi Penyimpanan & Keputusan Arsitektur

### Mengapa Tidak Semua Data Dipindahkan ke SQLite Sekaligus?
Pada arsitektur v1 ini:
1. **Master Data Inti (Cabang, Vendor, Rekening, Pengguna, Organisasi)** wajib berada di tabel relasional SQLite untuk menegakkan *unique constraint*, *foreign key integrity*, dan *concurrency locking*.
2. **Workflow & Approval State** telah berada di SQLite dan terbukti handal dengan 38 unit test engine dan 44 integrasi test.
3. **Dokumen Transaksi Pengadaan (PR, PO, AV, RB, RC, GR, PV)** tetap disimpan di dalam JSON payload `workspace` pada tahap ini, namun **divalidasi secara ketat terhadap tabel master SQLite**. Hal ini menghindari *breaking changes* masif pada seluruh antarmuka React dan repository yang saat ini mengonsumsi interface dokumen terpolimorfik.
4. **Berkas Lampiran Biner (Attachments)** tetap disimpan pada sistem berkas lokal `.data/uploads/` dengan checksum SHA-256 dan metadata di database, siap dipindahkan ke S3/SharePoint pada fase infrastruktur cloud lanjutan.

---

## 5. Invarian Arsitektur Wajib (Mandatory Architectural Invariants)

1. **User Branch Invariant:** Setiap pengguna aktif wajib memiliki referensi `primary_branch_id` yang valid dan berstatus aktif pada tabel `branches`.
2. **Role & Approval Decoupling Invariant:** Global role `app_users.role` tidak boleh digunakan langsung sebagai bukti otorisasi menyetujui transaksi. Otorisasi persetujuan HANYA sah jika ID pengguna cocok dengan `approval_stages.assigned_approver_id`.
3. **Snapshot Immutability Invariant:** Sekali dokumen procurement disubmit, seluruh approver yang tercatat pada `approval_assignment_snapshots` bersifat permanen dan tidak dapat diubah oleh mutasi master data pengguna atau organisasi.
4. **Vendor Banking Integrity Invariant:** PO dengan metode `BANK_TRANSFER` hanya dapat diajukan jika merujuk pada `vendor_bank_accounts` yang aktif dan berelasi sah dengan vendor terpilih.
5. **Disbursement Account Invariant:** Pencatatan pelunasan Payment Voucher hanya boleh memilih rekening dari `company_bank_accounts` yang berstatus aktif.
6. **Zero Orphan Invariant:** Penonaktifan (*deactivation*) cabang, divisi, pengguna, vendor, atau rekening bank tidak boleh menghapus baris data secara fisik (*soft deactivation only*), memastikan integritas referensial dokumen historis tetap utuh.

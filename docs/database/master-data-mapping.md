# MASTER DATA MAPPING & ARCHITECTURE CLASSIFICATION — PHASE 00
**Project:** BLC Caready Procurement Pro  
**Audit Scope:** Master Data Classification & Requirements Discovery (AUDIT-002, AUDIT-003, AUDIT-004)  
**Status:** AUTHORIZED — AUDIT ONLY  
**Review Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Klasifikasi Master Data (AUDIT-002)

Berdasarkan audit teknis terhadap basis kode BLC Caready Procurement Pro, berikut adalah matriks klasifikasi untuk seluruh 16 komponen bisnis yang dievaluasi. Klasifikasi menggunakan taksonomi ketat:
- **`PERSISTENT MASTER`**: Tersimpan dalam tabel database relasional permanen dengan identitas mandiri, operasi CRUD, integritas referensial, dan audit trail.
- **`PERSISTENT CONFIG`**: Tersimpan secara persisten sebagai konfigurasi sistem atau penugasan, namun belum menjadi master entitas bisnis lengkap.
- **`STATIC ENUM`**: Hanya didefinisikan sebagai daftar nilai konstan di TypeScript atau backend tanpa tabel database.
- **`DOCUMENT FIELD`**: Tersimpan secara terdenormalisasi di dalam field dokumen transaksi, tidak memiliki entitas master independen.
- **`SEED ONLY`**: Hanya tersedia pada berkas bootstrap / data fixture awal.
- **`MISSING`**: Belum ditemukan implementasi penyimpanan maupun logikanya.
- **`UNVERIFIED`**: Belum cukup bukti untuk memastikan keberadaannya.

### Matriks Klasifikasi 16 Komponen Bisnis

| No | Komponen Bisnis | Klasifikasi Arsitektur | Lokasi Sumber & Rujukan Kode | Keterangan & Batasan Saat Ini |
|:---:|---|:---:|---|---|
| 1 | **Pengguna dan Akun** | **`PERSISTENT MASTER`** | [`server/organization.ts:L56`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/organization.ts#L56) (`app_users`), [`server/auth.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/auth.ts) | Memiliki ID kanonikal (`usr-*`), status verifikasi identitas, dan audit trail lengkap. |
| 2 | **Role dan Permissions** | **`PERSISTENT CONFIG` / `STATIC ENUM`** | [`src/types/document.ts:L3`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/types/document.ts#L3), [`server/app.ts:L121`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/app.ts#L121) | Role disimpan per user di SQLite (`app_users.role`), namun daftar role adalah enum statis. Belum ada tabel permission granular (RBAC). |
| 3 | **Cabang (Branches)** | **`STATIC ENUM` / `DOCUMENT FIELD`** | [`src/domain/branches.ts:L1`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/domain/branches.ts#L1), [`src/types/document.ts:L93`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/types/document.ts#L93) | Belum ada tabel `branches`. Hanya berupa array konstanta statis (`OFFICIAL_BRANCHES`) dan teks pada `doc.branch` & `user.branch`. |
| 4 | **Divisi & Struktur Organisasi** | **`PERSISTENT MASTER`** | [`server/organization.ts:L49`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/organization.ts#L49) (`org_units`) | Disimpan di SQLite `org_units` dengan UUID dan nama unik. Belum mendukung hirarki parent-child / subordinasi divisi. |
| 5 | **Jabatan (Job Titles/Positions)** | **`MISSING` / `SEED ONLY`** | [`server/auth.ts:L22-L80`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/auth.ts#L22-L80) | Tidak ada tabel `positions`. Nama jabatan hanya dicantumkan sebagai keterangan di nama pengguna seed (misal: "Verifikator Keuangan"). |
| 6 | **Supervisor & Assignments** | **`PERSISTENT MASTER`** | [`server/organization.ts:L50`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/organization.ts#L50) (`org_assignments`, `org_assignment_audit`) | Disimpan di SQLite relasional dengan foreign key ke `org_units` dan `app_users.id`, status aktif/nonaktif, dan jejak audit lengkap. |
| 7 | **Approval Authority & Config** | **`PERSISTENT CONFIG`** | [`server/stage-engine.ts:L226`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/stage-engine.ts#L226) (`approval_stage_assignments`), `snapshots` | Otoritas Stage 1 diambil dari penugasan divisi. Otoritas Stage 2 dan Stage 3 dikonfigurasi di SQLite `approval_stage_assignments`. |
| 8 | **Jenis Dokumen / Pengajuan** | **`STATIC ENUM`** | [`src/types/document.ts:L1`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/types/document.ts#L1) (`DocType`) | Didefinisikan statis: `PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`. Tidak ada tabel master `document_types`. |
| 9 | **Status Dokumen** | **`STATIC ENUM`** | [`src/types/document.ts:L12`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/types/document.ts#L12), [`server/stage-engine.ts:L168`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/stage-engine.ts#L168) | Status dokumen (`DRAFT`, `SUBMITTED`, dll.) dan status stage (`WAITING`, `PENDING`, dll.) berupa TypeScript union dan SQL CHECK constraints. |
| 10 | **Jenis Anggaran (Budget Types)** | **`DOCUMENT FIELD` / `HARDCODED`**| [`src/components/forms/FormPR.tsx:L113`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/forms/FormPR.tsx#L113) | String bebas di dokumen (`budgetType`). Di UI berupa hardcoded `<option>` (`OPEX`, `CAPEX`, `PROJECT`). Tidak ada master anggaran/pagu. |
| 11 | **Vendor / Pemasok** | **`DOCUMENT FIELD`** | [`src/types/document.ts:L131`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/types/document.ts#L131) (`PODocument.vendorName`), `vendorCode` | Tidak ada tabel `vendors`. Tersimpan denormalized di form PO, GR, PV, AV, RB. |
| 12 | **Rekening Bank Perusahaan & Vendor**| **`DOCUMENT FIELD` / `HARDCODED`**| [`src/types/document.ts:L50`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/types/document.ts#L50) (`BankDetails`), [`FormPVPayment.tsx:L26`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/forms/FormPVPayment.tsx#L26) | Rekening vendor disalin ke dokumen (`BankDetails`). Rekening perusahaan internal BLC berupa text input di PV Payment (`sourceBank`). |
| 13 | **Metode Pembayaran** | **`STATIC ENUM`** | [`src/types/document.ts:L132`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/types/document.ts#L132) (`BANK_TRANSFER`, `CASH`) | Enum statis TypeScript. Validasi server mewajibkan detail bank jika memilih `BANK_TRANSFER`. |
| 14 | **Kategori Lampiran** | **`STATIC ENUM` / `PERSISTENT METADATA`**| [`server/storage.ts:L15`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/storage.ts#L15), [`src/types/document.ts:L56`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/types/document.ts#L56) | Kategori berupa union string statis (10 kategori). Metadata berkas tersimpan persisten di JSON dan disk lokal dengan SHA-256. |
| 15 | **Konfigurasi Workflow** | **`PERSISTENT CONFIG`** | [`server/stage-engine.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/stage-engine.ts) | Aturan alur tahapan (Stage 1 -> Stage 2 -> Stage 3 BoD) tertanam di kode engine, namun penugasan approver tersimpan persisten di SQLite. |
| 16 | **Data Transaksi Procurement** | **`PERSISTENT DOCUMENT` (JSON Blob)**| [`server/repository.ts:L178`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts#L178) (`workspace.payload`) | Seluruh dokumen tersimpan persisten dalam satu payload JSON di SQLite, dilengkapi versioning optimistik dan nomor sequence otomatis. |
| 17 | **Audit Trail dan Histori** | **`PERSISTENT MASTER & DOCUMENT LOG`**| SQLite audit tables (`app_user_audit`, dll.) & `doc.auditLog[]` | Audit organisasi dan stage approval tersimpan di tabel SQLite. Riwayat dokumen procurement tersimpan dalam array `doc.auditLog[]`. |

---

## 2. Audit Detail User, Role & Organisasi (AUDIT-003)

### 2.1. Master Pengguna (`app_users`)
Implementasi pengguna telah dirombak pada arsitektur ADR-ID-001 hingga ADR-ID-003:
- **Canonical User ID:** Format konsisten `usr-*` (contoh: `usr-pemohon-01`, `usr-admin-01`, `usr-ayu-01`).
- **Legacy ID:** Kolom `legacy_id` opsional dan unik untuk mapping kompatibilitas data masa lalu.
- **Identitas Personal:** `full_name` dan `email` tersimpan dengan constraint `NOT NULL` dan `UNIQUE(email)`.
- **Status Akun (Lifecycle):** `UNVERIFIED`, `ACTIVE`, `INACTIVE`.
- **Status Verifikasi:** `UNVERIFIED`, `VERIFIED`, `REJECTED`.
  - Hanya akun `ACTIVE` dan `VERIFIED` yang dapat ditugaskan sebagai approver dalam workflow pengadaan.
  - Akun Admin default di-bootstrap langsung sebagai `VERIFIED` oleh `SYSTEM_BOOTSTRAP`.
- **Cabang Pengguna:** `branch` (nama cabang) dan `branch_scope` (`*` untuk akses global, atau nama cabang khusus untuk membatasi visibilitas).
- **Jabatan (Position):** **TIDAK ADA kolom `position`** pada tabel `app_users`.
- **Supervisor Relationship:** Tidak disimpan sebagai kolom langsung di tabel pengguna (`no supervisor_id column`), melainkan melalui relasi penugasan divisi pada tabel `org_assignments`.
- **Pensiun Identitas (Tombstone):** Pengguna yang dipensiunkan dicatat pada `app_retired_user_ids` untuk memastikan ID tersebut tidak pernah didaur ulang.

### 2.2. Peran & Kewenangan (Role & Permission)
Peran aplikasi saat ini didefinisikan sebagai string enum:
- **Daftar Role:**
  1. `PEMOHON`: Dapat membuat draf dokumen (PR, PO, AV, RB, RC, GR), mengunggah lampiran, dan mengajukan (submit) dokumen. Visibilitas terbatas pada dokumen miliknya sendiri di cabang terkait.
  2. `ATASAN`: Bertindak sebagai reviewer Tahap 1. Visibilitas dibatasi pada dokumen yang menugaskan email/ID-nya pada Stage 1.
  3. `AYU` / `KEUANGAN`: Bertindak sebagai Verifikator Keuangan pada Tahap 2, memiliki wewenang menerbitkan Payment Voucher (PV), mengonfirmasi realisasi RC, dan mencatat pelunasan PV. Memiliki akses membaca seluruh dokumen pengadaan.
  4. `BOD_HERY`: Direktur Operasional (BoD Stage 3). Wewenang persetujuan paralel bersama Hashimoto.
  5. `BOD_HASHIMOTO`: Direktur Keuangan / Presdir (BoD Stage 3). Wewenang persetujuan paralel bersama Hery.
  6. `ADMIN`: Memiliki hak istimewa (*administrative privileges*) untuk mengelola master unit organisasi, penugasan supervisor, verifikasi identitas pengguna, dan melakukan *in-flight stage reassignment*.
- **Pemisahan Konseptual Penting:**
  - **Global Role (`app_users.role`):** Menentukan izin akses menu dan API (misal: menu Admin vs Menu Pemohon).
  - **Organizational Position:** Posisi struktural karyawan (misal: "Head of Marketing", "Branch Manager") — *saat ini belum ada tabelnya*.
  - **Approval Authority:** Ditentukan secara dinamis berdasarkan snapshot penugasan aktif (`org_assignments` dan `approval_stage_assignments`), bukan semata-mata karena role string. Seorang pengguna dengan role `ATASAN` hanya berhak menyetujui jika ID-nya tercatat pada `approval_stages.assigned_approver_id`.

### 2.3. Struktur Organisasi (`org_units` & `org_assignments`)
- **Unit Organisasi (`org_units`):**
  - Menyimpan unit/divisi secara datar (*flat list*).
  - Belum memiliki hirarki *parent-child* (misal: Divisi Operasi -> Departemen Logistik).
- **Penugasan Supervisor (`org_assignments`):**
  - Mengaitkan `unit_id` dengan `supervisor_user_id`.
  - Satu unit dapat memiliki beberapa supervisor aktif, dan satu supervisor dapat membawahi beberapa unit organisasi.
  - Snapshot submission mengunci nama unit dan ID supervisor pada saat draf diajukan.
- **Penugasan Tahap Global (`approval_stage_assignments`):**
  - Tahap 2 (`STAGE_2_FINANCE`): Default diarahkan ke Bu Ayu (`usr-ayu-01`).
  - Tahap 3A (`STAGE_3_BOD_HERY`): Default diarahkan ke Pak Hery (`usr-bod-hery`).
  - Tahap 3B (`STAGE_3_BOD_HASHIMOTO`): Default diarahkan ke Mr. Hashimoto (`usr-bod-hashimoto`).
  - Admin dapat memperbarui penugasan ini melalui endpoint `POST /api/v1/organization/stage-assignments`.

---

## 3. Audit Detail Data Master Pengadaan (AUDIT-004)

### 3.1. Jenis Dokumen (Document Types)
Sistem mengenali 7 jenis dokumen pengadaan dan 1 entitas pencatatan pembayaran:
1. `PR` (Purchase Requisition): Pengajuan kebutuhan pembelian barang/jasa.
2. `PO` (Purchase Order): Surat pesanan resmi ke vendor rekanan (wajib mengacu ke PR approved jika bernilai besar).
3. `AV` (Advance / Kasbon): Permohonan uang muka kerja operasional.
4. `RB` (Reimbursement): Penggantian dana talangan staf operasional.
5. `RC` (Reconciliation): Pertanggungjawaban realisasi dana kasbon AV (Surplus/Defisit/Pas).
6. `GR` (Goods Receipt): Tanda terima barang/jasa fisik yang dikirim vendor PO.
7. `PV` (Payment Voucher): Voucher pembayaran resmi yang diterbitkan Keuangan untuk PO, AV, atau RB.
8. `Payment Record`: Pencatatan realisasi transfer kas bank oleh Tim Treasury setelah PV disetujui.

> [!NOTE]
> Seluruh jenis dokumen tersebut **tidak disimpan dalam tabel database master**, melainkan ditentukan sebagai tipe statis `DocType` di TypeScript. Penomoran dokumen dihasilkan oleh sequence runtime (`PR-2026-0001`, `PO-2026-0001`, dll.).

### 3.2. Cabang (Branches)
- **Implementasi Saat Ini:**
  - File referensi: [`src/domain/branches.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/domain/branches.ts).
  - Terdaftar 7 cabang resmi: `Bekasi`, `Cibinong`, `Medan`, `Surabaya`, `Pekanbaru`, `Makassar`, `Samarinda`.
  - Tidak ada tabel master `branches` di SQLite.
  - Tidak ada kode cabang numerik/alfanumerik resmi (misal: `BKS`, `SBY`).
  - Tidak ada status aktif/nonaktif cabang.
  - Relasi ke dokumen dan pengguna berupa penyimpanan string teks murni (`doc.branch = "Bekasi"`).

### 3.3. Anggaran & Pembayaran (Budget & Payment)
- **Tipe Anggaran (Budget Type):**
  - Nilai yang digunakan di UI: `OPEX` (Operasional), `CAPEX` (Investasi Modal), dan `PROJECT`.
  - Disimpan sebagai string opsional pada dokumen (`doc.budgetType`).
  - Tidak ada validasi referensial terhadap pagu anggaran (budget ceiling) atau nomor Chart of Accounts (CoA).
- **Metode Pembayaran (Payment Method):**
  - Enum statis: `BANK_TRANSFER` atau `CASH`.
  - Pada dokumen PO, jika memilih `BANK_TRANSFER`, server mewajibkan detail bank vendor (`bankName`, `accountNumber`, `accountHolder`).
- **Rekening Bank Perusahaan (BLC Source Bank):**
  - Tidak ada master data rekening kas/bank internal perusahaan.
  - Pada antarmuka pelunasan PV ([`FormPVPayment.tsx`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/forms/FormPVPayment.tsx#L25)), field rekening sumber dana diisi manual melalui input teks bebas dengan nilai default `'BCA Operasional Pusat'`.
- **Rekening Bank Vendor / Penerima:**
  - Disimpan secara terdenormalisasi di dalam interface `BankDetails` pada dokumen masing-masing.

### 3.4. Vendor / Pemasok
- **Status Master Table:** **BELUM ADA (`vendors` table tidak ditemukan)**.
- **Penyimpanan:**
  - Disimpan langsung di dokumen: `po.vendorName: string` (wajib), `po.vendorCode?: string` (opsional).
  - Dipetakan ke `pv.vendorOrPayeeName` saat pembuatan Payment Voucher.
  - Data rekening bank rekanan disimpan di `po.bankDetails` dan disalin ke `pv.beneficiaryBank`.
- **Pencegahan Duplikasi:**
  - Tidak ada validasi nomor rekening atau nama vendor ganda di tingkat master data.
  - Validasi duplikasi hanya ada pada level relasi transaksi: satu PR hanya dapat digunakan untuk satu PO (`assertPoPrCardinality`), dan satu PO/AV/RB hanya dapat dibuatkan satu PV aktif (`DUPLICATE_PV_FOR_SOURCE`).

### 3.5. Lampiran Berkas (Attachments)
- **Kategori Lampiran:**
  - Didefinisikan dalam enum TypeScript `AttachmentCategoryType`: `IAM_MEMO`, `QUOTATION`, `INVOICE`, `RECEIPT`, `REFUND_PROOF`, `PAYMENT_PROOF`, `PHOTO`, `BAST`, `SUPPORTING`, `OTHER`.
- **Aturan Wajib (Mandatory Rules Server-Side):**
  - GR Barang: Wajib lampiran `PHOTO`.
  - GR Jasa: Wajib lampiran `BAST`.
  - RB (Reimbursement): Wajib minimal 1 lampiran `RECEIPT`.
  - RC Surplus: Wajib lampiran `REFUND_PROOF` bukti transfer pengembalian uang.
  - PR/PO $\ge$ Rp 5.000.000: Wajib mencantumkan nomor IAM memo.
- **Penyimpanan Fisik:**
  - File disimpan di `.data/uploads/${id}-${safeName}`.
  - Batas ukuran file: 10 MB (`MAX_ATTACHMENT_BYTES`).
  - Tipe file diizinkan: `application/pdf`, `image/png`, `image/jpeg`.
  - Integritas berkas diverifikasi dengan hash SHA-256 pada saat pengunggahan.

# MASTER DATA SCHEMA PROPOSAL — PHASE 00
## Master Data Relational Schema Specification (Task DBH-002 & REC-01 s/d REC-04)

**Project:** BLC Caready Procurement Pro  
**Document:** Master Data Relational Schema Specification (Task DBH-002)  
**Status:** AUTHORIZED — DOCUMENTATION REVISION ONLY  
**Reference:** BLC Procurement Guide v3, November 2026  
**Scope:** Finalisasi REG-01–REG-06, DB-REVIEW-01–03, dan Rekonsiliasi REC-01–REC-04  
**Implementation:** LOCKED  
**Production Migration:** LOCKED  
**Review Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Executive Summary

Dokumen ini merinci rancangan skema relasional minimal yang diajukan untuk memperkuat fondasi data master BLC Caready Procurement Pro v1. Seluruh rancangan mematuhi:
- **ADR-DB-001 s/d ADR-DB-007**.
- **REG-01 s/d REG-06** (termasuk Maker–Checker perubahan rekening rekanan dan penolakan penonaktifan cabang aktif).
- **DB-REVIEW-01 s/d DB-REVIEW-03** (struktur organisasi datar, pembekuan snapshot data perbankan transaksi, dan backup terkoordinasi).
- **REC-01 s/d REC-04** (rekonsiliasi 7 tipe dokumen resmi termasuk `RC`, pembayaran bertahap PO dengan batasan *outstanding balance*, migrasi aman tabel eksisting `org_units`, dan penguatan constraint fisik Maker–Checker).

> [!IMPORTANT]
> **Status: PROPOSED SCHEMA DESIGN — LOCKED UNTIL PO IMPLEMENTATION APPROVAL.**  
> Seluruh skema tabel baru di bawah ini masih berstatus proposal rancangan. Tidak ada tabel fisik baru yang dibuat atau dimodifikasi pada database operasional pada tahap ini.

---

## 2. A. Skema Master Cabang (Branch Master — ADR-DB-001 & REG-05)

Menggantikan daftar statis [`src/domain/branches.ts`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/src/domain/branches.ts) menjadi entitas dinamis yang dikelola oleh Administrator.

### DDL Usulan: Tabel `branches`
```sql
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,                       -- e.g. 'brc-bks', 'brc-sby' atau UUID kanonikal
  code TEXT NOT NULL UNIQUE,                 -- e.g. 'BKS', 'CBN', 'MDN', 'SBY', 'PKU', 'MKS', 'SMD'
  name TEXT NOT NULL,                        -- e.g. 'Bekasi', 'Cibinong', 'Surabaya'
  address TEXT,                              -- Alamat operasional kantor cabang
  status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,                  -- ISO 8601
  created_by TEXT NOT NULL,                  -- Admin User ID
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_branches_code_unique ON branches(code);
CREATE INDEX IF NOT EXISTS idx_branches_status ON branches(status);
```

### Tabel Audit: `branch_audit`
```sql
CREATE TABLE IF NOT EXISTS branch_audit (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  actor_user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('CREATE', 'UPDATE', 'DEACTIVATE', 'ACTIVATE')),
  at TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_branch_audit_branch ON branch_audit(branch_id);
```

### Karakteristik & Kebijakan Bisnis:
1. **Identifier Stabil:** Kolom `id` bersifat tetap seumur hidup cabang.
2. **Controlled Branch Deactivation (REG-05):** Permintaan penonaktifan cabang (`status = 'INACTIVE'`) **DITOLAK KERAS** oleh sistem jika masih terdapat transaksi aktif atau kewajiban terbuka (dokumen `SUBMITTED`/`IN_REVIEW`, PO/AV/RB tanpa PV, PV belum dibayar, atau draf terbuka).

---

## 3. B. Relasi Pengguna, Cabang & Role (User & Role Relationships — ADR-DB-002, ADR-DB-003, REG-04)

Memperkuat tabel `app_users` eksisting pada [`server/organization.ts#L56`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/server/organization.ts#L56).

### Migrasi Aditif pada `app_users`:
```sql
-- Penambahan kolom referensi cabang utama, unit organisasi, dan atribut jabatan
ALTER TABLE app_users ADD COLUMN primary_branch_id TEXT REFERENCES branches(id);
ALTER TABLE app_users ADD COLUMN organization_unit_id TEXT REFERENCES org_units(id);
ALTER TABLE app_users ADD COLUMN job_title TEXT;
```

### Evaluasi Role, Jabatan & Kewenangan:
- **Single Primary Application Role (ADR-DB-003):** Setiap pengguna memiliki tepat satu role aplikasi utama (`PEMOHON`, `ADMIN`, `ATASAN`, `AYU`, `BOD_HERY`, `BOD_HASHIMOTO`, `KEUANGAN`).
- **Jabatan Bukan Kewenangan Approval (REG-04):** Kolom `job_title` adalah informasi deskriptif organisasi. Kewenangan approval diberikan melalui penugasan organisasi eksplisit (`org_assignments`), penugasan stage default (`approval_stage_assignments`), dan snapshot submission (`approval_assignment_snapshots`).

---

## 4. C. Struktur Unit Organisasi Datar & Migrasi Aman (Flat Units & Safe Migration — REG-04, DB-REVIEW-01, REC-03)

### Realitas Tabel Eksisting (`server/organization.ts#L49`):
Tabel `org_units` saat ini sudah ada dengan struktur v1:
```sql
CREATE TABLE IF NOT EXISTS org_units (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL
);
```
Fungsi `schemaState(db)` pada [`server/organization.ts#L64-L105`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/server/organization.ts#L64-L105) memeriksa kecocokan skema dengan ketat terhadap `org_schema_version = 2`. Eksekusi `CREATE TABLE IF NOT EXISTS org_units` tidak akan menambahkan kolom baru pada tabel yang sudah terpasang fisik.

### Prosedur Migrasi Aditif Aman (Phase DB-02 / REC-03):
Migrasi dieksekusi secara terprogram dengan memeriksa `PRAGMA table_info(org_units)` sebelum menambahkan kolom:
```sql
-- 1. Deteksi dan tambahkan kolom baru secara aditif
-- (Dijalankan dalam transaksi BEGIN IMMEDIATE ... COMMIT)
ALTER TABLE org_units ADD COLUMN code TEXT;
ALTER TABLE org_units ADD COLUMN branch_id TEXT REFERENCES branches(id);
ALTER TABLE org_units ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE'));
ALTER TABLE org_units ADD COLUMN updated_at TEXT;
ALTER TABLE org_units ADD COLUMN updated_by TEXT;

-- 2. Buat indeks parsial untuk kode unik
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_units_code ON org_units(code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_org_units_branch ON org_units(branch_id);
CREATE INDEX IF NOT EXISTS idx_org_units_status ON org_units(status);

-- 3. Naikkan versi skema organisasi ke versi 3
UPDATE org_schema_version SET version = 3;
```

---

## 5. D. Skema Master Vendor & Maker–Checker (Vendor Master & REC-04)

### DDL Usulan: Tabel `vendors`
```sql
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,                       -- e.g. 'vnd-2026-0001' atau UUID
  vendor_code TEXT NOT NULL UNIQUE,          -- Kode resmi rekanan, e.g. 'VND-001'
  legal_name TEXT NOT NULL,                  -- Nama resmi badan hukum / perorangan
  trade_name TEXT,                           -- Nama merek dagang / toko
  tax_id_npwp TEXT,                          -- Nomor Pokok Wajib Pajak (15/16 digit)
  email TEXT,                                -- Email kontak korespondensi
  phone TEXT,                                -- Nomor telepon operasional
  address TEXT,                              -- Alamat domisili perusahaan
  status TEXT NOT NULL CHECK(status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'BLACKLISTED')) DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,                  -- Admin User ID (REG-01: Admin Only)
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_code ON vendors(vendor_code);
CREATE INDEX IF NOT EXISTS idx_vendors_legal_name ON vendors(legal_name);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
```

### DDL Usulan: Tabel `vendor_bank_accounts`
```sql
CREATE TABLE IF NOT EXISTS vendor_bank_accounts (
  id TEXT PRIMARY KEY,                       -- e.g. 'vba-0001' atau UUID
  vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  bank_name TEXT NOT NULL,                   -- e.g. 'BCA', 'Mandiri', 'BRI', 'BNI'
  account_number TEXT NOT NULL,              -- Nomor rekening bank
  account_holder_name TEXT NOT NULL,         -- Nama pemilik rekening sesuai buku tabungan
  is_primary INTEGER NOT NULL CHECK(is_primary IN (0, 1)) DEFAULT 1,
  status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vba_vendor ON vendor_bank_accounts(vendor_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vba_account_unique ON vendor_bank_accounts(vendor_id, bank_name, account_number);
```

### DDL Usulan: Tabel `vendor_bank_account_change_requests` (Maker–Checker REC-04)
```sql
CREATE TABLE IF NOT EXISTS vendor_bank_account_change_requests (
  id TEXT PRIMARY KEY,                       -- e.g. 'vbacr-0001' atau UUID
  vendor_id TEXT NOT NULL REFERENCES vendors(id),
  target_account_id TEXT REFERENCES vendor_bank_accounts(id), -- NULL jika pengajuan rekening baru
  change_type TEXT NOT NULL CHECK(change_type IN ('ADD_ACCOUNT', 'UPDATE_ACCOUNT', 'DEACTIVATE_ACCOUNT')),
  proposed_data TEXT NOT NULL,               -- JSON payload data rekening yang diajukan
  reason TEXT NOT NULL,                      -- Alasan perubahan
  status TEXT NOT NULL CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
  maker_user_id TEXT NOT NULL REFERENCES app_users(id),
  checker_user_id TEXT REFERENCES app_users(id),
  requested_at TEXT NOT NULL,
  reviewed_at TEXT,
  review_reason TEXT,
  -- CONSTRAINT 1: Maker dan Checker wajib berbeda (mencegah self-approval pada level database)
  CONSTRAINT chk_maker_checker_distinct CHECK (checker_user_id IS NULL OR maker_user_id <> checker_user_id),
  -- CONSTRAINT 2: Status PENDING tidak boleh memiliki checker; status terminal wajib memiliki checker dan tanggal review
  CONSTRAINT chk_review_state_integrity CHECK (
    (status = 'PENDING' AND checker_user_id IS NULL AND reviewed_at IS NULL) OR
    (status IN ('APPROVED', 'REJECTED') AND checker_user_id IS NOT NULL AND reviewed_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_vbacr_status ON vendor_bank_account_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_vbacr_vendor ON vendor_bank_account_change_requests(vendor_id);
```

### Perlindungan Concurrency & Otorisasi Backend (REC-04):
- **Otorisasi Dual Admin:** Maker dan Checker wajib diverifikasi memiliki peran `ADMIN` aktif pada backend middleware.
- **Atomic State Transition:** Keputusan persetujuan/penolakan dieksekusi dengan kueri bersyarat atomik:
  ```sql
  UPDATE vendor_bank_account_change_requests 
  SET status = ?, checker_user_id = ?, reviewed_at = ?, review_reason = ? 
  WHERE id = ? AND status = 'PENDING';
  ```
  Jika baris yang terpengaruh bernilai 0, sistem mengembalikan HTTP 409 `CHANGE_REQUEST_ALREADY_REVIEWED`.

---

## 6. E. Skema Master Rekening Kas Perusahaan (Global BLC Accounts — ADR-DB-007, REG-06)

### DDL Usulan: Tabel `company_bank_accounts`
```sql
CREATE TABLE IF NOT EXISTS company_bank_accounts (
  id TEXT PRIMARY KEY,                       -- e.g. 'cba-bca-ops-pst' atau UUID
  account_code TEXT NOT NULL UNIQUE,         -- e.g. 'BCA-OPS-PST', 'MDR-OPS-PST'
  bank_name TEXT NOT NULL,                   -- e.g. 'BCA', 'Mandiri'
  account_number TEXT NOT NULL,              -- e.g. '1234567890'
  account_holder_name TEXT NOT NULL,         -- e.g. 'PT BLC Caready'
  branch_office TEXT,                        -- Kantor cabang bank pembuka rekening
  currency TEXT NOT NULL DEFAULT 'IDR',
  status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cba_code_unique ON company_bank_accounts(account_code);
CREATE INDEX IF NOT EXISTS idx_cba_status ON company_bank_accounts(status);
```

---

## 7. F. Rekonsiliasi Jenis Dokumen & Kardinalitas Pembayaran (REC-01 & REC-02)

| Kategori Data | Klasifikasi Resmi | Kardinalitas Terhadap PV | Karakteristik & Lifecycle Bisnis |
|---|:---:|:---:|---|
| **Purchase Requisition (`PR`)** | `DocType` | Tidak langsung (menghasilkan PO) | Permintaan pengadaan awal dengan batas anggaran OPEX/CAPEX/PROJECT. |
| **Purchase Order (`PO`)** | `DocType` | **1 : N (Bertahap / Termin)** | Pesanan resmi ke vendor. Mendukung beberapa PV termin selama akumulasi tidak melampaui `Outstanding Balance` (REC-02). |
| **Advance Payment (`AV`)** | `DocType` | **1 : 1 (Tunggal)** | Pengajuan uang muka operasional/kasbon. Wajib dipertanggungjawabkan melalui dokumen `RC`. |
| **Reimbursement (`RB`)** | `DocType` | **1 : 1 (Tunggal)** | Penggantian biaya riil yang telah ditalangi karyawan. |
| **Realisasi Kasbon (`RC`)** | `DocType` | **1 : 1 (Jika DEFICIT)** | Dokumen pertanggungjawaban uang muka AV (REC-01). Skenario `DEFICIT` menghasilkan satu PV selisih (`RC_DEFICIT`). |
| **Goods Receipt (`GR`)** | `DocType` | Tidak menghasilkan PV | Bukti serah terima barang/jasa. Selesai pada submission tanpa approval stage terpisah. |
| **Payment Voucher (`PV`)** | `DocType` | N/A (Dokumen Pembayaran) | Perintah bayar resmi yang diterbitkan Tim Keuangan; diverifikasi bertahap (Finance Reviewer $\rightarrow$ Direksi). |
| **Payment Record** | `Execution Record` | **1 : 1 per PV** | Catatan eksekusi kasir/kas keluar saat PV dicairkan. **Bukan jenis dokumen `DocType` dan bukan tahap approval.** |
| **Supporting Attachments** | `Attachments` | N/A | Berkas digital penunjang (`IAM_MEMO`, `QUOTATION`, `INVOICE`, `RECEIPT`, `PHOTO`, `BAST`, `REFUND_PROOF`, `PAYMENT_PROOF`). |

> [!CAUTION]
> Seluruh skema berstatus proposal rancangan. Tidak ada eksekusi DDL fisik ke database `.data/blc-local.sqlite` sampai persetujuan implementasi resmi disahkan oleh Product Owner.

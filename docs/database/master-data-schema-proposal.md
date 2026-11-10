# MASTER DATA SCHEMA PROPOSAL — PHASE 00
**Project:** BLC Caready Procurement Pro  
**Document:** Master Data Relational Schema Specification (Task DBH-002)  
**Status:** PROPOSED SCHEMA DESIGN — LOCKED UNTIL PO APPROVAL  
**Review Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Executive Summary

Dokumen ini merinci rancangan skema relasional minimal yang diajukan untuk memperkuat fondasi data master BLC Caready Procurement Pro v1. Seluruh rancangan mematuhi:
- **ADR-DB-001 s/d ADR-DB-007**.
- Format identitas kanonikal terstandarisasi.
- Mekanisme soft deactivation tanpa mutasi destruktif.
- Keterlacakan audit penuh (*full auditability*).

---

## 2. A. Skema Master Cabang (Branch Master)

Menggantikan daftar statis [`src/domain/branches.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/domain/branches.ts) menjadi entitas dinamis yang dikelola oleh Administrator.

### DDL Usulan: Tabel `branches`
```sql
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,                       -- e.g. 'brc-bks', 'brc-sby' atau UUID
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
1. **Identifier Stabil:** Kolom `id` bersifat tetap seumur hidup cabang. Perubahan nama (misal: "Bekasi Timur" menjadi "Bekasi Barat") tidak mengubah `id` maupun relasi historis.
2. **Kode Cabang Unik:** Kolom `code` dibatasi format alfanumerik 3-5 karakter huruf kapital unik.
3. **Penonaktifan Aman:** Cabang yang ditutup diubah statusnya menjadi `'INACTIVE'`. Penghapusan fisik baris (`DELETE FROM branches`) **dilarang keras** jika cabang tersebut telah dirujuk oleh pengguna atau transaksi.

---

## 3. B. Relasi Pengguna, Cabang & Role (User & Role Relationships)

Memperkuat tabel `app_users` eksisting pada [`server/organization.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/organization.ts).

### Migrasi Aditif pada `app_users`:
```sql
-- Penambahan kolom referensi cabang utama (Primary Branch)
ALTER TABLE app_users ADD COLUMN primary_branch_id TEXT REFERENCES branches(id);
```

### Evaluasi Role & Permission:
- **Primary Application Role:** Sesuai **ADR-DB-003**, setiap pengguna memiliki tepat satu *primary application role* pada kolom `role` (`PEMOHON`, `ADMIN`, `ATASAN`, `AYU`, `BOD_HERY`, `BOD_HASHIMOTO`, `KEUANGAN`).
- **Tidak Memerlukan Tabel RBAC Terpisah:** Sistem tidak memerlukan tabel multi-role baru karena kewenangan approval tidak diturunkan dari global role, melainkan dikontrol oleh snapshot penugasan stage (`approval_stages.assigned_approver_id`).
- **Integritas Penugasan:** Akun dengan status `INACTIVE` atau `UNVERIFIED` secara otomatis ditolak jika didaftarkan sebagai approver dalam workflow.

---

## 4. C. Hirarki & Integritas Organisasi (Organization Hierarchy)

Memperluas struktur unit organisasi pada `org_units` dan `org_assignments`.

### DDL Perluasan: Tabel `org_units`
```sql
-- Skema org_units yang diperkuat
CREATE TABLE IF NOT EXISTS org_units (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,                          -- e.g. 'FIN', 'HRGA', 'OPS', 'MKT'
  name TEXT NOT NULL UNIQUE,                 -- e.g. 'Finance & Accounting', 'Operation'
  parent_unit_id TEXT REFERENCES org_units(id), -- Dukungan hirarki subordinasi (opsional)
  status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);
```

### Pencegahan Hirarki Tidak Valid (Self-Referencing Loop):
Validasi aplikasi dan trigger mencegah `parent_unit_id = id` atau siklus rantai organisasi (A membawahi B, B membawahi A).

### Relasi Supervisor (`org_assignments`):
- Mempertahankan struktur eksisting dengan foreign key ke `org_units(id)` dan `app_users(id)`.
- Partial unique index `org_assignment_active_unique` tetap ditegakkan:
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS org_assignment_active_unique 
  ON org_assignments(unit_id, supervisor_user_id) WHERE active=1;
  ```

---

## 5. D. Skema Master Vendor & Rekening Rekanan (Vendor Master)

Mengatasi kesenjangan kritis **GAP-P0-01** sesuai mandat **ADR-DB-006**.

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
  created_by TEXT NOT NULL,
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
-- Mencegah pendaftaran nomor rekening yang sama untuk vendor yang sama
CREATE UNIQUE INDEX IF NOT EXISTS idx_vba_account_unique ON vendor_bank_accounts(vendor_id, bank_name, account_number);
```

### Tabel Audit: `vendor_audit`
```sql
CREATE TABLE IF NOT EXISTS vendor_audit (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL REFERENCES vendors(id),
  actor_user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('CREATE', 'UPDATE', 'STATUS_CHANGE', 'BANK_ACCOUNT_ADD', 'BANK_ACCOUNT_UPDATE')),
  at TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT NOT NULL
);
```

### Strategi Pencegahan Duplikasi & Integritas Transaksi Historis:
1. **Deteksi Duplikasi Cerdas:** Validasi tidak hanya membandingkan kesamaan string nama, tetapi mengecek kombinasi:
   - Kesamaan nomor NPWP (`tax_id_npwp`).
   - Kesamaan nomor rekening bank vendor (`bank_name` + `account_number`).
   - Normalisasi teks nama (menghapus "PT", "CV", spasi, tanda baca).
2. **Kekebalan Transaksi Historis:** Dokumen transaksi yang telah disetujui (PO/PV) **tidak membaca ulang** master vendor secara dinamis saat dicetak atau diinspeksi. Data rekening vendor disalin secara permanen ke dalam dokumen saat PO diterbitkan, sehingga pembaruan rekening vendor di kemudian hari tidak merusak bukti audit masa lampau.

---

## 6. E. Skema Master Rekening Kas Perusahaan (BLC Source Bank Accounts)

Mengatasi kesenjangan **GAP-P0-02** sesuai mandat **ADR-DB-007**.

### DDL Usulan: Tabel `company_bank_accounts`
```sql
CREATE TABLE IF NOT EXISTS company_bank_accounts (
  id TEXT PRIMARY KEY,                       -- e.g. 'cba-bca-ops-pst' atau UUID
  account_code TEXT NOT NULL UNIQUE,         -- e.g. 'BCA-OPS-PST', 'MDR-OPS-SBY'
  bank_name TEXT NOT NULL,                   -- e.g. 'BCA', 'Mandiri'
  account_number TEXT NOT NULL,              -- e.g. '1234567890'
  account_holder_name TEXT NOT NULL,         -- e.g. 'PT BLC Caready'
  branch_office TEXT,                        -- Kantor cabang pembuka rekening, e.g. 'KCU Rawamangun'
  currency TEXT NOT NULL DEFAULT 'IDR',
  branch_scope TEXT NOT NULL DEFAULT '*',    -- '*' berlaku nasional, atau kode cabang tertentu
  status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cba_code_unique ON company_bank_accounts(account_code);
CREATE INDEX IF NOT EXISTS idx_cba_status ON company_bank_accounts(status);
```

### Tabel Audit: `company_bank_account_audit`
```sql
CREATE TABLE IF NOT EXISTS company_bank_account_audit (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES company_bank_accounts(id),
  actor_user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('CREATE', 'UPDATE', 'DEACTIVATE', 'ACTIVATE')),
  at TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT NOT NULL
);
```

### Kontrol Otorisasi & Visibilitas:
- **Pengelolaan:** Hanya pengguna dengan peran `ADMIN` dan `KEUANGAN` yang memiliki hak akses Create, Update, dan Deactivate rekening perusahaan.
- **Validasi Transaksi:** Pada formulir pelunasan Payment Voucher ([`FormPVPayment.tsx`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/forms/FormPVPayment.tsx)), dropdown rekening kas hanya menampilkan rekening dengan `status = 'ACTIVE'`. Rekening yang dinonaktifkan tetap tersimpan untuk keterlacakan transaksi historis.

---

## 7. F. Evaluasi Jenis Dokumen & Nilai Lookup (Lookup Values)

Berdasarkan prinsip kesederhanaan teknis dan keputusan **ADR-DB-005**:

| Tipe Data / Nilai Lookup | Klasifikasi Terpilih | Justifikasi Teknis & Bisnis |
|---|:---:|---|
| **Jenis Dokumen (`DocType`)** | **`Static Enum`** | **Keputusan PO ADR-DB-005:** Jenis pengajuan tetap (PR, PO, AV, RB, PV, GR, Payment Record). Logika bisnis, formulir, dan validasi per jenis dokumen dikodekan secara eksplisit. Menjadikannya tabel dinamis adalah *over-engineering* tanpa nilai tambah. |
| **Status Dokumen (`DocumentStatus`)** | **`Static Enum`** | Status adalah representasi *Finite State Machine* (`DRAFT`, `SUBMITTED`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `PAID`). Transisi status diatur oleh engine validasi ketat. |
| **Tipe Anggaran (`BudgetType`)** | **`Static Enum`** | `OPEX`, `CAPEX`, `PROJECT`. Cukup didefinisikan sebagai string konstan yang terstandarisasi antara formulir PR dan formulir lainnya. |
| **Metode Pembayaran (`PaymentMethod`)** | **`Static Enum`** | `BANK_TRANSFER`, `CASH`. Pilihan cara bayar terikat langsung pada validasi kelengkapan rekening bank di server. |
| **Kategori Lampiran (`AttachmentCategoryType`)**| **`Static Enum`** | `IAM_MEMO`, `QUOTATION`, `INVOICE`, `RECEIPT`, `PHOTO`, `BAST`, `REFUND_PROOF`, `PAYMENT_PROOF`, `SUPPORTING`, `OTHER`. Aturan wajib lampiran terikat pada tipe dokumen dan receipt type. |

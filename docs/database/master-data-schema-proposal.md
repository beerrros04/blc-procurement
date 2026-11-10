# MASTER DATA SCHEMA PROPOSAL — PHASE 00
## Master Data Relational Schema Specification (Task DBH-002)

**Project:** BLC Caready Procurement Pro  
**Document:** Master Data Relational Schema Specification (Task DBH-002)  
**Status:** DESIGN FINALIZED — AWAITING IMPLEMENTATION APPROVAL  
**Scope:** Finalisasi REG-01–REG-06 dan DB-REVIEW-01–03  
**Implementation:** NOT AUTHORIZED  
**Production Migration:** LOCKED  
**Review Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Executive Summary

Dokumen ini merinci rancangan skema relasional minimal yang diajukan untuk memperkuat fondasi data master BLC Caready Procurement Pro v1. Seluruh rancangan mematuhi:
- **ADR-DB-001 s/d ADR-DB-007**.
- **REG-01 s/d REG-06** (termasuk Maker–Checker perubahan rekening rekanan dan penolakan penonaktifan cabang aktif).
- **DB-REVIEW-01 s/d DB-REVIEW-03** (struktur organisasi datar, pembekuan snapshot data perbankan transaksi, dan backup terkoordinasi).
- Format identitas kanonikal terstandarisasi.
- Mekanisme *soft deactivation* tanpa mutasi destruktif (*no hard delete*).
- Keterlacakan audit penuh (*full auditability*).

> [!IMPORTANT]
> **Status: PROPOSED SCHEMA DESIGN — LOCKED UNTIL PO IMPLEMENTATION APPROVAL.**  
> Seluruh skema tabel baru di bawah ini masih berstatus proposal rancangan. Tidak ada tabel fisik baru yang dibuat pada tahap ini.

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
2. **Kode Cabang Unik:** Kolom `code` dibatasi format alfanumerik 3-5 karakter huruf kapital unik.
3. **Controlled Branch Deactivation (REG-05):** Permintaan penonaktifan cabang (`status = 'INACTIVE'`) **DITOLAK KERAS** oleh sistem jika masih terdapat transaksi aktif atau kewajiban terbuka (dokumen `SUBMITTED`/`IN_REVIEW`, PO/AV/RB tanpa PV, PV belum dibayar, atau draf terbuka).
4. **Penghapusan Fisik Dilarang:** `DELETE FROM branches` dilarang keras seumur hidup sistem jika cabang telah dirujuk pengguna atau transaksi.

---

## 3. B. Relasi Pengguna, Cabang & Role (User & Role Relationships — ADR-DB-002, ADR-DB-003, REG-04)

Memperkuat tabel `app_users` eksisting pada [`server/organization.ts`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/server/organization.ts).

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
- **Integritas Penugasan:** Akun berstatus `INACTIVE` atau `UNVERIFIED` secara otomatis ditolak sebagai approver.

---

## 4. C. Struktur Unit Organisasi Datar (Flat Organizational Units — ADR-DB-004, REG-04, DB-REVIEW-01)

Sesuai keputusan final Product Owner pada **REG-04** dan **DB-REVIEW-01**, struktur organisasi menggunakan model datar (*flat*). Usulan awal mengenai hirarki subordinasi bertingkat (`parent_unit_id`) **SECARA RESMI DITIADAKAN**.

### DDL Perluasan: Tabel `org_units` (Flat)
```sql
CREATE TABLE IF NOT EXISTS org_units (
  id TEXT PRIMARY KEY,                       -- e.g. 'unt-ops-bks', 'unt-fin'
  code TEXT UNIQUE,                          -- e.g. 'OPS-BKS', 'FIN-PST', 'HRGA'
  name TEXT NOT NULL,                        -- e.g. 'Operation Bekasi', 'Finance & Accounting'
  branch_id TEXT REFERENCES branches(id),    -- Menghubungkan unit ke cabang terkait (NULL jika multi-cabang/pusat)
  status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_org_units_branch ON org_units(branch_id);
CREATE INDEX IF NOT EXISTS idx_org_units_status ON org_units(status);
```

### Relasi Supervisor Organisasi (`org_assignments`):
- Mempertahankan struktur eksisting yang mengaitkan unit dan supervisor:
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS org_assignment_active_unique 
  ON org_assignments(unit_id, supervisor_user_id) WHERE active=1;
  ```
- **Pengguna dapat menjadi supervisor untuk beberapa unit** apabila penugasannya sah.
- Kantor pusat atau divisi yang melayani lebih dari satu cabang direpresentasikan secara eksplisit, tidak diasumsikan dari nama.

---

## 5. D. Skema Master Vendor & Rekening Rekanan (Vendor Master — ADR-DB-006, REG-01, REG-02, DB-REVIEW-02)

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

### DDL Usulan: Tabel `vendor_bank_account_change_requests` (Maker–Checker REG-02)
```sql
CREATE TABLE IF NOT EXISTS vendor_bank_account_change_requests (
  id TEXT PRIMARY KEY,                       -- e.g. 'vbacr-0001' atau UUID
  vendor_id TEXT NOT NULL REFERENCES vendors(id),
  target_account_id TEXT REFERENCES vendor_bank_accounts(id), -- NULL jika pengajuan rekening baru
  change_type TEXT NOT NULL CHECK(change_type IN ('ADD_ACCOUNT', 'UPDATE_ACCOUNT', 'DEACTIVATE_ACCOUNT')),
  proposed_data TEXT NOT NULL,               -- JSON payload berisi data rekening yang diajukan
  reason TEXT NOT NULL,                      -- Alasan perubahan (surat resmi vendor dsb)
  status TEXT NOT NULL CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
  maker_user_id TEXT NOT NULL REFERENCES app_users(id),
  checker_user_id TEXT REFERENCES app_users(id),
  requested_at TEXT NOT NULL,
  reviewed_at TEXT,
  review_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_vbacr_status ON vendor_bank_account_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_vbacr_vendor ON vendor_bank_account_change_requests(vendor_id);
```

### Aturan Ketat Maker–Checker (REG-02):
1. **Admin Only:** Hanya pengguna berhak akses Admin yang dapat bertindak sebagai Maker atau Checker.
2. **Dual-Control Enforcement:** `maker_user_id` wajib berbeda dengan `checker_user_id` (`maker_user_id !== checker_user_id`). Larangan keras *self-approval*.
3. **No Unapproved Accounts in Transactions:** Rekening berstatus `PENDING` pada change request dilarang digunakan dalam formulir PO.
4. **Single Admin Handling:** Jika hanya ada satu Admin aktif, pengajuan menunggu Checker Admin lain; tidak diperkenankan membuat fallback auto-approval.

### Pembekuan Snapshot Perbankan Transaksi (DB-REVIEW-02):
- Saat PO diajukan (`SUBMITTED`), data rekening vendor disalin secara permanen ke snapshot transaksi PO.
- Perubahan rekening vendor di kemudian hari **TIDAK MENGUBAH** data rekening pada PO yang telah diajukan atau disetujui.
- Penggantian rekening PO wajib melalui revisi dokumen resmi, bukan *silent overwrite*.
- Dokumen PV yang bersumber dari PO wajib menggunakan informasi rekening tujuan dari snapshot PO, bukan membaca ulang nomor rekening terbaru dari master vendor.

---

## 6. E. Skema Master Rekening Kas Perusahaan (Global BLC Bank Accounts — ADR-DB-007, REG-06)

Sesuai keputusan final **REG-06**, seluruh rekening kas BLC aktif tersedia untuk semua cabang. Batasan wajib `branch_scope` **SECARA RESMI DIHAPUS**.

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

### Kontrol Otorisasi & Transaksi:
- **Pengelolaan:** Dikelola bersama oleh Tim `ADMIN` dan `KEUANGAN`.
- **Ketersediaan Global:** Seluruh kantor cabang dapat menggunakan rekening kas aktif yang sama.
- **Validasi Pembayaran PV:** Pelunasan PV hanya dapat memilih rekening kas yang berstatus `ACTIVE`. Rekening `INACTIVE` tidak muncul pada formulir pelunasan baru.

---

## 7. F. Revisi Inventaris Entitas Master Data (Section 9 Addendum)

| Entitas Data | Klasifikasi Desain | Tindakan Teknis Terpilih |
|---|:---:|---|
| **`app_users`** | `REUSE` + Extend | Mempertahankan tabel SQLite eksisting; menambah kolom `primary_branch_id`, `organization_unit_id`, dan `job_title`. |
| **`app_user_audit`** | `REUSE` | Mempertahankan skema jejak audit mutasi pengguna tanpa perubahan. |
| **`app_retired_user_ids`** | `REUSE` | Mempertahankan perlindungan anti daur ulang ID pengguna. |
| **`org_units`** | `REUSE` + Flat Extend | Memperluas tabel unit datar tanpa `parent_unit_id`, menambah kolom `code` dan `branch_id`. |
| **`org_assignments`** | `REUSE` | Mempertahankan penugasan supervisor dengan partial unique index. |
| **`approval_*` (9 tabel)** | `REUSE` | Mempertahankan 100% tabel stage engine, snapshot, reassignments, dan idempotency. |
| **`branches`** | `NEW PROPOSAL` | Proposal tabel master cabang dinamis yang dikelola Admin. |
| **`branch_audit`** | `NEW PROPOSAL` | Proposal audit perubahan data cabang. |
| **`vendors`** | `NEW PROPOSAL` | Proposal master rekanan terpusat (Admin only). |
| **`vendor_bank_accounts`** | `NEW PROPOSAL` | Proposal master rekening rekanan berstatus aktif/nonaktif. |
| **`vendor_bank_account_change_requests`** | `NEW PROPOSAL` | Proposal tabel kontrol Maker–Checker untuk perubahan rekening vendor (REG-02). |
| **`vendor_audit`** | `NEW PROPOSAL` | Proposal audit mutasi rekanan dan rekening. |
| **`company_bank_accounts`** | `NEW PROPOSAL` | Proposal master rekening kas BLC global (Admin & Keuangan). |
| **`company_bank_account_audit`** | `NEW PROPOSAL` | Proposal audit mutasi rekening perusahaan. |
| **Document Types (`DocType`)** | `EXISTING STATIC ENUM` | Tetap 7 tipe dokumen statis (ADR-DB-005). |
| **Document Statuses (`DocumentStatus`)** | `EXISTING STATIC ENUM` | Tetap status FSM statis (DRAFT s/d PAID). |

> [!CAUTION]
> Seluruh entitas bertanda `NEW PROPOSAL` masih merupakan spesifikasi rancangan. Tidak ada eksekusi DDL fisik ke database `.data/blc-local.sqlite` sampai ada pengesahan resmi dari Product Owner.

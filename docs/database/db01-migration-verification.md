# BLC PROCUREMENT PRO — DB-01
## Migration & Database Safety Verification Report

**Phase:** DB-01 — Branch Master Foundation  
**Status:** VERIFIED & SEALED  
**Date:** November 2026  
**Operational DB File:** `.data/blc-local.sqlite`

---

## 1. Operational Database Integrity Check (Safety Gate)

Untuk menjamin kepatuhan terhadap perintah Product Owner bahwa **Production Database LOCKED**:

| Parameter | Nilai Awal (Baseline Pre-Implementation) | Nilai Akhir (Post-Implementation & Full Test) | Status Verifikasi |
|---|---|---|---|
| File Path | `.data/blc-local.sqlite` | `.data/blc-local.sqlite` | Identik |
| File Size | 49,152 bytes | 49,152 bytes | 0 byte modified |
| SHA-256 Checksum | `570D12A1A797C19EF0E19AFDBD16B4617A85707C3A02FCE62920E36ECBD050FF` | `570D12A1A797C19EF0E19AFDBD16B4617A85707C3A02FCE62920E36ECBD050FF` | **EXACT MATCH — 100% UNTOUCHED** |

> **Kesimpulan:** Tidak ada satu pun operasi migrasi atau query testing yang menyentuh, membaca, atau memodifikasi database operasional `.data/blc-local.sqlite`. Seluruh pengujian dijalankan pada database terisolasi (`:memory:` dan temporary SQLite files di `os.tmpdir()`).

---

## 2. DDL Implemented in Isolated SQLite

### Tabel: `branches`
```sql
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  address TEXT,
  status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_branches_code_unique ON branches(code);
CREATE INDEX IF NOT EXISTS idx_branches_status ON branches(status);
```

### Tabel: `branch_audit`
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

### Tabel: `branch_schema_version`
```sql
CREATE TABLE IF NOT EXISTS branch_schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);
```

### Perluasan: `app_users.primary_branch_id`
```sql
ALTER TABLE app_users ADD COLUMN primary_branch_id TEXT REFERENCES branches(id);
CREATE INDEX IF NOT EXISTS idx_app_users_primary_branch ON app_users(primary_branch_id);
```

---

## 3. Idempotency & Repeatability Verification

Uji coba eksekusi berulang migration engine:
- `migrateBranchMaster` dijalankan 3 kali berturut-turut pada database yang sama: **0 error**, tidak ada duplikasi data seed.
- `migrateOrganization` dijalankan 5 kali berturut-turut pada database yang sama: **0 error**, skema tetap berstatus `COMPATIBLE`.

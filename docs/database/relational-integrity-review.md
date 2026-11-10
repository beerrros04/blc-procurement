# RELATIONAL INTEGRITY & DATABASE CONSTRAINTS REVIEW — PHASE 00
## Relational Integrity, Database Constraints & Invariants Specification (Task DBH-003 & REC-01 s/d REC-04)

**Project:** BLC Caready Procurement Pro  
**Document:** Relational Integrity & Invariant Specification (Task DBH-003)  
**Status:** AUTHORIZED — DOCUMENTATION REVISION ONLY  
**Reference:** BLC Procurement Guide v3, November 2026  
**Scope:** Finalisasi REG-01–REG-06, DB-REVIEW-01–03, dan Rekonsiliasi REC-01–REC-04  
**Implementation:** LOCKED  
**Production Migration:** LOCKED  
**Review Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Executive Summary

Dokumen ini merumuskan penegakan integritas relasional (*relational integrity*) dan batasan database (*database constraints*) untuk sistem BLC Caready Procurement Pro v1. Penegakan integritas dibagi menjadi dua lapis pertahanan (*defense-in-depth*):
1. **Physical Engine Layer (SQLite Constraints):** Ditegakkan secara fisik oleh mesin database SQLite melalui Foreign Keys, Check Constraints, Unique Indexes, dan Not-Null Constraints.
2. **Application Domain Layer (Domain Invariants):** Ditegakkan secara transaksional di dalam kode backend ([`server/repository.ts`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/server/repository.ts), [`server/stage-engine.ts`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/server/stage-engine.ts), [`server/organization.ts`](file:///C:/Users/Bernard/Documents/personal's%20project/BLC/server/organization.ts)) untuk memvalidasi aturan bisnis kompleks sebelum data ditulis ke disk.

> [!IMPORTANT]
> Seluruh rekomendasi teknis awal mengenai *strict branch isolation*, *hierarchical organization*, dan *branch-scoped bank accounts* telah **SECARA RESMI DIGANTIKAN** oleh keputusan Product Owner (REG-01 s/d REG-06, DB-REVIEW-01 s/d DB-REVIEW-03, dan rekonsiliasi REC-01 s/d REC-04). Dokumen ini berstatus desain final dan terkunci hingga persetujuan implementasi diberikan.

---

## 2. Invarian Wajib Sistem (Mandatory System Invariants)

Berikut adalah tujuh belas (17) invarian wajib yang tidak boleh dilanggar dalam kondisi operasional apapun:

| No | Nama Invarian | Deskripsi Aturan Bisnis | Mekanisme Penegakan | Status |
|:---:|---|---|---|:---:|
| 1 | **User Primary Branch Invariant** | Setiap pengguna aktif wajib merujuk ke cabang yang valid pada master cabang. | FK `app_users.primary_branch_id REFERENCES branches(id)` + validasi status cabang `ACTIVE`. | **Dirancang** |
| 2 | **Single Primary Role Invariant** | Setiap pengguna memiliki tepat satu *primary application role*. Hak akses approval tidak diberikan otomatis oleh role ini. | Kolom `app_users.role` tunggal dengan validasi enum ketat + approval dipisahkan ke stage engine. | **Terpenuhi** |
| 3 | **Valid Approver Assignment Invariant** | Penugasan supervisor pada divisi wajib merujuk ke pengguna yang sah dan berstatus `ACTIVE` serta `VERIFIED`. | Validasi `eligible()` pada `OrganizationRepository` + FK `org_assignments(unit_id, supervisor_user_id)`. | **Terpenuhi** |
| 4 | **Non-Eligible Approver Invariant** | Pengguna yang berstatus `INACTIVE` atau `UNVERIFIED` tidak boleh terdaftar sebagai kandidat approver aktif. | Dicegah oleh method `eligible(unitId)` dan `assertApproverCanAct()` dengan error HTTP 422. | **Terpenuhi** |
| 5 | **Valid Stage Decision Invariant** | Setiap keputusan persetujuan wajib merujuk ke tahapan (`stage_id`) yang berstatus `PENDING` dan assigned to aktor terkait. | FK `approval_decisions.stage_id REFERENCES approval_stages(id)` + unique index 1 keputusan per stage. | **Terpenuhi** |
| 6 | **Vendor Bank Relationship Invariant** | Rekening bank vendor wajib merujuk ke entitas vendor yang terdaftar dan berstatus aktif. | FK `vendor_bank_accounts.vendor_id REFERENCES vendors(id) ON DELETE RESTRICT`. | **Dirancang** |
| 7 | **Active Company Account Invariant (REG-06)** | Pencatatan pembayaran PV hanya boleh memilih rekening kas BLC yang aktif pada `company_bank_accounts` (tersedia global). | Validasi status `ACTIVE` pada endpoint pencatatan pembayaran; tanpa batasan mandatory `branch_scope`. | **Dirancang** |
| 8 | **Approval Snapshot Immutability Invariant**| Data approver yang dikunci saat draf disubmit (`approval_assignment_snapshots`) tidak boleh berubah akibat mutasi master data. | Tabel snapshot terpisah yang diisi sekali saat submission; tidak ada trigger update retrospektif. | **Terpenuhi** |
| 9 | **Zero Orphan Reference Invariant** | Penonaktifan master data (cabang, vendor, rekening) tidak boleh menghapus baris data secara fisik jika sudah pernah dirujuk. | Kebijakan *Soft Deactivation* (`status = 'INACTIVE'`) dan larangan hard `DELETE`. | **Dirancang** |
| 10 | **Controlled Branch Deactivation (REG-05)** | Cabang dilarang dinonaktifkan jika masih memiliki dokumen aktif (`SUBMITTED`/`IN_REVIEW`), PV belum dibayar, atau draf terbuka. | Evaluasi transaksi terbuka di backend; penolakan keras dengan HTTP 409/422 dan daftar transaksi penghambat. | **Dirancang** |
| 11 | **Maker–Checker Physical Integrity (REC-04)** | Pengajuan perubahan rekening vendor wajib memenuhi `maker_user_id <> checker_user_id` pada level database; status review konsisten. | Database `CHECK (checker_user_id IS NULL OR maker_user_id <> checker_user_id)` dan validasi atomic UPDATE. | **Dirancang** |
| 12 | **Banking Data Freeze Invariant (DB-REVIEW-02)** | Data rekening vendor pada PO dibekukan saat submission. Dokumen PV dari PO wajib mengunci rekening dari snapshot PO, bukan master vendor. | Snapshot permanen dalam transaksi dokumen; pelarangan *silent overwrite*. | **Dirancang** |
| 13 | **Global Read / Decoupled Mutation (REG-03)** | Seluruh pengguna sah dapat membaca dokumen lintas cabang, namun otorisasi persetujuan strictly terkunci pada assigned approver. | Query unisolated untuk pembacaan; verifikasi `assigned_approver_id` ketat untuk mutasi; masking nomor rekening lengkap. | **Dirancang** |
| 14 | **Flat Organizational Units Invariant (REG-04)** | Unit organisasi bersifat datar tanpa parent-child hierarchy; jabatan adalah deskriptif profil, bukan dasar kewenangan approval. | Skema `org_units` tanpa `parent_unit_id`; kewenangan atasan wajib berbasis `org_assignments` dan snapshot. | **Dirancang** |
| 15 | **Document Classification Separation (REC-01)** | Sistem membedakan secara tegas 7 `DocType` (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`), berkas lampiran, dan `PaymentRecord`. | Static enum pada types dan database constraints; `PaymentRecord` bukan `DocType` dan bukan tahap approval. | **Dirancang** |
| 16 | **Outstanding Balance Integrity (REC-02)** | Total komitmen PV bertahap pada PO tidak boleh melampaui total nilai neto PO; pembatalan/penolakan PV memulihkan saldo. | Rumus saldo terutang pada `getCommittedAmountOnPo` + locking transaksi untuk mencegah concurrent overpayment. | **Dirancang** |
| 17 | **Safe Additive Migration Invariant (REC-03)** | Migrasi tabel eksisting `org_units` wajib memeriksa skema via `PRAGMA table_info` dan menaikkan versi skema ke v3 dalam transaksi tertutup. | Pengecekan kolom dinamis + transaksi rollback otomatis jika terdeteksi skema incompatible. | **Dirancang** |

---

## 3. Matriks Integritas Relasional Antar-Tabel

```mermaid
graph TD
    subgraph Master_Data_Tables["Tabel Master Data (SQLite)"]
        B[branches]
        BA[branch_audit]
        U[app_users]
        OU[org_units - Flat (REC-03)]
        OA[org_assignments]
        V[vendors]
        VBA[vendor_bank_accounts]
        VBACR[vendor_bank_account_change_requests (REC-04)]
        VA[vendor_audit]
        CBA[company_bank_accounts - Global (REG-06)]
        CBAA[company_bank_account_audit]
    end

    subgraph Approval_Engine_Tables["Tabel Stage Engine (SQLite)"]
        AW[approval_workflows]
        AAS[approval_assignment_snapshots]
        AS[approval_stages]
        AD[approval_decisions]
        ASR[approval_stage_reassignments]
        AIR[approval_idempotency_records]
    end

    subgraph Document_Repo["Dokumen Transaksi (JSON di workspace)"]
        DOCS[PR / PO / AV / RB / RC / GR / PV (REC-01)]
        PAYREC[Payment Record (Execution Artifact)]
    end

    %% Relasi FK Fisik Master
    B -->|FK: primary_branch_id| U
    B -->|FK: branch_id| OU
    B -->|FK: branch_id| BA
    OU -->|FK: unit_id| OA
    U -.->|Logical Ref: supervisor_user_id| OA
    V -->|FK ON DELETE RESTRICT: vendor_id| VBA
    V -->|FK: vendor_id| VBACR
    VBA -->|FK: target_account_id| VBACR
    U -->|FK: maker_user_id (REC-04)| VBACR
    U -->|FK: checker_user_id (REC-04)| VBACR
    V -->|FK: vendor_id| VA
    CBA -->|FK: account_id| CBAA
    
    %% Relasi Stage Engine
    AW -->|FK: workflow_id| AAS
    AW -->|FK: workflow_id| AS
    AW -->|FK: workflow_id| AD
    AW -->|FK: workflow_id| ASR
    AS -->|FK UNIQUE: stage_id| AD
    AS -->|FK: stage_id| ASR
    AAS -->|FK: snapshot_id| AS

    %% Relasi Transaksi & Snapshot
    U -->|Logical Ref: ownerId| DOCS
    B -->|Logical Ref: branch| DOCS
    V -->|Logical Ref: vendorId| DOCS
    VBA -->|DB-REVIEW-02: Frozen Banking Snapshot| DOCS
    CBA -->|Logical Ref: sourceBank| PAYREC
    DOCS -->|Logical Ref: document_id| AW
```

### Aksi Referensial (Referential Actions):
- **Semua Relasi Master Data:** Diterapkan `ON DELETE RESTRICT` (atau default SQLite `RESTRICT`). Tidak diperbolehkan menggunakan `ON DELETE CASCADE` pada entitas master maupun transaksi.

---

## 4. Analisis Strategi Pengindeksan (Indexing Strategy)

| Indeks Fisik | Target Tabel & Kolom | Pola Query yang Dioptimalkan | Jenis Indeks |
|---|---|---|:---:|
| `idx_branches_code_unique` | `branches(code)` | Pencarian cepat dan validasi keunikan kode cabang saat registrasi/update. | UNIQUE |
| `idx_branches_status` | `branches(status)` | Filtering dropdown cabang aktif pada antarmuka pengguna (`WHERE status='ACTIVE'`). | Regular |
| `idx_org_units_code` | `org_units(code)` | Validasi keunikan kode unit organisasi datar (REC-03). | Partial UNIQUE |
| `idx_org_units_branch` | `org_units(branch_id)` | Lookup unit organisasi berdasarkan cabang. | Regular |
| `idx_vendors_code` | `vendors(vendor_code)` | Pencarian vendor berdasarkan kode pada formulir pengadaan. | UNIQUE |
| `idx_vendors_legal_name` | `vendors(legal_name)` | Autocomplete pencarian nama rekanan pada form procurement. | Regular |
| `idx_vba_account_unique` | `vendor_bank_accounts(vendor_id, bank_name, account_number)` | Mencegah pendaftaran nomor rekening ganda untuk vendor yang sama. | Composite UNIQUE |
| `idx_vbacr_status` | `vendor_bank_account_change_requests(status)` | Antrean review checker untuk perubahan rekening vendor (`WHERE status='PENDING'`). | Regular |
| `idx_cba_code_unique` | `company_bank_accounts(account_code)` | Lookup kode unik rekening kas perusahaan saat pelunasan PV. | UNIQUE |
| `idx_decisions_stage_unique` | `approval_decisions(stage_id)` | Menjamin aturan satu tahapan hanya memiliki tepat satu keputusan final. | UNIQUE |
| `org_assignment_active_unique` | `org_assignments(unit_id, supervisor_user_id) WHERE active=1` | Mencegah penugasan aktif ganda untuk pasangan unit dan supervisor yang sama. | Partial UNIQUE |
| `idx_idempotency_lookup` | `approval_idempotency_records(...)` | Fast lookup kunci idempotensi pada pemanggilan approval berulang. | Composite |

---

## 5. Konfigurasi Mesin SQLite Enterprise & Prosedur Pemeriksaan Integritas

```typescript
// Konfigurasi Standar Engine SQLite BLC Procurement Pro
export function configureSqliteEngine(db: DatabaseSync): void {
  // 1. Wajib aktifkan Foreign Key Enforcement
  db.exec('PRAGMA foreign_keys = ON;');

  // 2. Aktifkan Write-Ahead Logging (WAL) untuk konkurensi pembacaan & penulisan
  db.exec('PRAGMA journal_mode = WAL;');

  // 3. Sinkronisasi aman yang seimbang dengan performa
  db.exec('PRAGMA synchronous = NORMAL;');

  // 4. Timeout tunggu penguncian basis data (5 detik) untuk mencegah 'database is locked'
  db.exec('PRAGMA busy_timeout = 5000;');

  // 5. Penggunaan memori sementara untuk indexing dan sorting
  db.exec('PRAGMA temp_store = MEMORY;');
}
```

### Prosedur Pemeriksaan Integritas Otomatis (DB-REVIEW-03):
Pada proses *health check*, saat migrasi skema dijalankan, dan setelah prosedur *restore* cadangan, server mengeksekusi dua perintah verifikasi integritas:
1. `PRAGMA integrity_check;` — Memastikan berkas biner SQLite tidak mengalami kerusakan struktur B-Tree atau korupsi halaman.
2. `PRAGMA foreign_key_check;` — Memastikan tidak ada data yatim (*orphaned foreign key references*) yang melanggar batasan relasional.

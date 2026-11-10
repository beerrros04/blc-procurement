# BLC PROCUREMENT PRO — DB-01
## Branch Master & User Legacy Reconciliation Report

**Phase:** DB-01 — Branch Master Foundation  
**Status:** IMPLEMENTED & VERIFIED  
**Date:** November 2026  
**Reference Workbook:** `11. Organization BLC_Nov2026 - 09112026.xlsx` (Sheet: `Organization_BLC`)  
**Production Database Status:** LOCKED (Zero Modifications to `.data/blc-local.sqlite`)

---

## 1. Official Corporate Source Analysis (PM Condition 01)

Sesuai arahan Project Manager (PM Condition 01), identifikasi data master cabang BLC mengacu langsung pada dokumen resmi perusahaan:
- **File:** `11. Organization BLC_Nov2026 - 09112026.xlsx`
- **Sheet:** `Organization_BLC`
- **Tingkat Struktur:** Row 25 (Level Kepala Cabang / Branch Head)

### Pemetaan Sel Workbook vs Nama Resmi Cabang

| No | Workbook Cell | Nama Resmi Korporat (Workbook) | Kode Sistem (Proposed Stable) | Identifier Cabang (`branches.id`) | Status Seed Awal |
|---|---|---|---|---|---|
| 1 | `BE25` | Bekasi | `BKS` | `brc-bks` | `ACTIVE` |
| 2 | `BK25` | Surabaya | `SBY` | `brc-sby` | `ACTIVE` |
| 3 | `BQ25` | Semarang | `SMG` | `brc-smg` | Tersedia untuk registrasi |
| 4 | `BW25` | Palembang | `PLB` | `brc-plb` | Tersedia untuk registrasi |
| 5 | `CC25` | Medan | `MDN` | `brc-mdn` | `ACTIVE` |
| 6 | `CI25` | Pekanbaru | `PKU` | `brc-pku` | `ACTIVE` |
| 7 | `CO25` | Makassar | `MKS` | `brc-mks` | `ACTIVE` |
| 8 | `CU25` | Samarinda | `SMD` | `brc-smd` | `ACTIVE` |
| 9 | `DA25` | Cibinong | `CBN` | `brc-cbn` | `ACTIVE` |

> **Catatan PM Condition 01:**
> - Workbook korporat hanya mencantumkan nama cabang geografis dan nama pemegang jabatan (Kepala Cabang).
> - Singkatan kode 3 huruf (`BKS`, `CBN`, `MDN`, dll.) dan ID `brc-*` adalah identifier teknis sistem aplikasi yang dirancang stabil, unik, case-insensitive, dan immutable.

---

## 2. Legacy User Reconciliation Matrix (DB01-03)

Sesuai aturan ketat ADR-DB-002 dan larangan menebak cabang:
1. Tidak ada tebakan berdasarkan nama lengkap atau domain email.
2. Setiap pengguna operasional dipetakan ke cabang utama tunggal (`primary_branch_id`).
3. Pemetaan akun bawaan sistem (`SEEDED_USERS`) diverifikasi terhadap database relasional `branches`.

### Matriks Rekonsiliasi Pengguna Aktif BLC

| User ID | Full Name | Role | Email | Branch String Legacy | Resolved Primary Branch ID | Status Akun | Catatan Rekonsiliasi |
|---|---|---|---|---|---|---|---|
| `usr-admin-01` | Admin Lokal | `ADMIN` | `admin@blc.co.id` | Bekasi | `brc-bks` | `ACTIVE` | Terverifikasi bootstrap |
| `usr-pemohon-01` | Budi Santoso | `PEMOHON` | `budi@blc.co.id` | Bekasi | `brc-bks` | `UNVERIFIED` | Terpetakan pasti |
| `usr-atasan-01` | Pak Hendra | `ATASAN` | `atasan@blc.co.id` | Surabaya | `brc-sby` | `UNVERIFIED` | Terpetakan pasti |
| `usr-ayu-01` | Bu Ayu | `AYU` | `ayu@blc.co.id` | Bekasi | `brc-bks` | `UNVERIFIED` | Terpetakan pasti |
| `usr-finance-01` | Staff Keuangan | `KEUANGAN` | `finance@blc.co.id` | Bekasi | `brc-bks` | `UNVERIFIED` | Terpetakan pasti |
| `usr-hery-01` | Pak Hery | `BOD_HERY` | `hery@blc.co.id` | Bekasi | `brc-bks` | `UNVERIFIED` | Terpetakan pasti |
| `usr-hashimoto-01` | Mr. Hashimoto | `BOD_HASHIMOTO` | `hashimoto@blc.co.id` | Bekasi | `brc-bks` | `UNVERIFIED` | Terpetakan pasti |

### Rekonsiliasi Akun Tidak Terpetakan (Unmapped Accounts)

- **Jumlah akun tanpa pemetaan pasti:** 0 akun pada seed data operasional.
- **Kebijakan Akun Baru/Lama:** Jika terdapat akun warisan tanpa cabang valid atau di luar daftar 7 cabang terkonfirmasi, kolom `primary_branch_id` tetap bernilai `NULL` sampai Admin menetapkan cabang resmi via endpoint `/api/v1/organization/users/:id`. Sistem menolak pengisian dummy atau tebakan otomatis.

---

## 3. Aturan Integritas Cabang (Validation Safeguards)

1. **Penolakan Cabang Non-Aktif (`BRANCH_INACTIVE`):**
   - Pembuatan user baru (`createUser`) atau pembaruan user (`updateUser`) dengan cabang berstatus `INACTIVE` ditolak dengan status HTTP 422 `BRANCH_INACTIVE`.
2. **Keterbacaan Lintas Cabang (REG-03):**
   - Penugasan cabang utama tidak membatasi hak baca dokumen pengguna. Seluruh dokumen operasional tetap dapat dibaca secara transparan sesuai izin peran.
3. **Audit Perubahan:**
   - Setiap mutasi cabang pengguna dicatat ke dalam `app_user_audit` dengan timestamp ISO dan aktor penanggung jawab.

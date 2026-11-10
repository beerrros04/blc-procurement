# MASTER DATA READINESS REPORT — PHASE 00
**Project:** BLC Caready Procurement Pro  
**Audit Scope:** Enterprise Master Data Readiness Evaluation (AUDIT-006)  
**Status:** AUTHORIZED — AUDIT ONLY  
**Review Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Executive Summary & Evaluasi Kesiapan

Laporan ini menyajikan evaluasi mendalam terhadap kesiapan arsitektur basis data BLC Caready Procurement Pro dalam menangani **data karyawan asli (real employees)** dan **transaksi riil pengadaan (production procurement transactions)**.

Evaluasi dilakukan secara objektif dengan menguji pemenuhan sepuluh (10) kriteria ketat enterprise database terhadap enam belas (16) komponen bisnis sistem.

### Skor Kesiapan Keseluruhan (Overall Readiness Score)
- **Komponen Siap Produksi (`PASS`):** **3 dari 16 (18.75%)** — *Users & Identitas, Unit Organisasi, Workflow Stage Engine.*
- **Komponen Kesiapan Parsial (`PARTIAL`):** **4 dari 16 (25.00%)** — *Roles & Permissions, Supervisor Assignments, Attachments, Transaction Storage.*
- **Komponen Belum Siap / Hilang (`FAIL`):** **9 dari 16 (56.25%)** — *Cabang, Jabatan, Jenis Dokumen, Status Dokumen, Jenis Anggaran, Vendor, Rekening Bank, Metode Pembayaran, Rekening Perusahaan.*

> [!CAUTION]
> **KESIMPULAN AUDIT:** Sistem **BELUM SIAP** digunakan untuk peluncuran data operasional dan transaksi pengadaan riil skala penuh. Walaupun mesin persetujuan (*approval engine*) dan manajemen pengguna telah siap secara teknis, entitas master operasional kritis (terutama **Vendor**, **Rekening Bank**, dan **Cabang**) masih berupa string bebas atau konstanta statis tanpa integritas relasional database.

---

## 2. Kriteria Evaluasi (10 Readiness Criteria)

Setiap komponen bisnis dinilai berdasarkan 10 kriteria standar:
1. **C1 — Permanent Storage:** Tersimpan secara permanen pada database relasional yang persisten lintas restart server.
2. **C2 — CRUD API:** Tersedia endpoint API lengkap untuk Create, Read, Update, Delete/Deactivate oleh pihak berwenang.
3. **C3 — Admin Authorization:** Proteksi otentikasi dan otorisasi hanya untuk Administrator atau role resmi terkait.
4. **C4 — Validation:** Aturan validasi format, tipe data, dan logika bisnis diterapkan secara ketat di sisi server.
5. **C5 — Referential Integrity:** Integritas relasional dijamin via Foreign Keys atau database constraints.
6. **C6 — Duplicate Prevention:** Proteksi terhadap penciptaan data ganda (Unique constraints / deduplication logic).
7. **C7 — Audit Trail:** Pencatatan riwayat perubahan (*who, what, when, before, after*).
8. **C8 — Soft Delete / Lifecycle:** Mekanisme penonaktifan atau deactivasi aman tanpa merusak integritas data historis.
9. **C9 — Frontend Dynamic Usage:** Antarmuka pengguna mengonsumsi data secara dinamis dari API, bukan opsi hardcoded.
10. **C10 — Migration & Backup:** Mekanisme migrasi skema terversi dan strategi backup/recovery yang jelas.

---

## 3. Matriks Evaluasi Kesiapan 16 Komponen Bisnis

| Komponen Bisnis | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | Nilai Akhir | Rangkuman Temuan |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **1. Pengguna & Akun** | P | P | P | P | P | P | P | P | P | P | **PASS** | Skema `app_users` sangat siap, verifikasi identitas ketat, audit trail JSON, anti daur ulang ID. |
| **2. Role & Permissions** | P | P | P | P | L | L | P | L | P | P | **PARTIAL** | Role tersimpan di user, namun daftar role adalah enum statis. Belum ada RBAC granular terpisah. |
| **3. Cabang (Branches)** | F | F | F | L | F | F | F | F | L | F | **FAIL** | Hanya enum statis 7 cabang. Tidak ada tabel master `branches`, tidak ada API, tidak ada kode cabang. |
| **4. Divisi & Struktur Org** | P | P | P | P | P | P | L | L | P | P | **PASS** | Tabel `org_units` relasional, nama unik, API lengkap. Belum ada hirarki subordinasi divisi. |
| **5. Jabatan (Positions)** | F | F | F | F | F | F | F | F | F | F | **FAIL** | Tidak ada tabel `positions`. Nama jabatan hanya teks bebas pada akun seed awal. |
| **6. Supervisor & Assignments** | P | P | P | P | P | P | P | P | P | P | **PASS** | Tabel `org_assignments` relasional, partial unique index, audit trail lengkap, API admin siap. |
| **7. Approval Authority & Config**| P | P | P | P | P | P | P | P | P | P | **PASS** | `approval_stage_assignments` dan snapshot immutable submission beroperasi sesuai standar ADR. |
| **8. Jenis Dokumen** | F | F | F | P | F | F | F | F | L | F | **FAIL** | Enum statis TypeScript `DocType`. Tidak ada tabel master, tidak ada izin per tipe dokumen. |
| **9. Status Dokumen** | L | F | F | P | L | F | F | F | L | F | **FAIL** | Enum statis di kode & CHECK constraint SQLite. Tidak dikonfigurasi melalui database. |
| **10. Jenis Anggaran (Budget)** | F | F | F | L | F | F | F | F | F | F | **FAIL** | Hardcoded di JSX (`OPEX`, `CAPEX`, `PROJECT`). Tidak ada tabel pagu anggaran, tidak ada relasi ke CoA. |
| **11. Vendor / Pemasok** | F | F | F | L | F | L | F | F | F | F | **FAIL** | Tidak ada tabel `vendors`. Tersimpan denormalized di form PO, rawan duplikasi dan kesalahan ketik. |
| **12. Rekening Bank Vendor/BLC** | F | F | F | P | F | F | F | F | F | F | **FAIL** | Rekening vendor disalin manual. Rekening internal BLC diisi free-text pada pelunasan PV. |
| **13. Metode Pembayaran** | L | F | F | P | F | F | F | F | L | F | **FAIL** | Enum statis `BANK_TRANSFER` / `CASH`. |
| **14. Kategori Lampiran** | P | L | P | P | L | P | P | L | L | L | **PARTIAL** | Metadata dan SHA-256 tersimpan baik. Kategori berupa enum statis, berkas di sistem file lokal. |
| **15. Konfigurasi Workflow** | P | P | P | P | P | P | P | P | P | P | **PASS** | Engine `approval_workflows` dan tahapan independen terbukti tangguh dengan 315 pengujian lulus. |
| **16. Transaksi Procurement** | P | P | P | P | L | P | P | L | P | L | **PARTIAL** | Tersimpan di JSON blob `workspace`. Memiliki versioning & numbering, namun belum ternormalisasi relasional. |

*Keterangan simbol:* **`P`** = *Pass (Memenuhi Kriteria)*, **`L`** = *Partial (Memenuhi Sebagian / Terbatas)*, **`F`** = *Fail (Belum Tersedia / Gagal)*.

---

## 4. Analisis Mendalam Kesiapan Komponen Kritis

### 4.1. Kesiapan Pengguna dan Otorisasi (Pass — Kesiapan Tinggi)
- **Kelebihan:**
  - Penerapan arsitektur ADR-ID-001 hingga ADR-ID-003 berhasil mengisolasi identitas pengguna dengan canonical ID `usr-*`.
  - Status verifikasi identitas (`VERIFIED`, `UNVERIFIED`) secara tegas memblokir akun yang belum sah untuk menjadi approver transaksi keuangan.
  - Audit log `app_user_audit` mencatat snapshot JSON sebelum dan sesudah mutasi.
- **Keterbatasan:**
  - Peran aplikasi (`role`) masih tersimpan sebagai string tunggal pada tabel pengguna. Sistem belum memiliki tabel relasional role terpisah atau dukungan multi-role dinamis per pengguna.

### 4.2. Kesiapan Struktur Organisasi (Pass — Kesiapan Menengah)
- **Kelebihan:**
  - Unit organisasi dan penugasan supervisor telah menggunakan foreign key dan partial unique index (`org_assignment_active_unique`).
  - Mendukung relasi *many-to-many* antara divisi dan supervisor.
- **Keterbatasan:**
  - Belum ada struktur hirarki (sub-divisi atau hubungan vertikal departemen-direktorat).
  - Belum ada integrasi ke kode cabang (`branch_id`).

### 4.3. Kesiapan Vendor & Perbankan (Fail — Risiko Operasional Kritis)
- **Temuan Kritis:**
  - **Ketiadaan Master Vendor:** Data rekanan diisi manual oleh pemohon pada formulir Purchase Order (`po.vendorName`).
  - **Risiko Duplikasi & Fraud Rekening:** Sistem tidak dapat mendeteksi apakah vendor "PT Sumber Makmur" sama dengan "PT. Sumber Makmur" atau "CV Sumber Makmur". Rekening bank vendor disalin ulang setiap kali PO dibuat, membuka celah salah transfer atau pengubahan nomor rekening oleh pihak tidak bertanggung jawab.
  - **Ketiadaan Rekening Internal BLC:** Rekening sumber pencairan dana kas perusahaan diisi secara manual melalui free-text input pada dialog pelunasan PV oleh Staf Keuangan ([`FormPVPayment.tsx`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/forms/FormPVPayment.tsx#L117-L120)). Tidak ada validasi saldo atau pencocokan buku kas.

### 4.4. Kesiapan Cabang & Alokasi Anggaran (Fail — Risiko Pelaporan)
- **Temuan Kritis:**
  - **Cabang Tanpa Master Data:** Daftar 7 cabang resmi di-hardcode pada frontend TypeScript. Tidak ada kode akuntansi cabang (misal: `01-BKS`, `02-SBY`).
  - **Tipe Anggaran Tanpa Kuota:** Pilihan `OPEX`, `CAPEX`, dan `PROJECT` pada formulir PR/PO/AV/RB hanya berfungsi sebagai label teks. Sistem tidak memeriksa apakah anggaran departemen terkait pada bulan/tahun berjalan masih mencukupi atau sudah melebihi pagu (*budget overrun*).

### 4.5. Kesiapan Dokumen Transaksi (Partial — Batasan Skalabilitas)
- **Kelebihan:**
  - Penomoran otomatis berbasis sequence berjalan dengan baik.
  - Validasi hubungan antar-dokumen (PR $\rightarrow$ PO, PO $\rightarrow$ GR, PO/AV/RB $\rightarrow$ PV, AV $\rightarrow$ RC) ditegakkan secara ketat pada level logika server.
  - Snapshot stage persetujuan independen menjamin kepatuhan aturan BR-APP-001.
- **Keterbatasan:**
  - Dokumen disimpan sebagai JSON blob terpadu di tabel `workspace`. Setiap kali terjadi pembaruan dokumen, seluruh array dokumen diserialisasi dan ditulis ulang ke disk SQLite (`flush()`). Pendekatan ini aman untuk ratusan dokumen, namun akan mengalami degradasi kinerja pada volume puluhan ribu transaksi produksi.

---

## 5. Ringkasan Rekomendasi Kesiapan

1. **Jadikan Pembuatan Master Vendor & Rekening Bank sebagai Prioritas P0:**
   Sebelum sistem dibuka untuk staf operasional di 7 cabang, tabel relasional `vendors` dan `vendor_bank_accounts` wajib dibangun agar data rekanan tervalidasi terpusat oleh Departemen Procurement & Keuangan.
2. **Standardisasi Master Cabang (`branches` table) sebagai P1:**
   Pindahkan daftar 7 cabang dari kode statis ke tabel database terkelola lengkap dengan kode cabang resmi dan status aktif.
3. **Bangun Master Rekening Kas Perusahaan (`company_bank_accounts`) sebagai P1:**
   Sediakan pilihan dropdown rekening bank internal resmi BLC pada pencairan Payment Voucher untuk mencegah kesalahan manual staf kasir/treasury.
4. **Pertahankan Skema Identitas dan Stage Engine Saat Ini:**
   Modul identitas pengguna (`app_users`) dan mesin workflow (`approval_workflows`, `approval_stages`) telah terbukti sangat tangguh dan memenuhi standar enterprise, sehingga dapat langsung dipertahankan.

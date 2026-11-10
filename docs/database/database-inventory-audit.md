# DATABASE INVENTORY AUDIT — PHASE 00
**Project:** BLC Caready Procurement Pro  
**Audit Scope:** Database Inventory & Physical Storage Mapping (AUDIT-001)  
**Status:** AUTHORIZED — AUDIT ONLY  
**Review Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Executive Summary & Audit Methodology

Dokumen ini menyajikan inventarisasi menyeluruh terhadap seluruh struktur penyimpanan data yang diimplementasikan pada basis kode **BLC Caready Procurement Pro**. Audit dilakukan secara objektif dengan memeriksa kode sumber aktual (*source of truth*), skema SQLite, repositori dokumen, penyimpanan berkas lokal, konstanta TypeScript, dan definisi komponen antarmuka (frontend).

> [!IMPORTANT]
> Sesuai mandat **Phase 00: AUDIT ONLY**, tidak ada mutasi atau perubahan skema yang dilakukan pada database operasional (`blc-local.sqlite`). Seluruh temuan didasarkan pada verifikasi langsung kode sumber dan inspeksi skema.

### Cakupan Inspeksi Kode
- **Modul Organisasi & Identitas:** [`server/organization.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/organization.ts), [`server/organization.test.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/organization.test.ts)
- **Modul Stage Engine & Persetujuan:** [`server/stage-engine.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/stage-engine.ts), [`server/stage-engine.test.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/stage-engine.test.ts)
- **Modul Repositori Dokumen:** [`server/repository.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts), [`server/repository.test.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.test.ts)
- **Modul Autentikasi & Sesi:** [`server/auth.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/auth.ts)
- **Modul Routing & API:** [`server/app.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/app.ts)
- **Modul Penyimpanan Lampiran:** [`server/storage.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/storage.ts)
- **Definisi Tipe & Domain:** [`src/types/document.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/types/document.ts), [`src/types/auth.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/types/auth.ts), [`src/domain/branches.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/domain/branches.ts)
- **Komponen Formulir Frontend:** [`src/components/forms/`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/forms/) (`FormPR`, `FormPO`, `FormAV`, `FormRB`, `FormRC`, `FormGR`, `FormPV`, `FormPVPayment`)

---

## 2. Struktur Mekanisme Penyimpanan (Storage Typology)

Sistem BLC Caready Procurement Pro saat ini menggunakan arsitektur penyimpanan hibrida yang terbagi menjadi enam (6) modalitas:

| # | Mekanisme Penyimpanan | Lokasi / Target Fisik | Deskripsi & Komponen yang Dikelola |
|---|---|---|---|
| 1 | **SQLite Relational Tables** | `blc-local.sqlite` (atau SQLite in-memory pada test) | 16 tabel relasional yang mengelola identitas pengguna, unit organisasi, penugasan supervisor, alur stage workflow, keputusan approval, audit log, idempotency, dan sinkronisasi cross-storage. |
| 2 | **JSON Document Repository** | Tabel `workspace` di SQLite (`payload` column) | Menyimpan seluruh dokumen transaksi procurement (`documents[]`), metadata lampiran (`attachments[]`), antrean asynchronous outbox (`outboxJobs[]`), sequence penomoran dokumen (`sequences{}`), dan cache idempotensi lama. |
| 3 | **Local File Storage** | Direktori `.data/uploads/` pada sistem berkas lokal | Berkas biner lampiran yang diunggah pengguna (PDF, PNG, JPEG), diberi nama unik berbasis UUID dan nama sanitasi (`${id}-${safeName}`), divalidasi dengan checksum SHA-256. |
| 4 | **Static TypeScript Constants** | File `.ts` pada `src/` dan `server/` | Daftar cabang resmi (`OFFICIAL_BRANCHES`), MIME types lampiran yang diizinkan (`ALLOWED_MIME_TYPES`), batas ukuran berkas (`MAX_ATTACHMENT_BYTES`), dan seeded user credentials (`SEEDED_USERS`). |
| 5 | **Hardcoded Values di UI/Logic** | Komponen JSX pada `src/components/` | Pilihan jenis anggaran (`OPEX`, `CAPEX`, `PROJECT`) yang ditulis statis pada tag `<option>` HTML, serta default rekening sumber dana internal (`'BCA Operasional Pusat'`). |
| 6 | **Runtime-Generated Data** | Memory proses Node.js & ephemeral records | Sequence penomoran dokumen berurutan, token JWT HMAC-SHA256 berdurasi 8 jam, payload hash idempotensi, dan payload snapshot diff audit. |

---

## 3. Inventaris Lengkap Tabel SQLite (17 Tabel)

Berdasarkan analisis DDL pada [`server/organization.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/organization.ts), [`server/stage-engine.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/stage-engine.ts), dan [`server/repository.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts), terdapat **17 tabel fisik** sebagai berikut:

### Ringkasan Inventaris Tabel

| No | Nama Tabel | Modul Sumber | Status | Fungsi Bisnis Utama |
|:---:|---|---|:---:|---|
| 1 | `app_users` | `organization.ts` | **Implemented** | Master akun pengguna, status identitas, dan verifikasi admin |
| 2 | `app_user_audit` | `organization.ts` | **Implemented** | Audit trail perubahan profil, verifikasi, dan siklus akun |
| 3 | `app_retired_user_ids` | `organization.ts` | **Implemented** | Daftar ID akun yang dipensiunkan (mencegah daur ulang ID) |
| 4 | `org_units` | `organization.ts` | **Implemented** | Master unit organisasi / divisi |
| 5 | `org_assignments` | `organization.ts` | **Implemented** | Penugasan supervisor aktif/nonaktif per unit organisasi |
| 6 | `org_assignment_audit` | `organization.ts` | **Implemented** | Audit trail perubahan penugasan supervisor |
| 7 | `org_schema_version` | `organization.ts` | **Implemented** | Pelacak versi skema migrasi organisasi (CHECK version=2) |
| 8 | `approval_workflows` | `stage-engine.ts` | **Implemented** | Instansiasi workflow per dokumen transaksi procurement |
| 9 | `approval_assignment_snapshots`| `stage-engine.ts` | **Implemented** | Snapshot immutable approver yang dikunci saat submission |
| 10 | `approval_stages` | `stage-engine.ts` | **Implemented** | Tahapan persetujuan independen (Stage 1, 2, 3A, 3B) |
| 11 | `approval_decisions` | `stage-engine.ts` | **Implemented** | Riwayat keputusan approver (APPROVE/REJECT) per stage |
| 12 | `approval_stage_reassignments` | `stage-engine.ts` | **Implemented** | Log pengalihan approver in-flight oleh Administrator |
| 13 | `approval_idempotency_records`| `stage-engine.ts` | **Implemented** | Kunci idempotensi bertingkat untuk mencegah eksekusi ganda |
| 14 | `cross_storage_sync_records` | `stage-engine.ts` | **Implemented** | Pencatatan status sinkronisasi SQLite dan Repositori Dokumen |
| 15 | `approval_stage_assignments` | `stage-engine.ts` | **Implemented** | Konfigurasi penugasan default Stage 2 (Ayu) dan Stage 3 (BoD) |
| 16 | `approval_stage_assignment_audit`| `stage-engine.ts`| **Implemented** | Audit trail perubahan penugasan Stage 2 dan Stage 3 |
| 17 | `workspace` | `repository.ts` | **Implemented** | Penampung dokumen transaksi dan lampiran berbasis JSON blob |

---

## 4. Rincian Teknis & Skema Per Tabel

### 4.1. Tabel `app_users`
- **Tujuan Bisnis:** Menyimpan data identitas resmi pengguna, role aplikasi, penugasan cabang, status siklus hidup, dan status verifikasi identitas (ADR-ID-001 s/d ADR-ID-003).
- **Kolom & Tipe Data:**
  - `id` (TEXT, PK): Canonical user ID berformat `usr-*`.
  - `legacyId` (TEXT, UNIQUE): ID lama untuk kompatibilitas data masa lampau.
  - `email` (TEXT, NOT NULL, UNIQUE): Alamat email korporat resmi pengguna.
  - `full_name` (TEXT, NOT NULL): Nama lengkap pengguna sesuai identitas kepegawaian.
  - `role` (TEXT, NOT NULL): Peran aplikasi (`PEMOHON`, `ADMIN`, `ATASAN`, `AYU`, `BOD_HERY`, `BOD_HASHIMOTO`, `KEUANGAN`).
  - `branch` (TEXT, NOT NULL): Cabang utama domisili kerja pengguna.
  - `branch_scope` (TEXT, NOT NULL): Cakupan cabang pengguna (`*` untuk lintas-cabang atau nama cabang tertentu).
  - `status` (TEXT, NOT NULL): Status akun dengan `CHECK(status IN ('UNVERIFIED','ACTIVE','INACTIVE'))`.
  - `verification_status` (TEXT, NOT NULL): Status verifikasi admin dengan `CHECK(verification_status IN ('UNVERIFIED','VERIFIED','REJECTED'))`.
  - `verified_at` (TEXT): Timestamp verifikasi identitas.
  - `verified_by` (TEXT): Canonical ID Admin yang melakukan verifikasi.
  - `verification_proof` (TEXT): Catatan/bukti dokumen verifikasi fisik.
  - `created_at` (TEXT, NOT NULL), `created_by` (TEXT, NOT NULL).
  - `updated_at` (TEXT, NOT NULL), `updated_by` (TEXT, NOT NULL).
- **Constraints & Indexes:**
  - Primary Key: `id`.
  - Unique Constraints: `legacy_id`, `email`.
  - Check Constraints: `status`, `verification_status`.
- **Sumber Data:** Bootstrap seed otomatis (`SEEDED_USERS`), input manual via Admin API (`POST /api/v1/organization/users`).
- **Endpoint API Terkait:**
  - `GET /api/v1/organization/users`
  - `POST /api/v1/organization/users`
  - `PATCH /api/v1/organization/users/:id`
  - `POST /api/v1/organization/users/:id/verify`
  - `POST /api/v1/organization/users/:id/lifecycle`
  - `POST /api/v1/organization/users/:id/retire`

---

### 4.2. Tabel `app_user_audit`
- **Tujuan Bisnis:** Menyimpan jejak audit (*immutable audit trail*) setiap kali profil pengguna dibuat, diperbarui, diverifikasi, dinonaktifkan, atau dipensiunkan.
- **Kolom & Tipe Data:**
  - `id` (TEXT, PK): UUID log audit.
  - `user_id` (TEXT, NOT NULL, REFERENCES `app_users(id)`).
  - `actor_user_id` (TEXT, NOT NULL): ID pengguna/sistem yang melakukan perubahan.
  - `action` (TEXT, NOT NULL): Jenis mutasi (`CREATE`, `UPDATE`, `VERIFY`, `DEACTIVATE`, `LIFECYCLE`, `RETIRE`, `BOOTSTRAP_SEED`).
  - `at` (TEXT, NOT NULL): Timestamp mutasi (ISO 8601).
  - `before_json` (TEXT): Snapshot JSON keadaan sebelum mutasi.
  - `after_json` (TEXT, NOT NULL): Snapshot JSON keadaan setelah mutasi.
- **Constraints & Foreign Keys:**
  - PK: `id`.
  - FK: `user_id` merujuk `app_users(id)`.
- **Sumber Data:** Terisi otomatis saat mutasi pengguna dieksekusi.

---

### 4.3. Tabel `app_retired_user_ids`
- **Tujuan Bisnis:** Memastikan ID pengguna yang telah dipensiunkan tidak dapat didaftarkan kembali (*tombstone table* / anti ID recycling).
- **Kolom & Tipe Data:**
  - `id` (TEXT, PK): Canonical ID yang dipensiunkan.
  - `retired_at` (TEXT, NOT NULL): Waktu pensiun akun.
  - `reason` (TEXT, NOT NULL): Alasan bisnis pemensiunan akun.
- **Constraints:** PK `id`.

---

### 4.4. Tabel `org_units`
- **Tujuan Bisnis:** Menyimpan data unit organisasi, departemen, atau divisi kerja di BLC.
- **Kolom & Tipe Data:**
  - `id` (TEXT, PK): UUID unit organisasi.
  - `name` (TEXT, NOT NULL, UNIQUE): Nama divisi/departemen (misal: "Finance & Accounting", "Operation").
  - `created_at` (TEXT, NOT NULL), `created_by` (TEXT, NOT NULL).
- **Constraints:** PK `id`, UNIQUE `name`.
- **Endpoint API:** `GET /api/v1/organization/units`, `POST /api/v1/organization/units`.

---

### 4.5. Tabel `org_assignments`
- **Tujuan Bisnis:** Menghubungkan unit organisasi dengan supervisor (Atasan Langsung) yang berwenang menyetujui pengajuan Tahap 1. Mendukung relasi *many-to-many* (satu supervisor membawahi beberapa divisi, atau divisi memiliki beberapa supervisor bergiliran).
- **Kolom & Tipe Data:**
  - `id` (TEXT, PK): UUID record penugasan.
  - `unit_id` (TEXT, NOT NULL, REFERENCES `org_units(id)`).
  - `supervisor_user_id` (TEXT, NOT NULL): Canonical ID pengguna yang ditugaskan sebagai supervisor.
  - `active` (INTEGER, NOT NULL, CHECK(`active IN (0,1)`)): Menandakan apakah penugasan ini sedang aktif.
  - `created_at`, `created_by`, `updated_at`, `updated_by` (TEXT, NOT NULL).
- **Constraints & Indexes:**
  - PK: `id`.
  - FK: `unit_id` merujuk `org_units(id)`.
  - Partial Unique Index: `CREATE UNIQUE INDEX org_assignment_active_unique ON org_assignments(unit_id, supervisor_user_id) WHERE active=1;`. Mencegah duplikasi penugasan aktif untuk pasangan unit dan supervisor yang sama.
- **Endpoint API:** `GET /api/v1/organization/assignments`, `POST /api/v1/organization/assignments`, `PATCH /api/v1/organization/assignments/:id`.

---

### 4.6. Tabel `org_assignment_audit`
- **Tujuan Bisnis:** Menyimpan riwayat perubahan penugasan atasan (aktif, nonaktif, reassign).
- **Kolom & Tipe Data:**
  - `id` (TEXT, PK): UUID log audit.
  - `assignment_id` (TEXT, NOT NULL, REFERENCES `org_assignments(id)`).
  - `actor_user_id` (TEXT, NOT NULL): Admin yang mengubah.
  - `action` (TEXT, NOT NULL): `CREATE`, `UPDATE`, `DEACTIVATE`.
  - `at` (TEXT, NOT NULL): Timestamp ISO 8601.
  - `before_json` (TEXT), `after_json` (TEXT, NOT NULL).
- **Constraints:** PK `id`, FK `assignment_id` merujuk `org_assignments(id)`.

---

### 4.7. Tabel `org_schema_version`
- **Tujuan Bisnis:** Menyimpan nomor versi skema database organisasi untuk mendeteksi kesiapan dan kompatibilitas migrasi.
- **Kolom & Tipe Data:**
  - `version` (INTEGER, NOT NULL, CHECK(`version=2`)).

---

### 4.8. Tabel `approval_workflows`
- **Tujuan Bisnis:** Instansiasi alur persetujuan per dokumen transaksi yang diajukan.
- **Kolom & Tipe Data:**
  - `id` (TEXT, PK): UUID alur kerja workflow.
  - `document_id` (TEXT, NOT NULL): ID dokumen procurement (PR/PO/AV/RB/RC/GR/PV).
  - `doc_type` (TEXT, NOT NULL): Tipe dokumen.
  - `doc_number` (TEXT, NOT NULL): Nomor resmi dokumen.
  - `unit_id` (TEXT): ID unit organisasi pemohon.
  - `workflow_version` (INTEGER, NOT NULL, DEFAULT 1).
  - `status` (TEXT, NOT NULL, CHECK(`status IN ('ACTIVE','COMPLETED','REJECTED','CANCELLED')`)).
  - `submitted_at` (TEXT, NOT NULL), `submitted_by` (TEXT, NOT NULL).
  - `completed_at` (TEXT): Timestamp saat seluruh tahapan selesai atau ditolak.
- **Indexes:** `CREATE INDEX idx_workflow_doc ON approval_workflows(document_id);`.

---

### 4.9. Tabel `approval_assignment_snapshots`
- **Tujuan Bisnis:** Mengunci snapshot approver yang sah pada saat dokumen pertama kali disubmit. Menjamin bahwa mutasi organisasi di kemudian hari tidak merusak struktur approver pada dokumen yang sedang berjalan.
- **Kolom & Tipe Data:**
  - `id` (TEXT, PK): UUID record snapshot.
  - `workflow_id` (TEXT, NOT NULL, REFERENCES `approval_workflows(id)`).
  - `document_id` (TEXT, NOT NULL).
  - `unit_id` (TEXT), `unit_name` (TEXT).
  - `assignment_id` (TEXT): ID penugasan organisasi sumber.
  - `stage_key` (TEXT, NOT NULL): Kunci tahapan (`STAGE_1_ATASAN`, `STAGE_2_FINANCE`, `STAGE_3_BOD_HERY`, `STAGE_3_BOD_HASHIMOTO`).
  - `approver_user_id` (TEXT, NOT NULL): Canonical ID approver yang ditugaskan saat itu.
  - `approver_name` (TEXT, NOT NULL): Nama approver saat snapshot dibuat.
  - `role_context` (TEXT, NOT NULL): Konteks peran yang sah.
- **Constraints:** PK `id`, FK `workflow_id` merujuk `approval_workflows(id)`.

---

### 4.10. Tabel `approval_stages`
- **Tujuan Bisnis:** Memodelkan tahapan persetujuan independen dan sekuensial/paralel untuk setiap workflow.
- **Kolom & Tipe Data:**
  - `id` (TEXT, PK): UUID stage instance.
  - `workflow_id` (TEXT, NOT NULL, REFERENCES `approval_workflows(id)`).
  - `stage_key` (TEXT, NOT NULL): Kunci tahapan unik.
  - `stage_order` (INTEGER, NOT NULL): Urutan tahapan (1, 2, 3).
  - `parallel_group` (TEXT): Nama grup paralel (misal: `BOD_PARALLEL` untuk Hery & Hashimoto).
  - `assigned_approver_id` (TEXT, NOT NULL): Canonical ID pengguna yang saat ini wajib bertindak.
  - `approver_name` (TEXT, NOT NULL), `approver_role` (TEXT, NOT NULL).
  - `snapshot_id` (TEXT, NOT NULL, REFERENCES `approval_assignment_snapshots(id)`).
  - `status` (TEXT, NOT NULL, CHECK(`status IN ('WAITING','PENDING','APPROVED','REJECTED','SKIPPED')`)).
- **Indexes:** `CREATE INDEX idx_stages_workflow ON approval_stages(workflow_id);`.

---

### 4.11. Tabel `approval_decisions`
- **Tujuan Bisnis:** Menyimpan keputusan individual (APPROVE atau REJECT) yang diambil oleh approver pada suatu tahapan tertentu. Menjamin aturan **BR-APP-001** (multi-role approval dengan jejak keputusan terpisah).
- **Kolom & Tipe Data:**
  - `id` (TEXT, PK): UUID keputusan.
  - `workflow_id` (TEXT, NOT NULL, REFERENCES `approval_workflows(id)`).
  - `stage_id` (TEXT, NOT NULL, REFERENCES `approval_stages(id)`).
  - `approver_user_id` (TEXT, NOT NULL): Canonical ID approver yang memutuskan.
  - `decision` (TEXT, NOT NULL, CHECK(`decision IN ('APPROVE','REJECT')`)).
  - `comment` (TEXT): Alasan persetujuan atau catatan penolakan (wajib diisi pada penolakan).
  - `decided_at` (TEXT, NOT NULL): Timestamp keputusan ISO 8601.
- **Constraints & Indexes:**
  - PK: `id`.
  - FK: `workflow_id`, `stage_id`.
  - Unique Index: `CREATE UNIQUE INDEX idx_decisions_stage_unique ON approval_decisions(stage_id);` (Satu stage hanya boleh memiliki tepat satu keputusan akhir).
  - Index: `CREATE INDEX idx_decisions_stage ON approval_decisions(stage_id);`.

---

### 4.12. Tabel `approval_stage_reassignments`
- **Tujuan Bisnis:** Mencatat setiap tindakan delegasi / pengalihan approver pada tahap yang sedang berjalan (in-flight reassignment) oleh Administrator, lengkap dengan alasan bisnis dan jejak audit.
- **Kolom & Tipe Data:**
  - `id` (TEXT, PK): UUID log reassignment.
  - `workflow_id` (TEXT, NOT NULL, REFERENCES `approval_workflows(id)`).
  - `stage_id` (TEXT, NOT NULL, REFERENCES `approval_stages(id)`).
  - `previous_approver_id` (TEXT, NOT NULL), `previous_approver_name` (TEXT, NOT NULL).
  - `new_approver_id` (TEXT, NOT NULL), `new_approver_name` (TEXT, NOT NULL).
  - `reason` (TEXT, NOT NULL): Alasan pengalihan (wajib diisi).
  - `reassigned_by` (TEXT, NOT NULL): ID Admin yang melakukan pengalihan.
  - `reassigned_at` (TEXT, NOT NULL): Waktu pengalihan.
- **Indexes:**
  - `CREATE INDEX idx_reassignments_stage ON approval_stage_reassignments(stage_id);`
  - `CREATE INDEX idx_reassignments_wf ON approval_stage_reassignments(workflow_id);`

---

### 4.13. Tabel `approval_idempotency_records`
- **Tujuan Bisnis:** Mencegah eksekusi ganda pada operasi kritis submission dan approval (network retry, multiple clicks, race conditions).
- **Kolom & Tipe Data:**
  - `key` (TEXT, NOT NULL): Idempotency key yang dikirim client atau dihasilkan engine.
  - `user_id` (TEXT, NOT NULL): Canonical ID pengguna.
  - `operation_type` (TEXT, NOT NULL): Jenis operasi (`SUBMIT`, `APPROVE`, `REJECT`, `REASSIGN`).
  - `document_id` (TEXT, NOT NULL): ID dokumen.
  - `stage_id` (TEXT, NOT NULL): ID tahapan.
  - `payload_hash` (TEXT, NOT NULL): Hash SHA-256 payload permintaan.
  - `status` (TEXT, NOT NULL, CHECK(`status IN ('IN_PROGRESS','COMPLETED','FAILED')`)).
  - `response_json` (TEXT): Respons tersimpan untuk pemanggilan berulang.
  - `created_at` (TEXT, NOT NULL), `updated_at` (TEXT, NOT NULL).
- **Constraints & Indexes:**
  - Composite Primary Key: `PRIMARY KEY (key, user_id, operation_type, document_id, stage_id)`.
  - Index: `CREATE INDEX idx_idempotency_lookup ON approval_idempotency_records(key, user_id, operation_type, document_id, stage_id);`.

---

### 4.14. Tabel `cross_storage_sync_records`
- **Tujuan Bisnis:** Mengelola status konsistensi dua fase (*two-phase commit / compensation pattern*) antara tabel SQLite `approval_stages` dan JSON document repository.
- **Kolom & Tipe Data:**
  - `id` (TEXT, PK): UUID sinkronisasi.
  - `document_id` (TEXT, NOT NULL), `workflow_id` (TEXT), `stage_id` (TEXT).
  - `operation_type` (TEXT, NOT NULL, CHECK(`operation_type IN ('SUBMIT','APPROVE','REJECT','REASSIGN')`)).
  - `status` (TEXT, NOT NULL, CHECK(`status IN ('PREPARED','COMMITTED','RECONCILED','COMPENSATED','FAILED')`)).
  - `stage_state_json` (TEXT, NOT NULL): Keadaan snapshot stage SQLite.
  - `document_state_json` (TEXT): Keadaan snapshot dokumen repositori.
  - `error_message` (TEXT): Pesan kesalahan jika sinkronisasi terhambat.
  - `created_at` (TEXT, NOT NULL), `updated_at` (TEXT, NOT NULL).
- **Indexes:**
  - `CREATE INDEX idx_sync_doc ON cross_storage_sync_records(document_id);`
  - `CREATE INDEX idx_sync_status ON cross_storage_sync_records(status);`

---

### 4.15. Tabel `approval_stage_assignments`
- **Tujuan Bisnis:** Menyimpan konfigurasi pengguna default yang ditugaskan untuk tahapan persetujuan global (Stage 2: Verifikator Keuangan, Stage 3A: BoD Hery, Stage 3B: BoD Hashimoto).
- **Kolom & Tipe Data:**
  - `id` (TEXT, PK): UUID konfigurasi.
  - `stage_key` (TEXT, NOT NULL, UNIQUE, CHECK(`stage_key IN ('STAGE_2_FINANCE','STAGE_3_BOD_HERY','STAGE_3_BOD_HASHIMOTO')`)).
  - `assigned_user_id` (TEXT, NOT NULL): Canonical ID pengguna.
  - `active` (INTEGER, NOT NULL, CHECK(`active IN (0,1)`), DEFAULT 1).
  - `created_at`, `created_by`, `updated_at`, `updated_by` (TEXT, NOT NULL).
- **Indexes:** `CREATE INDEX idx_stage_assignments_key ON approval_stage_assignments(stage_key);`.
- **Endpoint API:** `GET /api/v1/organization/stage-assignments`, `POST /api/v1/organization/stage-assignments`, `DELETE /api/v1/organization/stage-assignments/:stageKey`.

---

### 4.16. Tabel `approval_stage_assignment_audit`
- **Tujuan Bisnis:** Jejak audit perubahan penugasan stage global.
- **Kolom & Tipe Data:**
  - `id` (TEXT, PK): UUID audit.
  - `stage_key` (TEXT, NOT NULL), `assigned_user_id` (TEXT, NOT NULL), `active` (INTEGER, NOT NULL).
  - `actor_user_id` (TEXT, NOT NULL), `action` (TEXT, NOT NULL), `at` (TEXT, NOT NULL).
  - `before_json` (TEXT), `after_json` (TEXT, NOT NULL).

---

### 4.17. Tabel `workspace`
- **Tujuan Bisnis:** Repositori penyimpanan dokumen transaksi utama procurement.
- **Kolom & Tipe Data:**
  - `id` (INTEGER, PRIMARY KEY, CHECK(`id = 1`)): Singleton row identifier.
  - `payload` (TEXT, NOT NULL): String JSON yang berisi seluruh state dokumen procurement.
- **Struktur Isi JSON (`payload`):**
  - `documents: VersionedDocument[]`: Seluruh dokumen PR, PO, AV, RB, RC, GR, PV berserta line items dan riwayat persetujuannya.
  - `attachments: StoredAttachment[]`: Metadata lampiran dokumen.
  - `outboxJobs: OutboxJob[]`: Antrean background job asynchronous (email/webhooks).
  - `sequences: Record<string, number>`: Penghitung nomor urut dokumen (PR-2026-..., PO-2026-...).
  - `idempotencyCache: Record<string, CachedIdempotency>`: Cache respon lama.
- **Endpoint API Terkait:** Seluruh endpoint dokumen (`/api/v1/documents/*`, `/api/v1/payments/*`).

---

## 5. Ringkasan Kesenjangan Fisik Database

Berdasarkan inventarisasi di atas, terlihat perbedaan arsitektur yang sangat jelas:
1. **Identitas, Organisasi, dan Workflow Engine** sudah berada dalam tabel relasional SQLite yang terstruktur rapi, lengkap dengan audit trail, foreign keys, unique indexes, dan status tracking.
2. **Entitas Pengadaan Inti (Master Data Bisnis)** seperti **Vendor**, **Cabang (Branches)**, **Jabatan (Positions)**, **Jenis Anggaran (Budget Types)**, **Rekening Bank Perusahaan/Vendor**, dan **Kategori Dokumen** **BELUM MEMILIKI TABEL RELASIONAL FISIK** di dalam database.
3. Seluruh entitas pengadaan tersebut saat ini tersimpan secara **denormalized** di dalam JSON `workspace.payload` atau didefinisikan sebagai **static constants / hardcoded strings** di lapisan TypeScript dan React JSX.

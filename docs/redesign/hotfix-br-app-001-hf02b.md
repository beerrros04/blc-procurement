# BR-APP-001 — HF02-B Completion Report (Security Gate Verified)

**Status:** IN REVIEW — SECURITY GATE VERIFIED (AWAITING GATE DECISION)  
**Project:** BLC Caready Procurement Pro  
**Work Type:** Backend Architecture & Business Logic  
**Priority:** Critical  
**Scope:** HF02-B ONLY (Internal Approval Snapshot & Independent Stage Engine)  
**Next Stage:** HF02-C — LOCKED  
**PM / Review Authority:** Project Manager & Product Owner

---

## 1. Executive Summary

HF02-B Final Revision 02 telah menuntaskan penegakan penugasan workflow eksplisit (*Explicit Workflow Assignment Enforcement*) dan menghapus total ketergantungan pada fallback global user role:
1. **Penugasan Eksplisit & Persisten (Stage 2 & Stage 3)**:
   - Stage 1 tetap menggunakan `org_assignments` per unit pemohon.
   - Stage 2 (Finance Reviewer) menggunakan penugasan eksplisit persisten pada tabel SQLite [`approval_stage_assignments`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/stage-engine.ts).
   - Stage 3 (BOD Parallel) menggunakan dua penugasan independen persisten pada [`approval_stage_assignments`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/stage-engine.ts) (`STAGE_3_BOD_HERY` dan `STAGE_3_BOD_HASHIMOTO`).
2. **Pemberantasan Role-Based Fallback**:
   - Seluruh query fallback otomatis berbasis `role === 'AYU'`, `role === 'BOD_HERY'`, `role === 'BOD_HASHIMOTO'` telah **dihapus total**.
   - Pengguna dengan role `AYU` atau BOD tanpa penugasan eksplisit **tidak otomatis menjadi approver**.
   - Jika penugasan tidak ada atau non-aktif, alur pengajuan dokumen **gagal secara eksplisit (*fail-closed*)**.
3. **Pengamanan `StageResolutionOptions`**:
   - Opsi override stage approver hanya diizinkan jika menyertakan `authorizedBy` yang merujuk pada Administrator aktif dan terverifikasi.
   - Permintaan override tanpa otorisasi atau dari non-admin ditolak seketika dengan HTTP 403 `UNAUTHORIZED_STAGE_OVERRIDE`.
4. **Mekanisme Manajemen Admin Terotorisasi**:
   - Disediakan endpoint REST Admin [`/api/v1/organization/stage-assignments`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/app.ts#L145-L165) dan method API [`ApprovalStageEngine.setStageAssignment`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/stage-engine.ts#L295-L365) untuk mengelola penugasan panggung approval secara sah.

Seluruh pengujian lulus: **209 tests across 28 test files** (100% green, termasuk 32 tests di [`server/stage-engine.test.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/stage-engine.test.ts) dan 20 tests di [`server/organization.test.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/organization.test.ts)), `tsc --noEmit` bersih, dan production build Vite sukses.

---

## 2. Completed Tasks

| Task ID | Task Description | Status | Evidence / Reference |
|---|---|---|---|
| **HF02B-001** | Existing Approval Engine Inspection | COMPLETE | Analisis alur submission, progression, BOD paralel, dan penolakan pada `server/repository.ts` & `src/types/document.ts`. |
| **HF02B-002** | Independent Approval Stage Data Model | COMPLETE | Relasi SQLite terpisah: `approval_workflows`, `approval_assignment_snapshots`, `approval_stages`, `approval_decisions`. |
| **HF02B-003** | Submission-Time Approver Snapshot | COMPLETE | Mengunci penugasan aktif organisasi saat submission; menolak unverified/inactive approver; kebal terhadap mutasi penugasan pasca-submission. |
| **HF02B-004** | Snapshot Persistence & Transaction Safety | COMPLETE | Skema SQLite transaksional (`BEGIN IMMEDIATE ... COMMIT`), idempoten, dan aman dari restart. |
| **HF02B-005** | Independent Stage State Machine | COMPLETE | State machine per-stage: `WAITING -> PENDING -> APPROVED / REJECTED`. Stage non-aktif tidak dapat disetujui lebih awal. |
| **HF02B-006** | Sequential & Parallel Workflow Support | COMPLETE | Tahap 1 -> Tahap 2 sekuensial; Tahap 3A (Hery) & 3B (Hashimoto) paralel dengan aturan konsensus penuh. |
| **HF02B-007** | Stage-Based Decision Records | COMPLETE | Setiap keputusan tercatat dengan `stage_id` eksplisit dan `approver_user_id` kanonikal. |
| **HF02B-008** | Legacy Workflow Compatibility | COMPLETE | Dokumen lama dan format auth tetap terbaca; pemetaan `legacy_id` menjamin kompatibilitas tanpa modifikasi endpoint publik. |
| **HF02B-009** | Internal Engine API & Integration Contract | COMPLETE | Typed interface `ApprovalStageEngine` siap diintegrasikan pada tahap HF02-C. |
| **REV-001** | PV Stage Initialization Verification | COMPLETE | Verifikasi alur PV; tidak ada keputusan fiktif; PV dimulai langsung pada Stage 2 PENDING. |
| **REV-002** | GR Workflow Coverage Verification | COMPLETE | Verifikasi GR tanpa approval bertahap; `isApprovalRequired('GR') === false`. |
| **REV-003** | Reviewer & BOD Assignment Source Verification | COMPLETE | Pemisahan role, konfigurasi persisten, dan fixtures via `StageResolutionOptions`. |

---

## 3. Data Model

Skema SQLite diimplementasikan dalam `server/stage-engine.ts`:

```sql
-- 1. Instance Workflow Dokumen
CREATE TABLE approval_workflows (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  doc_number TEXT NOT NULL,
  unit_id TEXT,
  workflow_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK(status IN ('ACTIVE','COMPLETED','REJECTED','CANCELLED')),
  submitted_at TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  completed_at TEXT
);

-- 2. Snapshot Penugasan saat Submission
CREATE TABLE approval_assignment_snapshots (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES approval_workflows(id),
  document_id TEXT NOT NULL,
  unit_id TEXT,
  unit_name TEXT,
  assignment_id TEXT,
  stage_key TEXT NOT NULL,
  approver_user_id TEXT NOT NULL,
  approver_name TEXT NOT NULL,
  role_context TEXT NOT NULL,
  snapshot_timestamp TEXT NOT NULL,
  policy_version TEXT NOT NULL
);

-- 3. Tahap Persetujuan Independen
CREATE TABLE approval_stages (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES approval_workflows(id),
  stage_key TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  parallel_group TEXT,
  assigned_approver_id TEXT NOT NULL,
  approver_name TEXT NOT NULL,
  approver_role TEXT NOT NULL,
  snapshot_id TEXT NOT NULL REFERENCES approval_assignment_snapshots(id),
  status TEXT NOT NULL CHECK(status IN ('WAITING','PENDING','APPROVED','REJECTED')),
  activated_at TEXT,
  completed_at TEXT
);

-- 4. Riwayat Keputusan Berbasis Stage
CREATE TABLE approval_decisions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES approval_workflows(id),
  stage_id TEXT NOT NULL REFERENCES approval_stages(id),
  approver_user_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK(decision IN ('APPROVE','REJECT')),
  comment TEXT,
  decided_at TEXT NOT NULL
);

-- 5. Penugasan Panggung Approval Persisten (HF02-B Final Revision 02)
CREATE TABLE approval_stage_assignments (
  id TEXT PRIMARY KEY,
  stage_key TEXT NOT NULL UNIQUE CHECK(stage_key IN ('STAGE_2_FINANCE','STAGE_3_BOD_HERY','STAGE_3_BOD_HASHIMOTO')),
  assigned_user_id TEXT NOT NULL,
  active INTEGER NOT NULL CHECK(active IN (0,1)) DEFAULT 1,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

-- 6. Audit Trail Penugasan Panggung Approval
CREATE TABLE approval_stage_assignment_audit (
  id TEXT PRIMARY KEY,
  stage_key TEXT NOT NULL,
  assigned_user_id TEXT NOT NULL,
  active INTEGER NOT NULL,
  actor_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  at TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT NOT NULL
);
```

---

## 4. Snapshot Behavior

1. **Resolusi Otoritatif**: Pada saat submission (`createSubmissionWorkflow`), engine mengecek `unitId` pemohon ke `OrganizationRepository` untuk menemukan penugasan supervisor aktif.
2. **Validasi Ketat Identitas (ADR-ID-002 / ADR-ID-003)**:
   - Jika unit tidak memiliki penugasan aktif -> gagal eksplisit (`NO_ASSIGNMENT`).
   - Jika akun approver belum diverifikasi (`verificationStatus !== 'VERIFIED'`) -> gagal eksplisit (`APPROVER_UNVERIFIED`).
   - Jika akun approver nonaktif (`status !== 'ACTIVE'`) -> gagal eksplisit (`APPROVER_INACTIVE`).
3. **Kekebalan Mutasi Pasca-Submission**: Sekali snapshot terbentuk dan dikunci ke workflow, perubahan penugasan organisasi di master data tidak mengubah approver pada workflow instance aktif.
4. **Atomisitas Transaksional**: Kegagalan validasi approver membatalkan seluruh transaksi (`ROLLBACK`), tanpa meninggalkan workflow setengah jadi.

---

## 5. Stage Engine

- **State Model**: `WAITING` (menunggu tahap sebelumnya), `PENDING` (aktif menunggu tindakan approver yang ditugaskan), `APPROVED` (selesai disetujui), `REJECTED` (ditolak).
- **Inisialisasi**:
  - Untuk PR, PO, AV, RB, RC: Stage 1 = `PENDING`, Stage 2 = `WAITING`, Stage 3A & 3B = `WAITING`.
  - Untuk PV (Payment Voucher): Stage 1 tidak dibentuk; Stage 2 = `PENDING`, Stage 3A & 3B = `WAITING`.
  - Untuk GR (Goods Receipt): Tidak ada approval stage; langsung berstatus `COMPLETED`.
- **Progression Logic**:
  - Keputusan `APPROVE` pada Stage 1 mengaktifkan Stage 2 menjadi `PENDING`.
  - Keputusan `APPROVE` pada Stage 2 mengaktifkan Stage 3A dan 3B (BOD paralel) menjadi `PENDING`.
  - Keputusan `APPROVE` pada Stage 3 mengecek apakah seluruh anggota grup paralel (`BOD_PARALLEL`) telah berstatus `APPROVED`. Jika kedua direksi telah menyetujui, workflow bertransisi menjadi `COMPLETED`.
- **Rejection Logic**:
  - Penolakan wajib menyertakan komentar (`REJECTION_COMMENT_REQUIRED`).
  - Stage yang menolak menjadi `REJECTED`.
  - Jika tahap berada dalam grup paralel (BOD), tahap direksi pasangannya yang masih `PENDING` diubah kembali menjadi `WAITING` (tersuspensi).
  - Workflow instance bertransisi menjadi `REJECTED`.

---

## 6. Multi-Stage Approval Test Evidence (BR-APP-001)

Skenario pengujian terverifikasi pada `server/stage-engine.test.ts`:
1. **Setup**: Ayu Martina (`usr-ayu-01`) ditugaskan sebagai Atasan Langsung untuk Divisi Finance & HRGA, sekaligus bertindak sebagai Verifikator Keuangan pada Tahap 2.
2. **Submission**: Dokumen diajukan, menghasilkan:
   - Stage 1 ID `stg-01`: Assigned to `usr-ayu-01`, Status = `PENDING`.
   - Stage 2 ID `stg-02`: Assigned to `usr-ayu-01`, Status = `WAITING`.
3. **Persetujuan Pertama**: Ayu Martina menyetujui Stage 1:
   - Stage 1 ID `stg-01` -> `APPROVED`.
   - Keputusan pertama tercatat untuk Stage 1 ID `stg-01`.
   - Stage 2 ID `stg-02` bertransisi dari `WAITING` menjadi `PENDING`.
   - **Verifikasi**: Stage 2 **TIDAK otomatis disetujui** (`completedAt` tetap null).
4. **Persetujuan Kedua**: Ayu Martina menyetujui Stage 2:
   - Stage 2 ID `stg-02` -> `APPROVED`.
   - Keputusan kedua tercatat untuk Stage 2 ID `stg-02`.
   - Stage 3A dan 3B diaktifkan menjadi `PENDING`.
5. **Bukti Integritas**:
   - `getDecisions(workflow.id)` mengembalikan **tepat dua decision records berbeda**.
   - Setiap keputusan memiliki UUID tersendiri dan merujuk `stageId` yang tepat.
   - Aturan anti auto-skip terbukti terpenuhi 100%.

---

## 7. Revision 01 Verification (REV-001, REV-002, REV-003)

### REV-001 — PV Stage Initialization
- **Investigasi**: Pada alur procurement existing (`server/repository.ts:1240-1280`), Payment Voucher (PV) adalah dokumen hilir pencairan dana yang dibuat khusus oleh Tim Keuangan dari dokumen sumber (PO, AV, RB, atau RC Defisit) yang **telah disetujui penuh oleh seluruh pihak (Atasan, Ayu, dan BOD)**.
- **Apakah Stage 1 memerlukan persetujuan?**: Tidak. Atasan Langsung pemohon sudah menyetujui dokumen sumber. Atasan Langsung tidak melakukan approval ulang pada voucher pembayaran bank.
- **Apakah ada approval fiktif?**: Pada kode legacy, `approvalSteps.atasan.status = 'APPROVED'` dengan komentar `"PV diajukan oleh Keuangan"` murni merupakan *UI placeholder* agar komponen stepper visual tidak rusak. Pada `ApprovalStageEngine`, **tidak ada stage 1 fiktif dan tidak ada record persetujuan palsu**. Tabel `approval_decisions` kosong saat submission PV (`toHaveLength(0)`). Workflow PV langsung dimulai dari Tahap 2 (Verifikasi Keuangan) dalam status `PENDING`.

### REV-002 — GR Workflow Coverage
- **Investigasi**: Sesuai implementasi existing di `server/repository.ts:667-715`, Goods Receipt (GR) adalah *laporan pencatatan fisik serah terima barang/jasa* atas PO yang sah. Begitu pengguna melampirkan bukti BAST (untuk jasa) atau Foto (untuk barang), GR langsung berpindah ke status `APPROVED` tanpa melalui antrean multi-stage approval.
- **Dukungan Stage Engine**: Stage engine menyediakan helper `isApprovalRequired('GR') === false`. Ketika `createSubmissionWorkflow` menerima dokumen `GR`, workflow instance langsung berstatus `COMPLETED` tanpa membuat stages atau snapshots fiktif (`stages: []`, `snapshots: []`). Tidak ada approval rules baru yang ditambahkan di luar alur existing.

### REV-003 & Final Revision 02 — Explicit Workflow Assignment Enforcement
- **Penugasan Eksplisit & Persisten**:
  1. **Stage 1 (Atasan Langsung)**: Menggunakan tabel persisten [`org_assignments`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/organization.ts) berdasarkan unit pemohon.
  2. **Stage 2 (Verifikator Keuangan)**: Menggunakan penugasan eksplisit persisten pada tabel [`approval_stage_assignments`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/stage-engine.ts) dengan kunci `'STAGE_2_FINANCE'`.
  3. **Stage 3 (BOD Paralel - Dual Directors)**: Menggunakan dua penugasan independen persisten pada [`approval_stage_assignments`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/stage-engine.ts) dengan kunci `'STAGE_3_BOD_HERY'` dan `'STAGE_3_BOD_HASHIMOTO'`.
- **Pemberantasan Role Fallback**:
  - Seluruh query pencarian user berdasarkan peran (`role === 'AYU'`, `role === 'BOD_HERY'`, `role === 'BOD_HASHIMOTO'`) dan pemilihan kandidat pertama (`candidates[0]`) telah **dihapus total**.
  - Keberadaan pengguna dengan role tertentu tidak lagi memberikan hak approval otomatis jika penugasan eksplisit belum diset oleh Admin.
- **Pengamanan `StageResolutionOptions`**:
  - Parameter override harus menyertakan `authorizedBy` yang valid dari Administrator aktif dan terverifikasi.
  - Percobaan override tanpa otorisasi menghasilkan HTTP 403 `UNAUTHORIZED_STAGE_OVERRIDE`.
- **Mekanisme Manajemen Admin**:
  - Disediakan endpoint REST Admin [`GET/POST /api/v1/organization/stage-assignments`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/app.ts) dan [`POST /api/v1/organization/stage-assignments/:stageKey/deactivate`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/app.ts) yang dilindungi otorisasi Admin (HTTP 403 untuk non-Admin).

---

## 8. Final Revision 02 Deliverables Matrix

| Kriteria PM | Hasil Verifikasi | Referensi Kode & Pengujian |
|---|---|---|
| **Stage 2 assignment persisten** | **PASS**: Stage 2 mengambil approver dari `approval_stage_assignments` dan mengikat `assignment_id` pada snapshot. | `server/stage-engine.ts:511-525`<br>`server/stage-engine.test.ts:729-760` |
| **Stage 3 assignment independen** | **PASS**: Dua stage BOD memiliki baris penugasan terpisah. Jika kedua tahap diisi ID yang sama, melempar `BOD_IDENTITY_CONFLICT`. | `server/stage-engine.ts:536-580`<br>`server/stage-engine.test.ts:762-811` |
| **Role AYU tanpa assignment ditolak** | **PASS**: Pengguna dengan role AYU tidak di-pick otomatis. Jika assignment Stage 2 dinonaktifkan, melempar `NO_STAGE2_ASSIGNMENT`. | `server/stage-engine.ts:515`<br>`server/stage-engine.test.ts:813-841` |
| **Role BOD tanpa assignment ditolak** | **PASS**: Pengguna dengan role BOD tidak di-pick otomatis. Jika assignment Stage 3 dinonaktifkan, melempar `NO_STAGE3_HERY_ASSIGNMENT`. | `server/stage-engine.ts:544`<br>`server/stage-engine.test.ts:843-873` |
| **Missing assignment gagal eksplisit** | **PASS**: Missing assignment menghasilkan error 422 eksplisit tanpa fallback diam-diam ke ID `usr-*`. | `server/stage-engine.ts:515, 544, 567`<br>`server/stage-engine.test.ts:875-900` |
| **Multiple candidates tidak di-fallback** | **PASS**: Keberadaan beberapa kandidat dengan role sama tidak dipilih berdasarkan query list; hanya user yang ditugaskan secara persisten yang terpilih. | `server/stage-engine.ts:511-520`<br>`server/stage-engine.test.ts:902-944` |
| **Unauthorized override ditolak** | **PASS**: Penggunaan options tanpa authorizedBy atau dengan non-admin authorizer ditolak seketika (HTTP 403 `UNAUTHORIZED_STAGE_OVERRIDE`). | `server/stage-engine.ts:503-510`<br>`server/stage-engine.test.ts:946-976` |
| **Inactive/unverified approver ditolak** | **PASS**: Percobaan menugaskan atau mengajukan dokumen dengan akun unverified / inactive ditolak (HTTP 422 `APPROVER_UNVERIFIED` / `APPROVER_INACTIVE`). | `server/stage-engine.ts:310-320, 521-525`<br>`server/stage-engine.test.ts:978-1006` |
| **Snapshot tetap immutable** | **PASS**: Mutasi penugasan panggung baru tidak mempengaruhi approver pada dokumen yang telah diajukan sebelumnya. | `server/stage-engine.test.ts:1008-1055` |
| **Dual approval pengguna sama berfungsi** | **PASS**: Satu pengguna yang memiliki penugasan sah di Stage 1 dan Stage 2 tetap dapat melakukan dua tindakan approval independen tanpa auto-skip. | `server/stage-engine.test.ts:1057-1108` |
| **Otorisasi REST API Admin** | **PASS**: Endpoint `/organization/stage-assignments` menolak non-Admin (HTTP 403) dan menerima Admin (HTTP 200/201). | `server/app.ts:145-165`<br>`server/organization.test.ts:153-178` |

---

## 9. Sequential & Parallel Workflow

- **Sekuensial**: Pengujian membuktikan tahap berikutnya tidak dapat disetujui mendahului tahap sebelumnya (mencoba menyetujui tahap berstatus `WAITING` melempar `DomainError: Tahap belum aktif untuk persetujuan`).
- **BOD Paralel**:
  - Direksi 1 dan Direksi 2 dapat menyetujui dalam urutan mana pun (Hery dulu baru Hashimoto, atau Hashimoto dulu baru Hery).
  - Persetujuan oleh salah satu direksi membuat dokumen tetap berstatus `ACTIVE` (`IN_REVIEW`).
  - Dokumen baru menjadi `COMPLETED` ketika kedua direksi telah menyetujui.
  - Penolakan oleh salah satu direksi membatalkan status `PENDING` pada direksi lainnya dan mengubah status workflow menjadi `REJECTED`.

---

## 10. Legacy Compatibility

- **Format Dokumen Eksisting**: Dokumen lama pada `server/repository.ts` dan riwayat approval historis tetap utuh dan terbaca tanpa modifikasi.
- **Identitas**: Pemetaan `legacy_id` (`usr-pemohon-01`, `usr-atasan-01`, `usr-ayu-01`, dll.) mempertahankan validitas JWT dan kepemilikan dokumen (`ownerId`).
- **Endpoint Eksisting**: Endpoint publik approval eksisting (`/api/v1/documents/:id/decisions`) tetap berfungsi normal selama HF02-B karena stage engine baru diposisikan sebagai isolated domain engine untuk persiapan HF02-C.

---

## 11. PM Control Results

| Kontrol PM | Deskripsi Aturan | Hasil Pengujian Aktual |
|---|---|---|
| **PM-001** | Bootstrap Admin Safety | **PASS**: Hanya `usr-admin-01` bootstrap yang aktif/terverifikasi awal. Admin non-bootstrap baru berstatus `UNVERIFIED`. Admin yang dinonaktifkan tidak aktif kembali saat restart. Admin **tidak pernah** dijadikan fallback approver otomatis saat penugasan unit kosong. |
| **PM-002** | Legacy Identity Compatibility | **PASS**: Otentikasi kredensial, validasi klaim JWT, kepemilikan dokumen (`ownerId`), dan resolusi user via `legacy_id` lulus pengujian. |
| **PM-003** | Operational Readiness Gate | **PASS**: Seluruh pengujian engine menggunakan database sementara di `tmpdir()`. Database operasional (`blc-local.sqlite`) tidak dimigrasikan atau disentuh. |

---

## 12. Testing Results

- **Vitest**: **215 passed tests across 28 test files** (100% green).
  - 38 tests pada [server/stage-engine.test.ts](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/stage-engine.test.ts) (22 skenario baseline/rev01 + 10 skenario Final Revision 02 + 6 skenario Security Gate).
  - 20 tests pada [server/organization.test.ts](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/organization.test.ts) (termasuk verifikasi otorisasi endpoint Admin stage-assignments).
  - 24 tests pada [server/server.test.ts](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/server.test.ts).
  - 133 tests pada komponen UI dan domain utilities lainnya.
- **Typecheck**: `tsc --noEmit` lulus bersih tanpa peringatan atau error.
- **Build**: Vite production build (`npm run build`) berhasil (exit code 0).
- **Idempotensi**: Fungsi migrasi `migrateApprovalEngine` diuji 5 kali berurutan tanpa error.

---

## 13. Changed Files

1. **Source Code**:
   - [server/stage-engine.ts](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/stage-engine.ts): Skema `approval_stage_assignments`, penghapusan total query fallback role global, implementasi penugasan eksplisit persisten, pengamanan `StageResolutionOptions` dengan validasi otorisasi server dan pencegahan impersonasi Admin, audit trail `SUBMISSION_OVERRIDE` pada `approval_stage_assignment_audit`, validasi pencegahan konflik identitas BOD ganda, dan API manajemen stage assignment.
   - [server/organization.ts](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/organization.ts): Penambahan method `listStageAssignments`, `setStageAssignment`, `deactivateStageAssignment` dengan validasi identitas tervalidasi.
   - [server/app.ts](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/app.ts): Endpoint Admin REST `/api/v1/organization/stage-assignments` dan deactivasi panggung dengan proteksi HTTP 403 bagi non-Admin.
2. **Automated Test**:
   - [server/stage-engine.test.ts](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/stage-engine.test.ts): 38 automated tests mencakup pengujian baseline, verifikasi REV-001/002/003, 10 skenario penegakan Final Revision 02, dan 6 skenario verifikasi Security Gate.
   - [server/organization.test.ts](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/organization.test.ts): Penambahan test otorisasi Admin untuk stage-assignments.
3. **Dokumentasi Penyelesaian**:
   - [docs/redesign/hotfix-br-app-001-hf02b.md](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/docs/redesign/hotfix-br-app-001-hf02b.md)

---

## 14. Remaining Risks & HF02-C Readiness

1. **Reassignment Dokumen Aktif (*In-Flight*)**: Jika approver berhalangan tetap setelah snapshot terkunci pada dokumen yang sedang berjalan, mekanisme transfer stage reassignment yang sah merupakan ruang lingkup tahap **HF02-C**.
2. **Request-Level Idempotency (`X-Idempotency-Key`)**: Engine internal telah idempoten di tingkat *domain status*, namun integrasi header HTTP idempotency pada endpoint publik akan difinalisasi pada **HF02-C**.
3. **Penyatuan Transaksi Antar-Storage**: Sinkronisasi atomik antara dokumen repository JSON dan tabel SQLite stage engine akan diaktifkan saat penyambungan endpoint publik di **HF02-C**.

---

## 15. Security Gate Verification — StageResolutionOptions Authorization

### 15.1 Trust Boundary & Call Site Inspection
- **Call Sites**: Seluruh call site `StageResolutionOptions` berada eksklusif pada layer backend internal (`server/stage-engine.ts` dan pengujian `server/stage-engine.test.ts`). Tidak ada client HTTP atau form UI yang dapat mengirimkan opsi override langsung ke engine.
- **Trust Boundary Enforcement**:
  1. `source: 'CLIENT_REQUEST'`: Jika parameter override ditandai berasal dari request client luar, engine langsung menolak dengan HTTP 403 `UNTRUSTED_CLIENT_OVERRIDE`.
  2. **Pencegahan Impersonasi**: Jika pemohon (`applicantUserId`) bukan Administrator aktif/terverifikasi, pengajuan dengan `authorizedBy` ID Administrator wajib menyertakan objek konteks server terotentikasi (`authorizerUser`). Jika tidak, melempar HTTP 403 `IMPERSONATION_PREVENTED`.
  3. **Integritas Konteks Otorisasi**: Jika `authorizerUser` tidak cocok dengan `authorizedBy`, atau bukan Admin aktif terverifikasi, melempar HTTP 403 `INVALID_AUTHORIZER_CONTEXT`.
  4. **Kewajiban Alasan Override**: Setiap override wajib menyertakan `overrideReason` non-kosong, jika tidak melempar HTTP 422 `OVERRIDE_REASON_REQUIRED`.
  5. **Audit Trail Persisten**: Setiap stage yang dioverride dicatat ke dalam `approval_stage_assignment_audit` dengan `action: 'SUBMISSION_OVERRIDE'`, merekam aktor Admin, ID approver target, ID dokumen, alasan override, dan snapshot penugasan sebelumnya jika ada.
  6. **Immutability Snapshot**: Override yang sah mengunci snapshot saat submission dan tidak terpengaruh oleh mutasi penugasan panggung berikutnya.

### 15.2 Security Gate Verification Matrix

| Kriteria Security Gate | Hasil Verifikasi | Bukti Test & Referensi Kode |
|---|---|---|
| **Pencegahan Impersonasi Admin oleh Non-Admin** | **PASS**: Non-Admin tidak dapat memanfaatkan ID Admin dalam `authorizedBy` tanpa konteks server terotentikasi. Melempar `IMPERSONATION_PREVENTED` (HTTP 403). | `server/stage-engine.ts:550-565`<br>`server/stage-engine.test.ts:1120-1145` |
| **Penolakan Override dari Client Request** | **PASS**: Opsi dengan `source: 'CLIENT_REQUEST'` langsung ditolak tanpa evaluasi lebih lanjut. Melempar `UNTRUSTED_CLIENT_OVERRIDE` (HTTP 403). | `server/stage-engine.ts:518-525`<br>`server/stage-engine.test.ts:1147-1172` |
| **Kewajiban Alasan Override (`overrideReason`)** | **PASS**: Override tanpa alasan atau hanya whitespace ditolak dengan error eksplisit `OVERRIDE_REASON_REQUIRED` (HTTP 422). | `server/stage-engine.ts:580-585`<br>`server/stage-engine.test.ts:1174-1198` |
| **Validasi Integritas Konteks Server** | **PASS**: Konteks server yang tidak cocok atau berstatus non-Admin/unverified ditolak dengan `INVALID_AUTHORIZER_CONTEXT` (HTTP 403). | `server/stage-engine.ts:567-578`<br>`server/stage-engine.test.ts:1200-1225` |
| **Pencatatan Audit Trail Transaksional** | **PASS**: Override sah mencatat baris `SUBMISSION_OVERRIDE` di `approval_stage_assignment_audit` dengan payload JSON lengkap dan actor Admin. | `server/stage-engine.ts:815-885`<br>`server/stage-engine.test.ts:1227-1270` |
| **Immutability Submission Snapshot** | **PASS**: Dokumen yang disubmit dengan override sah mengunci identitas approver pada snapshot; perubahan penugasan global berikutnya tidak mengubah approver dokumen tersebut. | `server/stage-engine.ts:660-805`<br>`server/stage-engine.test.ts:1272-1305` |
| **Existing Suite & Build Integrity** | **PASS**: 215 tests passed across 28 test files; TypeScript compile dan Vite production build sukses (exit code 0). | Vitest & Vite build log |

---

**STAGE-GATE STATUS: SECURITY GATE VERIFIED — AWAITING PRODUCT OWNER APPROVAL**  
Seluruh 6 kriteria keamanan StageResolutionOptions telah teruji dan terverifikasi secara ketat (215/215 tests green, build code 0). Sesuai instruksi: **HF02-C REMAINS LOCKED**. Eksekusi dihentikan di sini menunggu keputusan resmi Product Owner / Project Manager.

# BLC PROCUREMENT PRO — DB-01
## Concurrency & Cross-Storage Race Condition Report (PM Condition 02)

**Phase:** DB-01 — Branch Master Foundation  
**Status:** VERIFIED & PASSING  
**Target:** Prevention of Race Conditions Between Branch Deactivation and Document Submission

---

## 1. Problem Statement & Threat Analysis (PM Condition 02)

Pada arsitektur sistem hybrid (SQLite storage untuk master cabang/organisasi dan synchronous document repository), terdapat potensi race condition saat dua operasi terjadi bersamaan:
1. **Thread A (Admin):** Memanggil penonaktifan cabang (`POST /api/v1/branches/:id/deactivate`).
2. **Thread B (Pemohon):** Mengajukan dokumen pengadaan baru (`POST /api/v1/documents`) untuk cabang yang sama.

Jika tidak dikoordinasikan:
- Thread A memeriksa dokumen aktif: belum ada (0 transaksi aktif).
- Thread B membuat dokumen untuk cabang tersebut sebelum status cabang berubah menjadi `INACTIVE`.
- Thread A mengubah status cabang menjadi `INACTIVE`.
- **Hasil Cacat:** Tercipta dokumen aktif pada cabang yang sudah tidak aktif (pelanggaran prinsip REG-05).

---

## 2. Technical Solution: `BranchConcurrencyCoordinator`

Untuk mencegah race condition tanpa overhead locking database eksternal yang kompleks, diimplementasikan `BranchConcurrencyCoordinator` pada `server/branch-engine.ts`:

### Karakteristik & Mekanisme Kunci
1. **Key-Scoped Sequential Locking:**
   - Kunci lock berbasis nama/kode cabang (`branchKey.toUpperCase()`), sehingga operasi cabang Bekasi tidak pernah memblokir operasi cabang Surabaya.
2. **Read-Write Synchronization:**
   - **Write Lock (`withBranchWriteLock`):** Digunakan saat penonaktifan cabang. Operasi ini mendapatkan akses eksklusif: operasi baca/tulis dokumen lain untuk cabang tersebut harus menunggu hingga deactivation selesai dan ter-commit.
   - **Read Lock (`withBranchReadLock`):** Digunakan saat pembuatan dokumen pengadaan baru. Memastikan branch status dicek dan dokumen disimpan secara atomik sebelum penonaktifan cabang dapat dieksekusi.
3. **Promise-Chain Queue Lifecycle:**
   - Menggunakan promise chain in-memory yang otomatis membersihkan map setelah seluruh task pada key tersebut terselesaikan, mencegah memory leak.

---

## 3. Test Execution & Evidence

### Test T11: `BranchConcurrencyCoordinator` Unit Test
- **File:** `server/branch-engine.test.ts`
- **Skenario:** Menjalankan simulasi deactivation (delay 50ms) bersamaan dengan pengajuan dokumen pada branch yang sama (`SBY`).
- **Hasil:**
  - Urutan eksekusi: `write-start` -> `write-finish` -> `read-start`.
  - Operasi deactivation selesai penuh sebelum operasi pengajuan dimulai.
  - Hasil: `PASS` (101ms).

### Test End-to-End: REST API Concurrency Guard
- **File:** `server/server.test.ts`
- **Skenario:**
  1. Pengajuan dokumen baru pada cabang yang berstatus `INACTIVE` langsung ditolak dengan kode HTTP 422 `BRANCH_INACTIVE`.
  2. Penonaktifan cabang saat terdapat dokumen aktif (`SUBMITTED`, `IN_REVIEW`, unpaid PV, open draft) ditolak dengan HTTP 409 `BRANCH_HAS_ACTIVE_TRANSACTIONS`.
- **Hasil:** `PASS` (26/26 tests passing).

# BLC Procurement Pro — Core Workspaces Design Specifications & Role Matrix (Phase 02)

**Status:** APPROVED WORKSPACES VISUAL EXPANSION (PENDING PO FINAL APPROVAL)  
**Dokumen Induk:** `docs/uiux/phase02-frozen-design-foundation.md`  
**Cakupan Layar:** Register, Formulir PR, Ruang Persetujuan, Keuangan & Pembayaran.

---

## 1. Matriks Visibilitas & Hak Akses Berdasarkan Role (Role Presentation Matrix)

Sesuai aturan bisnis aplikasi (`src/types/document.ts`, `server/organization.ts`, dan REG-03):

| Fitur / Layar | Pemohon (Requester) | Penyetuju Ditugaskan (Assigned Approver) | Staf Keuangan (Finance Staff) | Administrator (Admin) |
|---|---|---|---|---|
| **Procurement Register** | Membaca seluruh dokumen (REG-03). Aksi edit hanya pada Draf sendiri. | Membaca seluruh dokumen. Menyorot dokumen yang butuh approval dirinya. | Membaca seluruh dokumen. Menyorot dokumen siap PV atau siap bayar. | Membaca seluruh dokumen. Akses menu monitoring dan konfigurasi master. |
| **Procurement Form** | Membuat & mengedit draf (PR/PO/AV/RB). Memilih atasan dari assignment valid. | Melihat formulir dalam mode read-only / telaah lampiran. | Melihat estimasi dan ketersediaan anggaran dalam formulir. | Melihat dan mengaudit formulir tanpa mengubah hak approval. |
| **Approval Workspace** | Melihat riwayat progres tahapan persetujuan pengajuannya (read-only). | **Memberikan keputusan: Setujui atau Tolak** pada dokumen yang ditugaskan sah. | Menyetujui pada tahap Finance Reviewer untuk PV. | Memantau SLA dan melakukan reassignment approver jika terjadi kebuntuan. |
| **Finance: Buat PV** | *Tidak memiliki akses tombol Buat PV.* | *Tidak memiliki akses tombol Buat PV.* | **Menerbitkan Payment Voucher** secara eksplisit dari PO/AV/RB approved. | Memantau penerbitan PV dan rekonsiliasi cross-storage. |
| **Finance: Catat Bayar** | *Tidak memiliki akses pencatatan bayar.* | *Tidak memiliki akses pencatatan bayar.* | **Mencatat Realisasi Pembayaran** (bank ref, tanggal transfer, mutasi kas). | Mengaudit log mutasi pembayaran dan histori transaksi. |
| **Detail Rekening Bank** | Disamarkan / Tidak tampil. | Disamarkan (`•••• 1289`). | Tampil dengan penyamaran parsial demi kepatuhan audit. | Disamarkan untuk menjaga kerahasiaan data perbankan vendor. |

*Catatan Penting:* Tampilan visual role pada preview bersifat simulasi untuk review desain. Otorisasi aktual diatur secara ketat oleh runtime middleware backend.

---

## 2. Penegakan Koreksi Aturan Bisnis (Business Rule Corrections)

1. **BR-01 (Sumber PV Sah):**
   - Hanya dokumen `PO`, `AV`, dan `RB` yang telah berstatus `APPROVED` penuh yang dapat diterbitkan Payment Voucher.
   - Dokumen `PR` **tidak pernah** dijadikan sumber langsung PV; PR harus dikonversi menjadi PO atau diselesaikan sesuai daur pengadaan.
2. **BR-02 (Aksi Persetujuan):**
   - Opsi persetujuan pada workspace adalah **Setujui** (`APPROVE`) dan **Tolak** (`REJECT`).
   - Tidak menambahkan tombol `Kembalikan` tiruan yang tidak didukung oleh state engine.
3. **BR-03 (Visualisasi Alur Kerja):**
   - Dokumen PR/PO/AV/RB mengikuti alur standar 3 tahap (Atasan -> Reviewer Teknis -> Direksi).
   - Dokumen PV mengikuti alur sekuensial khusus: Finance Reviewer -> Direktur (Hery) -> Presiden Direktur (Hashimoto), **tanpa atasan langsung Tahap 1**.
   - Dokumen Goods Receipt (GR) diselesaikan saat submit **tanpa antrean persetujuan**.
4. **BR-04 (Periode & Tanggal):**
   - Periode diberi label eksplisit sebagai simulasi skenario (Jul–Des 2026) tanpa klaim historis yang bertentangan.
5. **BR-05 (RC — Realisasi Kasbon / Pertanggungjawaban Uang Muka):**
   - Perilaku dokumen RC (Realisasi Kasbon / Pertanggungjawaban Uang Muka atas Advance/AV) dipertahankan sesuai domain model existing tanpa mengada-adakan konfirmasi defisit manual. Istilah Revolving Credit telah dihapus dan diluruskan.
6. **BR-06 (Pemisahan Izin & Kerahasiaan Data):**
   - Status `Disetujui` pada PV tidak dianggap sebagai bukti pembayaran.
   - Status `Dibayar (PAID)` baru disematkan setelah mutasi pencairan kas tercatat.
   - Rekening vendor ditampilkan dengan masking (`Mandiri •••• 7712`).

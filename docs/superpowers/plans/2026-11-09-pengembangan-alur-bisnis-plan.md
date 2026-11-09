# Pengembangan Alur Bisnis Terfiksasi & Perbaikan Temuan Ponytail — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan fiksasi penuh alur bisnis BLC Procurement (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`, `Catatan Pembayaran`, `ApprovalRegister`, `Ekspor Keuangan 13 Kolom`, dan `Paket Audit PV`) berdasarkan `Panduan_BLC_Procurement_v3_ID_4.pdf`, rangkaian email 26 Okt – 4 Nov 2026 (`FireShot Capture 015`), keputusan fiksasi pengguna, serta menyelesaikan seluruh 10 temuan audit Ponytail (`#1` s/d `#10`).

**Architecture:**
- Menjadikan [`server/repository.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts) dan modul domain di `src/domain/` sebagai **Single Source of Truth** untuk validasi aturan bisnis, batas plafon Rp 50.000.000, relasi induk-turunan (`1 PR : 1 PO`, `1 AV : 1 RC`, akumulasi `PV + AV <= PO`), alur persetujuan, dan kontrol akses rekening/lampiran.
- Menambahkan dukungan modul **`GR` (Laporan Penerimaan Barang/Jasa)** dan **Siklus Persetujuan `PV` (`AYU -> BOD_HERY & BOD_HASHIMOTO`)** dengan dukungan pembayaran penuh maupun bertahap atas PO, tanggal jatuh tempo (`paymentDueDate`), dan rekening sumber rencana (`plannedSourceAccount`).
- Memangkas kode prototipe `localStorage` yang mati (`src/draft.ts`, `src/draft-store.ts`, dan mutator lokal di `src/store/document-store.ts`) sesuai prinsip `ponytail`.

**Tech Stack:** TypeScript 5.8, React 19, Express 5, Node.js Built-in SQLite (`node:sqlite`), Vitest + Testing Library.

---

## Keputusan Fiksasi Alur Bisnis (Terkunci)

1. **Siklus `PV` (Payment Voucher):**
   - Diajukan oleh `KEUANGAN` dari dokumen induk `PO`, `AV`, `RB`, atau `RC` (`DEFICIT`) yang sudah `APPROVED`.
   - Memiliki formulir/input draf PV (`FormPV`) dengan field: `sourceDocId` (`ParentDoc`), `paymentDueDate` (wajib), `plannedSourceAccount` (wajib, rekening BLC yang direncanakan membayar), `invoiceNumber` & `invoiceDate` (opsional), lampiran `INVOICE` (wajib untuk PO jika belum ada di PO induk), serta opsi nominal pembayaran (default penuh mengikuti sisa dokumen induk, atau sebagian/termin untuk PO selama `total PV + AV <= total PO`).
   - Saat diajukan (`submitDocument` atau `generatePvFromSource`), PV masuk ke tahap persetujuan **`AYU` (GM) -> `BOD` Paralel (`BOD_HERY` & `BOD_HASHIMOTO`)** (tahap 1 `ATASAN` dilewati otomatis menjadi `APPROVED`).
   - Setelah PV berstatus `APPROVED`, barulah `KEUANGAN` dapat mencatat pelunasan (`recordPvPayment`), di mana `paidAmount` wajib sama dengan `netAmountToPay` (`Dibayarkan`).
2. **Modul `GR` (Laporan Penerimaan Barang/Jasa):**
   - Tipe dokumen baru `GR` (`GRDocument`) yang mengacu pada `parentPoId` (PO berstatus `APPROVED` atau `PAID`).
   - Field: `title`, `parentPoId`, `parentPoNumber`, `receiptType` (`'GOODS' | 'SERVICE'`), `receivedDate`, `itemCondition` (`'BAIK' | 'KURANG' | 'RUSAK'`), `notes`.
   - Wajib melampirkan `PHOTO` (jika `GOODS`) atau `BAST` (jika `SERVICE`) saat dikirim.
   - Tidak memerlukan persetujuan berjenjang: saat disubmit, status langsung `APPROVED`, mengirim notifikasi outbox (dengan penanda `"Perlu tindakan"` jika `itemCondition !== 'BAIK'`), tampil pada detail PO & PV terkait, serta masuk ke Paket Audit PV.
3. **Mekanisme Revisi Saat Ditolak (`REJECT`):**
   - Tetap mengedit draf pada record yang sama (`status` kembali ke `'DRAFT'` dan ditampilkan sebagai `"Perlu revisi"` di UI), tanpa kolom `PreviousRegisterID`.
   - Saat salah satu BoD menolak, status BoD pasangan yang masih `PENDING` direset ke `'WAITING'`.
4. **Aturan Plafon & Validasi Dokumen:**
   - **Plafon Sistem:** Nilai `Total` per pengajuan maksimal **Rp 50.000.000** (di atas Rp 50.000.000 ditolak dengan pesan menggunakan prosedur di luar sistem).
   - **PO & PR:**
     - `1 PR hanya untuk 1 PO` (tolak jika PR sudah dipakai PO lain).
     - Jika PO mengacu pada PR: PR wajib `APPROVED`, cabang & jenis anggaran sama, `subtotal` PO $\le$ `subtotalAmount` PR, dan `iamNumber` sama (jika PR punya IAM).
     - Kategori PO `STANDARD` (Pembelian Umum) dengan `subtotal >= Rp 5.000.000` wajib memiliki `parentPrId`, `iamNumber`, dan lampiran `IAM_MEMO`.
     - Kategori PO `ROUTINE` (Pembayaran Rutin) dan `MOBILIZATION` (Biaya Mobilisasi) bebas PR, IAM, dan nomor kontrak meskipun $\ge$ Rp 5.000.000, tetapi wajib melampirkan `INVOICE` (atau dokumen pendukung).
     - PO yang memuat kata `"realisasi"` pada `title` atau `purpose` ditolak otomatis dan diarahkan ke modul `RC`.
   - **RC (Realisasi CA):**
     - `1 AV : 1 RC`, AV harus milik pemohon dan memiliki PV berstatus `PAID`, `avOriginalAmount` otomatis dari `netAmountToPay` PV.
     - Jika memilih `EXACT` (`Sama dengan CA`), nilai realisasi otomatis mengikuti `avOriginalAmount`.
     - Jika `DEFICIT` (`Return to Employee`), setelah RC `APPROVED`, Keuangan menerbitkan PV selisih (`RC_DEFICIT`); saat PV selisih dilunasi (`recordPvPayment`), RC otomatis menjadi `PAID` dan `financeConfirmedAt` langsung terisi tanpa perlu konfirmasi dua kali.
5. **Buku Besar (`ApprovalRegister`), Ekspor Keuangan 13 Kolom, & Paket Audit PV:**
   - Kolom **`Dibayarkan`** di `ApprovalRegister` selalu menampilkan nilai net (`Total - PPh` / `netAmountToPay`).
   - Kolom **`Pembayaran`** (`Belum Dibayar` / `Lunas`) di `ApprovalRegister` hanya ditampilkan untuk baris `PV` (baris selain PV menampilkan `—`).
   - View/Filter Buku Besar mencakup: `Semua`, `Menunggu`, `Menunggu PV`, `Jadwal Pembayaran`, `Belum Dibayar`, `Dibayar`, `AV Tanpa PO`, `CA Belum Direalisasikan`.
   - **Ekspor Keuangan** menghasilkan 13 kolom: `Nomor, Jenis, Cabang, Judul, Tujuan, Subtotal, PPN, PPh, Dibayarkan, Bank, No. rekening, Nama rekening, Jatuh tempo`.
   - **Paket Audit PV** otomatis tersedia pada setiap PV yang sudah `PAID` (khusus `KEUANGAN`, `AYU`, `BOD`, `ADMIN`) yang merangkum rantai dokumen `PR -> PO/AV/RB/RC -> GR -> PV -> Bukti Transfer -> Ringkasan Persetujuan`.

---

## Tasks

- [x] **Task 1: Pembaruan Tipe Domain (`src/types/document.ts`) & Pembentuk Dokumen (`src/store/document-store.ts`)**
  - Tambahkan `GR` pada `DocType`, `GRDocument`, `LineItem`, perluas `PVDocument` (`paymentDueDate`, `plannedSourceAccount`, `invoiceNumber`, `invoiceDate`), perluas `PVPaymentDetails` (`paidAmount`, `notes`), dan perluas kategori lampiran (`PHOTO`, `BAST`).
  - Sesuaikan `SAMPLE_DOCUMENTS` agar seluruh nilai berada di bawah batas plafon Rp 50.000.000 dan hapus fungsi mutasi `localStorage` yang mati beserta `src/draft.ts` & `src/draft-store.ts`.

- [x] **Task 2: Penegakan Aturan Bisnis, Keamanan, & Siklus `PV`/`GR`/`RC` di Server (`server/repository.ts`, `server/app.ts`, `server/storage.ts`)**
  - Tutup celah *mass-assignment* (`stripSystemFields`) pada `createDocument` dan `updateDocument` (Temuan `#1`).
  - Sanitasi komentar rekening pada `auditLog` dan semua endpoint mutasi dengan `visibleDocument` (Temuan `#2`).
  - Reset status BoD pasangan yang masih `PENDING` ke `'WAITING'` saat salah satu BoD menolak (Temuan `#4`).
  - Terapkan validasi otoritatif saat submit: batas plafon Rp 50.000.000, aturan ketat PR/PO (`1 PR : 1 PO`, `subtotal PO <= subtotal PR`, larangan kata `"realisasi"` pada PO, kewajiban PR & IAM untuk `STANDARD >= 5jt`, kewajiban `INVOICE` untuk `ROUTINE`/`MOBILIZATION`), aturan AV (`activityEndDate`, akumulasi `AV + PV <= PO`), aturan RC (`1 AV : 1 RC`, auto-fill `EXACT`), dan aturan GR (langsung `APPROVED` saat submit dengan lampiran `PHOTO`/`BAST`).
  - Ubah alur `PV`: saat dibuat melalui `generatePvFromSource(sourceDocId, actor, options)` atau form PV, PV masuk ke tahap persetujuan `AYU -> BOD` (atau langsung diajukan ke `AYU`), mendukung pembayaran penuh/sebagian atas PO, dan saat `recordPvPayment` dipanggil, validasi `paidAmount === pv.netAmountToPay` serta otomatis selesaikan `RC` (`financeConfirmedAt`) bila `sourceDocType === 'RC_DEFICIT'`.
  - Perbaiki `getDashboardMetrics` untuk `ATASAN` berdasarkan email pengguna dan pangkas `idempotencyCache` yang kedaluwarsa (Temuan `#7` & `#9`).

- [x] **Task 3: Pembaruan Form Pengajuan (`FormPR`, `FormPO`, `FormAV`, `FormRB`, `FormRC`, `FormGR`, `FormPV`, `FormPVPayment`)**
  - Seragamkan tarif pajak di `TaxFields.tsx` & `FormPO.tsx` serta tambahkan pewarisan atribut dari dokumen induk (`PR -> PO` dan `PO -> AV`) beserta indikator selisih (`variance`).
  - Pada `FormRC.tsx`, jika memilih `EXACT` (`Sama dengan CA`), otomatis samakan nilai realisasi dengan `avOriginalAmount`.
  - Buat `FormGR.tsx` untuk pelaporan penerimaan Barang (`Photo_`) / Jasa (`BAST_`) atas PO yang sudah `APPROVED`.
  - Buat/perbarui modal pembuatan `PV` (`FormPV.tsx`) agar Keuangan dapat mengisi `PaymentDueDate`, `PlannedSourceAccount`, `InvoiceNo`/`InvoiceDate` opsional, dan nominal bayar (penuh/sebagian), serta perbarui `FormPVPayment.tsx` untuk menampilkan rekening tujuan & memvalidasi `PaidAmount === netAmountToPay`.

- [x] **Task 4: Pembaruan `ApprovalExplorer`, `DocumentList`, `DocumentDetailModal`, & `ExportModal`**
  - Di `ApprovalExplorer.tsx` (`ApprovalRegisterView`), tampilkan selalu nilai net pada kolom `Dibayarkan`, tampilkan status `Pembayaran` hanya untuk baris `PV`, dan tambahkan filter tampilan buku besar (`Menunggu PV`, `Jadwal Pembayaran`, `AV Tanpa PO`, `CA Belum Direalisasikan`).
  - Di `DocumentDetailModal.tsx`, perbaiki tampilan rekening bank yang disensor (Temuan `#2`), tampilkan laporan `GR` terkait pada detail PO/PV, dan tampilkan panel **Paket Audit PV (`Audit -> [nomor PV]`)** untuk PV yang sudah `PAID`.
  - Di `ExportModal.tsx`, implementasikan **Ekspor Keuangan (13 Kolom)** sesuai spesifikasi Bu Ayu & Koji Hashimoto.

- [x] **Task 5: Pengujian Regresi Menyeluruh & Pembaruan Knowledge Graph**
  - Tambahkan pengujian unit dan integrasi API di `server/api.test.ts` untuk seluruh aturan bisnis baru dan temuan Ponytail `#1` s/d `#10`.
  - Jalankan `npm test`, `npm run build`, dan `graphify update . --force`.

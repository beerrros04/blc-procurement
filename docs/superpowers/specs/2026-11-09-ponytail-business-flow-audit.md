# Ponytail Audit: Alur Bisnis & Integritas Domain BLC Procurement

**Tanggal Audit:** 2026-11-09  
**Metode:** `ponytail-audit` + `ponytail` (grounded terhadap `PRD.md`, `BSD.md`, `IPD.md`, `TDD.md`, `TEMUAN-EMAIL-DAN-HAK-AKSES.md`, dan `docs/superpowers/specs/2026-11-08-rencana-alur-pengajuan-review.md`)

What this repo does: Aplikasi web full-stack (React + Express + SQLite) untuk mengelola siklus pengajuan, persetujuan berjenjang (Atasan -> GM -> BoD Paralel), pencairan Payment Voucher (PV), dan realisasi uang muka pengadaan multi-cabang BLC.

---

## Must fix

### 1. Mass-assignment pada `updateDocument` memungkinkan Pemohon menyetujui dokumennya sendiri (`status: 'APPROVED'`)
- **What this is**: Fungsi pembaruan draf dokumen di repositori server ([`server/repository.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts#L449-L473)) yang dipanggil oleh endpoint `PUT /api/v1/documents/:id` ([`server/app.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/app.ts#L221-L234)).
- **Problem**: Pada [`server/repository.ts:449-457`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts#L449-L457), `safePatch` hanya membuang `id`, `docNumber`, `docType`, `createdAt`, dan `auditLog`, lalu menjalankan `Object.assign(doc, safePatch)`. Field sensitif siklus hidup seperti `status`, `currentStage`, `approvalSteps`, `ownerId`, `version`, `financeConfirmedAt`, `paymentStatus`, dan `paymentDetails` tidak dibuang. Akibatnya, `PEMOHON` yang memanggil `PUT /api/v1/documents/:id` pada dokumen `DRAFT` miliknya dengan payload `{"status": "APPROVED", "currentStage": "BOD"}` dapat langsung meloloskan dokumen ke status `APPROVED` tanpa persetujuan Atasan, Bu Ayu (GM), maupun Direksi (BoD).
- **Fix**: Buat daftar field sistem yang dilarang diubah melalui `updateDocument` (`status`, `currentStage`, `approvalSteps`, `ownerId`, `version`, `financeConfirmedAt`, `paymentStatus`, `paymentDetails`) dan buang juga pada `createDocument` agar input klien tidak pernah bisa menimpa state persetujuan.
- **If we skip it**: Pengguna dengan peran `PEMOHON` dapat mem-bypass seluruh rantai persetujuan 3 tahap dan langsung memasukkan dokumen ke antrean pencairan dana Keuangan.

### 2. Kebocoran informasi rekening bank melalui `auditLog` dan respons endpoint mutasi, serta bug kotak rekening kosong di UI
- **What this is**: Penyaringan visibilitas rekening bank berbasis peran di [`server/app.ts:45-71`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/app.ts#L45-L71), pencatatan pembayaran PV di [`server/repository.ts:997-1003`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts#L997-L1003), dan tampilan detail rekening di [`src/components/DocumentDetailModal.tsx:390-433`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/DocumentDetailModal.tsx#L390-L433).
- **Problem**: Sesuai [`TEMUAN-EMAIL-DAN-HAK-AKSES.md`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/TEMUAN-EMAIL-DAN-HAK-AKSES.md), detail rekening bank hanya boleh dilihat oleh Pemohon pemilik dokumen, `AYU` (GM), `BOD`, `ADMIN`, dan `KEUANGAN` (tidak boleh dilihat oleh `ATASAN` atau `PEMOHON` lain). Namun:
  1. `recordPvPayment` di [`server/repository.ts:1002`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts#L1002) menulis `Bank: ${details.sourceBank}, Ref: ${details.referenceNumber}` ke dalam `auditLog.comment`. Fungsi `visibleDocument()` tidak menyensor `auditLog`, sehingga `ATASAN` dan `PEMOHON` lain tetap dapat membaca nama/nomor rekening perusahaan di tab Approval History.
  2. `visibleDocument()` mengubah `beneficiaryBank` dan `reimbursementBank` menjadi objek bersenarai kosong `{ bankName: '', accountNumber: '', accountHolder: '' }`. Di [`src/components/DocumentDetailModal.tsx:419-433`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/DocumentDetailModal.tsx#L419-L433), pengecekan `if (doc.reimbursementBank)` bernilai `true` untuk objek kosong sehingga merender teks rusak `- (a/n )`.
- **Fix**: Simpan komentar umum di `auditLog` saat pelunasan PV (tanpa menyertakan `sourceBank` mentah, atau sanitasi di `visibleDocument`), ubah field bank opsional (`bankDetails`, `reimbursementBank`) menjadi `undefined` saat disensor, dan gunakan helper `hasVisibleBank(bank)` di `DocumentDetailModal.tsx`.
- **If we skip it**: Data rekening bocor ke peran yang tidak berwenang lewat riwayat audit, dan tampilan modal detail untuk `ATASAN` menampilkan kotak rekening kosong yang rusak.

### 3. Deadlock alur bisnis `RC` berstatus `DEFICIT` (Kekurangan Dana Uang Muka) antara pembuatan PV, pembayaran PV, dan konfirmasi Finance
- **What this is**: Alur penyelesaian Realisasi Uang Muka (`RC`) dengan hasil `DEFICIT` di [`server/repository.ts:868-886`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts#L868-L886), [`server/repository.ts:942-956`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts#L942-L956), [`server/repository.ts:1005-1019`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts#L1005-L1019), [`src/components/DocumentList.tsx:533-559`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/DocumentList.tsx#L533-L559), dan [`src/components/DocumentDetailModal.tsx:241-251`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/DocumentDetailModal.tsx#L241-L251).
- **Problem**: Pada `confirmRcSettlement` ([`server/repository.ts:948`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts#L948)), dokumen `RC` dengan `outcomeType === 'DEFICIT'` wajib memiliki `PV` selisih yang sudah berstatus `PAID` sebelum Finance dapat mengonfirmasi penyelesaian (`financeConfirmedAt`). Akan tetapi:
  1. Di [`src/components/DocumentList.tsx:533`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/DocumentList.tsx#L533) dan [`src/components/DocumentDetailModal.tsx:243`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/DocumentDetailModal.tsx#L243), kondisi tombol **Buat PV** mengecualikan `doc.docType !== 'RC'`. Akibatnya, Finance **tidak memiliki tombol di UI untuk menerbitkan PV selisih dari RC DEFICIT**.
  2. Ketika PV selisih dilunasi melalui `recordPvPayment` ([`server/repository.ts:1008`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts#L1008)), server mengubah `sourceDoc.status = 'PAID'`. Padahal di [`src/components/DocumentList.tsx:549`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/DocumentList.tsx#L549) dan [`src/components/DocumentDetailModal.tsx:248`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/DocumentDetailModal.tsx#L248), tombol **Selesaikan RC** hanya muncul jika `doc.status === 'APPROVED'`. Begitu PV selisih dibayar, status RC berubah jadi `PAID` (tanpa `financeConfirmedAt`) dan tombol **Selesaikan RC** langsung lenyap!
- **Fix**: (1) Izinkan tombol **Buat PV** muncul pada dokumen `RC` yang berstatus `APPROVED` dengan `outcomeType === 'DEFICIT'` (dan belum punya PV); (2) Izinkan tombol **Selesaikan RC** muncul ketika `(doc.status === 'APPROVED' || doc.status === 'PAID') && !doc.financeConfirmedAt` (serta otomatis tandai `financeConfirmedAt` saat PV selisih RC dilunasi atau biarkan Finance menekan tombol konfirmasi).
- **If we skip it**: Skenario `RC DEFICIT` tidak dapat diselesaikan dari antarmuka pengguna; uang muka induk (`AV`) akan tercatat belum selesai selamanya.

### 4. Status BoD paralel menggantung (`PENDING`) ketika salah satu anggota Direksi menolak (`REJECT`) dokumen
- **What this is**: Penanganan keputusan `REJECT` pada tahap `BOD` di [`server/repository.ts:618-654`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts#L618-L654).
- **Problem**: Saat dokumen masuk ke tahap `BOD`, baik `heryStatus` maupun `hashimotoStatus` diset ke `'PENDING'`. Jika Pak Hery menolak (`REJECT`), [`server/repository.ts:636`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts#L636) mengubah `heryStatus = 'REJECTED'`, mengembalikan `doc.status = 'DRAFT'` dan `doc.currentStage = 'PEMOHON'`, tetapi **`hashimotoStatus` dibiarkan tetap `'PENDING'`** (begitu pula sebaliknya jika Mr. Hashimoto yang menolak). Akibatnya, indikator progres di [`src/components/DocumentList.tsx:218-246`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/DocumentList.tsx#L218-L246) dan [`src/components/ApprovalExplorer.tsx:313-318`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/ApprovalExplorer.tsx#L313-L318) menampilkan titik kuning `PENDING` aktif pada dokumen yang sebenarnya sudah ditolak dan kembali ke draf.
- **Fix**: Saat `role === 'BOD_HERY'` melakukan `REJECT` dan `hashimotoStatus === 'PENDING'`, reset `hashimotoStatus = 'WAITING'` (dan sebaliknya saat `BOD_HASHIMOTO` melakukan `REJECT`).
- **If we skip it**: Tampilan status tahapan BoD pada daftar dokumen dan Approval Register menyesatkan pengguna setelah terjadi penolakan di tingkat Direksi.

### 5. Validasi server pada `submitDocument` belum menegakkan aturan kelengkapan wajib PR, PO, AV, dan RC
- **What this is**: Validasi kelayakan dokumen sebelum masuk ke rantai persetujuan di [`server/repository.ts:491-553`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts#L491-L553).
- **Problem**: Saat ini `submitDocument` di server hanya memvalidasi `stage1ApproverEmail` dan keberadaan lampiran `RECEIPT` untuk `RB`. Aturan bisnis wajib lainnya dari [`BSD.md`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/BSD.md) dan [`docs/superpowers/specs/2026-11-08-rencana-alur-pengajuan-review.md`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/docs/superpowers/specs/2026-11-08-rencana-alur-pengajuan-review.md) belum ditegakkan di server saat `POST /api/v1/documents/:id/submit`:
  - **PR**: `isIamRequired` tidak dihitung ulang secara otoritatif di server (`subtotalAmount >= 5_000_000`); jika `isIamRequired === true`, server belum memvalidasi keberadaan nomor IAM atau lampiran `IAM_MEMO`.
  - **PO**: Jika `parentPrId` diisi, server belum memvalidasi bahwa PR induk ada dan berstatus `APPROVED`; jika `paymentMethod === 'BANK_TRANSFER'`, server belum memvalidasi kelengkapan `bankDetails`.
  - **AV**: Server belum memvalidasi `activityEndDate` wajib terisi, kelengkapan `bankDetails` jika `disbursementMethod === 'BANK_TRANSFER'`, serta validitas `parentPoId` (jika diisi).
  - **RC**: Server belum memvalidasi aturan **1 AV : 1 RC** (mencegah pembuatan/pengajuan 2 RC untuk 1 AV yang sama), belum memvalidasi bahwa AV induk adalah milik pemohon dan memiliki PV berstatus `PAID`, belum menyinkronkan `avOriginalAmount` dari `netAmountToPay` PV induk, serta belum mewajibkan lampiran `REFUND_PROOF` untuk `SURPLUS` dan `reimbursementBank` lengkap untuk `DEFICIT` saat submit.
- **Fix**: Tambahkan validator domain otoritatif `validateDocumentBeforeSubmit(doc)` di [`server/repository.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts) dan hitung ulang field turunan (`isIamRequired`, `calculatePoTotal`, `calculateRcOutcome`) di server saat simpan/submit.
- **If we skip it**: Klien atau integrasi API dapat mengajukan dokumen tidak lengkap (termasuk RC ganda untuk satu AV atau PO Transfer tanpa rekening) ke antrean persetujuan manajemen.

---

## Should fix

### 6. Duplikasi penuh state machine bisnis di sisi klien (`src/store/document-store.ts`, `src/draft.ts`, `src/draft-store.ts`)
- **What this is**: Modul penyimpanan lokal berbasis `localStorage` di [`src/store/document-store.ts:196-493`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/store/document-store.ts#L196-L493), [`src/draft.ts:1-19`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/draft.ts#L1-L19), dan [`src/draft-store.ts:1-36`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/draft-store.ts#L1-L36).
- **Problem**: Aplikasi produksi di [`src/main.tsx:39`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/main.tsx#L39) hanya mengimpor satu fungsi pembantu `createEmptyDocument` dari `src/store/document-store.ts`. Seluruh fungsi mutasi lain di `src/store/document-store.ts` (`loadDocuments`, `saveDocuments`, `upsertDocument`, `submitDocument`, `approveDocument`, `rejectDocument`, `generatePvFromSource`, `recordPvPayment`) serta seluruh isi `src/draft.ts` dan `src/draft-store.ts` tidak pernah dipakai oleh aplikasi, dan berisi aturan bisnis versi lama yang sudah menyimpang dari [`server/repository.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts).
- **Fix**: Hapus fungsi mutasi `localStorage` yang mati dari `src/store/document-store.ts` (sisakan `createEmptyDocument` dan data sampel jika diperlukan test), serta hapus `src/draft.ts` dan `src/draft-store.ts` beserta test yatimnya.
- **If we skip it**: Dua sumber kebenaran (dual state machine) membuat pemeliharaan kode rawan salah sasaran dan membingungkan pengembang baru.

### 7. Koneksi SQLite dibuka-tutup pada setiap operasi dan `idempotencyCache` tumbuh tanpa batas
- **What this is**: Metode `loadState()` dan `saveState()` pada `EnterpriseRepository` di [`server/repository.ts:100-140`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts#L100-L140).
- **Problem**: Setiap kali `flush()` dipanggil (bahkan pada pembacaan idempotensi), `saveState()` membuat objek `new DatabaseSync(this.dbPath)` baru, menulis seluruh `this.state` sebagai satu blob JSON, lalu menutup koneksi. Selain itu, `this.state.idempotencyCache` ([`server/repository.ts:326`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts#L326)) tidak pernah menghapus entri yang sudah melewati `IDEMPOTENCY_TTL_MS` (24 jam), sehingga blob JSON di SQLite terus membesar.
- **Fix**: Simpan satu instance `DatabaseSync` dengan prepared statement selama umur `EnterpriseRepository`, dan bersihkan entri `idempotencyCache` yang sudah kedaluwarsa sebelum `saveState()`.
- **If we skip it**: Penurunan performa I/O seiring bertambahnya transaksi dan pembengkakan ukuran file SQLite karena riwayat idempotensi lama tidak pernah dibersihkan.

### 8. Pewarisan data antar-dokumen (`PR -> PO -> AV -> RC`) dan pilihan tarif pajak belum seragam
- **What this is**: Pilihan tarif pajak di [`src/components/forms/TaxFields.tsx:1-9`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/forms/TaxFields.tsx#L1-L9) serta pemetaan dokumen induk di [`src/main.tsx:338-351`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/main.tsx#L338-L351), [`src/components/forms/FormPO.tsx:43-57`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/forms/FormPO.tsx#L43-L57), dan [`src/components/forms/FormAV.tsx:42-62`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/forms/FormAV.tsx#L42-L62).
- **Problem**:
  1. `TaxFields.tsx` hanya menyediakan PPh `0%` dan `2% PPh 23`, sedangkan `FormPO.tsx` memiliki `0.5% PPh Final UMKM`, dan [`IPD.md`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/IPD.md) mencantumkan kebutuhan tarif PPh 21 (`2.5%`) dan PPh 4(2) Sewa (`10%`).
  2. Saat membuat `PO` dari `PR`, field `budgetType`, `iamNumber`, `ppnRate`, `pphRate`, `otherCosts`, `discount`, dan `stage1ApproverEmail` dari PR induk tidak ikut disalin.
  3. Saat memilih `PO` rujukan di `FormAV.tsx`, cabang, nama vendor, tujuan, dan estimasi nominal dari PO induk belum terisi otomatis, serta belum ada indikator selisih (`variance`) antara nominal AV dan PO induk.
- **Fix**: Seragamkan opsi tarif PPN & PPh di `TaxFields.tsx` dan `FormPO.tsx`, lengkapi auto-fill atribut dari dokumen induk pada `PR -> PO` dan `PO -> AV`, serta tampilkan info perbandingan nominal terhadap dokumen induk.
- **If we skip it**: Pemohon harus menginput ulang data yang sudah disetujui pada dokumen induk dan rawan terjadi salah ketik tarif pajak atau nominal.

### 9. Perhitungan `pendingForRoleCount` untuk `ATASAN` dan kolom ekspor CSV belum akurat untuk audit Finance
- **What this is**: Perhitungan metrik antrean di [`server/repository.ts:1058-1061`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts#L1058-L1061) dan pembuatan laporan CSV di [`src/components/ExportModal.tsx:16-28`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/ExportModal.tsx#L16-L28).
- **Problem**:
  1. Di [`server/repository.ts:1059`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts#L1059), `getDashboardMetrics` menghitung `pendingForRoleCount` untuk `ATASAN` pada seluruh dokumen tanpa memeriksa apakah `doc.stage1ApproverEmail` cocok dengan email atasan yang sedang login.
  2. Di [`src/components/ExportModal.tsx:16-26`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/components/ExportModal.tsx#L16-L26), ekspor CSV tidak menyertakan kolom **Nominal (IDR)** dan **Status Penyelesaian / Pembayaran**, sehingga tidak dapat langsung dijumlahkan di Excel oleh tim Keuangan.
- **Fix**: Filter `pendingForRoleCount` untuk `ATASAN` berdasarkan `user.email`, dan tambahkan kolom `Nominal (IDR)` serta `Status Penyelesaian` pada `ExportModal.tsx`.
- **If we skip it**: Indikator antrean tugas Atasan menghitung dokumen milik Atasan cabang/divisi lain, dan laporan CSV tidak memuat angka finansial.

---

## Nice to have

### 10. Dukungan rincian baris item (`LineItem[]`) pada dokumen PR dan PO
- **What this is**: Model data `PRDocument` dan `PODocument` di [`src/types/document.ts:81-133`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/types/document.ts#L81-L133).
- **Problem**: Sesuai [`BSD.md`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/BSD.md) (BR-01 & BR-02), PR dan PO idealnya memuat daftar item barang/jasa (`description`, `qty`, `unit`, `unitPrice`), namun saat ini form hanya menerima satu angka `subtotal`.
- **Fix**: Tambahkan dukungan opsional `items?: LineItem[]` pada `PRDocument` dan `PODocument` yang otomatis menjumlahkan `subtotal` ketika item diisi, tanpa merusak kompatibilitas dokumen yang hanya mengisi subtotal langsung.
- **If we skip it**: Penyetuju harus membuka lampiran PDF Quotation/IAM untuk melihat rincian kuantitas dan harga satuan barang.

---

Verdict: **ready after Must fix** (Temuan #1 s/d #5 perlu diselesaikan terlebih dahulu agar keamanan otorisasi, privasi rekening bank, dan alur penyelesaian RC Deficit berjalan utuh tanpa jalan buntu).

Lean:
- [`src/draft.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/draft.ts) dan [`src/draft-store.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/draft-store.ts) (beserta [`src/draft.test.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/draft.test.ts) dan [`src/draft-store.test.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/draft-store.test.ts)) adalah kode prototipe lama yang tidak lagi dipanggil oleh aplikasi dan aman dihapus.
- Fungsi mutasi `localStorage` di [`src/store/document-store.ts:196-493`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/store/document-store.ts#L196-L493) (`loadDocuments`, `saveDocuments`, `upsertDocument`, `submitDocument`, `approveDocument`, `rejectDocument`, `generatePvFromSource`, `recordPvPayment`) duplikat dengan `server/repository.ts` dan aman dipangkas setelah test diarahkan ke API/repository.

Not checked: Integrasi SSO Microsoft Entra ID OIDC, pengiriman email SMTP/webhook nyata pada worker outbox, dan kalender hari libur nasional tahunan (ketiganya masih menggunakan shortcut lokal sesuai `TDD.md` dan menunggu kredensial/ketetapan resmi tim IT & Finance).

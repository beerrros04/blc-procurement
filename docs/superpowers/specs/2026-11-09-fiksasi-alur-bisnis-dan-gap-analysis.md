# Analisis Fiksasi Alur Bisnis, Evolusi Email, & Gap / Plot Hole

**Tanggal:** 2026-11-09  
**Sumber Rujukan:**
1. [`Panduan_BLC_Procurement_v3_ID_4.pdf`](file:///C:/Users/BLC/Documents/IT/PROJECT/blc-procurement/src/docs/Panduan_BLC_Procurement_v3_ID_4.pdf) (Panduan Sistem Persetujuan Pembelian & Pembayaran Versi 3 — Oktober 2026)
2. Screenshot Rangkaian Email Outlook 26 Okt – 4 Nov 2026 ([`FireShot Capture 015`](file:///C:/Users/BLC/Documents/IT/PROJECT/blc-procurement/docs/media/Powerautomate/FireShot%20Capture%20015%20-%20Mail%20-%20Bernard%20Wilson%20-%20Outlook%20-%20[outlook.cloud.microsoft].png))
3. Screenshot Halaman & Formulir SharePoint ([`FireShot Capture 003` s/d `023`](file:///C:/Users/BLC/Documents/IT/PROJECT/blc-procurement/docs/media/Powerautomate/))
4. Dokumen Internal Repo ([`PRD.md`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/PRD.md), [`BSD.md`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/BSD.md), [`TEMUAN-EMAIL-DAN-HAK-AKSES.md`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/TEMUAN-EMAIL-DAN-HAK-AKSES.md), [`2026-11-08-rencana-alur-pengajuan-review.md`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/docs/superpowers/specs/2026-11-08-rencana-alur-pengajuan-review.md))

---

## 1. Kronologi Perubahan Alur Bisnis dari Screenshot Email (26 Okt – 4 Nov 2026)

Berdasarkan pembacaan utuh terhadap 17 rangkaian email antara **Ayu Martina (Finance)**, **Koji Hashimoto (BoD)**, dan **Sucik Bakdarwati (Operasional Sidoarjo)**:

| Tanggal Email | Pengirim | Keputusan & Perubahan Alur yang Diterapkan |
| :--- | :--- | :--- |
| **26 Okt 2026** | Ayu Martina | Peluncuran masa uji operasional (26 Okt) dan operasional penuh (1 Nov). Batas plafon sistem **Rp 50.000.000 per pengajuan (`Total`)**. |
| **28 Okt 2026 (Pagi)** | Ayu Martina & Koji Hashimoto | 1. Buku besar (`ApprovalRegister`) wajib menampilkan kolom **`Dibayarkan` (`Total - PPh`)** di samping kolom `Total` (`Subtotal + PPN + Biaya lain - Diskon`).<br>2. Staf Keuangan diberi akses penuh ke menu `ApprovalDocs`.<br>3. Kolom `InvoiceNo` dan `InvoiceDate` pada PV diubah menjadi **opsional**.<br>4. Lampiran PO/AV/RB tidak perlu diunduh-unggah ulang saat membuat PV; khusus PV atas PO, `Invoice_` wajib dilampirkan hanya jika belum ada di PO.<br>5. Kategori biaya PO (`CostCategory`) ditambah menjadi 3: **`Pembelian umum`**, **`Pembayaran rutin`**, dan **`Biaya mobilisasi`**. Untuk *Pembayaran rutin* dan *Biaya mobilisasi*, **PR, IAM, dan nomor kontrak tidak wajib** walaupun nilai sebelum pajak $\ge$ Rp 5.000.000, tetapi **wajib melampirkan `Invoice_`**. |
| **28 Okt 2026 (Sore)** | Ayu Martina & Koji Hashimoto | 1. Email ringkasan persetujuan akhir dikirim ke Keuangan untuk semua jenis dokumen (`PO`, `AV`, `RB`, `PV`).<br>2. `ApprovalDocs` menampilkan metadata lengkap (`Nomor`, `Judul`, `Tujuan`, `Cabang`, `Pemohon`, `Total`, `Status`) dan dapat dicari berdasarkan `Tujuan` (`Purpose`).<br>3. Setiap dokumen yang selesai disetujui menghasilkan dokumen ringkasan **`Persetujuan_[nomor].pdf`** berisi rincian nominal, rekening tujuan, rekening rencana BLC, dan riwayat persetujuan. |
| **29 Okt 2026** | Ayu Martina & Koji Hashimoto | Pada tabel `ApprovalRegister`, status kolom **`Pembayaran` (`Belum dibayar` / `Dibayar`) HANYA ditampilkan untuk baris `PV`**. Untuk `PO`, `AV`, dan `RB` yang sudah disetujui, kolom `Pembayaran` dikosongkan; pengecekan dokumen yang belum dibuatkan PV dilakukan lewat filter/menu **`Menunggu PV`**. |
| **30 Okt 2026** | Koji Hashimoto (*High Importance*) | Bukti pembayaran (kwitansi/struk) wajib **scan berwarna (*color scan*)**. Jika diunggah hitam-putih, penyetuju wajib melakukan *reject/return* ke pemohon. |
| **30–31 Okt 2026** | Ayu Martina & Koji Hashimoto | 1. Pada form **Catatan Pembayaran (`Payment_Records`)**, saat memilih nomor `PV`, sistem langsung menampilkan **nilai `Dibayarkan`, `Nama Bank`, `No. Rekening`, dan `Nama Pemilik Rekening`** dari PV tersebut di sebelah input `PaidAmount`. Jika `PaidAmount` tidak sama persis dengan nilai `Dibayarkan` PV, sistem menolak.<br>2. Tampilan **Ekspor Keuangan** di buku besar menyediakan kolom: `Nomor, Jenis, Cabang, Judul, Tujuan, Subtotal, PPN, PPh, Dibayarkan, Bank, No. rekening, Nama rekening, Jatuh tempo`.<br>3. Setiap PV yang sudah lunas (`Dibayar`) otomatis dibuatkan **Paket Audit (`Audit -> [nomor PV]`)** yang menggabungkan `PR (termasuk IAM) + PO/AV/RB (termasuk BAST) + PV + Bukti Transfer + PDF Persetujuan` (hanya dapat diakses oleh Keuangan, Bu Ayu, Pak Hery, dan BoD). |
| **2–4 Nov 2026** | Ayu Martina & Koji Hashimoto | Peluncuran modul baru **`RC` (`Realisasi CA / 仮払精算`)** pada Panduan v4:<br>1. Pemohon memilih nomor **`AV` miliknya sendiri yang PV-nya sudah dibayar** (`CADoc`). Nilai `Total Cash Advance` diambil otomatis dari **nilai PV yang sudah dibayarkan** untuk AV tersebut (bukan nilai pengajuan awal AV jika berbeda). Jika PV untuk AV belum dibayar, pengajuan RC ditolak otomatis dengan alasan `"CA belum dibayar"`.<br>2. Satu AV hanya untuk satu RC (**1 AV : 1 RC**).<br>3. `ActivityEndDate` (Tanggal selesai kegiatan) menjadi **wajib** pada form AV. Batas waktu pengajuan RC adalah **H+2 hari kerja** setelah `ActivityEndDate`.<br>4. Tiga pilihan `ResultType`:<br>   - **`Return to Caready` (Surplus)**: Biaya < CA. Wajib lampirkan `Return_` (bukti transfer pengembalian) + `Receipt_`/`Invoice_`. Setelah disetujui BoD, Keuangan melakukan **konfirmasi dana pengembalian diterima**.<br>   - **`Sama dengan CA` (Exact)**: Biaya = CA (jika `SubtotalAmount` dikosongkan, otomatis diisi sama dengan nilai CA). Wajib lampirkan `Receipt_`/`Invoice_`. Setelah disetujui BoD, Keuangan melakukan **konfirmasi angka realisasi sesuai**.<br>   - **`Return to Employee` (Deficit)**: Biaya > CA. Pemohon wajib mengisi rekening karyawan (`BankName`, `BankAccountNo`, `BankAccountName`). Setelah disetujui BoD, **Keuangan langsung mengajukan PV selisih** dengan memilih dokumen RC sebagai `ParentDoc`.<br>5. **Blokir Realisasi via PO**: Pengajuan PO yang memuat kata `"realisasi"` pada `Title` atau `Purpose` ditolak otomatis oleh sistem. |

---

## 2. Daftar Gap & Plot Hole Antara Panduan v3/v4, Email, dan Aplikasi Saat Ini

Berikut adalah **8 Plot Hole & Gap** yang ditemukan saat mencocokkan dokumen PDF v3, rangkaian email s/d 4 November, dan kode aplikasi saat ini:

### Plot Hole 1: Siklus Hidup `PV` — Dokumen Berpersetujuan (`Ayu -> Hery -> Hashimoto`) vs Terbit Instan (`APPROVED`)
- **Di PDF v3 (Hal. 1 & 5) & Email:** `PV` diajukan oleh Staf Keuangan dengan mengisi `ParentDoc` (`PO` / `AV` / `RB` / `RC Deficit`), `PaymentDueDate` (wajib, untuk Jadwal Pembayaran), `PlannedSourceAccount` (wajib, rekening BLC yang direncanakan membayar), `InvoiceNo` & `InvoiceDate` (opsional), serta nilai pembayaran (mendukung pembayaran penuh atau sebagian/termin atas PO). Setelah diajukan, **PV harus melewati persetujuan `Ayu -> Hery -> Hashimoto`** sebelum bisa dicatat pembayarannya di `Catatan Pembayaran`.
- **Di Kode Saat Ini (`server/repository.ts:800-940`):** Klik tombol `Buat PV` langsung menerbitkan PV berstatus `APPROVED` tanpa form input (`PaymentDueDate`, `PlannedSourceAccount`, `InvoiceNo`), tanpa dukungan pembayaran bertahap PO, dan tanpa persetujuan `Ayu -> Hery -> Hashimoto`.

### Plot Hole 2: Modul `GR` (Laporan Penerimaan Barang/Jasa) Belum Ada di Aplikasi
- **Di PDF v3 (Hal. 1, 5, 7–8) & Screenshot Beranda (`FireShot Capture 003`):** Terdapat modul ke-7 yaitu **`GR` (`Laporan penerimaan barang/jasa`)** untuk melaporkan barang (`Photo_`) atau jasa (`BAST_`) yang diterima atas suatu `PO` (`Kondisi: Baik / Kurang / Rusak`). Laporan GR ini ditampilkan kepada penyetuju saat Keuangan mengajukan PV atas PO tersebut, dan masuk ke bundel **Audit PV**.
- **Di Kode Saat Ini:** Belum ada tipe dokumen `GR` maupun form pelaporan penerimaan barang/jasa.

### Plot Hole 3: Aturan PO terhadap PR Induk (`1 PR : 1 PO`, Plafon Nilai PR, & Larangan Kata `"Realisasi"`)
- **Di PDF v3 (Hal. 2 & 4) & Email 28 Okt / 4 Nov:**
  1. Jika kategori PO adalah **Pembelian Umum (`STANDARD`)** dan nilai sebelum pajak $\ge$ Rp 5.000.000, maka **`ParentPRID` wajib diisi** (mengacu pada PR yang sudah `APPROVED`).
  2. **Satu PR hanya boleh dipakai untuk satu PO** (`1 PR : 1 PO`).
  3. **Nilai PO sebelum pajak tidak boleh melebihi nilai PR induk**, serta cabang, jenis anggaran, dan nomor IAM harus sama dengan PR induk.
  4. Jika kategori PO adalah **Pembayaran Rutin (`ROUTINE`)** atau **Biaya Mobilisasi (`MOBILIZATION`)**, maka PR, IAM, dan nomor kontrak tidak wajib meskipun $\ge$ Rp 5.000.000, namun **lampiran `Invoice_` wajib ada**.
  5. PO yang mengandung kata **`"realisasi"`** pada judul atau tujuan wajib **ditolak otomatis** dan diarahkan menggunakan menu `RC`.
- **Di Kode Saat Ini:** Belum ada validasi server untuk aturan (1) s/d (5) di atas.

### Plot Hole 4: Batas Plafon Sistem Rp 50.000.000 per Pengajuan (`Total`)
- **Di PDF v3 (Hal. 1, 2, 6) & Beranda (`FireShot Capture 003`):** Sistem membatasi nilai `Total` maksimal **Rp 50.000.000 per pengajuan** (pengajuan di atas Rp 50.000.000 wajib ditolak oleh validasi sistem karena masih menggunakan prosedur manual di luar sistem).
- **Di Kode Saat Ini:** Belum ada validasi batas Rp 50.000.000 (bahkan data contoh `PR-2026-0001` bernilai Rp 65.000.000).

### Plot Hole 5: Mekanisme Penolakan Penyetuju (`REJECT`) — Edit Dokumen yang Sama vs Dokumen Baru + `PreviousRegisterID`
- **Di PDF v3 (Hal. 2–3) & Screenshot SharePoint (`FireShot Capture 012, 016–023`):**
  - Jika gagal validasi otomatis saat submit (`PERLU DIPERBAIKI`): pemohon memperbaiki draf yang sama.
  - Jika **ditolak oleh penyetuju (`DITOLAK / 差し戻し`)**: dokumen lama tetap terkunci dengan status **`REJECTED` (`Ditolak`)** di buku besar sebagai rekam jejak historis, dan pemohon membuat pengajuan baru yang menautkan **`previousRegisterId`** ke nomor/ID dokumen lama yang ditolak.
- **Di Dokumen Sebelumnya & Kode Saat Ini:** Penolakan penyetuju mengubah dokumen yang sama kembali ke `status: 'DRAFT'` tanpa membuat dokumen berstatus `REJECTED` dan tanpa field `previousRegisterId`.

### Plot Hole 6: Konfirmasi Keuangan pada `RC` (`Return to Employee` / Deficit vs `Return to Caready` & `Sama dengan CA`)
- **Di Email Koji Hashimoto (3 Nov 2026, `mail_slice_05.png`):**
  - Untuk `Return to Caready` (Surplus) dan `Sama dengan CA` (Exact): setelah disetujui penuh oleh BoD, Keuangan menekan tombol **Konfirmasi Keuangan** (`Approve` penerimaan dana kembali / kesesuaian angka).
  - Untuk `Return to Employee` (Deficit): **tidak memerlukan langkah konfirmasi terpisah**; Keuangan langsung menerbitkan **PV selisih** dengan memilih dokumen RC sebagai `ParentDoc`, dan RC otomatis selesai begitu PV selisih tersebut dicatat lunas (`PAID`).
- **Di Kode Saat Ini (`server/repository.ts:948`):** Mengharuskan keduanya (PV selisih harus dibayar dulu, lalu Finance harus klik tombol konfirmasi RC lagi), namun tombol UI-nya justru mengalami *deadlock* (Temuan Ponytail `#3`).

### Plot Hole 7: Rute Persetujuan Tahap 2 (Bu Ayu GM vs Bu Ira HR) & Tahap 3/4 (Berurutan vs Paralel)
- **Di Email (28 Okt & 4 Nov):** Sempat disebutkan rute RB dan RC melalui `Atasan -> Bu Ira (HR) -> Pak Hery -> Hashimoto` serta rute berurutan `Tahap 1 -> Tahap 2 -> Tahap 3 -> Tahap 4`.
- **Di [`TEMUAN-EMAIL-DAN-HAK-AKSES.md`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/TEMUAN-EMAIL-DAN-HAK-AKSES.md):** Telah dikoreksi bahwa **HR tidak dilibatkan** dan seluruh pengajuan menggunakan rute **`Atasan (Head) -> GM (Bu Ayu) -> Direksi (Pak Hery & Hashimoto secara paralel)`**.
- **Aturan Auto-Skip (PDF Hal. 2):** Di PDF Hal. 2 tertulis *"Bila pemohon juga tercantum sebagai penyetuju pada rute, tahap tersebut dilewati otomatis"*, sedangkan di kode saat ini berlaku larangan `SELF_APPROVAL_FORBIDDEN`.

### Plot Hole 8: Tampilan Buku Besar (`ApprovalRegister`), Ekspor Keuangan 12 Kolom, & Paket Audit PV
- **Di Email (28–31 Okt) & Screenshot `FireShot Capture 012`:**
  1. Tabel `ApprovalRegister` wajib menampilkan dua kolom nominal berdampingan: **`Total`** (`Subtotal + PPN + Biaya lain - Diskon`) dan **`Dibayarkan`** (`Total - PPh`). (Sudah ada di `ApprovalExplorer.tsx`, namun kolom `Dibayarkan` saat ini menampilkan `0` jika belum lunas, padahal di `FireShot Capture 012` kolom **`Dibayarkan / 支払額` selalu menampilkan nilai net `Total - PPh` yang akan/harus dibayarkan**, sedangkan status lunasnya ditunjukkan oleh kolom `Pembayaran`!).
  2. Kolom **`Pembayaran`** (`Belum dibayar` / `Dibayar`) di `ApprovalRegister` hanya muncul pada dokumen **`PV`** (dikosongkan untuk PR/PO/AV/RB/RC).
  3. Filter cepat Buku Besar mencakup **`Menunggu PV`** (PO/AV/RB/RC Deficit yang sudah `APPROVED` tapi belum dibuatkan PV), **`Jadwal Pembayaran`** (PV urut `PaymentDueDate` + `PlannedSourceAccount`), **`AV Tanpa PO`**, dan **`CA Belum Direalisasikan`**.
  4. **Ekspor Keuangan** membutuhkan 13 kolom spesifik: `Nomor, Jenis, Cabang, Judul, Tujuan, Subtotal, PPN, PPh, Dibayarkan, Bank, No. rekening, Nama rekening, Jatuh tempo`.
  5. **Paket Audit PV** untuk PV yang sudah `PAID` menampilkan gabungan seluruh dokumen berantai (`PR -> PO/AV/RB/RC -> GR/BAST -> PV -> Bukti Transfer -> Ringkasan Persetujuan`) khusus untuk Keuangan, Bu Ayu, Pak Hery, dan Mr. Hashimoto.

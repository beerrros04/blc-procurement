# BLC Procurement Lifecycle Management System (BLC CAREADY)

**Status:** Prototipe lokal untuk demonstrasi dan pengujian.  
Aplikasi menggunakan akun demo dan backend lokal untuk uji coba. Dokumen disimpan dalam SQLite lokal dan lampiran pada filesystem server. Login Microsoft 365 dan SharePoint belum terhubung; jangan gunakan untuk data atau transaksi nyata.

---

## 1. Ringkasan Eksekutif & Brief Proyek Saat Ini

Sistem BLC Procurement menangani siklus hidup lengkap 6 jenis dokumen pengadaan dari inisiasi draf, otorisasi multi-tahap (Atasan → Bu Ayu / Finance → BoD Hery & Hashimoto), hingga pencairan dan pembayaran Payment Voucher:

1. **Purchase Request (PR):** Permintaan pengadaan barang/jasa cabang/pusat dengan validasi ambang Memo IAM wajib (≥ Rp 5.000.000).
2. **Purchase Order (PO):** Surat pesanan rekanan vendor terintegrasi dengan nomor PR asal, perincian rekening bank vendor, PPN 11%, dan diskon.
3. **Cash Advance (AV):** Pengajuan uang muka operasional cabang dan tim lapangan.
4. **Reimbursement (RB):** Penggantian dana talangan operasional karyawan.
5. **Realization Cash Advance (RC):** Pertanggungjawaban dana uang muka (AV) dengan penghitungan otomatis surplus (setor balik ke kas) atau defisit (pembayaran kompensasi).
6. **Payment Voucher (PV):** Pencairan dana pembayaran resmi oleh tim Keuangan lengkap dengan pencatatan nomor referensi bank dan metode pembayaran.

---

## 2. Arsitektur Desain & Standar Antarmuka

Antarmuka dibangun dengan pendekatan **Anti-AI-Slop & Human-Centered Professional Polish**:
- **Design System Inspiration:** Menggabungkan struktur tata letak dashboard arsitektural *Spike Next.js Pro* dengan referensi UI Kit *NEXGEN Absensi System* (`docs/media/UI_UX SISTEM ABSENSI NEXGEN/`).
- **Color Balance (Aturan 60-30-10):**
  - **60% Surface Netral:** Background canvas `#F0F5F9`, card surface `#FFFFFF` beresolusi tinggi dengan sudut 18px–20px dan border halus `rgba(226, 232, 240, 0.9)`.
  - **30% Struktural & Kontras:** Slate Navy gelap `#111C2D` untuk teks utama, `#4A5568` untuk deskripsi, dan `#F8FAFD` untuk panel aksi/footer.
  - **10% Corporate Red Accent:** BLC Corporate Red `#E51937` (turunan logo BLC Caready `docs/media/logo/logo_hd_transparent.png`) untuk primary CTA, highlight metrik prioritas, indikator tahap aktif, dan badge aksen.
- **Centered Popup Modal Cards:**
  - Seluruh formulir inisiasi, pengubahan dokumen, eksekusi pembayaran PV, dan dialog rincian dokumen ditampilkan sebagai kartu popup mengambang di tengah layar (*centered popup card*).
  - Latar belakang menggunakan overlay darkened backdrop blur (`rgba(15, 23, 42, 0.62)` dengan `backdrop-filter: blur(8px)`).
  - Header dan footer aksi (*fixed sticky*), isi form scrollable halus dengan sleek custom scrollbar, animasi masuk *modalScaleUp*, dan dismissibility saat klik di luar kartu (backdrop click) atau Escape.
- **Tipografi:** Keluarga huruf Lato (Regular, Medium, Semibold, Bold) terstandarisasi dari H1 hingga caption.
- **Ikonografi & Emotikon:** 100% menggunakan pustaka vektor Lucide React murni tanpa emoji kartun slop.

---

## 3. Fitur Utama Aplikasi

- **Akun demo per peran:** Pilih akun contoh pada halaman masuk untuk mencoba tampilan masing-masing peran. Ini bukan autentikasi atau otorisasi produksi.
- **Bento Hero & Analytics Grid:** Kartu metrik KPI ringkas dengan visualisasi total pengeluaran aktif, persentase kelulusan SLA, filter status instan, dan quick draft action.
- **Interactive Multi-Stage Approval Stepper:** Pelacak visual 3 tahap persetujuan (Atasan → Bu Ayu → BoD Hery & Hashimoto) dengan indikator dokumen di atas Rp 50 Juta (aturan persetujuan BoD paralel/sekuensial).
- **Audit Log Trail:** Rekaman kronologis setiap aksi (Dibuat, Diajukan, Disetujui, Ditolak dengan alasan revisi, Dibayarkan) tersimpan transparan per dokumen.
- **Ekspor:** Unduh CSV atau buka dialog cetak browser. Ekspor XLSX belum tersedia.
- **FigCraft Native Asset:** Berkas desain native `blc_procurement_design_system.figcraft` dan screenshot preview di `docs/figcraft_previews/` untuk sinkronisasi tim desain.

---

## 4. Cara Menjalankan & Setup Setelah Clone

### Prasyarat
- Node.js dengan dukungan native `node:sqlite` (versi 22.13 atau lebih baru) dan npm.

### Quick Start (Setup Cepat Setelah Download / Clone)
```bash
# 1. Masuk ke folder proyek
cd blc-procurement

# 2. Pasang semua dependensi
npm install

# 3. (Opsional) Salin template environment jika ingin custom port
cp .env.example .env

# 4. Jalankan Backend API Server (Terminal 1)
npm run server
# Server aktif di http://127.0.0.1:3002 (database SQLite & folder uploads otomatis dibuat di .data/)

# 5. Jalankan Frontend Vite (Terminal 2)
npm run dev
# Buka aplikasi di http://127.0.0.1:5173
```

Aplikasi menggunakan akun demo yang tersedia langsung pada menu login switcher. API lokal menggunakan `http://127.0.0.1:3002`; database berada di `.data/blc-local.sqlite` dan lampiran di `.data/uploads`. Database dan direktori penyimpanan otomatis diinisialisasi saat pertama kali backend dijalankan.

### Menjalankan Uji Coba Unit (Vitest)
```bash
npm test
```
Perintah ini menjalankan tes yang tersedia untuk frontend dan server prototipe.

### Memeriksa TypeScript & Production Build
```bash
npm run build
```
Perintah ini memeriksa TypeScript dan membuat bundle Vite di folder `dist/`; build yang lulus tidak berarti integrasi produksi telah siap.

---

## 5. Dokumentasi Terkait

- [design.md](design.md): Spesifikasi lengkap sistem desain BLC Procurement × NEXGEN & palet BLC Red.
- [PRD.md](PRD.md): Product Requirements Document.
- [BSD.md](BSD.md): Business & System Design (proses bisnis, batas otorisasi, dan matriks keputusan).
- [TDD.md](TDD.md): Technical Design Document (arsitektur data dan komponen).
- [DBD.md](DBD.md): Database Design (skema entitas dokumen dan audit trail).
- [TEMUAN-EMAIL-DAN-HAK-AKSES.md](TEMUAN-EMAIL-DAN-HAK-AKSES.md): Bukti riwayat email operasional BLC Caready dan pemetaan kewenangan persetujuan.

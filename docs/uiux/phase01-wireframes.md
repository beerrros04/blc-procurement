# Phase 01  /  Wireframes untuk review

Sketsa menunjukkan penempatan dan interaksi, bukan visual final. Aksi mengikuti hak/state server. Untuk semua layar: loading dengan teks/skeleton; empty membedakan data dan filter; error menawarkan retry dan menjaga input; success menunjukkan status terbaru. Komponen shadcn adalah referensi, bukan instalasi.

## 1. Shell
```text
Desktop: [Logo          ] | Judul                         [Akun]
         [Dashboard     ] | Konten halaman
         [Dokumen       ] |
         [Persetujuan   ] |
         [Keuangan      ] |
         [Admin*        ] |
Mobile:  [Menu] Judul [Akun]  /  menu Sheet; konten satu kolom
```
Aksi utama navigasi, sekunder akun/keluar; admin* usulan. Sidebar/Sheet: tombol menu membuka navigasi berlabel dengan tujuan aktif, tutup atau Escape mengembalikan fokus ke pemicu. Sesi error menjelaskan pemulihan.

## 2. Dashboard
```text
Desktop: Beranda [Buka dokumen]
         [Menunggu tindakan] [Draft] [Dalam proses] [Selesai]
         Tugas relevan: nomor | nilai | tahap | [Detail]   Aktivitas
Mobile:  Judul  /  jumlah prioritas  /  daftar tugas  /  aktivitas
```
Aksi utama buka tugas, sekunder register. Angka adalah contoh bersyarat, bukan jaminan sumber data; dahulukan tugas yang tersedia bagi pengguna. Kosong berarti tidak ada tugas. Table/Badge/Button.

## 3. Daftar dokumen
```text
Desktop: Dokumen [+ Buat]
         [Cari] [Jenis] [Cabang] [Status] [Reset]
         Nomor/judul | jenis | cabang | total | status/tahap | [Detail]
Mobile:  [Cari] [Filter  /  jumlah] [+ Buat]
         nomor  /  status / judul / cabang  /  total / [Detail]
```
Buat hanya bila berhak; filter dan ekspor sekunder. Tahap dan nama panjang membungkus dengan tinggi baris fleksibel; isi lengkap dapat dibuka dengan keyboard tanpa hover. Table/Input/Select/Sheet; kosong akibat filter menawarkan reset.

## 4. Detail dokumen
```text
Desktop: [Kembali: Dokumen] Nomor  /  judul                    Status
         Rincian & nominal             | Tahap aktif / berikutnya
         Lampiran dan dokumen terkait  | Riwayat
         [Aksi eligible] [Tutup]
Mobile:  Header  /  status  /  ringkasan  /  tahap  /  rincian  /  lampiran  /  riwayat
```
Primary sesuai state/hak; kembali dan lampiran sekunder. Sheet/Dialog; jangan membuat event.

## 5. Form dokumen
```text
Desktop: [Kembali: Draft] PR  /  nomor/status                 [Simpan draft]
         Identitas & tujuan             | Ringkasan nominal
         Cabang  /  anggaran  /  tanggal    | subtotal / pajak / total
         Rincian, lampiran, approver    | syarat belum lengkap
         [Batal] [Simpan draft] [Ajukan bila eligible]
Mobile:  Header  /  identitas  /  rincian  /  nominal  /  lampiran  /  approver  /  aksi
```
Field aktual berbeda menurut jenis; error dekat field. Target desain: simpan input yang belum terkirim saat error; konflik versi menjelaskan perubahan, menjaga input lokal, menampilkan data terkini dan meminta pengguna meninjau sebelum mengirim ulang secara sengaja. Ini belum terbukti pada runtime. Field/Input/Select/Textarea; tidak mengasumsikan autosave.

## 6. Workspace persetujuan
```text
Desktop: Persetujuan [Cari] [Tahap/status] [Filter]
         nomor | pemohon | nilai | tahap aktif | [Tinjau]
Mobile:  Cari/filter  /  identitas, nilai, tahap  /  [Tinjau]
```
Tinjau primary, riwayat sekunder. Data sesuai assignment; pengelompokan ini usulan, bukan endpoint baru. Table/Badge/Sheet.

## 7. Detail persetujuan
```text
Desktop: Nomor  /  status  /  pemohon              [Kembali]
         Ringkasan & lampiran | Tahap aktif + penugasan
         Riwayat              | Keputusan sebelumnya
         [Tolak] [Setujui]  /  konfirmasi/catatan sesuai aturan
Mobile:  Header  /  tahap  /  ringkasan  /  lampiran  /  riwayat  /  aksi
```
Keputusan eligible primary; warna bukan satu-satunya pembeda. Dialog konfirmasi, validasi server, data aktual saat stage engine tidak aktif.

## 8. Keuangan
```text
Desktop: Keuangan [Menunggu PV] [PV/pembayaran] [RC sesuai kondisi]
         [Cari] [Filter]   nomor | sumber | nilai | status | aksi
         Sumber eligible  /  [Buat PV]; PV approved  /  [Catat pembayaran]
         RC eligible  /  [Konfirmasi Finance] atau tindak lanjut PV defisit
Mobile:  Tab  /  filter  /  baris  /  detail & aksi
```
Primary sesuai kelayakan; detail/riwayat sekunder. RC non-defisit eligible dapat memiliki aksi konfirmasi Finance; RC defisit mengikuti kelayakan PV menurut server. PV memperlihatkan sumber dan nominal; pembayaran memperlihatkan penerima dan jumlah sebelum input. Tabs/Table/Dialog/Field.

## 9. Administrasi
```text
Desktop: Administrasi* | konfigurasi tersedia | detail/aksi
Mobile:  Administrasi*  /  daftar  /  detail penuh
```
*Konseptual; halaman existing belum dibuktikan. Aksi dan konfirmasi tergantung endpoint dan hak; tidak menampilkan fitur DB-02 sampai DB-06. Table/Dialog.

Status gunakan Badge + teks; detail/konfirmasi gunakan Dialog/Sheet dengan fokus terkelola. Usulan belum diuji sebagai UI.
## Referensi dan batas
- [shadcn/ui](https://ui.shadcn.com/), [Dashboard Blocks](https://ui.shadcn.com/blocks/dashboard) dan [Sidebar](https://ui.shadcn.com/docs/components/sidebar): komponen dan shell yang diadaptasi untuk pengadaan, bukan disalin mentah.
- [Radix](https://www.radix-ui.com/primitives/docs/components/dialog): fokus, keyboard dan dialog sebagai target verifikasi.
- [Taste](https://www.tasteskill.dev/docs): satu sistem, hierarki dan ritme; aturan landing page tidak dipaksakan pada aplikasi operasional.
- [Impeccable Operate](https://raw.githubusercontent.com/pbakaus/impeccable/main/skill/reference/mode-operate.md): kejelasan tugas dan pola yang familier; evaluasi manual terbatas, bukan critique lengkap.
- Proyek: `docs/redesign/00-workflow-mapping.md`, `00-visual-coverage-matrix.md`, `hotfix-br-app-001-hf02d.md`, `docs/database/db01-completion-report.md`, dan source saat ini. Panduan v3 asli tidak ditemukan di checkout; ringkasan v3 bersifat sekunder dan perlu dicocokkan.

**Gate:** untuk review; tidak mengaktifkan stage engine, mengubah business logic/database, atau mengotorisasi DB-02 sampai DB-06.

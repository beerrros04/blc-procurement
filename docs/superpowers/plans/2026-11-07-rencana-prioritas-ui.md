# Rencana review: perapian UI dan pemeriksaan alur BLC

**Status:** draf untuk ditinjau pengguna; belum disetujui untuk implementasi.  
**Prioritas:** UI lebih dahulu, sambil memeriksa seluruh alur bisnis tanpa mengubah aturannya secara sepihak.  
**Sumber:** kode workspace saat ini, `PRD.md`, `BSD.md`, `TEMUAN-EMAIL-DAN-HAK-AKSES.md`, dan Capture 015 (email 26 Oktober–4 November 2026).

## Tujuan dan batas pekerjaan

Pertahankan identitas BLC dan struktur aplikasi yang sudah ada. Rapikan tata letak, hierarki informasi, istilah, serta kejelasan tindakan di halaman masuk, beranda, daftar dokumen, detail/persetujuan, dan formulir. Kerjakan tiap bagian menggunakan komponen yang ada; jangan mengganti keseluruhan desain.

Hasilnya adalah prototipe yang lebih mudah dipahami oleh pemohon, pemeriksa, penyetuju, dan Keuangan. Penggunaan bersama dengan akun Microsoft 365, penyimpanan organisasi, serta keamanan dan integrasi produksi memerlukan tahap tersendiri. Pada tahap UI, tampilkan fungsi yang ada secara jujur dan hindari kesan bahwa fitur yang belum tersambung sudah berfungsi.

## Keputusan alur dari pengguna

- Untuk RB dan RC, **HR memeriksa, bukan menyetujui**. Pemeriksaan berjalan paralel dan tidak menahan persetujuan. Waktu mulai pemeriksaan serta akibatnya terhadap langkah selain persetujuan masih perlu diperjelas.
- Ayu mempunyai peran penyetuju tingkat 2 dan peran Keuangan. Kewenangan untuk mengonfirmasi transaksi yang telah ia setujui sendiri belum diputuskan.
- Untuk **PR, PO, AV, RB dan RC**, urutan persetujuan yang sama telah dikonfirmasi: **Atasan → Ayu → Hery dan Hashimoto**. Kedua penyetuju terakhir sama-sama diperlukan dan dapat bertindak secara paralel.
- **PV mengikuti persetujuan dokumen induk**; PV tidak memerlukan persetujuan terpisah sebelum pembayaran dicatat.
- Status pembayaran ditampilkan pada **PV dan dokumen induk**, sesuai pilihan pengguna terbaru. Tampilan harus membedakan kondisi menunggu PV, menunggu pembayaran dan sudah dibayar sesuai data yang tersedia.
- Laporan Penerimaan (GR) tercantum dalam email lama, tetapi pengguna belum memutuskan apakah GR masuk cakupan pengembangan.
- Akun Microsoft 365 dipilih untuk penggunaan bersama di kemudian hari. Akun yang ada di prototipe adalah akun simulasi, bukan masuk Microsoft 365.

Catatan lama yang mengatakan HR tidak terlibat dalam persetujuan tidak boleh dibaca sebagai HR tidak punya tugas sama sekali. `PRD.md`, `BSD.md`, dan `TEMUAN-EMAIL-DAN-HAK-AKSES.md` masih memuat status keputusan yang berbeda atau belum lengkap; keputusan di atas menjadi acuan untuk review rencana ini. Tugas pemeriksaan HR belum terlihat sebagai peran terpisah dalam tipe data prototipe saat ini. Jangan menampilkan hasil pemeriksaan seolah sudah terlaksana sebelum ada data dan fungsi yang mendukungnya.

## Pemeriksaan seluruh alur bisnis

Pemeriksaan berikut membedakan **perilaku kode**, **bukti email lama**, dan **keputusan pengguna untuk rancangan baru**. Ini bukan hasil uji proses operasional SharePoint yang sedang berjalan. Bila ketentuan tidak jelas, tanyakan kepada pemilik proses sebelum mengubah logika.

| Jenis | Kondisi dan perhatian untuk ditinjau |
| --- | --- |
| **PR — permintaan** | Formulir memiliki nilai estimasi dan penanda Memo IAM mulai Rp5 juta. Frontend menyimpan metadata nama/ukuran lampiran dan tidak memverifikasi berkas IAM ketika mengajukan; server prototipe memiliki validasi terpisah. Konfirmasi aturan batas dan lampiran sebelum menyatukannya. |
| **PO — pesanan** | PO dapat memilih PR yang disetujui; formulir menerapkan syarat PR pada kategori dan nominal tertentu serta menghitung pajak. Tinjau pengecualian kategori, dasar nominal, pajak, invoice dan lampiran dengan Keuangan. |
| **AV — uang muka** | AV dibuat dengan nominal dan cara pencairan, lalu dapat menghasilkan PV setelah disetujui. Tinjau kebutuhan penerima, bukti, dan hubungan AV–PV sebelum menganggapnya dapat dipakai bersama. |
| **RB — penggantian biaya** | Formulir mencatat nilai, rekening dan jumlah bukti; file yang dipilih pada frontend saat ini hanya dicatat metadatanya. Tambahkan pemeriksaan HR sebagai kebutuhan yang sudah dikonfirmasi tanpa menjadikannya persetujuan atau penahan persetujuan. |
| **RC — realisasi uang muka** | Formulir memilih AV berstatus dibayar dan menghitung sisa/kurang/sama. Saat ini nilai awal diambil dari nominal AV, sedangkan email 4 November menyebut nilai PV yang benar-benar dibayar; kepemilikan AV juga belum disaring di frontend. Tanggal selesai diisi pada RC dan perhitungannya menambah dua hari kalender, sedangkan email menempatkan tanggal pada AV dan menyebut dua hari kerja. Verifikasi kebijakan kalender dan perbaiki pada tahap alur setelah review. |
| **PV — pembayaran** | Prototipe membuat PV berstatus disetujui dari induk yang disetujui dan mencatat status bayar secara terpisah; konsep tanpa persetujuan PV terpisah telah dikonfirmasi pengguna. Email lama meminta kolom pembayaran hanya untuk PV, tetapi pilihan terbaru pengguna adalah menampilkannya juga pada induk. Tetap verifikasi asal nominal, rekening, bukti, ketepatan status dan penelusuran induk → PV. |
| **GR dan catatan pembayaran** | Email peluncuran juga menyebut laporan penerimaan (GR) dan catatan pembayaran. Prototipe mempunyai pencatatan pembayaran PV tetapi tidak memiliki jenis dokumen GR; pengguna belum memastikan cakupan GR. |

Hal lintas alur yang tetap perlu ditinjau: siapa yang boleh melihat atau bertindak pada dokumen dan lampiran; penolakan, revisi, dan dua keputusan paralel; penggunaan akun yang sama untuk lebih dari satu fungsi; notifikasi, riwayat, ekspor, dan bukti. Email juga meminta pemindaian bukti berwarna, pencarian berdasarkan tujuan, kolom ekspor Keuangan yang rinci, dan kumpulan dokumen audit; fungsi tersebut perlu dicocokkan dengan produk, bukan dianggap sudah tersedia. PRD mencantumkan kebutuhan bahasa Indonesia/Jepang; keputusan bahasa akhir perlu dicek sebelum menghapus atau menyederhanakan konten yang relevan.

## Arah visual yang diusulkan

- **Identitas:** pertahankan logo, aksen merah BLC dan karakter antarmuka korporat yang sudah ada; gunakan latar netral dan warna status yang konsisten.
- **Kepadatan:** tampilkan informasi yang membantu keputusan. Rapikan judul yang berulang, elemen dekoratif, jarak yang tidak konsisten, dan kartu atau metrik yang tidak menjelaskan pekerjaan pengguna. Jangan menghapus penjelasan aturan yang penting.
- **Hierarki:** setiap layar memiliki judul jelas, tindakan utama yang mudah ditemukan, lalu informasi dan tindakan pendukung. Tabel mengutamakan nomor, jenis, tujuan, nominal, tahap/status dan tindakan yang relevan bagi peran.
- **Kejujuran UI:** tandai data demo; jangan gunakan testimonial orang sebagai klaim tanpa dasar. Tombol yang menyatakan Google saat ini masuk ke akun demo dan perlu diselaraskan dengan perilaku sebenarnya. Pilihan XLSX saat ini menghasilkan CSV, sementara pilihan PDF membuka dialog cetak: label/pilihan harus sesuai kemampuan nyata.
- **Responsif dan aksesibel:** desktop tetap utama untuk pekerjaan Keuangan; layar kecil tetap dapat melihat konteks, status dan tindakan. Sediakan label input, fokus keyboard, pesan kesalahan, teks status selain warna, serta dialog yang dapat ditutup dengan jelas.

Contoh susunan beranda/daftar, menyesuaikan struktur sekarang setelah audit visual:

```text
BLC   Beranda / Dokumen / Persetujuan                 Peran aktif

Judul halaman                                 [Tindakan utama]
Tugas yang perlu perhatian | Sedang diproses | Selesai

Cari dokumen       Filter jenis / status / cabang
Nomor | Jenis | Tujuan | Nominal | Tahap / status | Aksi
```

Susunan ini adalah acuan hierarki, bukan rancangan final yang menggantikan seluruh tampilan.

## Urutan implementasi setelah review

### 0. Pulihkan pratinjau dan ambil baseline

- [ ] Periksa kesalahan Vite yang saat ini menolak impor `@/components/ui/progress-indicator` dari `src/components/ApprovalStepper.tsx`. File dan konfigurasi alias ada pada disk; penyebab aktual belum dipastikan. Periksa kondisi server dan konfigurasi sebelum memilih perbaikan terkecil.
- [ ] Dokumentasikan tampilan dan alur yang benar-benar muncul pada desktop serta ponsel, memakai data demo. Catat bagian yang penuh, membingungkan, terpotong, atau tidak berfungsi.
- **Pemeriksaan:** aplikasi dapat dibuka dan layar prioritas dapat diamati; tidak ada data pengguna yang dihapus atau ditimpa.

### 1. Perapian kerangka, navigasi dan halaman masuk

- [ ] Rapikan `src/main.tsx`, `src/style.css`, dan `src/components/ui/sign-in.tsx` seperlunya: identitas peran, penamaan navigasi, jarak, ukuran dan akses layar kecil.
- [ ] Jelaskan mode demo, hilangkan klaim/testimonial yang tidak terverifikasi, dan selaraskan kontrol masuk dengan fungsi yang benar-benar tersedia. Integrasi Microsoft 365 dikerjakan pada tahap tersendiri.
- **Pemeriksaan:** pengguna dapat menemukan area kerja dan mengenali akun/peran aktif; tidak ada tombol masuk pihak ketiga yang berpura-pura sudah tersambung.

### 2. Beranda, daftar dokumen dan pekerjaan per peran

- [ ] Rapikan komponen yang memang dipakai, termasuk `StaffBeranda.tsx`, `BentoMetrics.tsx`, `DocumentList.tsx` dan `ApprovalExplorer.tsx` bila relevan. Utamakan tugas yang dapat dikerjakan dan status berikutnya; pertahankan pencarian, filter dan navigasi yang berfungsi. Tambahkan pencarian berdasarkan tujuan pada daftar dokumen: saat ini pencariannya hanya mencakup judul, nomor dan cabang.
- [ ] Metrik hanya digunakan bila bersumber dari data yang ada dan artinya jelas. Tampilkan kondisi kosong dan hasil pencarian kosong dengan petunjuk yang berguna.
- **Pemeriksaan:** pada data demo, setiap peran dapat menemukan pekerjaan dan membuka detail tanpa perlu menebak arti status atau tombol.

### 3. Detail, persetujuan dan formulir

- [ ] Rapikan `DocumentDetailModal.tsx`, `ApprovalStepper.tsx` dan formulir PR/PO/AV/RB/RC/PV yang ada: kelompok input, ringkasan nominal, lampiran, pesan validasi dan tindakan primer.
- [ ] Pertahankan informasi dua keputusan Hery dan Hashimoto yang relevan. Siapkan ruang/status pemeriksaan HR secara jujur hanya jika sumber datanya ada; jangan membuat status berhasil atau mengubah logika persetujuan pada tahap UI.
- [ ] Jelaskan status persetujuan dan pembayaran sesuai data yang tersedia, termasuk status pembayaran pada PV dan induknya. Bedakan menunggu PV, menunggu pembayaran dan sudah dibayar; jangan menunjukkan pembayaran berhasil sebelum tercatat. Jangan mengubah aturan HR, pajak, pemilihan AV atau pembayaran tanpa keputusan terpisah.
- **Pemeriksaan:** pengguna bisa melihat dokumen induk dan tahap terkait, memahami kesalahan, serta menggunakan form dan dialog melalui keyboard pada desktop dan ponsel.

### 4. Tindakan yang saat ini menyesatkan

- [ ] Tinjau `ExportModal.tsx` dan kontrol serupa. Samakan teks dengan fungsi sebenarnya; jangan menawarkan ekspor XLSX atau PDF final jika baru CSV atau dialog cetak. Pilih perbaikan paling kecil yang disetujui, tanpa menambah integrasi baru secara diam-diam.
- [ ] Tunjukkan keterbatasan lampiran prototipe dengan jelas sampai penyimpanan berkas yang sesungguhnya tersedia.
- **Pemeriksaan:** setiap tindakan yang ditampilkan melakukan apa yang dijanjikan, atau ditandai belum tersedia.

### 5. Pemeriksaan akhir dan pembaruan catatan

- [ ] Jalankan `npm test` dan `npm run build`; selidiki kegagalan yang relevan sebelum menyatakan lulus.
- [ ] Uji layar utama desktop (misalnya 1440 px), menengah (1024/768 px), dan ponsel (390 px); periksa navigasi keyboard, fokus dialog, kontras, pesan kosong/error, dan scroll tabel yang disengaja.
- [ ] Cek alur demo PR, PO, AV, RB, RC dan PV untuk memastikan perapian tidak merusak interaksi yang ada; catat kekurangan bisnis sebagai temuan untuk dibahas, bukan langsung mengubah kebijakan.
- [ ] Cocokkan kembali dokumentasi dengan perilaku aktual dan sinkronkan Graphify setelah perubahan substantif bila praktis, dengan menjaga perubahan workspace yang sudah ada.
- **Pemeriksaan:** hasil uji, keterbatasan dan perbedaan terhadap rencana dilaporkan secara eksplisit.

## Tahap berikutnya, setelah UI

Susun matriks kebijakan per jenis dokumen bersama pengguna dan pemilik proses; klarifikasi penugasan pemeriksaan HR, tindakan Keuangan, bukti, batas nominal, hari kerja dan pengecualian. Setelah itu, rencanakan perbaikan logika yang disetujui, pengamanan akses dan penyimpanan bersama, serta integrasi Microsoft 365/SharePoint sesuai kondisi tenant. Jangan menganggap autentikasi atau penyimpanan bersama sudah berfungsi dari UI demo.

## Dasar pemeriksaan saat penyusunan

- Graphify digunakan sebagai peta awal dan temuan penting dicocokkan dengan kode saat ini.
- Pratinjau lokal menampilkan galat impor Vite; audit visual seluruh halaman belum dapat dilakukan.
- Pemeriksaan TypeScript `tsc --noEmit` lulus. Tes frontend `vitest run src` lulus: 5 berkas, 19 tes. Tes server, build penuh, aksesibilitas dan alur ujung-ke-ujung belum diperiksa dalam tahap rencana ini.
- Tautan chat yang dirujuk pengguna tidak dapat dibaca dari host yang tersedia saat ini; temuan di atas menggunakan pesan yang tersedia dalam percakapan, kode, catatan dan lampiran lokal.

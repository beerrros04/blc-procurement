# Paket kebutuhan BLC Procurement

**Status: draf untuk diskusi, 6 November 2026.** Paket ini belum merupakan spesifikasi produksi yang disetujui. Nama produk sementara. Gunakan sebagai dasar pembahasan bersama pemilik proses dan tim teknis.

Dokumen dipulihkan dari isi percakapan sebelumnya agar tersedia di folder proyek lokal. Gambar sumber tersedia di [docs/media/Powerautomate](<docs/media/Powerautomate/>). DBD, BSD, dan IPD menggunakan definisi yang telah dikonfirmasi pengguna pada percakapan tersebut.

## Menjalankan pratinjau lokal

Di folder ini jalankan `npm install` dan `npm run dev`, lalu buka alamat localhost yang ditampilkan. Jalankan `npm test` untuk uji validasi dan `npm run build` untuk memeriksa build.

Implementasi saat ini hanya mencakup pratinjau pembuatan dan pengubahan draf PR, termasuk tujuan dan tanggal kebutuhan. Kedua kolom tambahan ini masih opsional pada tahap draf; aturan saat pengajuan belum ditentukan. Data contoh disimpan pada browser dan perangkat tersebut, tanpa akun, backend, database bersama, persetujuan, atau pembayaran. Jangan gunakan data perusahaan maupun transaksi nyata. Cakupan tahap pertama yang dipilih adalah procurement dan pembayaran; fungsi tersebut masih harus dibangun dan diuji sebelum aplikasi dapat digunakan secara operasional.

## Dokumen

1. [PRD — Product Requirements](PRD.md): tujuan, pengguna, cakupan, kebutuhan dan kriteria penerimaan.
2. [BSD — Business/System Design](BSD.md): proses, aturan, pengecualian, dan matriks keputusan.
3. [TDD — Technical Design](TDD.md): arsitektur, pilihan teknologi, antarmuka dan operasional.
4. [DBD — Database Design](DBD.md): model data, relasi, integritas dan migrasi.
5. [IPD — Implementation Plan](IPD.md): fase, keluaran, ketergantungan, dan verifikasi. Ini roadmap awal; rincian tugas per file menyusul setelah keputusan desain.
6. [Temuan email dan hak akses](TEMUAN-EMAIL-DAN-HAK-AKSES.md): bukti masukan pengguna, keputusan tingkat akses, rancangan otorisasi, dan pertanyaan alur yang belum dipastikan.

## Sumber dan cara membaca

- Gambar arsip Powerautomate.zip: beranda, daftar, formulir, riwayat persetujuan, dan rangkaian email hingga 4 November 2026. Ini adalah snapshot, bukan akses langsung atau ekspor definisi flow. Email berisi aturan historis dan perubahan; penerapan akhir perlu diuji.
- Diskusi pengguna: sistem saat ini berjalan; tujuan utamanya meningkatkan fleksibilitas dan UI/UX, membangun atas konsep awal, serta mengurangi ketergantungan pada eWeb/Odoo dan persetujuan kertas. Tidak ada keluhan kegagalan operasional saat ini.
- Acuan UI/UX: chat "Add Leonxlnx taste skill" menunjukkan pemasangan pada workspace Windows lain; karena file versi tersebut tidak tersedia di lingkungan ini, panduan `design-taste-frontend` versi publik terkini dibaca dari https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/SKILL.md pada 6 November 2026. Kesamaan versi dengan instalasi Windows belum terverifikasi. Prinsip yang relevan untuk aplikasi kerja dipakai: satu sistem visual, bahasa jelas, tepi dan jarak konsisten, responsif, focus/hover, reduced motion, dan kontras. Aturan landing page seperti hero satu layar, foto dekoratif, dan efek tidak dipaksakan ke aplikasi transaksi.
- **Teramati** = didukung screenshot/email, **Usulan** = keputusan awal untuk ditinjau, **Perlu konfirmasi** = belum diketahui. Setiap angka kebijakan adalah snapshot, bukan rekomendasi mengubah kebijakan.

## Keputusan terpenting yang masih terbuka

1. Pengguna belum memiliki dokumen atau sketsa konsep terpisah; identitas merek dan standar visual masih perlu dirumuskan.
2. Tahap pertama adalah pengadaan dan pembayaran; cakupan penggantian Odoo di luar tahap ini serta kebutuhan integrasi dan migrasi masih perlu dikonfirmasi.
3. Matriks penyetuju seluruh jenis dokumen, cabang, nominal, delegasi, pengecualian, dan penanganan pengajuan lama. HR tingkat 1, Ayu tingkat 2 sekaligus Keuangan, serta Hery dan Hashimoto tingkat 3 telah diusulkan pengguna; keduanya diperlukan dan dapat paralel untuk RB/RC. Urutan lengkap RB/RC dan hak konfirmasi ganda Ayu belum pasti.
4. Batas Rp50 juta adalah kebijakan atau batas solusi saat ini; dasar ambang Rp5 juta; aturan pajak dan pembulatan yang disahkan Keuangan.
5. Pengguna memilih masuk menggunakan akun Microsoft 365. Hosting, persetujuan admin Microsoft, jumlah pengguna, SLA, retensi, sumber dana dan proses pembayaran, serta persyaratan legal bukti persetujuan masih perlu ditentukan.
6. Panduan BLC Procurement versi 4, definisi flow dan data ekspor belum diterima. Verifikasi sebelum membekukan aturan atau migrasi.

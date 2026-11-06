# PRD — BLC Procurement

**Status:** draf 0.1. **Pemilik produk:** belum ditentukan. **Jenis:** aplikasi internal pengadaan dan pembayaran, bilingual Indonesia/Jepang.

## Masalah dan tujuan

Sistem SharePoint/Power Automate sudah berjalan dan mengakomodasi berbagai proses. Pengguna ingin kebebasan mengembangkan alur dan antarmuka yang lebih baik, menggunakan konsep rancangan awalnya, serta memperkuat pengganti proses eWeb/Odoo dan persetujuan kertas. Ini bukan proyek respons terhadap insiden yang sedang berlangsung. Ruang lingkup penggantian Odoo secara keseluruhan belum diketahui.

**Hasil yang diharapkan:** pemohon dapat mengajukan dan mengikuti proses secara mandiri; penyetuju mengambil keputusan dengan konteks lengkap; Keuangan memproses dan merekonsiliasi pembayaran; auditor dapat menelusuri keputusan dan bukti. Alur dan hak akses dapat disesuaikan tanpa menggantungkan proses pada Power Automate. Ukuran keberhasilan disepakati setelah baseline tersedia: tingkat penyelesaian pengajuan, waktu per tahap, waktu mencari bukti, penyelesaian tugas, dan tingkat keberhasilan notifikasi. Jangan menetapkan target numerik tanpa baseline.

## Pengguna

| Peran | Kebutuhan utama |
|---|---|
| Pemohon/cabang | Menyusun, mengajukan, memantau, memperbaiki dan melampirkan bukti. |
| Penyetuju/atasan/HR/manajemen | Menilai pengajuan, memahami urutan dan riwayat, menyetujui atau mengembalikan dengan alasan. |
| Keuangan | Meninjau dokumen induk, membuat PV, mengelola jadwal, mencatat pembayaran, melakukan konfirmasi realisasi dan ekspor. |
| Admin proses | Mengelola pengguna, cabang, matriks persetujuan, kategori dan kebijakan secara terkendali. |
| Auditor berwenang | Mengakses riwayat dan paket bukti sesuai hak akses. |

Peran dapat dimiliki orang yang sama; aturan pemisahan tugas dan kewenangan perlu disetujui.

## Kebutuhan produk

| ID | Kebutuhan dan kriteria penerimaan awal | Prioritas usulan |
|---|---|---|
| PRD-01 | Beranda per peran menampilkan pengajuan saya, tugas persetujuan, tindakan Keuangan dan tautan relevan; hanya data yang diizinkan tampil. | Inti |
| PRD-02 | Draf PR, PO, AV, RB, RC dan PV dapat disimpan, diperiksa, diajukan dan ditelusuri; validasi sesuai jenis dan aturan versi saat diajukan. | Inti |
| PRD-03 | Persetujuan bertahap, komentar, penolakan beralasan, pengajuan ulang dan riwayat tercatat; penyetuju tidak sah tidak dapat bertindak. | Inti |
| PRD-04 | PO/AV/PV/RC dapat merujuk dokumen induk yang memenuhi syarat; data yang diwariskan terlihat asalnya dan dicek ulang saat submit. | Inti |
| PRD-05 | Keuangan membuat PV dari induk yang memenuhi syarat, memantau persetujuan terpisah dari status bayar, dan mencatat pembayaran serta bukti. | Inti |
| PRD-06 | RC mereferensikan AV milik pemohon yang sudah dibayar; satu AV satu RC sesuai kebijakan snapshot, dengan tiga hasil penyelesaian dan pemeriksaan yang relevan. | Inti |
| PRD-07 | Unggah dan akses dokumen sesuai hak; pencarian, riwayat keputusan, PDF ringkasan dan paket audit tersedia bagi peran yang diizinkan. | Inti |
| PRD-08 | Pengingat dan notifikasi yang gagal dapat dipantau dan dicoba ulang tanpa menggandakan keputusan; aktivitas tetap dapat diselesaikan lewat aplikasi. | Inti |
| PRD-09 | Buku besar dapat difilter dan diekspor; tampilkan nilai bruto, potongan dan nilai terutang secara jelas, terpisah dari pembayaran aktual. | Inti |
| PRD-10 | Formulir, status dan navigasi tersedia dalam Bahasa Indonesia dan Jepang, dengan pilihan bahasa dan istilah yang konsisten. | Inti |
| PRD-11 | GR mendukung bukti penerimaan dan referensi PO; kondisi wajib sebelum PV harus dikonfirmasi. | Rinci sebelum implementasi |
| PRD-12 | Admin dapat mengubah aturan secara berversi; pengajuan yang sedang berjalan tetap memakai versi semula kecuali prosedur migrasi eksplisit disetujui. | Inti, dengan batas pengelolaan dikonfirmasi |
| PRD-13 | Migrasi dan operasi paralel menyediakan rekonsiliasi tanpa menggandakan pembayaran; strategi cutover disetujui pemilik proses. | Sebelum peluncuran |
| PRD-14 | Hak akses ditetapkan per tindakan, peran dan cakupan dokumen/cabang. Penyetuju hanya dapat mengambil keputusan atas tugas aktif yang ditugaskan dan masih berwenang; unduhan, ekspor dan data rekening diperiksa di server. Tingkat akses tidak otomatis menentukan urutan atau memperluas izin. | Inti |
| PRD-15 | Untuk RB/RC, rancangan baru mendukung persetujuan Hery dan Hashimoto yang sama-sama diperlukan dan dapat paralel, dengan hasil tiap orang terlihat. Posisi atasan, HR, Ayu dan konfirmasi Keuangan masih belum pasti; jangan terapkan urutan sebagai aturan final. | Inti setelah matriks disahkan |
| PRD-16 | Lacak dokumen yang menunggu PV, notifikasi/PDF yang gagal, serta paket audit per PV dibayar; periksa akses, isi dan keterbukaan PDF, termasuk penanganan dokumen lama. | Inti |

## Tingkat akses dan cakupan — rancangan

Pengguna mengusulkan HR tingkat 1, Ayu tingkat 2, serta Hery dan Hashimoto tingkat 3. Ayu juga mempunyai peran Keuangan. Tingkat, nomor tahap dan pemegang tugas adalah atribut berbeda; pemberian satu peran tidak otomatis memberikan semua hak pada peran lain. Untuk RB/RC, kedua penyetuju tingkat 3 diperlukan dan dapat bertindak paralel. Urutan lengkap dan apakah Ayu dapat memberikan konfirmasi Keuangan pada transaksi yang sama masih belum pasti. Matriks kandidat hak, bukti email, dan pertanyaan ada di [temuan email dan hak akses](TEMUAN-EMAIL-DAN-HAK-AKSES.md).

## Pengalaman pengguna dan design system — usulan awal

Aplikasi berorientasi pekerjaan: daftar tugas sebagai titik awal, ringkasan transaksi sebelum tindakan, formulir bertahap hanya jika membantu, validasi dekat kolom, status dan pemilik tahap terlihat, serta tampilan detail dokumen dan riwayat pada satu konteks. Tabel mendukung pencarian, filter dan kolom sesuai peran; tindakan penting memiliki label jelas. Desktop menjadi fokus awal untuk Keuangan, sementara persetujuan dan pengecekan dapat digunakan lewat ponsel. Keputusan ini perlu uji pengguna.

Satu sistem token untuk warna semantik, tipografi, jarak, radius, focus ring, serta komponen form, tabel, status, dialog, unggah dan timeline. Status tidak hanya dibedakan warna; keyboard, kontras, pesan kesalahan, dan reduced motion wajib dipertimbangkan. Gunakan identitas resmi jika diberikan; palet, font, layout, tingkat kepadatan, dan preferensi visual belum diputuskan. Hindari menerapkan aturan landing page dekoratif pada layar pengajuan.

## Di luar cakupan sampai dikonfirmasi

Buku besar akuntansi umum lengkap, jurnal dan posting, inventori, pembayaran bank otomatis, manajemen lelang/seller dan penggantian seluruh modul Odoo. "Buku besar" pada sistem saat ini dipahami sebagai register pengajuan, bukan asumsi buku besar akuntansi. Fitur ini dapat menjadi fase lain jika ternyata dibutuhkan.

## Kriteria penerimaan produk awal

- Skenario per jenis dokumen disepakati dan dijalankan bersama pemilik proses, termasuk penolakan, ulang, pengecualian dan otorisasi.
- Keuangan dapat menelusuri pengajuan induk → PV → bukti bayar → realisasi/audit dan membedakan disetujui dari dibayar.
- Hasil perhitungan dan ekspor cocok dengan contoh yang disetujui Keuangan; tak ada penggandaan pembayaran akibat pengiriman ulang.
- Pengguna per peran menyelesaikan skenario uji tanpa akses tidak sah; layar utama diuji keyboard dan perangkat bergerak.
- Dua tugas paralel RB/RC tidak menyelesaikan kelompok persetujuan setelah hanya satu keputusan; otorisasi, hasil penolakan dan penanganan tugas lain mengikuti aturan yang telah disahkan dan tercatat per aktor.
- Data historis dan alur aktif direkonsiliasi sebelum cutover; keberhasilan diukur dengan target yang disepakati.

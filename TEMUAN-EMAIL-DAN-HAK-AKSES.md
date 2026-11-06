# Temuan email, hak akses, dan alur persetujuan

**Status: rancangan untuk validasi pemilik proses, 7 November 2026.** Ini adalah penelaahan ulang bukti, bukan hasil pengujian sistem SharePoint saat ini. Rencana ini belum diimplementasikan sebagai akses atau persetujuan yang berfungsi; aplikasi yang ada masih pratinjau draf PR di browser.

## Sumber dan cara membaca

- [Capture 015 — percakapan email](<docs/media/Powerautomate/FireShot Capture 015 - Mail - Bernard Wilson - Outlook - [outlook.cloud.microsoft].png>): percakapan 26 Oktober–4 November 2026. Panduan v3/v4 dan dokumen usulan yang terlihat sebagai lampiran tidak tersedia isinya pada screenshot.
- Capture 003 (beranda), 012 (ringkasan), 013 (riwayat), 014 (dokumen), 016/018/019/021/023 (formulir). Nama berkas Capture 018 menyebut PR, tetapi isi yang ditampilkan adalah formulir PO.
- **Teramati:** terlihat dalam gambar atau diklaim dalam email pada tanggal itu; **Dikonfirmasi pengguna:** keputusan dari percakapan ini untuk rancangan baru; **Usulan:** rancangan untuk dibahas; **Belum dipastikan:** butuh keputusan atau bukti tambahan. Klaim perbaikan pada email tidak membuktikan kondisi sistem sekarang.

## Tingkat, peran dan tugas adalah hal yang berbeda

| Tingkat persetujuan | Orang/peran | Makna yang sudah diberikan | Hal yang belum boleh disimpulkan |
|---|---|---|---|
| 1 | Atasan Langsung | Penyetuju operasional tingkat 1 (atasan pemohon). | Hak menyetujui transaksi di luar bawahan langsungnya. |
| 2 | Ayu | Penyetuju tingkat 2 (verifikator keuangan & kelayakan) dan juga mempunyai peran Keuangan. | Hak Keuangan otomatis diberikan ke setiap penyetuju. |
| 3 | Hery dan Hashimoto | Penyetuju tingkat 3 (BOD); keduanya diperlukan dan dapat menyetujui secara paralel sebelum dokumen diteruskan ke Keuangan. | Hak mengambil keputusan tunggal tanpa yang lain (keduanya disyaratkan). |

**Dikonfirmasi pengguna (7 November 2026):** **HR tidak terlibat dalam persetujuan.** Rantai alur persetujuan definitif untuk seluruh pengadaan/pembayaran adalah **Atasan Langsung → Bu Ayu → BOD (Pak Hery & Hashimoto)**. Ambang Rp5.000.000 adalah murni aturan kelengkapan lampiran IAM/ParentPRID pada formulir, bukan pemotong alur persetujuan BOD.

Tingkat 1/2/3 tidak sama dengan nomor tahap: Capture 013 memperlihatkan contoh riwayat lama. Pada alur baru, dokumen bergerak dari Atasan Langsung (Tahap 1) → Bu Ayu (Tahap 2) → BOD (Tahap 3: Hery & Hashimoto) → antrean Keuangan untuk pembuatan PV dan pembayaran.

## Informasi orang dan notifikasi yang terlihat pada email

| Bukti pada Capture 015 | Keterangan yang bisa digunakan |
|---|---|
| 28 Oktober 11:57 — RB | Alur baru pada saat itu: atasan langsung → **Bu Ira (HR)** → **Pak Hery** → **Hashimoto**, lalu Keuangan membuat PV. Email juga menyatakan RB yang sudah berjalan sebelum perubahan tetap mengikuti aturan lama, dengan **Bu Ayu** sebagai penyetuju lama, bukan Bu Ira. |
| 2 November 17:57 dan 4 November 13:00 — RC | Finance memilih alur seperti RB. Pengumuman RC menyatakan atasan → Bu Ira (HR) → Pak Hery → Hashimoto → konfirmasi Keuangan. Ini adalah alur serial yang diumumkan untuk sistem lama, bukan persetujuan paralel yang diusulkan untuk sistem baru. |
| 3 November 10:43 — konfirmasi Keuangan RC | Dalam rancangan yang dijelaskan Hashimoto, permintaan dikirim ke **Bu Erika, Bu Aprinia, dan Bu Sifa**; cukup satu yang menyetujui untuk konfirmasi pengembalian sisa atau realisasi yang sama dengan CA. Untuk biaya lebih besar dari CA, rancangan mengarahkan Keuangan membuat PV kekurangan tanpa konfirmasi tersebut. Pengumuman 4 November merangkum konfirmasi Keuangan secara umum dan tidak merinci anggota ataupun seluruh cabangnya. |
| 28–30 Oktober — email persetujuan | Finance meminta notifikasi saat AV disetujui dan PDF pada email persetujuan akhir. Balasan menyatakan notifikasi AV bagi pengajuan baru dan lampiran PDF ditambahkan, lalu memperbaiki lampiran yang tidak dapat dibuka. Ini adalah pernyataan perbaikan dalam email, bukan pengujian kondisi sekarang. |
| 4 November 13:00 — pengingat RC | Jika terlambat, email pengingat dikirim setiap hari kerja kepada **pemohon dan atasan**, dengan **Bu Ayu di CC**, sampai RC diajukan. AV lama tidak mendapat pengingat otomatis menurut pengumuman tersebut. |

Header screenshot menampilkan **nama** pengirim dan penerima, tetapi tidak memperlihatkan alamat email lengkap mereka. Nama pada screenshot juga tidak otomatis menetapkan akun atau hak akses sistem baru; alamat/identitas akun harus diperoleh dan diverifikasi dari sumber organisasi bila dibutuhkan.

## Matriks kemampuan awal — usulan, bukan izin final

Semua akses memerlukan akun aktif, peran dan cakupan yang sesuai. **Belum ada akses otomatis lintas cabang atau berdasarkan tingkat yang lebih tinggi.** Pembagian detail dan pengecualiannya perlu disahkan pemilik proses.

| Kemampuan | Kandidat peran | Cakupan usulan dan keputusan terbuka |
|---|---|---|
| Membuat/mengubah draf, mengajukan dan melihat riwayat | Pemohon | Draf dan pengajuan milik sendiri; hak revisi dan pembatalan setelah submit perlu keputusan. |
| Melihat dokumen dan mengambil keputusan | Atasan Langsung, Bu Ayu, Hery, Hashimoto (sesuai jenjang tugas aktif) | Hanya tugas aktif dan dokumen pendukung yang diizinkan; alasan penolakan wajib. HR tidak terlibat dalam persetujuan. |
| Membuat PV, meninjau antrean, konfirmasi Finance, mencatat pembayaran dan ekspor | Petugas Keuangan yang diberi hak; Ayu memiliki peran Keuangan | Pisahkan hak lihat, buat, konfirmasi dan catat bayar; tentukan cabang, rekening, kewenangan koreksi dan apakah Ayu boleh mengonfirmasi transaksi yang telah ia setujui. |
| Mengakses berkas audit | Keuangan dan pihak manajemen/auditor yang diberi hak | Email 31 Oktober membatasi folder historis ke Keuangan, Ayu, Hery dan BOD; daftar dan cakupan final perlu disetujui. Periksa hak setiap unduhan dan ekspor. |
| Mengelola anggota dan aturan | Admin identitas/akses dan admin kebijakan yang diberi hak | Pengelolaan role, cakupan dan versi aturan diaudit; kemampuan mengelola tidak otomatis memberi kemampuan menyetujui atau mencatat pembayaran. |

Tidak ada izin berdasarkan daftar ini saja sampai matriks aksi × peran × cakupan disahkan. Microsoft 365 dipilih sebagai metode masuk; identitas menggunakan tenant dan ID objek yang stabil, bukan nama tampilan. Autentikasi tidak menggantikan pemeriksaan otorisasi pada server.

## Perkembangan dan masukan pengguna pada email

| Tanggal dan bukti Capture 015 | Masukan/perubahan yang dilaporkan | Kebutuhan untuk rencana baru |
|---|---|---|
| 26 Okt: pengumuman peluncuran | Uji operasional 26 Okt, operasional penuh 1 Nov, transisi 1–30 Nov; batas sistem Rp50 juta, nilai IDR; pembayaran penjual lelang direncanakan kemudian. | Perlu pilot/cutover dan satu sumber transaksi; batas Rp50 juta dan cakupan seller tidak otomatis ditetapkan sebagai kebijakan sistem baru. |
| 28 Okt 11:16 dan 11:57 | Finance meminta nilai bersih, akses dokumen persetujuan, invoice PV opsional, akses langsung induk PO/AV/RB, dan pemeriksaan HR atas RB. Balasan menyatakan perubahan diterapkan; pengajuan sebelumnya tetap memakai jalur lama. | Tampilkan rincian bruto/potongan/nilai terutang dan status bayar terpisah; Finance dapat menemukan induk tanpa unggah ulang sesuai izin; versi jalur lama tetap terjaga. Nomor/tanggal invoice opsional pada PV tidak menghapus syarat invoice kategori PO tertentu. |
| 28 Okt 17:30 dan 17:55 | Notifikasi AV ke Finance belum diterima; balasan menyatakan notifikasi baru berlaku untuk pengajuan baru, dokumen sebelumnya dapat dicari di Menunggu PV. Finance meminta pencarian dokumen berdasarkan tujuan dan PDF akhir. | Antrean Menunggu PV dan notifikasi lintas jenis; pencarian nomor/judul/tujuan/cabang/pemohon/status; rekonsiliasi dokumen lama, bukan menganggap notifikasi lama terkirim. |
| 29–30 Okt | Status pembayaran tampil pada AV/RB walau PV belum dibuat; diperbaiki untuk ditampilkan pada PV. PDF awal gagal dibuat; lampiran email tanggal 29–30 Okt tak dapat dibuka; perbaikan diumumkan 30 Okt. | Pisahkan dokumen induk menunggu PV, persetujuan PV, nilai terutang dan catatan pembayaran aktual; cek PDF benar-benar dapat dibuka, pantau kegagalan, sediakan ulang/cari dokumen sesuai izin. |
| 30–31 Okt | Finance meminta memilih PV berdasarkan nomor, membandingkan nominal dan rekening dengan bukti transfer, ekspor kolom rinci, dan paket audit gabungan; balasan menyatakan diterapkan. | Tampilkan referensi PV, nominal dan rekening yang disetujui untuk pengecekan; ketidakcocokan dikembalikan dengan alasan menurut email; toleransi/parsial harus diputuskan. Paket audit untuk PV dibayar harus berisi bukti terkait yang tersedia dan dibatasi per hak. |
| 2–4 Nov | Usulan PO Realization berubah menjadi RC; satu AV per RC, pemohon memilih AV miliknya yang sudah dibayar, nominal CA berasal dari PV yang sudah dibayar, bukan dari nilai yang sekadar diajukan. | Rancang hubungan AV → pembayaran PV → RC, pengembalian sisa/kekurangan/sama, bukti, dan pencegahan duplikasi. Pemohon tidak perlu akses ke PV penuh untuk melihat nilai CA yang berhak diketahuinya. |
| 3–4 Nov | Batas realisasi disepakati tanggal selesai kegiatan + dua hari kerja; pengingat hari kerja ke pemohon dan atasan, CC Ayu, sampai RC diajukan. AV lama juga harus direalisasikan tetapi tidak otomatis diingatkan. | Kalender libur, zona waktu, jam pengingat, cutoff dan perlakuan AV lama harus disetujui dan diuji. Jangan menjadikan perilaku historis AV lama sebagai keputusan migrasi final. |
| 3 Nov 10:43 dan 4 Nov 13:00 | Email 3 Nov mengusulkan konfirmasi oleh salah satu anggota tim Keuangan untuk pengembalian sisa atau realisasi sama; kekurangan menuju PV. Pengumuman 4 Nov merangkum konfirmasi Keuangan secara umum. | Aturan cabang dan mekanisme satu anggota Keuangan masih perlu disahkan terhadap panduan v4, termasuk apakah Ayu dapat berperan ganda pada transaksi yang sama. |

### Rincian yang mudah terlewat

- **Ekspor Finance:** email 31 Oktober menyebut nomor, jenis, cabang, judul, tujuan, subtotal, PPN, PPh, nilai dibayarkan, bank, nomor/nama rekening dan jatuh tempo. Bentuk dan hak atas informasi rekening perlu disahkan; bedakan nilai terutang dari pembayaran aktual.
- **Paket audit:** email 31 Oktober menyebut kumpulan PR/IAM, PO/AV/RB/BAST, PV, bukti transfer dan PDF persetujuan untuk PV yang sudah dibayar; email perkembangan RC mengusulkan dokumen realisasi ikut dalam paket audit PV. Pastikan hubungan dan isi untuk setiap kasus diverifikasi; tidak semua dokumen berlaku pada semua transaksi.
- **Tahap dilewati:** Capture 013 memperlihatkan alasan berbeda: penyetuju telah menyetujui tahap sebelumnya, tahap tidak digunakan untuk jenis dokumen, dan penyetuju adalah pemohon sendiri. Skip harus mencatat alasan dan aktor sistem; skip bukan bukti persetujuan. Apakah masing-masing aturan tetap berlaku, khususnya ketika Hery dan Hashimoto keduanya wajib, perlu disetujui; jangan otomatis melewati persetujuan wajib atau mengizinkan self-approval.
- **Lampiran kontrak:** beranda Capture 003 menyebut lampiran kontrak untuk pembayaran rutin tanpa PR, sedangkan formulir PO Capture 018 dan email 28 Oktober menyebut nomor kontrak tidak wajib untuk kategori tertentu dan invoice wajib. Nomor dan lampiran adalah hal berbeda; kewajiban lampiran kontrak belum dapat disimpulkan.
- **Tahap awal:** formulir memilih penyetuju pertama; RC menyebut atasan langsung. Daftar siapa yang boleh dipilih, validasi hubungan atasan dan pengganti perlu ditetapkan.

## Keputusan yang masih diperlukan

1. Urutan lengkap RB/RC baru, termasuk posisi atasan, HR dan Ayu; apakah konfirmasi Finance berlaku pada setiap hasil dan apakah Ayu boleh mengonfirmasi setelah menyetujui.
2. Matriks terpisah menurut cabang, nilai dan kategori. Untuk RB/RC, Hery dan Hashimoto keduanya diperlukan dan dapat paralel, dengan urutan lengkap belum pasti. Untuk PR, PO, AV, PV dan GR, tentukan apakah keduanya, salah satu, atau tidak ada yang diperlukan serta kapan paralel diperbolehkan.
3. Penanganan penolakan saat satu dari dua tugas paralel sudah disetujui, pembatalan tugas yang masih aktif, revisi dan pengajuan ulang; status dan riwayat per aktor.
4. Penggantian/delegasi, akun tidak aktif atau keluar, siapa yang menetapkan pengganti, masa berlaku dan audit. Saat akses berubah, tentukan penyelesaian tugas aktif tanpa otomatis mengubah riwayat atau memperluas akses.
5. Hak baca per jenis dokumen dan cabang, rekening, lampiran, catatan bayar, laporan, notifikasi dan paket audit; pemisahan tugas serta pencegahan akses langsung lewat URL/API.
6. Aturan skip untuk orang yang sama atau pemohon sendiri; apakah wajib penyetuju pengganti dan apakah tindakan tertentu wajib dilakukan orang yang berbeda.
7. Batas nominal, rumus pajak dan pembulatan, pembayaran parsial/selisih, syarat lampiran kontrak, kalender kerja, dan validasi nilai/keharusan invoice menurut jenis dokumen.
8. Isi panduan v4, definisi flow, izin Microsoft 365/SharePoint, data contoh yang disamarkan, dan aturan migrasi kasus yang masih berjalan.

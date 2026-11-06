# IPD — Implementation Plan

**Status:** roadmap untuk perencanaan, bukan instruksi siap implementasi atau jadwal yang telah disetujui. Saat ini ada pratinjau draf PR lokal di browser; backend, akun, otorisasi, persetujuan dan pembayaran belum diimplementasikan. Rincian tugas, antarmuka dan pengujian per modul dibuat setelah aturan yang relevan disahkan.

## Urutan yang diusulkan

| Fase | Keluaran | Pemeriksaan sebelum lanjut |
|---|---|---|
| 0. Penemuan dan keputusan | Tinjau screenshot dan draf yang tersedia; kumpulkan panduan v4, definisi flow, daftar dokumen, contoh anonim, matriks otorisasi, infrastruktur, volume dan kebijakan. Validasi batas Odoo dan Rp50 juta. | Pemilik proses meninjau daftar aturan, pengecualian, pemilik keputusan dan cakupan fase. |
| 1. Desain produk | Peta perjalanan pemohon/penyetuju/Keuangan, wireframe, prototipe PR → PO → PV, design tokens dan komponen; uji bahasa ID/JP dan perangkat. | Pemakai per peran mencoba tugas kunci; masalah prioritas diselesaikan. Konsep visual dikonfirmasi pengguna. |
| 2. Fondasi teknis | Repo dan lingkungan terpisah, identitas/akses, database, audit, private file storage, outbox/worker, observability dan backup/restore. | Otorisasi diuji; perubahan atomik, retry aman dan restore terbukti di staging. |
| 3. Alur pembelian | Draf/submit PR dan PO, kebijakan berversi, tugas dan keputusan, lampiran serta dashboard; penolakan dan pengajuan ulang. | UAT skenario normal, ambang, exception, akses lintas cabang, konkurensi dan aturan sebelumnya. |
| 4. Keuangan | PV, nilai dan pajak yang disepakati, jadwal, pembayaran/bukti, register, ekspor dan paket audit; GR bila aturannya siap. | Finance merekonsiliasi contoh, menguji ketidakcocokan dan memastikan status bayar terpisah dari approval. |
| 5. AV, RB, RC | AV/RB, RC dan tiga hasil realisasi, hubungan pembayaran, pengingat kalender kerja, tahap HR/Finance. | UAT atas satu AV–satu RC, AV belum dibayar, jumlah berbeda, hasil kembali/kurang/sama, deadline dan revisi. |
| 6. Migrasi dan operasi paralel | Pemetaan dan impor uji, latihan cutover, rekonsiliasi data, panduan dan pelatihan, pemantauan. | Pemilik data menyetujui jumlah/total/sampel, penanganan proses aktif dan prosedur rollback. |
| 7. Peluncuran bertahap | Pilot kelompok/cabang terpilih, umpan balik dan penyesuaian, perluasan bertahap. | Sponsor bisnis menyetujui kesiapan; transaksi finansial direkonsiliasi. |

### Rincian pekerjaan hak akses dan persetujuan

1. **Validasi matriks:** susun jenis dokumen × cabang × nominal/kategori × tahap/kelompok × orang/peran × tindakan × cakupan. Masukkan usulan HR tingkat 1, Ayu tingkat 2 sekaligus Keuangan, Hery dan Hashimoto tingkat 3. Untuk RB/RC keduanya diperlukan dan dapat paralel; urutan lengkap masih belum pasti. **Periksa:** pemilik proses menandai setiap baris, pengecualian dan tanggal berlaku sebelum aktivasi.
2. **Identitas dan akses:** rancangkan login Microsoft 365 serta hak eksplisit untuk pemohon, penyetuju, HR, Keuangan, admin dan auditor, termasuk pembatasan cabang/dokumen/berkas. **Periksa:** akun tidak ditugaskan, hak dicabut, lintas cabang, unduhan, ekspor dan URL langsung ditolak; multi-peran hanya memperoleh izin yang diberikan.
3. **Kelompok persetujuan:** implementasikan kebijakan berversi, tugas per orang, kelompok paralel dan audit. **Periksa:** untuk RB/RC, satu approval belum menyelesaikan kelompok; dua approval sah menyelesaikan kelompok sesuai urutan yang disahkan; tindakan ganda atau bersamaan tidak menggandakan efek. Pengujian penolakan/paralel dan pengganti baru dapat difinalkan setelah kebijakan diputuskan.
4. **Penanganan pengecualian:** rancang status dan audit berbeda untuk tahap tidak digunakan, penyetuju berulang dan self-approval/pengganti. **Periksa:** tidak ada skip yang diam-diam menggantikan approval wajib; alur lama dan baru mengikuti versinya; akun yang dicabut tidak bisa memutuskan tugas lama.
5. **Tindak lanjut masukan Finance:** antrean Menunggu PV, dokumen induk tanpa unggah ulang, pencarian berdasarkan tujuan, status bayar PV, rekonsiliasi, PDF terbuka, notifikasi, ekspor dan audit. **Periksa:** contoh tanggal 28–31 Oktober dan kasus RC 2–4 November direproduksi dengan data uji dan diverifikasi bersama Finance, dengan hak akses yang sah.

Fase 3–5 dapat disusun ulang menurut prioritas bisnis; aplikasi belum menggantikan keseluruhan sistem sampai alur yang diwajibkan dan data historis telah diverifikasi. Hindari penggunaan transaksi nyata dalam dua sistem yang dapat menghasilkan pembayaran ganda: tentukan satu sumber transaksi dan siapa yang mengeksekusi pembayaran saat paralel.

## Rencana pengujian lintas fase

- **Bisnis:** contoh nyata yang disamarkan untuk setiap tipe, ambang dan pengecualian; empat tahap, skip, reject dengan alasan, resubmit, perubahan kebijakan di tengah proses, dan peran yang sama di beberapa tahap.
- **Keuangan:** perhitungan subtotal/PPN/PPh/discount sesuai contoh disahkan, nilai terutang vs aktual, bukti bayar tidak cocok, duplikasi, potensi pembayaran parsial dan koreksi.
- **Keamanan:** akses lintas cabang/peran, akses ke rekening dan dokumen, unduhan, file berbahaya, expired session, dan tindakan oleh penyetuju selain yang berwenang.
- **Keandalan:** submit/decision bersamaan, pengulangan request, restart worker, kegagalan email/PDF, pemulihan dan backup/restore.
- **UI/UX:** tugas nyata pemohon, penyetuju dan Finance; desktop dan ponsel; keyboard, pembaca layar, focus, validasi, warna, reduced motion dan teks ID/JP.
- **Migrasi:** nomor dan relasi tetap terhubung, jumlah dan total cocok, lampiran terbuka, hak akses dan status aktif benar; dry run idempoten.

## Keputusan dan dependensi

1. Pengguna belum memiliki sketsa konsep terpisah; identitas merek dan prioritas proses ditinjau bersama berdasarkan gambar yang tersedia.
2. Pemilik proses mengesahkan matriks persetujuan, ambang, formula, pengecualian dan kewenangan perubahan kebijakan.
3. Pengguna memilih akun Microsoft 365 untuk masuk; tim IT menetapkan pendaftaran/izin Entra, hosting, kapasitas, SLA, retensi, biaya dan integrasi yang tersedia.
4. Finance menetapkan sumber kebenaran, penanganan pembayaran parsial/duplikat/koreksi, dokumen wajib, dan kelengkapan paket audit.
5. Tim proyek menyepakati fase awal dan metode migrasi, lalu membuat rencana implementasi terperinci per fase dengan kontrak dan tes yang dapat diverifikasi.

## Kriteria kesiapan pilot

Alur yang dipilih lulus UAT dan otorisasi; data dan jumlah direkonsiliasi; SOP, penanggung jawab, backup/restore serta penanganan kegagalan diuji; pengguna pilot telah dilatih; ada keputusan eksplisit mengenai sumber transaksi, cutover dan rollback. Tidak ada tanggal/anggaran yang dijanjikan sebelum volume dan kebutuhan dipastikan.

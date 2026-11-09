# Persiapan integrasi SharePoint

**Status: persiapan, belum terhubung dan belum siap produksi.** Frontend menggunakan API lokal dan akun demo; backend menyimpan workspace di SQLite lokal serta isi lampiran di filesystem. Data localStorage dari prototipe lama tidak otomatis dipindahkan. Jangan gunakan untuk transaksi nyata.

## Keputusan sebelum integrasi

- Tentukan apakah SharePoint Lists dan document library menjadi sumber data utama atau tujuan sinkronisasi. Jangan melakukan penulisan dua arah sampai aturan konflik dan sumber kebenaran disepakati.
- Inventarisasi site, list, library, nama internal dan tipe kolom untuk PR, PO, AV, RB, RC, PV, register serta riwayat. Cocokkan ID induk, versi, status, nominal, mata uang, pemohon, penyetuju dan lampiran dengan data sumber yang telah disamarkan.
- Tentukan Microsoft Entra tenant, pendaftaran aplikasi, metode autentikasi, identitas pengguna, dan hak akses aplikasi bersama admin tenant. Gunakan izin sekecil mungkin; izin Selected memerlukan persetujuan dan penugasan eksplisit pada resource: https://learn.microsoft.com/en-us/graph/permissions-selected-overview
- Sahkan aturan akses daftar, informasi pribadi, dokumen dan lampiran di server untuk setiap permintaan. Periksa akses langsung ke API dan file; menyembunyikan elemen UI tidak memberikan perlindungan. Jangan mengandalkan akun demo atau secret bawaan untuk produksi.
- Sahkan aturan IAM, pajak dan pembulatan, identitas atasan, revisi, PV serta data rekening sebelum memigrasikan transaksi aktif.

## Tahapan migrasi

1. Buat lingkungan SharePoint uji yang terpisah dan salinan data yang telah disamarkan; jangan menulis ke daftar operasional selama pengujian.
2. Ekspor inventaris dan petakan ID sumber ke ID aplikasi dengan tabel referensi yang persisten. Catat data yang tidak dapat dipetakan; jangan mengganti atau menghapus data asli.
3. Jalankan impor percobaan yang dapat diulang tanpa menduplikasi transaksi. Pertahankan hubungan dokumen, riwayat persetujuan dan status pembayaran; cocokkan jumlah, total nominal dan sampel per jenis dengan sumber.
4. Migrasikan isi file yang tersedia beserta metadata, verifikasi ukuran/hash dan uji unduhan oleh akun berhak dan penolakan bagi akun tidak berhak. Metadata lampiran lama di localStorage tidak berisi file dan tidak dapat dipulihkan tanpa sumber lain.
5. Uji revisi, persetujuan paralel, akses dan pembayaran dengan pengguna bisnis. Tentukan penanganan transaksi yang sedang berjalan dan rekonsiliasi perubahan saat cutover.
6. Setelah persetujuan operasional, lakukan backup, hentikan penulisan pada sistem lama sesuai rencana cutover, impor perubahan terakhir dan rekonsiliasi. Siapkan prosedur kembali ke sistem lama tanpa menimpa perubahan baru.

## Catatan teknis

- Microsoft Graph menyediakan list item dan drive item; pilih endpoint dan izin berdasarkan operasi yang benar-benar digunakan. Feed delta menunjukkan keadaan terbaru, bukan riwayat semua perubahan, dan perlu menangani resync: https://learn.microsoft.com/en-us/graph/api/listitem-delta?view=graph-rest-1.0
- Simpan token dan kredensial hanya di penyimpanan rahasia server, bukan di frontend atau repository. Implementasikan retry untuk throttling dan kegagalan sementara, penguncian versi, audit, rekonsiliasi, dan pemantauan.
- Jangan mengasumsikan status submit, hak approval, atau izin Microsoft 365 dapat dipetakan langsung dari nama peran demo. Validasi identitas dan kebijakan pada backend.
- Tidak ada kredensial, ID site/list, migrasi data, atau panggilan Graph produksi yang disiapkan dalam perubahan ini.

# Rencana alur pengajuan BLC — untuk review

**Status:** implementasi prototipe lokal telah diminta; penyesuaian berdasarkan temuan eWebERP dan UI Development Notes masih berupa rencana. **Pembaruan:** 8 November 2026. Catatan progres terbaru dan label tahap terdapat di tabel perubahan dan [review notes](../plans/2026-11-08-review-ui-development-notes.md); deskripsi historis di bawah tidak semuanya mencerminkan kode terakhir.

## Tujuan dan sumber

Menyamakan data dan alur pengajuan dengan praktik yang tergambar pada `docs/media/Powerautomate`, dengan keputusan baru pengguna yang tercatat di bawah. Screenshot adalah bukti bentuk formulir dan keterangan pada saat diambil, bukan bukti pengujian sistem aktif. Lihat juga `BSD.md` dan `TEMUAN-EMAIL-DAN-HAK-AKSES.md`; aturan yang belum pasti harus dikonfirmasi kepada pemilik proses.

## Status dan catatan perubahan

| Tanggal | Perubahan dalam rencana | Status |
|---|---|---|
| 8 Nov 2026 | Memetakan screenshot PR, PO, AV, RB dan RC terhadap prototipe; mencatat keterbatasan bukti PV. | Selesai untuk review awal |
| 8 Nov 2026 | Pajak dihitung otomatis berdasarkan pilihan dropdown; detail tarif, dasar dan pembulatan belum ditetapkan. | Keputusan arah; rincian terbuka |
| 8 Nov 2026 | Pengajuan yang salah dikembalikan ke draf; pemohon tidak boleh menyetujui pengajuannya sendiri; reference ID manual tidak lagi diperlukan untuk mengenali revisi. | Disepakati sebagai arah; detail pengajuan ulang terbuka |
| 8 Nov 2026 | Lampiran harus tersimpan dan dapat dibuka penyetuju yang berhak. | Disepakati sebagai kebutuhan; mekanisme belum dipilih |
| 8 Nov 2026 | Aturan IAM dan PR induk dicatat sebagai interpretasi sementara, bukan kebijakan final. | Menunggu konfirmasi pemilik proses |
| 8 Nov 2026 | Menelaah contoh Purchase Order dan sumber DJP: PPh dapat menjadi potongan pembayaran, dan PPh 23 2% berlaku pada jasa tertentu sesuai ketentuan. | Pembahasan; klasifikasi transaksi dan rumus akhir menunggu Finance |
| 8 Nov 2026 | PV belum memiliki draf untuk sementara; dropdown pajak digunakan sementara sambil menunggu konfirmasi pilihan dan rumus. | Disepakati sebagai arah |
| 8 Nov 2026 | Dokumen yang dikembalikan diajukan lagi dari draf dan mengulang seluruh persetujuan; atasan tidak aktif menyebabkan proses menunggu, berlaku untuk semua alur. | Disepakati |
| 8 Nov 2026 | Daftar peran: Atasan, GM, BOD, Pengaju, Admin; semuanya dapat mengajukan dengan tahapan yang sama. Admin, BOD, GM dan Atasan dapat membuka lampiran. | Disepakati; cakupan akses dan konflik peran masih perlu review |
| 8 Nov 2026 | Koreksi pengguna: pengajuan dibuat melalui Pengaju/staf, termasuk kebutuhan yang berasal dari GM atau BOD. Finance ditambahkan sebagai peran tersendiri. Koreksi ini menggantikan asumsi bahwa semua peran mengajukan langsung. | Disepakati; cakupan kewenangan Finance dan akses lampiran perlu review |
| 8 Nov 2026 | Finance boleh membuka lampiran pengajuan yang diperlukan untuk memproses PV dan pembayaran. | Disepakati; cakupan dokumen dan kewenangan lainnya masih perlu review |
| 8 Nov 2026 | Pengaju dapat membuka lampirannya sendiri; daftar dan detail pengajuan dapat dilihat secara umum, tetapi lampiran orang lain dibatasi menurut hak akses. | Disepakati sebagai arah; rincian informasi yang dibuka dan cakupan penyetuju perlu review |
| 8 Nov 2026 | Informasi pribadi tidak terlihat secara umum; aksesnya dibatasi untuk GM, BOD, Admin dan Finance. | Disepakati; definisi data pribadi dan akses pemilik/atasan perlu review |
| 8 Nov 2026 | Nomor rekening dan nama pemilik rekening dibatasi untuk Pengaju, GM, BOD, Admin dan Finance. | Disepakati; cakupan akses Pengaju dicatat sebagai pengajuan sendiri dan perlu konfirmasi |
| 8 Nov 2026 | Pengguna meminta mulai implementasi dan mengganti seluruh tipografi ke Google Sans. Font diperbarui; implementasi alur dan hak akses belum selesai. | Font diterapkan; alur belum selesai |
| 8 Nov 2026 | Menambahkan pilihan dan filter cabang, rincian nilai dan nomor IAM/PR pada PR, serta nomor IAM/kontrak pada PO. Pajak PR merupakan perkiraan sementara. | Implementasi sebagian; alur, lampiran dan akses belum lengkap |
| 8 Nov 2026 | Menambahkan pilihan PO disetujui dan tanggal selesai kegiatan pada AV serta dokumen persiapan migrasi SharePoint. | Implementasi sebagian; integrasi produksi dan akses belum selesai |
| 8 Nov 2026 | Memperbaiki perhitungan H+2 RC agar melewati akhir pekan dan menambahkan penyesuaian modal, formulir dan tabel pada layar sempit. | Tes dan build lulus; kalender libur dan pemeriksaan visual responsif belum selesai |
| 8 Nov 2026 | Memperjelas tombol menu navigasi pada layar sempit; membuka menu dan berpindah ke modul PR diuji di browser. | Menu teruji; integrasi frontend–backend dan database belum selesai |
| 8 Nov 2026 | Menghubungkan login, dokumen, keputusan dan pembayaran frontend ke API; menambahkan SQLite lokal, lampiran lokal, identitas pemilik dan redaksi rekening awal; menambah kolom AV/RB/RC dan penyetuju. Menguji draf dan persetujuan atasan di browser. | Implementasi berlangsung; verifikasi alur lengkap, akses dan responsif masih diperlukan |
| 8 Nov 2026 | Menguji alur AV → PV dibayar → RC melalui API, akses file dan rekening, serta tampilan formulir dan kartu transaksi pada lebar 390 px. Menambah nomor otomatis server dan konflik versi. | Pengujian berjalan; pajak/IAM dan integrasi SharePoint masih menunggu konfirmasi |
| 8 Nov 2026 | Menguji PR dummy dari browser hingga persetujuan atasan, unggah lampiran dan persistensi sesudah restart; pustaka kini membuka file lokal dan tidak menampilkan PDF persetujuan fiktif. | Berfungsi untuk uji lokal; hak akses dan aturan produksi tetap perlu audit |
| 8 Nov 2026 | Menelaah contoh PR dan PO eWebERP secara baca saja, termasuk reimbursement, realisasi advance, dan satu DP vendor; membandingkannya dengan kode lokal. | Pemetaan awal; beberapa contoh dan aturan operasional masih perlu verifikasi. Rincian dan urutan lanjutan ada di bagian “Pembaruan berdasarkan eWebERP”. |
| 8 Nov 2026 | Pengguna menyetujui label **Head** untuk tahap persetujuan pertama. Progres harus menunjukkan posisi dan status persetujuan yang sebenarnya, dengan gaya yang diadaptasi dari contoh Build Pipeline. | Keputusan label; rancangan visual dan implementasi belum dikerjakan. Label tahap kedua serta pemetaan perannya masih perlu dipastikan. |
| 8 Nov 2026 | Pengguna menetapkan label **Head → GM → Direksi**. Setelah itu dilakukan pemeriksaan `UI-Development-Notes.md`; pengguna menegaskan daftar/detail umum bagi akun login, pengecualian PO tanpa PR, dan tidak ada delegasi otomatis. | Hasil pemeriksaan F-01–F-17 dan rencana lanjutan dicatat di [review UI development notes](../plans/2026-11-08-review-ui-development-notes.md); pertanyaan yang belum diputuskan tetap terbuka. |
| 8 Nov 2026 | Pengguna memilih draf hasil pengembalian berlabel Perlu revisi, AV tetap outstanding sampai RC disetujui dan penyelesaiannya dikonfirmasi Finance, serta aksi membuat PO/RC dari induk dengan pengecualian PO tanpa PR. | Keputusan arah; detail konfirmasi Finance dan aturan pengecualian perlu dirinci. Belum diimplementasikan. |
| 8 Nov 2026 | Pengguna menetapkan Head hanya dapat membuka lampiran dokumen yang ditugaskan kepadanya dan meminta rincian konfirmasi penyelesaian RC dibahas dengan Finance. | Perlu perubahan otorisasi dan pengujian; belum diimplementasikan. |
| 8 Nov 2026 | Pengguna meminta setiap tahap implementasi menyertakan audit kode dengan Ponytail dan audit antarmuka dengan taste skill. | Checklist audit dan verifikasi ditambahkan pada rencana review UI; belum ada audit implementasi baru yang dijalankan. |

**Progres:** frontend memakai API lokal dengan SQLite dan file lokal; formulir, identitas pemilik, atasan, dan pembatasan akses awal tersedia untuk uji data dummy. Uji otomatis, alur PR di browser, lampiran dan layar 390 px sudah diperiksa. Skenario lain belum semuanya diuji melalui browser; pajak/IAM, kebijakan akses produksi dan integrasi SharePoint menunggu konfirmasi dan pekerjaan lanjutan. Perbarui tabel ini ketika ada keputusan atau perubahan rencana berikutnya.

## Isian dan relasi untuk dibahas

| Jenis | Isian dan alur yang perlu dicakup |
|---|---|
| PR | Judul, cabang, tujuan, anggaran, tanggal kebutuhan; subtotal, biaya lain, diskon, pilihan dan nominal PPN/PPh; nomor IAM, atasan tahap 1, nomor PR bila berlaku dan lampiran. |
| PO | Data umum, kategori, PR induk jika berlaku; vendor dan kode, syarat bayar/pengiriman; metode dan rekening; subtotal, biaya lain, diskon, PPN/PPh; nomor IAM, nomor kontrak jika ada, atasan dan lampiran. |
| AV | PO disetujui jika ada; tanpa PO isi data yang diperlukan, termasuk cabang, anggaran dan penerima; tanggal jatuh tempo dan selesai kegiatan; nilai dan pajak, pembayaran, rekening, atasan dan lampiran. Jika berinduk PO, konfirmasi data yang diturunkan dan boleh diubah. |
| RB | Judul, cabang, tujuan, anggaran, jatuh tempo, nilai dan pajak, metode dan rekening, vendor jika ada, atasan dan lampiran. Putuskan nasib kategori serta tanggal transaksi yang sudah ada di prototipe. |
| RC | Pilih AV milik pemohon yang telah dibayar; cabang, anggaran, tujuan dan rincian realisasi; sisa dana kembali ke Caready disertai bukti, kekurangan ke karyawan disertai rekening, atau nilai sama; atasan dan lampiran. Tidak ada kolom PPN/PPh pada screenshot RC. |
| PV | Tidak ada formulir draf PV untuk sementara sesuai arahan pengguna. Data induk, pembayaran dan status persetujuan/pembayaran terpisah terlihat dalam daftar sumber; mekanisme pembentukan dan pencatatan PV masih perlu review. |

Cabang yang diminta: Bekasi, Semarang, Medan, Makassar, Surabaya, Pekanbaru, Palembang dan Cibinong. Konfirmasi apakah Pusat tetap menjadi pilihan. Filter perlu menyediakan pilihan tersebut meski belum ada transaksi.

## Perhitungan pajak

Pengguna menetapkan nominal pajak dihitung otomatis dari pilihan dropdown. Usulan pola: pilih jenis/tarif PPN dan PPh termasuk pilihan tanpa pajak; sistem menghitung nominal dan menampilkan total serta nilai setelah potongan. Pilihan, dasar dan hasil disimpan agar dapat diperiksa kembali. Ini tidak menetapkan tarif hukum atau rumus final.

Rumus prototipe PO saat ini: dasar = subtotal + biaya lain − diskon; PPN dan PPh dihitung dari dasar; hasil dibulatkan ke rupiah; total = dasar + PPN − PPh. Ini hanya perilaku prototipe, belum disahkan Finance, dan tidak boleh diasumsikan berlaku untuk seluruh jenis transaksi atau semua pilihan pajak. Finance perlu menetapkan daftar opsi, dasar masing-masing, urutan diskon/biaya, pembulatan dan perbedaan total pengajuan versus nilai dibayar. Uji tanpa pajak, masing-masing pajak, keduanya, nol dan batas nominal setelah aturan disahkan.

**Pemeriksaan tambahan:** DJP menjelaskan PPh Pasal 23 sebesar 2% dari jumlah bruto berlaku untuk imbalan jasa tertentu sesuai ketentuan; pemotongan mengurangi pembayaran ke penerima. Tidak semua jasa memakai PPh 23 dan dasar jasa tidak otomatis sama dengan seluruh PO bercampur barang dan jasa. Sumber: [DJP PPh 23/26](https://www.pajak.go.id/id/pph-pasal-2326) dan [DJP PPh 23](https://pajak.go.id/id/pph-pasal-23). Untuk perencanaan, bedakan nilai jasa yang menjadi dasar PPh, nominal PPh dan jumlah dibayarkan; pilihan jenis pajak harus sesuai transaksi dan ditinjau Finance.

Contoh `C:/Users/Bernard/Downloads/Purchase Order.pdf`: subtotal Rp27.642.193, diskon Rp1.382.110, PPN Rp2.888.609, PPh 23/21 Rp0 dan total Rp29.148.692. Setelah diskon nilainya Rp26.260.083; PPN pada contoh setara kira-kira 11% dari angka tersebut setelah pembulatan. Satu contoh tidak membuktikan rumus universal maupun alasan PPh nol. Verifikasi perlakuan pajak transaksi dan faktur dengan Finance. Rencana tidak menetapkan 11% sebagai tarif PPN hukum: [DJP menjelaskan penghitungan 12% dengan DPP nilai lain 11/12 untuk cakupan tertentu](https://pajak.go.id/id/siaran-pers/ppn-2025-kebijakan-baru-beban-pajak-tetap-ringan-untuk-masyarakat), sementara objek atau skema khusus dapat berbeda.

## IAM dan PR induk — interpretasi sementara

- Screenshot PR menamai bagian IAM dengan ambang Rp5.000.000 sebelum pajak dan menyediakan nomor IAM. Dugaan: permintaan di atas atau sama dengan batas tersebut memerlukan persetujuan/dokumen IAM sebagai dasar pengadaan. Apakah yang dibandingkan subtotal saja atau nilai lain sebelum pajak, dan apakah nomor maupun berkas keduanya wajib, belum terbukti.
- Screenshot PO menyebut ParentPRID wajib pada total Rp5.000.000 atau lebih. Dugaan: pembelian umum pada ambang tersebut harus merujuk pengajuan PR yang telah disetujui; referensi membantu menghubungkan PO dengan otorisasi sebelumnya. Basis nilai yang tepat tetap belum pasti.
- Screenshot PO menyebut pembayaran rutin dan mobilisasi dikecualikan dari PR, IAM dan nomor kontrak, dengan invoice wajib. Beranda lama menyebut lampiran kontrak untuk pembayaran rutin tanpa PR. Nomor kontrak dan lampiran kontrak berbeda; kewajiban lampiran belum bisa diputuskan dari sumber yang berbeda ini.
- Ambang kelengkapan dokumen tidak otomatis mengubah tahapan persetujuan pada rancangan yang dicatat di BSD. Jangan menegakkan dugaan sebagai aturan final sebelum pemilik proses mengonfirmasi.

## Revisi, persetujuan, dan lampiran

- Jika pengajuan salah atau ditolak untuk diperbaiki, kembalikan ke draf yang sama agar pemohon memperbaiki dan mengajukan kembali. Seluruh tahapan persetujuan dimulai lagi sejak awal untuk setiap alur; keputusan sebelumnya tetap menjadi riwayat dan tidak dihitung sebagai persetujuan putaran baru. Hubungkan riwayat dan alasan secara otomatis tanpa meminta reference ID manual. Notifikasi dan identitas nomor pada setiap putaran masih perlu disepakati.
- Pemohon tidak boleh menjadi penyetuju pengajuannya sendiri. Pengajuan dibuat oleh Pengaju/staf, termasuk untuk kebutuhan yang berasal dari GM atau BOD. Pemohon memilih atasan tahap 1. Jika atasan belum dapat menyetujui, pengajuan menunggu sampai atasan kembali aktif dan menyetujui; tidak ada skip atau pengganti otomatis. Jika satu orang memegang lebih dari satu peran, larangan self-approval tetap berlaku; penanganan konflik identitas lainnya perlu ditetapkan bila kasusnya memang ada.
- Rancangan yang dicatat dalam BSD adalah atasan → Bu Ayu → Hery dan Hashimoto paralel; keduanya menyetujui. Perlakuan satu penolakan ketika tugas paralel masih terbuka perlu diputuskan.
- Lampiran harus menyimpan isi file, bukan hanya metadata. Pengaju boleh membuka lampirannya sendiri. Admin, BOD, GM dan Atasan boleh membuka lampiran; Finance juga boleh membuka lampiran yang diperlukan untuk memproses PV dan pembayaran. Apakah setiap peran tersebut dapat membuka seluruh lampiran atau hanya dokumen terkait masih harus dikonfirmasi. Tetapkan penyimpanan, batas file, cakupan izin, penanganan kegagalan dan retensi sebelum rencana teknis final. Verifikasi dengan mengunggah, menyimpan, membuka kembali dan memeriksa penolakan akses oleh pihak yang tidak berhak.

### Daftar, detail, dan lampiran

Pengguna menyatakan daftar pengajuan dapat dilihat secara umum dan detailnya juga dapat dilihat, sementara lampiran tidak otomatis terbuka untuk semua orang. Informasi pribadi tidak boleh terlihat secara umum. Untuk nomor rekening dan nama pemilik rekening, pengguna mengizinkan Pengaju, GM, BOD, Admin dan Finance. Cakupan Pengaju diasumsikan hanya pada pengajuannya sendiri dan masih perlu dikonfirmasi; Atasan tidak termasuk dalam daftar akses rekening kecuali juga memegang peran yang diizinkan. Pengaju dapat membuka lampiran pengajuannya sendiri; pihak lain mengikuti hak lampiran di atas. Hak membuka lampiran tidak otomatis memberi hak melihat informasi pribadi dalam detail maupun isi file. Klasifikasi informasi pribadi lain masih perlu dikonfirmasi. "Umum" belum didefinisikan apakah seluruh akun masuk atau publik tanpa akun; jangan mengasumsikan akses anonim. Akses melihat detail tidak memberi hak mengedit atau menyetujui.

Capture 003 menunjukkan daftar “Pengajuan saya” dan “Menunggu persetujuan saya”, serta tautan ke buku besar. Capture 012 menunjukkan daftar ringkasan dengan nomor, judul, jenis, nilai, tahap, status, pembayaran, pemohon dan waktu dibuat. Screenshot adalah contoh tampilan, bukan bukti lengkap hak akses atau seluruh kolom detail; tampilan detail terbuka tidak terlihat dalam screenshot tersebut. Tetapkan informasi yang ditampilkan pada detail, terutama rekening dan data sensitif, serta cakupan peran berdasarkan keputusan pengguna. Periksa hak file pada akses langsung selain tampilan detail.

## Peran dan kewenangan untuk review

Peran yang diminta: **Atasan**, **GM**, **BOD**, **Pengaju**, **Admin**, dan **Finance**. Usulan nama Atasan adalah **Atasan Langsung**, karena screenshot RC menyebut atasan langsung dan nama ini menjelaskan fungsi tahap pertama; nama belum disahkan. Pengajuan dibuat melalui Pengaju/staf, termasuk ketika ide atau kebutuhan berasal dari GM/BOD; alur persetujuan tetap sama. Identitas pemohon dan penyetuju harus dibandingkan pada setiap tahap, termasuk ketika seseorang memiliki lebih dari satu peran. Aturan apakah peran selain GM/BOD dapat merangkap Pengaju perlu diperjelas; jangan mengasumsikan seluruh peran dapat mengajukan langsung.

Rantai yang sebelumnya dicatat adalah Atasan Langsung → Bu Ayu → Hery dan Hashimoto paralel. Hubungan orang dan jabatan GM/BOD dengan tahap tersebut perlu dikonfirmasi; daftar peran baru tidak otomatis menetapkan orang tertentu maupun mengubah persyaratan kedua BOD. Finance kini peran tersendiri dan boleh membuka lampiran yang diperlukan untuk PV dan pembayaran; kemampuan membuat atau memproses PV serta mencatat pembayaran masih perlu ditetapkan secara eksplisit.

## Urutan pekerjaan setelah rancangan disetujui

1. Sahkan matriks kolom, cabang, kondisi wajib dan relasi PR/PO/AV/RB/RC/PV; periksa skenario berinduk dan tanpa induk.
2. Sahkan rumus, opsi pajak dan batas IAM/PR; verifikasi contoh perhitungan dan kasus batas dengan Finance.
3. Sahkan identitas tahap persetujuan, konflik peran dan cakupan hak lampiran; periksa pengembalian ke draf, pengulangan seluruh tahap, atasan tidak aktif dan akses.
4. Susun rencana teknis terperinci berdasarkan keputusan tersebut, termasuk penyimpanan, migrasi data prototipe, validasi dan tes; tidak mengasumsikan prototipe saat ini siap produksi.
5. Implementasi hanya setelah review dan persetujuan pengguna; uji setiap alur, perhitungan, akses dan lampiran. Responsif tetap dicatat sebagai pekerjaan tersendiri sesudah kebutuhan alur disepakati.

## Pertanyaan terbuka prioritas

1. Opsi dropdown dan basis perhitungan PPN/PPh apa yang dipakai Finance untuk tiap transaksi? Sediakan contoh invoice lengkap dan hasil hitung yang diharapkan.
2. Untuk IAM dan PR induk, apa dasar nilai Rp5 juta, mana yang wajib, dan bagaimana pengecualian rutin/mobilisasi serta lampiran kontrak?
3. Pastikan nama dan identitas tiap tahap, serta apakah peran selain GM/BOD dapat merangkap sebagai Pengaju.
4. Apakah daftar dan detail umum berlaku untuk semua akun yang masuk? Apakah akses Pengaju terhadap data rekening hanya untuk pengajuannya sendiri? Data lain apa yang termasuk informasi pribadi, dan apa cakupan lampiran bagi setiap peran penyetuju?
5. Apakah Pusat tetap menjadi cabang? Apa kewenangan Finance untuk PV dan pembayaran, dan bagaimana PV dibuat tanpa draf?
6. Bagaimana jumlah PV per induk, pembayaran parsial, aturan RC dan kalender hari kerja berlaku dalam praktik?

## Pembaruan berdasarkan eWebERP — 8 November 2026

Pembaruan ini melengkapi rencana di atas; temuan eWebERP adalah contoh operasional, sedangkan screenshot SharePoint dan keputusan pengguna adalah sumber kebutuhan pengajuan BLC. Nama PR/PO pada kedua sistem tidak otomatis berarti objek, kewajiban, atau tahapan persetujuannya identik. Pemeriksaan eWebERP hanya membaca daftar dan detail; tidak ada transaksi yang dibuat atau disimpan.

### Bukti, dampak, dan batasnya

| Bukti yang dilihat | Dampak pada rencana lokal | Batas bukti |
|---|---|---|
| Contoh PR eWebERP memiliki pemohon, divisi, tujuan, usulan supplier, catatan, serta baris barang/jasa dan kuantitas/satuan; contoh yang dibuka tidak menampilkan harga per baris. | Pertimbangkan data divisi, usulan supplier, dan rincian item PR. Pertahankan estimasi nilai/pajak yang sudah diminta pengguna untuk formulir BLC. | Tidak membuktikan seluruh PR tanpa harga atau setiap kolom wajib. |
| Contoh PO eWebERP memuat supplier, employee, tujuan dan tanggal kirim, mata uang/kurs, syarat kredit, catatan, rincian item, jumlah, satuan, harga, diskon dan PPN termasuk opsi Include. | Tambahkan rincian item dan penjelasan pembayaran ke rencana PO, sambil membedakan pihak vendor dan penerima pembayaran. | Belum membuktikan bahwa semua kolom harus diisi di BLC, rumus pajak universal, atau integrasi otomatis ke eWebERP. |
| Reimbursement muncul untuk beberapa jenis biaya; pada satu contoh pembelian, supplier berkategori umum dan employee kosong. | Pisahkan informasi toko/vendor dari penerima penggantian; dukung bukti dan uraian biaya. | Supplier atau employee pada satu contoh tidak menentukan penerima pembayaran untuk seluruh kasus. |
| Satu DP dicatat di PO vendor dalam Notes sebagai pembayaran bertahap; contoh lain menggunakan kata DP di dalam kata yang tidak relevan. | Bedakan DP kepada vendor dari uang muka kegiatan kepada karyawan dan jangan mengklasifikasikan hanya dengan pencarian teks. | Belum terbukti apakah contoh tersebut dibayar melalui beberapa PV, apakah seluruh DP mengikuti pola yang sama, atau apakah ia memerlukan RC. |
| Dalam satu PO realisasi, Notes mencatat total advance dan sisa; nilai item sama dengan selisihnya. Contoh lain juga menyebut realisasi advance. | Perkuat keterlacakan AV terbayar, jumlah diterima, biaya terealisasi, selisih, dan bukti. | Satu kecocokan aritmetika tidak membuktikan rumus atau tahapan penyelesaian semua kasus. Pengajuan awal advance di eWebERP belum berhasil diidentifikasi. |

Pencarian “uang muka”, “panjar”, dan “down payment” sempat menampilkan `--`; itu bukan bukti bahwa kasusnya tidak ada. Pencarian lain dan navigasi halaman perlu dicoba lagi bila tabel sudah memberikan hasil.

### Keadaan lokal yang diperiksa

- Frontend memakai API lokal; repository menyimpan seluruh workspace sebagai JSON dalam satu baris SQLite dan berkas lampiran di filesystem. Ini cukup untuk prototipe dummy, tetapi bukan bukti kesiapan multi-user atau integrasi SharePoint. `db/schema.sql` adalah rancangan terpisah, bukan skema penyimpanan SQLite yang sedang digunakan.
- PR/PO/RB/AV/RC sudah menyimpan nilai ringkasan; tipe dokumen saat ini belum memodelkan daftar baris barang/jasa seperti pada contoh eWebERP. RB sudah memiliki nama vendor dan rekening penerima, tetapi identitas peran pihak masih perlu diperjelas.
- RC sudah menghitung selisih dan server memeriksa AV milik pengaju serta nilai PV yang dibayar. Prototipe membatasi satu RC per AV; kesesuaian batas tersebut belum dikonfirmasi.
- RB memiliki input jumlah bukti dengan nilai minimum satu, tetapi jumlah tersebut bukan bukti bahwa file berhasil disimpan; submit server belum memeriksa keberadaan lampiran kuitansi RB. Akses file dan data pribadi perlu diuji untuk setiap peran serta jalur API, bukan hanya tampilan.
- Server membatasi satu PV untuk satu dokumen sumber dan mencatat status dibayar sekaligus. Jangan menyimpulkan bahwa contoh DP pasti memerlukan perubahan ini sebelum cara pembayaran aktual dikonfirmasi.
- Peran tahap kedua masih memakai identitas `AYU` dalam kode; label frontend menyebut GM sementara label server menyebut verifikator keuangan. Samakan pemetaan peran dengan keputusan pengguna setelah identitas tahap kedua dikonfirmasi.
- Akun demo dan secret lokal belum memadai untuk data riil. Hak akses awal untuk rekening dan lampiran tersedia, tetapi audit detail, ekspor, file langsung, catatan bebas, serta cakupan atasan/Finance belum lengkap.
- Pemeriksaan pada 8 November: `npm test` lulus 37 tes pada 9 berkas dan `npm run build` lulus. Hasil ini menguji cakupan yang sudah ditulis, bukan seluruh alur bisnis, keamanan, atau responsivitas.

### Pembagian pekerjaan yang diusulkan

**P0 — Keandalan dan batas akses untuk uji dummy.**

1. Periksa dan perbaiki validasi RB: draf boleh disimpan belum lengkap, tetapi saat submit harus ada file bukti yang benar-benar tersimpan jika kewajiban bukti mengikuti rancangan BLC. Uji tanpa file, dengan file, setelah restart, dan akses oleh peran yang berhak/tidak berhak.
2. Audit aturan server untuk pemilik, atasan terpilih, GM, BOD, Admin dan Finance; rekening hanya untuk pemilik pengajuan, GM, BOD, Admin dan Finance sesuai keputusan pengguna. Uji daftar, detail, ekspor, unduh langsung, serta kemungkinan data pribadi masuk ke kolom bebas. Cakupan lampiran atasan/Finance yang belum ditetapkan tidak boleh dianggap sudah sah untuk produksi.
3. Uji ulang revisi ke draf, pengajuan ulang dari tahap pertama, larangan menyetujui sendiri, penolakan pada tahap paralel, serta penantian atasan. Pertahankan riwayat keputusan putaran sebelumnya.

**P1 — Rincian pengajuan dari bukti yang tersedia.**

1. PR: rencanakan divisi, usulan supplier, dan beberapa baris uraian barang/jasa, kuantitas dan satuan. Gunakan bidang yang relevan dengan BLC tanpa menghapus nilai perkiraan, IAM, atasan atau lampiran yang sudah diminta.
2. PO: rencanakan beberapa baris item dengan kode/uraian, kuantitas, satuan, harga dan diskon; pastikan subtotal dan total tidak bertentangan dengan rincian. Pemetaan mata uang, kurs, pengiriman, syarat kredit, serta opsi PPN Include dinilai berdasarkan kebutuhan BLC, bukan dijadikan wajib hanya dari contoh.
3. RB: jelaskan toko/vendor dan penerima reimbursement sebagai informasi berbeda; kategorikan biaya dan bukti. Uji bahwa data penerima serta rekening tidak tampil untuk pihak tanpa hak.
4. AV/RC: bedakan tujuan uang muka kegiatan dan DP vendor sebagai informasi eksplisit atau keterangan, tanpa memaksa keduanya menjadi satu alur. RC menampilkan AV terbayar, rincian pengeluaran, selisih dan bukti; perlakuan pengembalian, kekurangan, dan konfirmasi Finance tetap mengikuti keputusan yang telah ada atau ditandai sebagai terbuka.
5. Untuk setiap penambahan data, ubah form, tipe, penyimpanan API dan tampilan detail secara konsisten; pertahankan dokumen dummy lama yang hanya memiliki subtotal. Uji simpan, buka ulang setelah restart, edit, data lama, dan kecocokan total. Pilihan apakah rincian wajib dan bagaimana memperlakukan dokumen campuran masih perlu disahkan.

**P2 — Pembayaran dan aturan yang memerlukan bukti tambahan.**

1. Telusuri kembali contoh pengajuan awal AV di eWebERP, lebih dari satu reimbursement, contoh DP dan pelunasannya, serta realisasi surplus, defisit dan tepat. Cari padanan istilah dan halaman lain yang tersedia; buka detail hanya untuk dibaca.
2. Cocokkan hubungan PR → PO, PO → DP/pelunasan, AV → RC, dan sumber → PV dengan contoh atau penjelasan pemilik proses. Konfirmasi apakah satu sumber boleh memiliki beberapa pembayaran/PV dan apakah realisasi dapat bertahap sebelum mengubah batas 1:1.
3. Konfirmasi dasar dan pembulatan PPN/PPh, jenis pajak, nilai pengajuan versus nilai dibayar, serta contoh campuran barang/jasa dengan Finance. Perhitungan sekarang hanya perkiraan untuk uji dummy; jangan menganggap tarif/rumusnya sebagai kebijakan final.
4. Konfirmasi ambang IAM/PR, pengecualian dan lampiran, siapa penyetuju tiap tahap, bukti yang wajib, serta tanggung jawab Finance untuk penyelesaian RC dan PV.

**P3 — Penyelesaian lokal dan persiapan migrasi.**

1. Jalankan pengujian end-to-end dummy untuk PR, PO, RB, AV → PV → RC surplus/defisit/sama, pengembalian ke draf dan akses peran; uji data tersimpan setelah restart.
2. Uji responsif navigasi, formulir, detail, lampiran dan tabel pada ponsel, tablet dan desktop, termasuk keyboard dan tanpa overflow yang menghalangi tindakan.
3. Inventarisasi dan pemetaan sumber data/ID/berkas untuk SharePoint; tentukan sumber kebenaran, identitas dan izin bersama admin tenant, lalu uji migrasi dengan data tersamarkan. Belum ada integrasi atau izin untuk menulis ke sistem operasional.

Prioritas di atas adalah pembagian rencana, bukan klaim fitur baru telah diimplementasikan. P0 dan bagian P1 yang tidak bergantung pada aturan bisnis yang belum pasti dapat dikerjakan pada prototipe dummy; aturan pajak, pembayaran bertahap, IAM dan integrasi produksi tetap menunggu bukti atau konfirmasi terkait.

### Rencana tampilan dashboard dan progres persetujuan

- Susun ulang kelompok kartu dashboard dan panel aktivitas agar proporsional pada desktop, tablet dan ponsel; terjemahkan kode aktivitas menjadi keterangan yang mudah dipahami.
- Adaptasi contoh Build Pipeline untuk menunjukkan status tiap tahap persetujuan, tanpa informasi build/deploy. Tampilkan label **Head** pada tahap pertama. Usulan label tahap kedua adalah GM dan tahap akhir BOD, tetapi pemetaan jabatan tahap kedua belum dipastikan.
- Progres di daftar dan detail mengambil status dari pengajuan sebenarnya; tampilkan tahap aktif, selesai, belum dimulai, dan dikembalikan. Dua keputusan BOD yang paralel harus terlihat terpisah atau sebagai jumlah keputusan, bukan dianggap selesai setelah satu persetujuan.
- Pengajuan ulang dimulai dari tahap pertama; riwayat putaran sebelumnya tetap dapat ditelusuri. Jangan mengubah kewenangan atau aturan backend hanya untuk mengganti label.
- Bedakan progres persetujuan dari status pembayaran dan realisasi. PV tidak diberi draf atau tahap persetujuan baru tanpa dasar; tampilkan status yang benar-benar tersedia.
- Uji status draf, menunggu setiap tahap, BOD sebagian/selesai, dikembalikan dan diajukan ulang, serta layar sempit dan navigasi keyboard. Periksa bahwa detail dan aktivitas tidak membuka informasi pribadi bagi peran yang tidak berhak.
- Progres ini masih berupa rencana; tidak ada perubahan UI atau logika yang dilakukan dari keputusan label tersebut.

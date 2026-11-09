# Peninjauan UI Development Notes — rencana untuk review

**Tanggal:** 8 November 2026  
**Status:** rancangan untuk dibahas; belum ada perubahan aplikasi berdasarkan dokumen ini.  
**Sumber:** `C:/Users/Bernard/Downloads/UI-Development-Notes.md`, keputusan pengguna, pemeriksaan kode/API lokal dan tampilan browser. Temuan dari screenshot notes adalah hipotesis sampai diperiksa pada kondisi saat ini.

**Progres implementasi:** akses lampiran Head dibatasi menurut penugasan; validasi bukti RB dilakukan di server; label Perlu revisi dan aksi PO/RC dari induk ditambahkan; ringkasan lintas jenis dan sebagian tata letak diperbaiki. Tes otomatis dan build lulus. Konfirmasi Finance untuk RC, rincian item, audit menyeluruh, dan verifikasi seluruh ukuran layar masih belum selesai.

**Pembaruan uji coba:** atas arahan pengguna, konfirmasi Finance sementara ditambahkan: RC harus disetujui; surplus memerlukan bukti pengembalian; defisit memerlukan PV selisih yang sudah dibayar; nilai tepat tidak membutuhkan pembayaran selisih. Aturan ini adalah asumsi uji coba, bukan kebijakan perusahaan yang telah disahkan. Skenario akhir ke akhir untuk ketiga hasil masih perlu diuji.

## Keputusan yang dipertahankan

- Daftar dan detail pengajuan boleh dilihat secara umum oleh pengguna yang login. Informasi pribadi, rekening dan lampiran tetap dibatasi menurut peran dan kepemilikan. Pada 8 November pengguna mengonfirmasi kembali bahwa pembatasan menyeluruh menurut cabang pada notes tidak menggantikan keputusan ini. Akses anonim tidak diasumsikan.
- Rekening dan nama pemilik rekening: pemilik pengajuan, GM, Direksi, Admin dan Finance. Pengaju dapat membuka lampirannya sendiri. Pengguna menetapkan Head hanya dapat membuka lampiran pada dokumen yang ditugaskan kepadanya; cakupan lampiran Finance tetap perlu dipastikan.
- PO tanpa PR tetap dimungkinkan sesuai pengecualian; dasar nilai, jenis pengecualian, dan lampiran wajib masih memerlukan konfirmasi pemilik proses. Jangan mewajibkan setiap PO memiliki PR berdasarkan notes.
- Jika Head/approver yang ditunjuk tidak aktif, pengajuan menunggu; tidak ada delegasi otomatis. Pengajuan untuk diperbaiki kembali ke draf yang sama dan mengulang seluruh tahap persetujuan. Komentar pengembalian wajib di backend saat ini.
- Pengguna memilih draf hasil pengembalian ditandai **Perlu revisi**; usulan penolakan final dan pembatalan belum dimasukkan sebagai keputusan baru.
- Pengguna memilih AV tetap outstanding sampai RC disetujui dan penyelesaiannya dikonfirmasi Finance. Pengguna meminta cara konfirmasi untuk surplus, tepat dan defisit dikonfirmasi kepada Finance; aplikasi saat ini belum memiliki tahap konfirmasi Finance yang terpisah.
- Pengguna menyetujui aksi **Buat RC** pada AV terbayar dan **Buat PO** pada PR, dengan jalur pengecualian PO tanpa PR tetap tersedia.
- Label tahap yang disepakati adalah **Head → GM → Direksi**. Dua keputusan Direksi tetap paralel dan keduanya diperlukan pada implementasi saat ini; nilai nominal tidak otomatis mengubah tahap. PV sementara tidak memiliki draf tersendiri.
- Aplikasi sekarang hanya untuk data dummy pada server lokal; SharePoint belum terhubung. Peninjauan ini tidak mengizinkan penulisan ke eWebERP/SharePoint.

## Hasil pemeriksaan F-01 sampai F-17

Status **Ada** berarti ada bukti dalam kode atau UI; **Sebagian** berarti bagian temuan ada tetapi kesimpulan/penyelesaiannya belum terbukti; **Belum diverifikasi** berarti butuh pengujian lebih lanjut. Bukti berlaku untuk checkout dan data lokal pada tanggal review.

| ID | Status | Temuan saat ini dan tindak lanjut yang diusulkan |
|---|---|---|
| F-01 | Sebagian; kebijakan notes ditolak | API `/documents` mengembalikan daftar lintas cabang ke akun demo yang diuji. Ini sesuai keputusan akses umum, bukan otomatis pelanggaran. `visibleDocument` menyembunyikan data rekening untuk Head dan pengaju bukan pemilik; file punya pemeriksaan pemilik untuk pengaju. Akses lampiran Head saat ini belum dibatasi ke dokumen yang ditugaskan sebagaimana keputusan terbaru. Data dummy hanya memiliki satu pengaju pemilik sehingga uji antarpengaju, seluruh role, detail, ekspor, data bebas, dan URL file langsung tetap diperlukan. UI beranda menghitung dokumen milik sendiri, tetapi tabel dan badge dapat mencakup semua sehingga perlu label/cakupan yang jelas. |
| F-02 | Ada | `BentoMetrics` menjumlahkan dokumen berstatus APPROVED/PAID kecuali PV, tetapi menyebutnya “Total Nilai Pengadaan”. Label dan definisinya tidak cocok. |
| F-03 | Ada sebagai risiko perhitungan; tidak semua contoh terhitung dua kali di KPI saat ini | Legend grafik menjumlahkan lintas jenis, termasuk PR dan PO yang berhubungan. KPI APPROVED/PAID dapat menghitung ganda ketika keduanya memenuhi filter. Pada data contoh, PO terkait masih ditinjau, sehingga angka KPI saat ini bukan bukti bahwa pasangan itu sudah dihitung ganda dalam KPI. Nilai per jenis tetap perlu definisi dan basis yang konsisten. |
| F-04 | Sebagian | AV `PAID` ditampilkan sebagai “Lunas” sekalipun belum ada RC; itu menggambarkan pembayaran, bukan bukti realisasi selesai. Outstanding bukan kontradiksi finansial dengan sendirinya. Bug lain: setiap RC yang mengacu ke AV, termasuk draf, sudah mengeluarkan AV dari daftar outstanding; indikator visual minimum 12% juga terisi walau angka 0%. Pengguna memilih RC disetujui dan penyelesaian dikonfirmasi Finance sebagai syarat selesai; mekanisme tiap kasus perlu dijabarkan. |
| F-05 | Tidak terbukti sebagai bug render saat ini | Tombol Detail dirender tanpa syarat status. Browser yang diuji memiliki Detail di seluruh 7 baris, termasuk non-draf. Pada layar sempit tombol dapat berada di luar area awal tabel; cek keterlihatan dan aksesnya pada ukuran lain. |
| F-06 | Sebagian | Pada viewport browser 956 px, tabel 1.267 px berada dalam wadah 866 px dan dapat digeser horizontal; kolom aksi tidak sticky. Ukuran 1366/1440/1920 belum diuji pada sesi ini, sehingga masalah di setiap ukuran itu belum dinyatakan terkonfirmasi. |
| F-07 | Sebagian | Beranda memiliki tombol PO dan RC mandiri. RC tidak otomatis yatim: pilihan dan submit memeriksa AV milik pengaju dengan PV terbayar; PO boleh tanpa PR sesuai pengecualian. Pengguna menyetujui aksi pada dokumen induk dengan jalur PO tanpa PR tetap tersedia. Nasib tombol mandiri lainnya belum dinyatakan. |
| F-08 | Ada sebagian | Status umum mencampur alur approval dan pembayaran; pengembalian aktual menjadi `DRAFT` dengan status tahap/riwayat ditolak dan alasan wajib. Belum ada status final ditolak atau dibatalkan yang terpisah. Pisahkan makna tampilan revisi dan pembayaran; jangan menambah keputusan final atau pembatalan tanpa kesepakatan. |
| F-09 | Ada | Tidak ada indikator varians PR–PO. Nilai contoh PR dan PO memiliki komponen pajak/biaya yang berbeda, sehingga perbandingan subtotal atau total harus ditetapkan sebelum memberi peringatan. Persetujuan tambahan bukan aturan yang sudah disepakati. |
| F-10 | Ada | Merah digunakan untuk brand sekaligus status sedang ditinjau dan bagian grafik. Usulan: pertahankan merah brand untuk identitas/aksi, gunakan semantik status berbeda untuk kondisi normal, dengan ikon dan teks. |
| F-11 | Sebagian | Progres menampilkan Head, GM, Direksi dan jumlah persetujuan Direksi paralel; detail memiliki waktu keputusan dan nama dua Direksi. Identitas Head aktif/penyetuju lain serta lama menunggu belum ditampilkan secara lengkap; waktu mulai tahap dan SLA perlu definisi sebelum ditambah. |
| F-12 | Ada; bukan bug berdasarkan keputusan saat ini | Semua memakai rantai yang sama, sesuai instruksi sebelumnya bahwa alur tetap sama. Matriks nominal hanya menjadi usulan jika kebijakan bisnis berubah. |
| F-13 | Sebagian | Filter “Menunggu Tindakan Saya” juga ada pada pengaju. Draf memang dapat memerlukan tindakan pengaju, tetapi filter saat ini tidak membatasi draf ke pemilik ketika dokumen umum ditampilkan. Perjelas nama dan cakupannya. |
| F-14 | Ada | Badge Dashboard menghitung seluruh dokumen (`docs.length`), bukan tugas; angka kartu tugas dihitung dengan definisi berbeda. Beri definisi atau ganti badge, jangan menganggap keduanya semestinya sama tanpa memilih makna. |
| F-15 | Ada | Grafik berjudul “Volume & Anggaran per Modul” menghitung nilai dokumen, bukan anggaran. Label perlu diganti; jangan membuat data anggaran fiktif. |
| F-16 | Ada | Rupiah penuh dan singkat dipakai pada konteks berbeda; Head/Atasan Langsung dan beberapa istilah Indonesia/Inggris masih bercampur. Pertahankan Google Sans, konsistenkan label, dan tampilkan angka penuh di tabel/detail. |
| F-17 | Ada | Tile Approval Register bercampur dengan aksi membuat dokumen. Usulan pindahkan ke tautan navigasi/sekunder tanpa mengubah hak akses register sebelum disepakati. |

## Hal lain yang ditanyakan notes

| Topik | Keadaan saat ini |
|---|---|
| Notifikasi | Ada antrean outbox lokal dan pesan di aplikasi; tidak ditemukan pengiriman email/WhatsApp yang terhubung. |
| Delegasi | Belum tersedia; pengguna menegaskan menunggu approver yang ditunjuk. |
| Vendor dan cost center | Nama vendor tersedia pada PO dan sebagian AV/RB; tidak ditemukan kolom cost center terstruktur. Kebijakan kewajibannya belum ditentukan. |
| Riwayat | Audit log dan halaman History tersedia; bukan bukti audit yang tidak dapat diubah atau riwayat perubahan tiap field. |
| Ekspor | CSV dan cetak tersedia di frontend dari daftar `documents` yang diterima API; belum mengikuti filter tabel saat ini dan perlu audit cakupan serta data sensitif. |
| Approver | View Head, GM, dan Direksi belum diaudit lengkap dalam notes. Pada pemeriksaan ini view Direksi terlihat; antrean dan tampilan keputusan untuk ketiga peran masih perlu diuji dengan beberapa aktor/keadaan. Tombol Tinjau saat ini muncul untuk role approver pada semua dokumen yang ditinjau, meski bukan tahap aktifnya; backend memeriksa kewenangan saat keputusan. |
| Batas realisasi AV | Form menampilkan H+2 hari kerja dari selesai kegiatan; kalkulasi melewati akhir pekan, belum libur nasional. Konsekuensi keterlambatan dan kebijakan kalender belum terkonfirmasi. |
| Lampiran RB | Form menghitung jumlah bukti, tetapi backend submit belum memeriksa keberadaan file kuitansi RB yang tersimpan. Perlu validasi server dan pengujian hak akses sebelum dinyatakan lengkap. |

## Rancangan tahapan

### Pemeriksaan wajib pada setiap tahap implementasi

- [ ] **Audit kode dengan Ponytail:** gunakan skill `ponytail` dan `ponytail-review` pada setiap kelompok perubahan. Periksa perubahan beserta alur terkait, pemanggil, validasi, hak akses, data yang disimpan, risiko kehilangan data, dan pengujian; pilih perbaikan paling sederhana yang memenuhi kebutuhan. Catat temuan, tingkat prioritas, dan bagian yang belum diperiksa.
- [ ] **Audit UI dengan taste skill:** untuk setiap perubahan antarmuka, gunakan `design-taste-frontend` untuk menilai hierarki, konsistensi, keterbacaan, jarak, kondisi kosong/error, interaksi dan kesesuaian visual dengan aplikasi BLC. Pertahankan Google Sans dan keputusan desain yang disepakati; pedoman skill diterapkan sesuai konteks dashboard, tanpa menambah fitur atau aset yang tidak diminta.
- [ ] **Verifikasi nyata:** jalankan tes dan build yang relevan; untuk UI, periksa tampilan dan interaksi pada browser serta ukuran layar yang ditentukan pada P1, termasuk keyboard dan kontras. Catat ukuran, kondisi yang diuji, hasil, dan keterbatasannya; jangan menyatakan audit atau pengujian lulus tanpa bukti.
- [ ] **Tindak lanjut:** selesaikan temuan yang termasuk lingkup rencana. Jika audit menunjukkan kebutuhan perubahan di luar lingkup atau keputusan bisnis yang belum disepakati, hentikan pekerjaan yang bergantung pada keputusan tersebut dan tanyakan kepada pengguna sebelum mengubahnya. Perbarui catatan progres setelah setiap perubahan rencana.
- [ ] **Review akhir:** setelah seluruh tahap yang disetujui selesai, lakukan peninjauan Ponytail terhadap keseluruhan perubahan dan audit visual taste skill terhadap alur UI yang terdampak; laporkan temuan tersisa dan verifikasi yang belum dapat dilakukan.

### P0 — Kebenaran data, privasi, dan definisi

1. Tetapkan matriks **lihat daftar/detail umum**, **lihat rekening**, **akses lampiran**, **ubah**, dan **ambil keputusan**, per identitas dan peran; batasi akses lampiran Head pada dokumen yang ditugaskan dan uji pada API maupun UI untuk dua pengaju, Head yang ditugaskan/tidak, GM, dua Direksi, Admin dan Finance. Pastikan data pribadi tidak keluar melalui catatan bebas, riwayat, ekspor, metadata atau URL file langsung. Jangan membuat pembatasan lintas cabang yang bertentangan dengan keputusan pengguna.
2. Perbaiki pengelompokan KPI dan nama grafik agar definisinya jelas; hindari agregat yang menjumlahkan dokumen induk dan turunan sebagai nilai pengadaan yang unik. Per jenis dokumen tetap tampil dengan definisi jumlah, status dan basis nominal yang dapat diperiksa.
3. Perbaiki logika outstanding agar draf RC tidak otomatis dianggap selesai; AV tetap outstanding sampai RC disetujui dan penyelesaiannya dikonfirmasi Finance. Rincian konfirmasi tiap hasil RC perlu dijabarkan sebelum menetapkan transisi. Nilai nol harus ditampilkan sebagai nol secara angka maupun visual.
4. Bedakan draf baru dan draf yang dikembalikan melalui data/riwayat yang sah; alasan tampil kepada pihak yang berhak dan pengajuan ulang tetap mulai dari Head. Audit aturan validasi bukti reimbursement dan status PV/AV.

**Kriteria:** skenario API berhak/tidak berhak lulus; nilai KPI dapat direkonsiliasi terhadap data dummy per jenis; RC draf tidak menutup AV; draf hasil pengembalian memiliki alasan dan tidak kehilangan riwayat. Kasus bisnis yang belum diputuskan tidak ditegakkan sebagai kebijakan final.

### P1 — Tata letak dan kejelasan tindakan

1. Pastikan tombol Detail dapat dilihat dan dioperasikan untuk seluruh status; evaluasi kolom tindakan sticky atau penyusunan ulang berdasarkan hasil pengukuran nyata. Pada mobile pertahankan bentuk kartu yang sudah tersedia dan pastikan fokus keyboard jelas.
2. Sediakan tampilan beranda yang menjelaskan cakupan angka pengaju dan tabel; pengaturan filter default “Dokumen Saya” dengan opsi daftar umum adalah usulan tampilan, bukan pembatasan akses server.
3. Rapikan kartu, grafik, aktivitas, badge, warna dan bahasa. Aksi normal tidak memakai warna status bahaya; brand merah tetap untuk identitas/aksi. Jangan menghilangkan seluruh aktivitas non-keputusan atau modul kosong tanpa menentukan kebutuhan pengguna.
4. Jelaskan Head → GM → Direksi dari data persetujuan, dengan dua keputusan Direksi paralel, identitas yang tersedia dan alasan pengembalian. Tampilkan usia tunggu/SLA hanya jika waktu mulai tahap dan aturan SLA dapat dibuktikan.
5. Verifikasi viewport 390, 768, 1024, 1366, 1440 dan 1920 px serta navigasi keyboard. Pada 1366 px targetkan tabel/tindakan dapat digunakan tanpa perlu menebak atau kehilangan kolom; alternatif sticky/scroll harus diuji, bukan diasumsikan.

**Kriteria:** setiap dokumen memiliki Detail yang dapat dijangkau; angka dan badge menjelaskan cakupannya; warna bukan satu-satunya penanda status; tidak ada aksi tertutup/terpotong. Audit kontras dan fokus dengan alat yang sesuai, bukan hanya screenshot.

### P2 — Keterkaitan dokumen dan isian yang sudah direncanakan

1. Tampilkan hubungan PR–PO, PO/AV/RB–PV, dan AV–RC ketika hubungan ada, serta identifikasi dokumen tanpa induk yang memang diizinkan. Tetap sediakan PO tanpa PR untuk pengecualian.
2. Sediakan aksi kontekstual dari PR untuk PO dan dari AV terbayar untuk RC, tanpa membuat aturan bahwa semua PO wajib punya PR. RC hanya dapat merujuk AV milik pengaju yang terbayar sebagaimana validasi lokal saat ini. Pertahankan jalur pengecualian PO tanpa PR.
3. Lanjutkan rencana sebelumnya untuk rincian barang/jasa PR/PO, vendor dan penerima RB, rincian realisasi serta bukti tersimpan. Pertahankan data dummy lama dan hitung subtotal secara konsisten.
4. Indikator varians hanya setelah basis perbandingan dan toleransinya ditetapkan; jangan menambah approval otomatis atau membatasi jumlah PV/RC berdasarkan satu contoh.

**Kriteria:** uji jalur berinduk dan pengecualian yang sah; hubungan bertahan setelah restart; rincian dan total konsisten; data lama tetap terbaca. Konfigurasi aturan wajib menunggu konfirmasi.

### P3 — Aturan bisnis dan kesiapan integrasi

- Klarifikasi Finance/Pengadaan: penyelesaian RC untuk surplus, tepat dan defisit; pembayaran parsial/lebih dari satu PV; dasar pajak/PPN/PPh dan pembulatan; ambang IAM/PR; toleransi PO–PR; SLA/kalender dan konsekuensi keterlambatan; penyelesaian PR/PO; cakupan arsip dan cost center.
- Aturan nominal berbeda, delegasi, penerimaan barang, notifikasi eksternal, dan integrasi akuntansi pada notes merupakan usulan lanjutan, bukan pekerjaan otomatis yang sudah disetujui. Delegasi khususnya bertentangan dengan keputusan pengguna saat ini.
- Persiapan SharePoint mengikuti `docs/migrasi-sharepoint.md`: inventaris ID, daftar, tipe data, lampiran, identitas, izin, dan uji data tersamarkan. SQLite lokal saat ini menyimpan state dalam satu baris JSON; skema `db/schema.sql` bukan database runtime. Belum siap transaksi nyata atau migrasi produksi.

**Kriteria:** keputusan tercatat dengan sumbernya; uji end-to-end seluruh jenis dokumen dan pengecualian dengan dummy; rekonsiliasi data, izin, riwayat dan isi file pada lingkungan uji sebelum migrasi produksi.

## Pertanyaan yang masih terbuka

1. Konfirmasikan kepada Finance cara penyelesaian RC untuk surplus, tepat dan defisit, termasuk hubungan dengan bukti pengembalian atau pembayaran selisih. Konfirmasi terpisah belum tersedia dalam aplikasi.
2. Apa cakupan lampiran Finance? Head hanya dapat membuka lampiran dokumen yang ditugaskan. Semua rekening tetap mengikuti keputusan akses pribadi di atas.
3. Angka apa yang menjadi basis perbandingan PR dan PO, toleransinya, dan apa tindakan jika terlampaui? Anggaran/cost center dan SLA belum memiliki definisi yang dapat disimpulkan dari screenshot.
4. Tindak lanjut pajak, IAM, tanggal H+2, PR selesai, jumlah PV/RC dan akses arsip mengikuti pertanyaan terbuka dalam rencana sebelumnya; jangan menganggapnya terjawab hanya oleh notes.

## Bukti dan batas pemeriksaan

- API lokal: Admin, Pengaju, Head dan GM masing-masing menerima tujuh dokumen dari tiga cabang pada saat pemeriksaan; akun pengaju demo merupakan pemilik semua data tersebut. Head tidak menerima nomor rekening pada dokumen contoh yang diuji. Ini bukan audit seluruh kombinasi hak akses.
- Browser Direksi pada viewport 956 × 595: seluruh tujuh baris memiliki tombol Detail di DOM; tabel memerlukan scroll horizontal. Ukuran yang diminta notes dan view pengaju/Head/GM secara visual belum diuji ulang dalam pemeriksaan ini.
- `npm test`: 10 berkas, 39 tes lulus pada 8 November 2026. Ini tidak membuktikan semua acceptance criteria pada notes atau kesiapan produksi.
- Tidak ada implementasi UI/backend yang dilakukan sebagai bagian dari peninjauan ini.

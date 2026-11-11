# Phase 01  /  Alur pengguna

Validasi server tetap otoritatif. Ringkasan memakai source dan laporan HF02-D; PDF v3 asli tidak tersedia. Stage engine yang diuji berbeda dari fallback default.

| Alur | Langkah dan hasil | Kondisi / exception |
|---|---|---|
| Draft | Pemohon  /  pilih PR/PO/GR/AV/RB/RC  /  isi  /  simpan  /  buka kembali/edit. | Hak owner, lampiran dan versi mengikuti server; pertahankan input pada error. |
| Submit | Periksa field/lampiran  /  ajukan  /  lihat status atau error. | GR selesai saat submit tanpa keputusan approval fiktif; konflik versi memerlukan penanganan tanpa kehilangan input. |
| Approve/reject | Buka dokumen eligible  /  tinjau nominal, lampiran dan tahap  /  pilih keputusan  /  hasil/riwayat. | Stage engine memeriksa identitas dan assignment tahap aktif; jalur fallback menggunakan validasi legacy yang berbeda. Perilaku pasca-reject mengikuti respons aktual karena dokumen historis berbeda. |
| Lacak | Detail  /  tahap aktif, menunggu, keputusan dan riwayat. | Stage engine: PR/PO/AV/RB supervisor  /  reviewer  /  dua BOD paralel; PV reviewer  /  Hery  /  Hashimoto berurutan. Orang sama dalam dua assignment tetap dua keputusan; skip hanya jika data menyatakannya. Engine default tidak otomatis aktif. |
| Terbit PV | Finance membuka sumber eligible  /  Buat PV  /  isi form  /  ajukan eksplisit  /  lihat sumber/status. | Persetujuan induk tidak otomatis membuat PV; kelayakan RC defisit dan jumlah mengikuti server. |
| Pembayaran | Finance buka PV disetujui  /  periksa penerima/nilai  /  isi pembayaran/bukti  /  catat  /  lihat hasil. | Nominal dan hak mengikuti validasi server; error menjaga input. |
| Tindak lanjut RC | Finance membuka RC eligible dan mengonfirmasi penyelesaian bila tersedia; RC defisit mengikuti tindak lanjut PV yang diizinkan. | Kelayakan dan perbedaan hasil non-defisit/defisit mengikuti respons server; perlu validasi terhadap Panduan v3 asli. |
| Riwayat | Daftar/detail  /  riwayat  /  aktor, tindakan, waktu, catatan yang tersedia. | Jangan membuat event atau keputusan fiktif. |
| Cari/filter | Cari nomor/judul/tujuan/cabang  /  pilih filter  /  hasil/jumlah  /  reset. | Filter kosong berbeda dari belum ada data; akses mengikuti server. |
| Admin | Admin  /  konfigurasi tersedia  /  tinjau/ubah  /  konfirmasi  /  hasil. | Halaman admin belum terverifikasi; jangan menjanjikan DB-02 sampai DB-06. |

**Pemulihan konflik versi, usulan desain:** jelaskan bahwa data berubah, pertahankan input yang belum dikirim, tampilkan versi terbaru untuk dibandingkan, dan minta pengguna meninjau serta mengirim ulang secara sengaja. Jangan overwrite atau retry otomatis. Ini belum diverifikasi sebagai perilaku aplikasi sekarang; penerapannya perlu diuji pada draft, submit dan keputusan yang memakai versi, serta skenario pembayaran sesuai kontrak endpoint.

**Perbedaan RC yang belum terselesaikan:** `DocumentList.tsx` menyembunyikan konfirmasi untuk DEFICIT, sementara `repository.ts` menerima konfirmasi DEFICIT setelah PV terkait lunas. Jangan menyimpulkan salah satu sebagai aturan final; cocokkan Panduan v3 dan keputusan terbaru sebelum rancangan ini digunakan sebagai spesifikasi implementasi.

Rujukan lebih lanjut: `server/repository.ts`, `server/app.ts`, `src/main.tsx`, `docs/redesign/00-workflow-mapping.md` dan `hotfix-br-app-001-hf02d.md`.
## Referensi dan batas
- [shadcn/ui](https://ui.shadcn.com/), [Dashboard Blocks](https://ui.shadcn.com/blocks/dashboard) dan [Sidebar](https://ui.shadcn.com/docs/components/sidebar): komponen dan shell yang diadaptasi untuk pengadaan, bukan disalin mentah.
- [Radix](https://www.radix-ui.com/primitives/docs/components/dialog): fokus, keyboard dan dialog sebagai target verifikasi.
- [Taste](https://www.tasteskill.dev/docs): satu sistem, hierarki dan ritme; aturan landing page tidak dipaksakan pada aplikasi operasional.
- [Impeccable Operate](https://raw.githubusercontent.com/pbakaus/impeccable/main/skill/reference/mode-operate.md): kejelasan tugas dan pola yang familier; evaluasi manual terbatas, bukan critique lengkap.
- Proyek: `docs/redesign/00-workflow-mapping.md`, `00-visual-coverage-matrix.md`, `hotfix-br-app-001-hf02d.md`, `docs/database/db01-completion-report.md`, dan source saat ini. Panduan v3 asli tidak ditemukan di checkout; ringkasan v3 bersifat sekunder dan perlu dicocokkan.

**Gate:** untuk review; tidak mengaktifkan stage engine, mengubah business logic/database, atau mengotorisasi DB-02 sampai DB-06.

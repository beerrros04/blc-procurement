# Phase 01  /  Audit UX existing

Review awal bersifat single-context. Pada review lanjutan dua reviewer independen memeriksa dokumen dan screenshot historis; Impeccable context dan detector statis satu file dijalankan. Ini bukan critique Impeccable lengkap atau audit UI live; lihat laporan akhir. Screenshot baseline Phase 00 memakai data terisolasi dan bukan bukti UI hari ini identik; lihat `../redesign/00-visual-coverage-matrix.md`.

| ID / severity | Bukti dan perilaku terlihat | Dampak | Solusi usulan |
|---|---|---|---|
| A1 / sedang | `../redesign/baseline/dashboard-mobile.png`: judul terbungkus empat baris di samping kontrol peran. | Identitas halaman dan tugas sulit dipindai. | Header bertingkat; identitas masuk menu akun. |
| A2 / sedang | `../redesign/baseline/dashboard-desktop.png`: metrik, grafik jenis, aktivitas dan register bersaing. | Pengguna memilah ringkasan sebelum bekerja. | Prioritaskan tugas dan daftar relevan; grafik hanya bila berguna. |
| A3 / sedang | `../redesign/baseline/register-desktop.png`: teks tahap PO/RB terpotong. | Langkah dan penyetuju sulit dibaca. | Label ringkas tanpa potong, detail lengkap dapat diakses keyboard. |
| A4 / sedang (hipotesis) | `../redesign/baseline/form-mobile.png`: form PR panjang, hanya bagian atas terlihat. | Beban mengingat konteks perlu diuji; tidak membuktikan aksi atau scrolling gagal. | Kelompokkan field dan validasi; aksi terjangkau dengan area aman. |
| A5 / sedang | `../redesign/baseline/detail-desktop.png`: progres dan rincian tersusun dalam kartu bertingkat. | Banyak batas visual menghambat pemindaian. | Header identitas/status, tahap, rincian dan lampiran dalam section datar. |
| A6 / sedang | `../redesign/baseline/rev01-role-finance.png`: Finance melihat daftar pengajuan sendiri yang kosong. | Tugas keuangan tidak terlihat di titik awal; dampak adalah hipotesis. | Usulkan pintu Finance dengan dokumen eligible dan PV menunggu bayar. |
| A7 / tinggi historis | `../redesign/00-accessibility-baseline.md` dan screenshot export: pilihan format terhimpit di tiga viewport. | Sulit membandingkan opsi. | Opsi satu kolom, deskripsi dan aksi jelas; uji ulang. |
| A8 / sedang | `design.md` dan `src/components/DocumentList.tsx` memakai #E51937; brief menetapkan #DC2626. | Risiko inkonsistensi brand dan state. | Token semantik dan uji kontras; status disertai teks/ikon. |

Cakupan bukti tidak meliputi screenshot daftar transaksi umum, approval aktif/reject, PV/payment dan admin. `rev01-docs1440.png` menunjukkan Approval Docs (lampiran), bukan daftar transaksi umum. Source menunjukkan struktur tetapi bukan audit visual. Profil/admin management belum ditemukan sebagai halaman aktif. Baseline aksesibilitas hanya parsial; kontras, seluruh keyboard, screen reader, touch, loading dan error belum diverifikasi.

**Kritik rancangan awal:** pemisahan approval/finance bisa disalahartikan sebagai hak baru. Refine: menu dan aksi mengikuti identitas, assignment dan kondisi server; tampilkan alasan aksi tidak tersedia. Rancangan belum dirender sehingga kritik visual final belum dilakukan.
## Referensi dan batas
- [shadcn/ui](https://ui.shadcn.com/), [Dashboard Blocks](https://ui.shadcn.com/blocks/dashboard) dan [Sidebar](https://ui.shadcn.com/docs/components/sidebar): komponen dan shell yang diadaptasi untuk pengadaan, bukan disalin mentah.
- [Radix](https://www.radix-ui.com/primitives/docs/components/dialog): fokus, keyboard dan dialog sebagai target verifikasi.
- [Taste](https://www.tasteskill.dev/docs): satu sistem, hierarki dan ritme; aturan landing page tidak dipaksakan pada aplikasi operasional.
- [Impeccable Operate](https://raw.githubusercontent.com/pbakaus/impeccable/main/skill/reference/mode-operate.md): kejelasan tugas dan pola yang familier; evaluasi manual terbatas, bukan critique lengkap.
- Proyek: `docs/redesign/00-workflow-mapping.md`, `00-visual-coverage-matrix.md`, `hotfix-br-app-001-hf02d.md`, `docs/database/db01-completion-report.md`, dan source saat ini. Panduan v3 asli tidak ditemukan di checkout; ringkasan v3 bersifat sekunder dan perlu dicocokkan.

**Gate:** untuk review; tidak mengaktifkan stage engine, mengubah business logic/database, atau mengotorisasi DB-02 sampai DB-06.

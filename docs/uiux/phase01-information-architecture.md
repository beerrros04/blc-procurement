# Phase 01  /  Information architecture

Ini usulan navigasi, bukan klaim fitur/route baru telah tersedia. Hak ditentukan server; application role tidak sama dengan approval authority.

```text
BLC Procurement
 /  /  Dashboard / Beranda  /  ringkasan pekerjaan
 /  /  Dokumen  /  semua / milik saya, cari/filter, PR PO GR AV RB RC PV
 /    /  /  Detail  /  rincian, lampiran, tahap, riwayat
 /  /  Persetujuan  /  pekerjaan terkait dan detail keputusan
 /  /  Keuangan  /  menunggu PV, PV/pembayaran, RC sesuai kondisi
 /  /  Administrasi*  /  konfigurasi yang benar-benar tersedia
 /  /  Akun  /  identitas sesi dan keluar; profil mandiri belum dibuktikan
```

*Menu admin merupakan kerangka usulan; API cabang DB-01 ada tetapi halaman pengelolaan belum terbukti. Vendor/bank master dan DB-02 sampai DB-06 tidak digambarkan sebagai operasional. Pengelompokan approval dan Finance perlu divalidasi terhadap hak endpoint sebelum implementasi. Riwayat dan dokumen/lampiran tetap dapat ditemukan dari daftar dan detail.

Penugasan, identitas dan tahap aktif menentukan keputusan; tampilkan data aktual, bukan keputusan fiktif. Stage engine menggunakan feature flag dan memerlukan instance engine; jangan mengklaim seluruh runtime telah menggunakannya (`server/app.ts`).
## Referensi dan batas
- [shadcn/ui](https://ui.shadcn.com/), [Dashboard Blocks](https://ui.shadcn.com/blocks/dashboard) dan [Sidebar](https://ui.shadcn.com/docs/components/sidebar): komponen dan shell yang diadaptasi untuk pengadaan, bukan disalin mentah.
- [Radix](https://www.radix-ui.com/primitives/docs/components/dialog): fokus, keyboard dan dialog sebagai target verifikasi.
- [Taste](https://www.tasteskill.dev/docs): satu sistem, hierarki dan ritme; aturan landing page tidak dipaksakan pada aplikasi operasional.
- [Impeccable Operate](https://raw.githubusercontent.com/pbakaus/impeccable/main/skill/reference/mode-operate.md): kejelasan tugas dan pola yang familier; evaluasi manual terbatas, bukan critique lengkap.
- Proyek: `docs/redesign/00-workflow-mapping.md`, `00-visual-coverage-matrix.md`, `hotfix-br-app-001-hf02d.md`, `docs/database/db01-completion-report.md`, dan source saat ini. Panduan v3 asli tidak ditemukan di checkout; ringkasan v3 bersifat sekunder dan perlu dicocokkan.

**Gate:** untuk review; tidak mengaktifkan stage engine, mengubah business logic/database, atau mengotorisasi DB-02 sampai DB-06.

# Phase 01  /  Responsive strategy

| Lebar usulan | Shell dan data | Aksi dan dialog |
|---|---|---|
| 1200px dan lebih | Sidebar tetap; tabel kolom nomor, cabang, nilai, status/tahap, aksi. | Detail samping jika cukup lebar; form tetap terbaca. |
| 768px sampai 1199px | Sidebar collapsible; judul dan filter membungkus; tabel memprioritaskan kolom penting. | Sheet atau halaman detail jika panel sempit. |
| Kurang dari 768px | Header + menu sheet; tabel menjadi baris bertumpuk dengan label, status, nilai, tahap dan detail. | Form/detail satu kolom full-height; filter sheet; aksi aman dari keyboard dan area perangkat. |

Breakpoint adalah hipotesis; verifikasi 375, 390, 768, 820, 1024 dan 1440, zoom 200%, text scaling, orientasi dan target sentuh. Jangan sembunyikan informasi penting hanya lewat hover. Kontrol berlabel, fokus terlihat, Tab/Shift+Tab, Escape sesuai dialog, kembali fokus ke pemicu, status lewat teks/ikon; hormati reduced motion. Usahakan target 44px dan verifikasi ukuran/spacing aktual.

Loading: skeleton + teks; empty: bedakan data kosong dan filter kosong, tawarkan reset; error: alasan + retry tanpa hapus input; success: status dan langkah selanjutnya. Ini spesifikasi, bukan hasil uji.
## Referensi dan batas
- [shadcn/ui](https://ui.shadcn.com/), [Dashboard Blocks](https://ui.shadcn.com/blocks/dashboard) dan [Sidebar](https://ui.shadcn.com/docs/components/sidebar): komponen dan shell yang diadaptasi untuk pengadaan, bukan disalin mentah.
- [Radix](https://www.radix-ui.com/primitives/docs/components/dialog): fokus, keyboard dan dialog sebagai target verifikasi.
- [Taste](https://www.tasteskill.dev/docs): satu sistem, hierarki dan ritme; aturan landing page tidak dipaksakan pada aplikasi operasional.
- [Impeccable Operate](https://raw.githubusercontent.com/pbakaus/impeccable/main/skill/reference/mode-operate.md): kejelasan tugas dan pola yang familier; evaluasi manual terbatas, bukan critique lengkap.
- Proyek: `docs/redesign/00-workflow-mapping.md`, `00-visual-coverage-matrix.md`, `hotfix-br-app-001-hf02d.md`, `docs/database/db01-completion-report.md`, dan source saat ini. Panduan v3 asli tidak ditemukan di checkout; ringkasan v3 bersifat sekunder dan perlu dicocokkan.

**Gate:** untuk review; tidak mengaktifkan stage engine, mengubah business logic/database, atau mengotorisasi DB-02 sampai DB-06.

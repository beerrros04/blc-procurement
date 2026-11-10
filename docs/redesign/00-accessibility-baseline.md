# REV-002 ? Accessibility baseline
Perangkat: Chromium headless, agent-browser, axe-core 4.12.1. Pemeriksaan bersifat representatif, bukan sertifikasi WCAG; screenshots dan source menjadi bukti.

| Aspek | Hasil | Severity / bukti |
|---|---|---|
| Login keyboard/focus | PARTIAL PASS | Tab pertama memfokuskan email dengan outline terlihat: `baseline/rev01-login-focus.png`; urutan seluruh kontrol belum ditelusuri. |
| Export focus | PARTIAL PASS | 1440: setelah pembukaan fokus `Tutup dialog`; Shift+Tab membungkus ke `Export File`, Tab kembali ke close. Setelah menunggu efek terpasang, Escape menutup dan fokus kembali ke tombol `Ekspor Laporan (13 Kolom)`. Hanya batas siklus dan satu dialog diperiksa, bukan kombinasi screen reader atau seluruh overlay. Implementasi `src/components/ExportModal.tsx:99`. |
| Label | PARTIAL PASS | Snapshot login menunjukkan nama email/password; `sign-in.tsx` menghubungkan `Label htmlFor` dan input id. Snapshot PR menunjukkan label dan approver. Semua form dan validasi belum diaudit. |
| Icon-only names | PARTIAL PASS | Snapshot login: `Tampilkan kata sandi`; export: `Tutup dialog`; detail `Tutup detail` (`DocumentDetailModal.tsx:175`); bukan seluruh ikon aplikasi. |
| Landmark/login heading | ISSUE moderate | axe login: `landmark-one-main` 1 node, `page-has-heading-one` 1 node, `region` 8 nodes; 22 rules pass, 1 incomplete. `ui/sign-in.tsx` menggunakan CardTitle, halaman tidak menyediakan main/h1 yang terdeteksi. |
| Kontras workspace saat export terbuka | ISSUE serious | axe menemukan `color-contrast` 3 nodes: `.nav-active > .nav-item-content > .nav-item-label` dan label dokumen pada dua baris; 11 nodes incomplete (termasuk progress dan teks export), 47 rules pass. Audit page-wide ketika overlay terbuka, sehingga backdrop dapat memengaruhi hasil; verifikasi ulang workspace tanpa overlay sebelum menentukan akar dan rasio warna. Tidak dihitung sebagai bukti bahwa setiap warna gagal. |
| Kontras login | INCOMPLETE | axe login melaporkan 1 node `span[aria-hidden=true]` incomplete; perlu pemeriksaan manual pada kondisi terkait. |
| Responsive export | ISSUE high UX | `rev01-export375.png`, `rev01-export768.png`, `export-desktop.png`: teks pilihan terhimpit, 375 bagian aksi berada di bawah viewport awal. `src/components/ExportModal.tsx` radio cards dan `src/style.css:1671` menerapkan width 100% pada semua input, termasuk radio di flex; hubungan CSS ini adalah kandidat penyebab, belum diuji melalui perubahan gaya. |

Axe menggunakan seluruh dokumen, bukan hanya modal; hasil incomplete bukan PASS atau FAIL. Belum memeriksa semua focus indicator, navigation menu mobile, validasi announcement, contrast states, zoom, screen reader atau perangkat sentuh.

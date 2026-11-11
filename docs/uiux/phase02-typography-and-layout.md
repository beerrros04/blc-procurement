# Phase 02 - Typography and layout

Preview memakai Segoe UI dengan fallback Arial/sans-serif; ini pilihan sistem untuk studi, bukan font final yang sudah dilisensikan lintas platform. Evaluasi rendering platform lain masih diperlukan. Angka memakai `font-variant-numeric: tabular-nums`, nominal rata kanan pada tabel dan tetap utuh pada mobile.

| Peran | Ukuran / line-height / weight | Penggunaan |
|---|---|---|
| Page title | 30px / 1.18 / 650; mobile 26px | Identitas halaman |
| Section | 18px / 1.3 / 650 | Kelompok tugas |
| Card heading / body | 15px / 1.5 / 650 atau 400 | Data dan isi |
| Table / label | 13px / 1.5 / 400 atau 650 | Register dan form |
| Helper / caption | 12-13px / 1.5 / 400 | Konteks dan status |
| Metric | 25px / 1.2 / 650; mobile 22px | Nilai ringkasan |

Spacing 4, 8, 12, 16, 24, 32, 40px; halaman desktop 40px, mobile 16px; panel 22px/17px; field gap 18px; tabel row padding 14px. Tombol/input radius 7px; panel 10px; badge 5px. Base datar dengan border, dropdown mobile satu shadow lembut; dialog/overlay spesifikasi Radix, belum dirender. Hindari nested cards. Satu kepadatan tabel diperlukan; jangan menambah mode spekulatif.

Ikon: Lucide konsisten, ukuran 16px inline dan 20px navigasi, stroke 2; ikon selalu disertai nama untuk aksi penting. Preview ini tidak mengimplementasikan ikon sistem. Motion: feedback hover/press singkat, dialog/drawer seperlunya, tidak ada animasi halaman wajib; hormati `prefers-reduced-motion`. Keyboard dan motion aktual memerlukan uji implementasi.

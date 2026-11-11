# Dashboard approved reference — visual QA dan tambahan design sheet

Status: review visual PO; preview statis terisolasi, bukan kesiapan implementasi. Screenshot 1440, 1280, 768, dan 390 menggunakan viewport tinggi 1000 px; PNG full-page dapat lebih tinggi. Bandingkan `workbench-preview/screenshots/dashboard-approved-comparison.png`.

## Design sheet: penyesuaian dashboard

- Canvas `#f6f6f6`, white surface, brand dan primary `#dc2626`, radius kartu 18 px, shell 24 px, button 14 px. Skala layar: judul 34 px desktop/30 px mobile, heading 16 px, KPI 40 px desktop/34 px mobile; chart label 12 px. Ini spesifikasi visual preview, belum perubahan sistem komponen aplikasi.
- Chart batang PR enam bulan dengan sumbu Rp juta, legenda bulan, tooltip pada hover/focus; chart donut status berlabel jumlah; bar cabang dengan nominal selalu terlihat. Contoh visual final tercantum di screenshot dashboard, bukan gambar design-sheet terpisah.
- Responsive: desktop tiga kolom utama dan tiga sekunder, tablet menumpuk, mobile dua kolom KPI dan panel satu kolom dengan prioritas terlebih dahulu. Navigasi mobile berupa menu toggle. Scope chart dan metrik: lihat `phase02-dashboard-analytics-contract.md`.

## Perbandingan dan kritik

Referensi dan mockup sama-sama memiliki sidebar kosong di bagian bawah, header terpisah, empat KPI, grafik utama + antrean + prioritas dan tiga panel bawah. Perbedaan: angka dan cabang diganti data sintetis yang konsisten; scope PR dan periode dinyatakan; ukuran panel dan ikon tidak identik; mobile menempatkan prioritas sebelum grafik. Tombol bukan transaksi aplikasi.

Dua penilai independen Impeccable melakukan tinjauan visual dan detector secara terpisah. Tinjauan visual menemukan angka chart kecil, bingkai luar kurang jelas, ikon belum seragam, sublabel KPI kurang spesifik. Fokus pencarian ditemukan tertimpa CSS. Perbaikan: ukuran teks analitik dinaikkan, bingkai luar ditambahkan, KPI diperjelas dan `:focus-within` ditambahkan. Ikon masih simbol placeholder dan perlu Lucide konsisten saat implementasi. Detector terakhir menghasilkan satu advisory `repeating-stripes-gradient` untuk garis grid chart; ini penggunaan sumbu, bukan tekstur dekoratif.

Taste: ritme modular, whitespace, skala tipografi dan warna dibaca pada render aktual dibanding referensi; komposisi dipertahankan, merah digunakan untuk fokus. Keterbacaan nominal masih memerlukan uji pengguna di ukuran normal. Tidak ada klaim audit aksesibilitas penuh, overlay Impeccable, snapshot critique resmi, atau uji usability.

## Verifikasi

- `node --check dashboard-approved.js` dan self-check logika: total enam bulan Rp280 juta/20 PR; tiga bulan Rp170 juta/12 PR; empty state, toggle dan Escape PASS pada mock DOM. Belum membuktikan kejadian browser nyata.
- `check.mjs` melaporkan `overflowX:false` pada 1440, 1280, 768, 390; exit 1 karena ekspektasi `.wrap` yang tidak dipakai layout ini. Ini tidak membuktikan overflow internal, clipping tooltip, focus, ataupun aksesibilitas penuh.
- Semua screenshot tersimpan, desktop dan mobile dilihat; comparison dilihat. Browser automation interaktif tidak tersedia karena browser access host unavailable. Tooltip/focus/touch/screen-reader langsung NOT VERIFIED, sebagaimana seluruh kombinasi kontras.
- PR tidak dijumlah dengan PO/PV/Payment Record; nilai dan jumlah chart konsisten. Data model agregasi masih proposal yang memerlukan validasi.
- Konteks Impeccable dibaca; assessment independen dilakukan, tetapi workflow snapshot/overlay resmi belum selesai. Questions skipped: permintaan mengharuskan berhenti setelah mockup dan menunggu review PO.

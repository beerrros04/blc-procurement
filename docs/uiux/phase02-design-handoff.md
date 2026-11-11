# Phase 02 - Design handoff

**IN REVIEW, bukan implementasi.** Preview terisolasi: [Workbench](workbench-preview/index.html). Buka dengan static server pada root `workbench-preview`; link menu berpindah antar `?screen=dashboard|register|form|approval|finance|system`. Data sintetis; tombol aksi tidak menyimpan, memanggil API, atau melakukan pembayaran. Preview bukan implementasi shadcn/Radix dan bukan dasar untuk mengklaim hak akses.

Screenshots berada di `workbench-preview/screenshots/` dengan nama layar-lebar. Semua lima layar tersedia pada viewport 1440x900 dan 390x844; dashboard juga 768x900 dan 1280x900; design sheet pada 1440x900. Gambar full-page lebih tinggi daripada viewport, misalnya dashboard 1440x928 dan form mobile 390x2057. Lihat responsive specifications untuk hasil dan keterbatasan pemeriksaan.

Pertahankan assignment sebagai dasar approval; tahap independen, self-approval mengikuti aturan aktual, PV berurutan, GR tanpa approval, dan Finance menerbitkan PV eksplisit. Baca lintas cabang mengikuti REG-03, mutasi dan data sensitif tetap dibatasi. RC deficit/data historis masih memerlukan keputusan recovery; Panduan v3 asli belum tersedia. DB-02 sampai DB-06, source aplikasi, backend dan deployment di luar scope.

QA residual: interaksi dan hak akses, keyboard/screen reader, seluruh kombinasi kontras, dialog, mobile menu focus, form validation, long values dan state error/loading. Dokumen ini tidak memberi izin Phase 03.

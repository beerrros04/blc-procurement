# Phase 02 - shadcn component specifications

Mapping ini adalah handoff, bukan instalasi atau klaim bahwa preview sudah memakai Radix. Untuk seluruh kontrol: fokus terlihat dengan ring biru, label/nama aksesibel, tidak hanya warna; disabled tidak dapat dipilih, error dijelaskan dekat kontrol, loading hanya saat aksi async relevan. Hover/focus/disabled/error/loading yang tidak relevan ditandai N/A. Uji focus trap, Escape dan pengembalian fokus pada implementasi.

| Komponen | Purpose / variants dan ukuran | Default, hover, error, loading; mobile dan aksesibilitas |
|---|---|---|
| Button | Aksi; primary, outline, ghost, destructive; 40/44px | Hover lebih gelap; disabled jelas; loading mempertahankan label/status. Ikon berlabel; mobile boleh full-width. |
| Input | Teks/angka; satu tinggi 42px | Border input; error teks terhubung; loading N/A; label wajib, numeric input sesuai konteks. |
| Select / Combobox | Pilihan terbatas / daftar dapat dicari; 42px | Nilai dan placeholder jelas; error terhubung; loading untuk opsi async; keyboard/typeahead, popover tidak terpotong. |
| Card | Kelompok informasi; default | Border halus; hover hanya jika interaktif; disabled/error/loading N/A kecuali konten. Jangan bersarang tanpa kebutuhan. |
| Badge | Draft, in review, approved, rejected, paid/unpaid | Teks + warna; tidak interaktif; hover/focus/disabled/loading N/A. |
| Table | Register padat | Angka kanan dan tidak terpotong; loading skeleton, empty/error/retry; mobile baris bertumpuk dengan label dan aksi. |
| Tabs | Beralih dataset | Selected jelas, focus terlihat, disabled bila perlu; error/loading pada panel; keyboard arrows dan label tabpanel; mobile dapat scroll. |
| Sidebar | Navigasi per hak | Active + teks, hover, focus; loading N/A; mobile Sheet dengan close/Escape dan return focus. |
| Dialog / Sheet | Konfirmasi atau detail | Title/description, fokus terperangkap, Escape dan return focus; error/loading di dalam; mobile ruang scroll dan aksi terjangkau. |
| Dropdown Menu | Aksi sekunder | Hover/focus/disabled jelas; error/loading N/A; arrow keys, Escape, collision handling; mobile target sentuh. |
| Alert | Error, warning, info, success | Teks menjelaskan makna/perbaikan; live region sesuai urgensi; tidak bergantung warna. |
| Tooltip | Penjelasan singkat | Hover dan focus; bukan satu-satunya akses informasi penting; Escape, tidak menutup teks utama. |
| Skeleton | Placeholder loading | `aria-busy`/status yang sesuai, tanpa kedipan berlebihan; reduced motion. |
| Form | Label, field, validasi, aksi | Error dekat input dan ringkasan; preserve input pada error; konflik versi perlu review sebelum retry; mobile satu kolom. |
| Sonner / toast | Umpan balik singkat | Success atau error ringkas; live region; kegagalan penting tetap terlihat di konteks, tidak bergantung timeout. |

Referensi [shadcn components](https://ui.shadcn.com/docs/components) dan [Radix](https://www.radix-ui.com/primitives). Preview adalah markup statis; state dan perilaku ini masih harus diuji.

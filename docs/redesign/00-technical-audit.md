# Phase 00 ? Technical architecture audit
Tanggal: 10 November 2026. Status: IN REVIEW. Ruang lingkup adalah working tree saat ini, termasuk perubahan belum di-commit yang telah ada sebelum audit. Tidak mengasumsikan keadaan HEAD sebagai baseline.

| Area | Kondisi aktual dan bukti |
|---|---|
| Runtime | React/React DOM 19, TypeScript 5.8, Vite 6, Tailwind 4, Radix Dialog/Label/Slot/Tooltip, Lucide, Framer Motion: `package.json`. Versi aktual build Vite 6.4.5. |
| Konfigurasi | `vite.config.ts`: React + Tailwind Vite plugin, alias `@`, proxy `/api` ke 3002. `tsconfig.json`: strict, bundler resolution, noEmit, include src dan server. |
| shadcn | `components.json`: default, slate, CSS variables, `src/style.css`, alias `@/`, Lucide. Komponen lokal `src/components/ui/` menggunakan CVA, Radix dan `cn`; keberadaannya tidak berarti seluruh halaman telah migrasi. |
| Token | `src/style.css` memiliki `@theme`, semantic variables dan palet lama; `--primary` dan `--palette-primary-600` adalah #DC2626, namun masih ada #E51937 hard-coded (mis. baris 394, 419), juga warna inline pada TSX. Ini berisiko menimbulkan inkonsistensi saat migrasi. |
| State | `src/main.tsx` App memakai useState/useEffect untuk navigasi tab, dokumen, sesi dan modal; sessionStorage menyimpan token (`src/api.ts`), localStorage menyimpan profil. `src/store/document-store.ts` berisi helper dan implementasi storage lokal; alur App aktif menggunakan API, jangan menganggap seluruh store lokal sebagai server. |
| API/data | `src/api.ts` memanggil `/api/v1`; `server/app.ts` melakukan autentikasi dan dispatch; `server/repository.ts` menjalankan aturan domain dan persistence; `server/index.ts` memilih SQLite `.data/blc-local.sqlite`, payload workspace disimpan di SQLite. Lampiran di filesystem `server/storage.ts`. `db/schema.sql` bukan bukti bahwa runtime menggunakan skema PostgreSQL tersebut. |
| Test | Vitest, 26 file pengujian; tidak ada lint script dalam `package.json`. Build menjalankan typecheck. Tidak ditemukan skrip E2E tersendiri pada scripts. |

Graph `graphify-out/graph.json` dipakai sebagai orientasi, bukan kebenaran final; source dibaca langsung. Indeks codebase-memory dicek pada main, server, store dan types; coverage best-effort bukan bukti kelengkapan. Risiko: file `main.tsx` menggabungkan shell, orkestrasi API dan banyak modal; tiga implementasi dialog (native/custom dan Radix); CSS global dan utilitas coexist. Pilihan target harus diuji bersama kontrak dan state aktual. Referensi resmi: https://ui.shadcn.com/docs/components , https://ui.shadcn.com/docs/theming , https://ui.shadcn.com/blocks .

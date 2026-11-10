# REV-004 ? Evidence and working-tree baseline

## Baseline Git
Pada awal revisi `HEAD 608d061dd1980d14fbc0609f1ea1e35278c9da06`, branch `setup-local-dev`. `git status --short` sudah menunjukkan modifikasi `components.json`, `package*.json`, `src/main.tsx`, `src/style.css`, ApprovalExplorer, DocumentDetailModal, DocumentList, ExportModal, RoleSwitcher, StaffBeranda, sign-in, dan enam file graphify; UI primitives/tests serta `docs/redesign/`, plan shadcn dan folder graphify bertanggal sudah untracked. Semua itu pre-existing. Setelah revisi daftar status tracked/untracked tingkat atas tetap sama; revisi hanya menambah/memperbarui dokumentasi dan gambar di `docs/redesign/`. Status Git untuk direktori untracked tidak dapat sendiri membuktikan isi setiap file, sehingga klaim dibatasi pada pekerjaan audit yang dilakukan.

## Pengujian 10 Nov, sekitar 11:01 WIB
- `npm test` exit 0: 26 test files passed, 157 tests passed, duration 5.03s.
- `npx tsc --noEmit` exit 0, tanpa output.
- `npm run build` exit 0: Vite 6.4.5, 2546 modules transformed, build 6.17s. Build juga menjalankan tsc.
- `npm run` hanya menyediakan dev, server, build, test: lint NOT RUN, tidak dikonfigurasi. Test E2E/semua peran dan mutasi UI NOT RUN: tidak ada suite yang ditemukan; tidak menggunakan data nyata. Screen reader, manual contrast menyeluruh, loading dan backend error NOT RUN: perlu harness dan waktu tersendiri.
- Probe API isolated tercatat pada `00-functional-risk-assessment.md`; tidak mengubah data workspace. Chromium headless memakai seed in-memory dan folder upload temporary.

## Warna hard-coded `#E51937`
`src/style.css:35` komentar, :394 background dan :419 color; `src/components/ApprovalExplorer.tsx:75,935,966`; `BentoMetrics.tsx:231,340,364,382,395,432,438`; `DocumentList.tsx:78,353`; `StaffBeranda.tsx:71`. Hasil `rg -n E51937 src server --glob '!*.test.*'`; hanya temuan aktual, bukan penggantian warna.

## Export
Bukti 375 `baseline/rev01-export375.png`, 768 `baseline/rev01-export768.png`, 1440 `baseline/export-desktop.png`. Pada ketiga ukuran teks format berada dalam kolom sempit; pada 375 bagian aksi keluar dari viewport awal. `ExportModal.tsx` mendefinisikan radio dalam label flex; `style.css:1671` menerapkan width 100% pada semua input. Ini kandidat penyebab, belum dibuktikan dengan eksperimen CSS karena dilarang mengubah tampilan pada audit.

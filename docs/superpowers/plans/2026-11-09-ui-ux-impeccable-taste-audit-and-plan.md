# UI/UX Impeccable & Taste-Skills Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mentransformasi antarmuka BLC Procurement dari hasil audit (Health Score: 11/20) menjadi sistem kokpit operasional korporat berkelas tinggi (*out-of-distribution craft*), bebas dari AI/SaaS slop, memenuhi standar aksesibilitas WCAG AA (kontras teks ≥ 4.5:1, keyboard focus trap pada seluruh modal, navigasi semantik), responsif penuh dari layar ponsel 390px hingga desktop 1920px, menyelaraskan konsistensi visual antara modul Dokumen dan Approval Register, menerapkan live currency masking pada seluruh form pengadaan, serta melengkapi print stylesheet resmi untuk ekspor PDF.

**Architecture:** 
1. Menerapkan arsitektur desain **Elera High-Craft Corporate** (kanvas arsitektural hangat `#f6f5f3`, kartu putih murni `#ffffff`, border kontras halus `#ededeb`, dan aksen tunggal BLC Corporate Red `#e51937`).
2. Menjaga pemisahan navigasi sesuai instruksi pengguna: menu **"Dokumen"** untuk eksplorasi cepat berbasis tab modul transaksi, dan **"Approval Register"** untuk audit komprehensif dengan filter multi-kombinasi. Keduanya diselaraskan palet visualnya (menghilangkan palet pelangi) dan dilengkapi kartu bertumpuk responsif di mobile.
3. Membungkus seluruh 8 formulir modal dengan komponen `ModalDialog` terstandar yang memiliki focus trap, listener Escape, dan pemulihan fokus.
4. Menyediakan modul murni `currency-format.ts` untuk pemformatan ribuan interaktif (live currency masking) saat mengetik nominal rupiah.
5. Menambahkan stylesheet cetak `@media print` untuk ekspor dokumen PDF yang bersih.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Framer Motion, Lucide React, Vitest.

**Spec:** 
- `design.md`
- `docs/superpowers/specs/2026-11-09-ui-ux-elera-overhaul-design.md`
- `anti-slop/audit-002-2026-11-09.md`
- `C:\Users\BLC\.gemini\skills\impeccable\SKILL.md`
- `C:\Users\BLC\.gemini\skills\antislop\SKILL.md`

## Global Constraints

- **Standar Kontras WCAG AA:** Rasio kontras teks normal minimal 4.5:1 terhadap latar kanvas (`#f6f5f3`) maupun latar putih (`#ffffff`).
- **Palet Warna BLC Caready:** Aksen primer BLC Corporate Red (`#e51937`), status Emerald Green (`#065f46`), Cobalt Blue (`#1e40af`), Amber Orange (`#92400e`), dan Ruby Red (`#991b1b`). Hapus palet pelangi arbitrer (`#0085DB`, `#FFAE1F`, `#8763DA`, dll.) di Approval Explorer.
- **Geometri Standar:** `--card-radius: 10px`, `--btn-radius: 8px`, `--pill-radius: 9999px`. Hapus nilai arbitrer 16px/30px pada elemen input dan panel.
- **Navigasi Terpisah:** Menu "Dokumen" (tab modul) dan "Approval Register" (filter kombinasi) tetap terpisah di sidebar, namun menggunakan token dan pola responsif yang konsisten.
- **Aksesibilitas Keyboard:** Setiap elemen yang dapat diklik wajib berupa `<button>` atau `<a>` dengan ring fokus terlihat (`focus-visible`). Modal wajib memiliki focus trap.
- **Integritas Aturan Bisnis:** Jangan mengubah aturan bisnis dokumen, audit log actor, identitas akun autentikasi, izin server, atau kalkulasi pajak dan nominal.
- **Verifikasi Wajib:** Seluruh tes Vitest (`npm test`) harus lulus 100% dan `npm run build` sukses tanpa error tipe TypeScript.

## Review Focus

1. **Pengguna Keyboard pada Approval Explorer:** Membuka detail dokumen dengan tombol Enter/Space pada baris tabel register tanpa menggunakan mouse.
2. **Navigasi Modal & Escape Trap:** Menekan tombol Tab berulang kali di dalam dialog FormPR/PO/AV/RB/RC/PV/Export tidak membocorkan fokus ke latar belakang, dan menekan Escape menutup dialog serta mengembalikan fokus ke elemen sebelumnya.
3. **Tampilan Ponsel Layar Sempit (390px):** Membuka Approval Register dan Approval History pada viewport 390px menghasilkan kartu bertumpuk rapi dengan label atribut (`data-label`), bukan tabel 10 kolom yang terpotong.
4. **Live Currency Input:** Mengetik `15000000` pada input nominal pengadaan otomatis terformat rapi menjadi `15.000.000` dengan nilai numerik bersih yang disimpan ke state.
5. **Ekspor Cetak PDF:** Memilih format PDF pada modal ekspor dan memicu `window.print()` menghasilkan dokumen cetak A4 yang bersih tanpa sidebar, tanpa topbar, dan tanpa tombol aksi.
6. **Reduced Motion:** Mengaktifkan preferensi reduced motion di sistem operasi menonaktifkan animasi translasi besar tanpa mematikan perubahan state atau feedback instan.

---

## Rincian Tugas Pelaksanaan

### Task 1: Harmonisasi Token Desain, Kontras Warna WCAG AA, dan Reduced Motion

**Files:**
- Modify: `src/style.css:14-120, 1170-1175`
- Test: `src/style.test.ts`

- [ ] **Step 1:** Tulis tes di `src/style.test.ts` untuk memverifikasi kontras warna `--text-muted` (minimal `#4B5563` dengan rasio ≥ 4.5:1), variabel `--text-secondary` (`#374151`), penggantian pembunuhan global `0.01ms` reduced motion dengan aturan selektif, dan token cetak `@media print`.
- [ ] **Step 2:** Jalankan `npx vitest run src/style.test.ts` dan pastikan tes gagal (RED).
- [ ] **Step 3:** Di `src/style.css`:
  - Perbarui `--text-muted` dari `#8a8f89` menjadi `#4b5563` (rasio kontras 4.8:1 terhadap `#f6f5f3` dan 5.4:1 terhadap `#ffffff`).
  - Perbarui `--text-secondary` menjadi `#374151` (rasio kontras 7.2:1).
  - Ganti aturan reduced motion blanket `0.01ms` di baris 1170-1175 menjadi aturan selektif yang menonaktifkan transform/animasi translasi besar (`transition: transform 0s, animation-duration 0.01ms`) sambil mempertahankan transisi warna dan opacity instan.
  - Tambahkan stylesheet `@media print` yang menyembunyikan `.sidebar`, `.topbar`, `.form-actions`, `.mobile-menu-toggle`, dan membuat `.main`, `.content`, dan `.list-card` memenuhi lebar kertas dengan latar belakang putih bersih.
- [ ] **Step 4:** Jalankan `npx vitest run src/style.test.ts` dan pastikan tes lulus (GREEN).
- [ ] **Step 5:** Jalankan skrip `contrast-check.py` untuk memverifikasi seluruh rasio kontras baru lulus WCAG AA.

---

### Task 2: Standardisasi Modal Dialog (Focus Trap, Escape Handler, dan Focus Restoration)

**Files:**
- Create: `src/components/ui/modal-dialog.tsx`
- Modify: `src/main.tsx:980-1355`
- Test: `src/components/ui/modal-dialog.test.tsx`

- [ ] **Step 1:** Buat file tes `src/components/ui/modal-dialog.test.tsx` untuk menguji:
  - Render elemen `<dialog open>` dengan atribut `aria-modal="true"`.
  - Penekanan tombol `Escape` memicu callback `onClose`.
  - Fokus keyboard melingkar di dalam dialog saat menekan `Tab` dan `Shift+Tab`.
  - Pemulihan fokus ke tombol pemicu saat dialog ditutup.
- [ ] **Step 2:** Jalankan `npx vitest run src/components/ui/modal-dialog.test.tsx` dan pastikan tes gagal (RED).
- [ ] **Step 3:** Implementasikan komponen `ModalDialog` di `src/components/ui/modal-dialog.tsx`:
  - Menerima `isOpen`, `onClose`, `title`, `ariaLabel`, `maxWidth`, dan `children`.
  - Mengelola ref elemen pemicu sebelumnya (`document.activeElement`) dan mengembalikan fokus saat unmount.
  - Menangani listener `keydown` untuk `Escape` dan focus cycle trap pada seluruh elemen yang dapat difokuskan.
- [ ] **Step 4:** Refaktor 8 blok modal di `src/main.tsx` (FormPR, FormPO, FormGR, FormAV, FormRB, FormRC, FormPV, FormPVPayment, dan ExportModal) menggunakan `ModalDialog`.
- [ ] **Step 5:** Jalankan `npx vitest run` untuk memastikan tes komponen dan workspace tetap hijau.

---

### Task 3: Overhaul Approval Explorer (Aksesibilitas Semantik, Eliminasi Palette Bloat, dan Mobile Card Stack)

**Files:**
- Modify: `src/components/ApprovalExplorer.tsx:69-86, 304-450, 700-740, 950-1020`
- Modify: `src/components/document-lists.css`
- Test: `src/components/register-filter.test.ts`

- [ ] **Step 1:** Tambahkan tes di `src/components/register-filter.test.ts` untuk menguji:
  - Judul dokumen pada tabel register dirender sebagai `<button type="button">` semantik dengan `aria-label`.
  - Setiap sel `<td>` pada Approval Register memiliki atribut `data-label` yang sesuai untuk responsif mobile.
  - Palet visual dokumen di register konsisten dengan palet netral terpadu (PR merah, lainnya slate netral).
- [ ] **Step 2:** Jalankan `npx vitest run src/components/register-filter.test.ts` dan pastikan tes gagal (RED).
- [ ] **Step 3:** Di `src/components/ApprovalExplorer.tsx`:
  - Selaraskan fungsi `getDocTypeVisual` dengan `DocumentList.tsx`: gunakan background `#F1F5F9` dan warna `#1E293B` untuk PO, AV, RB, RC, PV, dan `#ECFDF5`/`#065F46` untuk GR, mengeliminasi warna pelangi arbitrer.
  - Ganti `<div onClick>` pada judul dokumen baris 334 dengan `<button type="button" className="doc-link-btn" onClick={() => onOpenDetail(doc)} aria-label="...">`.
  - Berikan kelas `className="document-table register-table"` pada tabel Register, History, dan Docs.
  - Tambahkan atribut `data-label` pada setiap `<td>` (`Dokumen`, `Cabang`, `Pengajuan`, `Dibayarkan`, `Tahap`, `Status`, `Pembayaran`, `Pemohon`, `Tanggal`, `Tindakan`).
  - Ganti warna hardcoded `#7C8FAC` dengan kelas CSS atau variabel `--text-muted`.
  - Perbesar area sentuh tombol aksi minimal 44x44px bounding box pada layar mobile.
- [ ] **Step 4:** Di `src/components/document-lists.css`:
  - Tambahkan aturan kartu responsif untuk `.register-table` di `@media (max-width: 600px)` agar sel menyusun kartu vertikal yang mudah dibaca pada layar ponsel 390px.
- [ ] **Step 5:** Jalankan `npx vitest run src/components/register-filter.test.ts` dan pastikan tes lulus (GREEN).

---

### Task 4: Pembersihan Gaya Inline & Penyatuan Desain Komponen (BentoMetrics, StaffBeranda, Topbar)

**Files:**
- Modify: `src/components/BentoMetrics.tsx`
- Modify: `src/components/StaffBeranda.tsx`
- Modify: `src/main.tsx`
- Test: `src/components/BentoMetrics.test.tsx`
- Test: `src/components/elera-workspace.test.tsx`

- [ ] **Step 1:** Tulis tes di `src/components/BentoMetrics.test.tsx` dan `src/components/elera-workspace.test.tsx` untuk memverifikasi:
  - Topbar dan BentoMetrics menggunakan radius standar `--card-radius: 10px` dan `--border-clean`.
  - Teks metrik sekunder memiliki kontras WCAG AA.
  - Indikator notifikasi status di `main.tsx` memiliki peran `role="status"` atau `role="alert"` dengan tombol tutup manual.
- [ ] **Step 2:** Jalankan tes dan pastikan kondisi pengujian berjalan.
- [ ] **Step 3:** Di `src/components/BentoMetrics.tsx`:
  - Ekstrak warna dan layout kartu ke kelas utilitas CSS.
  - Tingkatkan kontras teks keterangan dari `#6B7280`/`#7C8FAC` ke `#374151` / `#4B5563`.
- [ ] **Step 4:** Di `src/components/StaffBeranda.tsx`:
  - Selaraskan radius tombol aksi cepat ke `10px` (`var(--card-radius)`).
  - Pastikan kartu sapaan dan metrik memiliki padding dan pembungkusan fleksibel di mobile (390px).
- [ ] **Step 5:** Di `src/main.tsx`:
  - Selaraskan `topbar` radius menjadi `10px`.
  - Buat banner notifikasi (`notice`) memiliki tombol tutup manual dan batas kontras yang jelas.
- [ ] **Step 6:** Jalankan `npx vitest run` dan pastikan seluruh tes lulus.

---

### Task 5: Format Masking Input Mata Uang (Live Currency Formatting) pada Formulir Pengadaan

**Files:**
- Create: `src/lib/currency-format.ts`
- Create: `src/lib/currency-format.test.ts`
- Modify: `src/components/forms/FormPR.tsx`
- Modify: `src/components/forms/FormPO.tsx`
- Modify: `src/components/forms/FormAV.tsx`
- Modify: `src/components/forms/FormRB.tsx`
- Modify: `src/components/forms/FormRC.tsx`
- Modify: `src/components/forms/FormPV.tsx`

- [ ] **Step 1:** Buat file tes `src/lib/currency-format.test.ts` untuk fungsi pembantu pemformatan angka rupiah:
  - Mengubah input string angka mentah `15000000` menjadi format tampilan terpisah titik `15.000.000`.
  - Menghapus karakter non-digit dan mengembalikan nilai numerik murni.
  - Menangani nilai kosong atau nol secara aman.
- [ ] **Step 2:** Jalankan tes dan pastikan gagal (RED).
- [ ] **Step 3:** Implementasikan modul murni `formatCurrencyInput` dan `parseCurrencyInput` di `src/lib/currency-format.ts`.
- [ ] **Step 4:** Terapkan helper tersebut pada input subtotal dan nominal di seluruh formulir `FormPR`, `FormPO`, `FormAV`, `FormRB`, `FormRC`, dan `FormPV`.
- [ ] **Step 5:** Jalankan tes unit dan verifikasi perhitungan total otomatis tetap akurat.

---

### Task 6: Verifikasi Menyeluruh, Audit Ulang Impeccable & Anti-Slop, dan Pembaruan Knowledge Graph

**Files:**
- Modify: `anti-slop/audit-002-2026-11-09.md`
- Modify: `graphify-out/graph.json`

- [ ] **Step 1:** Jalankan `npm test` untuk memastikan seluruh test suite (minimal 78+ tes) lulus tanpa kegagalan.
- [ ] **Step 2:** Jalankan `npx tsc --noEmit` untuk memastikan kepatuhan tipe TypeScript 100%.
- [ ] **Step 3:** Jalankan `npm run build` dan konfirmasi pembuatan bundel produksi berhasil.
- [ ] **Step 4:** Jalankan mechanical detector Impeccable:
  `C:\Users\BLC\.gemini\skills\impeccable\scripts\impeccable.cmd detect --json src/components/BentoMetrics.tsx src/components/DocumentList.tsx src/components/DocumentDetailModal.tsx src/components/StaffBeranda.tsx src/components/ApprovalExplorer.tsx src/main.tsx`
- [ ] **Step 5:** Perbarui laporan verifikasi di `anti-slop/verification-002-2026-11-09.md`.
- [ ] **Step 6:** Jalankan `graphify update .` untuk menyinkronkan knowledge graph proyek.

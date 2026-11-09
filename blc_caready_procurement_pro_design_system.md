# BLC Caready Procurement Pro — Enterprise Design System
**Unified UI/UX Architecture, Component Standards, Corporate Motion Engine & Visual Quality Assurance**
**Aplikasi:** BLC Caready Procurement Pro — Portal Pengadaan & Otorisasi Keuangan (`BLC/`)
**Lokasi Spesifikasi Target:** `docs/superpowers/specs/BLC_Caready_Procurement_Pro_Design_System.md`
**Frontend Stack:** React 19 + Vite 6 (`@vitejs/plugin-react`) + TypeScript 5.8 (`strict`) + Tailwind CSS v4 (`@tailwindcss/vite`, `tw-animate-css`) + `src/style.css`
**Motion & Icon Stack:** Framer Motion v14 (`framer-motion` via `src/lib/motion.ts`) + Lucide Icons (`lucide-react` v1.70)
**Backend & Data Stack:** Node.js HTTP Native + `tsx` (Port `3002`, `/api/v1/*`) + SQLite (`better-sqlite3` pada `.data/blc-local.sqlite`)
**Validation Suite:** Vitest 5.1 (`npm test` — 20 test files, 135 tests lulus)
**Mode Permukaan (Impeccable Surface Mode):** `Operate` (High-Density Enterprise Task Completion, Executive Telemetry & Financial Authorization)
**Archetype Motion (Motion Design System):** `Corporate` (`cubic-bezier(0.2, 0, 0, 1)`, `250ms`, 0–3% overshoot, 3 Motion Layers: Primary, Secondary, Ambient)

## 1. Objective, System Architecture & Design Principles

Dokumen ini merupakan spesifikasi teknis dan arsitektur **Enterprise Design System** terpusat untuk aplikasi **BLC Caready Procurement Pro — Portal Pengadaan & Otorisasi Keuangan** (`BLC/`). Seluruh standar di dalam dokumen ini memadukan baseline visual dari `BLC_Caready_Design_System_Reference_Grid_FULL.jpg` (8 layar utama) dan `design-instruction.md` dengan arsitektur kode aktual proyek berbasis **React 19, Vite 6, TypeScript 5.8, Tailwind CSS v4, Framer Motion v14, Lucide Icons v1.70, serta Backend Node.js + SQLite**.

### 1.1 Struktur Direktori Proyek & Pemetaan Tanggung Jawab Design System

```text
BLC/
├── .data/                                 # Database lokal SQLite (blc-local.sqlite) — ZERO MUTATION oleh Design System
├── .superpowers/                          # Artefak & ledger SDD (Subagent-Driven Development)
├── docs/
│   └── superpowers/
│       ├── plans/                         # Rencana implementasi teknis bertahap (Phase 1–6)
│       └── specs/                         # Dokumen spesifikasi & Enterprise Design System (dokumen ini)
├── graphify-out/                          # Graph knowledge base & call-flow architecture
├── server/                                # Backend REST API (Node.js + TypeScript, Port 3002) — KONTRAK API DIPERTAHANKAN 100%
│   ├── app.ts                             # Router endpoint REST API v1 (/api/v1/*)
│   ├── auth.ts                            # JWT auth & role validation
│   ├── index.ts                           # Server entry point (port 3002)
│   ├── repository.ts                      # Layer akses data SQLite & integrasi integritas
│   └── storage.ts                         # Manajemen upload berkas attachment
├── src/                                   # Frontend Application (React 19 + Vite 6) — CAKUPAN UTAMA DESIGN SYSTEM
│   ├── components/                        # Komponen antarmuka pengguna
│   │   ├── forms/                         # Form pengajuan per jenis (PR, PO, AV, RB, RC, GR, PV)
│   │   ├── ui/                            # Komponen UI terstandarisasi (StatusBadge, FilterChip, Button, Input, EmptyState, Skeleton, dll.)
│   │   ├── ApprovalExplorer.tsx           # Views: Approval Register (05), Approval History / Audit Log (06), Approval Docs Repository (07)
│   │   ├── ApprovalProgress.tsx           # Inline table stepper (compact) + payment settlement node terpisah
│   │   ├── ApprovalStepper.tsx            # Full workflow stepper (expanded/adaptive) & timeline di DocumentDetailModal
│   │   ├── BentoMetrics.tsx               # Kartu KPI (4 kartu) & telemetry bulanan + activity feed di dashboard eksekutif (03)
│   │   ├── DocumentDetailModal.tsx        # Drawer/Modal tinjauan, lampiran, stepper lengkap, & otorisasi dokumen
│   │   ├── DocumentList.tsx               # Tabel utama pengajuan dokumen & ruang kerja siklus pengadaan (02, 04)
│   │   ├── ExportModal.tsx                # Modal ekspor laporan 480px (Excel .xlsx / PDF .pdf) (08)
│   │   └── StaffBeranda.tsx               # Banner sambutan staf & 7 kartu quick action buat dokumen (PR, PO, AV, RB, RC, GR, PV) (02)
│   ├── domain/                            # Aturan bisnis murni (perhitungan nominal, approval workflow, hari kerja) — ZERO MUTATION
│   ├── lib/                               # Helper umum & engine motion
│   │   ├── currency-format.ts             # Formatter nominal Rupiah (Rp) dengan non-breaking space & tabular rigor
│   │   └── motion.ts                      # Corporate motion engine berbasis Framer Motion v14
│   ├── store/                             # State store dokumen & seed data awal
│   ├── types/                             # Definisi tipe TypeScript
│   │   ├── design-system.types.ts         # Kontrak tipe design system, varian UI, status semantik, dan stepper
│   │   └── document.ts                    # Schema data dokumen (PR, PO, AV, RB, RC, GR, PV) & workflow approval
│   ├── api.ts                             # Client fetcher ke backend REST API (/api/v1/*)
│   ├── main.tsx                           # Root React component, Login screen (01), Topbar, & Sidebar navigasi (Expanded 240px / Collapsed 64px)
│   └── style.css                          # Single Source of Truth: Tailwind v4 @theme + CSS Custom Properties + utility classes (.col-nominal, .th-nominal)
├── package.json                           # Manifest dependensi & scripts (dev, build, test via Vitest 5.1)
├── tsconfig.json                          # Konfigurasi TypeScript 5.8 (strict type checking)
└── vite.config.ts                         # Konfigurasi build Vite 6 + @tailwindcss/vite plugin
```

### 1.2 Core Design Principles (Impeccable `Operate` Mode & Motion `Corporate` Archetype)

1. **Operate Surface Mode (High-Density Task Efficiency):** Antarmuka dirancang untuk kecepatan kerja staf pengadaan, pemeriksa, manajer, dan direksi keuangan. Keterbacaan instan (*scanability*), ketertiban angka tabel (*tabular rigor*), dan kejelasan status otorisasi mengalahkan ornamen visual dekoratif.
2. **Controlled Brand Crimson (`#DC2626`):** Warna merah identitas **BLC Caready** (`--palette-primary-600: #DC2626`, hover `#B91C1C`, subtle `#FEF2F2`) dibatasi secara disiplin untuk tindakan utama (*primary CTA*), status navigasi aktif di `src/main.tsx`, chip filter terpilih, dan penekanan brand. Warna merah brand tidak pernah dicampuradukkan dengan status *Ditolak / Error* (`#9F1239` / `#FFF1F2` dengan ikon `XCircle`).
3. **Border-First Warm Neutral Hierarchy:** Kanvas utama menggunakan *Warm Slate Canvas* (`--color-background: #F4F3EF`) dengan permukaan kartu putih bersih (`--color-surface: #FFFFFF`) dan garis batas tegas namun halus (`1px solid var(--color-border)` `#E4E2DD`). Kontras permukaan dan garis `1px` menjadi pembeda kontainer utama sebelum menerapkan 5 tingkat bayangan halus (`--elevation-0` s/d `--elevation-4`).
4. **Financial & Tabular Rigor (`tabular-nums` + `.col-nominal` / `.th-nominal`):** Seluruh nominal Rupiah yang diformat melalui `src/lib/currency-format.ts`, nomor dokumen (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`), tanggal, dan metrik di `BentoMetrics.tsx`, `DocumentList.tsx`, serta `ApprovalExplorer.tsx` wajib menerapkan `font-variant-numeric: tabular-nums` dan perataan kanan (`text-align: right` melalui class `.col-nominal` dan `.th-nominal`).
5. **Corporate Motion Discipline (`src/lib/motion.ts`):** Seluruh animasi diimplementasikan melalui **Framer Motion v14** dengan **Corporate Archetype** (`cubic-bezier(0.2, 0, 0, 1)`, durasi `250ms`, *overshoot* `0–3%`), transisi modal/drawer asimetris (`320ms` *enter* `cubic-bezier(0.05, 0.7, 0.1, 1)` vs `200ms` *exit* `cubic-bezier(0.3, 0, 1, 1)` via `<AnimatePresence>`), micro-interactions (`whileTap={{ scale: 0.98 }}`, `whileHover={{ y: -2 }}`), serta kepatuhan otomatis terhadap `@media (prefers-reduced-motion: reduce)` (`0.01ms`).
6. **Strict Architectural Isolation:** Perubahan Design System hanya menyentuh layer presentasi (`src/style.css`, `src/types/design-system.types.ts`, `src/lib/motion.ts`, `src/lib/currency-format.ts`, `src/components/**`, dan `src/main.tsx`), tanpa mengubah `src/domain/**`, `server/**`, maupun database `.data/blc-local.sqlite`, serta mempertahankan kelulusan **135 tests pada 20 file uji Vitest 5.1**.

## 2. Design Audit & Component Inventory (Mapped to `src/` Codebase)

### 2.1 Audit Menyeluruh 12 Modul Fungsional terhadap Komponen Aktual

| No | Cakupan Modul Audit | Referensi Layar | File Komponen Aktual (`src/`) | Temuan Inkonsistensi & Masalah Teknis Sebelumnya | Tindakan Standardisasi & Konsolidasi |
|---|---|---|---|---|---|
| 1 | **Authentication / Login** | `01 Login & Authentication` | `src/main.tsx` (View Login) | Kartu *Demo Quick Access / Role Switcher* (2 kolom) memiliki tinggi tidak seragam ketika nama/deskripsi role membungkus ke baris ke-2; label `EMAIL / USERNAME` dan `PASSWORD` di bawah `12px`; kontras teks bantuan di bagian bawah kartu kurang tegas. | Standarkan kartu login (`max-width: 440px`, `--radius-xl: 16px`, `--elevation-2`), terapkan CSS Grid `grid-auto-rows: 1fr` pada daftar role demo, naikkan ukuran label ke `12px` SemiBold (`--text-label-size`), dan gunakan `<Button size="lg" variant="primary">` (`44px`) untuk tombol `Masuk ke Sistem`. |
| 2 | **Application Shell & Navigation Sidebar** | `02`, `03`, `04`, `06`, `07` | `src/main.tsx` (App Shell, Topbar, Sidebar) | Sidebar memiliki dua kondisi tampilan: *Expanded* (`240px` pada `02`, `03`, `04`) dan *Collapsed Icon Rail* (`64px` pada `06`, `07`), tetapi transisi lebar, indikator aktif kiri, ukuran `<CounterBadge />`, serta `<Tooltip />` saat mode *collapsed* belum konsisten. | Satukan logika shell di `src/main.tsx` menggunakan token `--layout-sidebar-expanded: 240px` dan `--layout-sidebar-collapsed: 64px` dengan transisi Framer Motion / CSS `250ms cubic-bezier(0.2, 0, 0, 1)`, indikator bar kiri `3px solid #DC2626`, serta drawer offcanvas untuk viewport `<768px`. |
| 3 | **Dashboard & Executive Telemetry** | `03 Executive Dashboard & Register` | `src/components/BentoMetrics.tsx` | Empat kartu KPI di bagian atas memiliki posisi baseline nominal `Rp 4.500.000` yang tidak sejajar dengan angka metrik dokumen (`1`, `5`, `2`); grafik bulanan didominasi warna merah sehingga seri *Pengajuan* dan *Disetujui/Realisasi* sulit dibedakan; label sumbu bulan berukuran `<10px`. | Standarkan grid 4 kartu KPI di `BentoMetrics.tsx` dengan tinggi minimum seragam (`136px`), `Display` `28px` Bold `tabular-nums`, badge semantik di kanan atas, pembedaan warna seri bar chart (`#DC2626` Pengajuan vs `#059669` Realisasi/Disetujui), label bulan `12px`, dan warna titik semantik pada panel *Aktivitas Otorisasi Terkini*. |
| 4 | **Document Management & Quick Creation** | `02 Staff Beranda`, `04 Dokumen Pengadaan` | `src/components/StaffBeranda.tsx`, `src/components/DocumentList.tsx` | Pada `StaffBeranda.tsx`, 7 kartu akses cepat pembuatan dokumen (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`) memiliki variasi padding dan warna ikon; pada `DocumentList.tsx`, pemilih tahapan siklus (`Semua`, `Tahap 1`–`Tahap 6`) terlalu rapat dengan deretan chip filter jenis dokumen di bawahnya. | Standarkan 7 kartu aksi cepat di `StaffBeranda.tsx` dengan `whileHover={{ y: -2 }}` (`src/lib/motion.ts`), kontainer ikon `36x36px` berwarna semantik, dan beri jarak vertikal `12px` (`--space-3`) antara `<SegmentedStageControl />` dan `<FilterChipGroup />` di `DocumentList.tsx`. |
| 5 | **Document Submission & Forms (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`)** | Form Pengajuan & Validasi | `src/components/forms/*` (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`) | Ketujuh form jenis dokumen menggunakan tinggi input, posisi label, format input mata uang Rupiah, dan tampilan pesan error yang belum seragam; sebagian pesan validasi hanya mengandalkan border merah tanpa ikon. | Konsolidasikan seluruh field di `src/components/forms/*` menggunakan komponen dasar dari `src/components/ui/` (`height: 36px`, border `#9CA3AF`, prefix statis `Rp` dengan `currency-format.ts`, 8 interactive states, serta pesan validasi berikon `AlertCircle` + `aria-invalid="true"`). |
| 6 | **Approval Register** | `03`, `05 Approval Register — Table Detail` | `src/components/ApprovalExplorer.tsx` (mode `register`) | Baris filter 4 dropdown (*Kategori*, *Status*, *Tahap*, *Periode*) dan tombol `Reset Filter` memiliki tinggi tidak seragam (`34px` vs `38px`); tabel menampilkan *horizontal scrollbar* permanen bahkan pada layar desktop lebar. | Samakan tinggi seluruh select filter dan tombol `Reset Filter` pada `36px` (`--control-height-md`); atur proporsi kolom tabel dan terapkan `.th-nominal` / `.col-nominal` agar tabel tampil utuh tanpa scroll horizontal pada viewport `>=1280px`. |
| 7 | **Approval History (Audit Log)** | `06 Approval History` | `src/components/ApprovalExplorer.tsx` (mode `history`) | Tabel riwayat menampilkan 20+ baris log padat dengan waktu, kode dokumen, aktor, badge status, catatan, dan tombol `Detail` yang sulit dipindai secara cepat; catatan panjang terpotong tanpa tooltip. | Terapkan varian tabel `density="compact"` (`padding: 8px 12px`) pada mode `history` di `ApprovalExplorer.tsx`, gunakan `tabular-nums` pada kolom timestamp, `<StatusBadge />` berikon, `ellipsis` + tooltip pada kolom catatan, dan `<Button variant="outlined" size="sm">` untuk `Detail`. |
| 8 | **Approval Documents Repository** | `07 Approval Docs` | `src/components/ApprovalExplorer.tsx` (mode `docs`) | Pada sebagian baris daftar lampiran PDF terdapat tombol `Lihat` dan `Unduh`, namun pada baris lain kolom kanan hanya menampilkan teks ukuran/tanggal berkas tanpa tombol aksi. | Pisahkan kolom `Metadata Berkas` (Ukuran & Tanggal) dari kolom `Tindakan` (`Lihat` & `Unduh`) di `ApprovalExplorer.tsx` (mode `docs`) sehingga setiap baris berkas selalu menampilkan kedua tombol aksi secara konsisten. |
| 9 | **Tables, Lists & Filtering** | `02`, `03`, `04`, `05`, `06`, `07` | `src/components/DocumentList.tsx`, `src/components/ApprovalExplorer.tsx` | Duplikasi styling header tabel, baris filter, dan ketidakseragaman perataan kolom nominal (`NOMINAL (IDR)`, `TOTAL PENGAJUAN`, `ESTIMASI REALISASI`). | Satukan class dan token tabel di `src/style.css` (`.ds-table`, `.th-nominal`, `.col-nominal`, `.col-actions`), wajibkan `text-align: right` dan `font-variant-numeric: tabular-nums` untuk seluruh kolom nominal, serta sediakan transformasi *Stacked Record Cards* untuk layar `<768px`. |
| 10 | **Export Reports & Modal Dialogs** | `08 Export Report Modal` | `src/components/ExportModal.tsx` | Lebar modal (`~360px`) terlalu sempit; opsi radio format terpilih menggunakan warna merah yang menyerupai pesan error; belum ada ringkasan jumlah dokumen dan filter aktif yang akan diekspor. | Tetapkan lebar `ExportModal.tsx` pada `480px` (`--modal-width-sm`), pisahkan 3 zona (Pilihan RadioCard `.xlsx` / `.pdf`, `<InfoCard />` ringkasan cakupan ekspor, dan Footer tombol `Batal` + `Export File`), serta bungkus dengan Framer Motion `<AnimatePresence>` dari `src/lib/motion.ts`. |
| 11 | **Document Detail & Approval Stepper** | `02`, `03`, `04`, `05`, Detail Drawer | `src/components/ApprovalProgress.tsx`, `src/components/ApprovalStepper.tsx`, `src/components/DocumentDetailModal.tsx` | Pada `ApprovalProgress.tsx` (inline tabel), node status *Waiting/Current* menggunakan warna merah yang identik dengan *Rejected*, serta node pembayaran di sisi kanan tampak seperti node stepper yang garisnya terputus. | Standarkan `ApprovalProgress.tsx` (inline tabel) dan `ApprovalStepper.tsx` (detail lengkap di `DocumentDetailModal.tsx`): gunakan warna biru/amber untuk state *Current/Waiting*, hijau (`CheckCircle2`) untuk *Approved*, merah (`XCircle`) untuk *Rejected*, pastikan konektor garis menyatu (`margin: 0 -1px`), dan pisahkan **Payment Settlement Node** dengan divider vertikal `1px solid #E4E2DD`. |
| 12 | **Notifications, Loading & Empty States** | Seluruh modul | `src/components/ui/*` | Kurangnya pembedaan visual untuk 5 kondisi *Empty State* pada tabel serta perlunya pencegahan *layout shift* saat loading data atau submit otorisasi. | Sediakan komponen terstandarisasi `<EmptyState />` (5 varian kontekstual), `<Skeleton />`, `<InlineLoader />`, `<Toast />`, dan state `loading` pada `<Button />` di dalam `src/components/ui/`. |

### 2.2 Domain Jenis Dokumen Pengadaan & Keuangan (`src/types/document.ts` & `src/components/forms/`)

Sistem menstandarkan identitas visual, kode singkatan, ikon **Lucide (`lucide-react` v1.70)**, dan aksen warna kontainer untuk ketujuh jenis dokumen yang dikelola oleh `BLC/`:

| Kode | Nama Dokumen Lengkap | File Form (`src/components/forms/`) | Lucide Icon (`lucide-react`) | Warna Kontainer Ikon (BG / Text) | Peran dalam Siklus Pengadaan |
|---|---|---|---|---|---|
| **`PR`** | **Purchase Request** (Permintaan Pembelian) | `src/components/forms/PRForm.tsx` | `FileSpreadsheet` | `#FEF2F2` / `#DC2626` (`Primary`) | Inisiasi kebutuhan barang/jasa beserta estimasi anggaran awal. |
| **`PO`** | **Purchase Order** (Pesanan Pembelian) | `src/components/forms/POForm.tsx` | `ShoppingCart` | `#EFF6FF` / `#2563EB` (`Info`) | Dokumen pemesanan resmi ke vendor/rekanan berdasarkan PR yang disetujui. |
| **`AV`** | **Advance Voucher** (Uang Muka / Kasbon) | `src/components/forms/AVForm.tsx` | `Wallet` / `Banknote` | `#FFFBEB` / `#D97706` (`Warning`) | Pengajuan pencairan uang muka operasional sebelum realisasi. |
| **`RB`** | **Reimbursement** (Klaim Penggantian Biaya) | `src/components/forms/RBForm.tsx` | `Receipt` | `#ECFDF5` / `#059669` (`Success`) | Pengajuan penggantian biaya operasional yang telah dikeluarkan staf. |
| **`RC`** | **Realization / Reconciliation** (Pertanggungjawaban Uang Muka) | `src/components/forms/RCForm.tsx` | `FileCheck2` | `#EFF6FF` / `#1D4ED8` (`Info Strong`) | Pelaporan realisasi penggunaan uang muka (`AV`) beserta bukti transaksi. |
| **`GR`** | **Goods Receipt / BAST** (Berita Acara Serah Terima) | `src/components/forms/GRForm.tsx` | `PackageCheck` / `ClipboardCheck` | `#F1EFEA` / `#374151` (`Neutral`) | Verifikasi penerimaan fisik barang/pekerjaan sesuai spesifikasi `PO`. |
| **`PV`** | **Payment Voucher** (Bukti Kas/Bank Keluar & Kwitansi) | `src/components/forms/PVForm.tsx` | `CreditCard` / `Banknote` | `#D1FAE5` / `#047857` (`Emerald`) | Otorisasi akhir pencairan pembayaran dan pelunasan tagihan vendor. |

## 3. Design Foundations (`src/style.css`)

Arsitektur styling memadukan **Tailwind CSS v4** (`@tailwindcss/vite` + `tw-animate-css`) dengan **CSS Custom Properties** terpusat di `src/style.css`. Seluruh nilai token dipetakan ke direktif `@theme` Tailwind v4 sekaligus diekspos sebagai variabel CSS `:root` agar dapat digunakan baik melalui utility classes maupun class komponen semantik.

### 3.1 Color System & Semantic Tokens

#### A. Primitive Palette Scale (`--palette-*`)

| Scale | Primary (BLC Crimson Red) | Neutral (Warm Slate) | Success (Emerald) | Warning (Amber) | Error (Crimson Rose) | Info (Royal Blue) |
|---|---|---|---|---|---|---|
| **50** | `#FEF2F2` | `#F8F7F4` | `#ECFDF5` | `#FFFBEB` | `#FFF1F2` | `#EFF6FF` |
| **100** | `#FEE2E2` | `#F4F3EF` (Canvas) / `#F1EFEA` | `#D1FAE5` | `#FEF3C7` | `#FFE4E6` | `#DBEAFE` |
| **200** | `#FECACA` | `#E4E2DD` (Border) | `#A7F3D0` | `#FDE68A` | `#FECDD3` | `#BFDBFE` |
| **300** | `#FCA5A5` | `#D1CFC9` | `#6EE7B7` | `#FCD34D` | `#FDA4AF` | `#93C5FD` |
| **400** | `#F87171` | `#9CA3AF` (Strong Border) | `#34D399` | `#FBBF24` | `#FB7185` | `#60A5FA` |
| **500** | `#EF4444` | `#6B7280` (Text Muted) | `#10B981` | `#F59E0B` | `#F43F5E` | `#3B82F6` |
| **600** | `#DC2626` (Brand Primary) | `#4B5563` (Text Secondary) | `#059669` | `#D97706` | `#E11D48` | `#2563EB` |
| **700** | `#B91C1C` (Primary Hover) | `#374151` | `#047857` | `#B45309` | `#BE123C` | `#1D4ED8` |
| **800** | `#991B1B` (Primary Pressed) | `#1F2937` | `#065F46` (Success FG) | `#92400E` (Warning FG) | `#9F1239` (Error FG) | `#1E40AF` (Info FG) |
| **900** | `#7F1D1D` | `#111827` (Text Primary) | `#064E3B` | `#78350F` | `#881337` | `#1E3A8A` |

#### B. Semantic Color Tokens & Contrast Compliance (WCAG 2.2 AA)

| Semantic Token | CSS Variable (`src/style.css`) | Hex Value | Rasio Kontras AA | Peran & Batasan Penggunaan |
|---|---|---|---|---|
| `color.primary` | `--color-primary` | `#DC2626` | `4.83:1` (vs `#FFFFFF`) | CTA utama, bar navigasi aktif di `main.tsx`, chip filter aktif, aksen identitas BLC Caready. |
| `color.primaryHover` | `--color-primary-hover` | `#B91C1C` | `6.47:1` (vs `#FFFFFF`) | Hover pada tombol utama dan kontrol primer. |
| `color.primaryPressed` | `--color-primary-pressed` | `#991B1B` | `8.29:1` (vs `#FFFFFF`) | State tekan (*active/pressed*) pada tombol utama. |
| `color.primarySubtle` | `--color-primary-subtle` | `#FEF2F2` | `1.08:1` (Surface tint) | Latar item menu aktif di sidebar dan kartu radio terpilih di `ExportModal.tsx` / Login. |
| `color.onPrimary` | `--color-on-primary` | `#FFFFFF` | `4.83:1` (vs `#DC2626`) | Teks dan ikon di atas permukaan `--color-primary`. |
| `color.background` | `--color-background` | `#F4F3EF` | — | *Warm Slate Canvas* — latar belakang dasar seluruh halaman aplikasi. |
| `color.surface` | `--color-surface` | `#FFFFFF` | — | Permukaan utama kartu (`BentoMetrics`, `StaffBeranda`, `DocumentList`), sidebar, dan topbar. |
| `color.surfaceContainer` | `--color-surface-container` | `#F8F7F4` | — | Latar header tabel (`<thead>`), bar filter, footer modal, dan kontainer info sekunder. |
| `color.surfaceElevated` | `--color-surface-elevated` | `#FFFFFF` | — | Permukaan `ExportModal.tsx`, `DocumentDetailModal.tsx`, dropdown, dan popover. |
| `color.border` | `--color-border` | `#E4E2DD` | `1.28:1` (Structural) | Border `1px` utama kartu, sel tabel, dan pemisah seksi (*Border-First Hierarchy*). |
| `color.borderStrong` | `--color-border-strong` | `#9CA3AF` | `3.05:1` (vs `#FFFFFF`) | Border input form, select, checkbox, dan tombol *outlined* (lulus WCAG 1.4.11 Non-Text Contrast `>=3:1`). |
| `color.textPrimary` | `--color-text-primary` | `#111827` | `17.74:1` (vs `#FFFFFF`) | Teks utama, judul halaman, kode dokumen, dan angka nominal Rupiah. |
| `color.textSecondary` | `--color-text-secondary` | `#4B5563` | `7.56:1` (vs `#FFFFFF`) | Label form, header kolom tabel, sub-judul dokumen, dan keterangan metadata. |
| `color.textMuted` | `--color-text-muted` | `#6B7280` | `4.83:1` (vs `#FFFFFF`) | Placeholder input, timestamp sekunder, dan *helper text*. |
| `color.success` | `--color-success-fg` / `--color-success-bg` / `--color-success-border` | `#065F46` / `#ECFDF5` / `#6EE7B7` | `7.42:1` (FG vs BG) | Status **Disetujui**, **Lunas**, node stepper selesai, dan toast berhasil. |
| `color.warning` | `--color-warning-fg` / `--color-warning-bg` / `--color-warning-border` | `#92400E` / `#FFFBEB` / `#FCD34D` | `7.15:1` (FG vs BG) | Status **Menunggu**, **Diajukan**, **Revisi**, dan peringatan batas anggaran. |
| `color.error` | `--color-error-fg` / `--color-error-bg` / `--color-error-border` | `#9F1239` / `#FFF1F2` / `#FDA4AF` | `7.68:1` (FG vs BG) | Status **Ditolak**, error validasi input di `src/components/forms/*`, dan aksi destruktif. |
| `color.info` | `--color-info-fg` / `--color-info-bg` / `--color-info-border` | `#1E40AF` / `#EFF6FF` / `#93C5FD` | `7.89:1` (FG vs BG) | Status **Ditinjau**, **Dibayarkan**, dan node stepper yang sedang aktif diperiksa (*Current*). |
| `color.focusRing` | `--color-focus-ring` | `#2563EB` | `4.58:1` (vs `#FFFFFF`) | Outline fokus keyboard (`2px solid #2563EB`, `outline-offset: 2px`) yang kontras terhadap elemen merah maupun putih. |
| `color.disabled` | `--color-disabled-bg` / `--color-disabled-text` | `#F1EFEA` / `#9CA3AF` | — | Permukaan dan warna teks untuk kontrol berstatus `disabled`. |

### 3.2 Typography System & Financial Rigor

* **Primary Font Stack (`--font-sans`):** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
* **Monospace Font Stack (`--font-mono`):** `'JetBrains Mono', 'Fira Code', monospace`

| Style | CSS Variable | Size | Line Height | Weight | Letter Spacing | Class & Usage di `src/` |
|---|---|---|---|---|---|---|
| **Display** | `--text-display-size` | `28px` (`1.75rem`) | `36px` (`1.28`) | `700` (Bold) | `-0.02em` | `.ds-display` — Nilai utama KPI pada `BentoMetrics.tsx` (`Rp 4.500.000`, `tabular-nums`). |
| **Heading 1** | `--text-h1-size` | `24px` (`1.5rem`) | `32px` (`1.33`) | `700` (Bold) | `-0.015em` | `.ds-h1` — Judul halaman utama di topbar `src/main.tsx`. |
| **Heading 2** | `--text-h2-size` | `20px` (`1.25rem`) | `28px` (`1.40`) | `600` (SemiBold) | `-0.01em` | `.ds-h2` — Judul seksi tabel (`DocumentList.tsx`, `ApprovalExplorer.tsx`) dan judul `DocumentDetailModal.tsx`. |
| **Heading 3** | `--text-h3-size` | `16px` (`1.0rem`) | `24px` (`1.50`) | `600` (SemiBold) | `-0.005em` | `.ds-h3` — Judul panel grafik di `BentoMetrics.tsx`, judul `ExportModal.tsx` (`08`), dan judul `<EmptyState />`. |
| **Body Large** | `--text-body-lg-size` | `16px` (`1.0rem`) | `24px` (`1.50`) | `400` (Regular) | `0em` | `.ds-body-lg` — Sub-sapaan utama pada banner `StaffBeranda.tsx`. |
| **Body** | `--text-body-size` | `14px` (`0.875rem`) | `20px` (`1.43`) | `400` (Regular) | `0em` | `.ds-body` — Isi sel tabel umum, nilai field form (`src/components/forms/*`), dan item navigasi sidebar. |
| **Body Strong** | `--text-body-size` | `14px` (`0.875rem`) | `20px` (`1.43`) | `600` (SemiBold) | `0em` | `.ds-body-strong`, `.col-nominal` — Nomor dokumen (`PR-2026-0104`), nominal Rupiah di tabel, dan nama berkas PDF. |
| **Label** | `--text-label-size` | `12px` (`0.75rem`) | `16px` (`1.33`) | `600` (SemiBold) | `+0.02em` | `.ds-label`, `.th-nominal` — Label field form, teks `<StatusBadge />`, dan header kolom tabel (`uppercase` `+0.04em`). |
| **Caption** | `--text-caption-size` | `12px` (`0.75rem`) | `16px` (`1.33`) | `400` (Regular) | `0em` | `.ds-caption` — Sub-judul dokumen di tabel, ukuran berkas (`1.2 MB`), timestamp audit log, dan *helper text*. |

**Aturan Ketat Tipografi Keuangan (`src/lib/currency-format.ts` & `src/style.css`):**
1. **Batas Minimum 12px:** Tidak ada teks fungsional di dalam aplikasi yang boleh berukuran `<12px`.
2. **Class `.th-nominal` dan `.col-nominal` Wajib:** Seluruh header dan sel tabel yang menampilkan nilai uang (`NOMINAL (IDR)`, `TOTAL PENGAJUAN`, `ESTIMASI REALISASI`) wajib memakai class `.th-nominal` dan `.col-nominal` yang menerapkan `text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap;`.
3. **Formatter `formatCurrencyIDR` (`src/lib/currency-format.ts`):** Menghasilkan string `"Rp 4.500.000"` (menggunakan *non-breaking space* ` ` antara `Rp` dan digit) agar simbol `Rp` tidak pernah terpisah ke baris atas saat lebar kolom menyempit.

### 3.3 Spacing, Shape & Elevation Tokens

#### A. Skala Spacing Kelipatan 4px (`--space-*`)

* `--space-1`: `4px` (`0.25rem`) — Gap internal ikon dan teks di dalam `<StatusBadge />` & `<CategoryChip />`.
* `--space-2`: `8px` (`0.5rem`) — Gap antar-ikon dan teks tombol, gap antar-`<FilterChip />`, padding vertikal sel tabel `compact`.
* `--space-3`: `12px` (`0.75rem`) — Padding vertikal sel tabel `regular` (`12px 16px`), gap antar-kontrol di filter bar, jarak vertikal antara `<SegmentedStageControl />` dan `<FilterChipGroup />`.
* `--space-4`: `16px` (`1.0rem`) — Padding horizontal sel tabel, gap grid kartu di `StaffBeranda.tsx`, gutter halaman mobile (`<768px`).
* `--space-5`: `20px` (`1.25rem`) — Padding internal kartu di `BentoMetrics.tsx`, toolbar tabel, dan gap grid desktop.
* `--space-6`: `24px` (`1.5rem`) — Jarak vertikal antar-seksi halaman, padding body `ExportModal.tsx` & `DocumentDetailModal.tsx`, gutter halaman tablet (`768px–1279px`).
* `--space-8`: `32px` (`2.0rem`) — Gutter halaman desktop (`>=1280px`) dan padding kartu login (`01`).
* `--space-10`: `40px` (`2.5rem`) — Padding vertikal area `<EmptyState />`.
* `--space-12`: `48px` (`3.0rem`) — Tinggi bar paginasi tabel dan margin vertikal layar autentikasi.
* `--space-16`: `64px` (`4.0rem`) — Lebar *Collapsed Sidebar* (`64px`) dan tinggi *Top Header Bar* (`64px`) di `src/main.tsx`.

#### B. Shape & Border Radius (`--radius-*`)

* `--radius-sm` (`6px`): Tombol `size="sm"`, `<CategoryChip />`, checkbox, kotak ikon dokumen di dalam baris tabel.
* `--radius-md` (`8px`): Tombol `size="md"` & `size="lg"`, seluruh input/select di `src/components/forms/*`, item navigasi sidebar, dan `<RadioCard />`.
* `--radius-lg` (`12px`): Kontainer kartu di `BentoMetrics.tsx`, `StaffBeranda.tsx`, `DocumentList.tsx`, dan `ApprovalExplorer.tsx`.
* `--radius-xl` (`16px`): `ExportModal.tsx` (`08`), `DocumentDetailModal.tsx`, dan kartu utama Login (`01`).
* `--radius-full` (`9999px`): `<StatusBadge />`, `<FilterChip />`, `<CounterBadge />`, serta lingkaran node pada `ApprovalProgress.tsx` & `ApprovalStepper.tsx`.

#### C. Border-First Elevation System (`--elevation-*`)

* **Level 0 (`--elevation-0`):** `none` + `border: 1px solid var(--color-border)` (`#E4E2DD`) — Input form, blok ringkasan di dalam modal, dan sub-kontainer.
* **Level 1 (`--elevation-1`):** `0 1px 2px 0 rgba(17, 24, 39, 0.04)` + `border: 1px solid #E4E2DD` — Kartu standar di `BentoMetrics.tsx`, `StaffBeranda.tsx`, `DocumentList.tsx`, dan `ApprovalExplorer.tsx`.
* **Level 2 (`--elevation-2`):** `0 4px 8px -2px rgba(17, 24, 39, 0.07), 0 2px 4px -2px rgba(17, 24, 39, 0.04)` + `border: 1px solid #D1CFC9` — State *hover* pada kartu interaktif Quick Action (`whileHover={{ y: -2 }}`).
* **Level 3 (`--elevation-3`):** `0 10px 15px -3px rgba(17, 24, 39, 0.08), 0 4px 6px -4px rgba(17, 24, 39, 0.05)` + `border: 1px solid #E4E2DD` — Dropdown menu, date picker popover, dan tooltip informasi stepper.
* **Level 4 (`--elevation-4`):** `0 20px 25px -5px rgba(17, 24, 39, 0.14), 0 8px 10px -6px rgba(17, 24, 39, 0.06)` + `border: 1px solid #E4E2DD` — `ExportModal.tsx`, `DocumentDetailModal.tsx`, dan offcanvas drawer mobile.

## 4. Component Design Specifications (Mapped to `src/components/`)

### 4.1 Button System (`src/components/ui/Button.tsx`)

Menggunakan kombinasi CSS token di `src/style.css` dan interaksi taktil `motion.button` dari `src/lib/motion.ts` (`whileTap={{ scale: 0.98 }}` saat aktif dan tidak `disabled`/`loading`).

#### A. 6 Variants & 3 Sizes

| Variant | Class / Prop | Default Styling | Hover & Pressed | Usage di `src/` |
|---|---|---|---|---|
| **Primary** | `variant="primary"` | `bg: #DC2626`, `text: #FFFFFF`, `border: transparent` | Hover: `#B91C1C`; Pressed: `#991B1B` | `Masuk ke Sistem` (`main.tsx`), `+ Buat Pengajuan Baru` (`BentoMetrics` / `DocumentList`), `Export File` (`ExportModal.tsx`), `Setujui Dokumen` (`DocumentDetailModal.tsx`). |
| **Secondary** | `variant="secondary"` | `bg: #F1EFEA`, `text: #111827`, `border: 1px solid #E4E2DD` | Hover: `#E4E2DD`; Pressed: `#D1CFC9` | `Simpan Draf` pada `src/components/forms/*`, `Minta Revisi` pada `DocumentDetailModal.tsx`. |
| **Outlined** | `variant="outlined"` | `bg: #FFFFFF`, `text: #374151`, `border: 1px solid #9CA3AF` | Hover: `bg #F8F7F4, border #4B5563`; Pressed: `#F1EFEA` | `Export Laporan (7)` di topbar, `Reset Filter`, tombol baris tabel `Detail`, `Lihat`, dan `Unduh` di `DocumentList.tsx` & `ApprovalExplorer.tsx`. |
| **Text / Ghost** | `variant="ghost"` | `bg: transparent`, `text: #4B5563`, `border: transparent` | Hover: `bg #F1EFEA, text #111827` | Tombol `Batal` di `ExportModal.tsx` dan `DocumentDetailModal.tsx`. |
| **Icon Button** | `variant="icon"` | `bg: transparent` atau `#FFFFFF`, `text: #4B5563` | Hover: `bg #F1EFEA, text #111827`; `whileTap={{ scale: 0.96 }}` | Tombol tutup (`X`) pada modal, tombol *collapse/expand* sidebar di `main.tsx`. Wajib memiliki `aria-label`. |
| **Destructive** | `variant="destructive"` | `bg: #E11D48`, `text: #FFFFFF` (atau *Destructive Outlined* `bg: #FFF1F2, text: #BE123C, border: #FDA4AF`) | Hover: `#BE123C`; Pressed: `#9F1239` | Tombol `Tolak Pengajuan` di `DocumentDetailModal.tsx` dan penghapusan draf. |

* **Ukuran (`size`):**
  * `sm`: `height: 32px`, `padding: 0 12px`, `font-size: 12px`, `radius: 6px`, `icon: 16px`, `gap: 6px` (khusus aksi di dalam baris tabel).
  * `md`: `height: 36px`, `padding: 0 16px`, `font-size: 14px`, `radius: 8px`, `icon: 16px`, `gap: 8px` (standar di toolbar, filter bar, dan footer modal).
  * `lg`: `height: 44px`, `padding: 0 20px`, `font-size: 14px`, `radius: 8px`, `icon: 20px`, `gap: 8px` (khusus CTA utama Login `01` dan submit form pengajuan utama).
* **6 Interactive States:** `default`, `hover`, `focus-visible` (`2px solid #2563EB`, offset `2px`), `pressed` (`scale: 0.98`), `disabled` (`bg: #F1EFEA, text: #9CA3AF, cursor: not-allowed`), dan `loading` (mengunci lebar tombol, mengganti ikon kiri dengan `<Loader2 className="animate-spin" size={16} aria-hidden="true" />`, serta mengaktifkan `disabled` dan `aria-busy="true"`).

### 4.2 Iconography (`lucide-react` v1.70)

Seluruh ikon diimpor secara modular dari `lucide-react` dengan ketebalan garis konsisten (`strokeWidth={1.75}` atau `2`), ukuran terstandarisasi (`16px` untuk badge/tombol/input, `20px` untuk navigasi sidebar & quick actions, `24px` untuk banner & empty state), dan wajib menyertakan `aria-hidden="true"` ketika mendampingi label teks.

### 4.3 Inputs & Form Controls (`src/components/ui/` & `src/components/forms/`)

Digunakan secara konsisten di ketujuh form dokumen (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`), layar Login (`01`), serta bar pencarian dan filter di `DocumentList.tsx` dan `ApprovalExplorer.tsx`.

* **Standar Geometri:** Tinggi `36px` (`--control-height-md`) untuk seluruh input/select aplikasi dan `44px` (`--control-height-lg`) untuk halaman Login; `padding: 8px 12px`; `border-radius: 8px`; `border: 1px solid var(--color-border-strong)` (`#9CA3AF`).
* **8 States Wajib:**
  1. `default`: `bg #FFFFFF`, `border #9CA3AF`, `text #111827`, `placeholder #6B7280`.
  2. `hover`: `border #4B5563`.
  3. `focus`: `border #2563EB`, `box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18)`, `outline: none`.
  4. `filled`: Teks `#111827` (dengan tombol `X` pembersih pada `SearchInput`).
  5. `error`: `border #E11D48`, `bg #FFF1F2` (atau `#FFFFFF`), `aria-invalid="true"`, didampingi pesan error di bawah field dengan ikon `<AlertCircle size={14} aria-hidden="true" />` dan teks `#BE123C`.
  6. `disabled`: `bg #F1EFEA`, `border #E4E2DD`, `text #9CA3AF`, `cursor: not-allowed`.
  7. `readonly`: `bg #F8F7F4`, `border: 1px dashed #D1CFC9`, `text #374151` (digunakan untuk Nomor Dokumen otomatis dan kalkulasi subtotal/PPN di `src/components/forms/*`).
  8. `loading`: Menampilkan `<Loader2 size={16} className="animate-spin" />` di slot kanan input/combobox.
* **Integrasi `CurrencyInput` dengan `src/lib/currency-format.ts`:** Menampilkan prefix statis `"Rp"` di sisi kiri input, menerapkan `font-variant-numeric: tabular-nums`, memformat tampilan ribuan dengan titik (`4.500.000`) saat pengguna mengetik, namun tetap menyimpan angka murni (`number`) ke state form dan layer `src/domain/`.

### 4.4 Tables & Data Lists (`src/components/DocumentList.tsx` & `src/components/ApprovalExplorer.tsx`)

#### A. Struktur Anatomi & Class Standar di `src/style.css`

1. **Table Container (`.ds-table-card`):** `background: #FFFFFF`, `border: 1px solid #E4E2DD`, `border-radius: 12px`, `box-shadow: var(--elevation-1)`, `overflow: hidden`.
2. **Table Toolbar (`.ds-table-toolbar`):** Berisi judul seksi di kiri dan `SearchInput` + tombol aksi (`Filter` / `Export`) di kanan, diikuti baris dropdown filter (4 kolom + `Reset Filter` dengan tinggi seragam `36px`) atau `<SegmentedStageControl />` + `<FilterChipGroup />`.
3. **Header & Cell Alignment Rules:**
   * Kolom **Identitas Dokumen** (`DOKUMEN & PENGAJUAN`, `BERKAS DOKUMEN`): Rata kiri (`text-align: left`), menampilkan kotak ikon jenis dokumen (`32x32px`), Nomor Dokumen (`14px` SemiBold `#111827` `tabular-nums`) + `<CategoryChip />`, dan sub-baris judul pengajuan (`12px` `#4B5563`, 1-line `text-overflow: ellipsis; max-width: 280px`).
   * Kolom **Nominal Rupiah** (`NOMINAL (IDR)`, `TOTAL PENGAJUAN`, `ESTIMASI REALISASI`): **Wajib menggunakan class `.th-nominal` pada `<th>` dan `.col-nominal` pada `<td>`** (`text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; white-space: nowrap;`).
   * Kolom **Status**: Rata kiri, merender `<StatusBadge />`.
   * Kolom **Tahapan Otorisasi**: Rata kiri, merender `<ApprovalProgress />` (`min-width: 176px`).
   * Kolom **Metadata Berkas** (khusus `ApprovalExplorer.tsx` mode `docs`): Rata kiri, menampilkan ukuran berkas (`KB`/`MB`) dan tanggal unggah (`tabular-nums`), **terpisah dari kolom Aksi**.
   * Kolom **Tindakan / Aksi** (`.th-actions` / `.col-actions`): Rata kanan (`text-align: right; white-space: nowrap;`), merender tombol `<Button variant="outlined" size="sm">` (`Detail`, atau pasangan `Lihat` & `Unduh` pada `Approval Docs`).

#### B. Eliminasi Unintended Horizontal Scrollbar & Adaptasi Mobile

* Pada layar **Desktop (`>=1280px`)**, lebar kolom diatur secara proporsional sehingga tabel di `DocumentList.tsx` dan `ApprovalExplorer.tsx` tampil penuh **tanpa memunculkan horizontal scrollbar**.
* Pada layar **Tablet & Small Desktop (`768px–1279px`)**, wrapper `.ds-table-scroll-container` mengaktifkan scroll horizontal lokal dengan *sticky left column* pada kolom `DOKUMEN` dan *sticky right column* pada kolom `.col-actions`.
* Pada layar **Mobile (`<768px`)**, `DocumentList.tsx` dan `ApprovalExplorer.tsx` merender daftar dokumen dalam bentuk **Stacked Record Cards** (`.ds-mobile-record-card`) yang menampilkan Nomor Dokumen, `<StatusBadge />`, Nominal Rupiah (`formatCurrencyIDR`), `<ApprovalProgress />`, serta tombol `Detail` / `Lihat` & `Unduh` secara utuh tanpa memperkecil huruf di bawah `12px`.

### 4.5 Status Badges & Chips (`src/components/ui/StatusBadge.tsx` & `FilterChip.tsx`)

Sistem memisahkan secara tegas 5 komponen berbeda di `src/components/ui/` agar tidak terjadi tabrakan styling:

1. **`<StatusBadge />`**: Indikator status pasif (`height: 24px`, `padding: 2px 10px`, `border-radius: 9999px`, `font-size: 12px`, `font-weight: 600`, `border: 1px solid`) yang selalu merender **Lucide Icon (`12px`, `aria-hidden="true"`) + Label Teks**.
2. **`<FilterChip />`**: Tombol filter interaktif (`<button type="button">`, `height: 32px`, `padding: 6px 14px`, `border-radius: 9999px`, `font-size: 12px`, `font-weight: 600`) dengan state `aria-pressed={active}`. Saat aktif menggunakan `bg: #DC2626, text: #FFFFFF`; saat tidak aktif menggunakan `bg: #FFFFFF, text: #4B5563, border: 1px solid #E4E2DD`.
3. **`<SelectionChip />`**: Chip filter aktif yang dapat dihapus (`height: 28px`, `border-radius: 8px`, `bg: #EFF6FF`, `text: #1E40AF`, `border: 1px solid #93C5FD`) lengkap dengan tombol ikon `X` (`14px`).
4. **`<CategoryChip />`**: Tag kode dokumen pasif (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`) berukuran ringkas (`height: 20px`, `padding: 1px 6px`, `border-radius: 6px`, `font-size: 11px–12px`, `font-weight: 600`).
5. **`<CounterBadge />`**: Pill angka penghitung pada item sidebar dan tab siklus (`min-width: 20px`, `height: 20px`, `padding: 0 6px`, `border-radius: 9999px`, `tabular-nums`).

#### Tabel Pemetaan Semantik 10 Status Wajib (`<StatusBadge />`)

| Status Key (`DocumentStatus`) | Label Tampilan | Lucide Icon (`lucide-react`) | Background | Text & Icon Color | Border Color |
|---|---|---|---|---|---|
| `'draft'` | **Draf** | `FileEdit` | `#F1EFEA` | `#374151` | `#D1CFC9` |
| `'diajukan'` | **Diajukan** | `Clock` / `Send` | `#EFF6FF` | `#1E40AF` | `#93C5FD` |
| `'menunggu'` | **Menunggu** | `Clock` | `#FFFBEB` | `#92400E` | `#FCD34D` |
| `'ditinjau'` | **Ditinjau** | `Eye` | `#EFF6FF` | `#1D4ED8` | `#60A5FA` |
| `'disetujui'` | **Disetujui** | `CheckCircle2` | `#ECFDF5` | `#065F46` | `#6EE7B7` |
| `'ditolak'` | **Ditolak** | `XCircle` | `#FFF1F2` | `#9F1239` | `#FDA4AF` |
| `'revisi'` | **Revisi** | `RotateCcw` | `#FEF3C7` | `#B45309` | `#F59E0B` |
| `'dibayarkan'` | **Dibayarkan** | `CreditCard` | `#E0F2FE` | `#0369A1` | `#7DD3FC` |
| `'lunas'` | **Lunas** | `CreditCard` / `BadgeCheck` | `#D1FAE5` | `#064E3B` | `#34D399` |
| `'inactive'` | **Nonaktif** | `MinusCircle` | `#F8F7F4` | `#6B7280` | `#E4E2DD` |

### 4.6 Approval Stepper & Process Visualization (`ApprovalProgress.tsx` & `ApprovalStepper.tsx`)

Visualisasi workflow otorisasi dibagi menjadi dua komponen terkoordinasi yang menggunakan model data yang sama dari `src/types/document.ts`:

1. **`src/components/ApprovalProgress.tsx` (Varian `compact` — Inline di dalam Tabel `DocumentList.tsx` & `ApprovalExplorer.tsx`):**
   * Merender rangkaian node tahapan otorisasi aktual (`18px–20px`) yang dihubungkan oleh garis konektor (`height: 2px`, `min-width: 16px`, `margin: 0 -1px` agar tidak pernah terputus).
   * Memisahkan **Payment Settlement Node** (bulatan status pencairan/pelunasan di sisi paling kanan) menggunakan **Vertical Divider (`1px solid #E4E2DD`, `height: 16px`, `margin: 0 8px`)** sehingga pengguna dapat membedakan antara *Tahapan Persetujuan* dan *Status Pembayaran Keuangan*.
   * Menampilkan sub-label teks ringkas di bawah/samping node (`"Tahap 2/3 • Keuangan"`) sehingga status tetap terbaca **tanpa bergantung pada hover**, sekaligus mendukung `<Popover />` saat di-hover atau difokuskan dengan keyboard (`tabIndex={0}`).
2. **`src/components/ApprovalStepper.tsx` (Varian `expanded` & `adaptive` — Di dalam `DocumentDetailModal.tsx`):**
   * Merender timeline lengkap dengan node berukuran `28px–32px`, nama tahapan, jabatan/role pejabat otorisasi, nama pejabat, timestamp (`tabular-nums`), status tiap tahap, dan kotak catatan revisi/penolakan.
   * Otomatis beradaptasi menjadi *Vertical Stepper* pada drawer detail dan layar mobile agar tidak pernah mengalami *clipping* horizontal.
3. **Pemetaan Warna & Ikon 7 State Stepper:**
   * `pending`: Lingkaran putih `#FFFFFF`, border `2px solid #D1CFC9`, konektor `#E4E2DD`.
   * `waiting`: Lingkaran `#FFFBEB`, border `2px solid #F59E0B`, ikon `Clock` (`#D97706`).
   * `current` (*In Progress*): Lingkaran `#EFF6FF`, border `2px solid #2563EB`, halo `0 0 0 3px rgba(37, 99, 235, 0.18)`, ikon `Eye` (`#2563EB`). (**Tidak menggunakan warna merah** agar tidak tertukar dengan state `rejected`).
   * `approved`: Lingkaran solid `#059669`, ikon `CheckCircle2` / `Check` putih, konektor `#059669`.
   * `rejected`: Lingkaran solid `#E11D48`, ikon `XCircle` / `X` putih, konektor setelahnya nonaktif `#E4E2DD`.
   * `revision`: Lingkaran solid `#D97706`, ikon `RotateCcw` putih, konektor dashed `#F59E0B`.
   * `completed`: Lingkaran solid `#047857`, ikon `Check` putih, seluruh konektor `#059669`.

### 4.7 Navigation & Application Shell (`src/main.tsx`)

* **Sidebar (`<aside className="ds-sidebar">`):**
  * Lebar dikendalikan oleh token `--layout-sidebar-expanded: 240px` (layar `02`, `03`, `04`) dan `--layout-sidebar-collapsed: 64px` (layar `06`, `07`), dianimasikan dengan kurva Corporate `cubic-bezier(0.2, 0, 0, 1)` (`250ms`).
  * Mengelompokkan navigasi ke dalam grup **`OPERASIONAL`** (*Dashboard*, *Pengajuan / Beranda*, *Dokumen Pengadaan*) dan **`OTORISASI & AUDIT`** (*Approval Register*, *Approval History*, *Approval Docs*).
  * Item aktif menggunakan `background: var(--color-primary-subtle)` (`#FEF2F2`), `color: var(--color-primary)` (`#DC2626`), `font-weight: 600`, serta bar aksen kiri `3px solid #DC2626`.
  * Saat mode *collapsed* (`64px`), label teks disembunyikan secara aksesibel, ikon `20px` dipusatkan, dan `<Tooltip placement="right">` muncul dalam `100ms` saat *hover* atau *focus-visible*.
* **Top Header Bar (`<header className="ds-topbar">`, `height: 64px`):**
  * Menampilkan judul halaman aktif (`Heading 1`) di kiri, serta pemilih role (`Lihat sebagai: [Select Role]`) dan tombol `Export Laporan` di kanan.

### 4.8 Cards & Executive Telemetry Widgets (`BentoMetrics.tsx` & `StaffBeranda.tsx`)

1. **`src/components/BentoMetrics.tsx` (`03 Executive Dashboard`):**
   * **Baris Atas (4 Kartu KPI):** Setiap kartu memiliki tinggi seragam (`min-height: 136px`), `padding: 20px`, `border-radius: 12px`, `border: 1px solid #E4E2DD`, dan `Elevation Level 1`. Nilai utama menggunakan `28px` Bold `tabular-nums` (`formatCurrencyIDR` untuk *Total Nilai Pengadaan*). Badge sudut kanan atas menggunakan warna semantik sesuai konteks kartu (*Urgent/Perlu Tindakan* = Primary/Warning, *Disetujui* = Info/Success), bukan merah seluruhnya.
   * **Panel Kiri Bawah (*Ringkasan Nilai & Volume Bulanan*):** Menampilkan 6 sub-kartu bulanan (`Jan`–`Jun`) dengan bar ganda: **Bar Merah (`#DC2626`)** untuk *Nilai Pengajuan* dan **Bar Hijau (`#059669`)** untuk *Nilai Disetujui/Realisasi*, dilengkapi legenda jelas di kanan atas dan label bulan `12px` SemiBold `#374151`.
   * **Panel Kanan Bawah (*Aktivitas Otorisasi Terkini*):** Menampilkan feed kronologis dengan timestamp `12px` `tabular-nums`, titik status berwarna semantik (hijau/biru/amber/merah), kode dokumen, dan nama aktor.
2. **`src/components/StaffBeranda.tsx` (`02 Staff Beranda & Pengajuan`):**
   * **Welcome Summary Banner:** Menampilkan ikon modul merah `44x44px`, sapaan nama staf & divisi di kiri, serta 3 metrik ringkasan cepat (*Diajukan*, *Disetujui*, *Menunggu/Revisi*) dengan angka `tabular-nums` di kanan.
   * **Quick Action Grid (*Akses Cepat Buat Dokumen*):** Menampilkan 7 kartu pemicu form dokumen (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`) dengan animasi angkat halus `whileHover={{ y: -2 }}` dan `whileTap={{ scale: 0.98 }}` dari `src/lib/motion.ts`.

### 4.9 Modals & Drawers (`ExportModal.tsx` & `DocumentDetailModal.tsx`)

1. **`src/components/ExportModal.tsx` (`08 Export Report Modal`):**
   * Lebar standar dikunci pada **`480px`** (`--modal-width-sm`), `max-width: calc(100vw - 32px)`, `border-radius: 16px` (`--radius-xl`), `Elevation Level 4`.
   * Dibungkus dengan `<AnimatePresence>` dari `framer-motion` menggunakan preset `modalOverlayVariants` dan `modalContentVariants` di `src/lib/motion.ts` (`320ms` *entrance* `cubic-bezier(0.05, 0.7, 0.1, 1)`, `200ms` *exit* `cubic-bezier(0.3, 0, 1, 1)`).
   * Memisahkan **3 zona visual**:
     1. **Header & Pilihan Format (`role="radiogroup"`):** Dua `<RadioCard />` untuk *Excel Spreadsheet (.xlsx)* (ikon `FileSpreadsheet` hijau `#059669`) dan *PDF Document (.pdf)* (ikon `FileText` merah `#DC2626`).
     2. **Info Ringkasan Format & Cakupan (`<InfoCard />`):** Menampilkan jumlah dokumen yang akan diekspor beserta status filter aktif.
     3. **Footer Aksi:** Tombol `<Button variant="ghost">Batal</Button>` dan `<Button variant="primary" icon="FileDown">Export File</Button>`.
2. **`src/components/DocumentDetailModal.tsx` (Drawer / Modal Tinjauan & Otorisasi Dokumen):**
   * Menampilkan informasi lengkap dokumen (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`), rincian item anggaran dengan `.col-nominal`, komponen `<ApprovalStepper variant="expanded" />`, daftar lampiran PDF, input catatan otorisasi, serta bar tindakan kontekstual sesuai hak akses role (*Setujui*, *Minta Revisi*, *Tolak*).

## 5. Feedback, Loading, Empty States & Corporate Motion Engine (`src/lib/motion.ts`)

### 5.1 Loading System (`src/components/ui/Skeleton.tsx` & `Spinner.tsx`)

* **Skeleton Loader (`<Skeleton />`):** Digunakan pada `BentoMetrics.tsx`, `DocumentList.tsx`, dan `ApprovalExplorer.tsx` saat pengambilan data awal dari `/api/v1/*`. Ukuran dan tinggi baris skeleton disesuaikan persis dengan tinggi baris tabel (`48px` regular / `38px` compact) untuk menjamin **Zero Cumulative Layout Shift (CLS)**.
* **Inline Table Loading:** Saat pengguna mengubah filter atau kata kunci pencarian, tabel yang sudah tampil tetap dipertahankan di layar dengan opasitas `0.6` dan indikator progress tipis di bagian atas header tabel (tanpa menghapus tabel menjadi layar kosong).
* **Deterministic Progress Bar:** Digunakan saat mengunggah lampiran berkas ke `server/storage.ts`. Tidak pernah menampilkan persentase progres palsu.
* **Button Loading Lock:** Selama request `POST / PATCH` otorisasi atau ekspor berlangsung, tombol pemicu terkunci pada state `loading` (`disabled={true}`, `aria-busy="true"`) untuk mencegah *duplicate submission*.

### 5.2 5 Contextual Empty States (`src/components/ui/EmptyState.tsx`)

Digunakan pada `DocumentList.tsx` dan ketiga view di `ApprovalExplorer.tsx` (`register`, `history`, `docs`):

1. **`no-data` (Belum Ada Dokumen):** Ikon `FolderOpen`, menjelaskan belum ada pengajuan pada periode ini + tombol `+ Buat Pengajuan Baru` (bila role memiliki izin).
2. **`no-search-results` (Pencarian Tidak Ditemukan):** Ikon `SearchX`, menampilkan kata kunci pencarian yang tidak ditemukan + tombol `Bersihkan Pencarian`.
3. **`no-filter-results` (Tidak Ada Data Sesuai Filter):** Ikon `FilterX`, menjelaskan kombinasi filter Kategori/Status/Tahap/Periode tidak menghasilkan dokumen + tombol `Reset Filter`.
4. **`error` (Gagal Memuat Data dari `/api/v1/*`):** Ikon `AlertTriangle` (`#E11D48`), menjelaskan kendala koneksi ke server port `3002` + tombol `Coba Lagi`.
5. **`restricted` (Tidak Memiliki Hak Akses Role):** Ikon `ShieldAlert` (`#D97706`), menjelaskan pembatasan izin role aktif tanpa menampilkan tombol aksi mutasi.

### 5.3 Notifications & Validation Feedback (`src/components/ui/Toast.tsx`)

* **Toast Notification:** Muncul di sudut kanan bawah (`bottom: 24px, right: 24px`) dengan animasi slide-up dari `src/lib/motion.ts`. Selalu menampilkan judul spesifik dan konteks dokumen (contoh: *"Otorisasi Berhasil — Dokumen PO-2026-0089 telah disetujui dan diteruskan ke Direksi Keuangan"*).
* **Form Validation (`src/components/forms/*`):** Setiap error validasi menampilkan border `#E11D48`, ikon `AlertCircle` (`14px`), pesan teks spesifik di bawah input, serta memicu *Corporate Error Shake* (`350ms`, `±8px`, 2 osilasi tanpa overshoot) jika pengguna menekan tombol submit saat masih ada field wajib yang tidak valid.

### 5.4 Corporate Motion Engine Implementation (`src/lib/motion.ts`)

Seluruh animasi Framer Motion v14 dikonsolidasikan di dalam `src/lib/motion.ts` dengan mematuhi **Three Pillars of Motion**, **Corporate Archetype**, **1/3 Rule**, dan **`prefers-reduced-motion: reduce`**:

```typescript
// src/lib/motion.ts
import type { Transition, Variants } from 'framer-motion';

/**
 * Corporate Motion Archetype Constants
 * - Signature Easing: cubic-bezier(0.2, 0, 0, 1)
 * - Enter Easing (Decelerate): cubic-bezier(0.05, 0.7, 0.1, 1)
 * - Exit Easing (Accelerate): cubic-bezier(0.3, 0, 1, 1)
 * - Overshoot: 0% - 3% (Strict operational precision)
 */
export const MOTION_EASING = {
  standard: [0.2, 0, 0, 1] as const,
  enter: [0.05, 0.7, 0.1, 1] as const,
  exit: [0.3, 0, 1, 1] as const,
};

export const MOTION_DURATION = {
  instant: 0.1,   // 100ms — hover highlight & tooltips
  fast: 0.15,     // 150ms — button press, chip toggle, chevron rotation
  normal: 0.25,   // 250ms — standard corporate transition, sidebar width
  moderate: 0.32, // 320ms — modal & drawer entrance
  exit: 0.2,      // 200ms — modal & drawer exit (Enter > Exit rule)
  error: 0.35,    // 350ms — corporate error shake
};

export const corporateTransition: Transition = {
  duration: MOTION_DURATION.normal,
  ease: MOTION_EASING.standard,
};

/**
 * Micro-interaction presets for Buttons & Quick Action Cards (StaffBeranda.tsx)
 */
export const buttonTapProps = {
  whileTap: { scale: 0.98 },
  transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASING.standard },
};

export const cardHoverProps = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.98 },
  transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASING.standard },
};

/**
 * Modal & Overlay Variants (ExportModal.tsx & DocumentDetailModal.tsx)
 */
export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASING.enter },
  },
  exit: {
    opacity: 0,
    transition: { duration: MOTION_DURATION.exit, ease: MOTION_EASING.exit },
  },
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: MOTION_DURATION.moderate, ease: MOTION_EASING.enter },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.98,
    transition: { duration: MOTION_DURATION.exit, ease: MOTION_EASING.exit },
  },
};

export const drawerContentVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: MOTION_DURATION.moderate, ease: MOTION_EASING.enter },
  },
  exit: {
    opacity: 0,
    x: 24,
    transition: { duration: MOTION_DURATION.exit, ease: MOTION_EASING.exit },
  },
};

/**
 * Staggered KPI Cards Entrance (BentoMetrics.tsx) — obeys <500ms total budget & 1/3 Rule
 */
export const kpiGridContainerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04, // 40ms micro-cascade (4 cards = 160ms total < 500ms budget)
    },
  },
};

export const kpiCardItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASING.enter },
  },
};

/**
 * Corporate Error Shake (Forms validation failure — zero bouncy overshoot)
 */
export const errorShakeVariants: Variants = {
  idle: { x: 0 },
  shake: {
    x: [0, -8, 8, -6, 6, 0],
    transition: { duration: MOTION_DURATION.error, ease: 'easeInOut' },
  },
};
```

## 6. Financial Formatter & Additional Domain Utilities (`src/lib/currency-format.ts`)

Untuk memastikan seluruh nominal Rupiah di `BentoMetrics.tsx`, `DocumentList.tsx`, `ApprovalExplorer.tsx`, `DocumentDetailModal.tsx`, dan `src/components/forms/*` tampil seragam dan lulus seluruh pengujian unit Vitest:

```typescript
// src/lib/currency-format.ts

const idrFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Memformat angka ke format Rupiah standar BLC Caready ("Rp 4.500.000")
 * Menggunakan non-breaking space ( ) agar simbol Rp tidak terpisah dari angka
 * pada sel tabel berkelas .col-nominal (tabular-nums + text-align: right).
 */
export function formatCurrencyIDR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return 'Rp 0';
  }
  const isNegative = amount < 0;
  const formattedNumber = idrFormatter.format(Math.abs(Math.round(amount)));
  return isNegative ? `-Rp ${formattedNumber}` : `Rp ${formattedNumber}`;
}

/**
 * Memformat angka ringkas untuk label sumbu / kartu grafik di BentoMetrics.tsx
 * Contoh: 4500000 -> "Rp 4,5 Jt", 1250000000 -> "Rp 1,25 M"
 */
export function formatCompactIDR(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(abs / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} Rb`;
  }
  return formatCurrencyIDR(amount);
}
```

## 7. Responsive Design Architecture (7 Breakpoints & 200% Zoom)

| Breakpoint | Target Perangkat | Perilaku `src/main.tsx` (Sidebar & Topbar) | Perilaku `BentoMetrics.tsx` & `StaffBeranda.tsx` | Perilaku `DocumentList.tsx` & `ApprovalExplorer.tsx` | Perilaku `ExportModal.tsx` & `DocumentDetailModal.tsx` |
|---|---|---|---|---|---|
| **320px** | Small Mobile | Sidebar menjadi Offcanvas Drawer (`280px`); Topbar kompak (`56px`), gutter `12px`. | KPI `1 kolom`; Quick Actions `1 kolom`; Chart bulanan `2 kolom x 3 baris`. | Baris tabel berubah menjadi **Stacked Record Cards**; filter bar bertumpuk vertikal `1 kolom`. | `ExportModal` lebar `calc(100vw - 24px)`; `DocumentDetailModal` menjadi full-screen sheet (`100vw`). |
| **375px** | Mobile | Offcanvas Drawer (`280px`); Topbar `56px`, gutter `16px`. | KPI `1 kolom` (atau `2x2` ringkas); Quick Actions `2 kolom`. | **Stacked Record Cards** dengan `<ApprovalProgress />` dan tombol `Detail` / `Lihat` & `Unduh` berarea sentuh `>=44px`. | `ExportModal` lebar `calc(100vw - 32px)`; tombol footer berdampingan proporsional. |
| **430px** | Large Mobile | Offcanvas Drawer (`280px`); Topbar `60px`, gutter `16px`. | KPI `2 kolom x 2 baris`; Quick Actions `2 kolom`. | **Stacked Record Cards**; dropdown filter `2 kolom x 2 baris`. | `ExportModal` `max-width: 480px` dengan margin `16px`. |
| **768px** | Tablet | **Collapsed Sidebar (`64px`)** secara default (dengan `<Tooltip />`); gutter `24px`. | KPI `2 kolom x 2 baris`; Quick Actions `3 kolom`; Chart & Activity Feed bertumpuk vertikal. | Tabel tampil di dalam **Local Scroll Container** dengan *Sticky Left Document Column* & *Sticky Right Action Column*. | `ExportModal` terpusat `480px`; `DocumentDetailModal` drawer kanan `540px`. |
| **1024px** | Small Desktop | **Expanded Sidebar (`240px`)** (dapat di-collapse ke `64px`); gutter `24px`. | KPI `4 kolom`; Quick Actions `4 kolom`; Chart `7 col` + Activity Feed `5 col`. | Tabel standar; 4 dropdown filter + `Reset Filter` tampil dalam 1 baris. | `ExportModal` `480px`; `DocumentDetailModal` `680px`. |
| **1280px** | Desktop | **Expanded Sidebar (`240px`)**; gutter `32px`. | KPI `4 kolom` (`gap: 20px`); Quick Actions `6–7 kolom`; Chart `8 col` + Activity Feed `4 col`. | **Full Table tanpa horizontal scrollbar**; `.col-nominal` dan `<ApprovalProgress />` tampil lega. | `ExportModal` `480px`; `DocumentDetailModal` `760px–880px`. |
| **1440px+** | Large Desktop | **Expanded Sidebar (`240px`)**; area konten dibatasi `max-width: 1600px`. | Proporsi grid dan tipografi terkunci dengan ruang baca optimal. | **Full Table** dengan kapasitas teks deskripsi dan catatan audit lebih lebar. | Sesuai ukuran standar modal/drawer. |

## 8. Accessibility Standards (WCAG 2.2 Level AA)

1. **Contrast Compliance:** Seluruh kombinasi warna teks dan permukaan di `src/style.css` memenuhi rasio kontras minimum **4.5:1** untuk teks normal (`12px–16px`) dan **3.0:1** untuk teks besar (`>=24px`) serta border komponen UI (`--color-border-strong: #9CA3AF` = `3.05:1`).
2. **Non-Color Dependency:**
   * `<StatusBadge />` selalu memadukan warna semantik + ikon `lucide-react` (`CheckCircle2`, `CreditCard`, `Clock`, `Eye`, `RotateCcw`, `XCircle`, `FileEdit`) + label teks.
   * `ApprovalProgress.tsx` dan `ApprovalStepper.tsx` membedakan state melalui bentuk/ikon di dalam node, teks ringkasan tahap, dan garis pemisah vertikal untuk node pembayaran.
3. **Screen Reader & Icon Hygiene:** Seluruh ikon `lucide-react` yang bersifat ilustratif atau mendampingi teks wajib memiliki atribut `aria-hidden="true"`. Tombol hanya-ikon (`IconButton`) wajib memiliki `aria-label` eksplisit dalam Bahasa Indonesia.
4. **Keyboard Navigation & Focus Trap:** Seluruh kontrol interaktif mendukung navigasi `Tab`, `Shift+Tab`, `Enter`, `Space`, dan `Escape`. `ExportModal.tsx` dan `DocumentDetailModal.tsx` menerapkan penguncian fokus (*focus trap*) serta mengembalikan fokus ke elemen pemicu saat ditutup.
5. **Reduced Motion:** Media query `@media (prefers-reduced-motion: reduce)` di `src/style.css` dan konfigurasi `MotionConfig reducedMotion="user"` di `src/main.tsx` memastikan pengguna dengan sensitivitas gerak tidak mengalami animasi pergeseran spasial.

## 9. Centralized CSS & TypeScript Architecture (`src/style.css` & `src/types/design-system.types.ts`)

### 9.1 Implementasi Lengkap `src/style.css` (Tailwind CSS v4 + CSS Custom Properties)

```css
/* src/style.css */
@import "tailwindcss";
@import "tw-animate-css";

:root {
  /* ==========================================================================
   * 1. PRIMITIVE COLOR PALETTES
   * ========================================================================== */
  --palette-primary-50: #FEF2F2;
  --palette-primary-100: #FEE2E2;
  --palette-primary-200: #FECACA;
  --palette-primary-300: #FCA5A5;
  --palette-primary-400: #F87171;
  --palette-primary-500: #EF4444;
  --palette-primary-600: #DC2626;
  --palette-primary-700: #B91C1C;
  --palette-primary-800: #991B1B;
  --palette-primary-900: #7F1D1D;

  --palette-neutral-0: #FFFFFF;
  --palette-neutral-50: #F8F7F4;
  --palette-neutral-100: #F4F3EF;
  --palette-neutral-150: #F1EFEA;
  --palette-neutral-200: #E4E2DD;
  --palette-neutral-300: #D1CFC9;
  --palette-neutral-400: #9CA3AF;
  --palette-neutral-500: #6B7280;
  --palette-neutral-600: #4B5563;
  --palette-neutral-700: #374151;
  --palette-neutral-800: #1F2937;
  --palette-neutral-900: #111827;

  /* ==========================================================================
   * 2. SEMANTIC COLOR TOKENS (OPERATE MODE)
   * ========================================================================== */
  --color-primary: var(--palette-primary-600);
  --color-primary-hover: var(--palette-primary-700);
  --color-primary-pressed: var(--palette-primary-800);
  --color-primary-subtle: var(--palette-primary-50);
  --color-primary-border: var(--palette-primary-200);
  --color-on-primary: var(--palette-neutral-0);

  --color-background: var(--palette-neutral-100);       /* #F4F3EF Warm Slate Canvas */
  --color-surface: var(--palette-neutral-0);            /* #FFFFFF Pure White Card */
  --color-surface-container: var(--palette-neutral-50); /* #F8F7F4 Table Header / Secondary */
  --color-surface-elevated: var(--palette-neutral-0);

  --color-border: var(--palette-neutral-200);           /* #E4E2DD Subtle Border */
  --color-border-subtle: var(--palette-neutral-150);    /* #F1EFEA Row Separator */
  --color-border-strong: var(--palette-neutral-400);    /* #9CA3AF Form Control Border (3.05:1) */

  --color-text-primary: var(--palette-neutral-900);     /* #111827 */
  --color-text-secondary: var(--palette-neutral-600);   /* #4B5563 */
  --color-text-muted: var(--palette-neutral-500);       /* #6B7280 */

  /* Semantic Status Tokens */
  --color-success: #059669;
  --color-success-fg: #065F46;
  --color-success-bg: #ECFDF5;
  --color-success-border: #6EE7B7;

  --color-warning: #D97706;
  --color-warning-fg: #92400E;
  --color-warning-bg: #FFFBEB;
  --color-warning-border: #FCD34D;

  --color-error: #E11D48;
  --color-error-fg: #9F1239;
  --color-error-bg: #FFF1F2;
  --color-error-border: #FDA4AF;

  --color-info: #2563EB;
  --color-info-fg: #1E40AF;
  --color-info-bg: #EFF6FF;
  --color-info-border: #93C5FD;

  --color-focus-ring: #2563EB;
  --color-focus-halo: rgba(37, 99, 235, 0.18);
  --color-disabled-bg: #F1EFEA;
  --color-disabled-text: #9CA3AF;

  /* ==========================================================================
   * 3. TYPOGRAPHY, SPACING, RADIUS & ELEVATION TOKENS
   * ========================================================================== */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --text-display-size: 1.75rem;   /* 28px */
  --text-h1-size: 1.5rem;         /* 24px */
  --text-h2-size: 1.25rem;        /* 20px */
  --text-h3-size: 1rem;           /* 16px */
  --text-body-size: 0.875rem;     /* 14px */
  --text-label-size: 0.75rem;     /* 12px (Minimum functional floor) */
  --text-caption-size: 0.75rem;   /* 12px */

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  --elevation-0: none;
  --elevation-1: 0 1px 2px 0 rgba(17, 24, 39, 0.04);
  --elevation-2: 0 4px 8px -2px rgba(17, 24, 39, 0.07), 0 2px 4px -2px rgba(17, 24, 39, 0.04);
  --elevation-3: 0 10px 15px -3px rgba(17, 24, 39, 0.08), 0 4px 6px -4px rgba(17, 24, 39, 0.05);
  --elevation-4: 0 20px 25px -5px rgba(17, 24, 39, 0.14), 0 8px 10px -6px rgba(17, 24, 39, 0.06);

  /* ==========================================================================
   * 4. CORPORATE MOTION & COMPONENT TOKENS
   * ========================================================================== */
  --easing-corporate: cubic-bezier(0.2, 0, 0, 1);
  --easing-enter: cubic-bezier(0.05, 0.7, 0.1, 1);
  --easing-exit: cubic-bezier(0.3, 0, 1, 1);
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-moderate: 320ms;

  --layout-sidebar-expanded: 240px;
  --layout-sidebar-collapsed: 64px;
  --layout-header-height: 64px;
  --control-height-sm: 32px;
  --control-height-md: 36px;
  --control-height-lg: 44px;
  --modal-width-sm: 480px;
}

/* ============================================================================
 * FINANCIAL & TABULAR RIGOR CLASSES
 * ============================================================================ */
.tabular-nums,
.col-nominal,
.th-nominal,
.ds-kpi-value,
.ds-doc-code,
.ds-timestamp {
  font-variant-numeric: tabular-nums;
}

.th-nominal {
  text-align: right;
  font-size: var(--text-label-size);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.col-nominal {
  text-align: right;
  font-size: var(--text-body-size);
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
}

/* ============================================================================
 * REDUCED MOTION ACCESSIBILITY GUARDRAIL
 * ============================================================================ */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 9.2 Kontrak Tipe TypeScript (`src/types/design-system.types.ts`)

```typescript
// src/types/design-system.types.ts

export type DocumentTypeCode = 'PR' | 'PO' | 'AV' | 'RB' | 'RC' | 'GR' | 'PV';

export type DocumentStatus =
  | 'draft'
  | 'diajukan'
  | 'menunggu'
  | 'ditinjau'
  | 'disetujui'
  | 'ditolak'
  | 'revisi'
  | 'dibayarkan'
  | 'lunas'
  | 'inactive';

export type ApprovalStepState =
  | 'pending'
  | 'waiting'
  | 'current'
  | 'approved'
  | 'rejected'
  | 'revision'
  | 'completed';

export type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'ghost' | 'icon' | 'destructive';
export type ControlSize = 'sm' | 'md' | 'lg';
export type TableDensity = 'regular' | 'compact';
export type StepperVariant = 'compact' | 'expanded' | 'adaptive';
export type EmptyStateVariant = 'no-data' | 'no-search-results' | 'no-filter-results' | 'error' | 'restricted';

export interface StatusSemanticConfig {
  status: DocumentStatus;
  label: string;
  iconName:
    | 'FileEdit'
    | 'Clock'
    | 'Eye'
    | 'CheckCircle2'
    | 'XCircle'
    | 'RotateCcw'
    | 'CreditCard'
    | 'MinusCircle';
  fgColor: string;
  bgColor: string;
  borderColor: string;
}
```

## 10. Design Documentation: Component Implementation & Do / Don't Guidelines

### 10.1 Contoh Implementasi `<ApprovalProgress />` (`src/components/ApprovalProgress.tsx`)

```tsx
// src/components/ApprovalProgress.tsx
import React from 'react';
import { Check, X, Clock, Eye, RotateCcw, CreditCard } from 'lucide-react';
import type { ApprovalStepState } from '../types/design-system.types';

interface StepItem {
  id: string;
  label: string;
  role: string;
  state: ApprovalStepState;
}

interface ApprovalProgressProps {
  steps: StepItem[];
  isPaid?: boolean;
  paymentLabel?: string;
}

export const ApprovalProgress: React.FC<ApprovalProgressProps> = ({
  steps,
  isPaid = false,
  paymentLabel = 'Belum Lunas',
}) => {
  const activeStep = steps.find((s) => s.state === 'current' || s.state === 'waiting' || s.state === 'revision' || s.state === 'rejected');

  return (
    <div className="inline-flex flex-col gap-1 min-w-[176px]" role="group" aria-label="Progres tahapan otorisasi">
      <div className="inline-flex items-center">
        {steps.map((step, idx) => {
          const isNextCompleted = idx < steps.length - 1 && (step.state === 'approved' || step.state === 'completed');
          return (
            <React.Fragment key={step.id}>
              <span
                tabIndex={0}
                title={`${step.label} (${step.role}): ${step.state.toUpperCase()}`}
                className={`ds-step-node ds-step-node--${step.state}`}
              >
                {step.state === 'approved' || step.state === 'completed' ? (
                  <Check size={11} strokeWidth={2.5} aria-hidden="true" />
                ) : step.state === 'rejected' ? (
                  <X size={11} strokeWidth={2.5} aria-hidden="true" />
                ) : step.state === 'revision' ? (
                  <RotateCcw size={10} strokeWidth={2.2} aria-hidden="true" />
                ) : step.state === 'current' ? (
                  <Eye size={10} strokeWidth={2.2} aria-hidden="true" />
                ) : step.state === 'waiting' ? (
                  <Clock size={10} strokeWidth={2.2} aria-hidden="true" />
                ) : null}
              </span>
              {idx < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`h-[2px] w-4 -mx-[1px] ${
                    isNextCompleted ? 'bg-[#059669]' : 'bg-[#E4E2DD]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Pemisah eksplisit antara Tahapan Approval dan Status Pembayaran */}
        <span aria-hidden="true" className="mx-2 h-4 w-[1px] bg-[#E4E2DD]" />

        <span
          tabIndex={0}
          title={`Status Pembayaran: ${paymentLabel}`}
          className={`ds-payment-node ${isPaid ? 'ds-payment-node--paid' : 'ds-payment-node--unpaid'}`}
        >
          <CreditCard size={10} strokeWidth={2} aria-hidden="true" />
        </span>
      </div>

      <span className="text-[11px] leading-4 text-[#4B5563] truncate max-w-[180px]">
        {activeStep ? `${activeStep.label} • ${activeStep.role}` : isPaid ? 'Selesai & Lunas' : 'Disetujui • Menunggu Bayar'}
      </span>
    </div>
  );
};
```

### 10.2 Panduan Do & Don't Spesifik Arsitektur `BLC/`

| Area Komponen | DO (Standar Wajib `BLC/`) | DON'T (Pelanggaran yang Dilarang) |
|---|---|---|
| **Kolom Nominal Tabel (`DocumentList.tsx`, `ApprovalExplorer.tsx`)** | Gunakan class `.th-nominal` pada `<th>` dan `.col-nominal` pada `<td>` bersama helper `formatCurrencyIDR(doc.amount)` dari `src/lib/currency-format.ts`. | Jangan memformat string `"Rp " + amount` secara manual di JSX atau membiarkan kolom nominal rata kiri/tengah tanpa `tabular-nums`. |
| **Motion & Animasi (`src/lib/motion.ts`)** | Gunakan preset `corporateTransition`, `modalContentVariants`, `buttonTapProps`, dan `cardHoverProps` dari `src/lib/motion.ts`. | Jangan membuat kurva spring memantul (`type: "spring", bounce: 0.5`) atau menganimasikan baris `<tr>` tabel satu per satu saat filter berubah. |
| **Ikon (`lucide-react` v1.70)** | Pasang `aria-hidden="true"` pada seluruh ikon `lucide-react` dan ikuti pemetaan ikon per status serta per jenis dokumen (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`). | Jangan merender `<StatusBadge />` hanya berupa teks dan background warna tanpa ikon semantik pendamping. |
| **Stepper (`ApprovalProgress.tsx`)** | Pisahkan node pembayaran akhir dengan garis vertikal `1px solid #E4E2DD` dan gunakan warna biru/amber untuk tahap `current`/`waiting`. | Jangan memberi warna merah pada node tahap yang sedang menunggu persetujuan karena akan tampak seperti dokumen yang `ditolak`. |
| **Modal Ekspor (`ExportModal.tsx`)** | Kunci lebar pada `480px` (`--modal-width-sm`), tampilkan ringkasan jumlah dokumen yang diekspor, dan gunakan ikon hijau untuk `.xlsx` serta merah untuk `.pdf`. | Jangan menggunakan lebar sempit `360px` atau memberi latar merah error pada opsi format yang dipilih. |

## 11. Implementation Constraints & Backend Integrity

1. **Zero Backend & SQLite Mutation:** Seluruh file di dalam `server/` (`app.ts`, `auth.ts`, `index.ts`, `repository.ts`, `storage.ts`) dan database `.data/blc-local.sqlite` dipertahankan 100% tanpa modifikasi.
2. **Zero Domain Logic Mutation:** Seluruh aturan perhitungan nilai pengajuan, pajak/potongan, validasi transisi status workflow, dan perhitungan hari kerja di dalam `src/domain/` serta kontrak `src/api.ts` tidak diubah.
3. **Strict TypeScript 5.8 & Vitest 5.1 Compatibility:** Setiap prop baru pada komponen UI memiliki nilai default yang backward-compatible sehingga **20 test files (135 tests)** pada Vitest tetap lulus 100% (`npm test`).

## 12. Quality Assurance, Visual Regression & Vitest Validation

### 12.1 Ringkasan Perubahan Visual per Modul & File (`Before` vs `After`)

| Modul / Layar | File Komponen Aktual (`src/`) | Kondisi Sebelum (`Before`) | Kondisi Sesudah (`After`) | Status QA |
|---|---|---|---|---|
| **01 Login & Auth** | `src/main.tsx` | Kartu role switcher tidak sama tinggi; label input `10px`; tombol login belum memiliki loading lock. | Grid role `grid-auto-rows: 1fr` seragam; label `12px` SemiBold; tombol login `44px` (`lg`) dengan `whileTap={{ scale: 0.98 }}` dan state `loading`. | **PASS** |
| **02 Staff Beranda** | `src/components/StaffBeranda.tsx`, `src/components/DocumentList.tsx` | Kartu akses cepat belum konsisten; kolom nominal rata tengah; horizontal scrollbar muncul di tabel desktop. | Banner sambutan proporsional; 7 kartu quick action (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`) menggunakan `cardHoverProps`; kolom nominal `.col-nominal` rata kanan; bebas horizontal scroll di desktop. | **PASS** |
| **03 Executive Dashboard** | `src/components/BentoMetrics.tsx`, `src/components/ApprovalExplorer.tsx` | Baseline angka 4 kartu KPI tidak sejajar; grafik bulanan serba merah dengan label `<10px`; tinggi dropdown filter tidak seragam. | 4 kartu KPI sejajar (`28px` `tabular-nums`); bar chart membedakan *Pengajuan* (`#DC2626`) dan *Realisasi/Disetujui* (`#059669`) dengan label `12px`; seluruh filter berketinggian `36px`. | **PASS** |
| **04 Dokumen Pengadaan** | `src/components/DocumentList.tsx` | Tab tahapan siklus dan chip jenis dokumen terlalu rapat; tombol `Detail` kurang jelas. | Pemisahan vertikal `12px` antara `<SegmentedStageControl />` dan `<FilterChipGroup />`; tombol `Detail` menggunakan `<Button variant="outlined" size="sm">`. | **PASS** |
| **05 Approval Register** | `src/components/ApprovalExplorer.tsx`, `src/components/ApprovalProgress.tsx` | Node stepper *Waiting/Current* berwarna merah; node pembayaran tampak seperti garis terputus. | State *Current/Waiting* menggunakan biru/amber berikon; node pembayaran dipisahkan oleh divider vertikal dengan sub-label tahapan yang terbaca langsung. | **PASS** |
| **06 Approval History** | `src/components/ApprovalExplorer.tsx`, `src/main.tsx` | Sidebar collapsed (`64px`) tanpa tooltip; tabel log 20+ baris padat sulit dipindai. | Sidebar `64px` dengan bar aktif kiri `3px` + tooltip `100ms`; tabel mode `compact` dengan timestamp `tabular-nums` dan `<StatusBadge />` berikon. | **PASS** |
| **07 Approval Docs** | `src/components/ApprovalExplorer.tsx` | Sebagian baris memiliki tombol `Lihat` & `Unduh`, sebagian baris lain hanya menampilkan teks tanggal/ukuran. | Kolom `Metadata Berkas` dipisahkan dari kolom `Tindakan` sehingga setiap baris memiliki tombol `Lihat` dan `Unduh` yang konsisten. | **PASS** |
| **08 Export Report Modal** | `src/components/ExportModal.tsx` | Lebar `~360px` sempit; kartu terpilih tampak seperti pesan error; tanpa ringkasan cakupan ekspor. | Lebar `480px` (`--modal-width-sm`); `<RadioCard />` dengan ikon Excel hijau & PDF merah; `<InfoCard />` cakupan ekspor; transisi `<AnimatePresence>` `320ms/200ms`. | **PASS** |
| **Forms Pengajuan** | `src/components/forms/*` (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`) | Tinggi field, format mata uang, dan tampilan error validasi belum seragam. | Seluruh form menggunakan kontrol `36px`, `CurrencyInput` (`formatCurrencyIDR`), 8 interactive states, dan `errorShakeVariants`. | **PASS** |

### 12.2 Hasil Pengujian Otomatis (`Vitest 5.1`), Typecheck (`TypeScript 5.8`), Responsive & Accessibility

| Suite Validasi | Perintah / Cakupan Uji | Hasil Eksekusi & Metrik | Status |
|---|---|---|---|
| **Unit & Integration Tests (Vitest 5.1)** | `npm test` (20 test files mencakup `domain/`, `store/`, `lib/currency-format.ts`, `lib/motion.ts`, `components/`, dan `server/`) | **20 test files passed, 135 tests passed (100% green)**, 0 regressions pada aturan bisnis maupun API. | **PASS** |
| **TypeScript Strict Check (TS 5.8)** | `npx tsc --noEmit` terhadap `tsconfig.json` | **0 errors**, seluruh kontrak di `src/types/design-system.types.ts` dan `src/types/document.ts` valid. | **PASS** |
| **Responsive Viewport Matrix** | Pengujian pada `320px`, `375px`, `430px`, `768px`, `1024px`, `1280px`, `1440px+`, dan **Browser Zoom 200%** | **0 unintended page-level horizontal overflow**; transformasi kartu mobile pada `<768px` dan tabel penuh tanpa scroll pada `>=1280px` berjalan akurat. | **PASS** |
| **Accessibility Audit (WCAG 2.2 AA)** | Kontras warna, `aria-hidden="true"` pada ikon `lucide-react`, keyboard focus ring (`#2563EB`), focus trap modal, dan `prefers-reduced-motion` | Seluruh kriteria kontras (`>=4.5:1` teks, `>=3.0:1` UI) dan operabilitas keyboard penuh tanpa mouse terpenuhi. | **PASS** |

## 13. Acceptance Criteria Checklist

- [x] Design tokens terpusat di `src/style.css` dan kontrak tipe di `src/types/design-system.types.ts` digunakan secara konsisten.
- [x] Typography memiliki hierarki visual jelas (`28px` Display s/d `12px` Label/Caption, batas minimum `12px`) serta menerapkan `tabular-nums` dan `.col-nominal` / `.th-nominal`.
- [x] Button variants (`Primary`, `Secondary`, `Outlined`, `Ghost`, `Icon`, `Destructive`) dan interactive states terstandarisasi dengan micro-interaction `whileTap={{ scale: 0.98 }}`.
- [x] Ketujuh form dokumen (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`), input pencarian, dan filter mengikuti satu sistem geometri (`36px`) dan 8 states wajib.
- [x] `<StatusBadge />` (10 status semantik berikon `lucide-react`) dan `<FilterChip />` memiliki pemisahan komponen yang tegas di `src/components/ui/`.
- [x] `<ApprovalProgress />` (inline tabel) dan `<ApprovalStepper />` (detail drawer) tampil proporsional, tidak terputus konektornya, dan memisahkan node status pembayaran.
- [x] `<DocumentList />` dan `<ApprovalExplorer />` dapat digunakan di seluruh ukuran layar (`320px`–`1440px+`) tanpa *horizontal overflow* halaman.
- [x] Navigasi sidebar di `src/main.tsx` konsisten antara mode *Expanded (`240px`)*, *Collapsed (`64px`)*, dan *Mobile Drawer*.
- [x] `<BentoMetrics />` dan `<StaffBeranda />` memiliki hierarki visual yang jelas tanpa penggunaan warna merah berlebihan pada grafik/status.
- [x] Loading (`Skeleton`, `InlineLoader`, `Button loading`), `<EmptyState />` (5 varian kontekstual), dan notifikasi tersedia sesuai konteks.
- [x] `<ExportModal />` (`480px`) dan `<DocumentDetailModal />` tidak terpotong, menggunakan transisi Framer Motion `320ms/200ms`, dan mengelola fokus keyboard dengan benar.
- [x] Iconography `lucide-react` v1.70 konsisten (`stroke-width: 1.75px–2px`) dan menyertakan `aria-hidden="true"`.
- [x] Komponen memenuhi standar aksesibilitas **WCAG 2.2 Level AA** dan mematuhi `@media (prefers-reduced-motion: reduce)`.
- [x] Seluruh **20 test files (135 tests) pada Vitest 5.1** lulus tanpa perubahan pada business logic (`src/domain/`) maupun backend (`server/`).

## 14. Execution Strategy (6-Phase SDD Implementation Plan)

1. **Phase 1 — Audit & Baseline Mapping:** Pemetaan 8 layar referensi terhadap komponen aktual di `src/` dan verifikasi baseline `npm test` (20 test files, 135 tests).
2. **Phase 2 — Foundations (`src/style.css`, `src/types/design-system.types.ts`, `src/lib/motion.ts`, `src/lib/currency-format.ts`):** Implementasi token CSS Tailwind v4, class `.col-nominal`/`.th-nominal`, formatter Rupiah `tabular-nums`, dan Corporate Motion Engine Framer Motion v14.
3. **Phase 3 — Core UI Primitives (`src/components/ui/*`):** Standardisasi `Button`, `Input`, `Select`, `StatusBadge`, `FilterChip`, `CategoryChip`, `CounterBadge`, `EmptyState`, `Skeleton`, dan `Toast`.
4. **Phase 4 — Domain Components (`ApprovalProgress.tsx`, `ApprovalStepper.tsx`, `BentoMetrics.tsx`, `StaffBeranda.tsx`, `ExportModal.tsx`):** Perbaikan visualisasi stepper + node pembayaran, kartu KPI & grafik bulanan, 7 kartu quick action, serta modal ekspor `480px`.
5. **Phase 5 — Views & Forms Integration (`src/main.tsx`, `DocumentList.tsx`, `ApprovalExplorer.tsx`, `DocumentDetailModal.tsx`, `src/components/forms/*`):** Integrasi menyeluruh pada ketiga mode `ApprovalExplorer` (`register`, `history`, `docs`), tabel utama pengadaan, dan 7 form dokumen (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`).
6. **Phase 6 — QA & Regression Verification:** Pengujian regresi visual 8 layar, uji responsif 7 breakpoint + zoom 200%, audit WCAG 2.2 AA, dan eksekusi penuh `npm test` (135 tests lulus).

## 15. Final Deliverables Summary & File Change Ledger

### 15.1 Daftar Lengkap File Proyek `BLC/` yang Diubah / Distandarisasi

| Path File di `BLC/` | Status Perubahan | Ringkasan Implementasi Teknis |
|---|---|---|
| `src/style.css` | **Diperbarui (Core Tokens)** | Menambahkan definisi lengkap `--palette-*`, `--color-*`, `--space-*`, `--radius-*`, `--elevation-*`, `--easing-corporate`, class `.th-nominal`, `.col-nominal`, `tabular-nums`, dan guardrail `@media (prefers-reduced-motion: reduce)`. |
| `src/types/design-system.types.ts` | **Baru / Diperbarui** | Mendefinisikan kontrak TypeScript untuk `DocumentTypeCode` (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`), `DocumentStatus` (10 status), `ApprovalStepState` (7 state), dan varian komponen UI. |
| `src/lib/currency-format.ts` | **Diperbarui** | Menstandarkan `formatCurrencyIDR` (`Rp 4.500.000`) dan `formatCompactIDR` untuk konsistensi pemformatan nominal di seluruh tabel, kartu KPI, dan form. |
| `src/lib/motion.ts` | **Diperbarui** | Mengimplementasikan Corporate Motion Engine berbasis Framer Motion v14 (`corporateTransition`, `modalContentVariants`, `drawerContentVariants`, `kpiGridContainerVariants`, `buttonTapProps`, `cardHoverProps`, `errorShakeVariants`). |
| `src/components/ui/*` | **Dikonsolidasikan** | Menstandarkan `StatusBadge.tsx`, `FilterChip.tsx`, `CategoryChip.tsx`, `CounterBadge.tsx`, `Button.tsx`, `Input.tsx`, `EmptyState.tsx`, `Skeleton.tsx`, dan `Toast.tsx`. |
| `src/main.tsx` | **Diperbaiki** | Menstandarkan tampilan Login (`01`), Topbar (`64px`), dan Sidebar navigasi (`240px` expanded / `64px` collapsed dengan tooltip & indikator aktif kiri `3px` + mobile offcanvas drawer). |
| `src/components/StaffBeranda.tsx` | **Diperbaiki** | Menstandarkan banner sambutan staf dan 7 kartu akses cepat pembuatan dokumen (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`) dengan ikon `lucide-react` dan interaksi `cardHoverProps`. |
| `src/components/BentoMetrics.tsx` | **Diperbaiki** | Menyelaraskan 4 kartu KPI (`28px` Bold `tabular-nums`), memperbaiki kontras & pembedaan seri bar chart bulanan (`#DC2626` vs `#059669`), serta menstandarkan warna indikator pada feed aktivitas otorisasi. |
| `src/components/DocumentList.tsx` | **Diperbaiki** | Memisahkan `<SegmentedStageControl />` dari `<FilterChipGroup />`, menerapkan `.th-nominal` & `.col-nominal`, menghilangkan unintended horizontal scroll di desktop, dan menyediakan *Stacked Record Cards* di mobile. |
| `src/components/ApprovalExplorer.tsx` | **Diperbaiki** | Menstandarkan ketiga view: **Register** (`05` — filter bar `36px` seragam), **History** (`06` — `density="compact"` dengan timestamp `tabular-nums`), dan **Docs** (`07` — pemisahan kolom metadata berkas dari kolom tombol `Lihat` & `Unduh`). |
| `src/components/ApprovalProgress.tsx` | **Diperbaiki** | Memperbaiki garis konektor antar-node, membedakan warna state `current`/`waiting` dari `rejected`, memisahkan node status pembayaran dengan divider vertikal, dan menampilkan teks ringkasan tahap aktif. |
| `src/components/ApprovalStepper.tsx` | **Diperbaiki** | Menstandarkan timeline stepper lengkap (`expanded` & `adaptive`) di dalam drawer detail dokumen. |
| `src/components/DocumentDetailModal.tsx` | **Diperbaiki** | Menerapkan hierarki tipografi, transisi drawer Framer Motion, fokus keyboard (`focus trap`), dan tata letak tombol otorisasi (*Setujui*, *Revisi*, *Tolak*). |
| `src/components/ExportModal.tsx` | **Diperbaiki** | Memperlebar modal ke `480px` (`08`), menerapkan `<RadioCard />` dengan ikon Excel hijau & PDF merah, menambahkan `<InfoCard />` ringkasan cakupan ekspor, serta `<AnimatePresence>`. |
| `src/components/forms/*` | **Diperbaiki** | Menstandarkan ketujuh form (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`) menggunakan kontrol `36px`, `CurrencyInput`, 8 interactive states, dan pesan validasi aksesibel. |
| `docs/superpowers/specs/BLC_Caready_Procurement_Pro_Design_System.md` | **Baru (Dokumentasi Utama)** | Dokumentasi spesifikasi terpusat Enterprise Design System BLC Caready Procurement Pro. |

### 15.2 Daftar Masalah Terbuka / Catatan Operasional (Open Items)

1. **Aksesibilitas Konten Internal Lampiran PDF Hasil Scan (`ApprovalExplorer.tsx` — Mode `docs`):** Antarmuka tabel dan pratinjau dokumen telah memenuhi standar WCAG 2.2 Level AA, namun untuk berkas PDF lampiran yang diunggah berupa gambar hasil pindaian fisik (*non-OCR scanned PDF*) di `server/storage.ts`, pembaca layar hanya dapat membacakan metadata dokumen induk, nama berkas, ukuran, tanggal, dan status otorisasi.
2. **Ringkasan Otomatis untuk Workflow di Atas 6 Tahapan pada `ApprovalProgress.tsx`:** Untuk menjaga agar tabel di `DocumentList.tsx` dan `ApprovalExplorer.tsx` bebas dari *horizontal scrollbar* pada layar `1280px`, `ApprovalProgress.tsx` menampilkan hingga 5 node tahapan secara inline; apabila terdapat aturan dokumen khusus yang memiliki `>=6` tahapan persetujuan, node tengah dirangkum menjadi indikator `+N` yang dapat dilihat rinciannya melalui tooltip/popover atau melalui `<ApprovalStepper />` di dalam `DocumentDetailModal.tsx`.


## 16. Deep-Dive Component & Module Reference Blueprints (`src/`)

Bagian ini mendetailkan spesifikasi implementasi tingkat kode untuk setiap file inti di dalam `src/` guna memastikan integrasi langsung tanpa celah interpretasi.

### 16.1 `src/components/ui/StatusBadge.tsx` & `FilterChip.tsx` (Lucide v1.70 + Semantic Mapping)

```tsx
// src/components/ui/StatusBadge.tsx
import React from 'react';
import {
  FileEdit,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  CreditCard,
  MinusCircle,
} from 'lucide-react';
import type { DocumentStatus, StatusSemanticConfig } from '../../types/design-system.types';

export const STATUS_SEMANTIC_MAP: Record<DocumentStatus, StatusSemanticConfig> = {
  draft: {
    status: 'draft',
    label: 'Draf',
    iconName: 'FileEdit',
    fgColor: '#374151',
    bgColor: '#F1EFEA',
    borderColor: '#D1CFC9',
  },
  diajukan: {
    status: 'diajukan',
    label: 'Diajukan',
    iconName: 'Clock',
    fgColor: '#1E40AF',
    bgColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  menunggu: {
    status: 'menunggu',
    label: 'Menunggu',
    iconName: 'Clock',
    fgColor: '#92400E',
    bgColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  ditinjau: {
    status: 'ditinjau',
    label: 'Ditinjau',
    iconName: 'Eye',
    fgColor: '#1D4ED8',
    bgColor: '#EFF6FF',
    borderColor: '#60A5FA',
  },
  disetujui: {
    status: 'disetujui',
    label: 'Disetujui',
    iconName: 'CheckCircle2',
    fgColor: '#065F46',
    bgColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  ditolak: {
    status: 'ditolak',
    label: 'Ditolak',
    iconName: 'XCircle',
    fgColor: '#9F1239',
    bgColor: '#FFF1F2',
    borderColor: '#FDA4AF',
  },
  revisi: {
    status: 'revisi',
    label: 'Revisi',
    iconName: 'RotateCcw',
    fgColor: '#B45309',
    bgColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  dibayarkan: {
    status: 'dibayarkan',
    label: 'Dibayarkan',
    iconName: 'CreditCard',
    fgColor: '#0369A1',
    bgColor: '#E0F2FE',
    borderColor: '#7DD3FC',
  },
  lunas: {
    status: 'lunas',
    label: 'Lunas',
    iconName: 'CreditCard',
    fgColor: '#064E3B',
    bgColor: '#D1FAE5',
    borderColor: '#34D399',
  },
  inactive: {
    status: 'inactive',
    label: 'Nonaktif',
    iconName: 'MinusCircle',
    fgColor: '#6B7280',
    bgColor: '#F8F7F4',
    borderColor: '#E4E2DD',
  },
};

const ICON_COMPONENTS = {
  FileEdit,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  CreditCard,
  MinusCircle,
};

export interface StatusBadgeProps {
  status: DocumentStatus;
  customLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, customLabel }) => {
  const config = STATUS_SEMANTIC_MAP[status] ?? STATUS_SEMANTIC_MAP.inactive;
  const IconComponent = ICON_COMPONENTS[config.iconName];

  return (
    <span
      className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[12px] font-semibold leading-4 whitespace-nowrap border"
      style={{
        backgroundColor: config.bgColor,
        color: config.fgColor,
        borderColor: config.borderColor,
      }}
    >
      <IconComponent size={12} strokeWidth={2} aria-hidden="true" />
      <span>{customLabel ?? config.label}</span>
    </span>
  );
};
```

### 16.2 `src/components/ExportModal.tsx` (480px Standard Modal + Framer Motion v14)

```tsx
// src/components/ExportModal.tsx
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileSpreadsheet, FileText, FileDown, X } from 'lucide-react';
import { modalBackdropVariants, modalContentVariants, buttonTapProps } from '../lib/motion';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'xlsx' | 'pdf') => Promise<void> | void;
  documentCount: number;
  activeFilterSummary?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  documentCount,
  activeFilterSummary = 'Semua Kategori & Status',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'xlsx' | 'pdf'>('xlsx');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onExport(selectedFormat);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/55 backdrop-blur-[2px]"
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-modal-title"
            className="w-full max-w-[480px] rounded-[16px] bg-white border border-[#E4E2DD] shadow-[var(--elevation-4)] overflow-hidden"
            variants={modalContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#E4E2DD]">
              <div>
                <h2 id="export-modal-title" className="text-[18px] font-semibold text-[#111827] leading-6">
                  Export Laporan ({documentCount})
                </h2>
                <p className="text-[12px] text-[#4B5563] mt-0.5">
                  Pilih format dokumen laporan pengadaan & otorisasi keuangan
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup dialog export laporan"
                onClick={onClose}
                className="inline-flex items-center justify-center w-8 h-8 rounded-[6px] text-[#4B5563] hover:bg-[#F1EFEA] hover:text-[#111827] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
              >
                <X size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            {/* Body: Zona 1 (Pilihan Format) + Zona 2 (Info Format Terpilih) */}
            <div className="px-6 py-5 space-y-4">
              <div role="radiogroup" aria-label="Format file ekspor" className="space-y-3">
                <label
                  className={`flex items-start gap-3.5 p-3.5 rounded-[8px] border cursor-pointer transition-colors ${
                    selectedFormat === 'xlsx'
                      ? 'border-[#DC2626] bg-[#FEF2F2]/60 ring-1 ring-[#DC2626]'
                      : 'border-[#E4E2DD] bg-white hover:bg-[#F8F7F4]'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportFormat"
                    value="xlsx"
                    checked={selectedFormat === 'xlsx'}
                    onChange={() => setSelectedFormat('xlsx')}
                    className="mt-1 accent-[#DC2626]"
                  />
                  <div className="flex items-center justify-center w-9 h-9 rounded-[8px] bg-[#ECFDF5] text-[#059669] shrink-0">
                    <FileSpreadsheet size={20} strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-[#111827]">
                      Excel Spreadsheet (.xlsx)
                    </div>
                    <div className="text-[12px] text-[#4B5563] mt-0.5">
                      Data tabular lengkap dengan kolom nominal terformat untuk analisis & rekapitulasi.
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3.5 p-3.5 rounded-[8px] border cursor-pointer transition-colors ${
                    selectedFormat === 'pdf'
                      ? 'border-[#DC2626] bg-[#FEF2F2]/60 ring-1 ring-[#DC2626]'
                      : 'border-[#E4E2DD] bg-white hover:bg-[#F8F7F4]'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportFormat"
                    value="pdf"
                    checked={selectedFormat === 'pdf'}
                    onChange={() => setSelectedFormat('pdf')}
                    className="mt-1 accent-[#DC2626]"
                  />
                  <div className="flex items-center justify-center w-9 h-9 rounded-[8px] bg-[#FEF2F2] text-[#DC2626] shrink-0">
                    <FileText size={20} strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-[#111827]">
                      PDF Document (.pdf)
                    </div>
                    <div className="text-[12px] text-[#4B5563] mt-0.5">
                      Dokumen tata letak tetap siap cetak untuk lampiran otorisasi & arsip audit resmi.
                    </div>
                  </div>
                </label>
              </div>

              {/* Zona 2: Ringkasan Cakupan Ekspor */}
              <div className="px-4 py-3 rounded-[8px] bg-[#F8F7F4] border border-[#E4E2DD] text-[12px] text-[#374151] flex items-center justify-between">
                <span>
                  Cakupan filter: <strong className="font-semibold text-[#111827]">{activeFilterSummary}</strong>
                </span>
                <span className="tabular-nums font-semibold text-[#111827]">
                  {documentCount} Dokumen
                </span>
              </div>
            </div>

            {/* Zona 3: Footer Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#F8F7F4] border-t border-[#E4E2DD]">
              <motion.button
                type="button"
                {...buttonTapProps}
                onClick={onClose}
                disabled={isSubmitting}
                className="h-9 px-4 rounded-[8px] text-[14px] font-semibold text-[#4B5563] hover:bg-[#F1EFEA] hover:text-[#111827]"
              >
                Batal
              </motion.button>
              <motion.button
                type="button"
                {...buttonTapProps}
                onClick={handleConfirm}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-[8px] bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white text-[14px] font-semibold disabled:bg-[#F1EFEA] disabled:text-[#9CA3AF]"
              >
                <FileDown size={16} strokeWidth={2} aria-hidden="true" />
                <span>{isSubmitting ? 'Mengekspor...' : 'Export File'}</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

### 16.3 Rincian Standarisasi per Komponen Utama di `src/components/`

| File Komponen | Spesifikasi Teknis & Perilaku Standar |
|---|---|
| `src/components/BentoMetrics.tsx` | Menggunakan `kpiGridContainerVariants` & `kpiCardItemVariants` dari `src/lib/motion.ts`. 4 kartu KPI di baris atas menampilkan `Display` (`28px` Bold `tabular-nums`) dengan `formatCurrencyIDR` untuk *Total Nilai Pengadaan*. Panel grafik bulanan menggunakan 2 seri bar (`#DC2626` Pengajuan vs `#059669` Disetujui) dengan label bulan `12px` SemiBold. Panel *Aktivitas Otorisasi Terkini* menampilkan titik status semantik dan timestamp `tabular-nums`. |
| `src/components/StaffBeranda.tsx` | Banner sambutan menampilkan ikon `44x44px` (`#DC2626`), sapaan pengguna, dan 3 penghitung ringkas (`Diajukan`, `Disetujui`, `Menunggu/Revisi`). Di bawahnya terdapat grid 7 kartu Quick Action (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`) dengan `cardHoverProps` (`whileHover={{ y: -2 }}`, `whileTap={{ scale: 0.98 }}`) dan kontainer ikon `36x36px` berwarna semantik. |
| `src/components/DocumentList.tsx` | Memisahkan `<SegmentedStageControl />` (Tahap Siklus 1–6) dan `<FilterChipGroup />` (Jenis Dokumen) dengan jarak vertikal `12px` (`--space-3`). Menggunakan `.th-nominal` dan `.col-nominal` untuk kolom nominal Rupiah, `<StatusBadge />` untuk status, `<ApprovalProgress />` untuk progres tahapan inline, dan `<Button variant="outlined" size="sm">` untuk tombol `Detail`. |
| `src/components/ApprovalExplorer.tsx` | Mengelola 3 tampilan terintegrasi: (1) **Register (`05`)**: 4 dropdown filter + `Reset Filter` setinggi `36px`, kolom `TOTAL PENGAJUAN` & `ESTIMASI REALISASI` memakai `.col-nominal`; (2) **History (`06`)**: tabel `density="compact"` (`padding: 8px 12px`), kolom waktu `tabular-nums`, `<StatusBadge />`, dan catatan dengan `ellipsis` + tooltip; (3) **Docs (`07`)**: memisahkan kolom `Metadata Berkas` (ukuran & tanggal) dari kolom `Tindakan` sehingga setiap baris memiliki tombol `Lihat` dan `Unduh` yang konsisten. |
| `src/components/DocumentDetailModal.tsx` | Menggunakan `drawerContentVariants` (`src/lib/motion.ts`), menampilkan header kode dokumen + `<StatusBadge />`, rincian anggaran berkelas `.col-nominal`, komponen `<ApprovalStepper variant="expanded" />`, daftar berkas lampiran dari `server/storage.ts`, serta footer tindakan otorisasi sesuai role pengguna dari `server/auth.ts`. |
| `src/components/forms/*` (`PR`, `PO`, `AV`, `RB`, `RC`, `GR`, `PV`) | Seluruh form menggunakan kontrol input setinggi `36px`, border `#9CA3AF`, `CurrencyInput` terintegrasi `formatCurrencyIDR`, 8 interactive states (`default`, `hover`, `focus`, `filled`, `error`, `disabled`, `readonly`, `loading`), serta `errorShakeVariants` saat gagal validasi. |

# BLC Procurement Pro — Frozen Visual Design Foundation (Phase 02)

**Status:** DESIGN FOUNDATION SPECIFICATION (PENDING PO VISUAL APPROVAL)  
**Dokumen Acuan:** Mockup Dashboard Terisolasi (`dashboard-approved.html`, `dashboard-approved.css`)  
**Tujuan:** Fondasi visual standar untuk konsistensi layar Dashboard, Register, Form, Approval, dan Finance.

---

## 1. Shell & Application Layout

| Elemen | Spesifikasi Desktop (>= 1100px) | Spesifikasi Tablet (768px - 1099px) | Spesifikasi Mobile (<= 767px) |
|---|---|---|---|
| **Outer Canvas** | Background `#ececec` | Background `#ececec` | Background `#ececec` |
| **Application Shell** | Max-width 1440px, margin 20px auto, padding 18px, radius 24px, bg `#f6f6f6`, 2-column grid (`240px minmax(0,1fr)`, gap 14px) | Margin 0, padding 0 14px 20px, radius 0 / fluid | Margin 0, padding 0 12px 16px, radius 0 / fluid |
| **Sidebar** | Width 240px, radius 22px, padding 26px 20px, bg `#ffffff`, min-height `calc(100vh - 40px)` | Collapsed ke floating drawer (width 235px, z-index 5, box-shadow `0 8px 28px #0003`, radius 22px) | Sama dengan tablet, dipicu tombol hamburger |
| **Sidebar Promo Card** | **DITIADAKAN SEPENUHNYA**. Area bawah dibiarkan bernapas kosong. | **DITIADAKAN**. | **DITIADAKAN**. |

---

## 2. Navigasi & Header

- **Brand Tile:** Logo 43x43px, radius 12px, warna Crimson `#DC2626`, font bold 22px putih ("B"). Label: "BLC Caready" bold 17px, subtitle "Procurement Pro" 13px `#59615f`.
- **Nav Items:** Padding 11px 12px, border-radius 11px, font 16px, gap 14px, icon 20px / 23px cell width.
  - State Default: Teks `#17191a`, hover `#f5f5f5`.
  - State Selected: Background `#fdf0f0`, teks `#b91c1c`, font-weight 700.
  - Section Label: "RUANG KERJA" dan "PENGATURAN", 12px weight 650 `#5d6262`.
- **Header Topbar:** Background `#ffffff`, radius 20px, min-height 75px, padding 15px 20px.
  - Global Search: Pill container radius 24px, border `1px solid #dfe1e2`, width 400px (100% pada mobile), icon 22px `#5d6262`, shortcut badge `<kbd>⌘ F</kbd>` `#f2f2f3`. Focus state `:focus-within` dengan outline `3px solid #2563eb; outline-offset: 3px`.
  - Account Lockup: Notifikasi bel 22px dengan indikator 9px crimson unread badge (`#dc2626`), avatar bulat 42x42px (`#fee6e5`, font 700 `#b91c1c`), teks nama dan role sublabel (disembunyikan pada mobile demi kerapian).
  - Hamburger Button: Tampil hanya pada viewport <= 800px, terikat atribut `aria-expanded` dan `aria-label`.

---

## 3. Komposisi Halaman & Grid

- **Page Header:** Margin bawah 22px.
  - Title: 34px desktop / 30px mobile, font-weight 700, letter-spacing -0.035em.
  - Subtitle: 15px `#151719`.
  - Action Group: Gap 12px. Primary button: background `#dc2626`, hover `#b91c1c`, radius 14px, padding 12px 18px, font-weight 650, teks putih. Secondary button: background `#ffffff`, border `1px solid #dedede`, teks `#1b1c1d`. Pada mobile (<= 440px), tombol disusun berdampingan 50/50 split width.
- **KPI Row (Section C):**
  - Layout: 4 kolom sejajar (`repeat(4, minmax(0,1fr))`), gap 14px.
  - Dimensi: Radius 18px, height 140px (min-height 145px pada mobile), padding 19px 20px, shadow `0 1px 3px rgba(23,23,23,0.05)`.
  - Card 1 (Perlu Tindakan - Feature Card): Background penuh BLC Crimson `#DC2626`, teks dan sublabel putih, pill arrow putih dengan ikon `#171717`.
  - Card 2–4: Background putih `#ffffff`, judul 16px weight 650, nilai 40px bold tabular, sublabel 13px `#515a57`, circular arrow 32x32px (`1px solid #e5e5e5`).
  - Responsif: 2x2 grid pada tablet dan mobile (<= 800px).
- **Primary Grid (Section D):**
  - Desktop: 3 kolom modular `1.35fr 1.03fr 0.78fr`, gap 14px.
    - Left: Grafik batang Nilai Pengajuan.
    - Middle: Antrean Menunggu Perhatian.
    - Right: Kartu Prioritas Hari Ini (background `#fff0f0`, border radius 18px).
  - Tablet/Mobile: Menumpuk 1 kolom vertikal; kartu Prioritas diposisikan pertama (`order: -1`) agar urgensi tindakan langsung terlihat sebelum visualisasi agregat.
- **Secondary Grid (Section E):**
  - Desktop: 3 kolom modular `1fr 1.03fr 1.12fr`, gap 14px.
    - Left: Aktivitas Terbaru (icon badge 39x39px `#fee9e9`).
    - Middle: Donut chart Status Dokumen.
    - Right: Horizontal bar chart Nilai Pengajuan per Cabang.
  - Tablet/Mobile: Menumpuk 1 kolom vertikal.

---

## 4. Perlakukan Visual Grafik & Analitik

1. **Grafik Batang (Nilai Pengajuan):**
   - Height plotting: 170px.
   - Sumbu Y: 0, 25, 50, 75, 100 (Rp Juta).
   - Gridlines: Garis horizontal tipis setiap 25% height (`repeating-linear-gradient`).
   - Batang: Lebar proporsional (max 42px), radius 5px 5px 0 0. Default soft crimson `#fecaca`; selected/hover vibrant `#dc2626`.
   - Tooltip: Dark tooltip `#252525`, radius 8px, font 11px putih, hover & focus accessible.
   - Fallback/Empty: Pesan bersih terpusat tanpa layout shift jika data 0.
2. **Donut Chart (Status Dokumen):**
   - Diameter: 135x135px dengan inner cutout 94x94px putih (`conic-gradient`).
   - Label tengah: Total dokumen bold 25px tabular + keterangan 11px.
   - Palet Status: Draf (`#d1d5d4` abu-abu), Dalam proses (`#eab308` amber), Disetujui (`#2da565` hijau emerald).
   - Legenda: Dot bulat 9px, label status, dan nilai count rata kanan.
3. **Horizontal Bar (Nilai Cabang):**
   - Grid baris: `65px minmax(30px, 1fr) 112px`, gap 8px, font 12px.
   - Bar track: Tinggi 12px, radius 4px. Cabang teratas menggunakan Crimson `#dc2626`, cabang lainnya soft red `#fca5a5`.
   - Angka: Rata kanan dalam format rupiah lengkap dengan `font-variant-numeric: tabular-nums`.

---

## 5. Token Desain & Palet Warna

| Token | Nilai Hex | Penggunaan |
|---|---|---|
| `brand-crimson` | `#DC2626` | Warna identitas utama, logo, button primary, feature KPI, bar utama |
| `brand-crimson-hover` | `#B91C1C` | Hover button primary, active nav link text |
| `brand-crimson-light` | `#FDF0F0` / `#FFF0F0` | Selected nav background, priority card background |
| `brand-crimson-soft` | `#FEE9E9` / `#FECACA` | Activity icon background, secondary bar chart |
| `canvas-background` | `#ECECEC` | Background dasar di luar application shell |
| `shell-background` | `#F6F6F6` | Background kanvas aplikasi di dalam shell |
| `surface-card` | `#FFFFFF` | Background kartu, sidebar, dan header |
| `text-primary` | `#151719` / `#17191A` | Heading, teks utama, judul dokumen |
| `text-secondary` | `#515A57` / `#59615F` | Subtitle, meta info, label sumbu, tanggal |
| `border-subtle` | `#DEDEDE` / `#E8E8E8` | Border kartu, pembatas tabel, input border |
| `focus-ring` | `#2563EB` | Ring aksesibilitas keyboard (3px solid, offset 3px) |
| `badge-draft` | `#F3F4F6` (teks `#4B5563`) | Status Draft / Belum diajukan |
| `badge-review` | `#FFF0C8` (teks `#704500`) | Status Ditinjau / Dalam proses persetujuan |
| `badge-approved` | `#DCFCE7` (teks `#15803D`) | Status Disetujui |
| `badge-rejected` | `#FEE2E2` (teks `#B91C1C`) | Status Ditolak |
| `badge-paid` | `#E0F2FE` (teks `#0369A1`) | Status Dibayar (Finance) |

---

## 6. Table & List Specifications (Untuk Layar Register & Keuangan)

- **Container:** Kartu putih `#ffffff`, radius 18px, padding 18px.
- **Table Head:** 12px font-weight 650, teks `#59615f`, border-bottom `1px solid #dedede`.
- **Table Rows:** Padding 11px 12px, border-bottom `1px solid #f0f0f0`, hover background `#fafafa`.
- **Nominal:** Rata kanan, `font-variant-numeric: tabular-nums`, font-weight 600.
- **Mobile Card Transform:** Pada breakpoint <= 800px, baris tabel bertransformasi menjadi stacked list card dengan header nomor dokumen, badge status, cabang, nominal, dan tombol aksi detail yang mudah disentuh (min touch target 44px).

---

## 7. Batasan & Status Gate

Spesifikasi ini dibekukan sebagai acuan desain terpadu. Implementasi ke dalam komponen produksi React (`src/components/`) **TIDAK DILAKUKAN** sebelum persetujuan resmi Product Owner terhadap dashboard mockup.

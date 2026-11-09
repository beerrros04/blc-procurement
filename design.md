# BLC Procurement Design System & UI Kit Specification

**Referensi Sumber:** UI/UX Sistem Absensi NEXGEN (`docs/media/UI_UX SISTEM ABSENSI NEXGEN/`)  
**Logo & Identitas Perusahaan:** BLC Caready Automotive Red (`docs/media/logo/logo_hd_transparent.png`)  
**Format Target:** FigCraft Native (`blc_procurement_design_system.figcraft`)  
**Font Utama:** Lato (Regular, Medium, Semibold, Bold)

---

## 1. Adaptasi Palet Warna (NEXGEN Blue → BLC Corporate Red)

Pada sistem asli NEXGEN, warna primer menggunakan *Lucky Point* Navy Blue (`#1B1464`) dan *Secondary Blue* (`#0000FF`). Berdasarkan logo resmi perusahaan (BLC Automotive Red), seluruh palet primer diselaraskan menjadi palet merah korporat berani, terpercaya, dan energik.

### A. Palet Utama (Main Brand Palette)
- **Primary | BLC Corporate Red (`#E51937`)**: Warna inti brand untuk tombol utama, sorotan navigasi aktif, dan kartu metrik prioritas.
  - Dark: `#8A0A19`
  - Medium: `#B81428`
  - 90% Shade: `#EA3B53`
  - 75% Shade: `#F06B7E`
  - 50% Tint: `#F7A3AF`
  - 25% Tint: `#FCD4DA`
  - 10% Soft Surface: `#FDF2F4` (background aksen halus)

### B. Palet Netral (Neutral Grays - 100% Mengikuti Standar NEXGEN)
- Dark Gray (Headings / Body Primary): `#1F2937`
- Medium Gray (Labels & Subheadings): `#374151`
- 90% Gray (Borders / Icons): `#6B7280`
- 75% Gray (Muted Text): `#9CA3AF`
- 50% Gray (Dividers): `#D1D5DB`
- 25% Gray (Card Borders): `#E5E7EB`
- 10% Gray (Canvas Background): `#F9FAFB`
- Pure Surface: `#FFFFFF`

### C. Palet Pendukung Status (Functional Support Colors)
- **Success | Emerald Green (`#10B981`)**: Disetujui (Approved), Pembayaran Lunas (Paid).
  - Background Tint: `#ECFDF5`, Border: `#A7F3D0`, Dark: `#047B57`
- **Warning | Amber Orange (`#F59E0B`)**: Menunggu Persetujuan (Pending / In Review).
  - Background Tint: `#FFFBEB`, Border: `#FDE68A`, Dark: `#D97706`
- **Danger | Ruby Red (`#EF4444`)**: Ditolak (Rejected), Kesalahan Validasi.
  - Background Tint: `#FEF2F2`, Border: `#FECACA`, Dark: `#DC2626`
- **Info | Cobalt Blue (`#2563EB`)**: Pemberitahuan sistem, info lampiran.
  - Background Tint: `#EFF6FF`, Border: `#BFDBFE`

---

## 2. Tipografi (Lato Typeface Hierarchy)

Mengikuti matriks skala tipografi NEXGEN pada `Frame 2085661773.png` & `Slide 4_3 - 1.png`:

| Level | Size / Line-Height | Weight | Penggunaan |
|---|---|---|---|
| **Display** | 72px / 80px | Semibold / Bold | Angka metrik hero, cover |
| **Heading 1 (H1)** | 56px / 64px | Bold | Judul halaman utama |
| **Heading 2 (H2)** | 48px / 56px | Bold | Judul section besar |
| **Heading 3 (H3)** | 40px / 48px | Semibold | Judul drawer & modal |
| **Heading 4 (H4)** | 32px / 40px | Semibold | Header tabel & card besar |
| **Heading 5 (H5)** | 24px / 32px | Semibold / Medium | Subjudul modul & stepper |
| **Heading 6 (H6)** | 20px / 28px | Semibold | Judul widget kecil & kartu KPI |
| **Paragraph (P)** | 16px / 24px | Regular / Medium | Teks deskripsi isi, isi form |
| **Label** | 14px / 22px | Medium / Semibold | Label input form, baris tabel |
| **Tiny** | 12px / 20px | Regular / Semibold | Badge status, stempel waktu, caption |

---

## 3. Komponen UI Kit Utama (Mengikuti Layout Slide 4_3)

1. **Button System (Radius: 8px, Padding: 10px 18px)**
   - Primary: Solid BLC Red (`#E51937`), teks putih, bayangan subtil.
   - Secondary: Outline Border (`#E5E7EB`), teks `#1F2937`, hover `#F9FAFB`.
   - Ghost: Tanpa background, teks `#E51937`.
   - Action Buttons: Add Data (`+ Buat Draf`), Upload Data, Filter Chips.
   - Export Buttons: Copy to Clipboard, Download Files, Download Excel, Download PDF, Print.
2. **Input & Form Controls**
   - Text inputs, select dropdowns, money input dengan prefix "Rp" terisolasi.
   - Radio buttons untuk seleksi format unduhan file (PDF, CSV, XLSX).
3. **Sidebar & Topbar Architecture**
   - Slim Icon Sidebar & Expanded Sidebar berlatar putih bersih (`#FFFFFF`) dengan border halus `#E5E7EB`.
   - Logo BLC Car Emblem berukuran proporsional di bagian atas sidebar.
   - Floating Topbar dengan title breadcrumbs, tanggal & waktu "WIB", serta user profile badge.
4. **Data Table Layout**
   - Zebra subtle rows, checkbox per baris, sortable headers, status pills, dan icon action cluster (Lihat Detail, Ubah, Hapus).

---

## 4. Breakpoint Responsif
- **Desktop Dashboard**: `1920 × 1080` (resolusi standar sesuai `Dashboard - 1920px 1080px.png`)
- **Canvas Work Area**: Fluid 100% min-width `1200px`.

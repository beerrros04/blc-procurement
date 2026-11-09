# Spesifikasi Desain UI/UX: BLC Procurement (Elera Architecture Adaptation)

- **Tanggal Dokumen:** 2026-11-09
- **Penyusun:** Antigravity AI & Tim Engineering BLC Caready
- **Referensi Visual Utama:** Elera Healthcare Dashboard (`https://nazday-elera.vercel.app/dashboard`) oleh Nazmi Javier (Meya Lab Studio)
- **Status Dokumen:** Terverifikasi & Terfiksasi (Menunggu Review Terakhir Pengguna Sebelum Eksekusi Lanjutan)

---

## 1. Latar Belakang & Tujuan Transformasi (The Why & Intent)

Aplikasi **BLC Procurement** (PT Balai Lelang Caready) adalah tulang punggung sistem pengadaan dan keuangan multi-cabang (Bekasi, Cibinong, Medan, Surabaya, Pekanbaru, Makassar, Samarinda) dengan alur otorisasi berjenjang (Staff Pemohon -> Atasan Langsung -> GM Bu Ayu -> BoD Pak Hery & Hashimoto -> Keuangan Erika).

### Masalah Desain Sebelumnya
1. **Modal Pop-up Menutupi Seluruh Layar**: Ketika approver memeriksa dokumen (PR, PO, AV, dll.), modal besar muncul menutupi layar sehingga approver kehilangan konteks tabel dan riwayat pengajuan lainnya.
2. **Kepadatan Informasi Campur Aduk**: Tampilan metrik eksekutif, tombol pembuat draf staff, dan register tabel tercampur dalam satu halaman tanpa hierarki peran yang tegas.
3. **Estetika Belum Kohesif**: Garis pembatas, warna status, dan kontras tombol belum mencerminkan perangkat lunak *enterprise modern*.

### Arah Solusi (Elera Architecture)
Mengadopsi seluruh filosofi visual dan ergonomi tata letak dari **Elera Dashboard**:
- Kanvas arsitektural bernuansa hangat (`#F6F5F3`).
- Kartu squircle bergaris presisi (`#EDEDEB`, `rounded-2xl` / 16–20px) tanpa bayangan mengambang kotor (*clean matte elevation*).
- Panel geser kanan (*Slide-Over Inspection Drawer* `w-full max-w-xl`) menggantikan modal pop-up kaku.
- **Hierarki Navigasi `Operations` Berbasis Peran Tegas**:
  - `Dashboard`: Eksklusif untuk **Admin, GM (Ayu), BOD (Hery & Hashimoto)**.
  - `Pengajuan`: Terbuka untuk **Semua Role** (Pemohon, Atasan, Admin, GM, BoD, Keuangan).
  - `Dokumen`: Akses terpadu untuk **Admin, BOD, GM** (+ Keuangan).

---

## 2. Design Tokens, Tipografi & Bentuk (Shapes & Tokens)

### A. Palet Warna Resmi (Caready Red x Elera Neutral)
| Token Nama | Nilai Hex | Peruntukan / Penggunaan |
|---|---|---|
| `--canvas-bg` | `#F6F5F3` | Latar belakang seluruh halaman (warm architectural canvas). |
| `--surface-card` | `#FFFFFF` | Permukaan kartu, panel drawer, dan sidebar (pure white). |
| `--border-clean` | `#EDEDEB` | Garis pembatas kartu, sel tabel, dan pembatas navigasi. |
| `--border-subtle` | `#F2F1ED` | Garis pembagi baris data sekunder. |
| `--text-main` | `#191C1A` | Teks judul utama, nominal rupiah, teks tebal kontras tinggi. |
| `--text-muted` | `#8A8F89` | Label metrik mikro, subtitle, heading tabel (Elera signature muted). |
| `--text-subtle` | `#5C5E63` | Deskripsi baris, teks sekunder, nomor berkas. |
| `--btn-charcoal` | `#191C1A` | Tombol primer netral kontras tinggi (hover: `#2D312E`). |
| `--accent-caready`| `#E51937` | Warna korporat resmi BLC Caready untuk tombol aksi krusial (Setujui, Buat Draf, Bayar). |
| `--accent-hover` | `#B81428` | Hover state tombol Caready. |

### B. Status Semantik (Badges / Pills)
- **Disetujui / Selesai (Approved / Paid)**: Latar `#E8F6E3`, Teks `#239B44` (Emerald lembut).
- **Menunggu Otorisasi (In Review / Pending)**: Latar `#FAF1DC`, Teks `#D89114` (Amber hangat).
- **Revisi / Ditolak (Rejected / Revision)**: Latar `#FCEAE6`, Teks `#ED4B38` (Coral red).
- **Verifikasi Keuangan (Finance / PV)**: Latar `#EAF0FF`, Teks `#427CFF` (Cobalt blue).
- **Netral / Draft**: Latar `#F1F1EF`, Teks `#5C5E63` (Neutral gray).

### C. Geometri & Bentuk (Shapes)
- **Kartu & Kontainer Konten**: `border-radius: 20px; border: 1px solid #EDEDEB; background: #FFFFFF;`
- **Icon Chips (`.s-icon-chip`)**: `width: 38px; height: 38px; border-radius: 12px;` dengan inset glow halus `box-shadow: inset 0 0 6px 1px rgba(255,255,255,0.25)`.
- **Segmented Control Tabs (`.s-tabs`)**: `background: #E9E8E6; border-radius: 12px; padding: 3px;` dengan tab aktif `bg-white shadow-sm rounded-[9px] text-[#121212] font-semibold`.
- **Counter Pills (`.s-count`)**: `background: #E2E3E3; color: #5C5E63; border-radius: 6px; font-size: 11px; font-weight: 600; padding: 0 5px; height: 18px;`.
- **Slide-Over Drawer (`.s-drawer`)**: Menempel pada sisi kanan layar (`fixed right-0 top-0 bottom-0 max-w-[580px] bg-white border-l border-[#EDEDEB] shadow-2xl z-50`).

### D. Tipografi
- **Family**: Modern Sans (`Inter` / `Lato`).
- **Label Mikro**: `text-[11.5px] font-semibold uppercase tracking-[0.02em] text-[#8A8F89]`.
- **Nominal Rupiah**: Selalu menggunakan angka tabular (`font-variant-numeric: tabular-nums; font-weight: 700; color: #191C1A;`).

---

## 3. Matriks Peran & Navigasi Sidebar (`Operations`)

Sesuai instruksi resmi, grup navigasi **OPERATIONS** memiliki aturan visibilitas berbasis peran:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MATRIKS VISIBILITAS OPERATIONS                  │
├─────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│ PERAN / ROLE    │ DASHBOARD│ PENGAJUAN│ DOKUMEN  │ REGISTER │ RIWAYAT  │
├─────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ PEMOHON (Staff) │    -     │    ✓     │    -     │    -     │    -     │
│ ATASAN (Tahap 1)│    -     │    ✓     │    -     │    -     │    -     │
│ KEUANGAN (Erika)│    -     │    ✓     │    ✓     │    ✓     │    ✓     │
│ GM (Bu Ayu)     │    ✓     │    ✓     │    ✓     │    ✓     │    ✓     │
│ BOD (Pak Hery)  │    ✓     │    ✓     │    ✓     │    ✓     │    ✓     │
│ BOD (Hashimoto) │    ✓     │    ✓     │    ✓     │    ✓     │    ✓     │
│ ADMIN LOKAL     │    ✓     │    ✓     │    ✓     │    ✓     │    ✓     │
└─────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

1. **Dashboard (Khusus Admin, GM, BOD)**:
   - Menampilkan Cockpit Eksekutif, Telemetry Stats Strip, SLA antrean persetujuan, dan visualisasi distribusi anggaran pengadaan per cabang.
2. **Pengajuan (Semua Role)**:
   - Menampilkan Pusat Pembuatan Pengadaan Baru (PR, PO, GR, AV, RB, RC) dan tabel pemantauan "Daftar Pengajuan Saya" untuk melacak status draf pribadi.
3. **Dokumen (Admin, BOD, GM, Keuangan)**:
   - Register komprehensif seluruh dokumen pengadaan lintas cabang dengan Segmented Tabs (`Semua`, `PR`, `PO`, `GR`, `AV`, `RB`, `RC`, `PV`), filter cabang 7 kota, pencarian cepat, dan tombol tinjau drawer.
4. **Dokumen & Audit (SharePoint)**:
   - `Approval Register`: Arsip resmi seluruh persetujuan berjenjang.
   - `Approval History`: Catatan jejak audit aktivitas (siapa menyetujui, kapan, catatan alasan).
   - `Approval Docs`: Pustaka lampiran berkas resmi pengadaan.

---

## 4. Visual Blueprint & Layout Wireframe

### A. Tampilan 1: Cockpit Eksekutif (`activeTab === 'DASHBOARD'`)
*(Hanya untuk Admin, Bu Ayu, BoD Hery, BoD Hashimoto)*

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  [Logo BLC] Caready Procurement  │  [Q Cari dokumen, vendor...]   │  Cabang: [Semua Cabang ▼]  │ [Bu Ayu (GM)]   │
├──────────────┬───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ OPERATIONS   │ TOPBAR: Cockpit Eksekutif & Telemetry  [Bekasi] [Bu Ayu - GM Tahap 2]      [Ekspor Laporan 13 Kol] │
│ • Dashboard  │───────────────────────────────────────────────────────────────────────────────────────────────────│
│ • Pengajuan  │ TELEMETRY STATS STRIP (Elera Connected Cards)                                                     │
│ • Dokumen    │ ┌──────────────────┬──────────────────┬──────────────────┬──────────────────────────────────────┐ │
│              │ │ ▨ TOTAL PENGADAAN│ ▨ PERLU APPROVAL │ ▨ SIAP BAYAR (PV)│ ▨ REALISASI AV/RC                    │ │
│ DOKUMEN &    │ │   Rp 142.500.000 │   12 Dokumen     │   5 Dokumen      │   92% Selesai                        │ │
│ AUDIT        │ │   +12% vs bln lalu│   [4 Butuh BoD]  │   Rp 67.200.000  │   3 Belum Selesai                    │ │
│ • Register   │ └──────────────────┴──────────────────┴──────────────────┴──────────────────────────────────────┘ │
│ • Riwayat    │                                                                                                   │
│ • Docs       │ ANTREAN PERSETUJUAN PRIORITAS (Perlu Tindakan Bu Ayu / BoD)                                       │
│              │ ┌───────────────────────────────────────────────────────────────────────────────────────────────┐ │
│              │ │ NO. DOKUMEN   │ PEMOHON / CABANG │ NOMINAL       │ TAHAP SAAT INI       │ AKSI                │ │
│              │ ├───────────────┼──────────────────┼───────────────┼──────────────────────┼─────────────────────┤ │
│              │ │ PR-2026-0042  │ Hendra (Surabaya)│ Rp 84.000.000 │ Menunggu BoD Parallel│ [Tinjau Dokumen] -> │ │
│              │ │ PO-2026-0019  │ Dewi (Bekasi)    │ Rp 22.500.000 │ Menunggu Bu Ayu (GM) │ [Tinjau Dokumen] -> │ │
│              │ └───────────────────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────┴───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### B. Tampilan 2: Pusat Pengajuan (`activeTab === 'PENGAJUAN'`)
*(Tersedia untuk Semua Role — Terutama Staff Pemohon & Atasan Cabang)*

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  [Logo BLC] Caready Procurement  │  [Q Cari pengajuan saya...]     │  Cabang: [Bekasi]          │ [Dewi Lestari]  │
├──────────────┬───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ OPERATIONS   │ TOPBAR: Pengajuan & Pelacakan Alur  [Bekasi] [Staff Pemohon]                                      │
│ • Pengajuan  │───────────────────────────────────────────────────────────────────────────────────────────────────│
│              │ BUAT PENGAJUAN BARU (Squircle Action Tiles)                                                       │
│              │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │
│              │ │ [PR]         │ │ [PO]         │ │ [GR]         │ │ [AV]         │ │ [RB]         │ │ [RC]     │ │
│              │ │ Purchase Req │ │ Purchase Ord │ │ Lap. Terima  │ │ Advance Cash │ │ Reimburse    │ │ Realisasi│ │
│              │ │ + Ajukan     │ │ + Ajukan     │ │ + Catat      │ │ + Ajukan     │ │ + Ajukan     │ │ + Catat  │ │
│              │ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘ │
│              │                                                                                                   │
│              │ DAFTAR PENGAJUAN SAYA (Pelacakan Tiket Berkas Pengguna)                                           │
│              │ ┌───────────────────────────────────────────────────────────────────────────────────────────────┐ │
│              │ │ NO. DOKUMEN   │ JENIS │ TGL PENGAJUAN │ TOTAL NOMINAL │ STATUS TIKET      │ TINDAKAN          │ │
│              │ ├───────────────┼───────┼───────────────┼───────────────┼───────────────────┼───────────────────┤ │
│              │ │ PR-2026-0012  │ PR    │ 09 Nov 2026   │ Rp 14.500.000 │ [REVIEW ATASAN]   │ [Detail Berkas]   │ │
│              │ │ AV-2026-0004  │ AV    │ 08 Nov 2026   │ Rp  5.000.000 │ [DIBAYAR/PAID]    │ [Realisasikan RC] │ │
│              │ └───────────────────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────┴───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### C. Tampilan 3: Register Dokumen Terpadu (`activeTab === 'ALL'`)
*(Untuk Admin, BoD, GM, dan Keuangan)*

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  [Logo BLC] Caready Procurement  │  [Q Cari dokumen, vendor...]   │  Cabang: [Semua Cabang ▼]  │ [Keuangan]      │
├──────────────┬───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ OPERATIONS   │ TOPBAR: Dokumen Pengadaan Terpadu  [Pusat] [Finance Keuangan]              [Ekspor Laporan 13 Kol] │
│ • Dashboard  │───────────────────────────────────────────────────────────────────────────────────────────────────│
│ • Pengajuan  │ SEGMENTED FILTER TABS                                                                             │
│ • Dokumen    │ [ Semua (34) ]  [ PR (12) ]  [ PO (8) ]  [ GR (4) ]  [ AV (3) ]  [ RB (2) ]  [ RC (2) ]  [ PV (3) ]   │
│              │                                                                                                   │
│ DOKUMEN &    │ REGISTER TABEL UTAMA (High-Density Tabular Layout)                                                │
│ AUDIT        │ ┌───────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ • Register   │ │ NO. DOKUMEN │ PERUNTUKAN / JUDUL │ CABANG    │ NOMINAL       │ STATUS       │ AKSI             │ │
│ • Riwayat    │ ├─────────────┼────────────────────┼───────────┼───────────────┼──────────────┼──────────────────┤ │
│ • Docs       │ │ PO-2026-004 │ Pengadaan Ban Unit │ Bekasi    │ Rp 12.000.000 │ [DISETUJUI]  │ [Tinjau Drawer]  │ │
│              │ │ PR-2026-009 │ Sewa Genset Lelang │ Medan     │ Rp 54.000.000 │ [REVIEW BOD] │ [Tinjau Drawer]  │ │
│              │ │ PV-2026-002 │ Pembayaran PO-004  │ Bekasi    │ Rp 12.000.000 │ [SIAP BAYAR] │ [Proses Bayar]   │ │
│              │ └───────────────────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────┴───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### D. Tampilan 4: Slide-Over Inspection Drawer (Panel Kanan)
*(Terbuka saat menekan tombol [Tinjau Drawer], tanpa menutupi tabel latar)*

```
                                               ┌──────────────────────────────────────────────┐
                                               │ [X] PR-2026-009           [Menunggu BoD]     │
                                               │ Pengadaan Sewa Genset Lelang (Medan)         │
                                               ├──────────────────────────────────────────────┤
                                               │ ALUR OTORISASI BERJENJANG                    │
                                               │  (✓) Tahap 1: Hendra (Atasan Langsung)       │
                                               │      Disetujui · 08 Nov 2026 14:10           │
                                               │  (✓) Tahap 2: Ayu (GM Operasional)           │
                                               │      Disetujui · 09 Nov 2026 09:30           │
                                               │  (⏳) Tahap 3: BoD Paralel (> Rp 50 Juta)     │
                                               │      • Pak Hery: [ Menunggu Keputusan ]      │
                                               │      • Hashimoto: [ Menunggu Keputusan ]     │
                                               ├──────────────────────────────────────────────┤
                                               │ RINCIAN ANGGARAN & BARANG                    │
                                               │ • 2 Unit Genset 100 kVA @ Rp 25.000.000      │
                                               │ • PPN 11%: Rp 5.500.000                      │
                                               │ • PPh 23 (2%): -Rp 1.000.000                 │
                                               │ ──────────────────────────────────────────   │
                                               │ TOTAL NETTO: Rp 58.500.000 (Tabular)         │
                                               ├──────────────────────────────────────────────┤
                                               │ LAMPIRAN & CATATAN AUDIT                     │
                                               │ 📎 penawaran_genset_medan.pdf (1.2 MB)        │
                                               │ 💬 "Dibutuhkan segera untuk lelang akbar"    │
                                               ├──────────────────────────────────────────────┤
                                               │ TOMBOL KEPUTUSAN APPROVER                    │
                                               │ [ Minta Revisi / Tolak ]  [ SETUJUI BERKAS ] │
                                               └──────────────────────────────────────────────┘
```

---

## 5. Rencana Tahapan Eksekusi Terstruktur

Rencana implementasi resmi telah diselaraskan pada dokumen:
[`docs/superpowers/plans/2026-11-09-ui-ux-elera-overhaul-plan.md`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/docs/superpowers/plans/2026-11-09-ui-ux-elera-overhaul-plan.md)

1. **Tahap 1: Design Tokens & CSS Utilities** (`src/style.css`, `src/style.test.ts`) — *Status: Selesai diuji & passing.*
2. **Tahap 2: Shell Layout & Operations Role-Based Navigation** (`src/main.tsx`, `src/workspace.test.ts`) — *Status: Unit test passing, finalisasi view routing.*
3. **Tahap 3: Telemetry Stats Strip** (`src/components/BentoMetrics.tsx`) — Mengubah bento lama menjadi horizontal connected strip dengan angka tabular.
4. **Tahap 4: Register Dokumen & Segmented Control Tabs** (`src/components/DocumentList.tsx`) — Tabs kapsul `s-tabs` (`Semua`, `PR`, `PO`, dll.) dan tabel berdensitas tinggi.
5. **Tahap 5: Slide-Over Inspection Drawer** (`src/components/DocumentDetailModal.tsx`) — Mengganti modal pop-up kaku dengan panel kanan geser modern.
6. **Tahap 6: Staff Beranda & Pengajuan Hub** (`src/components/StaffBeranda.tsx`) — Kartu aksi pembuatan draf & pelacakan status tiket.
7. **Tahap 7: Verifikasi Menyeluruh & Knowledge Graph** — Menjalankan seluruh pengujian Vitest (42+ tests), build check TypeScript, dan regenerasi `graphify`.

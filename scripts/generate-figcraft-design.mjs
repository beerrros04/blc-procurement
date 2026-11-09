import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const logoPath = path.resolve('docs/media/logo/logo_hd_transparent.png').replace(/\\/g, '/');
const cliPath = 'C:/Program Files/ArtCraft/FigCraft/figcraft-cli.exe';

class ScriptBuilder {
  constructor() {
    this.commands = [];
    this.nextId = 2; // In headless FigCraft, first created node is id 2
  }

  raw(command, params) {
    this.commands.push({ command, params });
    return this.nextId++;
  }

  renamePage(name) {
    this.commands.push({ command: 'page.rename', params: { name } });
  }

  addPage(name) {
    this.commands.push({ command: 'page.add', params: { name } });
    return this.nextId++;
  }

  createFrame(name, x, y, width, height, props = {}, parent = null) {
    const params = { type: 'frame', name, x, y, width, height, props };
    if (parent !== null) params.parent = parent;
    return this.raw('node.create', params);
  }

  createRect(name, x, y, width, height, props = {}, parent = null) {
    const params = { type: 'rectangle', name, x, y, width, height, props };
    if (parent !== null) params.parent = parent;
    return this.raw('node.create', params);
  }

  createEllipse(name, x, y, width, height, props = {}, parent = null) {
    const params = { type: 'ellipse', name, x, y, width, height, props };
    if (parent !== null) params.parent = parent;
    return this.raw('node.create', params);
  }

  createText(text, x, y, props = {}, parent = null, width = null) {
    const defaultProps = {
      fontFamily: 'Lato',
      fontSize: 14,
      fill: '#1F2937',
      ...props
    };
    const params = { text, x, y, props: defaultProps };
    if (parent !== null) params.parent = parent;
    if (width !== null) params.width = width;
    return this.raw('text.create', params);
  }

  placeImage(imgPath, x, y, width, height, parent = null) {
    const params = { path: imgPath, x, y, width, height };
    if (parent !== null) params.parent = parent;
    return this.raw('image.place', params);
  }
}

const b = new ScriptBuilder();

// =============================================================================
// PAGE 1: 01 - DESIGN SYSTEM
// =============================================================================
b.renamePage('01 - Design System');

// --- Artboard 1: Cover & Brand (x=0, y=0, w=1200, h=400) ---
const cover = b.createFrame('Cover & Brand Identity', 0, 0, 1200, 400, {
  fill: '#FFFFFF',
  cornerRadius: 16,
  stroke: '#E5E7EB',
  strokeWeight: 1
});

b.createRect('Top Accent Line', 0, 0, 1200, 8, { fill: '#E51937' }, cover);
b.placeImage(logoPath, 50, 50, 90, 90, cover);

b.createText('BLC Caready Procurement Design System', 165, 55, {
  fontSize: 32,
  fontStyle: 'Bold',
  fill: '#1F2937'
}, cover);

b.createText('Diadaptasi dari Panduan NEXGEN UI/UX Sistem Absensi dengan Penyesuaian Identitas Warna Perusahaan BLC', 165, 102, {
  fontSize: 16,
  fontStyle: 'Regular',
  fill: '#6B7280'
}, cover);

// Meta pills on cover
const pills = [
  { label: 'Primary Brand:', val: 'BLC Red (#E51937)', fill: '#FDF2F4', text: '#E51937' },
  { label: 'Typography:', val: 'Lato (Google Fonts)', fill: '#F3F4F6', text: '#374151' },
  { label: 'Status:', val: 'Official Design System v1.0', fill: '#ECFDF5', text: '#059669' },
  { label: 'Base Grid:', val: '8px Auto-Layout', fill: '#EFF6FF', text: '#2563EB' }
];

pills.forEach((p, i) => {
  const px = 50 + (i * 270);
  const card = b.createRect(`Meta Card ${i}`, px, 180, 250, 80, {
    fill: p.fill,
    cornerRadius: 8,
    stroke: '#E5E7EB',
    strokeWeight: 1
  }, cover);
  b.createText(p.label, px + 16, 196, { fontSize: 12, fontStyle: 'Medium', fill: '#6B7280' }, cover);
  b.createText(p.val, px + 16, 218, { fontSize: 14, fontStyle: 'Bold', fill: p.text }, cover);
});

// --- Artboard 2: Color Palette Swatches (x=0, y=460, w=1200, h=720) ---
const colors = b.createFrame('Color Palette & Swatches', 0, 460, 1200, 720, {
  fill: '#FFFFFF',
  cornerRadius: 16,
  stroke: '#E5E7EB',
  strokeWeight: 1
});

b.createText('Main Color: Primary | BLC Red (#E51937)', 50, 40, {
  fontSize: 22,
  fontStyle: 'Bold',
  fill: '#1F2937'
}, colors);
b.createText('Menggantikan Lucky Point Navy Blue (#1B1464) dari NEXGEN untuk menegaskan identitas otomotif BLC', 50, 72, {
  fontSize: 13,
  fontStyle: 'Regular',
  fill: '#6B7280'
}, colors);

// Main Red Swatches Row
const redSwatches = [
  { name: 'Core Primary', hex: '#E51937', sub: 'Main Action / CTA' },
  { name: 'Dark Shade', hex: '#8A0A19', sub: 'Header / Active' },
  { name: 'Medium Shade', hex: '#B81428', sub: 'Sidebar Highlight' },
  { name: '90% Shade', hex: '#EA3B53', sub: 'Button Hover' },
  { name: '75% Shade', hex: '#F06B7E', sub: 'Secondary Focus' },
  { name: '50% Tint', hex: '#F7A3AF', sub: 'Subtle Borders' },
  { name: '25% Tint', hex: '#FCD4DA', sub: 'Badge Outlines' },
  { name: '10% Soft Tint', hex: '#FDF2F4', sub: 'Background Tint' }
];

redSwatches.forEach((s, i) => {
  const sx = 50 + (i * 135);
  b.createRect(`Red Swatch ${i}`, sx, 110, 120, 80, { fill: s.hex, cornerRadius: 8 }, colors);
  b.createText(s.hex, sx, 200, { fontSize: 12, fontStyle: 'Bold', fill: '#1F2937' }, colors);
  b.createText(s.name, sx, 218, { fontSize: 11, fontStyle: 'Medium', fill: '#4B5563' }, colors);
});

// Neutral Gray Swatches Row (NEXGEN standard)
b.createText('Neutral Grays (Standar NEXGEN Absensi)', 50, 270, {
  fontSize: 18,
  fontStyle: 'Bold',
  fill: '#1F2937'
}, colors);

const graySwatches = [
  { name: 'Dark Gray', hex: '#1F2937', sub: 'Primary Text' },
  { name: 'Medium Gray', hex: '#374151', sub: 'Labels / Body' },
  { name: '90% Gray', hex: '#6B7280', sub: 'Muted Text' },
  { name: '75% Gray', hex: '#9CA3AF', sub: 'Placeholder' },
  { name: '50% Gray', hex: '#D1D5DB', sub: 'Dividers' },
  { name: '25% Gray', hex: '#E5E7EB', sub: 'Card Borders' },
  { name: '10% Gray', hex: '#F9FAFB', sub: 'Canvas BG' }
];

graySwatches.forEach((s, i) => {
  const sx = 50 + (i * 155);
  b.createRect(`Gray Swatch ${i}`, sx, 310, 135, 70, { fill: s.hex, cornerRadius: 8, stroke: '#E5E7EB', strokeWeight: 1 }, colors);
  b.createText(s.hex, sx, 390, { fontSize: 12, fontStyle: 'Bold', fill: '#1F2937' }, colors);
  b.createText(s.name, sx, 408, { fontSize: 11, fontStyle: 'Medium', fill: '#4B5563' }, colors);
});

// Support Colors Row
b.createText('Support / Status Colors', 50, 460, {
  fontSize: 18,
  fontStyle: 'Bold',
  fill: '#1F2937'
}, colors);

const supportSwatches = [
  { name: 'Success (Approved/Paid)', hex: '#10B981', bg: '#ECFDF5' },
  { name: 'Warning (In Review/Pending)', hex: '#F59E0B', bg: '#FFFBEB' },
  { name: 'Danger (Rejected/Error)', hex: '#EF4444', bg: '#FEF2F2' },
  { name: 'Info (System Notices)', hex: '#2563EB', bg: '#EFF6FF' }
];

supportSwatches.forEach((s, i) => {
  const sx = 50 + (i * 270);
  b.createRect(`Support Swatch ${i}`, sx, 500, 245, 70, { fill: s.hex, cornerRadius: 8 }, colors);
  b.createText(s.hex, sx, 580, { fontSize: 13, fontStyle: 'Bold', fill: '#1F2937' }, colors);
  b.createText(s.name, sx, 600, { fontSize: 12, fontStyle: 'Medium', fill: '#6B7280' }, colors);
});

// --- Artboard 3: Typography Showcase (x=1240, y=0, w=1100, h=1180) ---
const typo = b.createFrame('Typography Hierarchy (Lato)', 1240, 0, 1100, 1180, {
  fill: '#FFFFFF',
  cornerRadius: 16,
  stroke: '#E5E7EB',
  strokeWeight: 1
});

b.createText('Typography Scale: Lato Family', 50, 40, {
  fontSize: 24,
  fontStyle: 'Bold',
  fill: '#1F2937'
}, typo);
b.createText('Mengikuti spesifikasi matriks Frame 2085661773 & Slide 4_3 - 1 dari NEXGEN', 50, 74, {
  fontSize: 13,
  fontStyle: 'Regular',
  fill: '#6B7280'
}, typo);

const typeScale = [
  { level: 'Display', size: 64, weight: 'Bold', text: 'The quick brown fox jumps' },
  { level: 'Heading 1 (H1)', size: 48, weight: 'Bold', text: 'Permintaan Pembelian Cabang' },
  { level: 'Heading 2 (H2)', size: 36, weight: 'Bold', text: 'Persetujuan Multi-Tahap Direksi' },
  { level: 'Heading 3 (H3)', size: 28, weight: 'Semibold', text: 'Payment Voucher & Pencairan Kas' },
  { level: 'Heading 4 (H4)', size: 22, weight: 'Semibold', text: 'Daftar Dokumen Pengadaan Operasional' },
  { level: 'Heading 5 (H5)', size: 18, weight: 'Semibold', text: 'Rincian Realisasi Uang Muka (RC)' },
  { level: 'Heading 6 (H6)', size: 16, weight: 'Semibold', text: 'Ringkasan Anggaran & Pajak PPN/PPh' },
  { level: 'Paragraph (P)', size: 15, weight: 'Regular', text: 'Sistem pengadaan modern mandiri BLC untuk efisiensi transaksi antar cabang.' },
  { level: 'Label', size: 14, weight: 'Medium', text: 'Nomor Rekening Vendor / Nama Bank Penerima' },
  { level: 'Tiny / Badge', size: 12, weight: 'Medium', text: 'H+2 Hari Kerja Batas Waktu Pengajuan Realisasi' }
];

let curY = 120;
typeScale.forEach((t) => {
  b.createText(`${t.level} — ${t.size}px / ${t.weight}`, 50, curY, {
    fontSize: 12,
    fontStyle: 'Bold',
    fill: '#E51937'
  }, typo);
  b.createText(t.text, 50, curY + 20, {
    fontSize: t.size,
    fontStyle: t.weight,
    fill: '#1F2937'
  }, typo);
  curY += t.size + 42;
});

// --- Artboard 4: UI Kit Component Gallery (x=0, y=1220, w=2340, h=950) ---
const uikit = b.createFrame('UI Kit Components (BLC Red Adapted)', 0, 1220, 2340, 950, {
  fill: '#FFFFFF',
  cornerRadius: 16,
  stroke: '#E5E7EB',
  strokeWeight: 1
});

b.createText('BLC UI Kit Component Library', 50, 40, {
  fontSize: 26,
  fontStyle: 'Bold',
  fill: '#1F2937'
}, uikit);
b.createText('Komponen interaktif hasil adaptasi tombol, input, modal ekspor, dan tabel dari Slide 4_3 NEXGEN', 50, 76, {
  fontSize: 14,
  fontStyle: 'Regular',
  fill: '#6B7280'
}, uikit);

// Column 1: Buttons (x=50)
b.createText('1. Button System & Action Triggers', 50, 120, { fontSize: 18, fontStyle: 'Bold', fill: '#1F2937' }, uikit);

// Primary Save Button
b.createRect('Primary Btn', 50, 160, 160, 44, { fill: '#E51937', cornerRadius: 8 }, uikit);
b.createText('Simpan Draf →', 78, 173, { fontSize: 14, fontStyle: 'Bold', fill: '#FFFFFF' }, uikit);

// Primary Hover State
b.createRect('Primary Hover Btn', 230, 160, 160, 44, { fill: '#B81428', cornerRadius: 8 }, uikit);
b.createText('Simpan Draf (Hover)', 246, 173, { fontSize: 13, fontStyle: 'Bold', fill: '#FFFFFF' }, uikit);

// Secondary Outline
b.createRect('Secondary Btn', 410, 160, 140, 44, { fill: '#FFFFFF', stroke: '#E5E7EB', strokeWeight: 1, cornerRadius: 8 }, uikit);
b.createText('Batal / Kembali', 438, 173, { fontSize: 14, fontStyle: 'Medium', fill: '#374151' }, uikit);

// Add Data Buttons (PR, PO, AV)
b.createRect('Add PR Btn', 50, 220, 130, 40, { fill: '#E51937', cornerRadius: 8 }, uikit);
b.createText('＋ Buat PR', 80, 232, { fontSize: 13, fontStyle: 'Bold', fill: '#FFFFFF' }, uikit);

b.createRect('Add PO Btn', 195, 220, 130, 40, { fill: '#FFFFFF', stroke: '#E51937', strokeWeight: 1, cornerRadius: 8 }, uikit);
b.createText('＋ Buat PO', 225, 232, { fontSize: 13, fontStyle: 'Bold', fill: '#E51937' }, uikit);

b.createRect('Add AV Btn', 340, 220, 130, 40, { fill: '#FFFFFF', stroke: '#E5E7EB', strokeWeight: 1, cornerRadius: 8 }, uikit);
b.createText('＋ Buat AV', 370, 232, { fontSize: 13, fontStyle: 'Medium', fill: '#374151' }, uikit);

// Filter Chips (Pills)
b.createText('Filter Chips (Status & Jenis Dokumen)', 50, 290, { fontSize: 15, fontStyle: 'Bold', fill: '#1F2937' }, uikit);
const chips = [
  { label: 'Semua (18)', active: true },
  { label: 'PR (4)', active: false },
  { label: 'PO (3)', active: false },
  { label: 'AV (3)', active: false },
  { label: 'RB (2)', active: false },
  { label: 'RC (3)', active: false },
  { label: 'PV (3)', active: false }
];
chips.forEach((c, i) => {
  const cx = 50 + (i * 95);
  b.createRect(`Chip ${i}`, cx, 320, 85, 34, {
    fill: c.active ? '#E51937' : '#FFFFFF',
    stroke: c.active ? '#E51937' : '#E5E7EB',
    strokeWeight: 1,
    cornerRadius: 17
  }, uikit);
  b.createText(c.label, cx + 14, 329, {
    fontSize: 12,
    fontStyle: c.active ? 'Bold' : 'Medium',
    fill: c.active ? '#FFFFFF' : '#4B5563'
  }, uikit);
});

// Export Action Bar (matching Slide 4_3 Button Export)
b.createText('Action Toolbar & Export Buttons', 50, 390, { fontSize: 15, fontStyle: 'Bold', fill: '#1F2937' }, uikit);
const exportBtns = ['Copy Clipboard', 'Download Excel', 'Download PDF', 'Print'];
exportBtns.forEach((eb, i) => {
  const ex = 50 + (i * 155);
  b.createRect(`Export Btn ${i}`, ex, 420, 145, 38, {
    fill: '#FFFFFF',
    stroke: '#E5E7EB',
    strokeWeight: 1,
    cornerRadius: 8
  }, uikit);
  b.createText(eb, ex + 20, 431, { fontSize: 12, fontStyle: 'Medium', fill: '#374151' }, uikit);
});

// Column 2: Form Controls (x=750)
b.createText('2. Form Controls & Precision Money Input', 750, 120, { fontSize: 18, fontStyle: 'Bold', fill: '#1F2937' }, uikit);

// Text input
b.createText('Judul Pengadaan *', 750, 160, { fontSize: 13, fontStyle: 'Bold', fill: '#374151' }, uikit);
b.createRect('Input 1', 750, 185, 420, 44, { fill: '#FFFFFF', stroke: '#E5E7EB', strokeWeight: 1, cornerRadius: 8 }, uikit);
b.createText('Pengadaan 10 Unit Komputer Operasional Cabang', 766, 198, { fontSize: 13, fontStyle: 'Regular', fill: '#1F2937' }, uikit);

// Money Input with Prefix
b.createText('Estimasi Subtotal *', 750, 245, { fontSize: 13, fontStyle: 'Bold', fill: '#374151' }, uikit);
b.createRect('Money Box', 750, 270, 420, 44, { fill: '#FFFFFF', stroke: '#E5E7EB', strokeWeight: 1, cornerRadius: 8 }, uikit);
b.createRect('Prefix Bg', 750, 270, 52, 44, { fill: '#FDF2F4', cornerRadius: 8 }, uikit);
b.createText('Rp', 766, 283, { fontSize: 14, fontStyle: 'Bold', fill: '#E51937' }, uikit);
b.createText('15.000.000', 818, 283, { fontSize: 14, fontStyle: 'Bold', fill: '#1F2937' }, uikit);

// Dropdown Select
b.createText('Kategori Pesanan Pembelian *', 750, 330, { fontSize: 13, fontStyle: 'Bold', fill: '#374151' }, uikit);
b.createRect('Select Box', 750, 355, 420, 44, { fill: '#FFFFFF', stroke: '#E5E7EB', strokeWeight: 1, cornerRadius: 8 }, uikit);
b.createText('Standard (Pengadaan Barang / Jasa)', 766, 368, { fontSize: 13, fontStyle: 'Regular', fill: '#1F2937' }, uikit);
b.createText('▼', 1140, 368, { fontSize: 10, fill: '#6B7280' }, uikit);

// Column 3: Export Modal Component (x=1300) - Matching Frame 2085661781
b.createText('3. Export Dialog Selection (Frame 2085661781)', 1300, 120, { fontSize: 18, fontStyle: 'Bold', fill: '#1F2937' }, uikit);

const exportCard = b.createRect('Export Dialog Frame', 1300, 160, 500, 320, {
  fill: '#FFFFFF',
  stroke: '#E5E7EB',
  strokeWeight: 1,
  cornerRadius: 16
}, uikit);

b.createText('Pilih Format Ekspor Laporan', 1330, 190, { fontSize: 16, fontStyle: 'Bold', fill: '#1F2937' }, uikit);

// Option 1: PDF (Selected with BLC Red)
b.createRect('PDF Option', 1330, 230, 440, 68, { fill: '#FFFFFF', stroke: '#E51937', strokeWeight: 2, cornerRadius: 10 }, uikit);
b.createRect('PDF Icon Bg', 1346, 244, 40, 40, { fill: '#FEE2E2', cornerRadius: 8 }, uikit);
b.createText('📄', 1358, 255, { fontSize: 16 }, uikit);
b.createText('Download as PDF', 1400, 255, { fontSize: 15, fontStyle: 'Bold', fill: '#1F2937' }, uikit);
b.createEllipse('Radio Outer 1', 1720, 252, 22, 22, { fill: '#FFFFFF', stroke: '#E51937', strokeWeight: 2 }, uikit);
b.createEllipse('Radio Inner 1', 1725, 257, 12, 12, { fill: '#E51937' }, uikit);

// Option 2: CSV
b.createRect('CSV Option', 1330, 310, 440, 68, { fill: '#FFFFFF', stroke: '#E5E7EB', strokeWeight: 1, cornerRadius: 10 }, uikit);
b.createRect('CSV Icon Bg', 1346, 324, 40, 40, { fill: '#D1FAE5', cornerRadius: 8 }, uikit);
b.createText('📊', 1358, 335, { fontSize: 16 }, uikit);
b.createText('Download as CSV', 1400, 335, { fontSize: 15, fontStyle: 'Medium', fill: '#1F2937' }, uikit);
b.createEllipse('Radio Outer 2', 1720, 332, 22, 22, { fill: '#FFFFFF', stroke: '#D1D5DB', strokeWeight: 2 }, uikit);

// Option 3: XLSX
b.createRect('XLSX Option', 1330, 390, 440, 68, { fill: '#FFFFFF', stroke: '#E5E7EB', strokeWeight: 1, cornerRadius: 10 }, uikit);
b.createRect('XLSX Icon Bg', 1346, 404, 40, 40, { fill: '#FEF3C7', cornerRadius: 8 }, uikit);
b.createText('📑', 1358, 415, { fontSize: 16 }, uikit);
b.createText('Download as XLSX', 1400, 415, { fontSize: 15, fontStyle: 'Medium', fill: '#1F2937' }, uikit);
b.createEllipse('Radio Outer 3', 1720, 412, 22, 22, { fill: '#FFFFFF', stroke: '#D1D5DB', strokeWeight: 2 }, uikit);

// Column 4: Status Badges (x=1900)
b.createText('4. Status Badges & Stepper Pills', 1900, 120, { fontSize: 18, fontStyle: 'Bold', fill: '#1F2937' }, uikit);

const badges = [
  { label: 'Disetujui (Approved)', bg: '#ECFDF5', text: '#059669', stroke: '#A7F3D0' },
  { label: 'Sedang Ditinjau (In Review)', bg: '#FFFBEB', text: '#D97706', stroke: '#FDE68A' },
  { label: 'Ditolak (Rejected)', bg: '#FEF2F2', text: '#DC2626', stroke: '#FECACA' },
  { label: 'Draf Dokumen (Draft)', bg: '#F3F4F6', text: '#4B5563', stroke: '#E5E7EB' },
  { label: 'Lunas / Terbayar (Paid)', bg: '#FDF2F4', text: '#E51937', stroke: '#FCD4DA' }
];

badges.forEach((bg, i) => {
  const by = 160 + (i * 54);
  b.createRect(`Badge ${i}`, 1900, by, 220, 38, { fill: bg.bg, stroke: bg.stroke, strokeWeight: 1, cornerRadius: 19 }, uikit);
  b.createText(bg.label, 1924, by + 10, { fontSize: 12, fontStyle: 'Bold', fill: bg.text }, uikit);
});


// =============================================================================
// PAGE 2: 02 - WIREFRAMES
// =============================================================================
b.addPage('02 - Wireframes');

const wf = b.createFrame('Desktop Wireframe (1920 × 1080)', 0, 0, 1920, 1080, {
  fill: '#F3F4F6'
});

// Wireframe Sidebar (Left)
const wfSidebar = b.createRect('WF Sidebar', 0, 0, 90, 1080, {
  fill: '#FFFFFF',
  stroke: '#E5E7EB',
  strokeWeight: 1
}, wf);

b.createRect('WF Logo Box', 20, 24, 50, 50, { fill: '#E5E7EB', cornerRadius: 10 }, wf);
for (let i = 0; i < 6; i++) {
  b.createRect(`WF Nav Icon ${i}`, 26, 110 + (i * 60), 38, 38, {
    fill: i === 0 ? '#D1D5DB' : '#F3F4F6',
    cornerRadius: 8
  }, wf);
}

// Wireframe Topbar (Floating)
const wfTopbar = b.createRect('WF Topbar', 120, 24, 1760, 72, {
  fill: '#FFFFFF',
  stroke: '#E5E7EB',
  strokeWeight: 1,
  cornerRadius: 12
}, wf);

b.createRect('WF Title Bar', 150, 48, 240, 24, { fill: '#D1D5DB', cornerRadius: 4 }, wf);
b.createRect('WF Profile Pill', 1650, 40, 200, 40, { fill: '#F3F4F6', cornerRadius: 20 }, wf);

// Wireframe Metric Cards
for (let i = 0; i < 4; i++) {
  const mx = 120 + (i * 450);
  b.createRect(`WF Metric ${i}`, mx, 120, 430, 110, {
    fill: '#FFFFFF',
    stroke: '#E5E7EB',
    strokeWeight: 1,
    cornerRadius: 12
  }, wf);
  b.createRect(`WF Metric Label ${i}`, mx + 24, 144, 120, 16, { fill: '#E5E7EB', cornerRadius: 4 }, wf);
  b.createRect(`WF Metric Value ${i}`, mx + 24, 172, 80, 32, { fill: '#D1D5DB', cornerRadius: 6 }, wf);
}

// Wireframe Table Card
const wfTable = b.createRect('WF Table Card', 120, 260, 1760, 780, {
  fill: '#FFFFFF',
  stroke: '#E5E7EB',
  strokeWeight: 1,
  cornerRadius: 12
}, wf);

b.createRect('WF Table Header', 120, 260, 1760, 64, { fill: '#F9FAFB', cornerRadius: [12, 12, 0, 0] }, wf);
for (let i = 0; i < 10; i++) {
  const ry = 324 + (i * 68);
  b.createRect(`WF Table Row ${i}`, 150, ry, 1700, 1, { fill: '#E5E7EB' }, wf);
  b.createRect(`WF Checkbox ${i}`, 150, ry + 20, 20, 20, { fill: '#F3F4F6', cornerRadius: 4 }, wf);
  b.createRect(`WF Col 1 ${i}`, 190, ry + 22, 180, 16, { fill: '#E5E7EB', cornerRadius: 4 }, wf);
  b.createRect(`WF Col 2 ${i}`, 480, ry + 22, 120, 16, { fill: '#E5E7EB', cornerRadius: 4 }, wf);
  b.createRect(`WF Col 3 ${i}`, 750, ry + 22, 140, 16, { fill: '#E5E7EB', cornerRadius: 4 }, wf);
  b.createRect(`WF Col 4 ${i}`, 1100, ry + 18, 120, 24, { fill: '#F3F4F6', cornerRadius: 12 }, wf);
  b.createRect(`WF Col 5 ${i}`, 1450, ry + 18, 100, 28, { fill: '#D1D5DB', cornerRadius: 6 }, wf);
}


// =============================================================================
// PAGE 3: 03 - MOCKUPS & PROTOTYPE
// =============================================================================
b.addPage('03 - Mockups & Prototype');

// Hi-Fi Dashboard Screen (1920 x 1080)
const hifi = b.createFrame('Hi-Fi Procurement Dashboard (1920 × 1080)', 0, 0, 1920, 1080, {
  fill: '#F8F9FD'
});

// Left Sidebar (Slim Icon Sidebar with BLC Car Logo)
const sidebar = b.createRect('Sidebar Panel', 0, 0, 96, 1080, {
  fill: '#FFFFFF',
  stroke: '#E5E7EB',
  strokeWeight: 1
}, hifi);

// BLC Car Logo
b.placeImage(logoPath, 18, 24, 60, 60, hifi);

// Navigation Icon Items
const navIcons = [
  { icon: '📊', name: 'Dashboard', active: true },
  { icon: '📝', name: 'PR', active: false },
  { icon: '📦', name: 'PO', active: false },
  { icon: '💵', name: 'AV', active: false },
  { icon: '🧾', name: 'RB', active: false },
  { icon: '⚖️', name: 'RC', active: false },
  { icon: '💳', name: 'PV', active: false },
  { icon: '⚙️', name: 'Settings', active: false }
];

navIcons.forEach((item, i) => {
  const ny = 110 + (i * 64);
  if (item.active) {
    b.createRect(`Active Nav Bg ${i}`, 16, ny, 64, 48, { fill: '#FDF2F4', cornerRadius: 10 }, hifi);
    b.createRect(`Active Indicator ${i}`, 92, ny + 8, 4, 32, { fill: '#E51937', cornerRadius: [2, 0, 0, 2] }, hifi);
  }
  b.createText(item.icon, 36, ny + 12, { fontSize: 20 }, hifi);
});

// Floating Topbar Header (matching Dashboard - 1920px 1080px.png)
const topbar = b.createRect('Floating Topbar', 126, 24, 1754, 76, {
  fill: '#FFFFFF',
  stroke: '#E5E7EB',
  strokeWeight: 1,
  cornerRadius: 12
}, hifi);

b.createText('BLC Procurement', 160, 42, { fontSize: 13, fontStyle: 'Medium', fill: '#6B7280' }, hifi);
b.createText('/', 266, 42, { fontSize: 13, fontStyle: 'Regular', fill: '#D1D5DB' }, hifi);
b.createText('Ruang Kerja Transaksi Pengadaan', 282, 42, { fontSize: 14, fontStyle: 'Bold', fill: '#1F2937' }, hifi);
b.createText('Siklus 6 Dokumen & Otorisasi Direksi', 160, 64, { fontSize: 11, fontStyle: 'Regular', fill: '#9CA3AF' }, hifi);

// Date & Time WIB Badge
b.createText('🕒 10:20:20 WIB', 1280, 44, { fontSize: 13, fontStyle: 'Bold', fill: '#E51937' }, hifi);
b.createText('Senin, 24 Mei 2026', 1280, 64, { fontSize: 11, fontStyle: 'Regular', fill: '#6B7280' }, hifi);

// User Profile Pill (Right Topbar)
b.createRect('Profile Pill Bg', 1570, 38, 280, 48, {
  fill: '#F9FAFB',
  stroke: '#E5E7EB',
  strokeWeight: 1,
  cornerRadius: 24
}, hifi);

b.createEllipse('Profile Avatar', 1580, 44, 36, 36, { fill: '#E51937' }, hifi);
b.createText('BW', 1588, 54, { fontSize: 13, fontStyle: 'Bold', fill: '#FFFFFF' }, hifi);
b.createText('Bernard Wilson', 1626, 46, { fontSize: 13, fontStyle: 'Bold', fill: '#1F2937' }, hifi);
b.createText('Admin / Pemohon Aktif', 1626, 64, { fontSize: 11, fontStyle: 'Regular', fill: '#6B7280' }, hifi);
b.createText('▼', 1820, 56, { fontSize: 10, fill: '#6B7280' }, hifi);

// Metric KPI Cards (4 Cards across top)
const metrics = [
  { label: 'DRAF AKTIF', count: '04', caption: 'Perlu diajukan', icon: '📝', color: '#E51937', bg: '#FDF2F4' },
  { label: 'SEDANG DITINJAU', count: '03', caption: 'Tahap 1, 2 & BOD', icon: '⚡', color: '#D97706', bg: '#FFFBEB' },
  { label: 'ANTREAN PV', count: '02', caption: 'Siap bayar', icon: '💳', color: '#2563EB', bg: '#EFF6FF' },
  { label: 'LUNAS / SELESAI', count: '12', caption: 'Tuntas dibayar', icon: '✔', color: '#059669', bg: '#ECFDF5' }
];

metrics.forEach((m, i) => {
  const mx = 126 + (i * 448);
  b.createRect(`Metric Card ${i}`, mx, 124, 430, 114, {
    fill: '#FFFFFF',
    stroke: '#E5E7EB',
    strokeWeight: 1,
    cornerRadius: 12
  }, hifi);

  b.createRect(`Metric Icon Bg ${i}`, mx + 24, 146, 44, 44, { fill: m.bg, cornerRadius: 10 }, hifi);
  b.createText(m.icon, mx + 36, 158, { fontSize: 18 }, hifi);

  b.createText(m.label, mx + 84, 144, { fontSize: 11, fontStyle: 'Bold', fill: '#6B7280' }, hifi);
  b.createText(m.count, mx + 84, 164, { fontSize: 28, fontStyle: 'Bold', fill: '#1F2937' }, hifi);
  b.createText(m.caption, mx + 84, 202, { fontSize: 11, fontStyle: 'Regular', fill: m.color }, hifi);
});

// Main Data Table Card (1754 x 770)
const tableCard = b.createRect('Table Card Panel', 126, 262, 1754, 780, {
  fill: '#FFFFFF',
  stroke: '#E5E7EB',
  strokeWeight: 1,
  cornerRadius: 12
}, hifi);

// Action Toolbar inside Table Card
b.createText('Daftar Dokumen Pengadaan & Otorisasi', 156, 288, { fontSize: 18, fontStyle: 'Bold', fill: '#1F2937' }, hifi);
b.createText('Pantau seluruh siklus: Draf → Atasan → Bu Ayu → BOD (Hery & Hashimoto) → Keuangan PV', 156, 314, { fontSize: 12, fontStyle: 'Regular', fill: '#6B7280' }, hifi);

// Search input inside toolbar
b.createRect('Search Input', 960, 286, 320, 42, { fill: '#F9FAFB', stroke: '#E5E7EB', strokeWeight: 1, cornerRadius: 8 }, hifi);
b.createText('🔍 Cari nomor, judul, cabang...', 976, 298, { fontSize: 13, fontStyle: 'Regular', fill: '#9CA3AF' }, hifi);

// Export Button Group
b.createRect('Export Btn Group', 1300, 286, 140, 42, { fill: '#FFFFFF', stroke: '#E5E7EB', strokeWeight: 1, cornerRadius: 8 }, hifi);
b.createText('⬇ Ekspor Data', 1324, 298, { fontSize: 13, fontStyle: 'Medium', fill: '#374151' }, hifi);

// New Document Primary Button
b.createRect('Create Doc Btn', 1460, 286, 170, 42, { fill: '#E51937', cornerRadius: 8 }, hifi);
b.createText('＋ Buat Dokumen Baru', 1478, 298, { fontSize: 13, fontStyle: 'Bold', fill: '#FFFFFF' }, hifi);

// Table Header Row
b.createRect('Table Header Row', 126, 348, 1754, 52, { fill: '#F9FAFB', stroke: '#E5E7EB', strokeWeight: 1 }, hifi);

const headers = [
  { text: 'NO. DOKUMEN & JUDUL', x: 190 },
  { text: 'TIPE', x: 560 },
  { text: 'CABANG', x: 670 },
  { text: 'NOMINAL (IDR)', x: 800 },
  { text: 'STATUS DOKUMEN', x: 1040 },
  { text: 'TAHAP PERSETUJUAN AKTIF', x: 1260 },
  { text: 'TINDAKAN', x: 1610 }
];

headers.forEach(h => {
  b.createText(h.text, h.x, 366, { fontSize: 11, fontStyle: 'Bold', fill: '#6B7280' }, hifi);
});

// Realistic Table Rows
const rows = [
  {
    docNo: 'PR-202611-0001',
    title: 'Pengadaan Perlengkapan Workstation Tim IT',
    type: 'PR',
    branch: 'Pusat',
    amount: 'Rp 12.500.000',
    status: 'DRAFT',
    statusBg: '#F3F4F6',
    statusText: '#4B5563',
    stage: 'Menunggu Pengajuan (Submit)'
  },
  {
    docNo: 'PR-202611-0002',
    title: 'Pengadaan Genset Silent 15kVA Cabang Surabaya',
    type: 'PR',
    branch: 'Surabaya',
    amount: 'Rp 25.000.000',
    status: 'APPROVED',
    statusBg: '#ECFDF5',
    statusText: '#059669',
    stage: 'Selesai Disetujui BOD'
  },
  {
    docNo: 'PO-202611-0001',
    title: 'PO: Pembelian Genset Silent 15kVA (PT Sumber Daya)',
    type: 'PO',
    branch: 'Surabaya',
    amount: 'Rp 27.250.000',
    status: 'IN_REVIEW',
    statusBg: '#FFFBEB',
    statusText: '#D97706',
    stage: 'Tahap 2: Bu Ayu (Verifikasi)'
  },
  {
    docNo: 'AV-202611-0001',
    title: 'Uang Muka Perjalanan Dinas Audit Semarang',
    type: 'AV',
    branch: 'Semarang',
    amount: 'Rp 4.500.000',
    status: 'PAID',
    statusBg: '#FDF2F4',
    statusText: '#E51937',
    stage: 'Tuntas Dicairkan via PV'
  },
  {
    docNo: 'RB-202611-0001',
    title: 'Penggantian Konsumsi Lembur & Jamuan Klien',
    type: 'RB',
    branch: 'Pusat',
    amount: 'Rp 750.000',
    status: 'IN_REVIEW',
    statusBg: '#FFFBEB',
    statusText: '#D97706',
    stage: 'Tahap 1: Atasan Langsung'
  },
  {
    docNo: 'RC-202611-0001',
    title: 'Realisasi Uang Muka Audit Semarang (Surplus Rp 800k)',
    type: 'RC',
    branch: 'Semarang',
    amount: 'Rp 3.700.000',
    status: 'APPROVED',
    statusBg: '#ECFDF5',
    statusText: '#059669',
    stage: 'Selesai (Bukti Setor Terverifikasi)'
  },
  {
    docNo: 'PV-202611-0001',
    title: 'Payment Voucher: Pelunasan PO Genset Surabaya',
    type: 'PV',
    branch: 'Surabaya',
    amount: 'Rp 26.750.000',
    status: 'APPROVED',
    statusBg: '#EFF6FF',
    statusText: '#2563EB',
    stage: 'Antrean Kasir (UNPAID)'
  }
];

rows.forEach((r, idx) => {
  const ry = 400 + (idx * 72);

  // Row background on hover / alternate
  if (idx % 2 === 1) {
    b.createRect(`Row Bg ${idx}`, 126, ry, 1754, 72, { fill: '#FAFAFD' }, hifi);
  }

  // Row divider
  b.createRect(`Row Line ${idx}`, 126, ry + 71, 1754, 1, { fill: '#E5E7EB' }, hifi);

  // Checkbox
  b.createRect(`Check ${idx}`, 154, ry + 26, 18, 18, { fill: '#FFFFFF', stroke: '#D1D5DB', strokeWeight: 1, cornerRadius: 4 }, hifi);

  // Document Number & Title
  b.createText(r.docNo, 190, ry + 16, { fontSize: 13, fontStyle: 'Bold', fill: '#1F2937' }, hifi);
  b.createText(r.title, 190, ry + 38, { fontSize: 12, fontStyle: 'Regular', fill: '#6B7280' }, hifi);

  // Type Pill
  b.createRect(`Type Pill ${idx}`, 560, ry + 22, 42, 26, { fill: '#F3F4F6', cornerRadius: 4 }, hifi);
  b.createText(r.type, 572, ry + 27, { fontSize: 11, fontStyle: 'Bold', fill: '#374151' }, hifi);

  // Branch
  b.createText(r.branch, 670, ry + 26, { fontSize: 13, fontStyle: 'Regular', fill: '#374151' }, hifi);

  // Amount (Tabular Numerals)
  b.createText(r.amount, 800, ry + 26, { fontSize: 14, fontStyle: 'Bold', fill: '#1F2937' }, hifi);

  // Status Badge
  b.createRect(`Status Badge ${idx}`, 1040, ry + 22, 120, 28, { fill: r.statusBg, cornerRadius: 14 }, hifi);
  b.createText(r.status, 1058, ry + 28, { fontSize: 11, fontStyle: 'Bold', fill: r.statusText }, hifi);

  // Active Stage
  b.createText(r.stage, 1260, ry + 26, { fontSize: 12, fontStyle: 'Medium', fill: '#4B5563' }, hifi);

  // Action Buttons
  b.createRect(`Detail Btn ${idx}`, 1610, ry + 20, 68, 32, { fill: '#FFFFFF', stroke: '#E5E7EB', strokeWeight: 1, cornerRadius: 6 }, hifi);
  b.createText('Detail', 1626, ry + 28, { fontSize: 12, fontStyle: 'Medium', fill: '#374151' }, hifi);

  b.createRect(`Action Btn ${idx}`, 1686, ry + 20, 68, 32, { fill: '#E51937', cornerRadius: 6 }, hifi);
  b.createText('Tinjau', 1702, ry + 28, { fontSize: 12, fontStyle: 'Bold', fill: '#FFFFFF' }, hifi);
});

// Bottom Copyright Bar
b.createText('© 2026 All Rights Reserved by PT. Balai Lelang Caready (BLC) — Automotive Procurement Platform', 126, 1050, {
  fontSize: 11,
  fontStyle: 'Regular',
  fill: '#9CA3AF'
}, hifi);


// Output target
const outFigcraft = path.resolve('blc_procurement_design_system.figcraft');
const outJson = path.resolve('figcraft_build_commands.json');

fs.writeFileSync(outJson, JSON.stringify(b.commands, null, 2), 'utf8');
console.log(`Generating FigCraft project with ${b.commands.length} instructions...`);

try {
  const result = execSync(`"${cliPath}" run "${outJson}" --out "${outFigcraft}"`, { encoding: 'utf8' });
  console.log('FigCraft build succeeded!');
  console.log(`Document written to: ${outFigcraft}`);

  // Export PNG preview of all top-level frames across all pages
  const exportDir = path.resolve('docs/figcraft_previews');
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
  execSync(`"${cliPath}" export "${outFigcraft}" -o "${exportDir}" --format png --page "01 - Design System"`, { encoding: 'utf8' });
  execSync(`"${cliPath}" export "${outFigcraft}" -o "${exportDir}" --format png --page "02 - Wireframes"`, { encoding: 'utf8' });
  execSync(`"${cliPath}" export "${outFigcraft}" -o "${exportDir}" --format png --page "03 - Mockups & Prototype"`, { encoding: 'utf8' });
  console.log(`Rendered PNG previews saved to: ${exportDir}`);

  // Auto-launch FigCraft desktop GUI so user can monitor immediately
  const guiExe = 'C:/Program Files/ArtCraft/FigCraft/figcraft.exe';
  if (fs.existsSync(guiExe)) {
    console.log('Automatically launching FigCraft desktop application...');
    const child = spawn(guiExe, [outFigcraft], { detached: true, stdio: 'ignore' });
    child.unref();
  }
} catch (err) {
  console.error('Build error:', err.message);
  process.exit(1);
}

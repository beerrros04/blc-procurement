# Integrasi shadcn/ui Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengintegrasikan pustaka komponen **shadcn/ui** berbasis referensi resmi [shadcn/ui Installation for Vite](https://ui.shadcn.com/docs/installation/vite) ke dalam proyek BLC Procurement (React 19 + TypeScript + Vite + Tailwind CSS v4) secara terukur, modular, dan selaras 100% dengan identitas korporat *BLC Caready High-Craft* tanpa merusak aturan bisnis dan tes yang sudah ada.

---

## 1. Analisis Kesiapan Proyek (*Current State vs shadcn/ui Requirements*)

| Komponen Prasyarat shadcn | Status di Proyek Saat Ini | Tindakan yang Diperlukan |
|---|:---:|---|
| **Vite + React 19 + TypeScript** | ✅ Terpasang (`vite: ^6.3.0`, `react: ^19.0.0`) | Tidak ada perubahan inti; kompatibel. |
| **Path Alias `@/*`** | ✅ Terkonfigurasi di [`tsconfig.json`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/tsconfig.json) dan [`vite.config.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/vite.config.ts) | Tidak ada perubahan; alias `@` sudah mengarah ke `./src`. |
| **Helper `cn` (`clsx` + `tailwind-merge`)** | ✅ Terpasang di [`src/lib/utils.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/lib/utils.ts) | Siap digunakan oleh seluruh komponen shadcn. |
| **`components.json`** | ⚠️ Ada di root ([`components.json`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/components.json)), namun masih format v3 | Perbarui konfigurasi agar selaras dengan Tailwind v4 (`"config": ""`). |
| **`class-variance-authority` (cva)** | ❌ Belum terpasang di `dependencies` | Install `class-variance-authority`. |
| **Radix UI Primitives** | ❌ Belum terpasang | Install `@radix-ui/react-slot`, `@radix-ui/react-dialog`, `@radix-ui/react-tooltip` sesuai kebutuhan komponen. |
| **CSS Variables Token Theming** | ⚠️ Ada token Elera di [`src/style.css`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/style.css), namun belum ada alias semantik shadcn (`--primary`, `--ring`, `--muted`, dll.) | Petakan variabel semantik shadcn ke palet resmi Caready Red (`#E51937`) dan Slate Netral. |

---

## 2. Struktur File & Modul yang Dihasilkan

```text
src/
├── lib/
│   ├── utils.ts                  # Helper cn (sudah ada)
│   └── utils.test.ts             # Unit test helper cn & cva variant
├── style.css                     # Pemetaan variabel semantik shadcn/ui ke palet Caready
└── components/
    └── ui/
        ├── button.tsx            # Shadcn Button (Caready Red, Outline, Secondary, Ghost, Destructive)
        ├── button.test.tsx       # Unit test Button variants & asChild
        ├── badge.tsx             # Shadcn Badge semantik
        ├── badge.test.tsx        # Unit test Badge
        ├── input.tsx             # Shadcn Input dengan styling focus ring
        ├── input.test.tsx        # Unit test Input & integrasi masking rupiah
        ├── dialog.tsx            # Shadcn Dialog (Radix UI Focus Trap & Portal)
        ├── dialog.test.tsx       # Unit test Dialog
        ├── sheet.tsx             # Shadcn Sheet (Side-Drawer untuk detail transaksi)
        ├── sheet.test.tsx        # Unit test Sheet
        └── tooltip.tsx           # Shadcn Tooltip untuk icon button & stepper
```

---

## 3. Rencana Tugas Bertahap (*Bite-Sized Implementation Tasks*)

### Task 1: Setup Dependensi Fondasi, `components.json`, dan Token CSS shadcn/ui

**Files:**
- Modify: `package.json`
- Modify: `components.json`
- Modify: `src/style.css`
- Create: `src/lib/utils.test.ts`

- [x] **Step 1:** Tulis tes `src/lib/utils.test.ts` untuk memverifikasi helper `cn` menggabungkan class Tailwind dan variant CVA secara benar.
- [x] **Step 2:** Konfirmasi tes gagal jika dependensi `class-variance-authority` belum ada (RED).
- [x] **Step 3:** Install dependensi inti:
  `npm install class-variance-authority @radix-ui/react-slot`
- [x] **Step 4:** Sesuaikan `components.json` untuk standar Tailwind v4:
  ```json
  {
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "default",
    "rsc": false,
    "tsx": true,
    "tailwind": {
      "config": "",
      "css": "src/style.css",
      "baseColor": "slate",
      "cssVariables": true
    },
    "aliases": {
      "components": "@/components",
      "utils": "@/lib/utils",
      "ui": "@/components/ui",
      "lib": "@/lib",
      "hooks": "@/hooks"
    },
    "iconLibrary": "lucide"
  }
  ```
- [x] **Step 5:** Tambahkan pemetaan token CSS semantik shadcn di `:root` [`src/style.css`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/src/style.css):
  - `--background`: `0 0% 100%`
  - `--foreground`: `222.2 84% 4.9%`
  - `--primary`: `351 81% 50%` (Caready Red `#E51937`)
  - `--primary-foreground`: `0 0% 100%`
  - `--ring`: `351 81% 50%`
  - `--radius`: `0.625rem` (10px - `var(--card-radius)`)
- [x] **Step 6:** Jalankan `npx vitest run src/lib/utils.test.ts` dan pastikan lulus (GREEN).

---

### Task 2: Implementasi Komponen Primitif Button & Badge shadcn/ui

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/button.test.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/badge.test.tsx`

- [x] **Step 1:** Buat tes unit `src/components/ui/button.test.tsx` (menguji variant `default`, `outline`, `secondary`, `ghost`, `destructive`, `size`, dan `asChild`).
- [x] **Step 2:** Buat tes unit `src/components/ui/badge.test.tsx` (menguji variant badge semantik).
- [x] **Step 3:** Konfirmasi kedua tes gagal sebelum implementasi (RED).
- [x] **Step 4:** Implementasikan `Button` di `src/components/ui/button.tsx` menggunakan `cva` dan `@radix-ui/react-slot`, diselaraskan dengan palet Caready Red `#E51937`.
- [x] **Step 5:** Implementasikan `Badge` di `src/components/ui/badge.tsx` menggunakan `cva`.
- [x] **Step 6:** Jalankan `npx vitest run src/components/ui/button.test.tsx src/components/ui/badge.test.tsx` dan pastikan lulus (GREEN).

---

### Task 3: Implementasi Komponen Form Primitives (Input, Label, Textarea)

**Files:**
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/input.test.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/textarea.tsx`

- [x] **Step 1:** Tulis tes `src/components/ui/input.test.tsx` untuk memverifikasi fokus styling, accessibility label association, dan integrasi dengan helper masking `formatCurrencyInput`.
- [x] **Step 2:** Konfirmasi tes gagal (RED).
- [x] **Step 3:** Install `@radix-ui/react-label`:
  `npm install @radix-ui/react-label`
- [x] **Step 4:** Implementasikan `Label` di `src/components/ui/label.tsx`.
- [x] **Step 5:** Implementasikan `Input` di `src/components/ui/input.tsx` dengan focus ring BLC Caready (`focus-visible:ring-[#E51937]`).
- [x] **Step 6:** Implementasikan `Textarea` di `src/components/ui/textarea.tsx`.
- [x] **Step 7:** Jalankan `npx vitest run src/components/ui/input.test.tsx` dan pastikan lulus (GREEN).

---

### Task 4: Implementasi Dialog & Sheet (Modal & Side-Drawer)

**Files:**
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/dialog.test.tsx`
- Create: `src/components/ui/sheet.tsx`
- Create: `src/components/ui/sheet.test.tsx`
- Create: `src/components/ui/tooltip.tsx`

- [x] **Step 1:** Tulis tes unit untuk Dialog dan Sheet (menguji rendering portal, trigger, focus trap Radix, dan tombol tutup).
- [x] **Step 2:** Konfirmasi tes gagal (RED).
- [x] **Step 3:** Install dependensi Radix:
  `npm install @radix-ui/react-dialog @radix-ui/react-tooltip`
- [x] **Step 4:** Implementasikan `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle` di `src/components/ui/dialog.tsx`.
- [x] **Step 5:** Implementasikan `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader` di `src/components/ui/sheet.tsx` (ideal untuk slide-over side drawer seperti `DocumentDetailModal`).
- [x] **Step 6:** Implementasikan `Tooltip` di `src/components/ui/tooltip.tsx`.
- [x] **Step 7:** Jalankan tes dan pastikan seluruh tes dialog & sheet lulus (GREEN).

---

### Task 5: Uji Coba Integrasi pada Komponen Nyata & Verifikasi Sistem

**Files:**
- Modify: `src/components/RoleSwitcher.tsx` (mengadopsi `Button` shadcn)
- Modify: `src/components/ExportModal.tsx` (mengadopsi `Button` dan `Dialog` shadcn)
- Test: Seluruh unit test suite (139+ tests)

- [x] **Step 1:** Hubungkan `Button` shadcn ke `RoleSwitcher.tsx` dan `ExportModal.tsx` tanpa merusak styling dan atribut fungsional yang sudah ada.
- [x] **Step 2:** Jalankan `npm test` (seluruh 139+ tes harus tetap 100% lulus / 0 regressions).
- [x] **Step 3:** Jalankan `npx tsc --noEmit` untuk memastikan kepatuhan type checker TypeScript.
- [x] **Step 4:** Jalankan `npm run build` untuk memverifikasi proses bundling Vite production.
- [x] **Step 5:** Perbarui knowledge graph arsitektur dengan `graphify update .`.

---

## 4. Keuntungan & Nilai Tambah bagi Proyek BLC

1. **Kompatibilitas Penuh Tanpa Mengubah Alur Bisnis:** Menggunakan komponen shadcn tidak mengubah logika backend, database, penghitungan pajak, atau matriks persetujuan.
2. **Aksesibilitas Radix UI Kelas Dunia:** Komponen seperti Dialog, Sheet, dan Dropdown membawa ARIA semantics, Focus Trap, dan screen-reader support bawaan.
3. **Desain Tetap Konsisten:** Token warna shadcn langsung dipetakan ke **Caready Red (`#E51937`)** dan **Elera High-Craft Tokens**, sehingga identitas visual perusahaan tetap terjaga.

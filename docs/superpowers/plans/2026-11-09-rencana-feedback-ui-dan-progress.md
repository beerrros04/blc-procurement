# Rencana Perbaikan UI dan Progress Persetujuan

> **Status: menunggu persetujuan pengguna.** Dokumen ini adalah rencana; jangan mengubah kode aplikasi, memasang dependensi, atau menjalankan migrasi sebelum pengguna menyetujui idenya.

**Tujuan:** Menindaklanjuti 11 masukan tampilan BLC Procurement, menggunakan komponen progress indicator yang diberikan pengguna sebagai dasar visual, dan menampilkan nama tanpa jabatan pada setiap segmen yang menyebut seseorang.

**Arsitektur:** Pertahankan navigasi dan aturan bisnis yang ada. Adaptasi komponen contoh menjadi indikator baca-saja yang menerima status dokumen, dengan demo mandiri tetap bekerja; gunakan satu sumber pemetaan nama untuk tampilan dan jangan mengubah isi audit yang tersimpan. Kelola filter register, drawer, daftar pengajuan, ringkasan dashboard, dan sidebar dalam komponen yang sudah ada.

**Teknologi:** React 19, TypeScript, Tailwind CSS 4, `framer-motion`, `lucide-react`, Vitest, React DOM server, Vite.

**Rujukan desain:** `docs/superpowers/specs/2026-11-09-ui-ux-elera-overhaul-design.md`, contoh kode yang disertakan di lampiran rencana ini, serta [Elera Dashboard](https://nazday-elera.vercel.app/dashboard). Aturan nama dan perbaikan 11 poin pada dokumen ini memperbarui rincian tampilan yang berbeda pada rencana Elera lama.

## Batasan global

- Hanya tampilkan nama orang, tanpa sapaan atau jabatan yang melekat pada nama, di setiap segmen orang: misalnya `Ayu Martina`, `Hery Sugiarto`, `Koji Hashimoto`. Jangan mengarang nama lengkap orang lain. Jika nama belum dapat dipastikan dari data identitas, tampilkan `Nama belum tersedia`.
- Jangan mengubah `auditLog.actor`, identitas akun, email, penugasan, riwayat persetujuan, data transaksi, izin server, atau aturan bisnis untuk mengubah label tampilan.
- Pengaturan role dan akses tetap seperti implementasi yang berlaku; jangan menambah, menghapus, atau memperluas akses sebagai bagian dari penyegaran UI.
- Status persetujuan berasal dari dokumen server: `WAITING`, `PENDING`, `APPROVED`, `REJECTED`. Hery Sugiarto dan Koji Hashimoto masing-masing memiliki keputusan sendiri pada tahap BOD. Tidak ada tombol pada indikator di tabel yang memajukan status.
- GR tidak memiliki alur persetujuan biasa. PV memiliki catatan pengajuan oleh Keuangan dan memulai persetujuan pada Ayu; jangan menampilkan catatan pengajuan PV sebagai persetujuan Atasan yang sebenarnya.
- Jangan mencampur PR, PO, AV, RB, RC, dan PV menjadi satu angka nominal total tanpa definisi bisnis yang disetujui.
- Pertahankan cabang resmi Bekasi, Cibinong, Medan, Surabaya, Pekanbaru, Makassar, dan Samarinda; cabang historis yang ada pada data, seperti Semarang, tetap dapat ditemukan.
- Masing-masing perubahan harus bisa digunakan dengan keyboard, memiliki teks status selain warna, mendukung reduced motion, dan diperiksa pada desktop dan layar sempit.
- Jangan melakukan commit, mengubah rencana lama, atau membersihkan perubahan lain yang belum di-commit tanpa instruksi pengguna.

## Kondisi awal proyek

- Komponen UI: `src/components/ui`; alias `@/components/ui` sudah ada pada `components.json`.
- Styles utama: `src/style.css`; Tailwind 4 dimuat melalui `@tailwindcss/vite` dan `@import "tailwindcss"`.
- TypeScript dan alias `@/*` sudah dikonfigurasi. `framer-motion`, `lucide-react`, `clsx`, dan `tailwind-merge` sudah tercantum pada `package.json`; `src/lib/utils.ts` menyediakan `cn`.
- `src/components/ui/progress-indicator.tsx` dan `demo.tsx` berstatus terhapus di working tree saat rencana ini ditulis. Versi indikator pada HEAD mirip, tetapi tidak identik dengan kode pengguna. Jangan me-restore atau menimpanya selama tahap perencanaan.
- Belum ada kebutuhan untuk memasang ulang paket atau menjalankan shadcn CLI. Jika ada masalah saat implementasi, periksa konfigurasi dan lockfile sebelum memutuskan perubahan dependensi.

## Pemetaan masukan pengguna

| Poin | Rencana |
| --- | --- |
| 1–4 | Drawer dan progres responsif; tampilkan Ayu Martina, Hery Sugiarto, dan Koji Hashimoto tanpa jabatan di samping nama. |
| 5 | Sederhanakan Daftar Pengajuan Saya dengan hierarki nomor/judul, nominal, progres, status, dan aksi. |
| 6 | Salin komponen dan demo yang diberikan sebagai dasar; adaptasi indikator tabel agar mencerminkan data aktual dan persetujuan paralel. |
| 7 | Ganti deretan filter register dengan dropdown jenis, cabang, progres, dan filter tindak lanjut. |
| 8 | Tampilkan nama saja di setiap segmen orang; jangan mengubah audit atau identitas yang disimpan. |
| 9 | Samakan struktur dan penempatan empat bagian strip metrik, dengan susunan responsif. |
| 10 | Tampilkan register Admin, GM, dan BOD secara rapi, dengan total dan nilai neto yang tetap jelas. |
| 11 | Bedakan sidebar dari kanvas dengan permukaan putih, garis batas, dan aksen aktif Caready Red. |

## Fokus peninjauan

1. Satu persetujuan BOD selesai dan satu menunggu: tampilkan masing-masing nama/status; kelompok BOD belum selesai.
2. Dokumen dikembalikan, nama Atasan belum tersedia, GR, dan PV: jangan tampilkan nama karangan atau tahap persetujuan palsu.
3. Perubahan filter jenis/cabang/progres/tindak lanjut saling dikombinasikan; reset mengembalikan semua filter tanpa menghapus data.
4. Nama pada audit yang mengandung jabatan dinormalisasi hanya untuk tampilan; audit asli dan identitas tetap utuh.
5. Pada 390, 768, 1024, dan 1366 px, nama panjang, nominal besar, lampiran, aksi, fokus keyboard, dan filter tetap dapat digunakan.

## Peta file

- `src/components/ui/progress-indicator.tsx`, `src/components/ui/demo.tsx`: komponen contoh dan demo yang diberikan pengguna; indikator yang telah diadaptasi menerima data aktual.
- `src/components/ApprovalProgress.tsx`, `src/components/ApprovalStepper.tsx`, `src/components/DocumentDetailModal.tsx`: tampilan status dan rincian persetujuan.
- `src/domain/display-name.ts` (baru): pemetaan nama untuk tampilan saja, dengan fallback aman.
- `src/components/ApprovalExplorer.tsx`, `src/components/DocumentList.tsx`, `src/components/StaffBeranda.tsx`: register, filter, nama orang, dan daftar milik pengguna.
- `src/components/BentoMetrics.tsx`, `src/main.tsx`, `src/style.css`: strip metrik, sidebar, nama orang pada bagian terkait, dan aturan responsif.
- Tes perilaku terkait di `src/components/ApprovalProgress.test.tsx`, `src/components/elera-workspace.test.tsx`, serta tes domain baru bila diperlukan.

## Rincian tugas setelah disetujui

### 1. Nama orang untuk tampilan dan sumber status

**Berkas:** `src/domain/display-name.ts` (baru); pemanggil di komponen-komponen terkait.

**Antarmuka:** buat fungsi murni `displayPersonName(raw: string | undefined): string` yang mengembalikan nama tampilan atau `Nama belum tersedia`. Gunakan identitas yang tersedia sebagai sumber utama; pemetaan alias lama harus eksplisit untuk tiga orang yang namanya diberikan pengguna. Jangan menghapus tanda kurung atau sapaan dari string secara buta jika dapat mengubah nama orang yang tidak dikenal.

- [ ] Tambahkan tes untuk alias Ayu/Hery/Hashimoto, nama Hendra yang tersedia tanpa menebak nama keluarga, nama tidak dikenal, dan label generik `Atasan Langsung`.
- [ ] Jalankan tes terarah dan pastikan kasus baru gagal sebelum implementasi.
- [ ] Terapkan pemetaan untuk nama pada progres, daftar, aktivitas, riwayat, dan drawer; simpan data asli tanpa perubahan.
- [ ] Jalankan tes terarah dan seluruh tes yang terpengaruh; bandingkan isi audit sebelum dan sesudah rendering.

### 2. Adaptasi progress indicator dan drawer

**Berkas:** `src/components/ui/progress-indicator.tsx`, `src/components/ui/demo.tsx`, `src/components/ApprovalProgress.tsx`, `src/components/ApprovalStepper.tsx`, `src/components/DocumentDetailModal.tsx`, `src/style.css`.

**Antarmuka:** indikator produksi menerima daftar tahap hasil pemetaan dari `AnyDocument`; tiap tahap menyediakan nama tampilan dan status. Tahap BOD menampung dua keputusan independen. Mode demo mandiri mempertahankan perilaku Back/Continue/Finish dari contoh; mode status produksi tidak memiliki tombol tersebut dan tidak memiliki state progres fiktif. Ubah kontrak `onApprove` dan `onReject` menjadi `Promise<void>`: pemanggil meneruskan kegagalan ke drawer, drawer menutup hanya setelah promise berhasil, dan tombol dinonaktifkan saat permintaan berjalan. Pastikan refresh dan notifikasi tidak dijalankan ganda.

- [ ] Tambahkan tes: kedua BOD menunggu; satu disetujui dan satu menunggu; keduanya disetujui; satu ditolak; nama panjang; nama Atasan tidak tersedia; GR tanpa approval; dan PV tanpa menamai pengaju Finance sebagai approver Atasan.
- [ ] Jalankan tes dan konfirmasi kegagalan yang relevan.
- [ ] Salin contoh lengkap pada lampiran ke `src/components/ui/progress-indicator.tsx` dan demo ke `src/components/ui/demo.tsx`, lalu adaptasi agar mode status dapat dikendalikan sepenuhnya oleh data. Jangan menghilangkan demo mandiri yang diminta pengguna.
- [ ] Gunakan indikator ringkas pada kolom progres register, dengan akses keyboard dan label status; pertahankan rincian dua keputusan BOD pada drawer.
- [ ] Tata isi drawer secara vertikal, tampilkan nama tanpa jabatan, bungkus lampiran/nama panjang, dan pastikan fokus kembali setelah ditutup. Saat permintaan persetujuan/revisi gagal, pertahankan detail dan komentar serta tampilkan kesalahannya; tutup hanya setelah berhasil.
- [ ] Jalankan tes terarah dan verifikasi browser: tombol tutup, Escape, backdrop, urutan fokus, gagal/berhasil, reduced motion, serta lebar 390/768/1366 px.

### 3. Daftar pengajuan dan filter register

**Berkas:** `src/components/DocumentList.tsx`, `src/components/StaffBeranda.tsx`, `src/components/ApprovalExplorer.tsx`, `src/style.css`.

**Antarmuka:** daftar milik pengguna tetap menerima semua dokumen untuk memeriksa hubungan, tetapi hanya menampilkan dokumen pemilik. Register mempunyai empat filter: jenis (`ALL`/PR/PO/GR/AV/RB/RC/PV), cabang (`ALL` atau cabang), progres, dan tindak lanjut. Filter pencarian dan keempat pilihan digabung dengan AND; reset mengosongkan pencarian dan kembali ke Semua.

- [ ] Tambahkan tes untuk daftar milik sendiri, pencarian, kombinasi jenis/cabang/progres/tindak lanjut, reset, cabang historis, dan hasil kosong. Pertahankan semua filter tindak lanjut yang sudah tersedia; jangan mengubah rumus bisnis secara diam-diam.
- [ ] Jalankan tes dan pastikan filter gabungan yang belum ada gagal.
- [ ] Tata ulang daftar Pengajuan Saya: nomor/judul, nominal, progres/nama, status, dan tindakan; pada layar sempit gunakan kartu dengan label yang terbaca.
- [ ] Ganti deretan pil filter register dengan dropdown yang memiliki label, nilai aktif, dan reset; pertahankan opsi `Menunggu PV`, `Jadwal Pembayaran`, `Belum Dibayar`, `Lunas`, `AV Tanpa PO`, dan `CA Belum Direalisasikan`.
- [ ] Pastikan Admin, GM, dan kedua BOD dapat membaca kolom utama serta membuka detail; pertahankan `Total Pengajuan`, `Dibayarkan`, dan status pembayaran, dengan penjelasan bahwa nilai neto tidak otomatis berarti sudah lunas.
- [ ] Jalankan tes terarah dan periksa tabel/aksi serta keyboard pada 390/768/1024/1366 px.

### 4. Strip metrik dan sidebar

**Berkas:** `src/components/BentoMetrics.tsx`, `src/main.tsx`, `src/style.css`.

- [ ] Pertahankan perhitungan yang sudah ada; uji bahwa nominal besar, teks panjang, dan nol tidak hilang atau tumpang tindih. Jangan menambahkan metrik finansial baru tanpa definisi.
- [ ] Buat empat bagian strip dengan lebar dan struktur konten sejajar pada desktop, dua kolom pada tablet, dan satu kolom pada mobile.
- [ ] Beri sidebar permukaan putih yang berbeda dari kanvas hangat, batas halus, dan penanda menu aktif Caready Red. Pertahankan menu, tautan, jumlah, hak akses, dan perilaku menu mobile.
- [ ] Hilangkan jabatan yang melekat pada nama orang dalam sidebar dan aktivitas; role untuk pengendalian akses tetap dipertahankan secara internal.
- [ ] Verifikasi screenshot desktop/mobile, kontras teks dan fokus, serta bahwa setiap kontrol bekerja.

### 5. Verifikasi menyeluruh

- [ ] Jalankan `npm test` dan `npm run build`; keduanya harus selesai tanpa kegagalan.
- [ ] Uji alur pemohon, atasan yang ditugaskan dan yang tidak ditugaskan, Ayu, kedua BOD, Admin, dan Keuangan menggunakan data uji, tanpa mengubah transaksi nyata.
- [ ] Uji status kosong, menunggu, revisi, disetujui, lunas, kegagalan jaringan, nama yang hilang/panjang, BOD 1/2, GR, dan PV.
- [ ] Periksa daftar filter, drawer, demo indikator, pengembalian fokus, dan opsi reduced motion pada desktop serta mobile.
- [ ] Perbarui graphify bila praktis dan catat keterbatasan ekstraksi; laporkan hasil dan pekerjaan yang belum selesai tanpa menyentuh perubahan pengguna yang lain.

## Lampiran: komponen referensi yang diberikan pengguna

Kode ini adalah bahan rencana, bukan file aplikasi yang sudah diterapkan. Versi awal untuk disalin setelah persetujuan:

```tsx
// src/components/ui/progress-indicator.tsx
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const ProgressIndicator = () => {
    const [step, setStep] = useState(1)
    const [isExpanded, setIsExpanded] = useState(true)

    const handleContinue = () => {
        if (step < 3) {
            setStep(step + 1)
            setIsExpanded(false)
        }
    }

    const handleBack = () => {
        if (step == 2) {
            setIsExpanded(true)
        }
        if (step > 1) {
            setStep(step - 1)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center gap-8">
            <div className="flex items-center gap-6 relative">
                {[1, 2, 3].map((dot) => (
                    <div
                        key={dot}
                        className={cn(
                            "w-2 h-2 rounded-full relative z-10",
                            dot <= step ? "bg-white" : "bg-gray-300"
                        )}
                    />
                ))}
                {/* Green progress overlay */}
                <motion.div
                    initial={{ width: '12px', height: "24px", x: 0 }}
                    animate={{
                        width: step === 1 ? '24px' : step === 2 ? '60px' : '96px',
                        x: 0
                    }}
                    className="absolute -left-[8px] -top-[8px] -translate-y-1/2 h-3 bg-green-500 rounded-full"
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                        mass: 0.8,
                        bounce: 0.25,
                        duration: 0.6
                    }}
                />
            </div>
            {/* Buttons container */}
            <div className="w-full max-w-sm">
                <motion.div
                    className="flex items-center gap-1"
                    animate={{
                        justifyContent: isExpanded ? 'stretch' : 'space-between'
                    }}
                >
                    {!isExpanded && (
                        <motion.button
                            initial={{ opacity: 0, width: 0, scale: 0.8 }}
                            animate={{ opacity: 1, width: "64px", scale: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 15,
                                mass: 0.8,
                                bounce: 0.25,
                                duration: 0.6,
                                opacity: { duration: 0.2 }
                            }}
                            onClick={handleBack}
                            className="px-4 py-3 text-black flex items-center justify-center   bg-gray-100  font-semibold rounded-full hover:bg-gray-50 hover:border transition-colors flex-1 w-16 text-sm"
                        >
                            Back
                        </motion.button>
                    )}
                    <motion.button
                        onClick={handleContinue}
                        animate={{
                            flex: isExpanded ? 1 : 'inherit',
                        }}
                        className={cn(
                            "px-4 py-3 rounded-full text-white bg-[#006cff]   transition-colors flex-1 w-56",
                            !isExpanded && 'w-44'
                        )}
                    >
                        <div className="flex items-center font-[600] justify-center gap-2 text-sm">
                            {step === 3 && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 15,
                                        mass: 0.5,
                                        bounce: 0.4
                                    }}
                                >
                                    <CircleCheck size={16} />
                                </motion.div>
                            )}
                            {step === 3 ? 'Finish' : 'Continue'}
                        </div>
                    </motion.button>
                </motion.div>
            </div>
        </div>
    )
}

export default ProgressIndicator
```

```tsx
// src/components/ui/demo.tsx
import ProgressIndicator from "@/components/ui/progress-indicator";

export function ProgressIndicatorDemo() {
    return <ProgressIndicator />;
}
```

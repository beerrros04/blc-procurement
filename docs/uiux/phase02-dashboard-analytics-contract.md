# Dashboard — role, analitik, dan kontrak data (usulan)

Status: preview visual terisolasi. Semua angka sintetis; belum ada endpoint analitik baru, akses riil, atau perubahan business logic. Cakupan dan definisi berikut adalah usulan untuk validasi PM/PO dan engineering, bukan deskripsi fitur tersedia.

## Cakupan contoh

Skenario ilustrasi: pengguna memiliki dua assignment review sah pada dokumen orang lain dan dua draf sendiri; salah satu draf perlu dilengkapi. Tiga tindakan = dua review + satu draf. Kewenangan didasarkan pada assignment dan aturan self-approval, bukan nama, jabatan, atau role semata. Angka contoh tidak membuktikan role pengguna nyata atau izin akses nominal. Role dalam `src/types/document.ts`: PEMOHON, ADMIN, ATASAN, AYU, BOD_HERY, BOD_HASHIMOTO, KEUANGAN.

- **Perlu tindakan:** pekerjaan personal yang benar-benar ditugaskan atau membutuhkan tindak lanjut pemilik; hitung item unik, jangan gandakan dokumen untuk satu aksi. Definisi tindak lanjut draf perlu disetujui.
- **Draf saya:** PR `DRAFT` milik pengguna, dibuat dalam periode contoh; 2.
- **Dalam proses:** PR `SUBMITTED` dan `IN_REVIEW` dalam cakupan analitik yang diotorisasi; 8.
- **Disetujui:** PR `APPROVED` dalam cakupan yang sama; 12.
- Pemohon memprioritaskan draf sendiri dan tindak lanjut; approver melihat assignment aktif yang sah; KEUANGAN memprioritaskan sumber siap PV, PV dalam persetujuan dan pembayaran; ADMIN memprioritaskan pemantauan yang diotorisasi. Ini panduan prioritas, bukan pemberian permission. PV dibuat eksplisit oleh Finance.
- REG-03 mengizinkan baca lintas cabang, sedangkan mutasi dan data keuangan sensitif tetap tunduk pada otorisasi sebenarnya. Tidak menyediakan filter scope atau akses tambahan berdasarkan role saja.

## Kontrak chart yang diusulkan

Semua chart dalam contoh adalah PR untuk seluruh cabang pada Jul–Des 2026, dalam scope analitik yang kelak diverifikasi berdasarkan izin. Gunakan waktu `createdAt` sebagai usulan tanggal cohort, bukan tanggal submit (belum dipastikan tersedia). Nilai PR: `totalAmount` bila tersedia dan tervalidasi; `subtotalAmount` tidak boleh diam-diam dipakai sebagai total. Nilai kosong dikecualikan dan jumlah pengecualian harus ditunjukkan pada implementasi; semantik pajak dan null perlu keputusan produk.

1. **Nilai pengajuan:** PR dengan status kini SUBMITTED, IN_REVIEW atau APPROVED, dikelompokkan menurut bulan pembuatan, 20 PR total Rp280.000.000. Jul 20 juta/2; Agu 40 juta/3; Sep 50 juta/3; Okt 30 juta/4; Nov 80 juta/4; Des 60 juta/4. Filter 3 bulan hanya mengubah grafik ini, cabang dan status tetap enam bulan sebagaimana label. Tooltip keyboard/hover menunjukkan bulan, nominal dan jumlah. Empty state pada produksi masih usulan.
2. **Status:** 22 PR cohort yang sama, meliputi 2 DRAFT + 8 SUBMITTED/IN_REVIEW + 12 APPROVED. REJECTED dalam fixture nol; status PAID tidak digunakan sebagai approval dan perlu keputusan untuk PR sebelum produksi. Legenda dan total menyatakan jumlah, bukan nilai.
3. **Cabang:** PR diajukan pada cakupan enam bulan yang sama: Surabaya Rp110 juta, Bekasi Rp80 juta, Medan Rp50 juta, Cibinong Rp40 juta = Rp280 juta. Nama adalah anggota `OFFICIAL_BRANCHES`; tidak ada implikasi cabang lain tidak aktif. Jumlah per cabang hanya ilustrasi agregat, bukan data produksi.

Tidak menjumlah PR, PO, PV, dan payment; hanya satu PR dihitung sekali berdasarkan ID per snapshot. Ini mencegah hitung ganda lintas tahapan, namun bukan analisis nilai transaksi unik untuk PR yang diduplikasi atau direvisi. Harus ada keputusan tentang revisi, pembatalan, tanggal submit dan konversi status historis sebelum dipakai untuk pelaporan.

## Referensi dan bukti

Struktur diadaptasi dari gambar yang diberikan PO; komponen dan fokus merujuk pola [shadcn/ui](https://ui.shadcn.com/) dan [Radix](https://www.radix-ui.com/primitives). Dokumen `src/types/document.ts`, `src/domain/branches.ts`, dan `server/app.ts` adalah bukti domain lokal, bukan bukti ketersediaan analytics di backend. Panduan BLC v3 belum tersedia pada sesi ini.

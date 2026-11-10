# Phase 00 ? UX findings berbasis bukti

| ID | Severity | Lokasi / bukti | Temuan dan dampak |
|---|---|---|---|
| UX-01 | High | `baseline/export-desktop.png`, `src/components/ExportModal.tsx` | Pada 1440?900 konten opsi CSV/PDF terjepit menjadi kolom sempit di kanan sementara area kosong besar; teks membungkus berulang dan membuat perbandingan format sulit. |
| UX-02 | High | `forms/ApproverSelect.tsx`, `server/app.ts` submit | Form menawarkan Ayu dan email kustom sebagai atasan, tetapi server mensyaratkan email seeded dengan role ATASAN. Pilihan yang ditawarkan dapat ditolak saat submit. Ini temuan kontrak UI/server, belum diuji dengan submit agar data tetap aman. |
| UX-03 | Medium | `baseline/register-desktop.png` | Keterangan tahap pada baris PO/RB terpotong di area kolom; informasi lengkap tidak seluruhnya terlihat pada screenshot. Aksesibilitas tooltip/alternatif perlu diuji. |
| UX-04 | Medium | `baseline/login-mobile.png` 375?812 | Tombol masuk berada di bawah daftar tujuh profil dan di luar viewport awal; pengguna harus scroll sebelum login. Ini bukti urutan dan panjang halaman, bukan klaim bahwa tombol tidak dapat diakses. |
| UX-05 | Medium | `src/style.css:35,394,419` vs `:50,77`; screenshot dashboard | Primary semantic #DC2626 dan hard-coded #E51937 coexist; konsistensi brand berisiko berbeda antar kontrol. |
| UX-07 | Medium | `baseline/dashboard-mobile.png` 375?812 | Judul dashboard terbungkus menjadi empat baris sempit di samping kontrol peran; hierarki judul sulit dipindai. |
| UX-06 | High, kebijakan perlu konfirmasi | `server/app.ts` GET documents dan `visibleDocument` | Daftar dokumen tidak difilter berdasarkan owner/branch pada endpoint; masking sebagian field diterapkan. Apakah cross-user visibility dimaksudkan belum diketahui. Jangan menyimpulkan eksploit atau mengubah aturan tanpa keputusan. |

Hal positif yang diamati: login memakai label, mobile navigation memiliki aria-expanded, register memiliki label filter dan status count; beberapa visual approval memiliki nama aksesibel. Belum dilakukan pengukuran kontras, keyboard menyeluruh, screen reader, audit otomatis, atau seluruh kombinasi viewport/role. Karena itu tidak ada klaim kepatuhan WCAG maupun responsive menyeluruh.

## Revisi 01
UX-01 teramati pada 375, 768 dan 1440; sumber dan batas inferensi ada di `00-revision-evidence.md`. UX-02 direproduksi pada API PR terisolasi; hasilnya dan cakupan jenis lain ada di `00-functional-risk-assessment.md`. Hasil aksesibilitas baru ada di `00-accessibility-baseline.md`.

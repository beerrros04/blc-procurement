# Phase 02 - Responsive specifications

Capture direncanakan pada 390x844, 768x900, 1280x900 dan 1440x900 CSS viewport; file screenshot full-page dapat lebih tinggi dari viewport. Desktop memakai sidebar dan tabel; di bawah 900px menu dan layout satu kolom; di bawah 600px tabel menjadi baris dengan nomor, nominal, status dan tahap lengkap. Tidak menyusutkan tabel desktop secara paksa.

Pemeriksaan yang memerlukan bukti terpisah: overflow horizontal, nominal panjang, navigasi, header, dialog, jangkauan aksi, association label, focus dan keyboard. Preview hanya statis: aksesibilitas Radix, semua state dialog, dan kemampuan transaksi belum terverifikasi. Screenshot dan status aktual dicatat di handoff/critique; jangan menilai NOT VERIFIED sebagai PASS.

Capture yang disimpan: dashboard, register, form, approval dan finance pada 1440x900 dan 390x844; dashboard juga 1280x900 dan 768x900; design sheet 1440x900. File PNG full-page memiliki tinggi lebih besar dari viewport. Taste `check.mjs` mencatat `overflowX: false` untuk kelima layar pada keempat viewport; exit code 1 karena aturan template marketing `no .wrap` pada semua ukuran. Ini bukan pass keseluruhan dan tidak membuktikan dialog atau keyboard. Nominal contoh dan header terlihat pada screenshot dashboard/register yang diperiksa; nilai panjang ekstrem belum diuji.

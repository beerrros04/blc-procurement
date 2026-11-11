# Phase 02 - Design tokens

Light theme adalah cakupan saat ini; nama semantik memungkinkan tema lain kemudian, tanpa mengklaim dark mode siap. Sumber visual: `workbench-preview/style.css`.

| Token | Nilai | Fungsi |
|---|---|---|
| primary / foreground | `#DC2626` / `#FFFFFF` | Brand dan aksi utama |
| primary hover / active / subtle | `#B91C1C` / `#991B1B` / `#FEF2F2` | Interaksi dan seleksi |
| background / foreground | `#F5F5F2` / `#17211E` | Kanvas / teks utama |
| card / card foreground | `#FFFFFF` / `#17211E` | Permukaan / teks |
| muted / muted foreground | `#F1F3F1` / `#52615A` | Isi sekunder |
| secondary | `#FFFFFF` | Aksi sekunder berbingkai |
| border / input / ring | `#DCE2DD` / `#697A6F` / `#2563EB` | Divider / kontrol / fokus |
| success / warning / destructive / info | `#176342` / `#805200` / `#A51B1B` / `#155A8A` | Makna state dengan label |

Draft memakai netral; submitted/in review amber; approved hijau; rejected merah tua dengan teks; completed hijau atau netral sesuai makna proses; paid dan unpaid selalu label terpisah dari status approval. Warna merah brand tidak otomatis berarti destructive.

Pengukuran rasio sRGB WCAG via perhitungan relative luminance: putih/primary **4.83:1**; foreground/putih **16.50:1**; muted foreground/putih **6.53:1**; success `#176342`/`#E6F4EB` **6.38:1**; warning `#805200`/`#FFF5DD` **6.19:1**; destructive `#A51B1B`/`#FEF2F2` **6.92:1**; info `#155A8A`/`#E7F2FA` **6.46:1**; ring `#2563EB`/putih **5.17:1**. Batas input awal `#AEBCB2`/putih **1.97:1**, diperkuat menjadi `#697A6F`/putih **4.55:1**. Putih pada hover `#B91C1C` **6.47:1** dan active `#991B1B` **8.31:1**. Divider dekoratif tidak otomatis menjadi batas kontrol. Kombinasi lain, placeholder, disabled, dan semua state belum diaudit.

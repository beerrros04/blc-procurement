# Phase 01  /  Arah visual dan keputusan

Alternatif konseptual, belum dirender. Setiap arah memakai crimson #DC2626 sebagai identitas selektif; warna state disertai teks. Kontras pasangan warna harus diukur.

| Arah | Komposisi, tipografi dan signature | Kelebihan | Tradeoff |
|---|---|---|---|
| A  /  Workbench | Kanvas netral hangat, sidebar ringkas, sans humanis kandidat Source Sans 3, garis status tahap informatif. | Cepat memindai tugas. | Memerlukan disiplin spacing dan state. |
| B  /  Ledger | Permukaan putih, grid tabel presisi, angka tabular, sans kandidat IBM Plex Sans. | Kuat untuk register dan Finance. | Tabel dapat terasa berat di mobile. |
| C  /  Guided | Netral dingin, urutan tugas/form menonjol, sans kandidat Manrope. | Mudah dipelajari. | Ruang berlebih dapat memperlambat operator. |

**Rekomendasi untuk PO: A  /  Workbench**, dengan angka tabular dari B dan form terarah dari C. Ini belum dipilih PO. Skala awal judul 24 / 28px, section 16 / 18px, body 14 / 16px, label 12 / 14px; radius 6 / 8px dan skala jarak 4px. Kandidat font memerlukan pemeriksaan lisensi, rendering, bahasa dan angka sebelum diputuskan.

Angka yang dipisahkan garis miring di atas adalah rentang kandidat, bukan dua ukuran yang telah disetujui. Tiga arah belum memiliki render, sehingga perbandingan hierarki, tipografi, kepadatan, kontras dan keselarasan visual masih hipotesis, bukan hasil audit visual final.

| Keputusan | Referensi | Adaptasi | Alasan |
|---|---|---|---|
| Sidebar | dashboard-01 / sidebar-01 | Kelompok pekerjaan BLC, dengan hak server | Jalur familiar |
| Data table | shadcn | Nomor, nilai, tahap dan aksi; baris mobile | Kepadatan terbaca |
| Form | shadcn Field/Input | Kelompok tugas dan error dekat field | Validasi jelas |
| Hierarki | Taste | Alignment, skala dan crimson selektif | Identitas dan scanability |
| Refinement | Impeccable Operate | Kurangi nested card berdasarkan baseline | Kurangi beban visual; masih perlu uji |
| Dialog | Radix | Fokus terkendali dan kembali ke pemicu | Aksesibilitas; perlu uji |

Dashboard-01 menggabungkan sidebar, header, cards, chart dan table. Grafik dan kartu contoh tidak otomatis bernilai operasional bagi BLC.
## Referensi dan batas
- [shadcn/ui](https://ui.shadcn.com/), [Dashboard Blocks](https://ui.shadcn.com/blocks/dashboard) dan [Sidebar](https://ui.shadcn.com/docs/components/sidebar): komponen dan shell yang diadaptasi untuk pengadaan, bukan disalin mentah.
- [Radix](https://www.radix-ui.com/primitives/docs/components/dialog): fokus, keyboard dan dialog sebagai target verifikasi.
- [Taste](https://www.tasteskill.dev/docs): satu sistem, hierarki dan ritme; aturan landing page tidak dipaksakan pada aplikasi operasional.
- [Impeccable Operate](https://raw.githubusercontent.com/pbakaus/impeccable/main/skill/reference/mode-operate.md): kejelasan tugas dan pola yang familier; evaluasi manual terbatas, bukan critique lengkap.
- Proyek: `docs/redesign/00-workflow-mapping.md`, `00-visual-coverage-matrix.md`, `hotfix-br-app-001-hf02d.md`, `docs/database/db01-completion-report.md`, dan source saat ini. Panduan v3 asli tidak ditemukan di checkout; ringkasan v3 bersifat sekunder dan perlu dicocokkan.

**Gate:** untuk review; tidak mengaktifkan stage engine, mengubah business logic/database, atau mengotorisasi DB-02 sampai DB-06.

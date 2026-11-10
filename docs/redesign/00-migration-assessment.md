# Phase 00 ? Migration assessment
Referensi pola dan komposisi: https://ui.shadcn.com/docs/components , https://ui.shadcn.com/docs/theming , https://ui.shadcn.com/blocks . Rekomendasi berikut belum merupakan desain yang disetujui.

| Komponen | Klasifikasi | Alasan / dependency |
|---|---|---|
| `domain/*`, `server/repository.ts`, API contract, auth | RETAIN LOGIC | keputusan approval, keuangan, validasi, akses, persistence; regression tests dan keputusan kebijakan wajib |
| `ui/button`, badge, input, label, card, textarea, table | REUSE + RESTYLE | primitif lokal sudah ada; audit API, states dan token sebelum pakai luas |
| dialog, sheet, tooltip | REUSE + RESTYLE | Radix tersedia; verifikasi focus, portal, overlay dan behavior sebelum menyatukan custom modal |
| `modal-dialog`, detail, export | COMPOSE | satukan primitive overlay setelah mempertahankan focus, close, busy, error dan keputusan domain |
| `DocumentList`, `ApprovalExplorer` | COMPOSE + RETAIN LOGIC | bangun tabel/filter di atas primitives, pertahankan filter, format, state dan aksi |
| `ApprovalProgress`, `ApprovalStepper`, StatusBadge | RESTYLE + RETAIN LOGIC | status dan urutan dinamis; hindari hilangnya makna atau nama aksesibel |
| Form PR/PO/GR/AV/RB/RC/PV | COMPOSE + RETAIN LOGIC | reuse field/label, preserve validasi, kalkulasi, conditional dan attachments |
| Shell, dashboards | REBUILD presentation + RETAIN LOGIC | pemisahan presentasi dari orkestrasi App dibutuhkan secara hati-hati; role visibility harus tetap |
| Export | COMPOSE + RETAIN LOGIC | layout bermasalah; pertahankan CSV dan perilaku print sampai disepakati lain |

Urutan usulan setelah gate: semantic tokens dan focus ? button/field/badge ? dialog/sheet ? table/filter ? shell ? komposisi domain. Perlu bandingkan penggunaan aktual dan uji setiap tahap; tidak semua primitive otomatis perlu diganti. #DC2626 merupakan constraint yang diberikan pengguna, bukan perubahan pada fase audit.

# REV-001 ? Visual coverage matrix
10 November 2026; status IN REVIEW. VERIFIED = screenshot diperiksa pada kondisi dan viewport yang disebut, bukan jaminan semua interaksi; PARTIAL = sebagian kondisi diverifikasi; NOT VERIFIED = belum diuji. API dan data seed in-memory terisolasi. Gambar adalah viewport awal, bukan full-page.

| Halaman/kondisi | Role | 375 | 768 | 1440 | Kesimpulan dan bukti |
|---|---|---|---|---|---|
| Login normal | belum login | VERIFIED | VERIFIED | VERIFIED | `baseline/login-mobile.png`, `login-tablet.png`, `login-desktop.png` |
| Login salah | belum login | VERIFIED | NOT VERIFIED | NOT VERIFIED | `rev01-login-error375.png` menampilkan alert; bukan tes server error |
| Executive dashboard | ADMIN | VERIFIED | VERIFIED | VERIFIED | `dashboard-mobile.png`, `dashboard-tablet.png`, `dashboard-desktop.png`; screenshot sebelumnya diambil sesudah wait timeout dan telah diperiksa |
| Pengajuan/staff | PEMOHON | VERIFIED | VERIFIED | VERIFIED | `staff-mobile.png`, `staff-tablet.png`, `staff-desktop.png` |
| Pengajuan empty owner | ATASAN, KEUANGAN | NOT VERIFIED | NOT VERIFIED | VERIFIED | `rev01-role-atasan.png`, `rev01-role-finance.png`; data seed tidak dimiliki role ini |
| Dashboard executive | AYU, BOD_HERY, BOD_HASHIMOTO | NOT VERIFIED | NOT VERIFIED | VERIFIED | `rev01-role-gm.png`, `rev01-role-hery.png`, `rev01-role-hashimoto.png`; bukan semua aksi |
| Dokumen | ADMIN | NOT VERIFIED | NOT VERIFIED | PARTIAL | screenshot sesi sebelumnya `baseline/register-desktop.png` saat ini adalah register; list dokumen pernah diamati tetapi tidak disimpan secara tepat sebagai bukti. Ambil ulang per viewport. |
| Approval Register dan stepper/status | ADMIN | NOT VERIFIED | NOT VERIFIED | VERIFIED | `baseline/register-desktop.png`: contoh draft, pending, approved dan paid, bukan setiap state |
| Approval History / Docs | PEMOHON | NOT VERIFIED | NOT VERIFIED | VERIFIED | `rev01-history1440.png`, `rev01-docs1440.png`; attachment download belum diuji lewat UI |
| Detail PR + stepper | PEMOHON | NOT VERIFIED | NOT VERIFIED | VERIFIED | `detail-desktop.png`; tidak mencakup approval action/rejection |
| Form PR | PEMOHON | VERIFIED | NOT VERIFIED | NOT VERIFIED | `form-mobile.png`, tampilan atas, tidak membuktikan semua field/validasi |
| Form PO/GR/AV/RB/RC/PV, payment | sesuai role | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | butuh fixture state khusus; uji isolated dataset pada tahap validasi yang diotorisasi |
| Export dialog | PEMOHON | VERIFIED | VERIFIED | VERIFIED | `rev01-export375.png`, `rev01-export768.png`, `export-desktop.png`; konten terhimpit pada ketiganya, bagian bawah keluar viewport awal 375; scroll reachability belum diuji |
| Empty hasil pencarian | PEMOHON | NOT VERIFIED | NOT VERIFIED | VERIFIED | `rev01-empty1440.png`; hasil tidak cocok, bukan database kosong |
| Loading dokumen/login | semua | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | kondisi sesaat tidak tertangkap; reproduksi dengan penundaan respons API pada test harness yang terisolasi |
| Error server/API | semua | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | belum dilakukan fault injection; mock HTTP error pada harness terisolasi |
| Approval/reject/revision/payment/attachment | role terkait | NOT VERIFIED | NOT VERIFIED | PARTIAL | status seed pada register/detail saja; siapkan fixture dan uji UI per tahap tanpa data nyata |

Seluruh tujuh role memiliki screenshot awal desktop (ADMIN/PEMOHON dan lima `rev01-role-*`). Ini tidak membuktikan seluruh halaman, kombinasi role, keyboard, dan status. Risiko visual yang belum terjangkau harus diuji sebagai bagian rencana validasi berikutnya; tidak ada Phase 01 yang dimulai.

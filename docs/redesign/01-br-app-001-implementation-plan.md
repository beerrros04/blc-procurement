# BR-APP-001 ? Analisis dampak dan rencana implementasi

**Status:** aturan bisnis APPROVED; rencana IN REVIEW; implementasi belum diotorisasi. Dokumen ini tidak mengubah API, model, kode, atau workflow berjalan. Ayu dipakai sebagai contoh keputusan produk, bukan identitas yang boleh di-hardcode.

## Invarian yang wajib

1. Eligibility tahap pertama berasal dari hubungan organisasi yang sah untuk divisi pemohon; global role GM tidak memberi akses menyeluruh. Owner tidak boleh menyetujui dokumen sendiri sesuai pembatasan saat ini.
2. Tahap memiliki identitas, penugasan, status, dan keputusan masing-masing. Satu user dapat menjadi approver pada lebih dari satu tahap. Action pertama hanya memutus tahap pertama; reviewer baru PENDING setelah tahap itu selesai dan membutuhkan action kedua secara eksplisit. Identitas sama tidak pernah menjadi alasan skip/approve otomatis.
3. Backend memverifikasi identitas terautentikasi, hubungan organisasi yang berlaku dan/atau penugasan stage yang telah ditetapkan sesuai kebijakan, stage aktif/PENDING, otorisasi dan versi. Tampilan pilihan bukan sumber otorisasi.
4. Setiap action mencatat document ID, stage ID, approver user ID, decision, timestamp dan notes opsional; dua tahap menghasilkan dua event audit yang berbeda.
5. Pertahankan urutan existing, BOD paralel, reject kembali ke draft/revisi, versi dan idempotensi, GR/PV exceptions, payment, serta kontrak lain kecuali perubahan disetujui. Tidak ada klaim perilaku baru telah diterapkan.

## Kondisi aktual dan dampak

| Area | Bukti source | Dampak yang perlu direncanakan |
|---|---|---|
| Pilihan tahap pertama | `src/components/forms/ApproverSelect.tsx:3`, `FormPR/PO/AV/RB/RC.tsx` | Daftar statis mencakup AYU/kustom; perlu data eligible untuk konteks organisasi dan dokumen dari backend, loading/empty/error dan pemilihan valid. Jangan menentukan akses dari daftar frontend. |
| Submit | `server/app.ts:188-198`, `server/auth.ts:22` | Saat ini hanya seeded user dengan role ATASAN diterima. Ganti dengan policy eligibility organisasi tervalidasi, bukan menghapus pengecekan. Self-approval tetap ditolak. |
| Keputusan | `server/app.ts:210-241`, `server/repository.ts:880-1055` | Identitas tahap pertama diperiksa khusus role ATASAN; repository dispatch dan transisi berdasarkan role. Perlu otorisasi dan dispatch berdasarkan stage aktif + assignment + user ID sambil menjaga BOD paralel. |
| UI action dan antrean | `DocumentDetailModal.tsx:98-117`, `DocumentList.tsx:110-130`, `BentoMetrics.tsx:99`, `server/repository.ts:1450` | Tombol dan hitungan action saat ini menggunakan role/status; hitung berdasarkan stage assignment dan identitas, termasuk user yang sama pada dua stage. UI hanya indikasi; backend final. |
| Model | `src/types/document.ts:15-47,88-104`, `server/repository.ts:105` | Tahap ATASAN/AYU saat ini key tetap, stage-1 disimpan sebagai email dan nama; `AuditLogEntry` menyimpan actor string tanpa stage ID atau approver user ID. Belum terlihat model divisi/relasi organisasi dalam tipe dokumen. |
| History | `src/components/ApprovalExplorer.tsx:496-550`, `DocumentDetailModal.tsx:560` | Tampilkan dua event berbeda dengan nama, tanggung jawab stage, waktu, keputusan dan catatan; dukung catatan legacy yang tidak memiliki ID tahap/user. |
| Penyimpanan | `server/index.ts`, `server/repository.ts:105-160`, `db/schema.sql` | Runtime SQLite menyimpan serialized workspace payload; `db/schema.sql` bukan migrasi runtime SQLite yang terbukti. Perlu versi payload dan migrasi eksplisit, bukan menganggap skema referensi otomatis aktif. |
| Other paths | `src/store/document-store.ts`, server tests, `src/api.ts` | Audit pemakaian store lokal, fixture, API client, approval tests dan event outbox untuk menghindari dua implementasi yang berbeda. Hindari perubahan diam-diam pada konsumen. |

## Usulan model dan kontrak ? untuk review, bukan keputusan final

- `organizationUnitId` pada konteks pemohon/dokumen, merujuk organisasi yang dipercaya server; tidak menyamakan cabang dengan divisi tanpa data yang sah. Model `organizationalAssignment` menghubungkan approver user ID ke unit dan lingkup tanggung jawab, dengan periode berlaku dan sumber/provenance yang dapat diaudit. User role tetap atribut terpisah. Tentukan bagaimana riwayat dan perubahan organisasi berlaku atas dokumen yang sudah diajukan.
- `approvalStageId` stabil dan unik per instance stage dokumen (termasuk identitas approval BOD paralel), stage kind/tanggung jawab, status dan assigned approver user ID; ID user yang sama dapat muncul pada beberapa stage. Catat siklus revisi/submit secara eksplisit atau cara yang setara untuk membedakan keputusan lama dari stage yang diajukan ulang. Struktur dapat mempertahankan keys existing melalui adapter jika kompatibel; desain akhir perlu review.
- Audit event memuat `documentId`, `stageId`, `approverUserId`, decision, action timestamp, notes dan event ID; pertahankan actor display snapshot bila dibutuhkan, tanpa menjadikannya identitas. Rekaman lama yang hanya punya nama/waktu/action tidak boleh dipalsukan: pertahankan sebagai legacy, isi ID hanya bila dapat dibuktikan, tandai unknown jika ambigu.
- Kandidat endpoint read-only yang diautentikasi untuk eligible approvers menerima konteks yang server validasi (unit pemohon, tipe dan/atau dokumen); backend juga mengevaluasi ulang saat submit dan action. Bentuk path, payload, otorisasi dan response adalah usulan, perlu review kompatibilitas API. Stage decision harus menargetkan stage ID yang diharapkan serta expectedVersion; jangan mempercayai user ID/role yang dikirim client sebagai identitas.
- Idempotency harus mengikat actor, dokumen, stage instance dan request key. Retry dari stage pertama harus mengembalikan hasil semula atau konflik; tidak boleh dievaluasi ulang sebagai keputusan tahap kedua meskipun user sama. Tolak stage stale, aksi duplikat dan konkurensi; simpan state dan event atomik sesuai kemampuan persistence. Tentukan perilaku retry dan code error sebelum implementasi.

## Rencana kerja setelah otorisasi fase pengembangan

1. Sepakati sumber organisasi/divisi, identitas stabil, cakupan assignment, titik evaluasi eligibility, kebijakan perubahan penugasan dan kontrak API; definisikan fixture realistis dan mapping legacy. Tidak berasumsi role atau cabang setara divisi.
2. Desain/versioning data dan migrasi non-destruktif dengan backup, dry-run, verifikasi serta rollback; dokumentasikan dokumen in-flight, tahap aktif, revisi, BOD, PV/GR dan event ambigu. Jangan mengarang identitas atau keputusan historis.
3. Implementasikan service eligibility bersama backend untuk daftar pilihan dan validasi submit; authorisasi tiap keputusan berdasar user + stage aktif + assignment. Tambahkan stage-bound idempotency dan atomic version handling. Pertahankan behavior yang disepakati untuk role/stage lain.
4. Sesuaikan frontend: daftar eligible berdasarkan konteks, field assignment, indikator tahap berdasarkan tanggung jawab, aksi pending yang sesuai, feedback error, serta history dengan dua event terpisah. Jangan pernah mengandalkan frontend sebagai enforcement.
5. Tambahkan tes backend/domain, kontrak API, UI dan migrasi pada daftar di bawah; jalankan suite existing, typecheck/build dan uji workflow regression yang relevan. Review keamanan dan keputusan data sebelum rollout.

## Test cases yang dapat diverifikasi

| ID | Setup / aksi | Hasil yang diwajibkan |
|---|---|---|
| T01 | GM ditugaskan pada divisi pemohon; minta eligible | GM muncul dan submit diterima jika seluruh aturan dokumen lain terpenuhi. |
| T02 | GM tanpa assignment atau assignment divisi lain | Tidak muncul; submit langsung ditolak backend walaupun client memalsukan pilihan. |
| T03 | User sama assigned stage 1 dan reviewer; stage 1 aktif | Action pertama hanya mengubah stage 1 menjadi APPROVED; reviewer PENDING, belum ada keputusan kedua. |
| T04 | User sama mengirim action baru pada reviewer yang aktif | Reviewer APPROVED dan dua audit events memiliki stage ID berbeda, user ID sama, decision dan timestamp masing-masing. |
| T05 | Retry action tahap 1 dengan key sama setelah tahap 2 aktif | Replay idempotent atau konflik sesuai kontrak; tidak menyelesaikan reviewer atau membuat event kedua. |
| T06 | Dua request bersamaan atau expectedVersion/stage ID stale | Tepat satu perubahan stage yang sah; request lain konflik/replay aman, tidak terjadi skip. |
| T07 | User tidak ditugaskan, owner dokumen, assignment tidak berlaku, atau stage belum aktif | Backend menolak tanpa perubahan status atau audit approval. |
| T08 | UI memilih divisi berbeda atau eligibility kosong/error | Hanya eligible dari backend ditawarkan; state loading/error/empty jelas, server tetap revalidate saat submit. |
| T09 | Reject dengan/ tanpa catatan pada masing-masing tahap; revise dan resubmit | Aturan rejection/catatan dan reset existing dipertahankan; event terikat stage dan siklus yang benar. |
| T10 | BOD kedua urutan keputusan, GR, PV generation/approval, payment | Urutan paralel dan pengecualian existing tetap; tidak ada perubahan finansial atau lifecycle tanpa persetujuan. |
| T11 | Rekaman legacy, in-flight, nama ambigu dan rollback migrasi | Data dan status tidak hilang; ID yang tidak bisa dibuktikan tetap unknown; hasil migrasi dapat diverifikasi/rollback. |
| T12 | History dan actionable queue untuk user sama pada dua tahap | Tiap event tampil terpisah dengan stage benar; hanya tahap aktif yang actionable; setelah action pertama tahap kedua memerlukan klik/action baru. |
| T13 | Eligibility berubah antara pemilihan dan submit/action | Backend menegakkan kebijakan temporal yang disepakati; hasil ditampilkan jelas, tidak bergantung pada cache frontend. |

## Dependencies, risiko dan keputusan lanjutan

- Diperlukan sumber organisasi dan pemetaan pemohon-ke-divisi yang tepercaya; repository saat ini belum membuktikan keberadaannya. Siapa mengelola, memperbarui dan mengaudit assignment?
- Tentukan snapshot assignment saat submit versus re-evaluasi saat keputusan, termasuk rotasi, delegasi dan pencabutan. Apapun pilihannya, backend tetap menegakkan authorization dan active stage.
- Tentukan perubahan kontrak API, rollout klien, migration/rollback dan perlakuan dokumen yang sedang berjalan; jangan mengisi sejarah dengan identitas hasil tebakan.
- Tetapkan batas tenant/cabang dan visibility secara terpisah dari BR-APP-001; keputusan ini tidak menyetujui perluasan akses baca.
- Data contoh, standar approver dan seed saat ini tidak boleh menjadi production directory tanpa keputusan eksplisit. Perubahan idempotensi, outbox dan history dapat memengaruhi integrasi; tinjau konsumen sebelum rollout.

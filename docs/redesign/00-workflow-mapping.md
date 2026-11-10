# Phase 00 ? Functional and workflow mapping

| Workflow | UI ? state/API ? server/domain | Perilaku yang harus dipertahankan |
|---|---|---|
| Login | SignInPage ? App `completeLogin` ? `/auth/login`, `/me` ? `server/auth.ts` | bearer token, pemulihan sesi dan error; profil demo adalah kondisi saat ini |
| Draft / submit | forms ? `handleSaveDoc` ? POST/PUT documents, attachment POST, submit ? `server/app.ts`, `repository.ts` | owner PEMOHON, version, validasi, lampiran dan error; GR diproses khusus |
| Approval / revisi | `DocumentDetailModal` ? decisions ? `recordDecision` | ATASAN ? AYU ? BOD paralel HERY/HASHIMOTO; keputusan BOD keduanya diperlukan; reject mengembalikan ke DRAFT dan menyimpan audit/comment. PV dimulai pada AYU; GR bypass persetujuan. |
| Relasi | `main.tsx` `handleCreateRelated`, `repository.ts` | PR approved ? PO; PO approved/paid ? GR; AV paid ? RC, dengan validasi server tambahan; jangan hanya mengandalkan tombol |
| Finance | `FormPV`, `FormPVPayment` ? generate-pv, confirm-rc, payments record | hanya KEUANGAN pada endpoint terkait; PV approved sebelum pembayaran, source dapat berubah PAID sesuai aturan repository |
| Kalkulasi | form + `src/domain/calculations.ts`, dipakai ulang oleh `server/repository.ts` | basis max(0, subtotal+biaya-diskon), PPN/PPh dibulatkan, total basis+PPN?PPh; RC saldo AV?realisasi menentukan surplus/defisit/exact; PV netto max(0,gross?PPh). |
| Lampiran | form `read-attachment` ? API ? `server/storage.ts` | PDF/PNG/JPEG maksimum 10 MB, kategori, hak akses dan unduh |
| Search / ekspor | `DocumentList`, `ApprovalExplorer`, `ExportModal` | filter lokal; export CSV BOM 13 kolom, pilihan PDF memanggil `window.print()`; bukan server-generated PDF |

Model status lengkap dan tipe dokumen di `src/types/document.ts`. `server/repository.ts` adalah sumber utama validasi backend untuk runtime API; store lokal memiliki implementasi paralel dan tidak boleh disamakan tanpa verifikasi. Tests otomatis tidak menggantikan uji end-to-end seluruh transisi dan role.

## BR-APP-001 ? aturan disetujui, implementasi tertunda
Ini adalah target yang disetujui, bukan perilaku runtime saat ini. User role, organizational assignment, stage, stage approver dan action adalah konsep berbeda. Seorang GM dapat menjadi approver tahap pertama hanya untuk divisi di bawah penugasan organisasinya. Penugasan yang sama pada tahap pertama dan tahap reviewer menghasilkan dua stage dan dua action independen dari user ID yang sama. Setelah action pertama, stage pertama saja selesai; tahap reviewer menjadi aktif sesuai urutan dan tetap PENDING sampai action kedua yang terpisah. Tidak ada persetujuan otomatis atau skip karena identitas sama.

Setiap keputusan harus divalidasi backend terhadap identitas terautentikasi, penugasan pada stage yang aktif, status, hak organisasi yang relevan dan versi; catat document ID, stage ID, approver user ID, keputusan, timestamp dan catatan bila ada. Tahap BOD paralel, rejection/revision, siklus dokumen, payment dan otorisasi lain tetap mengikuti aturan existing. Perlakuan GR dan PV saat ini tidak berubah tanpa persetujuan terpisah. Analisis teknis dan compatibility plan ada di `01-br-app-001-implementation-plan.md`.

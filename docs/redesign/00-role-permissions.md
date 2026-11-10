# Phase 00 ? Role dan permissions

| Role aktual | Operations menu `main.tsx` | Aksi backend yang teridentifikasi |
|---|---|---|
| PEMOHON | Pengajuan | create dan edit/submit dokumen milik sendiri; dapat melihat daftar yang dikembalikan API |
| ATASAN | Pengajuan | keputusan tahap ATASAN bila ditugaskan; tidak boleh memutus dokumen sendiri |
| AYU | Dashboard, Pengajuan, Dokumen | keputusan tahap AYU |
| BOD_HERY / BOD_HASHIMOTO | Dashboard, Pengajuan, Dokumen | keputusan masing-masing pada tahap BOD paralel |
| KEUANGAN | Pengajuan, Dokumen | generate PV, confirm RC, catat pembayaran; owner exception untuk PV |
| ADMIN | Dashboard, Pengajuan, Dokumen | tampilan luas; jangan mengasumsikan bypass semua endpoint mutasi |

Menu Approval Register/History/Docs dirender untuk seluruh role (`Sidebar`, `SHAREPOINT_NAV_ITEMS`). `server/app.ts` mensyaratkan JWT, memeriksa ownership dan assignee untuk mutasi, menyembunyikan sebagian data bank/lampiran via `visibleDocument`. Namun GET list memakai `repo.listDocuments` tanpa filter owner/branch yang dipaksakan; detail juga mengambil dokumen berdasar ID lalu melakukan masking. Ini adalah perilaku kode saat ini, bukan persetujuan kebijakan akses. Pertanyaan kebijakan data lintas pemohon/cabang harus diputuskan sebelum dijadikan acceptance test. UI quick role switch adalah fasilitas mode uji dengan akun seed; bukan model SSO production yang telah diverifikasi.

## Pendalaman REV-003
Perbedaan filter owner pada daftar Pengajuan Saya dan list API, masking, hasil probe lintas cabang, serta pertanyaan kebijakan dirinci di `00-functional-risk-assessment.md`.

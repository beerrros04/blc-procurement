import React, { useState } from 'react';
import { readAttachment } from '../../lib/read-attachment';
import { OFFICIAL_BRANCHES } from '../../domain/branches';
import type { GRDocument, PODocument } from '../../types/document';

export interface FormGRProps {
  initialDoc: GRDocument;
  availablePos: PODocument[];
  onSave: (doc: GRDocument) => void;
  onClose: () => void;
}

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export const FormGR: React.FC<FormGRProps> = ({
  initialDoc,
  availablePos,
  onSave,
  onClose,
}) => {
  const [doc, setDoc] = useState<GRDocument>(initialDoc);
  const [error, setError] = useState<string>('');

  function handlePoSelect(poId: string) {
    const selectedPo = availablePos.find((p) => p.id === poId);
    if (selectedPo) {
      setDoc((prev) => ({
        ...prev,
        parentPoId: selectedPo.id,
        parentPoNumber: selectedPo.docNumber,
        vendorName: selectedPo.vendorName,
        branch: selectedPo.branch,
        title: prev.title || `Laporan Penerimaan: ${selectedPo.title}`,
        purpose: prev.purpose || selectedPo.purpose,
      }));
    } else {
      setDoc((prev) => ({
        ...prev,
        parentPoId: '',
        parentPoNumber: undefined,
      }));
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const requiredCat = doc.receiptType === 'SERVICE' ? 'BAST' : 'PHOTO';
    try {
      const entry = await readAttachment(file, requiredCat);
      setDoc((prev) => ({
        ...prev,
        attachments: [
          ...(prev.attachments || []).filter((a) => a.category !== 'PHOTO' && a.category !== 'BAST'),
          entry,
        ],
      }));
      setError('');
    } catch {
      setError('Berkas bukti penerimaan tidak dapat dibaca.');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!doc.parentPoId) {
      setError('Pilih Purchase Order (PO) terkait yang barang/jasanya diterima.');
      return;
    }
    if (!doc.title.trim()) {
      setError('Judul Laporan Penerimaan (GR) wajib diisi.');
      return;
    }
    if (!doc.branch.trim()) {
      setError('Cabang wajib dipilih.');
      return;
    }
    if (!doc.receivedDate) {
      setError('Tanggal penerimaan barang/jasa wajib diisi.');
      return;
    }
    const requiredCategory = doc.receiptType === 'SERVICE' ? 'BAST' : 'PHOTO';
    const hasRequiredFile = (doc.attachments || []).some((a) => a.category === requiredCategory);
    if (!hasRequiredFile) {
      setError(
        doc.receiptType === 'SERVICE'
          ? 'Penerimaan Jasa wajib melampirkan berkas Berita Acara Serah Terima (BAST).'
          : 'Penerimaan Barang wajib melampirkan foto fisik barang yang diterima.'
      );
      return;
    }

    onSave({
      ...doc,
      requiresFollowUp: doc.itemCondition !== 'BAIK',
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-body">
        {error && <div className="notice error-notice" role="alert">{error}</div>}

        <div className="form-callout form-callout-info" role="note">
          <strong>Laporan Penerimaan Barang/Jasa (Tanpa Persetujuan Berjenjang)</strong>
          <p>
            Laporan ini mencatat bukti fisik penerimaan barang (Foto) atau penyelesaian jasa (BAST) atas PO yang telah disetujui dan otomatis terhubung ke Paket Audit PV.
          </p>
        </div>

        <label htmlFor="gr-po-select">Pilih Purchase Order (PO) Terkait <span>*</span></label>
        <select
          id="gr-po-select"
          value={doc.parentPoId}
          onChange={(e) => handlePoSelect(e.target.value)}
        >
          <option value="">-- Pilih PO (Status Approved / Paid) --</option>
          {availablePos.map((po) => (
            <option key={po.id} value={po.id}>
              {po.docNumber} - {po.title} ({po.vendorName} · {rupiah.format(po.totalAmount)})
            </option>
          ))}
        </select>

        <label htmlFor="gr-title">Judul Laporan Penerimaan <span>*</span></label>
        <input
          id="gr-title"
          value={doc.title}
          onChange={(e) => setDoc({ ...doc, title: e.target.value })}
          placeholder="Contoh: Penerimaan 5 Unit Laptop Operasional Cabang Bekasi"
        />

        <div className="form-grid-3">
          <div>
            <label htmlFor="gr-branch">Cabang <span>*</span></label>
            <select
              id="gr-branch"
              value={doc.branch}
              onChange={(e) => setDoc({ ...doc, branch: e.target.value })}
            >
              <option value="">-- Pilih Cabang --</option>
              {OFFICIAL_BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}{b === 'Bekasi' ? ' (Pusat)' : ''}
                </option>
              ))}
              {doc.branch && !OFFICIAL_BRANCHES.includes(doc.branch as any) && (
                <option value={doc.branch}>{doc.branch}</option>
              )}
            </select>
          </div>
          <div>
            <label htmlFor="gr-type">Jenis Penerimaan <span>*</span></label>
            <select
              id="gr-type"
              value={doc.receiptType}
              onChange={(e) =>
                setDoc({
                  ...doc,
                  receiptType: e.target.value as 'GOODS' | 'SERVICE',
                  attachments: [],
                })
              }
            >
              <option value="GOODS">Barang (Wajib Foto Barang)</option>
              <option value="SERVICE">Jasa / Pekerjaan (Wajib BAST)</option>
            </select>
          </div>
          <div>
            <label htmlFor="gr-date">Tanggal Diterima <span>*</span></label>
            <input
              id="gr-date"
              type="date"
              value={doc.receivedDate}
              onChange={(e) => setDoc({ ...doc, receivedDate: e.target.value })}
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div>
            <label htmlFor="gr-condition">Kondisi Barang / Hasil Jasa <span>*</span></label>
            <select
              id="gr-condition"
              value={doc.itemCondition}
              onChange={(e) =>
                setDoc({
                  ...doc,
                  itemCondition: e.target.value as 'BAIK' | 'KURANG' | 'RUSAK',
                })
              }
            >
              <option value="BAIK">Baik — Lengkap & Sesuai Spesifikasi</option>
              <option value="KURANG">Kurang — Jumlah / Volume Tidak Lengkap</option>
              <option value="RUSAK">Rusak / Cacat — Perlu Penggantian / Klaim</option>
            </select>
          </div>
          <div>
            <label htmlFor="gr-vendor">Vendor / Rekanan</label>
            <input
              id="gr-vendor"
              value={doc.vendorName || ''}
              onChange={(e) => setDoc({ ...doc, vendorName: e.target.value })}
              placeholder="Nama Vendor"
            />
          </div>
        </div>

        {doc.itemCondition !== 'BAIK' && (
          <div className="form-callout form-callout-warning" role="alert">
            <strong>Status Tindak Lanjut: Perlu Tindakan</strong>
            <p>
              Kondisi tercatat sebagai <strong>{doc.itemCondition}</strong>. Laporan ini akan diberi penanda &ldquo;Perlu tindakan&rdquo; untuk ditindaklanjuti bersama vendor dan tim Finance sebelum pelunasan akhir.
            </p>
          </div>
        )}

        <label htmlFor="gr-file">
          {doc.receiptType === 'SERVICE'
            ? 'Unggah Berkas Berita Acara Serah Terima (BAST_) *'
            : 'Unggah Foto Barang Diterima (Photo_) *'}
        </label>
        <input
          id="gr-file"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
        />
        {doc.attachments && doc.attachments.length > 0 && (
          <div className="help" style={{ marginTop: '6px' }}>
            Terlampir: {doc.attachments.map((a) => `[${a.category}] ${a.name} (${Math.ceil(a.size / 1024)} KB)`).join(', ')}
          </div>
        )}

        <label htmlFor="gr-notes">Catatan Pemeriksaan Fisik / BAST</label>
        <textarea
          id="gr-notes"
          rows={3}
          value={doc.notes || ''}
          onChange={(e) => setDoc({ ...doc, notes: e.target.value, purpose: e.target.value || doc.purpose })}
          placeholder="Tuliskan nomor surat jalan, nomor seri barang, atau catatan kekurangan..."
        />
      </div>

      <div className="form-actions">
        <button type="button" className="secondary" onClick={onClose}>
          Batal
        </button>
        <button type="submit" className="primary">
          Simpan & Catat Penerimaan (GR) <span aria-hidden="true">✔</span>
        </button>
      </div>
    </form>
  );
};

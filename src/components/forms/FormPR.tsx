import React, { useState } from 'react';
import type { PRDocument } from '../../types/document';

export interface FormPRProps {
  initialDoc: PRDocument;
  onSave: (doc: PRDocument) => void;
  onClose: () => void;
}

export const FormPR: React.FC<FormPRProps> = ({ initialDoc, onSave, onClose }) => {
  const [doc, setDoc] = useState<PRDocument>(initialDoc);
  const [amountStr, setAmountStr] = useState<string>(String(initialDoc.subtotalAmount || ''));
  const [error, setError] = useState<string>('');

  const amount = Number(amountStr) || 0;
  const isIamRequired = amount >= 5_000_000;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!doc.title.trim()) {
      setError('Judul permintaan wajib diisi.');
      return;
    }
    if (!doc.branch.trim()) {
      setError('Cabang wajib diisi.');
      return;
    }
    if (amount <= 0) {
      setError('Nominal subtotal harus lebih besar dari Rp 0.');
      return;
    }

    onSave({
      ...doc,
      subtotalAmount: amount,
      isIamRequired,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-body">
        <div className="form-intro">
          <span>PR</span>
          <div>
            <strong>Informasi Permintaan Pembelian (Purchase Request)</strong>
            <p>Formulir inisiasi pengadaan barang atau jasa operasional cabang/pusat.</p>
          </div>
        </div>

        {error && <div className="notice error-notice" role="alert">{error}</div>}

        <label htmlFor="pr-title">Judul Pengadaan <span>*</span></label>
        <input
          id="pr-title"
          value={doc.title}
          onChange={(e) => setDoc({ ...doc, title: e.target.value })}
          placeholder="Contoh: Pengadaan 5 Unit Laptop Operasional"
        />

        <div className="form-grid-2">
          <div>
            <label htmlFor="pr-branch">Cabang <span>*</span></label>
            <input
              id="pr-branch"
              value={doc.branch}
              onChange={(e) => setDoc({ ...doc, branch: e.target.value })}
              placeholder="Contoh: Pusat / Bandung"
            />
          </div>
          <div>
            <label htmlFor="pr-budget">Tipe Anggaran <span>*</span></label>
            <select
              id="pr-budget"
              value={doc.budgetType}
              onChange={(e) => setDoc({ ...doc, budgetType: e.target.value })}
            >
              <option value="OPEX">OPEX (Operasional)</option>
              <option value="CAPEX">CAPEX (Investasi Modal)</option>
              <option value="PROJECT">Project Khusus</option>
            </select>
          </div>
        </div>

        <label htmlFor="pr-purpose">Tujuan & Kebutuhan Pengadaan</label>
        <textarea
          id="pr-purpose"
          rows={3}
          value={doc.purpose}
          onChange={(e) => setDoc({ ...doc, purpose: e.target.value })}
          placeholder="Jelaskan justifikasi bisnis dan urgensi pengadaan..."
        />

        <div className="form-grid-2">
          <div>
            <label htmlFor="pr-date">Tanggal Kebutuhan</label>
            <input
              id="pr-date"
              type="date"
              value={doc.requiredDate || ''}
              onChange={(e) => setDoc({ ...doc, requiredDate: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="pr-amount">Estimasi Subtotal <span>*</span></label>
            <div className="money">
              <span>Rp</span>
              <input
                id="pr-amount"
                inputMode="numeric"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {isIamRequired && (
          <div className="form-callout form-callout-warning" role="note">
            <strong>Pemberitahuan Kelengkapan Dokumen:</strong>
            <p>
              Karena estimasi nominal subtotal $\ge$ Rp 5.000.000, lampiran berkas memo
              <strong> IAM (Internal Approval Memo)</strong> wajib dipersiapkan untuk
              verifikasi administratif.
            </p>
          </div>
        )}

        <label htmlFor="pr-notes">Catatan Tambahan</label>
        <textarea
          id="pr-notes"
          rows={2}
          value={doc.notes || ''}
          onChange={(e) => setDoc({ ...doc, notes: e.target.value })}
          placeholder="Catatan spesifikasi teknis atau vendor rekomendasi..."
        />
      </div>

      <div className="form-actions">
        <button type="button" className="secondary" onClick={onClose}>
          Batal
        </button>
        <button type="submit" className="primary">
          Simpan Draf PR <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
};

import React, { useState } from 'react';
import type { PRDocument } from '../../types/document';
import { calculatePoTotal } from '../../domain/calculations';
import { OFFICIAL_BRANCHES } from '../../domain/branches';
import { readAttachment } from '../../lib/read-attachment';
import { formatCurrencyInput, parseCurrencyInput } from '../../lib/currency-format';
import { TaxFields } from './TaxFields';

export interface FormPRProps {
  initialDoc: PRDocument;
  onSave: (doc: PRDocument) => void;
  onClose: () => void;
}

export const FormPR: React.FC<FormPRProps> = ({ initialDoc, onSave, onClose }) => {
  const [doc, setDoc] = useState<PRDocument>(initialDoc);
  const [amountStr, setAmountStr] = useState<string>(formatCurrencyInput(initialDoc.subtotalAmount));
  const [error, setError] = useState<string>('');

  const amount = parseCurrencyInput(amountStr);
  const isIamRequired = amount >= 5_000_000;
  const calc = calculatePoTotal({ subtotal: amount, otherCosts: doc.otherCosts, discount: doc.discount, ppnRate: doc.ppnRate ?? 0, pphRate: doc.pphRate ?? 0 });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    let entry;
    try { entry = await readAttachment(file, 'IAM_MEMO'); } catch { setError('Berkas tidak dapat dibaca.'); return; }
    setDoc((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []).filter((a) => a.category !== 'IAM_MEMO'), entry],
    }));
  }

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
    if (calc.totalAmount > 50_000_000) {
      setError('Nilai total pengajuan melebihi batas sistem Rp 50.000.000. Pengajuan di atas batas ini menggunakan prosedur manual.');
      return;
    }

    onSave({
      ...doc,
      subtotalAmount: amount,
      isIamRequired,
      ppnAmount: calc.ppnAmount,
      pphAmount: calc.pphAmount,
      totalAmount: calc.totalAmount,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-body">
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
            <select
              id="pr-branch"
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
                onChange={(e) => setAmountStr(formatCurrencyInput(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="form-grid-2">
          <div>
            <label htmlFor="pr-other">Biaya lain</label>
            <input
              id="pr-other"
              inputMode="numeric"
              value={formatCurrencyInput(doc.otherCosts ?? 0)}
              onChange={(e) => setDoc({ ...doc, otherCosts: parseCurrencyInput(e.target.value) })}
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="pr-discount">Diskon</label>
            <input
              id="pr-discount"
              inputMode="numeric"
              value={formatCurrencyInput(doc.discount ?? 0)}
              onChange={(e) => setDoc({ ...doc, discount: parseCurrencyInput(e.target.value) })}
              placeholder="0"
            />
          </div>
        </div>
        <TaxFields prefix="pr" values={doc} onChange={(values) => setDoc({ ...doc, ...values })} />
        <div className="form-grid-2">
          <div><label htmlFor="pr-iam">Nomor IAM</label><input id="pr-iam" value={doc.iamNumber ?? ''} onChange={(e) => setDoc({ ...doc, iamNumber: e.target.value })} /></div>
          <div><label htmlFor="pr-number">Nomor PR terkait (jika ada)</label><input id="pr-number" value={doc.prNumber ?? ''} onChange={(e) => setDoc({ ...doc, prNumber: e.target.value })} /></div>
        </div>
        <p className="help">Perkiraan PPN: Rp {calc.ppnAmount.toLocaleString('id-ID')} · PPh: Rp {calc.pphAmount.toLocaleString('id-ID')} · Total Bersih: Rp {calc.totalAmount.toLocaleString('id-ID')} (Batas maks. sistem Rp 50.000.000).</p>

        {isIamRequired && (
          <div className="form-callout form-callout-warning" role="note">
            <strong>Pemberitahuan Kelengkapan Dokumen IAM:</strong>
            <p>
              Estimasi subtotal ≥ Rp 5.000.000. Nomor IAM dan Lampiran Memo IAM wajib dilengkapi sebelum PR diajukan.
            </p>
          </div>
        )}

        <p className="demo-attachment-note">Lampiran disimpan di server lokal saat draf disimpan.</p>
        <label htmlFor="pr-iam-file">
          Lampiran Berkas / Memo IAM
        </label>
        <input
          id="pr-iam-file"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
        />
        {doc.attachments && doc.attachments.length > 0 && (
          <div className="help" style={{ marginTop: '6px' }}>
            Terlampir: {doc.attachments.map((a) => `${a.name} (${Math.ceil(a.size / 1024)} KB)`).join(', ')}
          </div>
        )}

        <label htmlFor="pr-approver">Email Atasan Langsung <span>*</span></label>
        <input id="pr-approver" type="email" value={doc.stage1ApproverEmail ?? ''} onChange={(e) => setDoc({ ...doc, stage1ApproverEmail: e.target.value })} placeholder="atasan@blc.co.id" />
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

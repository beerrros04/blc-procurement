import React, { useState } from 'react';
import type { AVDocument, PODocument } from '../../types/document';
import { calculatePoTotal } from '../../domain/calculations';
import { OFFICIAL_BRANCHES } from '../../domain/branches';
import { formatCurrencyInput, parseCurrencyInput } from '../../lib/currency-format';
import { TaxFields } from './TaxFields';
import { readAttachment } from '../../lib/read-attachment';

export interface FormAVProps {
  initialDoc: AVDocument;
  availablePos: PODocument[];
  onSave: (doc: AVDocument) => void;
  onClose: () => void;
}

export const FormAV: React.FC<FormAVProps> = ({ initialDoc, availablePos, onSave, onClose }) => {
  const [doc, setDoc] = useState<AVDocument>(initialDoc);
  const [amountStr, setAmountStr] = useState<string>(formatCurrencyInput(initialDoc.subtotal ?? initialDoc.amount));
  const [error, setError] = useState<string>('');

  const amount = parseCurrencyInput(amountStr);
  const calc = calculatePoTotal({ subtotal: amount, otherCosts: doc.otherCosts, discount: doc.discount, ppnRate: doc.ppnRate ?? 0, pphRate: doc.pphRate ?? 0 });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!doc.title.trim()) {
      setError('Judul pengajuan uang muka (AV) wajib diisi.');
      return;
    }
    if (!doc.branch.trim()) {
      setError('Cabang wajib dipilih.');
      return;
    }
    if (!doc.activityDate) {
      setError('Tanggal kegiatan operasional wajib diisi.');
      return;
    }
    if (!doc.activityEndDate) {
      setError('Tanggal selesai kegiatan wajib diisi.');
      return;
    }
    if (!doc.paymentDueDate) {
      setError('Batas waktu kebutuhan pencairan dana wajib diisi.');
      return;
    }
    if (amount <= 0) {
      setError('Nominal uang muka harus lebih besar dari Rp 0.');
      return;
    }
    if (calc.totalAmount > 50_000_000) {
      setError('Nilai total uang muka melebihi batas sistem Rp 50.000.000.');
      return;
    }
    const parentPo = doc.parentPoId ? availablePos.find((item) => item.id === doc.parentPoId) : undefined;
    if (parentPo && calc.totalAmount > parentPo.totalAmount) {
      setError(`Nominal uang muka (Rp ${calc.totalAmount.toLocaleString('id-ID')}) tidak boleh melebihi total PO terkait (Rp ${parentPo.totalAmount.toLocaleString('id-ID')}).`);
      return;
    }
    if (doc.disbursementMethod === 'TRANSFER') {
      const bank = doc.bankDetails;
      if (!bank?.bankName?.trim() || !bank?.accountNumber?.trim() || !bank?.accountHolder?.trim()) {
        setError('Untuk pencairan via transfer, data bank, nomor rekening, dan nama penerima wajib diisi.');
        return;
      }
    }

    onSave({
      ...doc,
      budgetType: doc.budgetType ?? 'OPEX',
      subtotal: calc.subtotal, amount: calc.totalAmount, ppnAmount: calc.ppnAmount, pphAmount: calc.pphAmount,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-body">
        {error && <div className="notice error-notice" role="alert">{error}</div>}

        <label htmlFor="av-parent-po">PO terkait (jika ada)</label>
        <select id="av-parent-po" value={doc.parentPoId ?? ''} onChange={(e) => {
          const po = availablePos.find((item) => item.id === e.target.value);
          setDoc({
            ...doc,
            parentPoId: po?.id,
            branch: po?.branch ?? doc.branch,
            purpose: doc.purpose || po?.purpose || '',
            budgetType: doc.budgetType || po?.budgetType,
            vendorName: doc.vendorName || po?.vendorName,
            stage1ApproverEmail: doc.stage1ApproverEmail || po?.stage1ApproverEmail,
          });
        }}>
          <option value="">Tanpa PO</option>
          {availablePos.map((po) => <option key={po.id} value={po.id}>{po.docNumber} : {po.title} (Rp {po.totalAmount.toLocaleString('id-ID')})</option>)}
        </select>

        <label htmlFor="av-title">Judul Pengajuan Uang Muka <span>*</span></label>
        <input
          id="av-title"
          value={doc.title}
          onChange={(e) => setDoc({ ...doc, title: e.target.value })}
          placeholder="Contoh: Uang Muka Perjalanan Dinas Audit Cabang Semarang"
        />

        <div className="form-grid-2">
          <div>
            <label htmlFor="av-branch">Cabang <span>*</span></label>
            <select
              id="av-branch"
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
            <label htmlFor="av-disbursement">Metode Pencairan <span>*</span></label>
            <select
              id="av-disbursement"
              value={doc.disbursementMethod}
              onChange={(e) =>
                setDoc({
                  ...doc,
                  disbursementMethod: e.target.value as 'TRANSFER' | 'CASH',
                })
              }
            >
              <option value="TRANSFER">Transfer ke Rekening Karyawan</option>
              <option value="CASH">Tunai dari Kasir Cabang/Pusat</option>
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div>
            <label htmlFor="av-activity-date">Tanggal Rencana Kegiatan <span>*</span></label>
            <input
              id="av-activity-date"
              type="date"
              value={doc.activityDate}
              onChange={(e) => setDoc({ ...doc, activityDate: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="av-due-date">Tanggal Dana Dibutuhkan <span>*</span></label>
            <input
              id="av-due-date"
              type="date"
              value={doc.paymentDueDate}
              onChange={(e) => setDoc({ ...doc, paymentDueDate: e.target.value })}
            />
          </div>
        </div>

        <label htmlFor="av-end-date">Tanggal Selesai Kegiatan <span>*</span></label>
        <input id="av-end-date" type="date" value={doc.activityEndDate ?? ''} onChange={(e) => setDoc({ ...doc, activityEndDate: e.target.value })} />

        <label htmlFor="av-amount">Subtotal Uang Muka Sebelum Pajak <span>*</span></label>
        <div className="money">
          <span>Rp</span>
          <input
            id="av-amount"
            inputMode="numeric"
            value={amountStr}
            onChange={(e) => setAmountStr(formatCurrencyInput(e.target.value))}
            placeholder="0"
          />
        </div>

        <div className="form-grid-2">
          <div>
            <label htmlFor="av-other">Biaya lain</label>
            <input
              id="av-other"
              inputMode="numeric"
              value={formatCurrencyInput(doc.otherCosts ?? 0)}
              onChange={(e) => setDoc({ ...doc, otherCosts: parseCurrencyInput(e.target.value) })}
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="av-discount">Diskon</label>
            <input
              id="av-discount"
              inputMode="numeric"
              value={formatCurrencyInput(doc.discount ?? 0)}
              onChange={(e) => setDoc({ ...doc, discount: parseCurrencyInput(e.target.value) })}
              placeholder="0"
            />
          </div>
        </div>
        <TaxFields prefix="av" values={doc} onChange={(values) => setDoc({ ...doc, ...values })} />
        <p className="help">PPN Rp {calc.ppnAmount.toLocaleString('id-ID')} · PPh Rp {calc.pphAmount.toLocaleString('id-ID')} · Perkiraan total Rp {calc.totalAmount.toLocaleString('id-ID')}</p>
        <div className="form-grid-2">
          <div><label htmlFor="av-budget">Tipe anggaran</label><select id="av-budget" value={doc.budgetType ?? 'OPEX'} onChange={(e) => setDoc({ ...doc, budgetType: e.target.value })}><option value="OPEX">OPEX</option><option value="CAPEX">CAPEX</option><option value="PROJECT">Project</option></select></div>
          <div><label htmlFor="av-vendor">Penerima / vendor</label><input id="av-vendor" value={doc.vendorName ?? ''} onChange={(e) => setDoc({ ...doc, vendorName: e.target.value })} /></div>
        </div>

        <label htmlFor="av-attachment">Lampiran pendukung</label>
        <input id="av-attachment" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          try { const attachment = await readAttachment(file, 'OTHER'); setDoc((previous) => ({ ...previous, attachments: [...(previous.attachments ?? []), attachment] })); }
          catch { setError('Berkas tidak dapat dibaca.'); }
        }} />
        <label htmlFor="av-approver">Email Atasan Langsung <span>*</span></label>
        <input id="av-approver" type="email" value={doc.stage1ApproverEmail ?? ''} onChange={(e) => setDoc({ ...doc, stage1ApproverEmail: e.target.value })} placeholder="atasan@blc.co.id" />
        <label htmlFor="av-purpose">Rincian Tujuan & Keperluan Penggunaan Dana</label>
        <textarea
          id="av-purpose"
          rows={3}
          value={doc.purpose}
          onChange={(e) => setDoc({ ...doc, purpose: e.target.value })}
          placeholder="Sebutkan perkiraan rincian tiket, penginapan, uang saku, atau biaya lokal..."
        />

        {doc.disbursementMethod === 'TRANSFER' && (
          <div className="form-summary-box">
            <strong>Rekening Penerima Uang Muka</strong>
            <div className="form-grid-3" style={{ marginTop: '10px' }}>
              <div>
                <label htmlFor="av-bank-name">Nama Bank <span>*</span></label>
                <input
                  id="av-bank-name"
                  value={doc.bankDetails?.bankName || ''}
                  onChange={(e) =>
                    setDoc({
                      ...doc,
                      bankDetails: {
                        ...(doc.bankDetails || { accountNumber: '', accountHolder: '' }),
                        bankName: e.target.value,
                      },
                    })
                  }
                  placeholder="BCA / Mandiri"
                />
              </div>
              <div>
                <label htmlFor="av-bank-acc">Nomor Rekening <span>*</span></label>
                <input
                  id="av-bank-acc"
                  value={doc.bankDetails?.accountNumber || ''}
                  onChange={(e) =>
                    setDoc({
                      ...doc,
                      bankDetails: {
                        ...(doc.bankDetails || { bankName: '', accountHolder: '' }),
                        accountNumber: e.target.value,
                      },
                    })
                  }
                  placeholder="50201928"
                />
              </div>
              <div>
                <label htmlFor="av-bank-holder">Nama Pemilik <span>*</span></label>
                <input
                  id="av-bank-holder"
                  value={doc.bankDetails?.accountHolder || ''}
                  onChange={(e) =>
                    setDoc({
                      ...doc,
                      bankDetails: {
                        ...(doc.bankDetails || { bankName: '', accountNumber: '' }),
                        accountHolder: e.target.value,
                      },
                    })
                  }
                  placeholder="Nama Karyawan"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="button" className="secondary" onClick={onClose}>
          Batal
        </button>
        <button type="submit" className="primary">
          Simpan Draf AV <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
};

import React, { useState } from 'react';
import type { RBDocument } from '../../types/document';
import { readAttachment } from '../../lib/read-attachment';
import { calculatePoTotal } from '../../domain/calculations';
import { TaxFields } from './TaxFields';

export interface FormRBProps {
  initialDoc: RBDocument;
  onSave: (doc: RBDocument) => void;
  onClose: () => void;
}

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export const FormRB: React.FC<FormRBProps> = ({ initialDoc, onSave, onClose }) => {
  const [doc, setDoc] = useState<RBDocument>(initialDoc);
  const [subtotalStr, setSubtotalStr] = useState<string>(String(initialDoc.subtotal || ''));
  const [otherCostsStr, setOtherCostsStr] = useState<string>(String(initialDoc.otherCosts || '0'));
  const [discountStr, setDiscountStr] = useState<string>(String(initialDoc.discount || '0'));
  const [attachmentCount, setAttachmentCount] = useState<number>(initialDoc.attachmentCount || 1);
  const [error, setError] = useState<string>('');

  const subtotal = Number(subtotalStr) || 0;
  const otherCosts = Number(otherCostsStr) || 0;
  const discount = Number(discountStr) || 0;
  const calc = calculatePoTotal({ subtotal, otherCosts, discount, ppnRate: doc.ppnRate ?? 0, pphRate: doc.pphRate ?? 0 });
  const total = calc.totalAmount;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!doc.title.trim()) {
      setError('Judul klaim penggantian biaya (RB) wajib diisi.');
      return;
    }
    if (!doc.transactionDate) {
      setError('Tanggal transaksi kuitansi/struk wajib diisi.');
      return;
    }
    if (total <= 0) {
      setError('Nominal klaim reimbursement harus lebih besar dari Rp 0.');
      return;
    }
    if (attachmentCount < 1) {
      setError('Minimal 1 lembar bukti kuitansi/struk fisik/digital wajib dilampirkan.');
      return;
    }

    const bank = doc.beneficiaryBank;
    if ((doc.paymentMethod ?? 'BANK_TRANSFER') === 'BANK_TRANSFER' && (!bank.bankName.trim() || !bank.accountNumber.trim() || !bank.accountHolder.trim())) {
      setError('Rekening bank penerima penggantian biaya wajib diisi lengkap.');
      return;
    }

    onSave({
      ...doc,
      budgetType: doc.budgetType ?? 'OPEX',
      paymentMethod: doc.paymentMethod ?? 'BANK_TRANSFER',
      subtotal,
      otherCosts,
      discount,
      totalAmount: total,
      ppnAmount: calc.ppnAmount,
      pphAmount: calc.pphAmount,
      attachmentCount,
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    let entry;
    try { entry = await readAttachment(file, 'RECEIPT'); } catch { setError('Berkas tidak dapat dibaca.'); return; }
    setDoc((prev) => {
      const next = [...(prev.attachments || []), entry];
      setAttachmentCount(Math.max(attachmentCount, next.length));
      return { ...prev, attachments: next };
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-body">
        {error && <div className="notice error-notice" role="alert">{error}</div>}

        <label htmlFor="rb-title">Judul Klaim Reimbursement <span>*</span></label>
        <input
          id="rb-title"
          value={doc.title}
          onChange={(e) => setDoc({ ...doc, title: e.target.value })}
          placeholder="Contoh: Penggantian BBM & Parkir Operasional Lapangan"
        />

        <div className="form-grid-3">
          <div>
            <label htmlFor="rb-branch">Cabang <span>*</span></label>
            <input
              id="rb-branch"
              list="branch-options"
              value={doc.branch}
              onChange={(e) => setDoc({ ...doc, branch: e.target.value })}
              placeholder="Contoh: Surabaya"
            />
          </div>
          <div>
            <label htmlFor="rb-category">Kategori Biaya <span>*</span></label>
            <select
              id="rb-category"
              value={doc.expenseCategory}
              onChange={(e) => setDoc({ ...doc, expenseCategory: e.target.value })}
            >
              <option value="OPERASIONAL">Operasional Kantor</option>
              <option value="TRANSPORTASI">Transportasi / BBM</option>
              <option value="KONSUMSI">Konsumsi Tamu / Lembur</option>
              <option value="MEDIS">Pengobatan & Kesehatan</option>
              <option value="LAINNYA">Lain-lain</option>
            </select>
          </div>
          <div>
            <label htmlFor="rb-date">Tanggal Transaksi <span>*</span></label>
            <input
              id="rb-date"
              type="date"
              value={doc.transactionDate}
              onChange={(e) => setDoc({ ...doc, transactionDate: e.target.value })}
            />
          </div>
        </div>

        <div className="form-grid-3">
          <div>
            <label htmlFor="rb-subtotal">Subtotal Kuitansi <span>*</span></label>
            <input
              id="rb-subtotal"
              inputMode="numeric"
              value={subtotalStr}
              onChange={(e) => setSubtotalStr(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="rb-other">Biaya Tambahan (+)</label>
            <input
              id="rb-other"
              inputMode="numeric"
              value={otherCostsStr}
              onChange={(e) => setOtherCostsStr(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="rb-discount">Potongan / Diskon (-)</label>
            <input
              id="rb-discount"
              inputMode="numeric"
              value={discountStr}
              onChange={(e) => setDiscountStr(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="form-summary-box">
          <div className="form-summary-total">
            <span>TOTAL KLAIM REIMBURSEMENT:</span>
            <span>{rupiah.format(total)}</span>
          </div>
        </div>

        <TaxFields prefix="rb" values={doc} onChange={(values) => setDoc({ ...doc, ...values })} />
        <p className="help">PPN Rp {calc.ppnAmount.toLocaleString('id-ID')} · PPh Rp {calc.pphAmount.toLocaleString('id-ID')} · Perkiraan total Rp {calc.totalAmount.toLocaleString('id-ID')}</p>
        <div className="form-grid-2">
          <div><label htmlFor="rb-budget">Tipe anggaran</label><select id="rb-budget" value={doc.budgetType ?? 'OPEX'} onChange={(e) => setDoc({ ...doc, budgetType: e.target.value })}><option value="OPEX">OPEX</option><option value="CAPEX">CAPEX</option><option value="PROJECT">Project</option></select></div>
          <div><label htmlFor="rb-due">Tanggal jatuh tempo</label><input id="rb-due" type="date" value={doc.paymentDueDate ?? ''} onChange={(e) => setDoc({ ...doc, paymentDueDate: e.target.value })} /></div>
          <div><label htmlFor="rb-vendor">Nama toko / vendor</label><input id="rb-vendor" value={doc.vendorName ?? ''} onChange={(e) => setDoc({ ...doc, vendorName: e.target.value })} /></div>
        </div>
        <label htmlFor="rb-approver">Email Atasan Langsung <span>*</span></label>
        <input id="rb-approver" type="email" value={doc.stage1ApproverEmail ?? ''} onChange={(e) => setDoc({ ...doc, stage1ApproverEmail: e.target.value })} placeholder="atasan@blc.co.id" />
        <label htmlFor="rb-purpose">Keterangan Aktivitas</label>
        <textarea
          id="rb-purpose"
          rows={2}
          value={doc.purpose}
          onChange={(e) => setDoc({ ...doc, purpose: e.target.value })}
          placeholder="Jelaskan keperluan pengeluaran..."
        />

        <label htmlFor="rb-payment-method">Metode pembayaran</label>
        <select id="rb-payment-method" value={doc.paymentMethod ?? 'BANK_TRANSFER'} onChange={(e) => setDoc({ ...doc, paymentMethod: e.target.value as 'BANK_TRANSFER' | 'CASH' })}><option value="BANK_TRANSFER">Transfer bank</option><option value="CASH">Tunai</option></select>
        {(doc.paymentMethod ?? 'BANK_TRANSFER') === 'BANK_TRANSFER' && <div className="form-summary-box">
          <strong>Rekening Karyawan (Penerima Transfer Reimburse)</strong>
          <div className="form-grid-3" style={{ marginTop: '10px' }}>
            <div>
              <label htmlFor="rb-bank-name">Nama Bank <span>*</span></label>
              <input
                id="rb-bank-name"
                value={doc.beneficiaryBank.bankName}
                onChange={(e) =>
                  setDoc({
                    ...doc,
                    beneficiaryBank: { ...doc.beneficiaryBank, bankName: e.target.value },
                  })
                }
                placeholder="BCA / Mandiri / CIMB"
              />
            </div>
            <div>
              <label htmlFor="rb-bank-acc">Nomor Rekening <span>*</span></label>
              <input
                id="rb-bank-acc"
                value={doc.beneficiaryBank.accountNumber}
                onChange={(e) =>
                  setDoc({
                    ...doc,
                    beneficiaryBank: { ...doc.beneficiaryBank, accountNumber: e.target.value },
                  })
                }
                placeholder="0281928123"
              />
            </div>
            <div>
              <label htmlFor="rb-bank-holder">Nama Pemilik Rekening <span>*</span></label>
              <input
                id="rb-bank-holder"
                value={doc.beneficiaryBank.accountHolder}
                onChange={(e) =>
                  setDoc({
                    ...doc,
                    beneficiaryBank: { ...doc.beneficiaryBank, accountHolder: e.target.value },
                  })
                }
                placeholder="Sesuai buku tabungan"
              />
            </div>
          </div>
        </div>}

        <div className="form-grid-2">
          <div>
            <label htmlFor="rb-attachment">Jumlah Bukti Kuitansi / Struk (Lembar) <span>*</span></label>
            <input
              id="rb-attachment"
              type="number"
              min={1}
              value={attachmentCount}
              onChange={(e) => setAttachmentCount(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div>
            <p className="demo-attachment-note">Lampiran disimpan di server lokal saat draf disimpan.</p>
            <label htmlFor="rb-attachment-file">Unggah Bukti Kuitansi / Struk</label>
            <input
              id="rb-attachment-file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
            />
            {doc.attachments && doc.attachments.length > 0 && (
              <div className="help" style={{ marginTop: '6px' }}>
                Terlampir: {doc.attachments.map((a) => `${a.name} (${Math.ceil(a.size / 1024)} KB)`).join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="secondary" onClick={onClose}>
          Batal
        </button>
        <button type="submit" className="primary">
          Simpan Draf RB <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
};

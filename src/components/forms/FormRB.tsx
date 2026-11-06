import React, { useState } from 'react';
import type { RBDocument } from '../../types/document';

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
  const total = Math.max(0, subtotal + otherCosts - discount);

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
    if (!bank.bankName.trim() || !bank.accountNumber.trim() || !bank.accountHolder.trim()) {
      setError('Rekening bank penerima penggantian biaya wajib diisi lengkap.');
      return;
    }

    onSave({
      ...doc,
      subtotal,
      otherCosts,
      discount,
      totalAmount: total,
      attachmentCount,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-body">
        <div className="form-intro">
          <span>RB</span>
          <div>
            <strong>Informasi Penggantian Biaya (Reimbursement)</strong>
            <p>Formulir klaim penggantian biaya operasional yang telah ditalangi karyawan.</p>
          </div>
        </div>

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

        <label htmlFor="rb-purpose">Keterangan Aktivitas</label>
        <textarea
          id="rb-purpose"
          rows={2}
          value={doc.purpose}
          onChange={(e) => setDoc({ ...doc, purpose: e.target.value })}
          placeholder="Jelaskan keperluan pengeluaran..."
        />

        <div className="form-summary-box">
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
        </div>

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
          <div className="form-callout form-callout-info" style={{ marginTop: '24px' }}>
            <strong>Aturan Bukti:</strong>
            <p>Bukti kuitansi wajib pindaian scan/foto berwarna jelas dan terbaca nominalnya.</p>
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

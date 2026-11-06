import React, { useState } from 'react';
import type { PVDocument, PVPaymentDetails } from '../../types/document';

export interface FormPVPaymentProps {
  pv: PVDocument;
  onRecordPayment: (pvId: string, details: PVPaymentDetails) => void;
  onClose: () => void;
}

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export const FormPVPayment: React.FC<FormPVPaymentProps> = ({
  pv,
  onRecordPayment,
  onClose,
}) => {
  const [paidAt, setPaidAt] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [sourceBank, setSourceBank] = useState<string>('BCA Operasional Pusat');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!paidAt) {
      setError('Tanggal pencairan / pembayaran wajib diisi.');
      return;
    }
    if (!sourceBank.trim()) {
      setError('Bank sumber pembayaran perusahaan wajib diisi.');
      return;
    }
    if (!referenceNumber.trim()) {
      setError('Nomor referensi / bukti transaksi transfer bank wajib diisi.');
      return;
    }

    onRecordPayment(pv.id, {
      paidAt,
      sourceBank,
      referenceNumber,
      proofUrl: proofUrl || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-body">
        <div className="form-intro">
          <span>PV</span>
          <div>
            <strong>Pencatatan Pembayaran (Payment Voucher)</strong>
            <p>Konfirmasi eksekusi transfer dana dari rekening perusahaan kepada pihak penerima.</p>
          </div>
        </div>

        {error && <div className="notice error-notice" role="alert">{error}</div>}

        <div className="form-summary-box">
          <div className="form-summary-row">
            <span>Nomor Voucher:</span>
            <strong>{pv.docNumber}</strong>
          </div>
          <div className="form-summary-row">
            <span>Rujukan Dokumen Induk:</span>
            <span>{pv.sourceDocNumber}</span>
          </div>
          <div className="form-summary-row">
            <span>Pihak Penerima (Payee):</span>
            <strong>{pv.vendorOrPayeeName}</strong>
          </div>
          <div className="form-summary-row">
            <span>Rekening Tujuan:</span>
            <span>
              {pv.beneficiaryBank.bankName} - {pv.beneficiaryBank.accountNumber} (a/n{' '}
              {pv.beneficiaryBank.accountHolder})
            </span>
          </div>
          <div className="form-summary-row">
            <span>Jumlah Bruto:</span>
            <span>{rupiah.format(pv.grossAmount)}</span>
          </div>
          <div className="form-summary-row">
            <span>Potongan Pajak (PPh):</span>
            <span>- {rupiah.format(pv.pphDeduction)}</span>
          </div>
          <div className="form-summary-total">
            <span>NILAI YANG DITRANSFER (NET):</span>
            <span>{rupiah.format(pv.netAmountToPay)}</span>
          </div>
        </div>

        <div className="form-grid-2">
          <div>
            <label htmlFor="pv-paid-date">Tanggal Eksekusi Transfer <span>*</span></label>
            <input
              id="pv-paid-date"
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="pv-source-bank">Rekening Sumber Perusahaan <span>*</span></label>
            <input
              id="pv-source-bank"
              value={sourceBank}
              onChange={(e) => setSourceBank(e.target.value)}
              placeholder="Contoh: BCA Rek. 0019283749"
            />
          </div>
        </div>

        <label htmlFor="pv-ref-num">Nomor Referensi Transaksi Bank <span>*</span></label>
        <input
          id="pv-ref-num"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          placeholder="Contoh: TRF-BLC-20261107-88219"
        />

        <label htmlFor="pv-proof-url">Tautan / Nama Berkas Bukti Transfer</label>
        <input
          id="pv-proof-url"
          value={proofUrl}
          onChange={(e) => setProofUrl(e.target.value)}
          placeholder="Contoh: https://storage.blc.internal/proofs/20261107-88219.pdf"
        />
      </div>

      <div className="form-actions">
        <button type="button" className="secondary" onClick={onClose}>
          Batal
        </button>
        <button type="submit" className="primary">
          Konfirmasi Pelunasan (Mark as Paid) <span aria-hidden="true">✔</span>
        </button>
      </div>
    </form>
  );
};

import React, { useState } from 'react';
import type { AnyDocument, GRDocument, PODocument } from '../../types/document';
import { formatCurrencyInput, parseCurrencyInput } from '../../lib/currency-format';

export interface PvGenerationPayload {
  paymentDueDate?: string;
  plannedSourceAccount?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  purpose?: string;
  grossAmount?: number;
  pphDeduction?: number;
}

export interface FormPVProps {
  sourceDoc: AnyDocument;
  linkedGrs: GRDocument[];
  alreadyCommittedOnPo: number;
  onGenerate: (sourceDocId: string, options: PvGenerationPayload) => void;
  onClose: () => void;
}

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export const FormPV: React.FC<FormPVProps> = ({
  sourceDoc,
  linkedGrs,
  alreadyCommittedOnPo,
  onGenerate,
  onClose,
}) => {
  const isPo = sourceDoc.docType === 'PO';
  const poDoc = isPo ? (sourceDoc as PODocument) : undefined;
  const fullGross = poDoc
    ? poDoc.subtotal + poDoc.otherCosts - poDoc.discount + poDoc.ppnAmount
    : sourceDoc.docType === 'AV'
    ? sourceDoc.amount + (sourceDoc.pphAmount ?? 0)
    : sourceDoc.docType === 'RB'
    ? sourceDoc.totalAmount + (sourceDoc.pphAmount ?? 0)
    : sourceDoc.docType === 'RC'
    ? Math.abs(sourceDoc.balanceAmount)
    : 0;

  const fullPph = poDoc
    ? poDoc.pphAmount
    : sourceDoc.docType === 'AV'
    ? sourceDoc.pphAmount ?? 0
    : sourceDoc.docType === 'RB'
    ? sourceDoc.pphAmount ?? 0
    : 0;

  const fullNet = Math.max(0, fullGross - fullPph);
  const remainingNetOnPo = isPo ? Math.max(0, fullNet - alreadyCommittedOnPo) : fullNet;
  const defaultGross = isPo && alreadyCommittedOnPo > 0 ? remainingNetOnPo : fullGross;
  const defaultPph = isPo && alreadyCommittedOnPo > 0 ? 0 : fullPph;

  const defaultDue =
    (sourceDoc.docType === 'AV' || sourceDoc.docType === 'RB'
      ? sourceDoc.paymentDueDate
      : undefined) || new Date().toISOString().slice(0, 10);

  const [paymentDueDate, setPaymentDueDate] = useState<string>(defaultDue);
  const [plannedSourceAccount, setPlannedSourceAccount] = useState<string>('BCA Operasional Pusat');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [grossStr, setGrossStr] = useState<string>(formatCurrencyInput(defaultGross));
  const [pphStr, setPphStr] = useState<string>(formatCurrencyInput(defaultPph));
  const [purpose, setPurpose] = useState<string>(sourceDoc.purpose || '');
  const [error, setError] = useState<string>('');

  const grossAmount = parseCurrencyInput(grossStr);
  const pphDeduction = parseCurrencyInput(pphStr);
  const netAmountToPay = Math.max(0, grossAmount - pphDeduction);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentDueDate) {
      setError('Tanggal rencana bayar / jatuh tempo wajib diisi.');
      return;
    }
    if (!plannedSourceAccount.trim()) {
      setError('Rekening sumber pembayaran perusahaan wajib diisi.');
      return;
    }
    if (netAmountToPay <= 0) {
      setError('Nilai bersih dibayarkan (Net PV) harus lebih besar dari Rp 0.');
      return;
    }
    if (isPo && netAmountToPay > remainingNetOnPo) {
      setError(
        `Nilai bersih PV (${rupiah.format(netAmountToPay)}) melebihi sisa plafon PO yang belum dibayar (${rupiah.format(remainingNetOnPo)}).`
      );
      return;
    }

    onGenerate(sourceDoc.id, {
      paymentDueDate,
      plannedSourceAccount: plannedSourceAccount.trim(),
      invoiceNumber: invoiceNumber.trim() || undefined,
      invoiceDate: invoiceDate || undefined,
      purpose: purpose.trim() || undefined,
      ...(isPo ? { grossAmount, pphDeduction } : {}),
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-body">
        {error && <div className="notice error-notice" role="alert">{error}</div>}

        <div className="form-callout form-callout-info" role="note">
          <strong>Alur Persetujuan Payment Voucher (PV)</strong>
          <p>
            PV yang diterbitkan oleh Finance akan masuk ke alur persetujuan <strong>Ayu Martina → Hery Sugiarto &amp; Koji Hashimoto</strong> sebelum dapat dicatat lunas (Paid).
          </p>
        </div>

        <div className="form-summary-box">
          <div className="form-summary-row">
            <span>Dokumen Sumber:</span>
            <strong>{sourceDoc.docNumber} ({sourceDoc.docType}) — {sourceDoc.title}</strong>
          </div>
          <div className="form-summary-row">
            <span>Cabang:</span>
            <span>{sourceDoc.branch}</span>
          </div>
          {isPo && (
            <>
              <div className="form-summary-row">
                <span>Total Plafon Bersih PO:</span>
                <span>{rupiah.format(fullNet)}</span>
              </div>
              <div className="form-summary-row">
                <span>Sudah Terikat AV / PV Sebelumnya:</span>
                <span>{rupiah.format(alreadyCommittedOnPo)}</span>
              </div>
              <div className="form-summary-row">
                <span>Sisa Plafon PO Dapat Dibayar:</span>
                <strong>{rupiah.format(remainingNetOnPo)}</strong>
              </div>
            </>
          )}
          <div className="form-summary-total">
            <span>DIBAYARKAN (TOTAL - PPH):</span>
            <span>{rupiah.format(netAmountToPay)}</span>
          </div>
        </div>

        {isPo && (
          <div className="form-summary-box" style={{ marginTop: '10px' }}>
            <strong>Status Laporan Penerimaan Barang/Jasa (GR) Terkait PO:</strong>
            {linkedGrs.length === 0 ? (
              <p className="help" style={{ marginTop: '4px' }}>
                Belum ada Laporan Penerimaan (GR) yang tercatat untuk PO ini. Pastikan kelengkapan penerimaan bila pembayaran bersifat pelunasan akhir.
              </p>
            ) : (
              <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                {linkedGrs.map((gr) => (
                  <li key={gr.id}>
                    <strong>{gr.docNumber}</strong> ({gr.receiptType === 'SERVICE' ? 'Jasa/BAST' : 'Barang/Foto'}) — Kondisi: <strong>{gr.itemCondition}</strong> ({gr.receivedDate})
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="form-grid-2">
          <div>
            <label htmlFor="pv-due-date">Tanggal Jatuh Tempo / Rencana Bayar <span>*</span></label>
            <input
              id="pv-due-date"
              type="date"
              value={paymentDueDate}
              onChange={(e) => setPaymentDueDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="pv-planned-bank">Rekening Sumber Pembayaran <span>*</span></label>
            <input
              id="pv-planned-bank"
              value={plannedSourceAccount}
              onChange={(e) => setPlannedSourceAccount(e.target.value)}
              placeholder="Contoh: BCA Operasional Pusat"
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div>
            <label htmlFor="pv-inv-no">Nomor Invoice Vendor (Jika Ada)</label>
            <input
              id="pv-inv-no"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Contoh: INV/2026/11/0092"
            />
          </div>
          <div>
            <label htmlFor="pv-inv-date">Tanggal Invoice</label>
            <input
              id="pv-inv-date"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
        </div>

        {isPo && (
          <div className="form-grid-2">
            <div>
              <label htmlFor="pv-gross">Nominal Bruto PV (Termasuk PPN) <span>*</span></label>
              <div className="money">
                <span>Rp</span>
                <input
                  id="pv-gross"
                  inputMode="numeric"
                  value={grossStr}
                  onChange={(e) => setGrossStr(formatCurrencyInput(e.target.value))}
                />
              </div>
              <p className="help">Mendukung pembayaran penuh maupun bertahap (termin/DP) selama ≤ sisa plafon PO.</p>
            </div>
            <div>
              <label htmlFor="pv-pph">Potongan PPh pada PV Ini</label>
              <div className="money">
                <span>Rp</span>
                <input
                  id="pv-pph"
                  inputMode="numeric"
                  value={pphStr}
                  onChange={(e) => setPphStr(formatCurrencyInput(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        <label htmlFor="pv-purpose">Tujuan / Keterangan Pembayaran</label>
        <textarea
          id="pv-purpose"
          rows={2}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Rincian termin atau keterangan pembayaran..."
        />
      </div>

      <div className="form-actions">
        <button type="button" className="secondary" onClick={onClose}>
          Batal
        </button>
        <button type="submit" className="primary">
          Ajukan PV <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
};

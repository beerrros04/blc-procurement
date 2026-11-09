import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, X } from 'lucide-react';
import type { AnyDocument } from '../types/document';

export interface ExportModalProps {
  documents: AnyDocument[];
  onClose: () => void;
}

function extractFinanceExportFields(d: AnyDocument) {
  let subtotal = 0;
  let ppn = 0;
  let pph = 0;
  let dibayarkan = 0;
  let bankName = '';
  let accountNumber = '';
  let accountHolder = '';
  let dueDate = '';

  if (d.docType === 'PR') {
    subtotal = d.subtotalAmount;
    ppn = d.ppnAmount ?? 0;
    pph = d.pphAmount ?? 0;
    dibayarkan = d.totalAmount ?? d.subtotalAmount;
    dueDate = d.requiredDate || '';
  } else if (d.docType === 'PO') {
    subtotal = d.subtotal + d.otherCosts - d.discount;
    ppn = d.ppnAmount;
    pph = d.pphAmount;
    dibayarkan = d.totalAmount;
    bankName = d.bankDetails?.bankName || '';
    accountNumber = d.bankDetails?.accountNumber || '';
    accountHolder = d.bankDetails?.accountHolder || '';
  } else if (d.docType === 'AV') {
    subtotal = d.subtotal ?? d.amount;
    ppn = d.ppnAmount ?? 0;
    pph = d.pphAmount ?? 0;
    dibayarkan = d.amount;
    bankName = d.bankDetails?.bankName || '';
    accountNumber = d.bankDetails?.accountNumber || '';
    accountHolder = d.bankDetails?.accountHolder || '';
    dueDate = d.paymentDueDate || '';
  } else if (d.docType === 'RB') {
    subtotal = d.subtotal + d.otherCosts - d.discount;
    ppn = d.ppnAmount ?? 0;
    pph = d.pphAmount ?? 0;
    dibayarkan = d.totalAmount;
    bankName = d.beneficiaryBank?.bankName || '';
    accountNumber = d.beneficiaryBank?.accountNumber || '';
    accountHolder = d.beneficiaryBank?.accountHolder || '';
    dueDate = d.paymentDueDate || '';
  } else if (d.docType === 'RC') {
    subtotal = d.realizedAmount;
    dibayarkan = d.realizedAmount;
    bankName = d.reimbursementBank?.bankName || '';
    accountNumber = d.reimbursementBank?.accountNumber || '';
    accountHolder = d.reimbursementBank?.accountHolder || '';
    dueDate = d.submissionDeadline || '';
  } else if (d.docType === 'PV') {
    subtotal = d.grossAmount;
    pph = d.pphDeduction;
    dibayarkan = d.netAmountToPay;
    bankName = d.beneficiaryBank?.bankName || '';
    accountNumber = d.beneficiaryBank?.accountNumber || '';
    accountHolder = d.beneficiaryBank?.accountHolder || '';
    dueDate = d.paymentDueDate || '';
  } else if (d.docType === 'GR') {
    dueDate = d.receivedDate || '';
  }

  return { subtotal, ppn, pph, dibayarkan, bankName, accountNumber, accountHolder, dueDate };
}

export const ExportModal: React.FC<ExportModalProps> = ({ documents, onClose }) => {
  const [format, setFormat] = useState<'PDF' | 'CSV'>('CSV');

  function handleDownload() {
    const list = documents;
    if (format === 'CSV') {
      const headers = [
        'Nomor',
        'Jenis',
        'Cabang',
        'Judul',
        'Tujuan',
        'Subtotal',
        'PPN',
        'PPh',
        'Dibayarkan',
        'Bank',
        'No. rekening',
        'Nama rekening',
        'Jatuh tempo',
      ];
      const rows = list.map((d) => {
        const fin = extractFinanceExportFields(d);
        return [
          `"${d.docNumber}"`,
          `"${d.docType}"`,
          `"${d.branch}"`,
          `"${d.title.replace(/"/g, '""')}"`,
          `"${(d.purpose || '').replace(/"/g, '""')}"`,
          String(fin.subtotal),
          String(fin.ppn),
          String(fin.pph),
          String(fin.dibayarkan),
          `"${fin.bankName.replace(/"/g, '""')}"`,
          `"${fin.accountNumber.replace(/"/g, '""')}"`,
          `"${fin.accountHolder.replace(/"/g, '""')}"`,
          `"${fin.dueDate}"`,
        ];
      });

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `BLC_Procurement_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.print();
    }
    onClose();
  }

  return (
    <dialog
      className="modal"
      open
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <section className="drawer" style={{ width: 'min(440px, 95vw)', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text-primary)' }}>
            Ekspor Laporan ({documents.length})
          </h2>
          <button
            type="button"
            className="close"
            onClick={onClose}
            aria-label="Tutup dialog"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: `1.5px solid ${format === 'PDF' ? 'var(--accent-ruby)' : 'var(--border-subtle)'}`,
              background: format === 'PDF' ? 'var(--accent-ruby-subtle)' : 'var(--surface-elevated)',
              cursor: 'pointer',
              margin: 0,
            }}
          >
            <input
              type="radio"
              name="export-format"
              value="PDF"
              checked={format === 'PDF'}
              onChange={() => setFormat('PDF')}
              style={{ width: 'auto', accentColor: 'var(--accent-ruby)' }}
            />
            <FileText size={18} color={format === 'PDF' ? 'var(--accent-ruby)' : 'var(--text-secondary)'} />
            <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
              Cetak / simpan sebagai PDF melalui browser
            </strong>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: `1.5px solid ${format === 'CSV' ? 'var(--accent-ruby)' : 'var(--border-subtle)'}`,
              background: format === 'CSV' ? 'var(--accent-ruby-subtle)' : 'var(--surface-elevated)',
              cursor: 'pointer',
              margin: 0,
            }}
          >
            <input
              type="radio"
              name="export-format"
              value="CSV"
              checked={format === 'CSV'}
              onChange={() => setFormat('CSV')}
              style={{ width: 'auto', accentColor: 'var(--accent-ruby)' }}
            />
            <FileSpreadsheet size={18} color={format === 'CSV' ? 'var(--accent-ruby)' : 'var(--text-secondary)'} />
            <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
              Comma-Separated Values (.csv)
            </strong>
          </label>

        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="secondary"
            onClick={onClose}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Batal
          </button>
          <button
            type="button"
            className="primary"
            onClick={handleDownload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              fontSize: '13px',
              background: 'var(--accent-ruby)',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download size={15} />
            {format === 'CSV' ? 'Unduh CSV' : 'Buka dialog cetak'}
          </button>
        </div>
      </section>
    </dialog>
  );
};

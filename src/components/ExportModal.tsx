import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { modalMotionVariants } from '../lib/motion';
import type { AnyDocument } from '../types/document';

export interface ExportModalProps {
  documents: AnyDocument[];
  onClose: () => void;
}

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

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
  const [format, setFormat] = useState<'CSV' | 'PDF'>('CSV');

  const totalEstimatedValue = documents.reduce((acc, d) => {
    const fin = extractFinanceExportFields(d);
    return acc + (fin.dibayarkan || 0);
  }, 0);

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

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
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
      style={{
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
      }}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalMotionVariants}
        className="max-w-[480px] w-full"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E4E2DD',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          margin: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary, #191C1A)' }}>
              Export Laporan
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted, #5A6A85)' }}>
              Pilih format berkas untuk mengekspor dokumen pengadaan Caready.
            </p>
          </div>
          <button
            type="button"
            className="close"
            onClick={onClose}
            aria-label="Tutup dialog"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #5A6A85)',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Radio Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Card 1: Excel Spreadsheet / CSV */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '14px 16px',
              borderRadius: '10px',
              border: format === 'CSV' ? '1.5px solid #059669' : '1px solid #E4E2DD',
              background: format === 'CSV' ? '#ECFDF5' : '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <input
              type="radio"
              name="export-format"
              value="CSV"
              checked={format === 'CSV'}
              onChange={() => setFormat('CSV')}
              style={{ marginTop: '3px', accentColor: '#059669' }}
            />
            <div
              style={{
                padding: '6px',
                borderRadius: '8px',
                background: format === 'CSV' ? '#D1FAE5' : '#F4F3EF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileSpreadsheet size={20} color="#059669" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
              <strong style={{ fontSize: '13.5px', color: '#191C1A', fontWeight: 600 }}>
                Excel Spreadsheet / CSV (.csv)
              </strong>
              <span style={{ fontSize: '12px', color: '#5A6A85', lineHeight: 1.4 }}>
                Format tabel komprehensif 13 kolom dengan UTF-8 BOM untuk analisis spreadsheet dan Microsoft Excel.
              </span>
            </div>
          </label>

          {/* Card 2: PDF Document */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '14px 16px',
              borderRadius: '10px',
              border: format === 'PDF' ? '1.5px solid #DC2626' : '1px solid #E4E2DD',
              background: format === 'PDF' ? '#FEF2F2' : '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <input
              type="radio"
              name="export-format"
              value="PDF"
              checked={format === 'PDF'}
              onChange={() => setFormat('PDF')}
              style={{ marginTop: '3px', accentColor: '#DC2626' }}
            />
            <div
              style={{
                padding: '6px',
                borderRadius: '8px',
                background: format === 'PDF' ? '#FEE2E2' : '#F4F3EF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={20} color="#DC2626" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
              <strong style={{ fontSize: '13.5px', color: '#191C1A', fontWeight: 600 }}>
                PDF Document (.pdf)
              </strong>
              <span style={{ fontSize: '12px', color: '#5A6A85', lineHeight: 1.4 }}>
                Format dokumen cetak resmi siap arsip dengan tata letak dokumen standar Caready.
              </span>
            </div>
          </label>
        </div>

        {/* Scope Summary Box */}
        <div
          className="export-scope-card"
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            background: '#F8F7F4',
            border: '1px solid #E4E2DD',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#5A6A85',
            }}
          >
            Cakupan Ekspor
          </div>
          <div style={{ fontSize: '13px', color: '#191C1A', fontWeight: 500 }}>
            <span style={{ fontWeight: 600 }}>{documents.length} dokumen</span>
            {totalEstimatedValue > 0 && (
              <>
                {' • '}
                <span>Total: {rupiah.format(totalEstimatedValue)}</span>
              </>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#5A6A85' }}>
            {documents.length} dokumen • Filter: Semua Status • Estimasi: ~240 KB
          </div>
        </div>

        {/* Actions Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn-ghost secondary"
            onClick={onClose}
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer' }}
          >
            Batal
          </button>
          <button
            type="button"
            className="btn-primary primary"
            onClick={handleDownload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              fontSize: '13px',
              borderRadius: '6px',
              background: 'var(--color-primary, #DC2626)',
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download size={15} />
            Export File
          </button>
        </div>
      </motion.div>
    </dialog>
  );
};

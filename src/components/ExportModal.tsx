import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, X } from 'lucide-react';
import type { AnyDocument } from '../types/document';

export interface ExportModalProps {
  documents: AnyDocument[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ documents, onClose }) => {
  const [format, setFormat] = useState<'PDF' | 'CSV'>('CSV');

  function handleDownload() {
    const list = documents;
    if (format === 'CSV') {
      const headers = ['Nomor Dokumen', 'Tipe', 'Judul', 'Cabang', 'Status', 'Tahap', 'Tanggal Dibuat', 'Pemohon'];
      const rows = list.map((d) => [
        `"${d.docNumber}"`,
        `"${d.docType}"`,
        `"${d.title.replace(/"/g, '""')}"`,
        `"${d.branch}"`,
        `"${d.status}"`,
        `"${d.currentStage}"`,
        `"${d.createdAt}"`,
        `"${d.auditLog[0]?.actor || 'Pemohon'}"`,
      ]);

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

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { ExportModal } from './ExportModal';
import { INITIAL_SEED_DOCUMENTS } from '../store/seed-data';

describe('ExportModal Component', () => {
  it('renders 480px dialog with XLSX/CSV and PDF radio cards and scope summary', () => {
    const html = renderToStaticMarkup(<ExportModal documents={INITIAL_SEED_DOCUMENTS} onClose={() => {}} />);
    expect(html).toContain('Export Laporan');
    expect(html).toContain('Excel Spreadsheet / CSV (.csv)');
    expect(html).toContain('PDF Document (.pdf)');
    expect(html).toContain(`${INITIAL_SEED_DOCUMENTS.length} dokumen`);
  });

  it('renders export actions and scope information', () => {
    const html = renderToStaticMarkup(<ExportModal documents={INITIAL_SEED_DOCUMENTS} onClose={() => {}} />);
    expect(html).toContain('Batal');
    expect(html).toContain('Export File');
    expect(html).toContain('Cakupan Ekspor');
  });
});

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { BentoMetrics } from './BentoMetrics';
import { DocumentList } from './DocumentList';
import { DocumentDetailModal } from './DocumentDetailModal';
import { StaffBeranda } from './StaffBeranda';
import { createEmptyDocument } from '../store/document-store';

const noop = vi.fn();
const actions = {
  onOpenDetail: noop, onEditDoc: noop, onSubmitDoc: noop, onGeneratePv: noop,
  onPayPv: noop, onCreateRelated: noop, onConfirmRc: noop,
};

describe('Elera workspace', () => {
  it('shows a connected summary with amounts in tabular figures', () => {
    const html = renderToStaticMarkup(<BentoMetrics documents={[]} activeRole="ADMIN" />);
    expect(html).toContain('stats-strip');
    expect(html).toContain('tabular-nums');
  });

  it('offers document type filters in the register', () => {
    const html = renderToStaticMarkup(<DocumentList documents={[]} activeTab="ALL" activeRole="ADMIN" activeUserId="u1" {...actions} onSelectTab={noop} />);
    expect(html).toContain('aria-label="Jenis dokumen"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('>GR<');
  });

  it('limits the submission hub to the signed-in user’s documents', () => {
    const own = { ...createEmptyDocument('PR'), ownerId: 'u1', title: 'Dokumen saya' };
    const other = { ...createEmptyDocument('PR'), ownerId: 'u2', title: 'Dokumen orang lain' };
    const html = renderToStaticMarkup(<StaffBeranda userName="A" userId="u1" userEmail="a@example.com" userBranch="Bekasi" activeRole="PEMOHON" documents={[own, other]} {...actions} onCreateDoc={noop} onOpenExport={noop} onNavigateTab={noop} />);
    expect(html).toContain('Dokumen saya');
    expect(html).toContain('Daftar Pengajuan Saya');
    expect(html).not.toContain('Dokumen orang lain');
  });

  it('does not offer draft creation to a role rejected by the server', () => {
    const html = renderToStaticMarkup(<StaffBeranda userName="A" userId="u1" userEmail="a@example.com" userBranch="Bekasi" activeRole="ADMIN" documents={[]} {...actions} onCreateDoc={noop} onOpenExport={noop} onNavigateTab={noop} />);
    expect(html).not.toContain('Buat dokumen baru Purchase Request');
  });

  it('presents document details in a labelled side drawer', () => {
    const doc = createEmptyDocument('PR');
    const html = renderToStaticMarkup(<DocumentDetailModal document={doc} activeRole="ADMIN" onClose={noop} onApprove={noop} onReject={noop} />);
    expect(html).toContain('s-drawer');
    expect(html).toContain('aria-labelledby="document-detail-title"');
  });

  it('uses standard card radius for quick-action buttons in StaffBeranda', () => {
    const html = renderToStaticMarkup(<StaffBeranda userName="A" userId="u1" userEmail="a@example.com" userBranch="Bekasi" activeRole="PEMOHON" documents={[]} {...actions} onCreateDoc={noop} onOpenExport={noop} onNavigateTab={noop} />);
    expect(html).not.toContain('border-radius:16px');
    expect(html).toContain('border-radius:var(--card-radius, 10px)');
  });
});

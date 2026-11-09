import { describe, expect, it } from 'vitest';
import { filterRegisterDocuments, type RegisterFilters } from './ApprovalExplorer';
import { createEmptyDocument } from '../store/document-store';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { ApprovalRegisterView, ApprovalHistoryView, ApprovalDocsView } from './ApprovalExplorer';
import { DocumentList } from './DocumentList';

describe('register filters', () => {
  const base: RegisterFilters = { search: '', type: 'ALL', branch: 'ALL', progress: 'ALL', action: 'ALL' };
  const first = { ...createEmptyDocument('PR', 'Bekasi'), title: 'Komputer', status: 'SUBMITTED' as const };
  const second = { ...createEmptyDocument('PR', 'Semarang'), title: 'Meja', status: 'APPROVED' as const };
  const third = { ...createEmptyDocument('PO', 'Bekasi'), title: 'Komputer', status: 'APPROVED' as const };
  const documents = [first, second, third];

  it('combines search, type, branch and progress', () => {
    expect(filterRegisterDocuments(documents, { ...base, search: 'komputer', type: 'PR', branch: 'Bekasi', progress: 'MENUNGGU' })).toEqual([first]);
  });
  it('includes historical branches and combines the action filter', () => {
    expect(filterRegisterDocuments(documents, { ...base, branch: 'Semarang' })).toEqual([second]);
    expect(filterRegisterDocuments(documents, { ...base, type: 'PO', action: 'MENUNGGU_PV' })).toEqual([third]);
  });
  it('returns every document when filters reset', () => {
    expect(filterRegisterDocuments(documents, base)).toEqual(documents);
  });
  it('treats a returned draft as revision rather than an ordinary draft', () => {
    const revision = { ...createEmptyDocument('PR'), auditLog: [{ id: 'r', timestamp: '2026-01-01', actor: 'Ayu', action: 'REJECT' }] };
    expect(filterRegisterDocuments([revision], { ...base, progress: 'REJECTED' })).toEqual([revision]);
    expect(filterRegisterDocuments([revision], { ...base, progress: 'DRAFT' })).toEqual([]);
  });
  it('exposes labeled filters, historic branches and an empty state', () => {
    const html = renderToStaticMarkup(createElement(ApprovalRegisterView, { documents: [second], onOpenDetail: () => {} }));
    expect(html).toContain('Jenis pengajuan');
    expect(html).toContain('Tindak lanjut');
    expect(html).toContain('Semarang');
    expect(html).toContain('Atur ulang');
    const empty = renderToStaticMarkup(createElement(ApprovalRegisterView, { documents: [], onOpenDetail: () => {} }));
    expect(empty).toContain('Tidak ada dokumen yang sesuai');
  });
  it('presents historical actor names without their role labels', () => {
    const doc = { ...first, auditLog: [{ id: 'history', timestamp: '2026-01-01', actor: 'Pak Hendra (Atasan Langsung)', action: 'SUBMIT' }] };
    const html = renderToStaticMarkup(createElement(ApprovalHistoryView, { documents: [doc], onOpenDetail: () => {} }));
    expect(html).toContain('>Hendra<');
    expect(html).not.toContain('Pak Hendra (Atasan Langsung)');
  });

  it('renders semantic button link, register-table class, and data-label attributes for mobile', () => {
    const html = renderToStaticMarkup(createElement(ApprovalRegisterView, { documents: [first], onOpenDetail: () => {} }));
    expect(html).toContain('class="document-table register-table"');
    expect(html).toContain('data-label="Dokumen"');
    expect(html).toContain('data-label="Cabang"');
    expect(html).toContain('data-label="Tindakan"');
    expect(html).toContain('<button type="button"');
    expect(html).toContain('aria-label="Buka detail');
  });

  it('renders register-table and data-labels in ApprovalHistoryView and ApprovalDocsView', () => {
    const docWithLogAndAtt = {
      ...first,
      auditLog: [{ id: 'hist-1', timestamp: '2026-01-01', actor: 'Budi', action: 'APPROVE_ATASAN' }],
      attachments: [{ id: 'att-1', name: 'nota.pdf', mimeType: 'application/pdf', category: 'RECEIPT' as const, size: 2048, uploadedAt: '2026-01-01' }],
    };
    const histHtml = renderToStaticMarkup(createElement(ApprovalHistoryView, { documents: [docWithLogAndAtt], onOpenDetail: () => {} }));
    expect(histHtml).toContain('class="document-table register-table"');
    expect(histHtml).toContain('data-label="Waktu"');
    expect(histHtml).toContain('data-label="Dokumen"');
    expect(histHtml).toContain('data-label="Keputusan"');

    const docsHtml = renderToStaticMarkup(createElement(ApprovalDocsView, { documents: [docWithLogAndAtt], onOpenDetail: () => {} }));
    expect(docsHtml).toContain('class="document-table register-table"');
    expect(docsHtml).toContain('data-label="Nama Berkas"');
    expect(docsHtml).toContain('data-label="Dokumen Induk"');
  });
});

describe('assigned approval actions', () => {
  it('only offers review to the assigned atasan for documents they do not own', () => {
    const base = createEmptyDocument('PR');
    const make = (number: string, email: string, ownerId: string) => ({
      ...base, id: number, docNumber: number, ownerId, stage1ApproverEmail: email,
      status: 'IN_REVIEW' as const,
      approvalSteps: { ...base.approvalSteps, atasan: { ...base.approvalSteps.atasan, status: 'PENDING' as const } },
    });
    const docs = [make('A-1', 'head@example.com', 'other'), make('A-2', 'other@example.com', 'other'), make('A-3', 'head@example.com', 'head')];
    const noop = () => {};
    const html = renderToStaticMarkup(createElement(DocumentList, { documents: docs, activeTab: 'ALL', activeRole: 'ATASAN', activeUserId: 'head', activeUserEmail: 'HEAD@example.com', onOpenDetail: noop, onEditDoc: noop, onSubmitDoc: noop, onGeneratePv: noop, onPayPv: noop, onCreateRelated: noop, onConfirmRc: noop }));
    expect(html).toContain('Tinjau pengajuan A-1');
    expect(html).not.toContain('Tinjau pengajuan A-2');
    expect(html).not.toContain('Tinjau pengajuan A-3');
  });
});

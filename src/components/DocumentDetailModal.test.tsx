import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createEmptyDocument } from '../store/document-store';
import { ApprovalStepper } from './ApprovalStepper';
import { DocumentDetailModal, runDecision } from './DocumentDetailModal';

describe('document review drawer', () => {
  it('shows individual names and decisions without repeating a summary strip', () => {
    const doc = createEmptyDocument('PR');
    doc.approvalSteps.atasan.assignedTo = 'Pak Hendra (Atasan Langsung)';
    doc.approvalSteps.bod.heryStatus = 'APPROVED';
    doc.approvalSteps.bod.hashimotoStatus = 'PENDING';
    const html = renderToStaticMarkup(<ApprovalStepper document={doc} />);
    expect(html).toContain('Hendra');
    expect(html).toContain('Ayu Martina');
    expect(html).toContain('Hery Sugiarto');
    expect(html).toContain('Koji Hashimoto');
    expect(html).not.toContain('Pak Hendra');
    expect(html).not.toContain('approval-progress');
    expect(html).toContain('Disetujui');
    expect(html).toContain('Menunggu Persetujuan');
  });

  it('does not portray the PV submitter as an Atasan approver or render GR approvals', () => {
    const pv = createEmptyDocument('PV');
    pv.approvalSteps.atasan.assignedTo = 'Finance Submitter';
    const pvHtml = renderToStaticMarkup(<ApprovalStepper document={pv} />);
    expect(pvHtml).not.toContain('Finance Submitter');
    expect(pvHtml).toContain('Ayu Martina');
    expect(renderToStaticMarkup(<ApprovalStepper document={createEmptyDocument('GR')} />)).toBe('');
  });

  it('does not offer decisions on GR documents even with stale approval data', () => {
    const gr = createEmptyDocument('GR');
    gr.status = 'IN_REVIEW';
    gr.approvalSteps.atasan.status = 'PENDING';
    const submit = vi.fn().mockResolvedValue(undefined);
    const html = renderToStaticMarkup(<DocumentDetailModal document={gr} activeRole="ATASAN" onClose={vi.fn()} onApprove={submit} onReject={submit} />);
    expect(html).not.toContain('Setujui Dokumen');
  });

  it('only offers an Atasan decision to the assigned non-owner with known identity', () => {
    const doc = createEmptyDocument('PR');
    doc.status = 'IN_REVIEW';
    doc.ownerId = 'pemohon';
    doc.stage1ApproverEmail = 'head@example.com';
    doc.approvalSteps.atasan.status = 'PENDING';
    const submit = vi.fn().mockResolvedValue(undefined);
    const render = (id?: string, email?: string) => renderToStaticMarkup(<DocumentDetailModal document={doc} activeRole="ATASAN" activeUserId={id} activeUserEmail={email} onClose={vi.fn()} onApprove={submit} onReject={submit} />);
    expect(render('head', 'HEAD@example.com')).toContain('Setujui Dokumen');
    expect(render('pemohon', 'head@example.com')).not.toContain('Setujui Dokumen');
    expect(render('other', 'other@example.com')).not.toContain('Setujui Dokumen');
    expect(render()).not.toContain('Setujui Dokumen');
  });

  it('closes only after the decision succeeds', async () => {
    const onClose = vi.fn();
    const failure = new Error('Permintaan gagal');
    await expect(runDecision(() => Promise.reject(failure), onClose)).rejects.toThrow('Permintaan gagal');
    expect(onClose).not.toHaveBeenCalled();
    await runDecision(() => Promise.resolve(), onClose);
    expect(onClose).toHaveBeenCalledOnce();
  });
});

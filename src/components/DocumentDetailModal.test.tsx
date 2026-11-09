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
    expect(html).toContain('Pak Hendra');
    expect(html).toContain('Ayu Martina');
    expect(html).toContain('Hery Sugiarto');
    expect(html).toContain('Koji Hashimoto');
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

  describe('ApprovalStepper status badge consistency', () => {
    it('renders all 4 step-badge status variants (approved, rejected, pending, waiting) across all reviewers', () => {
      const doc = createEmptyDocument('PO');
      doc.approvalSteps.atasan.assignedTo = 'Pak Hendra (Atasan Langsung)';
      doc.approvalSteps.atasan.status = 'APPROVED';
      doc.approvalSteps.ayu.status = 'REJECTED';
      doc.approvalSteps.bod.heryStatus = 'PENDING';
      doc.approvalSteps.bod.hashimotoStatus = 'WAITING';

      const html = renderToStaticMarkup(<ApprovalStepper document={doc} />);

      // Verify all 4 step-badge classes and text labels render
      expect(html).toContain('class="step-badge status-approved">Disetujui<');
      expect(html).toContain('class="step-badge status-rejected">Ditolak<');
      expect(html).toContain('class="step-badge status-pending">Menunggu Persetujuan<');
      expect(html).toContain('class="step-badge status-waiting">Menunggu Giliran<');

      // Verify each reviewer node pairs correctly with their status badge
      expect(html).toMatch(/Pak Hendra[\s\S]*?class="step-badge status-approved">Disetujui/);
      expect(html).toMatch(/Ayu Martina[\s\S]*?class="step-badge status-rejected">Ditolak/);
      expect(html).toMatch(/Hery Sugiarto[\s\S]*?class="step-badge status-pending">Menunggu Persetujuan/);
      expect(html).toMatch(/Koji Hashimoto[\s\S]*?class="step-badge status-waiting">Menunggu Giliran/);
    });

    it('renders default waiting pill badges (status-waiting) when steps are awaiting turn', () => {
      const doc = createEmptyDocument('PR');
      doc.approvalSteps.atasan.status = 'WAITING';
      doc.approvalSteps.ayu.status = 'WAITING';
      doc.approvalSteps.bod.heryStatus = 'WAITING';
      doc.approvalSteps.bod.hashimotoStatus = 'WAITING';

      const html = renderToStaticMarkup(<ApprovalStepper document={doc} />);
      const waitingMatches = html.match(/class="step-badge status-waiting"/g);
      expect(waitingMatches).toHaveLength(4);
      expect(html).toContain('Menunggu Giliran');
    });

    it('renders step-badge inside bod-reviewer cards with proper structure', () => {
      const doc = createEmptyDocument('PR');
      doc.approvalSteps.bod.heryStatus = 'APPROVED';
      doc.approvalSteps.bod.hashimotoStatus = 'REJECTED';

      const html = renderToStaticMarkup(<ApprovalStepper document={doc} />);
      expect(html).toContain('class="bod-reviewer"');
      expect(html).toContain('class="bod-reviewer-head"');
      expect(html).toMatch(/<div class="bod-reviewer-head"><strong>Hery Sugiarto<\/strong><span class="step-badge status-approved">Disetujui<\/span><\/div>/);
      expect(html).toMatch(/<div class="bod-reviewer-head"><strong>Koji Hashimoto<\/strong><span class="step-badge status-rejected">Ditolak<\/span><\/div>/);
    });
  });
});

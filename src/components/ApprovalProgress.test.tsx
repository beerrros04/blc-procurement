import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { INITIAL_SEED_DOCUMENTS } from '../store/seed-data';
import { ApprovalProgress } from './ApprovalProgress';
import { ProgressIndicatorDemo } from './ui/demo';
import { completedProgress } from './ui/progress-indicator';

describe('ApprovalProgress', () => {
  it('extends the filled progress only through consecutive approved stages', () => {
    expect(completedProgress(['WAITING', 'WAITING', 'WAITING'])).toBe(0);
    expect(completedProgress(['APPROVED', 'APPROVED', 'PENDING'])).toBe(50);
    expect(completedProgress(['APPROVED', 'APPROVED', 'APPROVED'])).toBe(100);
    expect(completedProgress(['APPROVED', 'REJECTED', 'APPROVED'])).toBe(0);
  });
  it('shows the pending parallel decision without marking BOD complete', () => {
    const doc = structuredClone(INITIAL_SEED_DOCUMENTS[0]);
    doc.approvalSteps.atasan.status = 'APPROVED';
    doc.approvalSteps.ayu.status = 'APPROVED';
    doc.approvalSteps.bod.heryStatus = 'APPROVED';
    doc.approvalSteps.bod.hashimotoStatus = 'PENDING';
    const html = renderToStaticMarkup(<ApprovalProgress document={doc} />);
    expect(html).toContain('1/2 disetujui');
    expect(html).toContain('is-pending');
  });

  it('shows the returned stage and does not report it as approved', () => {
    const doc = structuredClone(INITIAL_SEED_DOCUMENTS[0]);
    doc.approvalSteps.atasan.status = 'REJECTED';
    const html = renderToStaticMarkup(<ApprovalProgress document={doc} />);
    expect(html).toContain('Dikembalikan');
    expect(html).toContain('is-rejected');
  });

  it('shows the requested names without job titles', () => {
    const doc = { ...structuredClone(INITIAL_SEED_DOCUMENTS[0]), stage1ApproverEmail: 'atasan@blc.co.id' };
    const html = renderToStaticMarkup(<ApprovalProgress document={doc} />);
    expect(html).toContain('Pak Hendra');
    expect(html).toContain('Ayu Martina');
    expect(html).toContain('Hery Sugiarto');
    expect(html).toContain('Koji Hashimoto');
    expect(html).not.toContain('>GM<');
  });

  it('exposes the individual parallel decisions and remains read-only', () => {
    const doc = structuredClone(INITIAL_SEED_DOCUMENTS[0]);
    doc.approvalSteps.bod.heryStatus = 'APPROVED';
    doc.approvalSteps.bod.hashimotoStatus = 'PENDING';
    const html = renderToStaticMarkup(<ApprovalProgress document={doc} />);
    expect(html).toContain('Hery Sugiarto: Disetujui');
    expect(html).toContain('Koji Hashimoto: Menunggu');
    expect(html).not.toContain('<button');
  });

  it('does not show approval stages for a GR', () => {
    const doc = { ...structuredClone(INITIAL_SEED_DOCUMENTS[0]), docType: 'GR' as const };
    const html = renderToStaticMarkup(<ApprovalProgress document={doc} />);
    expect(html).toContain('Tidak memerlukan persetujuan');
    expect(html).not.toContain('Ayu Martina');
  });

  it('does not present the PV submitter as an Atasan approver', () => {
    const doc = { ...structuredClone(INITIAL_SEED_DOCUMENTS[0]), docType: 'PV' as const };
    doc.approvalSteps.atasan.assignedTo = 'Erika Ayu Fitriana';
    doc.approvalSteps.atasan.status = 'APPROVED';
    const html = renderToStaticMarkup(<ApprovalProgress document={doc} />);
    expect(html).not.toContain('Erika Ayu Fitriana');
    expect(html).toContain('Ayu Martina');
  });

  it('marks the BOD complete only after both decisions are approved', () => {
    const doc = structuredClone(INITIAL_SEED_DOCUMENTS[0]);
    doc.approvalSteps.bod.heryStatus = 'APPROVED';
    doc.approvalSteps.bod.hashimotoStatus = 'APPROVED';
    const html = renderToStaticMarkup(<ApprovalProgress document={doc} />);
    expect(html).toContain('Hery Sugiarto: Disetujui');
    expect(html).toContain('Koji Hashimoto: Disetujui');
    expect(html).not.toContain('1/2 disetujui');
  });

  it('preserves the standalone example with its Continue button', () => {
    const html = renderToStaticMarkup(<ProgressIndicatorDemo />);
    expect(html).toContain('Continue');
    expect(html).toContain('<button');
  });

  it('renders compact mode with only visual dots and no verbose copy', () => {
    const doc = { ...structuredClone(INITIAL_SEED_DOCUMENTS[0]), stage1ApproverEmail: 'atasan@blc.co.id' };
    const html = renderToStaticMarkup(<ApprovalProgress document={doc} compact />);
    expect(html).not.toContain('approval-progress-copy');
    expect(html).toContain('title="Pak Hendra: Belum dimulai"');
    expect(html).toContain('title="Ayu Martina: Belum dimulai"');
    expect(html).toContain('role="img"');
    expect(html).toContain('approval-progress-dot');
    expect(html).toContain('Belum dimulai');
  });

  it('shows the active stage in compact mode without hover', () => {
    const doc = structuredClone(INITIAL_SEED_DOCUMENTS[0]);
    doc.approvalSteps.atasan.status = 'APPROVED';
    doc.approvalSteps.ayu.status = 'PENDING';
    const html = renderToStaticMarkup(<ApprovalProgress document={doc} compact />);
    expect(html).toContain('Tahap 2/3 · Ayu Martina: Menunggu');
  });

  it('renders fallback Belum ditentukan when approver email and name are unassigned', () => {
    const doc = structuredClone(INITIAL_SEED_DOCUMENTS[0]);
    doc.approvalSteps.atasan.assignedTo = undefined as unknown as string;
    doc.stage1ApproverEmail = undefined;
    const html = renderToStaticMarkup(<ApprovalProgress document={doc} compact />);
    expect(html).toContain('title="Belum ditentukan: Belum dimulai"');
    expect(html).not.toContain('Nama belum tersedia');
  });

  it('renders continuous flex connectors between steps and marks approved segments active', () => {
    const doc = { ...structuredClone(INITIAL_SEED_DOCUMENTS[0]), stage1ApproverEmail: 'atasan@blc.co.id' };
    doc.approvalSteps.atasan.status = 'APPROVED';
    doc.approvalSteps.ayu.status = 'PENDING';
    doc.approvalSteps.bod.heryStatus = 'WAITING';
    doc.approvalSteps.bod.hashimotoStatus = 'WAITING';

    const html = renderToStaticMarkup(<ApprovalProgress document={doc} compact />);

    // Must have 3 step dots
    const dotMatches = html.match(/approval-progress-dot/g);
    expect(dotMatches).toHaveLength(3);

    // Must have 2 connectors (between 1 & 2, and 2 & 3)
    const connectorMatches = html.match(/step-connector/g);
    expect(connectorMatches).toHaveLength(2);

    // First connector is approved (emerald)
    expect(html).toContain('step-connector approval-progress-connector is-approved');

    // Each dot has accessible attributes: role="img", tabIndex=0, aria-label, title
    expect(html).toContain('role="img" tabindex="0"');
    expect(html).toContain('title="Pak Hendra: Disetujui"');
    expect(html).toContain('aria-label="Pak Hendra: Disetujui"');
    expect(html).toContain('title="Ayu Martina: Menunggu"');

    // Contains approved checkmark ✓ and last step has no trailing connector
    expect(html).toContain('✓');
    expect(html).toContain('approval-progress-step--last');
  });

  it('renders 2-step pipeline for PV documents with exactly one connector', () => {
    const doc = { ...structuredClone(INITIAL_SEED_DOCUMENTS[0]), docType: 'PV' as const };
    doc.approvalSteps.ayu.status = 'APPROVED';
    doc.approvalSteps.bod.heryStatus = 'APPROVED';
    doc.approvalSteps.bod.hashimotoStatus = 'APPROVED';

    const html = renderToStaticMarkup(<ApprovalProgress document={doc} compact />);

    // PV only has Ayu and BOD
    const dotMatches = html.match(/approval-progress-dot/g);
    expect(dotMatches).toHaveLength(2);

    const connectorMatches = html.match(/step-connector/g);
    expect(connectorMatches).toHaveLength(1);
    expect(html).toContain('step-connector approval-progress-connector is-approved');
  });

  it('renders rejection mark × inside rejected step dot', () => {
    const doc = { ...structuredClone(INITIAL_SEED_DOCUMENTS[0]), stage1ApproverEmail: 'atasan@blc.co.id' };
    doc.approvalSteps.atasan.status = 'REJECTED';

    const html = renderToStaticMarkup(<ApprovalProgress document={doc} compact />);
    expect(html).toContain('is-rejected');
    expect(html).toContain('×');
    expect(html).toContain('title="Pak Hendra: Dikembalikan"');
  });

  it('renders separated payment settlement indicator node with vertical divider', () => {
    const doc = structuredClone(INITIAL_SEED_DOCUMENTS[0]);
    doc.status = 'PAID';
    const html = renderToStaticMarkup(<ApprovalProgress document={doc} variant="capsule" />);
    expect(html).toContain('stepper-payment-divider');
    expect(html).toContain('stepper-payment-node');
    expect(html).toContain('Lunas');
  });

  it('renders waiting payment settlement indicator when document is pending approval', () => {
    const doc = structuredClone(INITIAL_SEED_DOCUMENTS[0]);
    doc.status = 'DRAFT';
    const html = renderToStaticMarkup(<ApprovalProgress document={doc} variant="capsule" />);
    expect(html).toContain('stepper-payment-divider');
    expect(html).toContain('stepper-payment-node');
    expect(html).toContain('Belum Dibayar');
  });

  it('renders warning payment settlement indicator when document is approved awaiting payment', () => {
    const doc = structuredClone(INITIAL_SEED_DOCUMENTS[0]);
    doc.status = 'APPROVED';
    const html = renderToStaticMarkup(<ApprovalProgress document={doc} variant="capsule" />);
    expect(html).toContain('stepper-payment-divider');
    expect(html).toContain('stepper-payment-node');
    expect(html).toContain('is-warning');
    expect(html).toContain('Menunggu Pembayaran');
  });
});

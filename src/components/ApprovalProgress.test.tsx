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
    const html = renderToStaticMarkup(<ApprovalProgress document={INITIAL_SEED_DOCUMENTS[0]} />);
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
});

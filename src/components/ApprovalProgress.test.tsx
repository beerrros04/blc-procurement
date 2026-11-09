import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { INITIAL_SEED_DOCUMENTS } from '../store/seed-data';
import { ApprovalProgress } from './ApprovalProgress';

describe('ApprovalProgress', () => {
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
});

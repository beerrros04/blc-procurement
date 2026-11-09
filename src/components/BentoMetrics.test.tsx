import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { INITIAL_SEED_DOCUMENTS } from '../store/seed-data';
import { BentoMetrics } from './BentoMetrics';

it('does not mark a paid advance settled merely because a draft realization exists', () => {
  const advance = structuredClone(INITIAL_SEED_DOCUMENTS.find((doc) => doc.docType === 'AV')!);
  const draft = { ...structuredClone(advance), id: 'rc-test', docType: 'RC' as const, parentAvId: advance.id, status: 'DRAFT' as const, realizedAmount: 100, balanceAmount: 0, avOriginalAmount: 100, outcomeType: 'EXACT' as const, activityCompletedDate: '', submissionDeadline: '' };
  const html = renderToStaticMarkup(<BentoMetrics documents={[advance, draft]} activeRole="ADMIN" />);
  expect(html).toContain('Belum dikonfirmasi');
  expect(html).toContain('Realisasi AV Selesai');
  expect(html).toContain('0%');
});

it('shows equal structured summaries and displays activity names without altering audit data', () => {
  const advance = structuredClone(INITIAL_SEED_DOCUMENTS.find((doc) => doc.docType === 'AV')!);
  if (advance.docType !== 'AV') throw new Error('Expected advance');
  advance.amount = 123_456_789_012;
  advance.status = 'PAID';
  advance.auditLog = [{ id: 'name-test', timestamp: '2026-11-09T10:00:00Z', actor: 'Pak Hery (Direksi BoD)', action: 'APPROVE' }];
  const html = renderToStaticMarkup(<BentoMetrics documents={[advance]} activeRole="ADMIN" />);
  expect(html.match(/class="metric-summary-heading"/g)).toHaveLength(4);
  expect(html.match(/class="metric-summary-value/g)).toHaveLength(4);
  expect(html).toContain(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(advance.amount));
  expect(html).toContain('Hery Sugiarto');
  expect(html).not.toContain('Pak Hery (Direksi BoD)');
  expect(advance.auditLog[0].actor).toBe('Pak Hery (Direksi BoD)');
});

it('uses accessible text colors instead of low-contrast muted grays', () => {
  const html = renderToStaticMarkup(<BentoMetrics documents={INITIAL_SEED_DOCUMENTS} activeRole="ADMIN" />);
  expect(html).not.toContain('text-[#6B7280]');
  expect(html).not.toContain('text-[#7C8FAC]');
});

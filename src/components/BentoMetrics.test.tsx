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

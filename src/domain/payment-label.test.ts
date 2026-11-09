import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from '../store/document-store';
import type { PODocument, PVDocument, RCDocument } from '../types/document';
import { paymentLabel } from './payment-label';

describe('payment labels', () => {
  it('distinguishes a missing voucher, unpaid voucher and recorded payment', () => {
    const po = createEmptyDocument('PO', 'Pusat') as PODocument;
    po.status = 'APPROVED';
    const pv = createEmptyDocument('PV', 'Pusat') as PVDocument;
    pv.sourceDocId = po.id;
    pv.paymentStatus = 'UNPAID';
    expect(paymentLabel(po, [])).toBe('Menunggu PV');
    expect(paymentLabel(po, [pv])).toBe('Menunggu pembayaran');
    expect(paymentLabel(pv, [pv])).toBe('Menunggu pembayaran');
    pv.paymentStatus = 'PAID';
    expect(paymentLabel(po, [pv])).toBe('Dibayar');
    expect(paymentLabel(pv, [pv])).toBe('Dibayar');
  });

  it('does not imply a voucher is needed for a PR or a surplus realization', () => {
    const pr = createEmptyDocument('PR', 'Pusat');
    pr.status = 'APPROVED';
    const gr = createEmptyDocument('GR', 'Pusat');
    gr.status = 'APPROVED';
    const rc = createEmptyDocument('RC', 'Pusat') as RCDocument;
    rc.status = 'APPROVED';
    rc.outcomeType = 'SURPLUS';
    expect(paymentLabel(pr, [])).toBeNull();
    expect(paymentLabel(gr, [])).toBeNull();
    expect(paymentLabel(rc, [])).toBeNull();
  });
});

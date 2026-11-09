import type { AnyDocument, PVDocument } from '../types/document';

export function paymentLabel(doc: AnyDocument, documents: AnyDocument[]): string | null {
  if (doc.docType === 'PV') {
    return doc.paymentStatus === 'PAID' ? 'Dibayar' : 'Menunggu pembayaran';
  }
  if (doc.docType === 'PR' || doc.docType === 'GR' || (doc.docType === 'RC' && doc.outcomeType !== 'DEFICIT')) return null;
  const voucher = documents.find(
    (item): item is PVDocument => item.docType === 'PV' && item.sourceDocId === doc.id
  );
  if (voucher) return voucher.paymentStatus === 'PAID' ? 'Dibayar' : 'Menunggu pembayaran';
  if (doc.status === 'PAID') return 'Dibayar';
  return doc.status === 'APPROVED' ? 'Menunggu PV' : null;
}

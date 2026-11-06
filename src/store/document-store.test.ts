import { beforeEach, describe, expect, it } from 'vitest';
import type { PODocument, PRDocument, PVDocument } from '../types/document';
import {
  approveDocumentStage,
  createEmptyDocument,
  generatePvFromSource,
  loadAllDocuments,
  recordPvPayment,
  rejectDocument,
  saveDocument,
  submitDocument,
} from './document-store';

class MockStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  clear(): void {
    this.store.clear();
  }
}

describe('Document Store & Multi-Stage State Machine', () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
  });

  it('creates and saves a PR draft', () => {
    const draft = createEmptyDocument('PR', 'Cabang Bandung');
    draft.title = 'Pengadaan Meja Kursi Kantor';
    draft.purpose = 'Kebutuhan workstation tim operasional';
    (draft as PRDocument).subtotalAmount = 6_000_000;
    (draft as PRDocument).isIamRequired = true;
    (draft as PRDocument).budgetType = 'CAPEX';

    const saved = saveDocument(storage, draft);
    expect(saved.id).toBeDefined();
    expect(saved.docNumber).toMatch(/^PR-\d{6}-\d{4}$/);
    expect(saved.status).toBe('DRAFT');

    const all = loadAllDocuments(storage);
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(saved.id);
  });

  it('executes full sequential & parallel approval pipeline: Atasan -> Bu Ayu -> BOD (Hery & Hashimoto) -> APPROVED', () => {
    const draft = createEmptyDocument('PR', 'Pusat');
    draft.title = 'Pengadaan Server';
    (draft as PRDocument).subtotalAmount = 15_000_000;
    saveDocument(storage, draft);

    // 1. Submit by Pemohon
    const submitted = submitDocument(storage, draft.id, 'Bernard Pemohon');
    expect(submitted.status).toBe('SUBMITTED');
    expect(submitted.currentStage).toBe('ATASAN');
    expect(submitted.approvalSteps.atasan.status).toBe('PENDING');

    // 2. Stage 1: Atasan approves
    const atasanApproved = approveDocumentStage(
      storage,
      draft.id,
      'ATASAN',
      'Pak Budi Atasan',
      'Disetujui untuk diproses ke Bu Ayu'
    );
    expect(atasanApproved.status).toBe('IN_REVIEW');
    expect(atasanApproved.currentStage).toBe('AYU');
    expect(atasanApproved.approvalSteps.atasan.status).toBe('APPROVED');
    expect(atasanApproved.approvalSteps.ayu.status).toBe('PENDING');

    // 3. Stage 2: Bu Ayu approves
    const ayuApproved = approveDocumentStage(
      storage,
      draft.id,
      'AYU',
      'Bu Ayu',
      'Verifikasi keuangan & anggaran lolos'
    );
    expect(ayuApproved.status).toBe('IN_REVIEW');
    expect(ayuApproved.currentStage).toBe('BOD');
    expect(ayuApproved.approvalSteps.ayu.status).toBe('APPROVED');
    expect(ayuApproved.approvalSteps.bod.heryStatus).toBe('PENDING');
    expect(ayuApproved.approvalSteps.bod.hashimotoStatus).toBe('PENDING');

    // 4. Stage 3 (Parallel): Pak Hery approves first
    const heryApproved = approveDocumentStage(
      storage,
      draft.id,
      'BOD_HERY',
      'Pak Hery',
      'Oke dari saya'
    );
    expect(heryApproved.status).toBe('IN_REVIEW'); // Masih IN_REVIEW karena Hashimoto belum
    expect(heryApproved.approvalSteps.bod.heryStatus).toBe('APPROVED');
    expect(heryApproved.approvalSteps.bod.hashimotoStatus).toBe('PENDING');

    // 5. Stage 3 (Parallel): Hashimoto approves
    const fullyApproved = approveDocumentStage(
      storage,
      draft.id,
      'BOD_HASHIMOTO',
      'Hashimoto',
      'Approved'
    );
    expect(fullyApproved.status).toBe('APPROVED');
    expect(fullyApproved.approvalSteps.bod.hashimotoStatus).toBe('APPROVED');
  });

  it('resets document status to DRAFT in-place upon rejection with audit trail', () => {
    const draft = createEmptyDocument('PO', 'Cabang Surabaya');
    draft.title = 'Pembelian Genset';
    saveDocument(storage, draft);
    submitDocument(storage, draft.id, 'Pemohon');
    approveDocumentStage(storage, draft.id, 'ATASAN', 'Atasan', 'Lanjut');

    // Bu Ayu menolak karena faktur vendor tidak lengkap
    const rejected = rejectDocument(
      storage,
      draft.id,
      'AYU',
      'Bu Ayu',
      'Faktur proforma vendor belum dilampirkan'
    );

    expect(rejected.status).toBe('DRAFT');
    expect(rejected.approvalSteps.ayu.status).toBe('REJECTED');
    expect(rejected.auditLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actor: 'Bu Ayu',
          action: 'REJECT',
          comment: 'Faktur proforma vendor belum dilampirkan',
        }),
      ])
    );
  });

  it('generates Payment Voucher (PV) from approved PO and marks paid', () => {
    // Siapkan PO Approved
    const po = createEmptyDocument('PO', 'Cabang Jakarta') as PODocument;
    po.title = 'Pengadaan Kendaraan Operasional';
    po.vendorName = 'PT Otomotif Indonesia';
    po.subtotal = 20_000_000;
    po.otherCosts = 0;
    po.discount = 0;
    po.ppnRate = 0.11;
    po.ppnAmount = 2_200_000;
    po.pphRate = 0.02;
    po.pphAmount = 400_000;
    po.totalAmount = 21_800_000;
    po.paymentMethod = 'BANK_TRANSFER';
    po.bankDetails = {
      bankName: 'BCA',
      accountNumber: '1234567890',
      accountHolder: 'PT Otomotif Indonesia',
    };
    saveDocument(storage, po);
    submitDocument(storage, po.id, 'Staff');
    approveDocumentStage(storage, po.id, 'ATASAN', 'Atasan', 'OK');
    approveDocumentStage(storage, po.id, 'AYU', 'Bu Ayu', 'OK');
    approveDocumentStage(storage, po.id, 'BOD_HERY', 'Hery', 'OK');
    const approvedPo = approveDocumentStage(
      storage,
      po.id,
      'BOD_HASHIMOTO',
      'Hashimoto',
      'OK'
    );

    // Keuangan generate PV
    const pv = generatePvFromSource(storage, approvedPo.id, 'Finance Ayu');
    expect(pv.docType).toBe('PV');
    expect(pv.sourceDocId).toBe(po.id);
    expect(pv.vendorOrPayeeName).toBe('PT Otomotif Indonesia');
    expect(pv.grossAmount).toBe(21_800_000);
    expect(pv.pphDeduction).toBe(400_000);
    expect(pv.netAmountToPay).toBe(21_400_000);
    expect(pv.paymentStatus).toBe('UNPAID');

    // Keuangan mencatat pembayaran
    const paidPv = recordPvPayment(storage, pv.id, {
      paidAt: '2026-11-07',
      sourceBank: 'Mandiri Operasional BLC',
      referenceNumber: 'TRF-BLC-20261107-001',
      proofUrl: 'https://storage.local/proofs/trf001.pdf',
    }) as PVDocument;

    expect(paidPv.paymentStatus).toBe('PAID');
    expect(paidPv.status).toBe('PAID');

    // Induk PO juga terupdate statusnya menjadi PAID
    const reloadedDocs = loadAllDocuments(storage);
    const updatedPo = reloadedDocs.find((d) => d.id === po.id);
    expect(updatedPo?.status).toBe('PAID');
  });
});

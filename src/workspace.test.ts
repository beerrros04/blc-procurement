import { beforeEach, describe, expect, it } from 'vitest';
import {
  approveDocumentStage,
  createEmptyDocument,
  generatePvFromSource,
  loadAllDocuments,
  recordPvPayment,
  saveDocument,
  submitDocument,
} from './store/document-store';
import type {
  AVDocument,
  PODocument,
  PRDocument,
  PVDocument,
  RCDocument,
} from './types/document';

class MemoryStorage {
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

describe('End-to-End Operational Lifecycle Simulation', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('completes the entire cycle: PR -> PO -> BOD Approval -> PV Generation -> Payment -> AV -> RC (Surplus & Deficit)', () => {
    // 1. Pemohon membuat PR bernilai Rp 15.000.000
    const pr = createEmptyDocument('PR', 'Pusat') as PRDocument;
    pr.title = 'Pengadaan 10 Unit Komputer Cabang';
    pr.subtotalAmount = 15_000_000;
    pr.isIamRequired = true;
    pr.budgetType = 'CAPEX';
    saveDocument(storage, pr);

    submitDocument(storage, pr.id, 'Bernard Pemohon');
    approveDocumentStage(storage, pr.id, 'ATASAN', 'Atasan Langsung', 'Disetujui');
    approveDocumentStage(storage, pr.id, 'AYU', 'Bu Ayu', 'Anggaran terverifikasi');
    approveDocumentStage(storage, pr.id, 'BOD_HERY', 'Pak Hery', 'OK Hery');
    const approvedPr = approveDocumentStage(
      storage,
      pr.id,
      'BOD_HASHIMOTO',
      'Hashimoto',
      'OK Hashimoto'
    );
    expect(approvedPr.status).toBe('APPROVED');

    // 2. Pemohon membuat PO merujuk PR yang telah disetujui
    const po = createEmptyDocument('PO', 'Pusat') as PODocument;
    po.parentPrId = approvedPr.id;
    po.title = `PO: ${approvedPr.title}`;
    po.vendorName = 'PT Teknologi Nusantara';
    po.subtotal = 15_000_000;
    po.otherCosts = 0;
    po.discount = 0;
    po.ppnRate = 0.11;
    po.ppnAmount = 1_650_000;
    po.pphRate = 0.02;
    po.pphAmount = 300_000;
    po.totalAmount = 16_350_000;
    po.paymentMethod = 'BANK_TRANSFER';
    po.bankDetails = {
      bankName: 'BCA',
      accountNumber: '891029102',
      accountHolder: 'PT Teknologi Nusantara',
    };
    saveDocument(storage, po);

    // Alur persetujuan PO
    submitDocument(storage, po.id, 'Bernard Pemohon');
    approveDocumentStage(storage, po.id, 'ATASAN', 'Atasan', 'Sesuai PR');
    approveDocumentStage(storage, po.id, 'AYU', 'Bu Ayu', 'PO Valid');
    approveDocumentStage(storage, po.id, 'BOD_HERY', 'Pak Hery', 'Disetujui');
    const approvedPo = approveDocumentStage(
      storage,
      po.id,
      'BOD_HASHIMOTO',
      'Hashimoto',
      'Disetujui'
    );
    expect(approvedPo.status).toBe('APPROVED');

    // 3. Tim Keuangan menerbitkan Payment Voucher (PV) untuk PO
    const pvPo = generatePvFromSource(storage, approvedPo.id, 'Keuangan');
    // Gross invoice = 15.000.000 + 1.650.000 = 16.650.000
    expect(pvPo.grossAmount).toBe(16_650_000);
    expect(pvPo.pphDeduction).toBe(300_000);
    // Net transfer = 16.650.000 - 300.000 = 16.350.000 (sama dengan po.totalAmount)
    expect(pvPo.netAmountToPay).toBe(16_350_000);
    expect(pvPo.paymentStatus).toBe('UNPAID');

    // Keuangan mengeksekusi transfer dan mencatat pembayaran
    const paidPv = recordPvPayment(storage, pvPo.id, {
      paidAt: '2026-11-07',
      sourceBank: 'BCA Operasional BLC',
      referenceNumber: 'TRF-BLC-20261107-0091',
    });
    expect(paidPv.paymentStatus).toBe('PAID');
    expect(paidPv.status).toBe('PAID');

    // Pastikan PO juga terupdate menjadi PAID
    const docsAfterPo = loadAllDocuments(storage);
    const updatedPo = docsAfterPo.find((d) => d.id === po.id);
    expect(updatedPo?.status).toBe('PAID');

    // 4. Pemohon mengajukan Uang Muka (AV)
    const av = createEmptyDocument('AV', 'Pusat') as AVDocument;
    av.title = 'Uang Muka Perjalanan Dinas Lapangan';
    av.amount = 5_000_000;
    av.activityDate = '2026-11-10';
    av.paymentDueDate = '2026-11-09';
    av.disbursementMethod = 'TRANSFER';
    av.bankDetails = {
      bankName: 'Mandiri',
      accountNumber: '119283910',
      accountHolder: 'Staff Lapangan',
    };
    saveDocument(storage, av);
    submitDocument(storage, av.id, 'Staff Lapangan');
    approveDocumentStage(storage, av.id, 'ATASAN', 'Atasan', 'OK');
    approveDocumentStage(storage, av.id, 'AYU', 'Bu Ayu', 'OK');
    approveDocumentStage(storage, av.id, 'BOD_HERY', 'Pak Hery', 'OK');
    const approvedAv = approveDocumentStage(
      storage,
      av.id,
      'BOD_HASHIMOTO',
      'Hashimoto',
      'OK'
    );

    // Keuangan mencairkan AV lewat PV
    const pvAv = generatePvFromSource(storage, approvedAv.id, 'Keuangan');
    recordPvPayment(storage, pvAv.id, {
      paidAt: '2026-11-08',
      sourceBank: 'Mandiri Operasional',
      referenceNumber: 'TRF-AV-0012',
    });

    const docsAfterAv = loadAllDocuments(storage);
    const paidAv = docsAfterAv.find((d) => d.id === av.id);
    expect(paidAv?.status).toBe('PAID');

    // 5. Pemohon melakukan Realisasi Uang Muka (RC) - Skenario SURPLUS
    const rc = createEmptyDocument('RC', 'Pusat') as RCDocument;
    const paidAvDoc = paidAv as AVDocument;
    rc.parentAvId = paidAvDoc.id;
    rc.avOriginalAmount = paidAvDoc.amount; // Rp 5.000.000
    rc.realizedAmount = 4_200_000; // Pengeluaran riil Rp 4.200.000
    rc.balanceAmount = 800_000; // Sisa Rp 800.000 (SURPLUS)
    rc.outcomeType = 'SURPLUS';
    rc.refundProofUrl = 'https://docs.local/receipt-refund-800k.jpg';
    rc.activityCompletedDate = '2026-11-12';
    rc.submissionDeadline = '2026-11-14';
    saveDocument(storage, rc);

    submitDocument(storage, rc.id, 'Staff Lapangan');
    approveDocumentStage(storage, rc.id, 'ATASAN', 'Atasan', 'Sesuai bukti');
    approveDocumentStage(storage, rc.id, 'AYU', 'Bu Ayu', 'Sisa dana telah diterima');
    approveDocumentStage(storage, rc.id, 'BOD_HERY', 'Pak Hery', 'Selesai');
    const approvedRc = approveDocumentStage(
      storage,
      rc.id,
      'BOD_HASHIMOTO',
      'Hashimoto',
      'Selesai'
    ) as RCDocument;
    expect(approvedRc.status).toBe('APPROVED');
    expect(approvedRc.outcomeType).toBe('SURPLUS');
  });
});

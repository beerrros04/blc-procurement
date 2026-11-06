import type {
  AnyDocument,
  ApprovalStage,
  AVDocument,
  DocType,
  PODocument,
  PRDocument,
  PVDocument,
  PVPaymentDetails,
  RBDocument,
  RCDocument,
} from '../types/document';
import { calculatePvNet } from '../domain/calculations';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const WORKSPACE_STORAGE_KEY = 'blc_procurement_workspace_docs_v2';

export function generateDocNumber(type: DocType, count: number): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const seq = String(count + 1).padStart(4, '0');
  return `${type}-${yearMonth}-${seq}`;
}

export function createEmptyDocument(type: DocType, branch: string = 'Pusat'): AnyDocument {
  const nowIso = new Date().toISOString();
  const id = crypto.randomUUID();
  const docNumber = `${type}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const base = {
    id,
    docNumber,
    docType: type,
    title: '',
    branch,
    purpose: '',
    status: 'DRAFT' as const,
    createdAt: nowIso,
    updatedAt: nowIso,
    currentStage: 'ATASAN' as ApprovalStage,
    approvalSteps: {
      atasan: {
        stage: 'ATASAN' as const,
        label: 'Tahap 1: Atasan Langsung',
        assignedTo: 'Atasan Langsung',
        status: 'WAITING' as const,
      },
      ayu: {
        stage: 'AYU' as const,
        label: 'Tahap 2: Bu Ayu (Verifikator Keuangan)',
        assignedTo: 'Bu Ayu',
        status: 'WAITING' as const,
      },
      bod: {
        heryStatus: 'WAITING' as const,
        hashimotoStatus: 'WAITING' as const,
      },
    },
    auditLog: [
      {
        id: crypto.randomUUID(),
        timestamp: nowIso,
        actor: 'Sistem',
        action: 'CREATE_DRAFT',
        comment: 'Draf dibuat',
      },
    ],
  };

  switch (type) {
    case 'PR':
      return {
        ...base,
        docType: 'PR',
        budgetType: 'OPEX',
        subtotalAmount: 0,
        isIamRequired: false,
      } as PRDocument;
    case 'PO':
      return {
        ...base,
        docType: 'PO',
        poCategory: 'STANDARD',
        vendorName: '',
        paymentMethod: 'BANK_TRANSFER',
        subtotal: 0,
        otherCosts: 0,
        discount: 0,
        ppnRate: 0.11,
        ppnAmount: 0,
        pphRate: 0,
        pphAmount: 0,
        totalAmount: 0,
      } as PODocument;
    case 'AV':
      return {
        ...base,
        docType: 'AV',
        activityDate: '',
        paymentDueDate: '',
        amount: 0,
        disbursementMethod: 'TRANSFER',
      } as AVDocument;
    case 'RB':
      return {
        ...base,
        docType: 'RB',
        expenseCategory: 'OPERASIONAL',
        transactionDate: '',
        subtotal: 0,
        otherCosts: 0,
        discount: 0,
        totalAmount: 0,
        beneficiaryBank: {
          bankName: '',
          accountNumber: '',
          accountHolder: '',
        },
        attachmentCount: 1,
      } as RBDocument;
    case 'RC':
      return {
        ...base,
        docType: 'RC',
        parentAvId: '',
        avOriginalAmount: 0,
        realizedAmount: 0,
        balanceAmount: 0,
        outcomeType: 'EXACT',
        activityCompletedDate: '',
        submissionDeadline: '',
      } as RCDocument;
    case 'PV':
      return {
        ...base,
        docType: 'PV',
        sourceDocType: 'PO',
        sourceDocId: '',
        sourceDocNumber: '',
        vendorOrPayeeName: '',
        beneficiaryBank: {
          bankName: '',
          accountNumber: '',
          accountHolder: '',
        },
        grossAmount: 0,
        pphDeduction: 0,
        netAmountToPay: 0,
        paymentStatus: 'UNPAID',
      } as PVDocument;
  }
}

export function loadAllDocuments(storage: StorageLike): AnyDocument[] {
  const raw = storage.getItem(WORKSPACE_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AnyDocument[]) : [];
  } catch {
    return [];
  }
}

function persistAllDocuments(storage: StorageLike, docs: AnyDocument[]): void {
  storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(docs));
}

export function saveDocument(storage: StorageLike, doc: AnyDocument): AnyDocument {
  const docs = loadAllDocuments(storage);
  const now = new Date().toISOString();
  const existingIdx = docs.findIndex((d) => d.id === doc.id);

  const updatedDoc: AnyDocument = {
    ...doc,
    updatedAt: now,
  };

  if (existingIdx >= 0) {
    docs[existingIdx] = updatedDoc;
  } else {
    docs.unshift(updatedDoc);
  }

  persistAllDocuments(storage, docs);
  return updatedDoc;
}

export function submitDocument(
  storage: StorageLike,
  id: string,
  actor: string
): AnyDocument {
  const docs = loadAllDocuments(storage);
  const doc = docs.find((d) => d.id === id);
  if (!doc) throw new Error(`Dokumen id ${id} tidak ditemukan.`);

  const now = new Date().toISOString();
  doc.status = 'SUBMITTED';
  doc.currentStage = 'ATASAN';
  doc.approvalSteps.atasan.status = 'PENDING';
  doc.updatedAt = now;

  doc.auditLog.push({
    id: crypto.randomUUID(),
    timestamp: now,
    actor,
    action: 'SUBMIT',
    comment: 'Pengajuan dokumen diserahkan untuk persetujuan Tahap 1 (Atasan Langsung)',
  });

  persistAllDocuments(storage, docs);
  return doc;
}

export function approveDocumentStage(
  storage: StorageLike,
  id: string,
  role: 'ATASAN' | 'AYU' | 'BOD_HERY' | 'BOD_HASHIMOTO',
  actor: string,
  comment?: string
): AnyDocument {
  const docs = loadAllDocuments(storage);
  const doc = docs.find((d) => d.id === id);
  if (!doc) throw new Error(`Dokumen id ${id} tidak ditemukan.`);

  const now = new Date().toISOString();

  if (role === 'ATASAN') {
    doc.approvalSteps.atasan.status = 'APPROVED';
    doc.approvalSteps.atasan.decisionAt = now;
    doc.approvalSteps.atasan.comment = comment;
    doc.currentStage = 'AYU';
    doc.approvalSteps.ayu.status = 'PENDING';
    doc.status = 'IN_REVIEW';
  } else if (role === 'AYU') {
    doc.approvalSteps.ayu.status = 'APPROVED';
    doc.approvalSteps.ayu.decisionAt = now;
    doc.approvalSteps.ayu.comment = comment;
    doc.currentStage = 'BOD';
    doc.approvalSteps.bod.heryStatus = 'PENDING';
    doc.approvalSteps.bod.hashimotoStatus = 'PENDING';
    doc.status = 'IN_REVIEW';
  } else if (role === 'BOD_HERY') {
    doc.approvalSteps.bod.heryStatus = 'APPROVED';
    doc.approvalSteps.bod.heryDecisionAt = now;
    doc.approvalSteps.bod.heryComment = comment;

    // Cek apakah Hashimoto juga sudah approve
    if (doc.approvalSteps.bod.hashimotoStatus === 'APPROVED') {
      doc.status = 'APPROVED';
    } else {
      doc.status = 'IN_REVIEW';
    }
  } else if (role === 'BOD_HASHIMOTO') {
    doc.approvalSteps.bod.hashimotoStatus = 'APPROVED';
    doc.approvalSteps.bod.hashimotoDecisionAt = now;
    doc.approvalSteps.bod.hashimotoComment = comment;

    // Cek apakah Hery juga sudah approve
    if (doc.approvalSteps.bod.heryStatus === 'APPROVED') {
      doc.status = 'APPROVED';
    } else {
      doc.status = 'IN_REVIEW';
    }
  }

  doc.updatedAt = now;
  doc.auditLog.push({
    id: crypto.randomUUID(),
    timestamp: now,
    actor,
    action: 'APPROVE',
    comment: comment || 'Menyetujui dokumen',
  });

  persistAllDocuments(storage, docs);
  return doc;
}

export function rejectDocument(
  storage: StorageLike,
  id: string,
  role: 'ATASAN' | 'AYU' | 'BOD_HERY' | 'BOD_HASHIMOTO',
  actor: string,
  comment: string
): AnyDocument {
  if (!comment || !comment.trim()) {
    throw new Error('Alasan penolakan wajib diisi.');
  }

  const docs = loadAllDocuments(storage);
  const doc = docs.find((d) => d.id === id);
  if (!doc) throw new Error(`Dokumen id ${id} tidak ditemukan.`);

  const now = new Date().toISOString();

  if (role === 'ATASAN') {
    doc.approvalSteps.atasan.status = 'REJECTED';
    doc.approvalSteps.atasan.decisionAt = now;
    doc.approvalSteps.atasan.comment = comment;
  } else if (role === 'AYU') {
    doc.approvalSteps.ayu.status = 'REJECTED';
    doc.approvalSteps.ayu.decisionAt = now;
    doc.approvalSteps.ayu.comment = comment;
  } else if (role === 'BOD_HERY') {
    doc.approvalSteps.bod.heryStatus = 'REJECTED';
    doc.approvalSteps.bod.heryDecisionAt = now;
    doc.approvalSteps.bod.heryComment = comment;
  } else if (role === 'BOD_HASHIMOTO') {
    doc.approvalSteps.bod.hashimotoStatus = 'REJECTED';
    doc.approvalSteps.bod.hashimotoDecisionAt = now;
    doc.approvalSteps.bod.hashimotoComment = comment;
  }

  // Reset to DRAFT in-place for correction
  doc.status = 'DRAFT';
  doc.updatedAt = now;

  doc.auditLog.push({
    id: crypto.randomUUID(),
    timestamp: now,
    actor,
    action: 'REJECT',
    comment,
  });

  persistAllDocuments(storage, docs);
  return doc;
}

export function generatePvFromSource(
  storage: StorageLike,
  sourceDocId: string,
  actor: string
): PVDocument {
  const docs = loadAllDocuments(storage);
  const source = docs.find((d) => d.id === sourceDocId);
  if (!source) throw new Error(`Dokumen sumber id ${sourceDocId} tidak ditemukan.`);

  if (source.status !== 'APPROVED') {
    throw new Error('Payment Voucher hanya dapat dibuat dari dokumen yang telah disetujui (APPROVED).');
  }

  let grossAmount = 0;
  let pphDeduction = 0;
  let payeeName = '';
  let bankDetails = { bankName: '', accountNumber: '', accountHolder: '' };
  let sourceDocType: 'PO' | 'AV' | 'RB' | 'RC_DEFICIT' = 'PO';

  if (source.docType === 'PO') {
    const po = source as PODocument;
    grossAmount = po.totalAmount;
    pphDeduction = po.pphAmount;
    payeeName = po.vendorName;
    bankDetails = po.bankDetails || { bankName: 'BCA', accountNumber: '00000000', accountHolder: po.vendorName };
    sourceDocType = 'PO';
  } else if (source.docType === 'AV') {
    const av = source as AVDocument;
    grossAmount = av.amount;
    pphDeduction = 0;
    payeeName = av.bankDetails?.accountHolder || av.title;
    bankDetails = av.bankDetails || { bankName: 'Mandiri', accountNumber: '00000000', accountHolder: payeeName };
    sourceDocType = 'AV';
  } else if (source.docType === 'RB') {
    const rb = source as RBDocument;
    grossAmount = rb.totalAmount;
    pphDeduction = 0;
    payeeName = rb.beneficiaryBank.accountHolder;
    bankDetails = rb.beneficiaryBank;
    sourceDocType = 'RB';
  } else if (source.docType === 'RC') {
    const rc = source as RCDocument;
    if (rc.outcomeType !== 'DEFICIT') {
      throw new Error('PV hanya dapat dibuat dari RC yang berstatus DEFICIT (kekurangan dana).');
    }
    grossAmount = Math.abs(rc.balanceAmount);
    pphDeduction = 0;
    payeeName = rc.reimbursementBank?.accountHolder || 'Karyawan Pemohon';
    bankDetails = rc.reimbursementBank || { bankName: 'BCA', accountNumber: '00000000', accountHolder: payeeName };
    sourceDocType = 'RC_DEFICIT';
  } else {
    throw new Error(`Dokumen jenis ${source.docType} tidak dapat menghasilkan PV langsung.`);
  }

  const { netAmountToPay } = calculatePvNet({ grossAmount, pphDeduction });

  const pvCount = docs.filter((d) => d.docType === 'PV').length;
  const pvDoc = createEmptyDocument('PV', source.branch) as PVDocument;

  pvDoc.docNumber = generateDocNumber('PV', pvCount);
  pvDoc.sourceDocType = sourceDocType;
  pvDoc.sourceDocId = source.id;
  pvDoc.sourceDocNumber = source.docNumber;
  pvDoc.title = `Payment Voucher untuk ${source.docNumber} - ${source.title}`;
  pvDoc.vendorOrPayeeName = payeeName;
  pvDoc.beneficiaryBank = bankDetails;
  pvDoc.grossAmount = grossAmount;
  pvDoc.pphDeduction = pphDeduction;
  pvDoc.netAmountToPay = netAmountToPay;
  pvDoc.status = 'APPROVED'; // Pre-approved from parent
  pvDoc.paymentStatus = 'UNPAID';

  pvDoc.auditLog.push({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    actor,
    action: 'GENERATE_PV',
    comment: `PV dibuat dari dokumen induk ${source.docNumber}`,
  });

  saveDocument(storage, pvDoc);
  return pvDoc;
}

export function recordPvPayment(
  storage: StorageLike,
  pvId: string,
  details: PVPaymentDetails
): PVDocument {
  const docs = loadAllDocuments(storage);
  const pv = docs.find((d) => d.id === pvId && d.docType === 'PV') as PVDocument | undefined;
  if (!pv) throw new Error(`PV id ${pvId} tidak ditemukan.`);

  const now = new Date().toISOString();
  pv.paymentStatus = 'PAID';
  pv.status = 'PAID';
  pv.paymentDetails = details;
  pv.updatedAt = now;

  pv.auditLog.push({
    id: crypto.randomUUID(),
    timestamp: now,
    actor: 'Keuangan',
    action: 'RECORD_PAYMENT',
    comment: `Pembayaran berhasil dicatat. Bank: ${details.sourceBank}, Ref: ${details.referenceNumber}`,
  });

  // Perbarui status dokumen induk menjadi PAID juga
  if (pv.sourceDocId) {
    const sourceDoc = docs.find((d) => d.id === pv.sourceDocId);
    if (sourceDoc) {
      sourceDoc.status = 'PAID';
      sourceDoc.updatedAt = now;
      sourceDoc.auditLog.push({
        id: crypto.randomUUID(),
        timestamp: now,
        actor: 'Keuangan',
        action: 'PARENT_MARKED_PAID',
        comment: `Dokumen dilunasi melalui PV ${pv.docNumber}`,
      });
    }
  }

  persistAllDocuments(storage, docs);
  return pv;
}

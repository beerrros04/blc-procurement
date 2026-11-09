import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type {
  AnyDocument,
  ApprovalStage,
  AVDocument,
  DocType,
  GRDocument,
  PODocument,
  PRDocument,
  PVDocument,
  PVPaymentDetails,
  RBDocument,
  RCDocument,
  UserRole,
} from '../src/types/document';
import {
  calculatePoTotal,
  calculatePvNet,
  calculateRcOutcome,
} from '../src/domain/calculations';
import { INITIAL_SEED_DOCUMENTS } from '../src/store/seed-data';
import type { StoredAttachment } from './storage';

export class DomainError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number = 400, code: string = 'DOMAIN_ERROR') {
    super(message);
    this.name = 'DomainError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export type VersionedDocument = AnyDocument & {
  version: number;
};

export interface OutboxJob {
  id: string;
  eventType:
    | 'DOCUMENT_SUBMITTED'
    | 'STAGE_APPROVED'
    | 'DOCUMENT_FULLY_APPROVED'
    | 'DOCUMENT_REJECTED'
    | 'PV_GENERATED'
    | 'PAYMENT_RECORDED';
  documentId: string;
  docNumber: string;
  payload: Record<string, unknown>;
  status: 'PENDING' | 'SENT' | 'FAILED';
  createdAt: string;
}

export interface DashboardMetrics {
  totalDocuments: number;
  draftCount: number;
  inReviewCount: number;
  approvedCount: number;
  paidCount: number;
  pendingForRoleCount: number;
  totalCommittedAmount: number;
  totalPaidAmount: number;
  outboxPendingCount: number;
  byDocType: Record<DocType, number>;
}

interface PersistedState {
  documents: VersionedDocument[];
  attachments: StoredAttachment[];
  outboxJobs: OutboxJob[];
  sequences: Record<string, number>;
  idempotencyCache: Record<string, unknown>;
}

const IAM_THRESHOLD_RUPIAH = 5_000_000;
const MAX_SYSTEM_AMOUNT_RUPIAH = 50_000_000;

export interface PvGenerationOptions {
  paymentDueDate?: string;
  plannedSourceAccount?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  purpose?: string;
  grossAmount?: number;
  pphDeduction?: number;
}

// shortcut: JSON file persistence in .data/db.json, swap to pg Pool with db/schema.sql when PostgreSQL instance is provisioned
export class ProcurementRepository {
  private readonly persistPath?: string;
  private readonly sqlitePath?: string;
  private state: PersistedState;

  constructor(options?: { persistPath?: string; sqlitePath?: string; seed?: boolean }) {
    this.persistPath = options?.persistPath;
    this.sqlitePath = options?.sqlitePath;
    const shouldSeed = options?.seed ?? true;

    if (this.sqlitePath && existsSync(this.sqlitePath)) {
      const db = new DatabaseSync(this.sqlitePath);
      const row = db.prepare('SELECT payload FROM workspace WHERE id = 1').get() as { payload: string } | undefined;
      db.close();
      if (!row) throw new Error('Database lokal tidak memiliki data workspace.');
      this.state = JSON.parse(row.payload) as PersistedState;
    } else if (this.persistPath && existsSync(this.persistPath)) {
      const raw = readFileSync(this.persistPath, 'utf8');
      this.state = JSON.parse(raw) as PersistedState;
    } else {
      const initialDocs: VersionedDocument[] = shouldSeed
        ? (structuredClone(INITIAL_SEED_DOCUMENTS) as AnyDocument[]).map((d) => ({
            ...d,
            ownerId: 'usr-pemohon-01',
            stage1ApproverEmail: 'atasan@blc.co.id',
            version: 1,
          }))
        : [];
      this.state = {
        documents: initialDocs,
        attachments: [],
        outboxJobs: [],
        sequences: {},
        idempotencyCache: {},
      };
      this.flush();
    }
    const seedIds = new Set(INITIAL_SEED_DOCUMENTS.map((document) => document.id));
    let changed = false;
    for (const document of this.state.documents) {
      if (document.branch.trim().toLowerCase() === 'pusat') { document.branch = 'Bekasi'; changed = true; }
      if (seedIds.has(document.id)) {
        if (!document.ownerId) { document.ownerId = 'usr-pemohon-01'; changed = true; }
        if (!document.stage1ApproverEmail) { document.stage1ApproverEmail = 'atasan@blc.co.id'; changed = true; }
      }
    }
    if (changed) this.flush();
  }

  private flush(): void {
    const cacheKeys = Object.keys(this.state.idempotencyCache);
    if (cacheKeys.length > 200) {
      for (const oldKey of cacheKeys.slice(0, cacheKeys.length - 200)) {
        delete this.state.idempotencyCache[oldKey];
      }
    }
    if (this.state.outboxJobs.length > 500) {
      this.state.outboxJobs = this.state.outboxJobs.slice(-500);
    }
    if (this.sqlitePath) {
      mkdirSync(dirname(this.sqlitePath), { recursive: true });
      const db = new DatabaseSync(this.sqlitePath);
      db.exec('CREATE TABLE IF NOT EXISTS workspace (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL)');
      db.prepare('INSERT INTO workspace (id, payload) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload').run(JSON.stringify(this.state));
      db.close();
      return;
    }
    if (!this.persistPath) return;
    const dir = dirname(this.persistPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(this.persistPath, JSON.stringify(this.state, null, 2), 'utf8');
  }

  private nextDocNumber(docType: DocType, now: Date = new Date()): string {
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const key = `${docType}-${ym}`;
    const existingMax = this.state.documents
      .filter((d) => d.docType === docType && d.docNumber.startsWith(`${key}-`))
      .reduce((max, d) => {
        const suffix = Number(d.docNumber.split('-')[2] || 0);
        return Number.isFinite(suffix) && suffix > max ? suffix : max;
      }, 0);

    const nextSeq = Math.max(this.state.sequences[key] ?? 0, existingMax) + 1;
    this.state.sequences[key] = nextSeq;
    return `${key}-${String(nextSeq).padStart(4, '0')}`;
  }

  private enqueueOutbox(
    eventType: OutboxJob['eventType'],
    doc: VersionedDocument,
    payload: Record<string, unknown>
  ): void {
    this.state.outboxJobs.push({
      id: randomUUID(),
      eventType,
      documentId: doc.id,
      docNumber: doc.docNumber,
      payload,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });
  }

  listDocuments(filters?: {
    docType?: DocType;
    status?: string;
    branch?: string;
    search?: string;
  }): VersionedDocument[] {
    let result = [...this.state.documents];
    if (filters?.docType) {
      result = result.filter((d) => d.docType === filters.docType);
    }
    if (filters?.status) {
      result = result.filter((d) => d.status === filters.status);
    }
    if (filters?.branch && filters.branch !== '*') {
      result = result.filter((d) => d.branch === filters.branch);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (d) =>
          d.docNumber.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q) ||
          d.purpose.toLowerCase().includes(q)
      );
    }
    return structuredClone(result);
  }

  getDocumentById(id: string): VersionedDocument {
    const doc = this.state.documents.find((d) => d.id === id);
    if (!doc) {
      throw new DomainError(`Dokumen dengan ID ${id} tidak ditemukan.`, 404, 'NOT_FOUND');
    }
    return structuredClone(doc);
  }

  listOutboxJobs(): OutboxJob[] {
    return structuredClone(this.state.outboxJobs);
  }

  listAttachments(documentId: string): StoredAttachment[] {
    return structuredClone(
      this.state.attachments.filter((a) => a.documentId === documentId)
    );
  }

  getAttachmentById(attachmentId: string): StoredAttachment {
    const att = this.state.attachments.find((a) => a.id === attachmentId);
    if (!att) {
      throw new DomainError(`Lampiran ${attachmentId} tidak ditemukan.`, 404, 'NOT_FOUND');
    }
    return structuredClone(att);
  }

  registerAttachment(attachment: StoredAttachment, actor: string): StoredAttachment {
    const doc = this.state.documents.find((d) => d.id === attachment.documentId);
    if (!doc) {
      throw new DomainError(
        `Dokumen ${attachment.documentId} tidak ditemukan untuk lampiran.`,
        404,
        'NOT_FOUND'
      );
    }

    this.state.attachments.push(attachment);
    doc.attachments = [...(doc.attachments ?? []), {
      id: attachment.id,
      name: attachment.originalName,
      size: attachment.sizeBytes,
      mimeType: attachment.mimeType,
      category: attachment.category === 'IAM_MEMO'
        ? 'IAM_MEMO'
        : attachment.category === 'QUOTATION'
        ? 'QUOTATION'
        : attachment.category === 'INVOICE'
        ? 'INVOICE'
        : attachment.category === 'RECEIPT'
        ? 'RECEIPT'
        : attachment.category === 'REFUND_PROOF'
        ? 'REFUND_PROOF'
        : attachment.category === 'PAYMENT_PROOF'
        ? 'PAYMENT_PROOF'
        : attachment.category === 'PHOTO'
        ? 'PHOTO'
        : attachment.category === 'BAST'
        ? 'BAST'
        : 'OTHER',
      uploadedAt: attachment.createdAt,
    }];
    if (doc.docType === 'RB') {
      doc.attachmentCount = this.state.attachments.filter(
        (a) => a.documentId === doc.id
      ).length;
    }

    doc.updatedAt = new Date().toISOString();
    doc.version += 1;
    doc.auditLog.push({
      id: randomUUID(),
      timestamp: doc.updatedAt,
      actor,
      action: 'UPLOAD_ATTACHMENT',
      comment: `Mengunggah lampiran ${attachment.category}: ${attachment.originalName}`,
    });

    this.flush();
    return structuredClone(attachment);
  }

  private normalizeCalculations(doc: VersionedDocument): void {
    if (doc.docType === 'PR') {
      if (Array.isArray(doc.items) && doc.items.length > 0) {
        doc.subtotalAmount = doc.items.reduce(
          (sum, item) => sum + Math.max(0, Math.round(Number(item.qty) || 0)) * Math.max(0, Math.round(Number(item.unitPrice) || 0)),
          0
        );
      }
      doc.subtotalAmount = Math.max(0, Math.round(Number(doc.subtotalAmount) || 0));
      doc.isIamRequired = doc.subtotalAmount >= IAM_THRESHOLD_RUPIAH;
      const calc = calculatePoTotal({ subtotal: doc.subtotalAmount, otherCosts: doc.otherCosts, discount: doc.discount, ppnRate: doc.ppnRate ?? 0, pphRate: doc.pphRate ?? 0 });
      doc.ppnAmount = calc.ppnAmount;
      doc.pphAmount = calc.pphAmount;
      doc.totalAmount = calc.totalAmount;
    } else if (doc.docType === 'PO') {
      if (Array.isArray(doc.items) && doc.items.length > 0) {
        doc.subtotal = doc.items.reduce(
          (sum, item) => sum + Math.max(0, Math.round(Number(item.qty) || 0)) * Math.max(0, Math.round(Number(item.unitPrice) || 0)),
          0
        );
      }
      const calc = calculatePoTotal({
        subtotal: doc.subtotal,
        otherCosts: doc.otherCosts,
        discount: doc.discount,
        ppnRate: doc.ppnRate,
        pphRate: doc.pphRate,
      });
      doc.subtotal = calc.subtotal;
      doc.otherCosts = calc.otherCosts;
      doc.discount = calc.discount;
      doc.ppnAmount = calc.ppnAmount;
      doc.pphAmount = calc.pphAmount;
      doc.totalAmount = calc.totalAmount;
    } else if (doc.docType === 'AV' && doc.subtotal !== undefined) {
      const calc = calculatePoTotal({ subtotal: doc.subtotal, otherCosts: doc.otherCosts, discount: doc.discount, ppnRate: doc.ppnRate ?? 0, pphRate: doc.pphRate ?? 0 });
      doc.amount = calc.totalAmount;
      doc.ppnAmount = calc.ppnAmount;
      doc.pphAmount = calc.pphAmount;
    } else if (doc.docType === 'RB') {
      const calc = calculatePoTotal({ subtotal: doc.subtotal, otherCosts: doc.otherCosts, discount: doc.discount, ppnRate: doc.ppnRate ?? 0, pphRate: doc.pphRate ?? 0 });
      doc.subtotal = calc.subtotal;
      doc.otherCosts = calc.otherCosts;
      doc.discount = calc.discount;
      doc.ppnAmount = calc.ppnAmount;
      doc.pphAmount = calc.pphAmount;
      doc.totalAmount = calc.totalAmount;
    } else if (doc.docType === 'RC') {
      if (
        doc.outcomeType === 'EXACT' &&
        (doc.subtotal === undefined || doc.subtotal === 0) &&
        (doc.realizedAmount === undefined || doc.realizedAmount === 0) &&
        doc.avOriginalAmount > 0
      ) {
        doc.subtotal = doc.avOriginalAmount;
        doc.realizedAmount = doc.avOriginalAmount;
      }
      const calc = calculateRcOutcome({
        avOriginalAmount: doc.avOriginalAmount,
        realizedAmount: doc.subtotal === undefined ? doc.realizedAmount : Math.max(0, doc.subtotal + (doc.otherCosts ?? 0) - (doc.discount ?? 0)),
      });
      doc.avOriginalAmount = calc.avOriginalAmount;
      doc.realizedAmount = calc.realizedAmount;
      doc.balanceAmount = calc.balanceAmount;
      doc.outcomeType = calc.outcomeType;
    } else if (doc.docType === 'PV') {
      const calc = calculatePvNet({
        grossAmount: doc.grossAmount,
        pphDeduction: doc.pphDeduction,
      });
      doc.grossAmount = calc.grossAmount;
      doc.pphDeduction = calc.pphDeduction;
      doc.netAmountToPay = calc.netAmountToPay;
    }
  }

  private assertPoPrCardinality(poDoc: PODocument): void {
    if (!poDoc.parentPrId) return;
    const duplicatePo = this.state.documents.find(
      (d) =>
        d.docType === 'PO' &&
        d.id !== poDoc.id &&
        (d as PODocument).parentPrId === poDoc.parentPrId
    );
    if (duplicatePo) {
      throw new DomainError(
        `Satu PR hanya dapat digunakan untuk satu PO. PR tersebut sudah dipakai pada ${duplicatePo.docNumber}.`,
        409,
        'DUPLICATE_PO_FOR_PR'
      );
    }
  }

  private assertRcCardinality(rcDoc: RCDocument): void {
    if (!rcDoc.parentAvId) {
      throw new DomainError(
        'Dokumen RC wajib memilih referensi Advance (parentAvId).',
        422,
        'RC_MISSING_PARENT_AV'
      );
    }

    const duplicateRc = this.state.documents.find(
      (d) =>
        d.docType === 'RC' &&
        d.id !== rcDoc.id &&
        (d as RCDocument).parentAvId === rcDoc.parentAvId
    );

    if (duplicateRc) {
      throw new DomainError(
        `Kardinalitas 1 AV : 1 RC dilanggar. Advance ${rcDoc.parentAvId} sudah memiliki dokumen RC aktif (${duplicateRc.docNumber}).`,
        409,
        'DUPLICATE_RC_FOR_AV'
      );
    }
  }

  private stripSystemFields(input: Record<string, unknown>): Record<string, unknown> {
    const {
      id: _id,
      docNumber: _docNumber,
      docType: _docType,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      auditLog: _auditLog,
      ownerId: _ownerId,
      attachments: _attachments,
      status: _status,
      currentStage: _currentStage,
      approvalSteps: _approvalSteps,
      version: _version,
      financeConfirmedAt: _financeConfirmedAt,
      paymentStatus: _paymentStatus,
      paymentDetails: _paymentDetails,
      expectedVersion: _expectedVersion,
      ...safe
    } = input;
    return safe;
  }

  createDocument(input: Partial<AnyDocument> & { docType: DocType }, actor: string): VersionedDocument {
    const nowIso = new Date().toISOString();
    const id = input.id || randomUUID();
    if (this.state.documents.some((document) => document.id === id)) {
      throw new DomainError('ID dokumen sudah digunakan.', 409, 'DUPLICATE_DOCUMENT');
    }
    const docNumber = this.nextDocNumber(input.docType);
    const safeInput = this.stripSystemFields(input as Record<string, unknown>);

    const base = {
      id,
      ownerId: input.ownerId,
      docNumber,
      docType: input.docType,
      title: input.title ?? '',
      branch: input.branch ?? 'Bekasi',
      purpose: input.purpose ?? '',
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
          id: randomUUID(),
          timestamp: nowIso,
          actor,
          action: 'CREATE_DRAFT',
          comment: 'Draf dokumen dibuat',
        },
      ],
      attachments: [],
      version: 1,
    };

    const merged = {
      ...safeInput,
      ...base,
    } as unknown as VersionedDocument;

    if (merged.docType === 'PO' && (merged as PODocument).parentPrId) {
      this.assertPoPrCardinality(merged as PODocument);
    }

    if (merged.docType === 'RC' && (merged as RCDocument).parentAvId) {
      this.assertRcCardinality(merged as RCDocument);
    }

    this.normalizeCalculations(merged);
    this.state.documents.unshift(merged);
    this.flush();
    return structuredClone(merged);
  }

  updateDocument(
    id: string,
    patch: Partial<AnyDocument> & { expectedVersion?: number },
    actor: string
  ): VersionedDocument {
    const idx = this.state.documents.findIndex((d) => d.id === id);
    if (idx < 0) {
      throw new DomainError(`Dokumen ${id} tidak ditemukan.`, 404, 'NOT_FOUND');
    }

    const current = this.state.documents[idx];
    if (
      patch.expectedVersion !== undefined &&
      patch.expectedVersion !== current.version
    ) {
      throw new DomainError(
        `Konflik konkurensi optimistik: versi dokumen saat ini adalah ${current.version}, tetapi permintaan mengirim expectedVersion ${patch.expectedVersion}.`,
        409,
        'VERSION_CONFLICT'
      );
    }

    if (current.status !== 'DRAFT') {
      throw new DomainError(
        `Dokumen berstatus ${current.status} terkunci dan tidak dapat diedit langsung.`,
        409,
        'DOCUMENT_LOCKED'
      );
    }

    const nowIso = new Date().toISOString();
    const safePatch = this.stripSystemFields(patch as Record<string, unknown>);

    const updated: VersionedDocument = {
      ...current,
      ...safePatch,
      id: current.id,
      ownerId: current.ownerId,
      docNumber: current.docNumber,
      docType: current.docType,
      status: current.status,
      currentStage: current.currentStage,
      approvalSteps: current.approvalSteps,
      createdAt: current.createdAt,
      updatedAt: nowIso,
      version: current.version + 1,
      auditLog: [
        ...current.auditLog,
        {
          id: randomUUID(),
          timestamp: nowIso,
          actor,
          action: 'UPDATE_DRAFT',
          comment: 'Draf dokumen diperbarui',
        },
      ],
    } as VersionedDocument;

    if (updated.docType === 'PO' && (updated as PODocument).parentPrId) {
      this.assertPoPrCardinality(updated as PODocument);
    }

    if (updated.docType === 'RC' && (updated as RCDocument).parentAvId) {
      this.assertRcCardinality(updated as RCDocument);
    }

    this.normalizeCalculations(updated);
    this.state.documents[idx] = updated;
    this.flush();
    return structuredClone(updated);
  }

  submitDocument(
    id: string,
    actor: string,
    options?: { expectedVersion?: number; idempotencyKey?: string }
  ): VersionedDocument {
    if (options?.idempotencyKey) {
      const cacheKey = `submit:${id}:${options.idempotencyKey}`;
      const cached = this.state.idempotencyCache[cacheKey] as VersionedDocument | undefined;
      if (cached) {
        return structuredClone(cached);
      }
    }

    const doc = this.state.documents.find((d) => d.id === id);
    if (!doc) {
      throw new DomainError(`Dokumen ${id} tidak ditemukan.`, 404, 'NOT_FOUND');
    }

    if (
      options?.expectedVersion !== undefined &&
      options.expectedVersion !== doc.version
    ) {
      throw new DomainError(
        `Konflik versi saat submit: versi dokumen=${doc.version}, expectedVersion=${options.expectedVersion}.`,
        409,
        'VERSION_CONFLICT'
      );
    }

    if (doc.status !== 'DRAFT') {
      throw new DomainError(
        `Hanya dokumen berstatus DRAFT yang dapat diajukan (status saat ini: ${doc.status}).`,
        409,
        'INVALID_STATUS_TRANSITION'
      );
    }

    if (doc.docType === 'GR') {
      const gr = doc as GRDocument;
      const parentPo = this.state.documents.find(
        (item): item is VersionedDocument & PODocument =>
          item.id === gr.parentPoId && item.docType === 'PO' && (item.status === 'APPROVED' || item.status === 'PAID')
      );
      if (!parentPo) {
        throw new DomainError('Laporan penerimaan (GR) wajib merujuk pada PO yang sudah disetujui.', 422, 'GR_INVALID_PARENT_PO');
      }
      if (!gr.receivedDate) {
        throw new DomainError('Tanggal penerimaan barang/jasa wajib diisi.', 422, 'GR_DATE_REQUIRED');
      }
      const requiredCat = gr.receiptType === 'SERVICE' ? 'BAST' : 'PHOTO';
      const hasAttachment =
        this.state.attachments.some((a) => a.documentId === doc.id && a.category === requiredCat) ||
        (doc.attachments ?? []).some((a) => a.category === requiredCat);
      if (!hasAttachment) {
        throw new DomainError(
          gr.receiptType === 'SERVICE'
            ? 'Laporan penerimaan Jasa wajib melampirkan berita acara serah terima (BAST_).'
            : 'Laporan penerimaan Barang wajib melampirkan foto barang (Photo_).',
          422,
          'GR_ATTACHMENT_REQUIRED'
        );
      }

      const now = new Date().toISOString();
      gr.parentPoNumber = parentPo.docNumber;
      gr.requiresFollowUp = gr.itemCondition !== 'BAIK';
      doc.status = 'APPROVED';
      doc.currentStage = 'BOD';
      doc.version += 1;
      doc.updatedAt = now;
      doc.auditLog.push({
        id: randomUUID(),
        timestamp: now,
        actor,
        action: 'SUBMIT_GR',
        comment: `Laporan penerimaan (${gr.receiptType === 'SERVICE' ? 'Jasa/BAST' : 'Barang/Foto'}) dicatat dengan kondisi: ${gr.itemCondition}${gr.itemCondition !== 'BAIK' ? ' [Perlu tindakan]' : ''}`,
      });
      this.enqueueOutbox('DOCUMENT_FULLY_APPROVED', doc, {
        actor,
        parentPoId: parentPo.id,
        itemCondition: gr.itemCondition,
        needsAction: gr.itemCondition !== 'BAIK',
      });
      this.flush();
      return structuredClone(doc);
    }

    if (doc.docType === 'AV' && !doc.activityEndDate) {
      throw new DomainError('Tanggal selesai kegiatan wajib diisi.', 422, 'AV_END_DATE_REQUIRED');
    }
    if (doc.docType === 'RB' && !this.state.attachments.some((attachment) => attachment.documentId === doc.id && attachment.category === 'RECEIPT')) {
      throw new DomainError('Bukti kuitansi atau struk wajib dilampirkan.', 422, 'RB_RECEIPT_REQUIRED');
    }
    const transferBank = doc.docType === 'PO' && doc.paymentMethod === 'BANK_TRANSFER' ? doc.bankDetails
      : doc.docType === 'AV' && doc.disbursementMethod === 'TRANSFER' ? doc.bankDetails
      : doc.docType === 'RB' && (doc.paymentMethod ?? 'BANK_TRANSFER') === 'BANK_TRANSFER' ? doc.beneficiaryBank
      : null;
    if (transferBank !== null && (!transferBank?.bankName?.trim() || !transferBank?.accountNumber?.trim() || !transferBank?.accountHolder?.trim())) {
      throw new DomainError('Rekening penerima transfer wajib diisi lengkap.', 422, 'BANK_REQUIRED');
    }

    if (doc.docType === 'PO') {
      if (/\brealisasi\b/i.test(doc.title) || /\brealisasi\b/i.test(doc.purpose)) {
        throw new DomainError(
          'Realisasi uang muka melalui PO tidak diterima lagi. Gunakan dokumen Realisasi Uang Muka (RC).',
          422,
          'PO_REALIZATION_FORBIDDEN'
        );
      }
      this.assertPoPrCardinality(doc as PODocument);

      if (doc.parentPrId) {
        const parentPr = this.state.documents.find(
          (item): item is VersionedDocument & PRDocument =>
            item.id === doc.parentPrId && item.docType === 'PR' && item.status === 'APPROVED'
        );
        if (!parentPr) {
          throw new DomainError('PR induk harus berstatus disetujui.', 422, 'INVALID_PARENT_PR');
        }
        if (doc.subtotal > parentPr.subtotalAmount) {
          throw new DomainError(
            `Nilai PO sebelum pajak (Rp ${doc.subtotal.toLocaleString('id-ID')}) tidak boleh melebihi nilai PR induk (Rp ${parentPr.subtotalAmount.toLocaleString('id-ID')}).`,
            422,
            'PO_EXCEEDS_PR_AMOUNT'
          );
        }
        if (parentPr.iamNumber?.trim()) {
          if (doc.iamNumber?.trim() && doc.iamNumber.trim() !== parentPr.iamNumber.trim()) {
            throw new DomainError('Nomor IAM pada PO harus sama dengan nomor IAM pada PR induk.', 422, 'PO_IAM_MISMATCH');
          }
          doc.iamNumber = parentPr.iamNumber;
        }
      } else if ((doc.poCategory ?? 'STANDARD') === 'STANDARD' && doc.subtotal >= IAM_THRESHOLD_RUPIAH) {
        throw new DomainError(
          'PO Pembelian Umum dengan nilai sebelum pajak >= Rp 5.000.000 wajib mengacu pada PR yang sudah disetujui.',
          422,
          'PO_PR_REQUIRED'
        );
      }
    }

    if (doc.docType === 'AV' && doc.parentPoId) {
      const parentPo = this.state.documents.find(
        (item): item is VersionedDocument & PODocument =>
          item.id === doc.parentPoId && item.docType === 'PO' && item.status === 'APPROVED'
      );
      if (!parentPo) {
        throw new DomainError('PO induk harus berstatus disetujui.', 422, 'INVALID_PARENT_PO');
      }
      const committedOnPo = this.getCommittedAmountOnPo(parentPo.id, doc.id);
      if (committedOnPo + doc.amount > parentPo.totalAmount) {
        throw new DomainError(
          'Jumlah AV dan PV untuk PO yang sama tidak boleh melebihi total PO.',
          422,
          'AV_EXCEEDS_PO_TOTAL'
        );
      }
    }

    // Validasi kardinalitas 1 AV : 1 RC saat submit
    if (doc.docType === 'RC') {
      this.assertRcCardinality(doc as RCDocument);
      const av = this.state.documents.find((item) => item.id === doc.parentAvId && item.docType === 'AV');
      const pv = this.state.documents.find((item): item is VersionedDocument & PVDocument => item.docType === 'PV' && item.sourceDocId === doc.parentAvId && item.paymentStatus === 'PAID');
      if (!av || av.ownerId !== doc.ownerId || av.status !== 'PAID' || !pv) {
        throw new DomainError('Pilih AV milik pengaju dengan PV yang sudah dibayar.', 422, 'RC_INVALID_AV');
      }
      doc.avOriginalAmount = pv.netAmountToPay;
    }
    this.normalizeCalculations(doc);

    const docTotalAmount = this.extractDocAmount(doc);
    if (docTotalAmount > MAX_SYSTEM_AMOUNT_RUPIAH) {
      throw new DomainError(
        `Nilai total pengajuan (Rp ${docTotalAmount.toLocaleString('id-ID')}) melebihi batas sistem Rp 50.000.000. Pengajuan di atas batas ini menggunakan prosedur manual.`,
        422,
        'EXCEEDS_SYSTEM_LIMIT'
      );
    }

    if (doc.docType === 'RC') {
      if (doc.outcomeType === 'SURPLUS' && !this.state.attachments.some((attachment) => attachment.documentId === doc.id && attachment.category === 'REFUND_PROOF')) {
        throw new DomainError('Lampiran bukti pengembalian dana wajib disertakan.', 422, 'RC_REFUND_PROOF_REQUIRED');
      }
      if (doc.outcomeType === 'DEFICIT' && (!doc.reimbursementBank?.bankName?.trim() || !doc.reimbursementBank?.accountNumber?.trim() || !doc.reimbursementBank?.accountHolder?.trim())) {
        throw new DomainError('Rekening penggantian wajib diisi lengkap.', 422, 'RC_BANK_REQUIRED');
      }
    }

    const now = new Date().toISOString();
    if (doc.docType === 'PV') {
      doc.status = 'IN_REVIEW';
      doc.currentStage = 'AYU';
      doc.version += 1;
      doc.updatedAt = now;

      doc.approvalSteps.atasan.status = 'APPROVED';
      doc.approvalSteps.atasan.decisionAt = now;
      doc.approvalSteps.atasan.comment = 'PV diajukan ulang oleh Keuangan';

      doc.approvalSteps.ayu.status = 'PENDING';
      doc.approvalSteps.ayu.decisionAt = undefined;
      doc.approvalSteps.ayu.comment = undefined;
    } else {
      doc.status = 'SUBMITTED';
      doc.currentStage = 'ATASAN';
      doc.version += 1;
      doc.updatedAt = now;

      doc.approvalSteps.atasan.status = 'PENDING';
      doc.approvalSteps.atasan.decisionAt = undefined;
      doc.approvalSteps.atasan.comment = undefined;

      doc.approvalSteps.ayu.status = 'WAITING';
      doc.approvalSteps.ayu.decisionAt = undefined;
      doc.approvalSteps.ayu.comment = undefined;
    }

    doc.approvalSteps.bod.heryStatus = 'WAITING';
    doc.approvalSteps.bod.heryDecisionAt = undefined;
    doc.approvalSteps.bod.heryComment = undefined;
    doc.approvalSteps.bod.hashimotoStatus = 'WAITING';
    doc.approvalSteps.bod.hashimotoDecisionAt = undefined;
    doc.approvalSteps.bod.hashimotoComment = undefined;

    doc.auditLog.push({
      id: randomUUID(),
      timestamp: now,
      actor,
      action: 'SUBMIT',
      comment: 'Pengajuan dokumen diserahkan untuk persetujuan Tahap 1 (Atasan Langsung)',
    });

    this.enqueueOutbox('DOCUMENT_SUBMITTED', doc, {
      actor,
      nextStage: 'ATASAN',
    });

    if (options?.idempotencyKey) {
      this.state.idempotencyCache[`submit:${id}:${options.idempotencyKey}`] =
        structuredClone(doc);
    }

    this.flush();
    return structuredClone(doc);
  }

  recordDecision(input: {
    documentId: string;
    role: UserRole;
    actor: string;
    decision: 'APPROVE' | 'REJECT';
    comment?: string;
    expectedVersion?: number;
    idempotencyKey?: string;
  }): VersionedDocument {
    if (input.idempotencyKey) {
      const cacheKey = `decision:${input.documentId}:${input.role}:${input.idempotencyKey}`;
      const cached = this.state.idempotencyCache[cacheKey] as VersionedDocument | undefined;
      if (cached) {
        return structuredClone(cached);
      }
    }

    const doc = this.state.documents.find((d) => d.id === input.documentId);
    if (!doc) {
      throw new DomainError(
        `Dokumen ${input.documentId} tidak ditemukan.`,
        404,
        'NOT_FOUND'
      );
    }

    if (
      input.expectedVersion !== undefined &&
      input.expectedVersion !== doc.version
    ) {
      throw new DomainError(
        `Konflik konkurensi optimistik: versi dokumen saat ini adalah ${doc.version}, tetapi expectedVersion=${input.expectedVersion}.`,
        409,
        'VERSION_CONFLICT'
      );
    }

    if (doc.status !== 'SUBMITTED' && doc.status !== 'IN_REVIEW') {
      throw new DomainError(
        `Dokumen ${doc.docNumber} tidak sedang dalam proses persetujuan (status: ${doc.status}).`,
        409,
        'INVALID_STAGE_STATE'
      );
    }

    // Validasi kesesuaian peran approver dengan currentStage aktif
    if (doc.currentStage === 'ATASAN' && input.role !== 'ATASAN') {
      throw new DomainError(
        `Tahap aktif saat ini adalah ATASAN, peran ${input.role} tidak berwenang mengambil keputusan.`,
        403,
        'FORBIDDEN_STAGE_ROLE'
      );
    }
    if (doc.currentStage === 'AYU' && input.role !== 'AYU') {
      throw new DomainError(
        `Tahap aktif saat ini adalah AYU, peran ${input.role} tidak berwenang mengambil keputusan.`,
        403,
        'FORBIDDEN_STAGE_ROLE'
      );
    }
    if (
      doc.currentStage === 'BOD' &&
      input.role !== 'BOD_HERY' &&
      input.role !== 'BOD_HASHIMOTO'
    ) {
      throw new DomainError(
        `Tahap aktif saat ini adalah BOD paralel, peran ${input.role} tidak berwenang mengambil keputusan.`,
        403,
        'FORBIDDEN_STAGE_ROLE'
      );
    }

    const now = new Date().toISOString();

    if (input.decision === 'REJECT') {
      const trimmedComment = input.comment?.trim() ?? '';
      if (!trimmedComment) {
        throw new DomainError(
          'Alasan penolakan (comment) wajib diisi saat menolak dokumen.',
          422,
          'REJECTION_COMMENT_REQUIRED'
        );
      }

      if (input.role === 'ATASAN') {
        doc.approvalSteps.atasan.status = 'REJECTED';
        doc.approvalSteps.atasan.decisionAt = now;
        doc.approvalSteps.atasan.comment = trimmedComment;
      } else if (input.role === 'AYU') {
        doc.approvalSteps.ayu.status = 'REJECTED';
        doc.approvalSteps.ayu.decisionAt = now;
        doc.approvalSteps.ayu.comment = trimmedComment;
      } else if (input.role === 'BOD_HERY') {
        doc.approvalSteps.bod.heryStatus = 'REJECTED';
        doc.approvalSteps.bod.heryDecisionAt = now;
        doc.approvalSteps.bod.heryComment = trimmedComment;
        if (doc.approvalSteps.bod.hashimotoStatus === 'PENDING') {
          doc.approvalSteps.bod.hashimotoStatus = 'WAITING';
        }
      } else if (input.role === 'BOD_HASHIMOTO') {
        doc.approvalSteps.bod.hashimotoStatus = 'REJECTED';
        doc.approvalSteps.bod.hashimotoDecisionAt = now;
        doc.approvalSteps.bod.hashimotoComment = trimmedComment;
        if (doc.approvalSteps.bod.heryStatus === 'PENDING') {
          doc.approvalSteps.bod.heryStatus = 'WAITING';
        }
      }

      // Reset ke DRAFT agar pemohon dapat merevisi dan mengajukan ulang
      doc.status = 'DRAFT';
      doc.version += 1;
      doc.updatedAt = now;
      doc.auditLog.push({
        id: randomUUID(),
        timestamp: now,
        actor: input.actor,
        action: 'REJECT',
        comment: trimmedComment,
      });

      this.enqueueOutbox('DOCUMENT_REJECTED', doc, {
        rejectedByRole: input.role,
        actor: input.actor,
        comment: trimmedComment,
      });
    } else {
      // APPROVE
      if (input.role === 'ATASAN') {
        doc.approvalSteps.atasan.status = 'APPROVED';
        doc.approvalSteps.atasan.decisionAt = now;
        doc.approvalSteps.atasan.comment = input.comment;
        doc.currentStage = 'AYU';
        doc.approvalSteps.ayu.status = 'PENDING';
        doc.status = 'IN_REVIEW';
      } else if (input.role === 'AYU') {
        doc.approvalSteps.ayu.status = 'APPROVED';
        doc.approvalSteps.ayu.decisionAt = now;
        doc.approvalSteps.ayu.comment = input.comment;
        doc.currentStage = 'BOD';
        doc.approvalSteps.bod.heryStatus = 'PENDING';
        doc.approvalSteps.bod.hashimotoStatus = 'PENDING';
        doc.status = 'IN_REVIEW';
      } else if (input.role === 'BOD_HERY') {
        if (doc.approvalSteps.bod.heryStatus === 'APPROVED') {
          throw new DomainError(
            'BOD Hery sudah menyetujui dokumen ini sebelumnya.',
            409,
            'ALREADY_APPROVED'
          );
        }
        doc.approvalSteps.bod.heryStatus = 'APPROVED';
        doc.approvalSteps.bod.heryDecisionAt = now;
        doc.approvalSteps.bod.heryComment = input.comment;
        doc.status =
          doc.approvalSteps.bod.hashimotoStatus === 'APPROVED'
            ? 'APPROVED'
            : 'IN_REVIEW';
      } else if (input.role === 'BOD_HASHIMOTO') {
        if (doc.approvalSteps.bod.hashimotoStatus === 'APPROVED') {
          throw new DomainError(
            'BOD Hashimoto sudah menyetujui dokumen ini sebelumnya.',
            409,
            'ALREADY_APPROVED'
          );
        }
        doc.approvalSteps.bod.hashimotoStatus = 'APPROVED';
        doc.approvalSteps.bod.hashimotoDecisionAt = now;
        doc.approvalSteps.bod.hashimotoComment = input.comment;
        doc.status =
          doc.approvalSteps.bod.heryStatus === 'APPROVED'
            ? 'APPROVED'
            : 'IN_REVIEW';
      }

      doc.version += 1;
      doc.updatedAt = now;
      doc.auditLog.push({
        id: randomUUID(),
        timestamp: now,
        actor: input.actor,
        action: 'APPROVE',
        comment: input.comment || 'Menyetujui dokumen',
      });

      this.enqueueOutbox(
        doc.status === 'APPROVED' ? 'DOCUMENT_FULLY_APPROVED' : 'STAGE_APPROVED',
        doc,
        {
          approvedByRole: input.role,
          actor: input.actor,
          newStatus: doc.status,
          currentStage: doc.currentStage,
        }
      );
    }

    if (input.idempotencyKey) {
      const cacheKey = `decision:${input.documentId}:${input.role}:${input.idempotencyKey}`;
      this.state.idempotencyCache[cacheKey] = structuredClone(doc);
    }

    this.flush();
    return structuredClone(doc);
  }

  private getCommittedAmountOnPo(poId: string, excludeDocId?: string): number {
    let total = 0;
    for (const d of this.state.documents) {
      if (d.id === excludeDocId || d.status === 'REJECTED') continue;
      if (d.docType === 'PV' && d.sourceDocId === poId && d.status !== 'DRAFT') {
        total += d.netAmountToPay;
      } else if (d.docType === 'AV' && d.parentPoId === poId && d.status !== 'DRAFT') {
        total += d.amount;
      }
    }
    return total;
  }

  generatePvFromSource(
    sourceDocId: string,
    actor: string,
    options?: PvGenerationOptions
  ): VersionedDocument & PVDocument {
    const source = this.state.documents.find((d) => d.id === sourceDocId);
    if (!source) {
      throw new DomainError(
        `Dokumen sumber ${sourceDocId} tidak ditemukan.`,
        404,
        'NOT_FOUND'
      );
    }

    if (source.status !== 'APPROVED') {
      throw new DomainError(
        'Payment Voucher hanya dapat dibuat dari dokumen yang telah disetujui penuh (APPROVED).',
        422,
        'SOURCE_NOT_APPROVED'
      );
    }

    let grossAmount = 0;
    let pphDeduction = 0;
    let payeeName = '';
    let bankDetails = { bankName: '', accountNumber: '', accountHolder: '' };
    let sourceDocType: 'PO' | 'AV' | 'RB' | 'RC_DEFICIT' = 'PO';
    let paymentMethod: 'BANK_TRANSFER' | 'CASH' = 'BANK_TRANSFER';

    if (source.docType === 'PO') {
      const po = source as PODocument;
      const fullGross = po.subtotal + po.otherCosts - po.discount + po.ppnAmount;
      const fullPph = po.pphAmount;
      const fullNet = po.totalAmount;
      const alreadyCommittedNet = this.getCommittedAmountOnPo(po.id);
      const remainingNet = fullNet - alreadyCommittedNet;

      if (remainingNet <= 0) {
        const existingPv = this.state.documents.find(
          (d) => d.docType === 'PV' && (d as PVDocument).sourceDocId === sourceDocId
        );
        throw new DomainError(
          `Payment Voucher untuk dokumen ${source.docNumber} sudah pernah dibuat (${existingPv?.docNumber ?? 'penuh'}).`,
          409,
          'DUPLICATE_PV_FOR_SOURCE'
        );
      }

      if (options?.grossAmount !== undefined && options.grossAmount > 0) {
        grossAmount = Math.round(Number(options.grossAmount));
        pphDeduction = Math.max(0, Math.round(Number(options.pphDeduction ?? 0)));
        const requestedNet = Math.max(0, grossAmount - pphDeduction);
        if (requestedNet > remainingNet) {
          throw new DomainError(
            `Jumlah PV dan AV untuk PO ${source.docNumber} tidak boleh melebihi sisa nilai PO (Rp ${remainingNet.toLocaleString('id-ID')}).`,
            422,
            'PV_EXCEEDS_SOURCE_AMOUNT'
          );
        }
      } else if (alreadyCommittedNet > 0) {
        grossAmount = remainingNet;
        pphDeduction = 0;
      } else {
        grossAmount = fullGross;
        pphDeduction = fullPph;
      }

      payeeName = po.vendorName;
      paymentMethod = po.paymentMethod;
      bankDetails = po.bankDetails || {
        bankName: '',
        accountNumber: '',
        accountHolder: po.vendorName,
      };
      sourceDocType = 'PO';
    } else {
      const existingPv = this.state.documents.find(
        (d) => d.docType === 'PV' && (d as PVDocument).sourceDocId === sourceDocId
      );
      if (existingPv) {
        throw new DomainError(
          `Payment Voucher untuk dokumen ${source.docNumber} sudah pernah dibuat (${existingPv.docNumber}).`,
          409,
          'DUPLICATE_PV_FOR_SOURCE'
        );
      }

      if (source.docType === 'AV') {
        const av = source as AVDocument;
        pphDeduction = av.pphAmount ?? 0;
        grossAmount = av.amount + pphDeduction;
        payeeName = av.bankDetails?.accountHolder || av.vendorName || av.title;
        paymentMethod = av.disbursementMethod === 'CASH' ? 'CASH' : 'BANK_TRANSFER';
        bankDetails = av.bankDetails || {
          bankName: '',
          accountNumber: '',
          accountHolder: payeeName,
        };
        sourceDocType = 'AV';
      } else if (source.docType === 'RB') {
        const rb = source as RBDocument;
        pphDeduction = rb.pphAmount ?? 0;
        grossAmount = rb.totalAmount + pphDeduction;
        paymentMethod = rb.paymentMethod ?? 'BANK_TRANSFER';
        payeeName = rb.beneficiaryBank.accountHolder || rb.vendorName || rb.title;
        bankDetails = rb.beneficiaryBank;
        sourceDocType = 'RB';
      } else if (source.docType === 'RC') {
        const rc = source as RCDocument;
        if (rc.outcomeType !== 'DEFICIT') {
          throw new DomainError(
            'PV hanya dapat dibuat dari dokumen RC yang berstatus DEFICIT (kekurangan dana).',
            422,
            'RC_NOT_DEFICIT'
          );
        }
        grossAmount = Math.abs(rc.balanceAmount);
        pphDeduction = 0;
        payeeName = rc.reimbursementBank?.accountHolder || 'Karyawan Pemohon';
        bankDetails = rc.reimbursementBank || {
          bankName: '',
          accountNumber: '',
          accountHolder: payeeName,
        };
        sourceDocType = 'RC_DEFICIT';
      } else {
        throw new DomainError(
          `Dokumen jenis ${source.docType} tidak dapat menghasilkan Payment Voucher secara langsung.`,
          422,
          'UNSUPPORTED_PV_SOURCE'
        );
      }
    }

    const { netAmountToPay } = calculatePvNet({ grossAmount, pphDeduction });
    const now = new Date().toISOString();
    const pvDocNumber = this.nextDocNumber('PV');
    const defaultDueDate =
      options?.paymentDueDate ||
      (source.docType === 'AV' ? source.paymentDueDate : source.docType === 'RB' ? source.paymentDueDate : undefined) ||
      now.slice(0, 10);

    const pvDoc: VersionedDocument & PVDocument = {
      id: randomUUID(),
      docNumber: pvDocNumber,
      docType: 'PV',
      title: `Payment Voucher untuk ${source.docNumber} - ${source.title}`,
      branch: source.branch,
      purpose: options?.purpose?.trim() || source.purpose,
      status: 'IN_REVIEW',
      createdAt: now,
      updatedAt: now,
      currentStage: 'AYU',
      approvalSteps: {
        atasan: {
          stage: 'ATASAN',
          label: 'Tahap 1: Staf Keuangan',
          assignedTo: actor,
          status: 'APPROVED',
          decisionAt: now,
          comment: 'PV diajukan oleh Keuangan',
        },
        ayu: {
          stage: 'AYU',
          label: 'Tahap 2: Bu Ayu (GM / Keuangan)',
          assignedTo: 'Bu Ayu',
          status: 'PENDING',
        },
        bod: {
          heryStatus: 'WAITING',
          hashimotoStatus: 'WAITING',
        },
      },
      sourceDocType,
      sourceDocId: source.id,
      sourceDocNumber: source.docNumber,
      vendorOrPayeeName: payeeName,
      beneficiaryBank: bankDetails,
      grossAmount,
      pphDeduction,
      netAmountToPay,
      paymentStatus: 'UNPAID',
      paymentMethod,
      paymentDueDate: defaultDueDate,
      plannedSourceAccount: options?.plannedSourceAccount?.trim() || 'BCA Operasional Pusat',
      invoiceNumber: options?.invoiceNumber?.trim() || undefined,
      invoiceDate: options?.invoiceDate || undefined,
      version: 1,
      auditLog: [
        {
          id: randomUUID(),
          timestamp: now,
          actor,
          action: 'GENERATE_PV',
          comment: `PV diajukan dari dokumen induk ${source.docNumber} (menunggu persetujuan Ayu -> Hery & Hashimoto)`,
        },
      ],
    };

    this.state.documents.unshift(pvDoc);
    this.enqueueOutbox('PV_GENERATED', pvDoc, {
      sourceDocId: source.id,
      sourceDocNumber: source.docNumber,
      netAmountToPay,
    });
    this.flush();
    return structuredClone(pvDoc);
  }

  confirmRcSettlement(id: string, actor: string): VersionedDocument {
    const doc = this.state.documents.find((item) => item.id === id);
    if (!doc || doc.docType !== 'RC') throw new DomainError('Dokumen RC tidak ditemukan.', 404, 'NOT_FOUND');
    if (doc.financeConfirmedAt) throw new DomainError('Realisasi sudah dikonfirmasi.', 409, 'ALREADY_CONFIRMED');
    if (doc.status !== 'APPROVED' && doc.status !== 'PAID') throw new DomainError('RC harus disetujui terlebih dahulu.', 422, 'RC_NOT_APPROVED');
    if (doc.outcomeType === 'SURPLUS' && !this.state.attachments.some((a) => a.documentId === id && a.category === 'REFUND_PROOF')) throw new DomainError('Bukti pengembalian wajib tersedia.', 422, 'RC_REFUND_PROOF_REQUIRED');
    if (doc.outcomeType === 'DEFICIT' && !this.state.documents.some((item) => item.docType === 'PV' && item.sourceDocId === id && item.paymentStatus === 'PAID')) throw new DomainError('PV selisih harus dibayar dahulu.', 422, 'RC_DEFICIT_UNPAID');
    const now = new Date().toISOString();
    doc.financeConfirmedAt = now;
    doc.updatedAt = now;
    doc.version += 1;
    doc.auditLog.push({ id: randomUUID(), timestamp: now, actor, action: 'RC_SETTLEMENT_CONFIRMED', comment: 'Penyelesaian realisasi dikonfirmasi Finance' });
    this.flush();
    return structuredClone(doc);
  }

  recordPvPayment(
    pvId: string,
    details: PVPaymentDetails,
    actor: string
  ): VersionedDocument & PVDocument {
    if (!details.sourceBank?.trim() || !details.referenceNumber?.trim()) {
      throw new DomainError(
        'Bank sumber (sourceBank) dan nomor referensi transfer (referenceNumber) wajib diisi.',
        422,
        'PAYMENT_DETAILS_REQUIRED'
      );
    }

    const pv = this.state.documents.find(
      (d) => d.id === pvId && d.docType === 'PV'
    ) as (VersionedDocument & PVDocument) | undefined;

    if (!pv) {
      throw new DomainError(`Payment Voucher ${pvId} tidak ditemukan.`, 404, 'NOT_FOUND');
    }

    if (pv.paymentStatus === 'PAID') {
      throw new DomainError(
        `Payment Voucher ${pv.docNumber} sudah berstatus PAID.`,
        409,
        'ALREADY_PAID'
      );
    }

    if (pv.status !== 'APPROVED') {
      throw new DomainError(
        `Payment Voucher ${pv.docNumber} harus disetujui penuh (Ayu -> Hery & Hashimoto) sebelum pembayaran dapat dicatat.`,
        422,
        'PV_NOT_APPROVED'
      );
    }

    if (
      details.paidAmount !== undefined &&
      Math.round(Number(details.paidAmount)) !== pv.netAmountToPay
    ) {
      throw new DomainError(
        `Nilai yang dibayarkan (Rp ${Math.round(Number(details.paidAmount)).toLocaleString('id-ID')}) harus sama persis dengan nilai Dibayarkan pada PV (Rp ${pv.netAmountToPay.toLocaleString('id-ID')}).`,
        422,
        'PAID_AMOUNT_MISMATCH'
      );
    }

    const now = new Date().toISOString();
    pv.paymentStatus = 'PAID';
    pv.status = 'PAID';
    pv.paymentDetails = {
      ...details,
      paidAmount: pv.netAmountToPay,
      paidAt: details.paidAt || now,
    };
    pv.version += 1;
    pv.updatedAt = now;

    pv.auditLog.push({
      id: randomUUID(),
      timestamp: now,
      actor,
      action: 'RECORD_PAYMENT',
      comment: `Pembayaran berhasil dicatat dan diverifikasi terhadap ${pv.docNumber}`,
    });

    if (pv.sourceDocId) {
      const sourceDoc = this.state.documents.find((d) => d.id === pv.sourceDocId);
      if (sourceDoc) {
        if (sourceDoc.docType === 'PO') {
          const paidOnPo = this.state.documents.reduce((sum, d) => {
            if (d.docType === 'PV' && d.sourceDocId === sourceDoc.id && d.paymentStatus === 'PAID') {
              return sum + d.netAmountToPay;
            }
            if (d.docType === 'AV' && d.parentPoId === sourceDoc.id && d.status === 'PAID') {
              return sum + d.amount;
            }
            return sum;
          }, 0);
          if (paidOnPo >= sourceDoc.totalAmount) {
            sourceDoc.status = 'PAID';
          }
        } else {
          sourceDoc.status = 'PAID';
          if (sourceDoc.docType === 'RC') {
            sourceDoc.financeConfirmedAt = now;
          }
        }
        sourceDoc.version += 1;
        sourceDoc.updatedAt = now;
        sourceDoc.auditLog.push({
          id: randomUUID(),
          timestamp: now,
          actor,
          action: 'PARENT_MARKED_PAID',
          comment: `Dokumen dilunasi melalui Payment Voucher ${pv.docNumber}`,
        });
      }
    }

    this.enqueueOutbox('PAYMENT_RECORDED', pv, {
      sourceDocId: pv.sourceDocId,
      referenceNumber: details.referenceNumber,
      sourceBank: details.sourceBank,
    });

    this.flush();
    return structuredClone(pv);
  }

  getDashboardMetrics(role: UserRole, userEmail?: string): DashboardMetrics {
    const byDocType: Record<DocType, number> = {
      PR: 0,
      PO: 0,
      AV: 0,
      RB: 0,
      RC: 0,
      GR: 0,
      PV: 0,
    };

    let draftCount = 0;
    let inReviewCount = 0;
    let approvedCount = 0;
    let paidCount = 0;
    let pendingForRoleCount = 0;
    let totalCommittedAmount = 0;
    let totalPaidAmount = 0;

    for (const doc of this.state.documents) {
      byDocType[doc.docType] = (byDocType[doc.docType] ?? 0) + 1;

      if (doc.status === 'DRAFT') draftCount++;
      else if (doc.status === 'SUBMITTED' || doc.status === 'IN_REVIEW') inReviewCount++;
      else if (doc.status === 'APPROVED') approvedCount++;
      else if (doc.status === 'PAID') paidCount++;

      // Hitung antrean spesifik peran
      if (doc.status === 'SUBMITTED' || doc.status === 'IN_REVIEW') {
        if (
          role === 'ATASAN' &&
          doc.approvalSteps.atasan.status === 'PENDING' &&
          (!userEmail || doc.stage1ApproverEmail?.toLowerCase() === userEmail.toLowerCase())
        ) {
          pendingForRoleCount++;
        } else if (role === 'AYU' && doc.approvalSteps.ayu.status === 'PENDING') {
          pendingForRoleCount++;
        } else if (
          role === 'BOD_HERY' &&
          doc.approvalSteps.bod.heryStatus === 'PENDING'
        ) {
          pendingForRoleCount++;
        } else if (
          role === 'BOD_HASHIMOTO' &&
          doc.approvalSteps.bod.hashimotoStatus === 'PENDING'
        ) {
          pendingForRoleCount++;
        }
      } else if (role === 'KEUANGAN') {
        if (
          (doc.docType === 'PV' && doc.status === 'APPROVED' && (doc as PVDocument).paymentStatus === 'UNPAID') ||
          (doc.docType !== 'PV' && doc.docType !== 'PR' && doc.docType !== 'GR' && doc.status === 'APPROVED')
        ) {
          pendingForRoleCount++;
        }
      }

      const amount = this.extractDocAmount(doc);
      if (doc.status === 'APPROVED' || doc.status === 'PAID') {
        totalCommittedAmount += amount;
      }
      if (doc.status === 'PAID') {
        totalPaidAmount += amount;
      }
    }

    return {
      totalDocuments: this.state.documents.length,
      draftCount,
      inReviewCount,
      approvedCount,
      paidCount,
      pendingForRoleCount,
      totalCommittedAmount,
      totalPaidAmount,
      outboxPendingCount: this.state.outboxJobs.filter((j) => j.status === 'PENDING')
        .length,
      byDocType,
    };
  }

  private extractDocAmount(doc: AnyDocument): number {
    switch (doc.docType) {
      case 'PR':
        return doc.totalAmount ?? doc.subtotalAmount;
      case 'PO':
        return doc.totalAmount;
      case 'AV':
        return doc.amount;
      case 'RB':
        return doc.totalAmount;
      case 'RC':
        return doc.realizedAmount;
      case 'GR':
        return 0;
      case 'PV':
        return doc.netAmountToPay;
    }
  }
}

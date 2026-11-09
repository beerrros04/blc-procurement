import type { AnyDocument } from '../types/document';
import { WORKSPACE_STORAGE_KEY } from './document-store';

export const INITIAL_SEED_DOCUMENTS: AnyDocument[] = [
  {
    id: 'seed-pr-01',
    docNumber: 'PR-202611-0001',
    docType: 'PR',
    title: 'Pengadaan Perlengkapan Workstation Tim IT',
    branch: 'Bekasi',
    purpose: 'Kebutuhan monitor dan aksesoris tim developer',
    status: 'DRAFT',
    createdAt: '2026-11-05T08:30:00.000Z',
    updatedAt: '2026-11-05T08:30:00.000Z',
    currentStage: 'ATASAN',
    budgetType: 'CAPEX',
    subtotalAmount: 12_500_000,
    isIamRequired: true,
    iamNumber: 'IAM-2026-0001',
    requiredDate: '2026-11-20',
    approvalSteps: {
      atasan: {
        stage: 'ATASAN',
        label: 'Tahap 1: Atasan Langsung',
        assignedTo: 'Atasan Langsung',
        status: 'WAITING',
      },
      ayu: {
        stage: 'AYU',
        label: 'Tahap 2: Bu Ayu (Verifikator Keuangan)',
        assignedTo: 'Bu Ayu',
        status: 'WAITING',
      },
      bod: {
        heryStatus: 'WAITING',
        hashimotoStatus: 'WAITING',
      },
    },
    auditLog: [
      {
        id: 'log-seed-1',
        timestamp: '2026-11-05T08:30:00.000Z',
        actor: 'Dewi Lestari (Pemohon Pusat)',
        action: 'CREATE_DRAFT',
        comment: 'Draf PR dibuat beserta lampiran IAM',
      },
    ],
    attachments: [
      {
        id: 'att-seed-pr01-1',
        name: 'IAM_PR_202611_0001_Workstation_IT.pdf',
        size: 428_500,
        mimeType: 'application/pdf',
        category: 'IAM_MEMO',
        uploadedAt: '2026-11-05T08:30:00.000Z',
      },
      {
        id: 'att-seed-pr01-2',
        name: 'Quotation_Monitor_Dell_27Inch.pdf',
        size: 315_200,
        mimeType: 'application/pdf',
        category: 'QUOTATION',
        uploadedAt: '2026-11-05T08:31:00.000Z',
      },
    ],
  },
  {
    id: 'seed-pr-02',
    docNumber: 'PR-202611-0002',
    docType: 'PR',
    title: 'Pengadaan Genset Cadangan Cabang Surabaya',
    branch: 'Surabaya',
    purpose: 'Menjamin ketersediaan daya saat pemadaman bergilir',
    status: 'APPROVED',
    createdAt: '2026-11-01T09:00:00.000Z',
    updatedAt: '2026-11-03T14:20:00.000Z',
    currentStage: 'BOD',
    budgetType: 'CAPEX',
    subtotalAmount: 25_000_000,
    isIamRequired: true,
    iamNumber: 'IAM-2026-0002',
    requiredDate: '2026-11-15',
    approvalSteps: {
      atasan: {
        stage: 'ATASAN',
        label: 'Tahap 1: Atasan Langsung',
        assignedTo: 'Pak Hendra (Kacab Surabaya)',
        status: 'APPROVED',
        decisionAt: '2026-11-01T11:00:00.000Z',
        comment: 'Sangat dibutuhkan untuk operasional lelang',
      },
      ayu: {
        stage: 'AYU',
        label: 'Tahap 2: Bu Ayu',
        assignedTo: 'Bu Ayu',
        status: 'APPROVED',
        decisionAt: '2026-11-02T10:15:00.000Z',
        comment: 'Anggaran CAPEX cabang tersedia',
      },
      bod: {
        heryStatus: 'APPROVED',
        heryDecisionAt: '2026-11-03T09:30:00.000Z',
        heryComment: 'Disetujui',
        hashimotoStatus: 'APPROVED',
        hashimotoDecisionAt: '2026-11-03T14:20:00.000Z',
        hashimotoComment: 'Approved, please proceed to PO',
      },
    },
    auditLog: [
      {
        id: 'log-seed-2a',
        timestamp: '2026-11-01T09:00:00.000Z',
        actor: 'Staff Surabaya',
        action: 'SUBMIT',
        comment: 'Pengajuan PR diserahkan',
      },
      {
        id: 'log-seed-2b',
        timestamp: '2026-11-01T11:00:00.000Z',
        actor: 'Pak Hendra (Atasan)',
        action: 'APPROVE_ATASAN',
        comment: 'Sangat dibutuhkan untuk operasional lelang',
      },
      {
        id: 'log-seed-2c',
        timestamp: '2026-11-02T10:15:00.000Z',
        actor: 'Bu Ayu (Verifikator)',
        action: 'APPROVE_AYU',
        comment: 'Anggaran CAPEX cabang tersedia',
      },
      {
        id: 'log-seed-2d',
        timestamp: '2026-11-03T09:30:00.000Z',
        actor: 'Pak Hery (BoD)',
        action: 'APPROVE_BOD_HERY',
        comment: 'Disetujui',
      },
      {
        id: 'log-seed-2e',
        timestamp: '2026-11-03T14:20:00.000Z',
        actor: 'Koji Hashimoto (BoD)',
        action: 'APPROVE_BOD_HASHIMOTO',
        comment: 'Approved, please proceed to PO',
      },
    ],
    attachments: [
      {
        id: 'att-seed-pr02-1',
        name: 'IAM_Genset_Surabaya_Signed.pdf',
        size: 612_400,
        mimeType: 'application/pdf',
        category: 'IAM_MEMO',
        uploadedAt: '2026-11-01T09:00:00.000Z',
      },
      {
        id: 'att-seed-pr02-2',
        name: 'Perbandingan_3_Vendor_Genset_15kVA.pdf',
        size: 894_100,
        mimeType: 'application/pdf',
        category: 'QUOTATION',
        uploadedAt: '2026-11-01T09:02:00.000Z',
      },
    ],
  },
  {
    id: 'seed-po-01',
    docNumber: 'PO-202611-0001',
    docType: 'PO',
    parentPrId: 'seed-pr-02',
    title: 'PO: Pembelian Genset Silent 15kVA',
    branch: 'Surabaya',
    purpose: 'Pemesanan pengadaan genset dari PR-202611-0002',
    budgetType: 'CAPEX',
    iamNumber: 'IAM-2026-0002',
    status: 'IN_REVIEW',
    createdAt: '2026-11-04T10:00:00.000Z',
    updatedAt: '2026-11-04T15:30:00.000Z',
    currentStage: 'AYU',
    poCategory: 'STANDARD',
    vendorName: 'PT Sumber Daya Listrik Mandiri',
    paymentMethod: 'BANK_TRANSFER',
    bankDetails: {
      bankName: 'BCA',
      accountNumber: '8291029182',
      accountHolder: 'PT Sumber Daya Listrik Mandiri',
    },
    subtotal: 25_000_000,
    otherCosts: 500_000,
    discount: 500_000,
    ppnRate: 0.11,
    ppnAmount: 2_750_000,
    pphRate: 0.02,
    pphAmount: 500_000,
    totalAmount: 27_250_000,
    approvalSteps: {
      atasan: {
        stage: 'ATASAN',
        label: 'Tahap 1: Atasan Langsung',
        assignedTo: 'Pak Hendra',
        status: 'APPROVED',
        decisionAt: '2026-11-04T15:30:00.000Z',
        comment: 'Vendor rekanan resmi',
      },
      ayu: {
        stage: 'AYU',
        label: 'Tahap 2: Bu Ayu',
        assignedTo: 'Bu Ayu',
        status: 'PENDING',
      },
      bod: {
        heryStatus: 'WAITING',
        hashimotoStatus: 'WAITING',
      },
    },
    auditLog: [
      {
        id: 'log-seed-po1',
        timestamp: '2026-11-04T10:00:00.000Z',
        actor: 'Dewi Lestari (Pemohon)',
        action: 'SUBMIT',
        comment: 'PO diajukan untuk persetujuan',
      },
      {
        id: 'log-seed-po2',
        timestamp: '2026-11-04T15:30:00.000Z',
        actor: 'Pak Hendra (Atasan)',
        action: 'APPROVE_ATASAN',
        comment: 'Vendor rekanan resmi',
      },
    ],
    attachments: [
      {
        id: 'att-seed-po01-1',
        name: 'Quotation_Final_PT_Sumber_Daya_Listrik.pdf',
        size: 518_000,
        mimeType: 'application/pdf',
        category: 'QUOTATION',
        uploadedAt: '2026-11-04T10:00:00.000Z',
      },
    ],
  },
  {
    id: 'seed-av-01',
    docNumber: 'AV-202611-0001',
    docType: 'AV',
    title: 'Uang Muka Perjalanan Dinas Audit Semarang',
    branch: 'Semarang',
    purpose: 'Tiket, penginapan 3 malam, dan operasional audit',
    status: 'PAID',
    createdAt: '2026-10-28T09:00:00.000Z',
    updatedAt: '2026-10-31T11:00:00.000Z',
    currentStage: 'BOD',
    amount: 4_500_000,
    activityDate: '2026-11-02',
    paymentDueDate: '2026-10-31',
    disbursementMethod: 'TRANSFER',
    bankDetails: {
      bankName: 'Mandiri',
      accountNumber: '13700192812',
      accountHolder: 'Rudi Hartono (Auditor)',
    },
    approvalSteps: {
      atasan: {
        stage: 'ATASAN',
        label: 'Tahap 1: Atasan',
        assignedTo: 'Kepala Satuan Pengawas',
        status: 'APPROVED',
        decisionAt: '2026-10-28T13:00:00.000Z',
        comment: 'Sesuai jadwal audit triwulan',
      },
      ayu: {
        stage: 'AYU',
        label: 'Tahap 2: Bu Ayu',
        assignedTo: 'Bu Ayu',
        status: 'APPROVED',
        decisionAt: '2026-10-29T10:00:00.000Z',
        comment: 'Plafon perjalanan dinas sesuai ketentuan',
      },
      bod: {
        heryStatus: 'APPROVED',
        heryDecisionAt: '2026-10-30T09:00:00.000Z',
        heryComment: 'OK',
        hashimotoStatus: 'APPROVED',
        hashimotoDecisionAt: '2026-10-30T14:00:00.000Z',
        hashimotoComment: 'Approved',
      },
    },
    auditLog: [
      {
        id: 'log-seed-av1',
        timestamp: '2026-10-31T11:00:00.000Z',
        actor: 'Erika Ayu Fitriana (Keuangan)',
        action: 'RECORD_PAYMENT',
        comment: 'Dana uang muka ditransfer melalui PV-202610-0082',
      },
    ],
    attachments: [
      {
        id: 'att-seed-av01-1',
        name: 'Surat_Tugas_dan_Estimasi_Biaya_Audit_Semarang.pdf',
        size: 274_300,
        mimeType: 'application/pdf',
        category: 'OTHER',
        uploadedAt: '2026-10-28T09:00:00.000Z',
      },
      {
        id: 'att-seed-av01-2',
        name: 'Bukti_Transfer_Mandiri_AV_202611_0001.pdf',
        size: 198_400,
        mimeType: 'application/pdf',
        category: 'PAYMENT_PROOF',
        uploadedAt: '2026-10-31T11:00:00.000Z',
      },
    ],
  },
  {
    id: 'seed-rb-01',
    docNumber: 'RB-202611-0001',
    docType: 'RB',
    title: 'Penggantian Konsumsi Lembur & Jamuan Klien',
    branch: 'Bekasi',
    purpose: 'Konsumsi meeting kerja sama leasing lelang',
    status: 'SUBMITTED',
    createdAt: '2026-11-06T14:00:00.000Z',
    updatedAt: '2026-11-06T14:00:00.000Z',
    currentStage: 'ATASAN',
    expenseCategory: 'KONSUMSI',
    transactionDate: '2026-11-05',
    subtotal: 750_000,
    otherCosts: 0,
    discount: 0,
    totalAmount: 750_000,
    beneficiaryBank: {
      bankName: 'BCA',
      accountNumber: '502910291',
      accountHolder: 'Dewi Lestari',
    },
    attachmentCount: 2,
    approvalSteps: {
      atasan: {
        stage: 'ATASAN',
        label: 'Tahap 1: Atasan Langsung',
        assignedTo: 'Manajer Operasional',
        status: 'PENDING',
      },
      ayu: {
        stage: 'AYU',
        label: 'Tahap 2: Bu Ayu',
        assignedTo: 'Bu Ayu',
        status: 'WAITING',
      },
      bod: {
        heryStatus: 'WAITING',
        hashimotoStatus: 'WAITING',
      },
    },
    auditLog: [
      {
        id: 'log-seed-rb1',
        timestamp: '2026-11-06T14:00:00.000Z',
        actor: 'Dewi Lestari (Pemohon)',
        action: 'SUBMIT',
        comment: 'Klaim reimbursement diajukan',
      },
    ],
    attachments: [
      {
        id: 'att-seed-rb01-1',
        name: 'Struk_Konsumsi_Meeting_Leasing_05Nov.jpg',
        size: 342_000,
        mimeType: 'image/jpeg',
        category: 'RECEIPT',
        uploadedAt: '2026-11-06T14:00:00.000Z',
      },
      {
        id: 'att-seed-rb01-2',
        name: 'Daftar_Hadir_Peserta_Meeting_Leasing.pdf',
        size: 156_000,
        mimeType: 'application/pdf',
        category: 'OTHER',
        uploadedAt: '2026-11-06T14:01:00.000Z',
      },
    ],
  },
];

export function ensureSeedDataLoaded(storage: Storage): void {
  const existing = storage.getItem(WORKSPACE_STORAGE_KEY);
  if (!existing || existing === '[]') {
    storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(INITIAL_SEED_DOCUMENTS));
    return;
  }
  try {
    const parsed = JSON.parse(existing) as AnyDocument[];
    let updated = false;
    const merged = parsed.map((doc) => {
      const seedMatch = INITIAL_SEED_DOCUMENTS.find((s) => s.id === doc.id);
      if (seedMatch && (!doc.attachments || doc.attachments.length === 0) && seedMatch.attachments) {
        updated = true;
        return { ...doc, attachments: seedMatch.attachments };
      }
      return doc;
    });
    if (updated) {
      storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(merged));
    }
  } catch {
    // Ignore parse errors
  }
}

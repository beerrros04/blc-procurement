import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
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
describe('Operations Navigation Role Filter (Elera Spec)', () => {
  it('opens a view available to each role', async () => {
    const { getInitialWorkspaceTab } = await import('./main');
    expect(getInitialWorkspaceTab('ADMIN')).toBe('DASHBOARD');
    expect(getInitialWorkspaceTab('AYU')).toBe('DASHBOARD');
    expect(getInitialWorkspaceTab('ATASAN')).toBe('PENGAJUAN');
    expect(getInitialWorkspaceTab('KEUANGAN')).toBe('PENGAJUAN');
  });

  it('PEMOHON sees only Pengajuan under Operations', async () => {
    const { getVisibleOperationsNav } = await import('./main');
    const nav = getVisibleOperationsNav('PEMOHON');
    expect(nav.map((n) => n.id)).toEqual(['PENGAJUAN']);
  });

  it('ATASAN sees only Pengajuan under Operations', async () => {
    const { getVisibleOperationsNav } = await import('./main');
    const nav = getVisibleOperationsNav('ATASAN');
    expect(nav.map((n) => n.id)).toEqual(['PENGAJUAN']);
  });

  it('ADMIN, AYU, and BOD see Dashboard, Pengajuan, and Dokumen', async () => {
    const { getVisibleOperationsNav } = await import('./main');
    expect(getVisibleOperationsNav('ADMIN').map((n) => n.id)).toEqual(['DASHBOARD', 'PENGAJUAN', 'DOKUMEN']);
    expect(getVisibleOperationsNav('AYU').map((n) => n.id)).toEqual(['DASHBOARD', 'PENGAJUAN', 'DOKUMEN']);
    expect(getVisibleOperationsNav('BOD_HERY').map((n) => n.id)).toEqual(['DASHBOARD', 'PENGAJUAN', 'DOKUMEN']);
    expect(getVisibleOperationsNav('BOD_HASHIMOTO').map((n) => n.id)).toEqual(['DASHBOARD', 'PENGAJUAN', 'DOKUMEN']);
  });

  it('KEUANGAN sees Pengajuan and Dokumen', async () => {
    const { getVisibleOperationsNav } = await import('./main');
    const nav = getVisibleOperationsNav('KEUANGAN');
    expect(nav.map((n) => n.id)).toEqual(['PENGAJUAN', 'DOKUMEN']);
  });
});

describe('Topbar Header Simplification (Feedback 3)', () => {
  it('renders clean workspace tab title without branch or roleTitle badges', async () => {
    const { Topbar } = await import('./main');
    const html = renderToStaticMarkup(
      createElement(Topbar, {
        activeTab: 'PENGAJUAN',
        onOpenExport: () => {},
      })
    );
    expect(html).toContain('Pengajuan &amp; Pelacakan Alur');
    expect(html).not.toContain('Bekasi');
    expect(html).not.toContain('Staff Pemohon');
    expect(html).not.toContain('s-badge');
    expect(html).toContain('font-size:18px');
  });

  it('renders corresponding title for other workspace tabs', async () => {
    const { Topbar } = await import('./main');
    expect(
      renderToStaticMarkup(
        createElement(Topbar, { activeTab: 'DASHBOARD', onOpenExport: () => {} })
      )
    ).toContain('Cockpit Eksekutif &amp; Telemetry');
    expect(
      renderToStaticMarkup(
        createElement(Topbar, { activeTab: 'REGISTER', onOpenExport: () => {} })
      )
    ).toContain('Approval Register');
    expect(
      renderToStaticMarkup(
        createElement(Topbar, { activeTab: 'HISTORY', onOpenExport: () => {} })
      )
    ).toContain('Approval History');
    expect(
      renderToStaticMarkup(
        createElement(Topbar, { activeTab: 'DOCS', onOpenExport: () => {} })
      )
    ).toContain('Approval Docs');
    expect(
      renderToStaticMarkup(
        createElement(Topbar, { activeTab: 'ALL', onOpenExport: () => {} })
      )
    ).toContain('Dokumen Pengadaan');
  });
});

describe('Task 5: End-to-End Role Integration, Tagged Approver Selection, and Direct Submission', () => {
  it('approver dropdown defaults to atasan@blc.co.id and renders dual submit buttons in all forms', async () => {
    const { FormPR } = await import('./components/forms/FormPR');
    const { FormPO } = await import('./components/forms/FormPO');
    const { FormAV } = await import('./components/forms/FormAV');
    const { FormRB } = await import('./components/forms/FormRB');
    const { FormRC } = await import('./components/forms/FormRC');

    const prHtml = renderToStaticMarkup(
      createElement(FormPR, {
        initialDoc: createEmptyDocument('PR') as PRDocument,
        onSave: () => {},
        onClose: () => {},
      })
    );
    expect(prHtml).toContain('id="pr-approver"');
    expect(prHtml).toContain('Pak Hendra (Atasan Langsung) - atasan@blc.co.id');
    expect(prHtml).toContain('Ayu Martina (GM / Penyetuju Tahap 2) - ayu@blc.co.id');
    expect(prHtml).toContain('Simpan Draf');
    expect(prHtml).toContain('Ajukan ke Atasan Langsung');

    const poHtml = renderToStaticMarkup(
      createElement(FormPO, {
        initialDoc: createEmptyDocument('PO') as PODocument,
        availablePrs: [],
        onSave: () => {},
        onClose: () => {},
      })
    );
    expect(poHtml).toContain('id="po-approver"');
    expect(poHtml).toContain('Pak Hendra (Atasan Langsung) - atasan@blc.co.id');
    expect(poHtml).toContain('Simpan Draf');
    expect(poHtml).toContain('Ajukan ke Atasan Langsung');

    const avHtml = renderToStaticMarkup(
      createElement(FormAV, {
        initialDoc: createEmptyDocument('AV') as AVDocument,
        availablePos: [],
        onSave: () => {},
        onClose: () => {},
      })
    );
    expect(avHtml).toContain('id="av-approver"');
    expect(avHtml).toContain('Pak Hendra (Atasan Langsung) - atasan@blc.co.id');
    expect(avHtml).toContain('Simpan Draf');
    expect(avHtml).toContain('Ajukan ke Atasan Langsung');

    const rbHtml = renderToStaticMarkup(
      createElement(FormRB, {
        initialDoc: createEmptyDocument('RB') as any,
        onSave: () => {},
        onClose: () => {},
      })
    );
    expect(rbHtml).toContain('id="rb-approver"');
    expect(rbHtml).toContain('Pak Hendra (Atasan Langsung) - atasan@blc.co.id');
    expect(rbHtml).toContain('Simpan Draf');
    expect(rbHtml).toContain('Ajukan ke Atasan Langsung');

    const rcHtml = renderToStaticMarkup(
      createElement(FormRC, {
        initialDoc: createEmptyDocument('RC') as RCDocument,
        availableAvs: [],
        onSave: () => {},
        onClose: () => {},
      })
    );
    expect(rcHtml).toContain('id="rc-approver"');
    expect(rcHtml).toContain('Pak Hendra (Atasan Langsung) - atasan@blc.co.id');
    expect(rcHtml).toContain('Simpan Draf');
    expect(rcHtml).toContain('Ajukan ke Atasan Langsung');
  });

  it('submitting a draft document transitions status to SUBMITTED / IN_REVIEW with Stage 1 assigned to Hendra', async () => {
    const storage = new MemoryStorage();
    const pr = createEmptyDocument('PR', 'Pusat') as PRDocument;
    pr.title = 'Pengadaan Meja Operasional';
    pr.subtotalAmount = 3_000_000;
    pr.stage1ApproverEmail = 'atasan@blc.co.id';
    saveDocument(storage, pr);

    const submitted = submitDocument(storage, pr.id, 'Dewi Pemohon');
    expect(submitted.status).toBe('SUBMITTED');
    expect(submitted.currentStage).toBe('ATASAN');
    expect(submitted.stage1ApproverEmail).toBe('atasan@blc.co.id');
    expect(submitted.approvalSteps.atasan.status).toBe('PENDING');
    expect(submitted.approvalSteps.atasan.assignedTo).toBe('Atasan Langsung');
    expect(submitted.approvalSteps.ayu.status).toBe('WAITING');

    const { ProcurementRepository } = await import('../server/repository');
    const repo = new ProcurementRepository({ seed: false });
    const repoDoc = repo.createDocument(
      {
        docType: 'PR',
        title: 'Pengadaan Laptop Operasional',
        branch: 'Bekasi',
        subtotalAmount: 10_000_000,
        stage1ApproverEmail: 'atasan@blc.co.id',
      },
      'Dewi Pemohon'
    );
    const repoSubmitted = repo.submitDocument(repoDoc.id, 'Dewi Pemohon');
    expect(repoSubmitted.status).toBe('SUBMITTED');
    expect(repoSubmitted.currentStage).toBe('ATASAN');
    expect(repoSubmitted.approvalSteps.atasan.assignedTo).toBe('Pak Hendra');
    expect(repoSubmitted.approvalSteps.atasan.status).toBe('PENDING');
  });

  it('quick test role switcher in Topbar renders all 7 corporate accounts and switches active user tabs', async () => {
    const { Topbar, CORPORATE_ACCOUNTS, getInitialWorkspaceTab, getVisibleOperationsNav } = await import('./main');

    let switchedEmail = '';
    const topbarHtml = renderToStaticMarkup(
      createElement(Topbar, {
        activeTab: 'PENGAJUAN',
        onOpenExport: () => {},
        currentUserEmail: 'pemohon@blc.co.id',
        onSwitchAccount: (email: string) => { switchedEmail = email; },
      })
    );

    expect(topbarHtml).toContain('test-role-switcher');
    expect(topbarHtml).toContain('aria-label="Ganti Peran Uji"');
    expect(topbarHtml).toContain('value="pemohon@blc.co.id"');

    for (const acc of CORPORATE_ACCOUNTS) {
      expect(topbarHtml).toContain(acc.email);
      expect(topbarHtml).toContain(acc.name);
      expect(topbarHtml).toContain(acc.roleTitle);
    }

    // Role tab navigation tests
    expect(getInitialWorkspaceTab('PEMOHON')).toBe('PENGAJUAN');
    expect(getVisibleOperationsNav('PEMOHON').map((n) => n.id)).toEqual(['PENGAJUAN']);

    expect(getInitialWorkspaceTab('ATASAN')).toBe('PENGAJUAN');
    expect(getVisibleOperationsNav('ATASAN').map((n) => n.id)).toEqual(['PENGAJUAN']);

    expect(getInitialWorkspaceTab('AYU')).toBe('DASHBOARD');
    expect(getVisibleOperationsNav('AYU').map((n) => n.id)).toEqual(['DASHBOARD', 'PENGAJUAN', 'DOKUMEN']);

    expect(getInitialWorkspaceTab('BOD_HERY')).toBe('DASHBOARD');
    expect(getVisibleOperationsNav('BOD_HERY').map((n) => n.id)).toEqual(['DASHBOARD', 'PENGAJUAN', 'DOKUMEN']);

    expect(getInitialWorkspaceTab('BOD_HASHIMOTO')).toBe('DASHBOARD');
    expect(getVisibleOperationsNav('BOD_HASHIMOTO').map((n) => n.id)).toEqual(['DASHBOARD', 'PENGAJUAN', 'DOKUMEN']);

    expect(getInitialWorkspaceTab('KEUANGAN')).toBe('PENGAJUAN');
    expect(getVisibleOperationsNav('KEUANGAN').map((n) => n.id)).toEqual(['PENGAJUAN', 'DOKUMEN']);

    expect(getInitialWorkspaceTab('ADMIN')).toBe('DASHBOARD');
    expect(getVisibleOperationsNav('ADMIN').map((n) => n.id)).toEqual(['DASHBOARD', 'PENGAJUAN', 'DOKUMEN']);
  });

  it('enhanced login page renders informative role descriptions for quick account cards', async () => {
    const { SignInPage } = await import('./components/ui/sign-in');
    const { CORPORATE_ACCOUNTS, ROLE_DESCRIPTIONS } = await import('./main');

    const signInHtml = renderToStaticMarkup(
      createElement(SignInPage, {
        title: 'Portal Pengadaan & Keuangan',
        quickAccounts: CORPORATE_ACCOUNTS.map((a) => ({
          label: a.name,
          email: a.email,
          roleBadge: a.role,
          description: ROLE_DESCRIPTIONS[a.role],
        })),
      })
    );

    expect(signInHtml).toContain('Staff Pemohon: Pengajuan dokumen baru PR/PO/AV/RB/RC');
    expect(signInHtml).toContain('Atasan Tahap 1: Approval awal permohonan staf cabang');
    expect(signInHtml).toContain('GM: Approval Tahap 2 &amp; Operasional Pengadaan');
    expect(signInHtml).toContain('Direksi BoD: Otorisasi final dokumen material &amp; strategis');
    expect(signInHtml).toContain('Keuangan: Verifikasi, penerbitan PV, dan pembayaran');
    expect(signInHtml).toContain('Administrator: Akses penuh seluruh modul dan sistem');
  });
});

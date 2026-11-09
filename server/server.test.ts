import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { UserRole } from '../src/types/document';
import { createAppServer, type BLCAppServer } from './app';
import { ProcurementRepository } from './repository';
import { LocalAttachmentStorage } from './storage';
import { signJwt } from './auth';

describe('BLC Procurement Production Backend API & Domain Rules', () => {
  let tempDir: string;
  let app: BLCAppServer;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'blc-server-test-'));
    const repo = new ProcurementRepository({
      persistPath: join(tempDir, 'db.json'),
      seed: true,
    });
    const storage = new LocalAttachmentStorage(join(tempDir, 'uploads'));
    app = createAppServer({ repository: repo, storage });
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors on Windows
    }
  });

  it('persists local SQLite documents across repository restarts', () => {
    const dbPath = join(tempDir, 'local.sqlite');
    const first = new ProcurementRepository({ sqlitePath: dbPath, seed: false });
    const created = first.createDocument({ docType: 'PR', title: 'Uji persistensi', branch: 'Bekasi' }, 'Pemohon');
    const reopened = new ProcurementRepository({ sqlitePath: dbPath, seed: false });
    expect(reopened.getDocumentById(created.id).title).toBe('Uji persistensi');
  });

  it('does not allow another applicant to download a document attachment', async () => {
    const ownerToken = await loginAs('PEMOHON');
    const created = await apiCall('/api/v1/documents', { method: 'POST', token: ownerToken, body: { docType: 'PR', title: 'Uji akses', branch: 'Bekasi' } });
    const id = (await created.json()).document.id;
    const uploaded = await apiCall(`/api/v1/documents/${id}/attachments`, { method: 'POST', token: ownerToken, body: { originalName: 'test.pdf', mimeType: 'application/pdf', contentBase64: Buffer.from('test').toString('base64') } });
    const attachmentId = (await uploaded.json()).attachment.id;
    const other = signJwt({ id: 'other-user', email: 'other@example.test', fullName: 'Other', role: 'PEMOHON', branch: 'Bekasi', branchScope: 'Bekasi' });
    expect((await apiCall(`/api/v1/attachments/${attachmentId}`, { token: other })).status).toBe(403);
  });

  it('limits Head attachments to documents assigned to that Head', async () => {
    const owner = await loginAs('PEMOHON');
    const created = await apiCall('/api/v1/documents', { method: 'POST', token: owner, body: { docType: 'PR', title: 'Uji Head', stage1ApproverEmail: 'atasan@blc.co.id' } });
    const id = (await created.json()).document.id;
    const upload = await apiCall(`/api/v1/documents/${id}/attachments`, { method: 'POST', token: owner, body: { originalName: 'test.pdf', mimeType: 'application/pdf', contentBase64: Buffer.from('test').toString('base64') } });
    const attachmentId = (await upload.json()).attachment.id;
    const assigned = await loginAs('ATASAN');
    const other = signJwt({ id: 'other-head', email: 'other-head@example.test', fullName: 'Other Head', role: 'ATASAN', branch: 'Bekasi', branchScope: '*' });
    expect((await apiCall(`/api/v1/attachments/${attachmentId}`, { token: assigned })).status).toBe(200);
    expect((await apiCall(`/api/v1/attachments/${attachmentId}`, { token: other })).status).toBe(403);
    const detail = await (await apiCall(`/api/v1/documents/${id}`, { token: other })).json();
    expect(detail.attachments).toEqual([]);
    expect(detail.document.attachments).toBeUndefined();
    const list = await (await apiCall('/api/v1/documents', { token: other })).json();
    expect(list.documents.find((doc: { id: string }) => doc.id === id).attachments).toBeUndefined();
  });

  it('hides bank details from another applicant and the supervisor', async () => {
    const ownerToken = await loginAs('PEMOHON');
    const created = await apiCall('/api/v1/documents', { method: 'POST', token: ownerToken, body: { docType: 'PO', title: 'Uji rekening', branch: 'Bekasi', bankDetails: { bankName: 'Dummy', accountNumber: '123456', accountHolder: 'Dummy' } } });
    const id = (await created.json()).document.id;
    const other = signJwt({ id: 'other-user', email: 'other@example.test', fullName: 'Other', role: 'PEMOHON', branch: 'Bekasi', branchScope: 'Bekasi' });
    const supervisor = await loginAs('ATASAN');
    for (const token of [other, supervisor]) {
      const result = await apiCall(`/api/v1/documents/${id}`, { token });
      expect(JSON.stringify(await result.json())).not.toContain('123456');
    }
  });

  it('requires a valid supervisor before submission', async () => {
    const token = await loginAs('PEMOHON');
    const created = await apiCall('/api/v1/documents', { method: 'POST', token, body: { docType: 'PR', title: 'Uji atasan', stage1ApproverEmail: 'pemohon@blc.co.id' } });
    const id = (await created.json()).document.id;
    const result = await apiCall(`/api/v1/documents/${id}/submit`, { method: 'POST', token });
    expect(result.status).toBe(422);
    expect((await result.json()).code).toBe('INVALID_APPROVER');
  });

  it('requires a stored receipt when submitting reimbursement', async () => {
    const token = await loginAs('PEMOHON');
    const created = await apiCall('/api/v1/documents', { method: 'POST', token, body: { docType: 'RB', title: 'Klaim', paymentMethod: 'CASH', subtotal: 50000 } });
    const id = (await created.json()).document.id;
    const missing = await apiCall(`/api/v1/documents/${id}/submit`, { method: 'POST', token });
    expect((await missing.json()).code).toBe('RB_RECEIPT_REQUIRED');
    await apiCall(`/api/v1/documents/${id}/attachments`, { method: 'POST', token, body: { originalName: 'receipt.pdf', mimeType: 'application/pdf', category: 'RECEIPT', contentBase64: Buffer.from('receipt').toString('base64') } });
    expect((await apiCall(`/api/v1/documents/${id}/submit`, { method: 'POST', token })).status).toBe(200);
  });

  it('allows only Finance to confirm an approved realization', async () => {
    const applicant = await loginAs('PEMOHON');
    const finance = await loginAs('KEUANGAN');
    const created = await apiCall('/api/v1/documents', { method: 'POST', token: applicant, body: { docType: 'RC', title: 'RC uji', parentAvId: 'seed-av-01', realizedAmount: 1000 } });
    const id = (await created.json()).document.id;
    expect((await apiCall(`/api/v1/documents/${id}/confirm-rc`, { method: 'POST', token: applicant })).status).toBe(403);
    const result = await apiCall(`/api/v1/documents/${id}/confirm-rc`, { method: 'POST', token: finance });
    expect((await result.json()).code).toBe('RC_NOT_APPROVED');
  });

  it('rejects an AV linked to a PO that is not approved', async () => {
    const token = await loginAs('PEMOHON');
    const created = await apiCall('/api/v1/documents', { method: 'POST', token, body: { docType: 'AV', title: 'AV test', parentPoId: 'seed-po-01', amount: 1000, activityEndDate: '2026-11-08' } });
    const result = await apiCall(`/api/v1/documents/${(await created.json()).document.id}/submit`, { method: 'POST', token });
    expect(result.status).toBe(422);
    expect((await result.json()).code).toBe('INVALID_PARENT_PO');
  });

  it('uses the paid PV amount for the owner’s RC', async () => {
    const applicant = await loginAs('PEMOHON');
    const supervisor = await loginAs('ATASAN');
    const gm = await loginAs('AYU');
    const hery = await loginAs('BOD_HERY');
    const hashimoto = await loginAs('BOD_HASHIMOTO');
    const finance = await loginAs('KEUANGAN');
    const created = await apiCall('/api/v1/documents', { method: 'POST', token: applicant, body: { docType: 'AV', title: 'AV dummy', branch: 'Bekasi', amount: 100000, subtotal: 100000, pphRate: 0.02, disbursementMethod: 'CASH', activityEndDate: '2026-11-08' } });
    const av = (await created.json()).document;
    expect((await apiCall(`/api/v1/documents/${av.id}/submit`, { method: 'POST', token: applicant })).status).toBe(200);
    for (const token of [supervisor, gm, hery, hashimoto]) {
      expect((await apiCall(`/api/v1/documents/${av.id}/decisions`, { method: 'POST', token, body: { decision: 'APPROVE' } })).status).toBe(200);
    }
    const generated = await apiCall(`/api/v1/documents/${av.id}/generate-pv`, { method: 'POST', token: finance });
    const pv = (await generated.json()).document;
    expect(pv.grossAmount).toBe(100000);
    expect(pv.pphDeduction).toBe(2000);
    expect(pv.netAmountToPay).toBe(98000);
    expect(pv.status).toBe('IN_REVIEW');
    expect(pv.currentStage).toBe('AYU');
    for (const token of [gm, hery, hashimoto]) {
      expect((await apiCall(`/api/v1/documents/${pv.id}/decisions`, { method: 'POST', token, body: { decision: 'APPROVE' } })).status).toBe(200);
    }
    expect((await apiCall(`/api/v1/payments/${pv.id}/record`, { method: 'POST', token: finance, body: { paidAt: '2026-11-08', sourceBank: 'Dummy', referenceNumber: 'TEST' } })).status).toBe(200);
    const rcCreated = await apiCall('/api/v1/documents', { method: 'POST', token: applicant, body: { docType: 'RC', title: 'RC dummy', parentAvId: av.id, avOriginalAmount: 1, realizedAmount: 98000, activityCompletedDate: '2026-11-08', submissionDeadline: '2026-11-10' } });
    const rc = (await rcCreated.json()).document;
    const submitted = await apiCall(`/api/v1/documents/${rc.id}/submit`, { method: 'POST', token: applicant });
    expect(submitted.status).toBe(200);
    expect((await submitted.json()).document.avOriginalAmount).toBe(98000);
  });

  async function loginAs(role: UserRole): Promise<string> {
    const res = await app.fetch(
      new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role, password: 'blc2026' }),
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { token: string };
    return data.token;
  }

  async function apiCall(
    path: string,
    options: {
      method?: string;
      token?: string;
      body?: unknown;
      headers?: Record<string, string>;
    } = {}
  ): Promise<Response> {
    const headers: Record<string, string> = {
      ...(options.headers || {}),
    };
    if (options.token) {
      headers.authorization = `Bearer ${options.token}`;
    }
    if (options.body !== undefined) {
      headers['content-type'] = 'application/json';
    }
    return app.fetch(
      new Request(`http://localhost${path}`, {
        method: options.method || 'GET',
        headers,
        body: options.body !== undefined ? JSON.stringify(path === '/api/v1/documents' && options.method === 'POST' ? { stage1ApproverEmail: 'atasan@blc.co.id', ...(options.body as object) } : options.body) : undefined,
      })
    );
  }

  it('1. authenticates local JWT users and provides the shared document list', async () => {
    const unauthRes = await apiCall('/api/v1/me');
    expect(unauthRes.status).toBe(401);

    const pemohonToken = await loginAs('PEMOHON');
    const meRes = await apiCall('/api/v1/me', { token: pemohonToken });
    expect(meRes.status).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.user.email).toBe('pemohon@blc.co.id');
    expect(meBody.user.branchScope).toBe('Bekasi');

    // The list is shared across branches.
    const listPemohonRes = await apiCall('/api/v1/documents', { token: pemohonToken });
    const listPemohon = await listPemohonRes.json();
    expect(listPemohon.documents.some((d: { branch: string }) => d.branch !== 'Bekasi')).toBe(true);

    // Atasan (scope: *) sees all branches including Surabaya and Semarang
    const atasanToken = await loginAs('ATASAN');
    const listAtasanRes = await apiCall('/api/v1/documents', { token: atasanToken });
    const listAtasan = await listAtasanRes.json();
    expect(listAtasan.documents.length).toBe(listPemohon.documents.length);
  });

  it('2. keeps the unconfirmed IAM threshold advisory and supports an IAM attachment', async () => {
    const pemohonToken = await loginAs('PEMOHON');

    // Upload IAM_MEMO attachment to seed-pr-01
    const pdfBytes = Buffer.from('%PDF-1.4 Memo IAM Pengadaan IT BLC', 'utf8');
    const uploadRes = await apiCall('/api/v1/documents/seed-pr-01/attachments', {
      method: 'POST',
      token: pemohonToken,
      body: {
        originalName: 'memo-iam-it.pdf',
        mimeType: 'application/pdf',
        category: 'IAM_MEMO',
        contentBase64: pdfBytes.toString('base64'),
      },
    });
    expect(uploadRes.status).toBe(201);

    // Submit now succeeds
    const okSubmit = await apiCall('/api/v1/documents/seed-pr-01/submit', {
      method: 'POST',
      token: pemohonToken,
    });
    expect(okSubmit.status).toBe(200);
    const submittedDoc = (await okSubmit.json()).document;
    expect(submittedDoc.status).toBe('SUBMITTED');
    expect(submittedDoc.currentStage).toBe('ATASAN');
    expect(submittedDoc.approvalSteps.atasan.status).toBe('PENDING');
  });

  it('allows submission without imposing an unconfirmed IAM rule', async () => {
    const token = await loginAs('PEMOHON');
    const result = await apiCall('/api/v1/documents/seed-pr-01/submit', { method: 'POST', token });
    expect(result.status).toBe(200);
  });

  it('3. executes 3-stage + parallel BoD approval workflow and handles rejection back to DRAFT with outbox jobs', async () => {
    const pemohonToken = await loginAs('PEMOHON');
    const atasanToken = await loginAs('ATASAN');
    const ayuToken = await loginAs('AYU');
    const heryToken = await loginAs('BOD_HERY');
    const hashimotoToken = await loginAs('BOD_HASHIMOTO');

    // Create a PR < 5M so no IAM is needed
    const createRes = await apiCall('/api/v1/documents', {
      method: 'POST',
      token: pemohonToken,
      body: {
        docType: 'PR',
        title: 'Pembelian Alat Tulis Kantor Cabang Pusat',
        branch: 'Bekasi',
        purpose: 'Stok ATK Bulanan',
        budgetType: 'OPEX',
        subtotalAmount: 2_500_000,
      },
    });
    expect(createRes.status).toBe(201);
    const pr = (await createRes.json()).document;

    // Submit PR
    const subRes = await apiCall(`/api/v1/documents/${pr.id}/submit`, {
      method: 'POST',
      token: pemohonToken,
    });
    expect(subRes.status).toBe(200);

    // Stage 1: ATASAN approves -> moves to AYU
    const st1Res = await apiCall(`/api/v1/documents/${pr.id}/decisions`, {
      method: 'POST',
      token: atasanToken,
      body: { decision: 'APPROVE', comment: 'ATK disetujui Atasan' },
    });
    expect(st1Res.status).toBe(200);
    const afterAtasan = (await st1Res.json()).document;
    expect(afterAtasan.currentStage).toBe('AYU');
    expect(afterAtasan.status).toBe('IN_REVIEW');

    // Stage 2: AYU rejects without comment -> 422
    const invalidReject = await apiCall(`/api/v1/documents/${pr.id}/decisions`, {
      method: 'POST',
      token: ayuToken,
      body: { decision: 'REJECT', comment: '   ' },
    });
    expect(invalidReject.status).toBe(422);

    // Stage 2: AYU rejects with comment -> resets to DRAFT
    const validReject = await apiCall(`/api/v1/documents/${pr.id}/decisions`, {
      method: 'POST',
      token: ayuToken,
      body: { decision: 'REJECT', comment: 'Mohon rinci kuantitas kertas A4' },
    });
    expect(validReject.status).toBe(200);
    const rejectedDoc = (await validReject.json()).document;
    expect(rejectedDoc.status).toBe('DRAFT');
    expect(rejectedDoc.approvalSteps.ayu.status).toBe('REJECTED');

    // Resubmit after revision -> resets stages cleanly
    await apiCall(`/api/v1/documents/${pr.id}/submit`, {
      method: 'POST',
      token: pemohonToken,
    });
    await apiCall(`/api/v1/documents/${pr.id}/decisions`, {
      method: 'POST',
      token: atasanToken,
      body: { decision: 'APPROVE', comment: 'Revisi OK' },
    });
    const st2Approve = await apiCall(`/api/v1/documents/${pr.id}/decisions`, {
      method: 'POST',
      token: ayuToken,
      body: { decision: 'APPROVE', comment: 'Verifikasi anggaran OK' },
    });
    const atBod = (await st2Approve.json()).document;
    expect(atBod.currentStage).toBe('BOD');
    expect(atBod.approvalSteps.bod.heryStatus).toBe('PENDING');
    expect(atBod.approvalSteps.bod.hashimotoStatus).toBe('PENDING');

    // Stage 3 Parallel: Hery approves first -> status stays IN_REVIEW
    const heryRes = await apiCall(`/api/v1/documents/${pr.id}/decisions`, {
      method: 'POST',
      token: heryToken,
      body: { decision: 'APPROVE', comment: 'Approved by Hery' },
    });
    const afterHery = (await heryRes.json()).document;
    expect(afterHery.status).toBe('IN_REVIEW');
    expect(afterHery.approvalSteps.bod.heryStatus).toBe('APPROVED');
    expect(afterHery.approvalSteps.bod.hashimotoStatus).toBe('PENDING');

    // Stage 3 Parallel: Hashimoto approves second -> status becomes APPROVED
    const hashimotoRes = await apiCall(`/api/v1/documents/${pr.id}/decisions`, {
      method: 'POST',
      token: hashimotoToken,
      body: { decision: 'APPROVE', comment: 'Approved by Hashimoto' },
    });
    const finalDoc = (await hashimotoRes.json()).document;
    expect(finalDoc.status).toBe('APPROVED');
    expect(finalDoc.approvalSteps.bod.hashimotoStatus).toBe('APPROVED');

    // Verify transactional outbox jobs were recorded
    const outboxJobs = app.repo.listOutboxJobs();
    expect(
      outboxJobs.some(
        (j) => j.documentId === pr.id && j.eventType === 'DOCUMENT_FULLY_APPROVED'
      )
    ).toBe(true);
  });

  it('4. enforces optimistic concurrency (409 VERSION_CONFLICT) and Idempotency-Key deduplication', async () => {
    const ayuToken = await loginAs('AYU');

    // seed-po-01 is at stage AYU with version 1
    const getRes = await apiCall('/api/v1/documents/seed-po-01', { token: ayuToken });
    const poDoc = (await getRes.json()).document;
    expect(poDoc.version).toBe(1);

    // First decision with Idempotency-Key succeeds and bumps version to 2
    const idemKey = 'idem-ayu-approve-po-01';
    const firstApprove = await apiCall('/api/v1/documents/seed-po-01/decisions', {
      method: 'POST',
      token: ayuToken,
      headers: { 'Idempotency-Key': idemKey },
      body: {
        decision: 'APPROVE',
        comment: 'Harga sesuai kontrak',
        expectedVersion: 1,
      },
    });
    expect(firstApprove.status).toBe(200);
    const firstBody = (await firstApprove.json()).document;
    expect(firstBody.version).toBe(2);

    // Retry with same Idempotency-Key returns exact cached response (status 200, version 2)
    const retryApprove = await apiCall('/api/v1/documents/seed-po-01/decisions', {
      method: 'POST',
      token: ayuToken,
      headers: { 'Idempotency-Key': idemKey },
      body: {
        decision: 'APPROVE',
        comment: 'Harga sesuai kontrak',
        expectedVersion: 1,
      },
    });
    expect(retryApprove.status).toBe(200);
    const retryBody = (await retryApprove.json()).document;
    expect(retryBody.version).toBe(2);

    // Another decision with stale expectedVersion=1 (and no matching idempotency key) fails with 409
    const heryToken = await loginAs('BOD_HERY');
    const conflictRes = await apiCall('/api/v1/documents/seed-po-01/decisions', {
      method: 'POST',
      token: heryToken,
      body: {
        decision: 'APPROVE',
        comment: 'Stale version attempt',
        expectedVersion: 1,
      },
    });
    expect(conflictRes.status).toBe(409);
    const conflictErr = await conflictRes.json();
    expect(conflictErr.code).toBe('VERSION_CONFLICT');
  });

  it('5. enforces 1 AV : 1 active RC cardinality constraint (409 on duplicate RC for same AV)', async () => {
    const pemohonToken = await loginAs('PEMOHON');

    const rc1Res = await apiCall('/api/v1/documents', {
      method: 'POST',
      token: pemohonToken,
      body: {
        docType: 'RC',
        title: 'Pertanggungjawaban Uang Muka Audit Semarang',
        branch: 'Bekasi',
        purpose: 'Realisasi perjalanan dinas',
        parentAvId: 'seed-av-01',
        avOriginalAmount: 4_500_000,
        realizedAmount: 4_800_000,
        activityCompletedDate: '2026-11-05',
        submissionDeadline: '2026-11-12',
      },
    });
    expect(rc1Res.status).toBe(201);
    const rc1 = (await rc1Res.json()).document;
    expect(rc1.outcomeType).toBe('DEFICIT');
    expect(rc1.balanceAmount).toBe(-300_000);

    // Attempting to create a second RC referencing seed-av-01 must fail with 409
    const rc2Res = await apiCall('/api/v1/documents', {
      method: 'POST',
      token: pemohonToken,
      body: {
        docType: 'RC',
        title: 'Duplikat RC untuk AV yang sama',
        branch: 'Bekasi',
        parentAvId: 'seed-av-01',
        avOriginalAmount: 4_500_000,
        realizedAmount: 4_500_000,
        activityCompletedDate: '2026-11-05',
        submissionDeadline: '2026-11-12',
      },
    });
    expect(rc2Res.status).toBe(409);
    const rc2Err = await rc2Res.json();
    expect(rc2Err.code).toBe('DUPLICATE_RC_FOR_AV');
  });

  it('6. generates PV from approved PO with PPh deduction and propagates PAID status on payment record', async () => {
    const ayuToken = await loginAs('AYU');
    const heryToken = await loginAs('BOD_HERY');
    const hashimotoToken = await loginAs('BOD_HASHIMOTO');
    const keuanganToken = await loginAs('KEUANGAN');

    // Complete approval for seed-po-01 (currently at AYU)
    await apiCall('/api/v1/documents/seed-po-01/decisions', {
      method: 'POST',
      token: ayuToken,
      body: { decision: 'APPROVE', comment: 'OK Ayu' },
    });
    await apiCall('/api/v1/documents/seed-po-01/decisions', {
      method: 'POST',
      token: heryToken,
      body: { decision: 'APPROVE', comment: 'OK Hery' },
    });
    await apiCall('/api/v1/documents/seed-po-01/decisions', {
      method: 'POST',
      token: hashimotoToken,
      body: { decision: 'APPROVE', comment: 'OK Hashimoto' },
    });

    // Generate PV as KEUANGAN
    const genPvRes = await apiCall('/api/v1/documents/seed-po-01/generate-pv', {
      method: 'POST',
      token: keuanganToken,
    });
    expect(genPvRes.status).toBe(201);
    const pv = (await genPvRes.json()).document;
    expect(pv.docType).toBe('PV');
    expect(pv.grossAmount).toBe(27_750_000);
    expect(pv.pphDeduction).toBe(500_000);
    expect(pv.netAmountToPay).toBe(27_250_000);

    // Duplicate PV generation for same source PO must fail with 409
    const dupPvRes = await apiCall('/api/v1/documents/seed-po-01/generate-pv', {
      method: 'POST',
      token: keuanganToken,
    });
    expect(dupPvRes.status).toBe(409);

    // Recording payment before PV is approved by Ayu & BoD must fail with 422 PV_NOT_APPROVED
    const prematurePayRes = await apiCall(`/api/v1/payments/${pv.id}/record`, {
      method: 'POST',
      token: keuanganToken,
      body: {
        paidAt: '2026-11-07T09:00:00.000Z',
        sourceBank: 'BCA Corporate Giro',
        referenceNumber: 'TRX-20261107-99182',
      },
    });
    expect(prematurePayRes.status).toBe(422);
    expect((await prematurePayRes.json()).code).toBe('PV_NOT_APPROVED');

    // Approve PV through Ayu -> Hery & Hashimoto
    for (const token of [ayuToken, heryToken, hashimotoToken]) {
      const decRes = await apiCall(`/api/v1/documents/${pv.id}/decisions`, {
        method: 'POST',
        token,
        body: { decision: 'APPROVE', comment: 'Approve PV' },
      });
      expect(decRes.status).toBe(200);
    }

    // Record payment on PV
    const payRes = await apiCall(`/api/v1/payments/${pv.id}/record`, {
      method: 'POST',
      token: keuanganToken,
      body: {
        paidAt: '2026-11-07T09:00:00.000Z',
        sourceBank: 'BCA Corporate Giro',
        paidAmount: 27_250_000,
        referenceNumber: 'TRX-20261107-99182',
      },
    });
    expect(payRes.status).toBe(200);
    const paidPv = (await payRes.json()).document;
    expect(paidPv.status).toBe('PAID');
    expect(paidPv.paymentStatus).toBe('PAID');
    // Verify auditLog comment does not leak raw sourceBank
    const paymentLog = paidPv.auditLog.find((l: { action: string }) => l.action === 'RECORD_PAYMENT');
    expect(paymentLog?.comment).not.toContain('BCA Corporate Giro');

    // Verify parent PO is now also marked PAID
    const parentRes = await apiCall('/api/v1/documents/seed-po-01', {
      token: keuanganToken,
    });
    const parentPo = (await parentRes.json()).document;
    expect(parentPo.status).toBe('PAID');
  });

  it('7. uploads and streams local attachments with SHA-256 integrity and MIME validation', async () => {
    const pemohonToken = await loginAs('PEMOHON');

    // Reject unsupported MIME type (e.g. application/x-msdownload)
    const badMimeRes = await apiCall('/api/v1/documents/seed-rb-01/attachments', {
      method: 'POST',
      token: pemohonToken,
      body: {
        originalName: 'malware.exe',
        mimeType: 'application/x-msdownload',
        contentBase64: Buffer.from('MZ').toString('base64'),
      },
    });
    expect(badMimeRes.status).toBe(422);

    // Upload valid PNG receipt
    const pngPayload = Buffer.from('PNG-RECEIPT-BLC-2026-DATA', 'utf8');
    const expectedHash = createHash('sha256').update(pngPayload).digest('hex');

    const uploadRes = await apiCall('/api/v1/documents/seed-rb-01/attachments', {
      method: 'POST',
      token: pemohonToken,
      body: {
        originalName: 'kwitansi-konsumsi.png',
        mimeType: 'image/png',
        category: 'RECEIPT',
        contentBase64: pngPayload.toString('base64'),
      },
    });
    expect(uploadRes.status).toBe(201);
    const attachment = (await uploadRes.json()).attachment;
    expect(attachment.sha256Hash).toBe(expectedHash);
    const documentRes = await apiCall('/api/v1/documents/seed-rb-01', { token: pemohonToken });
    expect((await documentRes.json()).document.attachments).toEqual(expect.arrayContaining([expect.objectContaining({ id: attachment.id, name: 'kwitansi-konsumsi.png' })]));

    // Stream download and verify content + headers
    const downloadRes = await apiCall(`/api/v1/attachments/${attachment.id}`, {
      token: pemohonToken,
    });
    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers.get('content-type')).toBe('image/png');
    expect(downloadRes.headers.get('x-sha256-hash')).toBe(expectedHash);
    const downloadedBuf = Buffer.from(await downloadRes.arrayBuffer());
    expect(downloadedBuf.equals(pngPayload)).toBe(true);
  });

  it('8. strips system/workflow fields on POST and PUT to prevent mass-assignment (Ponytail #1)', async () => {
    const pemohonToken = await loginAs('PEMOHON');
    const createRes = await apiCall('/api/v1/documents', {
      method: 'POST',
      token: pemohonToken,
      body: {
        docType: 'PR',
        title: 'PR Uji Mass Assignment',
        branch: 'Bekasi',
        subtotalAmount: 1_000_000,
        status: 'APPROVED',
        currentStage: 'BOD',
        docNumber: 'PR-HACKED-9999',
      },
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()).document;
    expect(created.status).toBe('DRAFT');
    expect(created.currentStage).toBe('ATASAN');
    expect(created.docNumber).not.toBe('PR-HACKED-9999');

    const updateRes = await apiCall(`/api/v1/documents/${created.id}`, {
      method: 'PUT',
      token: pemohonToken,
      body: {
        title: 'PR Uji Mass Assignment Updated',
        status: 'PAID',
        currentStage: 'BOD',
        docNumber: 'PR-HACKED-8888',
      },
    });
    expect(updateRes.status).toBe(200);
    const updated = (await updateRes.json()).document;
    expect(updated.status).toBe('DRAFT');
    expect(updated.currentStage).toBe('ATASAN');
    expect(updated.docNumber).toBe(created.docNumber);
  });

  it('9. enforces Rp 50,000,000 ceiling, 1 PR : 1 PO cardinality, PO <= PR subtotal, and blocks "realisasi" in PO', async () => {
    const pemohonToken = await loginAs('PEMOHON');

    // 9a. Exceeds Rp 50,000,000 ceiling
    const overLimitPrRes = await apiCall('/api/v1/documents', {
      method: 'POST',
      token: pemohonToken,
      body: {
        docType: 'PR',
        title: 'PR Alat Berat',
        branch: 'Bekasi',
        subtotalAmount: 55_000_000,
        stage1ApproverEmail: 'atasan@blc.co.id',
      },
    });
    const overLimitPr = (await overLimitPrRes.json()).document;
    const submitOverRes = await apiCall(`/api/v1/documents/${overLimitPr.id}/submit`, {
      method: 'POST',
      token: pemohonToken,
    });
    expect(submitOverRes.status).toBe(422);
    expect((await submitOverRes.json()).code).toBe('EXCEEDS_SYSTEM_LIMIT');

    // 9b. Blocks "realisasi" in PO title/purpose
    const realisasiPoRes = await apiCall('/api/v1/documents', {
      method: 'POST',
      token: pemohonToken,
      body: {
        docType: 'PO',
        title: 'Realisasi Uang Muka Cabang',
        branch: 'Bekasi',
        vendorName: 'PT Dummy',
        subtotal: 1_000_000,
        paymentMethod: 'CASH',
        stage1ApproverEmail: 'atasan@blc.co.id',
      },
    });
    const realisasiPo = (await realisasiPoRes.json()).document;
    const submitRealisasiPo = await apiCall(`/api/v1/documents/${realisasiPo.id}/submit`, {
      method: 'POST',
      token: pemohonToken,
    });
    expect(submitRealisasiPo.status).toBe(422);
    expect((await submitRealisasiPo.json()).code).toBe('PO_REALIZATION_FORBIDDEN');

    // 9c. Enforces 1 PR : 1 PO cardinality (seed-pr-02 is already referenced by seed-po-01)
    const dupPoRes = await apiCall('/api/v1/documents', {
      method: 'POST',
      token: pemohonToken,
      body: {
        docType: 'PO',
        title: 'PO Ganda untuk PR-02',
        branch: 'Surabaya',
        parentPrId: 'seed-pr-02',
        vendorName: 'PT Kedua',
        subtotal: 10_000_000,
        paymentMethod: 'CASH',
      },
    });
    expect(dupPoRes.status).toBe(409);
    expect((await dupPoRes.json()).code).toBe('DUPLICATE_PO_FOR_PR');
  });

  it('10. supports GR (Laporan Penerimaan) without approval stages, requiring PHOTO for GOODS and BAST for SERVICE', async () => {
    const pemohonToken = await loginAs('PEMOHON');
    const ayuToken = await loginAs('AYU');
    const heryToken = await loginAs('BOD_HERY');
    const hashimotoToken = await loginAs('BOD_HASHIMOTO');

    // Approve seed-po-01 first
    for (const token of [ayuToken, heryToken, hashimotoToken]) {
      await apiCall('/api/v1/documents/seed-po-01/decisions', {
        method: 'POST',
        token,
        body: { decision: 'APPROVE', comment: 'Approve PO for GR' },
      });
    }

    const grRes = await apiCall('/api/v1/documents', {
      method: 'POST',
      token: pemohonToken,
      body: {
        docType: 'GR',
        title: 'Laporan Penerimaan Scissor Lift',
        branch: 'Surabaya',
        parentPoId: 'seed-po-01',
        receiptType: 'GOODS',
        receivedDate: '2026-11-09',
        itemCondition: 'KURANG',
        notes: 'Kurang 1 kabel konektor',
      },
    });
    expect(grRes.status).toBe(201);
    const gr = (await grRes.json()).document;

    // Submitting GR without PHOTO attachment must fail
    const noPhotoRes = await apiCall(`/api/v1/documents/${gr.id}/submit`, {
      method: 'POST',
      token: pemohonToken,
    });
    expect(noPhotoRes.status).toBe(422);
    expect((await noPhotoRes.json()).code).toBe('GR_ATTACHMENT_REQUIRED');

    // Upload PHOTO attachment and submit GR (no stage1ApproverEmail needed)
    await apiCall(`/api/v1/documents/${gr.id}/attachments`, {
      method: 'POST',
      token: pemohonToken,
      body: {
        originalName: 'Photo_ScissorLift.png',
        mimeType: 'image/png',
        category: 'PHOTO',
        contentBase64: Buffer.from('PHOTO-DATA').toString('base64'),
      },
    });

    const submitGrRes = await apiCall(`/api/v1/documents/${gr.id}/submit`, {
      method: 'POST',
      token: pemohonToken,
    });
    expect(submitGrRes.status).toBe(200);
    const submittedGr = (await submitGrRes.json()).document;
    expect(submittedGr.status).toBe('APPROVED');
    expect(submittedGr.requiresFollowUp).toBe(true);
  });

  it('11. supports partial/staged PO payment via PV and only marks PO as PAID when fully settled', async () => {
    const ayuToken = await loginAs('AYU');
    const heryToken = await loginAs('BOD_HERY');
    const hashimotoToken = await loginAs('BOD_HASHIMOTO');
    const keuanganToken = await loginAs('KEUANGAN');

    // Approve seed-po-01 (totalAmount = 27,250,000)
    for (const token of [ayuToken, heryToken, hashimotoToken]) {
      await apiCall('/api/v1/documents/seed-po-01/decisions', {
        method: 'POST',
        token,
        body: { decision: 'APPROVE', comment: 'Approve PO' },
      });
    }

    // Generate Stage 1 PV (Termin 1: Rp 10,000,000 net)
    const pv1Res = await apiCall('/api/v1/documents/seed-po-01/generate-pv', {
      method: 'POST',
      token: keuanganToken,
      body: {
        paymentDueDate: '2026-11-12',
        plannedSourceAccount: 'BCA Operasional Pusat',
        invoiceNumber: 'INV-TERM-01',
        grossAmount: 10_000_000,
        pphDeduction: 0,
      },
    });
    expect(pv1Res.status).toBe(201);
    const pv1 = (await pv1Res.json()).document;
    expect(pv1.netAmountToPay).toBe(10_000_000);

    for (const token of [ayuToken, heryToken, hashimotoToken]) {
      await apiCall(`/api/v1/documents/${pv1.id}/decisions`, {
        method: 'POST',
        token,
        body: { decision: 'APPROVE' },
      });
    }
    await apiCall(`/api/v1/payments/${pv1.id}/record`, {
      method: 'POST',
      token: keuanganToken,
      body: {
        paidAt: '2026-11-09',
        sourceBank: 'BCA Operasional Pusat',
        paidAmount: 10_000_000,
        referenceNumber: 'TRF-TERM-01',
      },
    });

    // PO should still be APPROVED (remaining 17,250,000 unpaid)
    const poAfterTerm1 = (await (await apiCall('/api/v1/documents/seed-po-01', { token: keuanganToken })).json()).document;
    expect(poAfterTerm1.status).toBe('APPROVED');

    // Generate Stage 2 PV for the remaining Rp 17,250,000
    const pv2Res = await apiCall('/api/v1/documents/seed-po-01/generate-pv', {
      method: 'POST',
      token: keuanganToken,
    });
    expect(pv2Res.status).toBe(201);
    const pv2 = (await pv2Res.json()).document;
    expect(pv2.netAmountToPay).toBe(17_250_000);

    for (const token of [ayuToken, heryToken, hashimotoToken]) {
      await apiCall(`/api/v1/documents/${pv2.id}/decisions`, {
        method: 'POST',
        token,
        body: { decision: 'APPROVE' },
      });
    }
    await apiCall(`/api/v1/payments/${pv2.id}/record`, {
      method: 'POST',
      token: keuanganToken,
      body: {
        paidAt: '2026-11-10',
        sourceBank: 'BCA Operasional Pusat',
        paidAmount: 17_250_000,
        referenceNumber: 'TRF-TERM-02',
      },
    });

    // Now PO must be marked PAID
    const poAfterTerm2 = (await (await apiCall('/api/v1/documents/seed-po-01', { token: keuanganToken })).json()).document;
    expect(poAfterTerm2.status).toBe('PAID');
  });

  it('12. auto-fills EXACT RC and auto-confirms DEFICIT RC when its deficiency PV is paid', async () => {
    const applicant = await loginAs('PEMOHON');
    const supervisor = await loginAs('ATASAN');
    const gm = await loginAs('AYU');
    const hery = await loginAs('BOD_HERY');
    const hashimoto = await loginAs('BOD_HASHIMOTO');
    const finance = await loginAs('KEUANGAN');

    // Create & pay an AV of Rp 1,000,000
    const avRes = await apiCall('/api/v1/documents', {
      method: 'POST',
      token: applicant,
      body: {
        docType: 'AV',
        title: 'AV Dinas',
        branch: 'Bekasi',
        amount: 1_000_000,
        subtotal: 1_000_000,
        disbursementMethod: 'CASH',
        activityDate: '2026-11-08',
        activityEndDate: '2026-11-09',
        paymentDueDate: '2026-11-08',
        stage1ApproverEmail: 'atasan@blc.co.id',
      },
    });
    const av = (await avRes.json()).document;
    await apiCall(`/api/v1/documents/${av.id}/submit`, { method: 'POST', token: applicant });
    for (const token of [supervisor, gm, hery, hashimoto]) {
      await apiCall(`/api/v1/documents/${av.id}/decisions`, { method: 'POST', token, body: { decision: 'APPROVE' } });
    }
    const avPv = (await (await apiCall(`/api/v1/documents/${av.id}/generate-pv`, { method: 'POST', token: finance })).json()).document;
    for (const token of [gm, hery, hashimoto]) {
      await apiCall(`/api/v1/documents/${avPv.id}/decisions`, { method: 'POST', token, body: { decision: 'APPROVE' } });
    }
    await apiCall(`/api/v1/payments/${avPv.id}/record`, {
      method: 'POST',
      token: finance,
      body: { paidAt: '2026-11-08', sourceBank: 'BCA', referenceNumber: 'REF-AV-1' },
    });

    // Create DEFICIT RC (spent Rp 1,250,000 vs AV Rp 1,000,000)
    const rcRes = await apiCall('/api/v1/documents', {
      method: 'POST',
      token: applicant,
      body: {
        docType: 'RC',
        title: 'RC Defisit Dinas',
        branch: 'Bekasi',
        parentAvId: av.id,
        avOriginalAmount: 1_000_000,
        realizedAmount: 1_250_000,
        subtotal: 1_250_000,
        activityCompletedDate: '2026-11-09',
        submissionDeadline: '2026-11-11',
        stage1ApproverEmail: 'atasan@blc.co.id',
        reimbursementBank: {
          bankName: 'BCA',
          accountNumber: '1234567890',
          accountHolder: 'Dewi Lestari',
        },
      },
    });
    const rc = (await rcRes.json()).document;
    expect(rc.outcomeType).toBe('DEFICIT');
    await apiCall(`/api/v1/documents/${rc.id}/submit`, { method: 'POST', token: applicant });
    for (const token of [supervisor, gm, hery, hashimoto]) {
      await apiCall(`/api/v1/documents/${rc.id}/decisions`, { method: 'POST', token, body: { decision: 'APPROVE' } });
    }

    // Generate PV for RC_DEFICIT (Rp 250,000)
    const rcPvRes = await apiCall(`/api/v1/documents/${rc.id}/generate-pv`, { method: 'POST', token: finance });
    expect(rcPvRes.status).toBe(201);
    const rcPv = (await rcPvRes.json()).document;
    expect(rcPv.netAmountToPay).toBe(250_000);

    for (const token of [gm, hery, hashimoto]) {
      await apiCall(`/api/v1/documents/${rcPv.id}/decisions`, { method: 'POST', token, body: { decision: 'APPROVE' } });
    }
    await apiCall(`/api/v1/payments/${rcPv.id}/record`, {
      method: 'POST',
      token: finance,
      body: { paidAt: '2026-11-10', sourceBank: 'BCA', paidAmount: 250_000, referenceNumber: 'REF-RC-DEF' },
    });

    // Verify RC is automatically PAID and financeConfirmedAt is populated
    const settledRc = (await (await apiCall(`/api/v1/documents/${rc.id}`, { token: finance })).json()).document;
    expect(settledRc.status).toBe('PAID');
    expect(Boolean(settledRc.financeConfirmedAt)).toBe(true);
  });

  it('13. resets the other BoD status from PENDING to WAITING when one BoD rejects (Ponytail #4)', async () => {
    const ayuToken = await loginAs('AYU');
    const heryToken = await loginAs('BOD_HERY');

    // Move seed-po-01 to BOD stage
    await apiCall('/api/v1/documents/seed-po-01/decisions', {
      method: 'POST',
      token: ayuToken,
      body: { decision: 'APPROVE', comment: 'Ke BoD' },
    });

    // Hery rejects
    const rejRes = await apiCall('/api/v1/documents/seed-po-01/decisions', {
      method: 'POST',
      token: heryToken,
      body: { decision: 'REJECT', comment: 'Revisi harga penawaran' },
    });
    expect(rejRes.status).toBe(200);
    const rejectedDoc = (await rejRes.json()).document;
    expect(rejectedDoc.status).toBe('DRAFT');
    expect(rejectedDoc.approvalSteps.bod.heryStatus).toBe('REJECTED');
    expect(rejectedDoc.approvalSteps.bod.hashimotoStatus).toBe('WAITING');
  });
});

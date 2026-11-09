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

    // Record payment on PV
    const payRes = await apiCall(`/api/v1/payments/${pv.id}/record`, {
      method: 'POST',
      token: keuanganToken,
      body: {
        paidAt: '2026-11-07T09:00:00.000Z',
        sourceBank: 'BCA Corporate Giro',
        referenceNumber: 'TRX-20261107-99182',
      },
    });
    expect(payRes.status).toBe(200);
    const paidPv = (await payRes.json()).document;
    expect(paidPv.status).toBe('PAID');
    expect(paidPv.paymentStatus).toBe('PAID');

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
});

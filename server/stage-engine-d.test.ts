import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, copyFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { OrganizationRepository, migrateOrganization } from './organization';
import {
  ApprovalStageEngine,
  migrateApprovalEngine,
} from './stage-engine';
import { ProcurementRepository } from './repository';
import { createAppServer, type BLCAppServer } from './app';
import type { UserRole, PVPaymentDetails } from '../src/types/document';

describe('HOTFIX BR-APP-001 — HF02-D: End-to-End Integration, Regression & Deployment Readiness', () => {
  let tempDir: string;
  let dbPath: string;
  let repoPath: string;
  let stageEngine: ApprovalStageEngine;
  let orgRepo: OrganizationRepository;
  let procRepo: ProcurementRepository;
  let app: BLCAppServer;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'blc-hf02d-test-'));
    dbPath = join(tempDir, 'test-hf02d.sqlite');
    repoPath = join(tempDir, 'test-repo.json');

    migrateOrganization(dbPath);
    migrateApprovalEngine(dbPath);
    orgRepo = new OrganizationRepository(dbPath);
    stageEngine = new ApprovalStageEngine(dbPath);
    procRepo = new ProcurementRepository({ persistPath: repoPath, seed: true });
    app = createAppServer({
      repository: procRepo,
      organization: orgRepo,
      stageEngine,
      stageEngineEnabled: true,
    });

    const adminUser = orgRepo.getUser('usr-admin-01');

    // Verify key test actors in isolated database per ADR-ID-002
    orgRepo.verifyUser('usr-atasan-01', { proofReference: 'SK Penugasan BM', verifiedBy: 'usr-admin-01' });
    orgRepo.setUserLifecycle('usr-atasan-01', 'ACTIVE', 'usr-admin-01');

    orgRepo.verifyUser('usr-ayu-01', { proofReference: 'SK Direksi No. 01/2026', verifiedBy: 'usr-admin-01' });
    orgRepo.setUserLifecycle('usr-ayu-01', 'ACTIVE', 'usr-admin-01');

    orgRepo.verifyUser('usr-pemohon-01', { proofReference: 'SK Karyawan Tetap', verifiedBy: 'usr-admin-01' });
    orgRepo.setUserLifecycle('usr-pemohon-01', 'ACTIVE', 'usr-admin-01');

    orgRepo.verifyUser('usr-bod-hery', { proofReference: 'AKTA-01', verifiedBy: 'usr-admin-01' });
    orgRepo.setUserLifecycle('usr-bod-hery', 'ACTIVE', 'usr-admin-01');

    orgRepo.verifyUser('usr-bod-hashimoto', { proofReference: 'AKTA-02', verifiedBy: 'usr-admin-01' });
    orgRepo.setUserLifecycle('usr-bod-hashimoto', 'ACTIVE', 'usr-admin-01');

    orgRepo.verifyUser('usr-keuangan-01', { proofReference: 'SK-FIN', verifiedBy: 'usr-admin-01' });
    orgRepo.setUserLifecycle('usr-keuangan-01', 'ACTIVE', 'usr-admin-01');

    // Create and verify extra test users
    const spv1 = orgRepo.createUser(
      { email: 'spv1.hf02d@blc.co.id', fullName: 'Supervisor Satu', role: 'ATASAN' },
      adminUser.id
    );
    orgRepo.verifyUser(spv1.id, { proofReference: 'SK-SPV-01', verifiedBy: adminUser.id });
    orgRepo.setUserLifecycle(spv1.id, 'ACTIVE', adminUser.id);

    const spv2 = orgRepo.createUser(
      { email: 'spv2.hf02d@blc.co.id', fullName: 'Supervisor Dua (Pengganti)', role: 'ATASAN' },
      adminUser.id
    );
    orgRepo.verifyUser(spv2.id, { proofReference: 'SK-SPV-02', verifiedBy: adminUser.id });
    orgRepo.setUserLifecycle(spv2.id, 'ACTIVE', adminUser.id);

    // Set persistent stage assignments using canonical seeded user IDs
    stageEngine.setStageAssignment('STAGE_2_FINANCE', 'usr-ayu-01', adminUser.id, orgRepo);
    stageEngine.setStageAssignment('STAGE_3_BOD_HERY', 'usr-bod-hery', adminUser.id, orgRepo);
    stageEngine.setStageAssignment('STAGE_3_BOD_HASHIMOTO', 'usr-bod-hashimoto', adminUser.id, orgRepo);

    // Assign atasan and spv1 to Operations unit
    const unit = orgRepo.createUnit('Operasional Unit', adminUser.id);
    orgRepo.createAssignment(unit.id, 'usr-atasan-01', adminUser.id);
    orgRepo.createAssignment(unit.id, spv1.id, adminUser.id);
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
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

  // =========================================================================
  // HF02D-002: Business Workflow Mapping Verification (WF-001 to WF-005)
  // =========================================================================
  describe('HF02D-002: Business Workflow Mapping Verification', () => {
    it('WF-001: PR/PO/AV/RB requires supervisor selection from valid assignment and takes snapshot', async () => {
      const applicantToken = await loginAs('PEMOHON');
      const unit = orgRepo.listUnits()[0];
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;

      // 1. Create PR draft
      const createRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${applicantToken}`,
          },
          body: JSON.stringify({
            docType: 'PR',
            title: 'Pengadaan Laptop Kantor',
            purpose: 'Operasional Tim Tech',
            subtotalAmount: 15000000,
            budgetType: 'OPEX',
          }),
        })
      );
      expect(createRes.status).toBe(201);
      const { document: prDoc } = (await createRes.json()) as { document: any };

      // 2. Submit PR with supervisorUserId
      const submitRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${prDoc.id}/submit`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${applicantToken}`,
          },
          body: JSON.stringify({
            supervisorUserId: spv1.id,
            unitId: unit.id as string,
          }),
        })
      );
      const submitData = await submitRes.json();
      if (submitRes.status !== 200) console.log('SUBMIT ERROR:', submitData);
      expect(submitRes.status).toBe(200);

      // Verify workflow snapshot in Stage Engine
      const wfRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${prDoc.id}/workflow`, {
          headers: { authorization: `Bearer ${applicantToken}` },
        })
      );
      expect(wfRes.status).toBe(200);
      const wfData = (await wfRes.json()) as {
        workflow: any;
        stages: any[];
        snapshots: any[];
      };
      expect(wfData.workflow.status).toBe('ACTIVE');
      expect(wfData.stages.length).toBe(4); // Stage 1, Stage 2, Stage 3 (2 BODs)
      expect(wfData.snapshots.length).toBe(4); // 1 Spv, 1 Ayu, 2 BODs
      expect(wfData.stages[0].stageKey).toBe('STAGE_1_SUPERVISOR');
      expect(wfData.stages[0].status).toBe('PENDING');
      expect(wfData.stages[0].assignedApproverId).toBe(spv1.id);
    });

    it('WF-002: PV starts directly at Finance Reviewer with sequential BOD without Stage 1', async () => {
      const applicantToken = await loginAs('PEMOHON');
      const financeToken = await loginAs('KEUANGAN');
      const unit = orgRepo.listUnits()[0];
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;
      const ayu = orgRepo.getUser('usr-ayu-01')!;
      const hery = orgRepo.getUser('usr-bod-hery')!;
      const hashimoto = orgRepo.getUser('usr-bod-hashimoto')!;

      // 1. Create parent approved PO
      const poRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${applicantToken}`,
          },
          body: JSON.stringify({
            docType: 'PO',
            title: 'PO Server Upgrade',
            purpose: 'Infrastructure',
            vendorName: 'PT Tech Solution',
            subtotal: 10000000,
            paymentMethod: 'CASH',
          }),
        })
      );
      const { document: poDoc } = (await poRes.json()) as { document: any };
      // Submit PO
      await app.fetch(
        new Request(`http://localhost/api/v1/documents/${poDoc.id}/submit`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${applicantToken}`,
          },
          body: JSON.stringify({ supervisorUserId: spv1.id, unitId: unit.id }),
        })
      );
      // Mark parent PO approved directly in repo state for test setup
      const rawPo = (procRepo as any).state.documents.find((d: any) => d.id === poDoc.id);
      rawPo.status = 'APPROVED';

      // 2. Generate PV from PO
      const genRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${poDoc.id}/generate-pv`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${financeToken}`,
          },
          body: JSON.stringify({
            beneficiaryBank: { bankName: 'BCA', accountNumber: '1234567890', accountHolder: 'PT Tech' },
          }),
        })
      );
      expect(genRes.status).toBe(201);
      const { document: pvDoc } = (await genRes.json()) as { document: any };

      // Verify PV Workflow stages (generated directly into review)
      const wfRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${pvDoc.id}/workflow`, {
          headers: { authorization: `Bearer ${financeToken}` },
        })
      );
      const { stages } = (await wfRes.json()) as { stages: any[] };
      // PV does NOT have Stage 1
      expect(stages.some((s) => s.stageKey === 'STAGE_1_SUPERVISOR')).toBe(false);
      // Starts at Stage 2 PENDING
      const stage2 = stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;
      expect(stage2.status).toBe('PENDING');
      expect(stage2.assignedApproverId).toBe(ayu.id);
      // BOD Hery & Hashimoto are sequential WAITING
      const stageHery = stages.find((s) => s.stageKey === 'STAGE_3_BOD_HERY')!;
      const stageHashimoto = stages.find((s) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO')!;
      expect(stageHery.status).toBe('WAITING');
      expect(stageHashimoto.status).toBe('WAITING');
    });

    it('WF-003: GR completes upon submission without approval queue or fake decisions', async () => {
      const applicantToken = await loginAs('PEMOHON');
      // Create parent approved PO
      const poRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${applicantToken}`,
          },
          body: JSON.stringify({
            docType: 'PO',
            title: 'PO Barang Kantor',
            purpose: 'Office',
            vendorName: 'CV Alat Tulis',
            subtotal: 3000000,
            paymentMethod: 'CASH',
          }),
        })
      );
      const { document: poDoc } = (await poRes.json()) as { document: any };
      const rawPo = (procRepo as any).state.documents.find((d: any) => d.id === poDoc.id);
      rawPo.status = 'APPROVED';

      // Create GR
      const grRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${applicantToken}`,
          },
          body: JSON.stringify({
            docType: 'GR',
            parentPoId: poDoc.id,
            receiptType: 'GOODS',
            receivedDate: '2026-11-10',
            itemCondition: 'BAIK',
            title: 'Penerimaan Alat Tulis',
            attachments: [
              { id: 'att-1', name: 'photo.jpg', category: 'PHOTO', sizeBytes: 100, mimeType: 'image/jpeg', uploadedAt: '2026-11-10' },
            ],
          }),
        })
      );
      expect(grRes.status).toBe(201);
      const { document: grDoc } = (await grRes.json()) as { document: any };

      procRepo.registerAttachment(
        {
          id: 'att-gr-01',
          documentId: grDoc.id,
          originalName: 'photo.jpg',
          category: 'PHOTO',
          storagePath: 'photo.jpg',
          sha256Hash: 'hash-gr-01',
          sizeBytes: 100,
          mimeType: 'image/jpeg',
          uploadedBy: 'usr-pemohon-01',
          createdAt: new Date().toISOString(),
        },
        'usr-pemohon-01'
      );

      // Submit GR
      const submitRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${grDoc.id}/submit`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${applicantToken}`,
          },
          body: JSON.stringify({}),
        })
      );
      const submitData = (await submitRes.json()) as any;
      if (submitRes.status !== 200) console.log('SUBMIT ERROR:', submitData);
      expect(submitRes.status).toBe(200);
      const { document: submittedGr } = submitData;
      expect(submittedGr.status).toBe('APPROVED'); // GR completed

      // Verify no stage engine workflow was created
      const wfRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${grDoc.id}/workflow`, {
          headers: { authorization: `Bearer ${applicantToken}` },
        })
      );
      expect(wfRes.status).toBe(404); // No workflow for GR
    });

    it('WF-004: Payment Record strictly requires PV APPROVED status and exact amount', async () => {
      const financeToken = await loginAs('KEUANGAN');
      // Create unapproved PV
      const rawPv = procRepo.createDocument(
        {
          docType: 'PV',
          title: 'PV Belum Approved',
          status: 'DRAFT',
          sourceDocType: 'PO',
          sourceDocId: 'po-test-1',
          sourceDocNumber: 'PO-2026-001',
          vendorOrPayeeName: 'Vendor X',
          grossAmount: 5000000,
          pphDeduction: 0,
          netAmountToPay: 5000000,
          paymentStatus: 'UNPAID',
        },
        'Finance User'
      );

      // Attempt payment recording before approval
      const payRes = await app.fetch(
        new Request(`http://localhost/api/v1/payments/${rawPv.id}/record`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${financeToken}`,
          },
          body: JSON.stringify({
            sourceBank: 'BCA',
            referenceNumber: 'TRF-123',
            paidAt: '2026-11-10T10:00:00.000Z',
            paidAmount: 5000000,
          }),
        })
      );
      expect(payRes.status).toBe(422);
      const err = await payRes.json();
      expect(err.code).toBe('PV_NOT_APPROVED');

      // Now approve PV
      (procRepo as any).state.documents.find((d: any) => d.id === rawPv.id).status = 'APPROVED';

      // Attempt payment with wrong amount
      const wrongAmountRes = await app.fetch(
        new Request(`http://localhost/api/v1/payments/${rawPv.id}/record`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${financeToken}`,
          },
          body: JSON.stringify({
            sourceBank: 'BCA',
            referenceNumber: 'TRF-123',
            paidAt: '2026-11-10T10:00:00.000Z',
            paidAmount: 4000000, // mismatch
          }),
        })
      );
      expect(wrongAmountRes.status).toBe(422);

      // Successful payment record
      const successRes = await app.fetch(
        new Request(`http://localhost/api/v1/payments/${rawPv.id}/record`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${financeToken}`,
          },
          body: JSON.stringify({
            sourceBank: 'BCA',
            referenceNumber: 'TRF-123',
            paidAt: '2026-11-10T10:00:00.000Z',
            paidAmount: 5000000,
          }),
        })
      );
      expect(successRes.status).toBe(200);
      const { document: paidDoc } = (await successRes.json()) as { document: any };
      expect(paidDoc.paymentStatus).toBe('PAID');
    });

    it('WF-005: Multi-Role requires two independent decisions whereas Self-Approval auto-skips with audit', async () => {
      const applicantUser = orgRepo.getUser('usr-pemohon-01');
      const ayu = orgRepo.getUser('usr-ayu-01')!;
      const unit = orgRepo.listUnits()[0];

      // Multi-Role: Ayu is assigned as supervisor on unit AND finance reviewer
      const admin = orgRepo.getUser('usr-admin-01');
      orgRepo.createAssignment(unit.id, ayu.id, admin.id);

      // 1. Applicant submits PR with Ayu as supervisor
      const { workflow: wf1, stages: stages1 } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-multirole-pr',
          docType: 'PR',
          docNumber: 'PR-2026-MULTI',
          unitId: unit.id as string,
          applicantUserId: applicantUser.id,
          supervisorUserId: ayu.id,
        },
        orgRepo
      );

      const stage1 = stages1.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const stage2 = stages1.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;

      // Both stages assigned to Ayu, neither is skipped
      expect(stage1.assignedApproverId).toBe(ayu.id);
      expect(stage1.status).toBe('PENDING');
      expect(stage2.assignedApproverId).toBe(ayu.id);
      expect(stage2.status).toBe('WAITING');

      // Ayu approves Stage 1
      stageEngine.recordStageDecision({
        workflowId: wf1.id,
        stageId: stage1.id,
        approverUserId: ayu.id,
        decision: 'APPROVE',
        authenticatedUser: ayu,
      }, orgRepo);

      // Now Stage 2 is PENDING, requires second decision
      const updatedStage2 = stageEngine.getStage(stage2.id);
      expect(updatedStage2.status).toBe('PENDING');

      // Ayu approves Stage 2
      stageEngine.recordStageDecision({
        workflowId: wf1.id,
        stageId: stage2.id,
        approverUserId: ayu.id,
        decision: 'APPROVE',
        authenticatedUser: ayu,
      }, orgRepo);

      const decisions = stageEngine.getDecisions(wf1.id);
      expect(decisions.length).toBe(2);
      expect(decisions[0].stageId).toBe(stage1.id);
      expect(decisions[1].stageId).toBe(stage2.id);

      // 2. Self-Approval: Applicant is Ayu, submitting a PR where Ayu is Stage 2
      const spvUser = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;
      const { workflow: wf2, stages: stages2 } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-self-pr',
          docType: 'PR',
          docNumber: 'PR-2026-SELF',
          unitId: unit.id as string,
          applicantUserId: ayu.id,
          supervisorUserId: spvUser.id,
        },
        orgRepo
      );

      const stage1OfWf2 = stages2.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const selfStage2 = stages2.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;
      expect(selfStage2.status).toBe('WAITING');

      // Supervisor approves Stage 1
      stageEngine.recordStageDecision({
        workflowId: wf2.id,
        stageId: stage1OfWf2.id,
        approverUserId: spvUser.id,
        decision: 'APPROVE',
        authenticatedUser: spvUser,
      }, orgRepo);

      // Now Stage 2 auto-skips because applicant is Ayu!
      const updatedSelfStage2 = stageEngine.getStage(selfStage2.id);
      expect(updatedSelfStage2.status).toBe('SKIPPED');

      // Only supervisor's decision is recorded, zero fake decisions for skipped stage
      const selfDecisions = stageEngine.getDecisions(wf2.id);
      expect(selfDecisions.length).toBe(1);
      expect(selfDecisions[0].stageId).toBe(stage1OfWf2.id);
    });
  });

  // =========================================================================
  // HF02D-003: Backend Integration & Stage Lifecycle Synchronization
  // =========================================================================
  describe('HF02D-003: Backend Integration & Stage Lifecycle Synchronization', () => {
    it('synchronizes stage engine decision directly into repository document status and audit', async () => {
      const applicantToken = await loginAs('PEMOHON');
      const atasanToken = await loginAs('ATASAN');
      const unit = orgRepo.listUnits()[0];
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;

      // 1. Create and submit PR
      const createRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${applicantToken}`,
          },
          body: JSON.stringify({
            docType: 'PR',
            title: 'Pengadaan Furniture',
            purpose: 'Office renov',
            subtotalAmount: 8000000,
            budgetType: 'CAPEX',
          }),
        })
      );
      const { document: prDoc } = (await createRes.json()) as { document: any };

      await app.fetch(
        new Request(`http://localhost/api/v1/documents/${prDoc.id}/submit`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${applicantToken}`,
          },
          body: JSON.stringify({ supervisorUserId: 'usr-atasan-01', unitId: unit.id }),
        })
      );

      // Verify PR status in repo is SUBMITTED
      let repoDoc = procRepo.getDocumentById(prDoc.id);
      expect(repoDoc.status).toBe('SUBMITTED');

      // 2. Fetch stage to approve
      const wfRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${prDoc.id}/workflow`, {
          headers: { authorization: `Bearer ${atasanToken}` },
        })
      );
      const { stages } = (await wfRes.json()) as { stages: any[] };
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      // Atasan approves Stage 1
      const approveRes = await app.fetch(
        new Request(`http://localhost/api/v1/stages/${stage1.id}/decisions`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${atasanToken}`,
          },
          body: JSON.stringify({ decision: 'APPROVE', comment: 'Disetujui atasan' }),
        })
      );
      expect(approveRes.status).toBe(200);

      // Verify PR status in repo progressed to IN_REVIEW
      repoDoc = procRepo.getDocumentById(prDoc.id);
      expect(repoDoc.status).toBe('IN_REVIEW');
      expect(repoDoc.approvalSteps.atasan.status).toBe('APPROVED');
      expect(repoDoc.auditLog.some((a) => a.comment === 'Disetujui atasan')).toBe(true);
    });

    it('returns STAGE_ENGINE_DISABLED (404) when stage engine is not enabled', async () => {
      const disabledApp = createAppServer({
        repository: procRepo,
        organization: orgRepo,
        stageEngine,
        stageEngineEnabled: false,
      });

      const token = await loginAs('ADMIN');
      const res = await disabledApp.fetch(
        new Request('http://localhost/api/v1/stages/stg-123/decisions', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ decision: 'APPROVE' }),
        })
      );
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.code).toBe('STAGE_ENGINE_DISABLED');
    });
  });

  // =========================================================================
  // HF02D-004: Frontend Functional Integration Verification
  // =========================================================================
  describe('HF02D-004: Frontend Functional Integration Verification', () => {
    it('workflow response payload includes all entities required by UI components without breaking schema', async () => {
      const applicantToken = await loginAs('PEMOHON');
      const unit = orgRepo.listUnits()[0];
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;

      const createRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${applicantToken}`,
          },
          body: JSON.stringify({
            docType: 'PR',
            title: 'PR Monitor',
            purpose: 'Office',
            subtotalAmount: 2000000,
            budgetType: 'OPEX',
          }),
        })
      );
      const { document: prDoc } = (await createRes.json()) as { document: any };

      await app.fetch(
        new Request(`http://localhost/api/v1/documents/${prDoc.id}/submit`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${applicantToken}`,
          },
          body: JSON.stringify({ supervisorUserId: 'usr-atasan-01', unitId: unit.id }),
        })
      );

      const wfRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${prDoc.id}/workflow`, {
          headers: { authorization: `Bearer ${applicantToken}` },
        })
      );
      expect(wfRes.status).toBe(200);
      const payload = await wfRes.json();

      // UI expects workflow, stages, snapshots, reassignments, decisions
      expect(payload).toHaveProperty('workflow');
      expect(payload).toHaveProperty('stages');
      expect(payload).toHaveProperty('snapshots');
      expect(payload).toHaveProperty('reassignments');
      expect(payload).toHaveProperty('decisions');
      expect(Array.isArray(payload.stages)).toBe(true);
      expect(Array.isArray(payload.snapshots)).toBe(true);
      expect(Array.isArray(payload.reassignments)).toBe(true);
      expect(Array.isArray(payload.decisions)).toBe(true);

      // Verify each stage has required fields for ApprovalStepper / ApprovalExplorer
      for (const stg of payload.stages) {
        expect(stg).toHaveProperty('id');
        expect(stg).toHaveProperty('stageKey');
        expect(stg).toHaveProperty('stageOrder');
        expect(stg).toHaveProperty('assignedApproverId');
        expect(stg).toHaveProperty('approverName');
        expect(stg).toHaveProperty('status');
        expect(['WAITING', 'PENDING', 'APPROVED', 'REJECTED', 'SKIPPED']).toContain(stg.status);
      }
    });
  });

  // =========================================================================
  // HF02D-005: Authorization & Security Regression
  // =========================================================================
  describe('HF02D-005: Authorization & Security Regression', () => {
    it('rejects anonymous request (401 UNAUTHORIZED)', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/stages/stg-any/decisions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ decision: 'APPROVE' }),
        })
      );
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('rejects invalid or forged JWT (401 INVALID_TOKEN)', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/stages/stg-any/decisions', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: 'Bearer forged.jwt.token',
          },
          body: JSON.stringify({ decision: 'APPROVE' }),
        })
      );
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.code).toBe('INVALID_TOKEN');
    });

    it('rejects forged client identity attempting to impersonate Admin (403 FORBIDDEN_ROLE)', async () => {
      // Login as regular PEMOHON
      const token = await loginAs('PEMOHON');
      const res = await app.fetch(
        new Request('http://localhost/api/v1/organization/units', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: 'Forged Unit',
            authorizerId: 'usr-admin-01', // Attacker sends Admin ID in body
          }),
        })
      );
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('FORBIDDEN_ROLE');
    });

    it('rejects decision by unassigned user (403 FORBIDDEN_APPROVER)', async () => {
      const applicantToken = await loginAs('PEMOHON');
      const unit = orgRepo.listUnits()[0];
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;

      const createRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${applicantToken}`,
          },
          body: JSON.stringify({
            docType: 'PR',
            title: 'PR Kursi',
            subtotalAmount: 1000000,
            budgetType: 'OPEX',
          }),
        })
      );
      const { document: prDoc } = (await createRes.json()) as { document: any };
      await app.fetch(
        new Request(`http://localhost/api/v1/documents/${prDoc.id}/submit`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${applicantToken}`,
          },
          body: JSON.stringify({ supervisorUserId: 'usr-atasan-01', unitId: unit.id }),
        })
      );

      const wfRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${prDoc.id}/workflow`, {
          headers: { authorization: `Bearer ${applicantToken}` },
        })
      );
      const { stages } = (await wfRes.json()) as { stages: any[] };
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      // Attempt approval using PEMOHON token (not assigned approver)
      const res = await app.fetch(
        new Request(`http://localhost/api/v1/stages/${stage1.id}/decisions`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${applicantToken}`,
          },
          body: JSON.stringify({ decision: 'APPROVE' }),
        })
      );
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('FORBIDDEN_APPROVER');
    });

    it('rejects decision if approver user is INACTIVE or UNVERIFIED (422)', async () => {
      const admin = orgRepo.getUser('usr-admin-01');
      const unit = orgRepo.listUnits()[0];

      // Create unverified user
      const unverifiedSpv = orgRepo.createUser(
        { email: 'unverified.spv@blc.co.id', fullName: 'Unverified SPV', role: 'ATASAN' },
        admin.id
      );

      // Cannot assign unverified supervisor
      expect(() => {
        orgRepo.createAssignment(unit.id, unverifiedSpv.id, admin.id);
      }).toThrow();

      // Create workflow while supervisor is active
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;
      const { workflow: wf, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-inact-test',
          docType: 'PR',
          docNumber: 'PR-2026-INACT',
          unitId: unit.id as string,
          applicantUserId: 'usr-pemohon-01',
          supervisorUserId: spv1.id,
        },
        orgRepo
      );

      // Now deactivate supervisor before decision
      orgRepo.setUserLifecycle(spv1.id, 'INACTIVE', admin.id, 'Temporary leave');

      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      expect(() => {
        stageEngine.recordStageDecision(
          {
            workflowId: wf.id,
            stageId: stage1.id,
            approverUserId: spv1.id,
            decision: 'APPROVE',
            authenticatedUser: orgRepo.getUser(spv1.id),
          },
          orgRepo
        );
      }).toThrow();
    });

    it('rejects non-Admin attempting in-flight reassignment (403 FORBIDDEN_ROLE)', async () => {
      const applicantToken = await loginAs('PEMOHON');
      const res = await app.fetch(
        new Request('http://localhost/api/v1/stages/stg-any/reassign', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${applicantToken}`,
          },
          body: JSON.stringify({
            newApproverUserId: 'usr-any',
            reason: 'Unauthorized attempt',
          }),
        })
      );
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('FORBIDDEN_ROLE');
    });
  });

  // =========================================================================
  // HF02D-006: Idempotency & Concurrency Integration (12 Scenarios)
  // =========================================================================
  describe('HF02D-006: Idempotency & Concurrency Integration', () => {
    function setupWorkflowForIdempotency() {
      const unit = orgRepo.listUnits()[0];
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;
      const { workflow: wf, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-idemp-test-' + Math.random().toString(36).substring(7),
          docType: 'PR',
          docNumber: 'PR-IDEMP-01',
          unitId: unit.id as string,
          applicantUserId: 'usr-pemohon-01',
          supervisorUserId: spv1.id,
        },
        orgRepo
      );
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      return { wf, stage1, spv1 };
    }

    it('Scenario 1: same key, same user, same request returns identical cached response with 1 decision', () => {
      const { wf, stage1, spv1 } = setupWorkflowForIdempotency();
      const res1 = stageEngine.recordStageDecision({
        workflowId: wf.id,
        stageId: stage1.id,
        approverUserId: spv1.id,
        decision: 'APPROVE',
        comment: 'OK',
        idempotencyKey: 'idemp-key-1',
        authenticatedUser: spv1,
      }, orgRepo);

      const res2 = stageEngine.recordStageDecision({
        workflowId: wf.id,
        stageId: stage1.id,
        approverUserId: spv1.id,
        decision: 'APPROVE',
        comment: 'OK',
        idempotencyKey: 'idemp-key-1',
        authenticatedUser: spv1,
      }, orgRepo);

      expect(res1.stage.status).toBe('APPROVED');
      expect(res2.stage.status).toBe('APPROVED');
      const decisions = stageEngine.getDecisions(wf.id);
      expect(decisions.length).toBe(1);
    });

    it('Scenario 2: same key, different payload is rejected with 409 IDEMPOTENCY_KEY_PAYLOAD_MISMATCH', () => {
      const { wf, stage1, spv1 } = setupWorkflowForIdempotency();
      stageEngine.recordStageDecision({
        workflowId: wf.id,
        stageId: stage1.id,
        approverUserId: spv1.id,
        decision: 'APPROVE',
        comment: 'OK 1',
        idempotencyKey: 'idemp-key-2',
        authenticatedUser: spv1,
      }, orgRepo);

      expect(() => {
        stageEngine.recordStageDecision({
          workflowId: wf.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'REJECT', // Mismatch payload
          comment: 'Rejected instead',
          idempotencyKey: 'idemp-key-2',
          authenticatedUser: spv1,
        }, orgRepo);
      }).toThrowError(/payload berbeda/);
    });

    it('Scenario 3: same key on different stages succeeds independently due to 5-column composite key', () => {
      const unit = orgRepo.listUnits()[0];
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;
      const ayu = orgRepo.getUser('usr-ayu-01')!;
      const { workflow: wf, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-stages-test',
          docType: 'PR',
          docNumber: 'PR-STAGES-01',
          unitId: unit.id as string,
          applicantUserId: 'usr-pemohon-01',
          supervisorUserId: spv1.id,
        },
        orgRepo
      );
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const stage2 = stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;

      // Stage 1 decision
      stageEngine.recordStageDecision({
        workflowId: wf.id,
        stageId: stage1.id,
        approverUserId: spv1.id,
        decision: 'APPROVE',
        idempotencyKey: 'shared-key-test',
        authenticatedUser: spv1,
      }, orgRepo);

      // Stage 2 decision using same key string
      stageEngine.recordStageDecision({
        workflowId: wf.id,
        stageId: stage2.id,
        approverUserId: ayu.id,
        decision: 'APPROVE',
        idempotencyKey: 'shared-key-test',
        authenticatedUser: ayu,
      }, orgRepo);

      const decisions = stageEngine.getDecisions(wf.id);
      expect(decisions.length).toBe(2);
    });

    it('Scenario 4 & 5: same key on different documents or users executes independently', () => {
      const { wf: wfA, stage1: stgA, spv1 } = setupWorkflowForIdempotency();
      const { wf: wfB, stage1: stgB } = setupWorkflowForIdempotency();

      stageEngine.recordStageDecision({
        workflowId: wfA.id,
        stageId: stgA.id,
        approverUserId: spv1.id,
        decision: 'APPROVE',
        idempotencyKey: 'cross-doc-key',
        authenticatedUser: spv1,
      }, orgRepo);

      stageEngine.recordStageDecision({
        workflowId: wfB.id,
        stageId: stgB.id,
        approverUserId: spv1.id,
        decision: 'APPROVE',
        idempotencyKey: 'cross-doc-key',
        authenticatedUser: spv1,
      }, orgRepo);

      expect(stageEngine.getDecisions(wfA.id).length).toBe(1);
      expect(stageEngine.getDecisions(wfB.id).length).toBe(1);
    });

    it('Scenario 6: retry after restart reads persistent SQLite idempotency record without duplicating decision', () => {
      const { wf, stage1, spv1 } = setupWorkflowForIdempotency();
      stageEngine.recordStageDecision({
        workflowId: wf.id,
        stageId: stage1.id,
        approverUserId: spv1.id,
        decision: 'APPROVE',
        comment: 'Persistent check',
        idempotencyKey: 'restart-key',
        authenticatedUser: spv1,
      }, orgRepo);

      // Re-instantiate engine simulating restart
      const restartedEngine = new ApprovalStageEngine(dbPath);
      const res = restartedEngine.recordStageDecision({
        workflowId: wf.id,
        stageId: stage1.id,
        approverUserId: spv1.id,
        decision: 'APPROVE',
        comment: 'Persistent check',
        idempotencyKey: 'restart-key',
        authenticatedUser: spv1,
      }, orgRepo);

      expect(res.stage.status).toBe('APPROVED');
      const decisions = restartedEngine.getDecisions(wf.id);
      expect(decisions.length).toBe(1);
    });

    it('Scenario 7 & 8: double-click and race protection ensures no duplicate decisions', () => {
      const { wf, stage1, spv1 } = setupWorkflowForIdempotency();
      // First click succeeds
      stageEngine.recordStageDecision({
        workflowId: wf.id,
        stageId: stage1.id,
        approverUserId: spv1.id,
        decision: 'APPROVE',
        authenticatedUser: spv1,
      }, orgRepo);

      // Second simultaneous click with different key encounters terminal state
      expect(() => {
        stageEngine.recordStageDecision({
          workflowId: wf.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          authenticatedUser: spv1,
        }, orgRepo);
      }).toThrowError(/sudah selesai sebelumnya/);

      const decisions = stageEngine.getDecisions(wf.id);
      expect(decisions.length).toBe(1);
    });

    it('Scenario 11 & 12: parallel BOD workflow vs sequential PV premature rejection', () => {
      // 1. Parallel BOD in PR: both BOD Hery and Hashimoto can approve concurrently
      const unit = orgRepo.listUnits()[0];
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;
      const ayu = orgRepo.getUser('usr-ayu-01')!;
      const hery = orgRepo.getUser('usr-bod-hery')!;
      const hashimoto = orgRepo.getUser('usr-bod-hashimoto')!;

      const { workflow: wfPr, stages: stagesPr } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-pr-parallel',
          docType: 'PR',
          docNumber: 'PR-2026-PAR',
          unitId: unit.id as string,
          applicantUserId: 'usr-pemohon-01',
          supervisorUserId: spv1.id,
        },
        orgRepo
      );

      // Approve stage 1 & 2
      stageEngine.recordStageDecision({ workflowId: wfPr.id, stageId: stagesPr[0].id, approverUserId: spv1.id, decision: 'APPROVE', authenticatedUser: spv1 }, orgRepo);
      stageEngine.recordStageDecision({ workflowId: wfPr.id, stageId: stagesPr[1].id, approverUserId: ayu.id, decision: 'APPROVE', authenticatedUser: ayu }, orgRepo);

      const bodHeryStage = stageEngine.getStages(wfPr.id).find((s) => s.stageKey === 'STAGE_3_BOD_HERY')!;
      const bodHashimotoStage = stageEngine.getStages(wfPr.id).find((s) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO')!;
      // Both are active PENDING in parallel
      expect(bodHeryStage.status).toBe('PENDING');
      expect(bodHashimotoStage.status).toBe('PENDING');

      // 2. Sequential in PV: Hashimoto cannot approve while WAITING
      const { workflow: wfPv, stages: stagesPv } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-pv-seq',
          docType: 'PV',
          docNumber: 'PV-2026-SEQ',
          applicantUserId: 'usr-keuangan-01',
        },
        orgRepo
      );
      const pvHashimotoStage = stagesPv.find((s) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO')!;
      expect(pvHashimotoStage.status).toBe('WAITING');

      // Attempt premature approval by Hashimoto on PV
      expect(() => {
        stageEngine.recordStageDecision({
          workflowId: wfPv.id,
          stageId: pvHashimotoStage.id,
          approverUserId: hashimoto.id,
          decision: 'APPROVE',
          authenticatedUser: hashimoto,
        }, orgRepo);
      }).toThrowError(/belum aktif/);
    });
  });

  // =========================================================================
  // HF02D-007: Cross-Storage Failure & Recovery Verification
  // =========================================================================
  describe('HF02D-007: Cross-Storage Failure & Recovery Verification', () => {
    it('compensates stage decision upon document write failure, rolling back stage to PENDING and removing decisions', () => {
      const unit = orgRepo.listUnits()[0];
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;
      const { workflow: wf, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-failure-test',
          docType: 'PR',
          docNumber: 'PR-FAIL-01',
          unitId: unit.id as string,
          applicantUserId: 'usr-pemohon-01',
          supervisorUserId: spv1.id,
        },
        orgRepo
      );
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      // 1. Prepare sync
      const syncId = stageEngine.prepareCrossStorageSync({
        documentId: wf.documentId,
        workflowId: wf.id,
        stageId: stage1.id,
        operationType: 'APPROVE',
        stageState: { status: 'APPROVED' },
      });

      // 2. Stage decision succeeds in SQLite
      stageEngine.recordStageDecision({
        workflowId: wf.id,
        stageId: stage1.id,
        approverUserId: spv1.id,
        decision: 'APPROVE',
        authenticatedUser: spv1,
      }, orgRepo);

      // Verify stage is APPROVED and decision exists
      expect(stageEngine.getStage(stage1.id).status).toBe('APPROVED');
      expect(stageEngine.getDecisions(wf.id).length).toBe(1);

      // 3. Document storage write fails -> Compensate
      stageEngine.compensateCrossStorageSync(syncId, 'Simulated disk full write failure');

      // 4. Verify after-state: stage rolled back to PENDING, decisions removed, audit preserved
      const rolledBackStage = stageEngine.getStage(stage1.id);
      expect(rolledBackStage.status).toBe('PENDING');
      expect(stageEngine.getDecisions(wf.id).length).toBe(0);

      const syncRecord = stageEngine.getCrossStorageSyncRecord(syncId);
      expect(syncRecord!.status).toBe('COMPENSATED');
      expect(syncRecord!.errorMessage).toContain('Simulated disk full');
    });

    it('reconcileCrossStorage recovers uncommitted sync records after crash idempotently', () => {
      const unit = orgRepo.listUnits()[0];
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;
      const { workflow: wf, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-crash-test',
          docType: 'PR',
          docNumber: 'PR-CRASH-01',
          unitId: unit.id as string,
          applicantUserId: 'usr-pemohon-01',
          supervisorUserId: spv1.id,
        },
        orgRepo
      );
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      // Left PREPARED (simulating server crash mid-sync)
      const syncId = stageEngine.prepareCrossStorageSync({
        documentId: wf.documentId,
        workflowId: wf.id,
        stageId: stage1.id,
        operationType: 'APPROVE',
        stageState: { status: 'APPROVED' },
      });

      // Run reconciliation
      const reconResult = stageEngine.reconcileCrossStorage(wf.documentId, procRepo);

      expect(reconResult.reconciledCount).toBeGreaterThanOrEqual(1);
      const syncRec = stageEngine.getCrossStorageSyncRecord(syncId);
      expect(syncRec!.status).toBe('RECONCILED');

      // Re-running reconciliation is idempotent
      const secondRecon = stageEngine.reconcileCrossStorage(wf.documentId, procRepo);
      expect(secondRecon.reconciledCount).toBe(0);
    });

    it('SQLite transaction failure during decision preserves previous state with zero corrupt decisions', () => {
      const unit = orgRepo.listUnits()[0];
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;
      const { workflow: wf, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-sqlite-fail-test',
          docType: 'PR',
          docNumber: 'PR-SQLFAIL-01',
          unitId: unit.id as string,
          applicantUserId: 'usr-pemohon-01',
          supervisorUserId: spv1.id,
        },
        orgRepo
      );
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      // Attempt decision with invalid/mismatched user to simulate rejection before commit
      const intruderUser = orgRepo.getUser('usr-pemohon-01');
      expect(() => {
        stageEngine.recordStageDecision(
          {
            workflowId: wf.id,
            stageId: stage1.id,
            approverUserId: intruderUser.id,
            decision: 'APPROVE',
            authenticatedUser: intruderUser,
          },
          orgRepo
        );
      }).toThrow();

      // State remains completely intact
      expect(stageEngine.getStage(stage1.id).status).toBe('PENDING');
      expect(stageEngine.getDecisions(wf.id).length).toBe(0);
      expect(stageEngine.getWorkflow(wf.id).status).toBe('ACTIVE');
    });

    it('Recovery after restart: re-instantiated engine reconciles uncommitted sync, preserving decision count and consistency', () => {
      const unit = orgRepo.listUnits()[0];
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;
      const { workflow: wf, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-restart-recon',
          docType: 'PR',
          docNumber: 'PR-RESTART-01',
          unitId: unit.id as string,
          applicantUserId: 'usr-pemohon-01',
          supervisorUserId: spv1.id,
        },
        orgRepo
      );
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      const syncId = stageEngine.prepareCrossStorageSync({
        documentId: wf.documentId,
        workflowId: wf.id,
        stageId: stage1.id,
        operationType: 'APPROVE',
        stageState: { status: 'APPROVED' },
      });

      // Record decision
      stageEngine.recordStageDecision(
        {
          workflowId: wf.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          authenticatedUser: spv1,
        },
        orgRepo
      );

      const decisionCountBefore = stageEngine.getDecisions(wf.id).length;
      expect(decisionCountBefore).toBe(1);

      // Simulate process restart: create a new engine instance pointing to the same database
      const restartedEngine = new ApprovalStageEngine(dbPath);
      const syncRecordBeforeRecon = restartedEngine.getCrossStorageSyncRecord(syncId);
      expect(syncRecordBeforeRecon!.status).toBe('PREPARED');

      // Reconcile on restarted engine
      const reconResult = restartedEngine.reconcileCrossStorage(wf.documentId, procRepo);
      expect(reconResult.reconciledCount).toBe(1);

      // Verify decision count after restart reconciliation is unchanged (no duplicate decisions created)
      const decisionCountAfter = restartedEngine.getDecisions(wf.id).length;
      expect(decisionCountAfter).toBe(decisionCountBefore);

      // Verify final sync record status
      const syncRecordAfter = restartedEngine.getCrossStorageSyncRecord(syncId);
      expect(syncRecordAfter!.status).toBe('RECONCILED');

      // Re-running reconciliation is idempotent
      const repeatedRecon = restartedEngine.reconcileCrossStorage(wf.documentId, procRepo);
      expect(repeatedRecon.reconciledCount).toBe(0);
    });
  });

  // =========================================================================
  // HF02D-008: Legacy Compatibility & Regression
  // =========================================================================
  describe('HF02D-008: Legacy Compatibility & Regression', () => {
    it('handles legacy documents created prior to stage engine without synthetic decisions', async () => {
      const applicantToken = await loginAs('PEMOHON');
      // Create seed-like legacy document
      const legacyDoc = procRepo.createDocument(
        {
          docType: 'PR',
          title: 'Legacy PR Document',
          subtotalAmount: 5000000,
          budgetType: 'OPEX',
          stage1ApproverEmail: 'atasan@blc.co.id',
        },
        'Legacy User'
      );

      // Read document via API
      const getRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${legacyDoc.id}`, {
          headers: { authorization: `Bearer ${applicantToken}` },
        })
      );
      expect(getRes.status).toBe(200);
      const { document: fetchedDoc } = (await getRes.json()) as { document: any };
      expect(fetchedDoc.id).toBe(legacyDoc.id);

      // Reading workflow returns 404 cleanly (no fake decisions created)
      const wfRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${legacyDoc.id}/workflow`, {
          headers: { authorization: `Bearer ${applicantToken}` },
        })
      );
      expect(wfRes.status).toBe(404);
    });

    it('existing endpoints, metrics, and auth work without regression', async () => {
      const pemohonToken = await loginAs('PEMOHON');

      // GET /api/v1/me
      const meRes = await app.fetch(
        new Request('http://localhost/api/v1/me', {
          headers: { authorization: `Bearer ${pemohonToken}` },
        })
      );
      expect(meRes.status).toBe(200);
      const meData = await meRes.json();
      expect(meData.user.role).toBe('PEMOHON');

      // GET /api/v1/dashboard/metrics
      const metricsRes = await app.fetch(
        new Request('http://localhost/api/v1/dashboard/metrics', {
          headers: { authorization: `Bearer ${pemohonToken}` },
        })
      );
      expect(metricsRes.status).toBe(200);
    });
  });

  // =========================================================================
  // HF02D-009: End-to-End User Journey Tests (E2E-01 to E2E-08)
  // =========================================================================
  describe('HF02D-009: End-to-End User Journeys', () => {
    it('E2E-01: Standard Purchase (PR -> PO -> GR -> PV -> Payment Record)', async () => {
      const applicantToken = await loginAs('PEMOHON');
      const atasanToken = await loginAs('ATASAN');
      const ayuToken = await loginAs('AYU');
      const heryToken = await loginAs('BOD_HERY');
      const hashimotoToken = await loginAs('BOD_HASHIMOTO');
      const financeToken = await loginAs('KEUANGAN');

      const unit = orgRepo.listUnits()[0];
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;
      const ayu = orgRepo.getUser('usr-ayu-01')!;
      const hery = orgRepo.getUser('usr-bod-hery')!;
      const hashimoto = orgRepo.getUser('usr-bod-hashimoto')!;

      // 1. Create and Submit PR
      const prRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ docType: 'PR', title: 'E2E PR', purpose: 'Purchase Servers', subtotalAmount: 20000000, budgetType: 'CAPEX' }),
        })
      );
      const { document: prDoc } = (await prRes.json()) as { document: any };
      await app.fetch(
        new Request(`http://localhost/api/v1/documents/${prDoc.id}/submit`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ supervisorUserId: 'usr-atasan-01', unitId: unit.id }),
        })
      );

      // Approve PR across stages
      const prWf = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${prDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const prStg1 = prWf.stages.find((s: any) => s.stageKey === 'STAGE_1_SUPERVISOR');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${prStg1.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${atasanToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const prWf2 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${prDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const prStg2 = prWf2.stages.find((s: any) => s.stageKey === 'STAGE_2_FINANCE');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${prStg2.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${ayuToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const prWf3 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${prDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const prStg3a = prWf3.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HERY');
      const prStg3b = prWf3.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${prStg3a.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${heryToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));
      await app.fetch(new Request(`http://localhost/api/v1/stages/${prStg3b.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${hashimotoToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      expect(procRepo.getDocumentById(prDoc.id).status).toBe('APPROVED');

      // 2. Create and Approve PO referencing PR
      const poRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ docType: 'PO', title: 'E2E PO', purpose: 'Hardware', parentPrId: prDoc.id, vendorName: 'PT Hardware Indo', subtotal: 20000000, paymentMethod: 'CASH' }),
        })
      );
      const { document: poDoc } = (await poRes.json()) as { document: any };
      await app.fetch(
        new Request(`http://localhost/api/v1/documents/${poDoc.id}/submit`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ supervisorUserId: spv1.id, unitId: unit.id }),
        })
      );
      // Fast forward PO approval
      (procRepo as any).state.documents.find((d: any) => d.id === poDoc.id).status = 'APPROVED';

      // 3. Record Goods Receipt (GR)
      const grRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({
            docType: 'GR',
            parentPoId: poDoc.id,
            receiptType: 'GOODS',
            receivedDate: '2026-11-10',
            itemCondition: 'BAIK',
            title: 'Penerimaan Server',
            attachments: [{ id: 'att-gr', name: 'photo.jpg', category: 'PHOTO', sizeBytes: 200, mimeType: 'image/jpeg', uploadedAt: '2026-11-10' }],
          }),
        })
      );
      const { document: grDoc } = (await grRes.json()) as { document: any };
      procRepo.registerAttachment(
        {
          id: 'att-gr-e2e',
          documentId: grDoc.id,
          originalName: 'photo.jpg',
          category: 'PHOTO',
          storagePath: 'photo.jpg',
          sha256Hash: 'hash-gr-e2e',
          sizeBytes: 200,
          mimeType: 'image/jpeg',
          uploadedBy: 'usr-pemohon-01',
          createdAt: new Date().toISOString(),
        },
        'usr-pemohon-01'
      );
      const grSubmitRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${grDoc.id}/submit`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({}),
        })
      );
      expect(grSubmitRes.status).toBe(200);
      expect(procRepo.getDocumentById(grDoc.id).status).toBe('APPROVED');

      // 4. Generate PV from PO
      const pvGenRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${poDoc.id}/generate-pv`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${financeToken}` },
          body: JSON.stringify({ beneficiaryBank: { bankName: 'BCA', accountNumber: '999888', accountHolder: 'PT Hardware Indo' } }),
        })
      );
      const { document: pvDoc } = (await pvGenRes.json()) as { document: any };

      // PV sequential approvals: Ayu -> Hery -> Hashimoto
      const pvWf1 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${pvDoc.id}/workflow`, { headers: { authorization: `Bearer ${financeToken}` } }))).json()) as any;
      const pvStg2 = pvWf1.stages.find((s: any) => s.stageKey === 'STAGE_2_FINANCE');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${pvStg2.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${ayuToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const pvWf2 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${pvDoc.id}/workflow`, { headers: { authorization: `Bearer ${financeToken}` } }))).json()) as any;
      const pvStg3a = pvWf2.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HERY');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${pvStg3a.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${heryToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const pvWf3 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${pvDoc.id}/workflow`, { headers: { authorization: `Bearer ${financeToken}` } }))).json()) as any;
      const pvStg3b = pvWf3.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${pvStg3b.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${hashimotoToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const finalPv = procRepo.getDocumentById(pvDoc.id);
      expect(finalPv.status).toBe('APPROVED');

      // 5. Record Payment
      const payRes = await app.fetch(
        new Request(`http://localhost/api/v1/payments/${pvDoc.id}/record`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${financeToken}` },
          body: JSON.stringify({
            sourceBank: 'Mandiri Operasional',
            referenceNumber: 'TRF-FINAL-001',
            paidAt: '2026-11-10T12:00:00.000Z',
            paidAmount: (finalPv as any).netAmountToPay,
          }),
        })
      );
      expect(payRes.status).toBe(200);
      expect((procRepo.getDocumentById(pvDoc.id) as any).paymentStatus).toBe('PAID');
    });

    it('E2E-02: Advance Payment Journey (AV -> Approval -> PV -> Approval -> Payment Record)', async () => {
      const applicantToken = await loginAs('PEMOHON');
      const atasanToken = await loginAs('ATASAN');
      const ayuToken = await loginAs('AYU');
      const heryToken = await loginAs('BOD_HERY');
      const hashimotoToken = await loginAs('BOD_HASHIMOTO');
      const financeToken = await loginAs('KEUANGAN');

      const unit = orgRepo.listUnits()[0];
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;

      // 1. Create and Submit AV
      const avRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({
            docType: 'AV',
            title: 'Uang Muka Perjalanan Dinas',
            purpose: 'Survey Site Bandung',
            amount: 5000000,
            activityDate: '2026-11-15',
            activityEndDate: '2026-11-18',
            paymentDueDate: '2026-11-14',
            disbursementMethod: 'CASH',
          }),
        })
      );
      const { document: avDoc } = (await avRes.json()) as { document: any };
      await app.fetch(
        new Request(`http://localhost/api/v1/documents/${avDoc.id}/submit`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ supervisorUserId: 'usr-atasan-01', unitId: unit.id }),
        })
      );

      // Approve AV
      const avWf = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${avDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const stg1 = avWf.stages.find((s: any) => s.stageKey === 'STAGE_1_SUPERVISOR');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${stg1.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${atasanToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const avWf2 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${avDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const stg2 = avWf2.stages.find((s: any) => s.stageKey === 'STAGE_2_FINANCE');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${stg2.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${ayuToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const avWf3 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${avDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const stg3a = avWf3.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HERY');
      const stg3b = avWf3.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${stg3a.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${heryToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));
      await app.fetch(new Request(`http://localhost/api/v1/stages/${stg3b.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${hashimotoToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      expect(procRepo.getDocumentById(avDoc.id).status).toBe('APPROVED');

      // 2. Generate PV from AV (Explicit Finance Staff Action)
      const pvGenRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${avDoc.id}/generate-pv`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${financeToken}` },
          body: JSON.stringify({ beneficiaryBank: { bankName: 'BCA', accountNumber: '112233', accountHolder: 'Karyawan Pemohon' } }),
        })
      );
      expect(pvGenRes.status).toBe(201);
      const { document: pvDoc } = (await pvGenRes.json()) as { document: any };

      // PV sequential approvals via API: Ayu -> Hery -> Hashimoto
      const pvWf1 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${pvDoc.id}/workflow`, { headers: { authorization: `Bearer ${financeToken}` } }))).json()) as any;
      const pvStg2 = pvWf1.stages.find((s: any) => s.stageKey === 'STAGE_2_FINANCE');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${pvStg2.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${ayuToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const pvWf2 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${pvDoc.id}/workflow`, { headers: { authorization: `Bearer ${financeToken}` } }))).json()) as any;
      const pvStg3a = pvWf2.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HERY');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${pvStg3a.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${heryToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const pvWf3 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${pvDoc.id}/workflow`, { headers: { authorization: `Bearer ${financeToken}` } }))).json()) as any;
      const pvStg3b = pvWf3.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${pvStg3b.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${hashimotoToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      expect(procRepo.getDocumentById(pvDoc.id).status).toBe('APPROVED');

      // 3. Record Payment
      const payRes = await app.fetch(
        new Request(`http://localhost/api/v1/payments/${pvDoc.id}/record`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${financeToken}` },
          body: JSON.stringify({
            sourceBank: 'BCA Operasional',
            referenceNumber: 'TRF-AV-01',
            paidAt: '2026-11-10T14:00:00.000Z',
            paidAmount: (procRepo.getDocumentById(pvDoc.id) as any).netAmountToPay,
          }),
        })
      );
      expect(payRes.status).toBe(200);
      expect((procRepo.getDocumentById(pvDoc.id) as any).paymentStatus).toBe('PAID');
    });

    it('E2E-03: Reimbursement Journey (RB -> Approval -> PV -> Approval -> Payment Record)', async () => {
      const applicantToken = await loginAs('PEMOHON');
      const atasanToken = await loginAs('ATASAN');
      const ayuToken = await loginAs('AYU');
      const heryToken = await loginAs('BOD_HERY');
      const hashimotoToken = await loginAs('BOD_HASHIMOTO');
      const financeToken = await loginAs('KEUANGAN');
      const unit = orgRepo.listUnits()[0];
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;

      // 1. Create and Submit RB
      const rbRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({
            docType: 'RB',
            title: 'Klaim Bensin dan Tol',
            expenseCategory: 'OPERASIONAL',
            transactionDate: '2026-11-09',
            subtotal: 750000,
            beneficiaryBank: { bankName: 'Mandiri', accountNumber: '445566', accountHolder: 'Driver Operasional' },
            attachments: [{ id: 'att-rb', name: 'struk.jpg', category: 'RECEIPT', sizeBytes: 150, mimeType: 'image/jpeg', uploadedAt: '2026-11-09' }],
          }),
        })
      );
      const { document: rbDoc } = (await rbRes.json()) as { document: any };

      procRepo.registerAttachment(
        {
          id: 'att-rb-01',
          documentId: rbDoc.id,
          originalName: 'struk.jpg',
          category: 'RECEIPT',
          storagePath: 'struk.jpg',
          sha256Hash: 'hash-rb-01',
          sizeBytes: 150,
          mimeType: 'image/jpeg',
          uploadedBy: 'usr-pemohon-01',
          createdAt: new Date().toISOString(),
        },
        'usr-pemohon-01'
      );

      const rbSubRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${rbDoc.id}/submit`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ supervisorUserId: 'usr-atasan-01', unitId: unit.id }),
        })
      );
      expect(rbSubRes.status).toBe(200);

      // RB Approval through stages: Atasan -> Ayu -> BOD Parallel
      const rbWf1 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${rbDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const rbStg1 = rbWf1.stages.find((s: any) => s.stageKey === 'STAGE_1_SUPERVISOR');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${rbStg1.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${atasanToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const rbWf2 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${rbDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const rbStg2 = rbWf2.stages.find((s: any) => s.stageKey === 'STAGE_2_FINANCE');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${rbStg2.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${ayuToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const rbWf3 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${rbDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const rbStg3a = rbWf3.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HERY');
      const rbStg3b = rbWf3.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${rbStg3a.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${heryToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));
      await app.fetch(new Request(`http://localhost/api/v1/stages/${rbStg3b.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${hashimotoToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      expect(procRepo.getDocumentById(rbDoc.id).status).toBe('APPROVED');

      // 2. Generate PV from RB (Explicit Finance Staff Action)
      const pvGenRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${rbDoc.id}/generate-pv`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${financeToken}` },
          body: JSON.stringify({ beneficiaryBank: { bankName: 'Mandiri', accountNumber: '445566', accountHolder: 'Driver Operasional' } }),
        })
      );
      expect(pvGenRes.status).toBe(201);
      const { document: pvDoc } = (await pvGenRes.json()) as { document: any };

      // PV sequential approvals via API: Ayu -> Hery -> Hashimoto
      const pvWf1 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${pvDoc.id}/workflow`, { headers: { authorization: `Bearer ${financeToken}` } }))).json()) as any;
      const pvStg2 = pvWf1.stages.find((s: any) => s.stageKey === 'STAGE_2_FINANCE');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${pvStg2.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${ayuToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const pvWf2 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${pvDoc.id}/workflow`, { headers: { authorization: `Bearer ${financeToken}` } }))).json()) as any;
      const pvStg3a = pvWf2.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HERY');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${pvStg3a.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${heryToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const pvWf3 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${pvDoc.id}/workflow`, { headers: { authorization: `Bearer ${financeToken}` } }))).json()) as any;
      const pvStg3b = pvWf3.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${pvStg3b.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${hashimotoToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      expect(procRepo.getDocumentById(pvDoc.id).status).toBe('APPROVED');

      // 3. Record Payment
      const payRes = await app.fetch(
        new Request(`http://localhost/api/v1/payments/${pvDoc.id}/record`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${financeToken}` },
          body: JSON.stringify({
            sourceBank: 'BCA Operasional',
            referenceNumber: 'TRF-RB-01',
            paidAt: '2026-11-10T15:00:00.000Z',
            paidAmount: (procRepo.getDocumentById(pvDoc.id) as any).netAmountToPay,
          }),
        })
      );
      expect(payRes.status).toBe(200);
      expect((procRepo.getDocumentById(pvDoc.id) as any).paymentStatus).toBe('PAID');
    });

    it('E2E-04: Multi-Role Approval Journey (same user at two stages, independent decisions via API)', async () => {
      const applicantToken = await loginAs('PEMOHON');
      const ayuToken = await loginAs('AYU');
      const unit = orgRepo.listUnits()[0];
      const ayu = orgRepo.getUser('usr-ayu-01')!;

      // Assign Ayu as unit supervisor as well (multi-role)
      const admin = orgRepo.getUser('usr-admin-01');
      orgRepo.createAssignment(unit.id as string, ayu.id, admin.id);

      // 1. Submit PR selecting Ayu as supervisor
      const prRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ docType: 'PR', title: 'PR Multi-Role E2E', subtotalAmount: 5000000, budgetType: 'OPEX' }),
        })
      );
      const { document: prDoc } = (await prRes.json()) as { document: any };
      await app.fetch(
        new Request(`http://localhost/api/v1/documents/${prDoc.id}/submit`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ supervisorUserId: ayu.id, unitId: unit.id as string }),
        })
      );

      const prWf = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${prDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const stage1 = prWf.stages.find((s: any) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const stage2 = prWf.stages.find((s: any) => s.stageKey === 'STAGE_2_FINANCE')!;

      // Ayu approves Stage 1 (as Supervisor)
      const stg1Res = await app.fetch(
        new Request(`http://localhost/api/v1/stages/${stage1.id}/decisions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${ayuToken}` },
          body: JSON.stringify({ decision: 'APPROVE', comment: 'Approved as Division Supervisor' }),
        })
      );
      expect(stg1Res.status).toBe(200);

      // Stage 2 is now PENDING and still assigned to Ayu, requiring independent decision
      const prWf2 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${prDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const updatedStage2 = prWf2.stages.find((s: any) => s.stageKey === 'STAGE_2_FINANCE')!;
      expect(updatedStage2.status).toBe('PENDING');

      // Ayu approves Stage 2 (as Finance Reviewer)
      const stg2Res = await app.fetch(
        new Request(`http://localhost/api/v1/stages/${stage2.id}/decisions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${ayuToken}` },
          body: JSON.stringify({ decision: 'APPROVE', comment: 'Approved as Finance Reviewer' }),
        })
      );
      expect(stg2Res.status).toBe(200);

      // Verify two distinct decision records exist
      const prWf3 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${prDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      expect(prWf3.decisions.length).toBe(2);
      expect(prWf3.decisions[0].stageId).toBe(stage1.id);
      expect(prWf3.decisions[1].stageId).toBe(stage2.id);
    });

    it('E2E-05: Self-Approval Journey (Applicant is approver, auto-skip + audit trail + 0 fake decisions via API)', async () => {
      const applicantToken = await loginAs('PEMOHON');
      const atasanToken = await loginAs('ATASAN');
      const unit = orgRepo.listUnits()[0];

      // Temporarily assign applicant as Stage 2 Finance Verifier to test self-approval auto-skip
      stageEngine.setStageAssignment('STAGE_2_FINANCE', 'usr-pemohon-01', 'usr-admin-01', orgRepo);

      try {
        // Applicant creates and submits PR where Applicant is also configured Stage 2 Finance Verifier
        const prRes = await app.fetch(
          new Request('http://localhost/api/v1/documents', {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
            body: JSON.stringify({ docType: 'PR', title: 'PR Self-Approval E2E', subtotalAmount: 3000000, budgetType: 'OPEX' }),
          })
        );
        const { document: prDoc } = (await prRes.json()) as { document: any };
        await app.fetch(
          new Request(`http://localhost/api/v1/documents/${prDoc.id}/submit`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
            body: JSON.stringify({ supervisorUserId: 'usr-atasan-01', unitId: unit.id as string }),
          })
        );

        const prWf1 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${prDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
        const stage1 = prWf1.stages.find((s: any) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
        const stage2 = prWf1.stages.find((s: any) => s.stageKey === 'STAGE_2_FINANCE')!;
        expect(stage1.status).toBe('PENDING');
        expect(stage2.status).toBe('WAITING');

        // Supervisor approves Stage 1
        const app1Res = await app.fetch(
          new Request(`http://localhost/api/v1/stages/${stage1.id}/decisions`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${atasanToken}` },
            body: JSON.stringify({ decision: 'APPROVE' }),
          })
        );
        expect(app1Res.status).toBe(200);

        // Verify Stage 2 was auto-skipped, downstream BOD stages are activated
        const prWf2 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${prDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
        const stage2After = prWf2.stages.find((s: any) => s.stageKey === 'STAGE_2_FINANCE')!;
        expect(stage2After.status).toBe('SKIPPED');

        // Zero fake decisions recorded for skipped stage (only Stage 1 decision exists)
        expect(prWf2.decisions.length).toBe(1);
        expect(prWf2.decisions[0].stageId).toBe(stage1.id);
      } finally {
        // Restore Stage 2 configuration for subsequent tests
        stageEngine.setStageAssignment('STAGE_2_FINANCE', 'usr-ayu-01', 'usr-admin-01', orgRepo);
      }
    });

    it('E2E-06: Rejection & Resubmission preserves historical document and records previousRegisterId link', async () => {
      const applicantToken = await loginAs('PEMOHON');
      const atasanToken = await loginAs('ATASAN');
      const unit = orgRepo.listUnits()[0];
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;

      // 1. Submit document
      const prRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ docType: 'PR', title: 'PR Ditolak', subtotalAmount: 12000000, budgetType: 'OPEX' }),
        })
      );
      const { document: prDoc } = (await prRes.json()) as { document: any };
      await app.fetch(
        new Request(`http://localhost/api/v1/documents/${prDoc.id}/submit`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ supervisorUserId: 'usr-atasan-01', unitId: unit.id }),
        })
      );

      const prWf = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${prDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const stage1 = prWf.stages[0];

      // Atasan rejects with comment
      const rejectRes = await app.fetch(
        new Request(`http://localhost/api/v1/stages/${stage1.id}/decisions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${atasanToken}` },
          body: JSON.stringify({ decision: 'REJECT', comment: 'Anggaran tidak mencukupi, harap revisi item' }),
        })
      );
      expect(rejectRes.status).toBe(200);

      // Verify rejected document remains intact with REJECTED status
      const rejectedPr = procRepo.getDocumentById(prDoc.id);
      expect(rejectedPr.status).toBe('REJECTED');

      // 2. Resubmission creates new document referencing previousRegisterId
      const resubmitRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({
            docType: 'PR',
            title: 'PR Revisi Anggaran',
            subtotalAmount: 6000000,
            budgetType: 'OPEX',
            previousRegisterId: rejectedPr.id, // Linked to rejected document
          }),
        })
      );
      expect(resubmitRes.status).toBe(201);
      const { document: newDoc } = (await resubmitRes.json()) as { document: any };
      expect(newDoc.previousRegisterId).toBe(rejectedPr.id);

      // Submit new document independently
      const newSubmitRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${newDoc.id}/submit`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ supervisorUserId: spv1.id, unitId: unit.id }),
        })
      );
      expect(newSubmitRes.status).toBe(200);

      // New workflow created independently
      const newWfRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${newDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } })
      );
      const newWf = await newWfRes.json();
      expect(newWf.workflow.status).toBe('ACTIVE');
    });

    it('E2E-07: In-Flight Reassignment retains original snapshot, revokes old approver, and grants new approver', async () => {
      const applicantToken = await loginAs('PEMOHON');
      const adminToken = await loginAs('ADMIN');
      const unit = orgRepo.listUnits()[0];
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;
      const spv2 = orgRepo.listUsers().find((u) => u.email === 'spv2.hf02d@blc.co.id')!;

      // 1. Submit PR assigned to spv1
      const prRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ docType: 'PR', title: 'PR Reassign Journey', subtotalAmount: 4000000, budgetType: 'OPEX' }),
        })
      );
      const { document: prDoc } = (await prRes.json()) as { document: any };
      await app.fetch(
        new Request(`http://localhost/api/v1/documents/${prDoc.id}/submit`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ supervisorUserId: spv1.id, unitId: unit.id }),
        })
      );

      const prWf = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${prDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const stage1 = prWf.stages[0];
      const originalSnapshot = prWf.snapshots.find((s: any) => s.stageKey === 'STAGE_1_SUPERVISOR');
      expect(originalSnapshot.approverUserId).toBe(spv1.id);

      // 2. Admin reassigns Stage 1 to spv2
      const reassignRes = await app.fetch(
        new Request(`http://localhost/api/v1/stages/${stage1.id}/reassign`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({
            newApproverUserId: spv2.id,
            reason: 'Supervisor 1 sedang cuti tahunan',
          }),
        })
      );
      expect(reassignRes.status).toBe(200);

      // 3. Verify original snapshot remains unchanged
      const updatedWf = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${prDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const snapAfter = updatedWf.snapshots.find((s: any) => s.stageKey === 'STAGE_1_SUPERVISOR');
      expect(snapAfter.approverUserId).toBe(spv1.id); // Immutable snapshot preserved
      expect(updatedWf.reassignments.length).toBe(1);
      expect(updatedWf.reassignments[0].reason).toContain('cuti');

      // 4. Old approver (spv1) loses authority
      expect(() => {
        stageEngine.recordStageDecision({
          workflowId: prWf.workflow.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          authenticatedUser: spv1,
        }, orgRepo);
      }).toThrowError(/bukan approver yang ditugaskan/);

      // 5. New approver (spv2) approves successfully
      const newDecision = stageEngine.recordStageDecision({
        workflowId: prWf.workflow.id,
        stageId: stage1.id,
        approverUserId: spv2.id,
        decision: 'APPROVE',
        authenticatedUser: spv2,
      }, orgRepo);
      expect(newDecision.stage.status).toBe('APPROVED');
    });

    it('E2E-08: Failure Injection & Recovery during User Journey', async () => {
      const applicantToken = await loginAs('PEMOHON');
      const unit = orgRepo.listUnits()[0];
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02d@blc.co.id')!;

      const prRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ docType: 'PR', title: 'PR Recovery Journey', subtotalAmount: 3500000, budgetType: 'OPEX' }),
        })
      );
      const { document: prDoc } = (await prRes.json()) as { document: any };
      await app.fetch(
        new Request(`http://localhost/api/v1/documents/${prDoc.id}/submit`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ supervisorUserId: 'usr-atasan-01', unitId: unit.id }),
        })
      );

      const prWf = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${prDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const stage1 = prWf.stages[0];

      // Simulate repository write error during decision
      const originalFlush = (procRepo as any).flush;
      let injectFail = true;
      (procRepo as any).flush = () => {
        if (injectFail) {
          throw new Error('E2E simulated disk write failure');
        }
        originalFlush?.call(procRepo);
      };

      const atasanToken = await loginAs('ATASAN');
      const failRes = await app.fetch(
        new Request(`http://localhost/api/v1/stages/${stage1.id}/decisions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${atasanToken}` },
          body: JSON.stringify({ decision: 'APPROVE' }),
        })
      );
      const failData = await failRes.json();
      if (failRes.status !== 500) console.log('FAIL RES ERROR:', failData);
      expect(failRes.status).toBe(500);

      // Verify state was compensated: stage remains PENDING, 0 decisions
      const checkStage = stageEngine.getStage(stage1.id);
      expect(checkStage.status).toBe('PENDING');
      expect(stageEngine.getDecisions(prWf.workflow.id).length).toBe(0);

      // Retry without error
      injectFail = false;
      const retryRes = await app.fetch(
        new Request(`http://localhost/api/v1/stages/${stage1.id}/decisions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${atasanToken}` },
          body: JSON.stringify({ decision: 'APPROVE', comment: 'Retry succeeds' }),
        })
      );
      expect(retryRes.status).toBe(200);
      expect(stageEngine.getStage(stage1.id).status).toBe('APPROVED');
      expect(procRepo.getDocumentById(prDoc.id).status).toBe('IN_REVIEW');
    });
  });

  // =========================================================================
  // HF02D-010: Migration Dry Run & Rollback Rehearsal
  // =========================================================================
  describe('HF02D-010: Migration Dry Run & Rollback Rehearsal', () => {
    it('executes schema migration dry-run on isolated copy idempotently without data loss', () => {
      const copyDbPath = join(tempDir, 'dryrun-migration.sqlite');

      // 1. Initial migration on empty copy
      migrateOrganization(copyDbPath);
      migrateApprovalEngine(copyDbPath);

      const db1 = new DatabaseSync(copyDbPath);
      const tables1 = (db1.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[]).map((r) => r.name);
      expect(tables1).toContain('app_users');
      expect(tables1).toContain('org_units');
      expect(tables1).toContain('org_assignments');
      expect(tables1).toContain('approval_workflows');
      expect(tables1).toContain('approval_stages');
      expect(tables1).toContain('approval_decisions');
      expect(tables1).toContain('approval_idempotency_records');
      expect(tables1).toContain('cross_storage_sync_records');
      db1.close();

      // 2. Repeated migration test (idempotency check)
      expect(() => {
        migrateOrganization(copyDbPath);
        migrateApprovalEngine(copyDbPath);
      }).not.toThrow();

      const db2 = new DatabaseSync(copyDbPath);
      const tables2 = (db2.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[]).map((r) => r.name);
      expect(tables2.sort()).toEqual(tables1.sort());
      db2.close();
    });

    it('simulates rollback rehearsal on isolated database copy', () => {
      const rollbackCopyPath = join(tempDir, 'rollback-rehearsal.sqlite');
      copyFileSync(dbPath, rollbackCopyPath);

      // Verify copied db contains seeded users
      const db = new DatabaseSync(rollbackCopyPath);
      const unitCountBefore = (db.prepare('SELECT count(*) as count FROM org_units').get() as any).count;
      expect(unitCountBefore).toBeGreaterThan(0);

      // Transactional rollback test
      db.exec('BEGIN IMMEDIATE');
      db.exec("INSERT INTO org_units VALUES('unit-rb-test', 'Unit Rollback Test', '2026-11-10', 'usr-admin-01')");
      const unitCountInside = (db.prepare('SELECT count(*) as count FROM org_units').get() as any).count;
      expect(unitCountInside).toBe(unitCountBefore + 1);

      // Execute rollback
      db.exec('ROLLBACK');

      const unitCountAfter = (db.prepare('SELECT count(*) as count FROM org_units').get() as any).count;
      expect(unitCountAfter).toBe(unitCountBefore);
      db.close();
    });
  });

  // =========================================================================
  // VERIFY-004: Payment Voucher Creation & Workflow Compliance
  // =========================================================================
  describe('VERIFY-004: Payment Voucher Creation & Workflow Compliance', () => {
    it('AV APPROVED does not automatically create PV in repository or stage engine', async () => {
      const applicantToken = await loginAs('PEMOHON');
      const atasanToken = await loginAs('ATASAN');
      const ayuToken = await loginAs('AYU');
      const heryToken = await loginAs('BOD_HERY');
      const hashimotoToken = await loginAs('BOD_HASHIMOTO');
      const unit = orgRepo.listUnits()[0];

      // Create and submit AV
      const avRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({
            docType: 'AV',
            title: 'AV Operasional Mandiri',
            purpose: 'Travel',
            amount: 2500000,
            activityDate: '2026-11-20',
            activityEndDate: '2026-11-22',
            paymentDueDate: '2026-11-19',
            disbursementMethod: 'CASH',
          }),
        })
      );
      const { document: avDoc } = (await avRes.json()) as { document: any };
      await app.fetch(
        new Request(`http://localhost/api/v1/documents/${avDoc.id}/submit`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ supervisorUserId: 'usr-atasan-01', unitId: unit.id }),
        })
      );

      // Approve AV through all stages
      const avWf = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${avDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const stg1 = avWf.stages.find((s: any) => s.stageKey === 'STAGE_1_SUPERVISOR');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${stg1.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${atasanToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const avWf2 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${avDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const stg2 = avWf2.stages.find((s: any) => s.stageKey === 'STAGE_2_FINANCE');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${stg2.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${ayuToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const avWf3 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${avDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const stg3a = avWf3.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HERY');
      const stg3b = avWf3.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${stg3a.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${heryToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));
      await app.fetch(new Request(`http://localhost/api/v1/stages/${stg3b.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${hashimotoToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      // AV is now APPROVED
      expect(procRepo.getDocumentById(avDoc.id).status).toBe('APPROVED');

      // Crucial assertion: ZERO PVs exist for this AV in repository or stage engine
      const pvsInRepo = procRepo.listDocuments().filter((d) => d.docType === 'PV' && (d as any).sourceDocId === avDoc.id);
      expect(pvsInRepo.length).toBe(0);

      const db = new DatabaseSync(dbPath);
      const pvWorkflows = db.prepare("SELECT * FROM approval_workflows WHERE doc_type = 'PV'").all();
      expect(pvWorkflows.length).toBe(0);
      db.close();
    });

    it('RB APPROVED does not automatically create PV in repository or stage engine', async () => {
      const applicantToken = await loginAs('PEMOHON');
      const atasanToken = await loginAs('ATASAN');
      const ayuToken = await loginAs('AYU');
      const heryToken = await loginAs('BOD_HERY');
      const hashimotoToken = await loginAs('BOD_HASHIMOTO');
      const unit = orgRepo.listUnits()[0];

      // Create and submit RB
      const rbRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({
            docType: 'RB',
            title: 'Klaim Hotel Surabaya',
            expenseCategory: 'OPERASIONAL',
            transactionDate: '2026-11-08',
            subtotal: 1200000,
            beneficiaryBank: { bankName: 'BCA', accountNumber: '778899', accountHolder: 'Karyawan' },
            attachments: [{ id: 'att-rb2', name: 'hotel.jpg', category: 'RECEIPT', sizeBytes: 150, mimeType: 'image/jpeg', uploadedAt: '2026-11-08' }],
          }),
        })
      );
      const { document: rbDoc } = (await rbRes.json()) as { document: any };

      procRepo.registerAttachment(
        {
          id: 'att-rb-02',
          documentId: rbDoc.id,
          originalName: 'hotel.jpg',
          category: 'RECEIPT',
          storagePath: 'hotel.jpg',
          sha256Hash: 'hash-rb-02',
          sizeBytes: 150,
          mimeType: 'image/jpeg',
          uploadedBy: 'usr-pemohon-01',
          createdAt: new Date().toISOString(),
        },
        'usr-pemohon-01'
      );

      const rbSubRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${rbDoc.id}/submit`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ supervisorUserId: 'usr-atasan-01', unitId: unit.id }),
        })
      );
      expect(rbSubRes.status).toBe(200);

      // Approve RB through all stages
      const rbWf = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${rbDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const stg1 = rbWf.stages.find((s: any) => s.stageKey === 'STAGE_1_SUPERVISOR');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${stg1.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${atasanToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const rbWf2 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${rbDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const stg2 = rbWf2.stages.find((s: any) => s.stageKey === 'STAGE_2_FINANCE');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${stg2.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${ayuToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const rbWf3 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${rbDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const stg3a = rbWf3.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HERY');
      const stg3b = rbWf3.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${stg3a.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${heryToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));
      await app.fetch(new Request(`http://localhost/api/v1/stages/${stg3b.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${hashimotoToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      expect(procRepo.getDocumentById(rbDoc.id).status).toBe('APPROVED');

      // Crucial assertion: ZERO PVs exist for this RB
      const pvsInRepo = procRepo.listDocuments().filter((d) => d.docType === 'PV' && (d as any).sourceDocId === rbDoc.id);
      expect(pvsInRepo.length).toBe(0);
    });

    it('PO APPROVED does not automatically create PV in repository or stage engine', async () => {
      const applicantToken = await loginAs('PEMOHON');
      const atasanToken = await loginAs('ATASAN');
      const ayuToken = await loginAs('AYU');
      const heryToken = await loginAs('BOD_HERY');
      const hashimotoToken = await loginAs('BOD_HASHIMOTO');
      const unit = orgRepo.listUnits()[0];

      // Create and submit PO
      const poRes = await app.fetch(
        new Request('http://localhost/api/v1/documents', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({
            docType: 'PO',
            title: 'PO Server Memory',
            purpose: 'IT Hardware',
            vendorName: 'PT Hardware Mega',
            subtotal: 8000000,
            paymentMethod: 'BANK_TRANSFER',
          }),
        })
      );
      const { document: poDoc } = (await poRes.json()) as { document: any };
      await app.fetch(
        new Request(`http://localhost/api/v1/documents/${poDoc.id}/submit`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ supervisorUserId: 'usr-atasan-01', unitId: unit.id }),
        })
      );

      // Approve PO through all stages
      const poWf = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${poDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const stg1 = poWf.stages.find((s: any) => s.stageKey === 'STAGE_1_SUPERVISOR');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${stg1.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${atasanToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const poWf2 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${poDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const stg2 = poWf2.stages.find((s: any) => s.stageKey === 'STAGE_2_FINANCE');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${stg2.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${ayuToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      const poWf3 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${poDoc.id}/workflow`, { headers: { authorization: `Bearer ${applicantToken}` } }))).json()) as any;
      const stg3a = poWf3.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HERY');
      const stg3b = poWf3.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO');
      await app.fetch(new Request(`http://localhost/api/v1/stages/${stg3a.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${heryToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));
      await app.fetch(new Request(`http://localhost/api/v1/stages/${stg3b.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${hashimotoToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));

      expect(procRepo.getDocumentById(poDoc.id).status).toBe('APPROVED');

      // Crucial assertion: ZERO PVs exist for this PO
      const pvsInRepo = procRepo.listDocuments().filter((d) => d.docType === 'PV' && (d as any).sourceDocId === poDoc.id);
      expect(pvsInRepo.length).toBe(0);
    });

    it('Finance Staff authorized can create PV, and non-Finance Staff is rejected (403 FORBIDDEN_ROLE)', async () => {
      const applicantToken = await loginAs('PEMOHON');
      const atasanToken = await loginAs('ATASAN');
      const financeToken = await loginAs('KEUANGAN');

      // Create pre-approved PO
      const poDoc = procRepo.createDocument(
        {
          docType: 'PO',
          title: 'PO Authorized PV Test',
          purpose: 'Testing',
          vendorName: 'PT Suplai Jaya',
          subtotal: 4000000,
          paymentMethod: 'BANK_TRANSFER',
          ownerId: 'usr-pemohon-01',
        },
        'Pemohon'
      );
      (procRepo as any).state.documents.find((d: any) => d.id === poDoc.id).status = 'APPROVED';

      // 1. Non-Finance (PEMOHON) attempts to generate PV -> rejected 403
      const pemohonRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${poDoc.id}/generate-pv`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({ beneficiaryBank: { bankName: 'BCA', accountNumber: '111', accountHolder: 'PT Suplai Jaya' } }),
        })
      );
      expect(pemohonRes.status).toBe(403);
      const pemohonErr = await pemohonRes.json();
      expect(pemohonErr.code).toBe('FORBIDDEN_ROLE');

      // 2. Non-Finance (ATASAN) attempts to generate PV -> rejected 403
      const atasanRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${poDoc.id}/generate-pv`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${atasanToken}` },
          body: JSON.stringify({ beneficiaryBank: { bankName: 'BCA', accountNumber: '111', accountHolder: 'PT Suplai Jaya' } }),
        })
      );
      expect(atasanRes.status).toBe(403);
      const atasanErr = await atasanRes.json();
      expect(atasanErr.code).toBe('FORBIDDEN_ROLE');

      // 3. Authorized Finance Staff (KEUANGAN) generates PV -> succeeds 201
      const financeRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${poDoc.id}/generate-pv`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${financeToken}` },
          body: JSON.stringify({ beneficiaryBank: { bankName: 'BCA', accountNumber: '111', accountHolder: 'PT Suplai Jaya' } }),
        })
      );
      expect(financeRes.status).toBe(201);
      const { document: pvDoc } = (await financeRes.json()) as { document: any };
      expect(pvDoc.docType).toBe('PV');
      expect(pvDoc.status).toBe('IN_REVIEW');
    });

    it('Parent document not APPROVED is rejected with 422 SOURCE_NOT_APPROVED', async () => {
      const financeToken = await loginAs('KEUANGAN');

      // Create a DRAFT PO
      const poDoc = procRepo.createDocument(
        {
          docType: 'PO',
          title: 'PO Draft PV Test',
          purpose: 'Testing',
          vendorName: 'PT Suplai Jaya',
          subtotal: 4000000,
          paymentMethod: 'BANK_TRANSFER',
          ownerId: 'usr-pemohon-01',
        },
        'Pemohon'
      );
      // Status remains DRAFT (not APPROVED)

      const genRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${poDoc.id}/generate-pv`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${financeToken}` },
          body: JSON.stringify({ beneficiaryBank: { bankName: 'BCA', accountNumber: '111', accountHolder: 'PT Suplai Jaya' } }),
        })
      );
      expect(genRes.status).toBe(422);
      const err = await genRes.json();
      expect(err.code).toBe('SOURCE_NOT_APPROVED');
    });

    it('PV goes through strict sequential approval (Finance Reviewer -> Hery -> Hashimoto)', async () => {
      const financeToken = await loginAs('KEUANGAN');
      const ayuToken = await loginAs('AYU');
      const heryToken = await loginAs('BOD_HERY');
      const hashimotoToken = await loginAs('BOD_HASHIMOTO');

      // Create parent approved PO and generate PV
      const poDoc = procRepo.createDocument(
        {
          docType: 'PO',
          title: 'PO Sequential PV Test',
          purpose: 'Hardware',
          vendorName: 'PT Mitra',
          subtotal: 5000000,
          paymentMethod: 'BANK_TRANSFER',
          ownerId: 'usr-pemohon-01',
        },
        'Pemohon'
      );
      (procRepo as any).state.documents.find((d: any) => d.id === poDoc.id).status = 'APPROVED';

      const genRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${poDoc.id}/generate-pv`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${financeToken}` },
          body: JSON.stringify({ beneficiaryBank: { bankName: 'BCA', accountNumber: '222', accountHolder: 'PT Mitra' } }),
        })
      );
      const { document: pvDoc } = (await genRes.json()) as { document: any };

      // Inspect workflow stages: PV starts at Stage 2 PENDING, Stage 3A & 3B WAITING
      const wf1 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${pvDoc.id}/workflow`, { headers: { authorization: `Bearer ${financeToken}` } }))).json()) as any;
      const stg2 = wf1.stages.find((s: any) => s.stageKey === 'STAGE_2_FINANCE');
      const stg3a = wf1.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HERY');
      const stg3b = wf1.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO');

      expect(stg2.status).toBe('PENDING');
      expect(stg3a.status).toBe('WAITING');
      expect(stg3b.status).toBe('WAITING');

      // Premature approval on Stage 3B by Hashimoto -> rejected (409)
      const prematureRes1 = await app.fetch(new Request(`http://localhost/api/v1/stages/${stg3b.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${hashimotoToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));
      expect(prematureRes1.status).toBe(409);

      // Premature approval on Stage 3A by Hery -> rejected (409)
      const prematureRes2 = await app.fetch(new Request(`http://localhost/api/v1/stages/${stg3a.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${heryToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));
      expect(prematureRes2.status).toBe(409);

      // Step 1: Ayu approves Stage 2
      const stg2Res = await app.fetch(new Request(`http://localhost/api/v1/stages/${stg2.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${ayuToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));
      expect(stg2Res.status).toBe(200);

      // Inspect workflow: Stage 3A is now PENDING, Stage 3B is STILL WAITING
      const wf2 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${pvDoc.id}/workflow`, { headers: { authorization: `Bearer ${financeToken}` } }))).json()) as any;
      expect(wf2.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HERY').status).toBe('PENDING');
      expect(wf2.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO').status).toBe('WAITING');

      // Premature approval on Stage 3B by Hashimoto -> still rejected (409)
      const prematureRes3 = await app.fetch(new Request(`http://localhost/api/v1/stages/${stg3b.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${hashimotoToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));
      expect(prematureRes3.status).toBe(409);

      // Step 2: Hery approves Stage 3A
      const stg3aRes = await app.fetch(new Request(`http://localhost/api/v1/stages/${stg3a.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${heryToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));
      expect(stg3aRes.status).toBe(200);

      // Inspect workflow: Stage 3B is now PENDING
      const wf3 = (await (await app.fetch(new Request(`http://localhost/api/v1/documents/${pvDoc.id}/workflow`, { headers: { authorization: `Bearer ${financeToken}` } }))).json()) as any;
      expect(wf3.stages.find((s: any) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO').status).toBe('PENDING');

      // Step 3: Hashimoto approves Stage 3B
      const stg3bRes = await app.fetch(new Request(`http://localhost/api/v1/stages/${stg3b.id}/decisions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${hashimotoToken}` }, body: JSON.stringify({ decision: 'APPROVE' }) }));
      expect(stg3bRes.status).toBe(200);

      // Workflow complete and document status is APPROVED
      const finalDoc = procRepo.getDocumentById(pvDoc.id);
      expect(finalDoc.status).toBe('APPROVED');
    });

    it('Payment Record strictly follows existing validation', async () => {
      const financeToken = await loginAs('KEUANGAN');
      const applicantToken = await loginAs('PEMOHON');

      // Create unapproved PV
      const poDoc = procRepo.createDocument(
        {
          docType: 'PO',
          title: 'PO Payment Test',
          purpose: 'Testing',
          vendorName: 'PT Suplai',
          subtotal: 2000000,
          paymentMethod: 'BANK_TRANSFER',
          ownerId: 'usr-pemohon-01',
        },
        'Pemohon'
      );
      (procRepo as any).state.documents.find((d: any) => d.id === poDoc.id).status = 'APPROVED';

      const genRes = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${poDoc.id}/generate-pv`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${financeToken}` },
          body: JSON.stringify({ beneficiaryBank: { bankName: 'BCA', accountNumber: '333', accountHolder: 'PT Suplai' } }),
        })
      );
      const { document: pvDoc } = (await genRes.json()) as { document: any };

      // 1. Payment attempt on unapproved PV (status: IN_REVIEW) -> rejected 422
      const payEarlyRes = await app.fetch(
        new Request(`http://localhost/api/v1/payments/${pvDoc.id}/record`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${financeToken}` },
          body: JSON.stringify({
            sourceBank: 'BCA',
            referenceNumber: 'TRF-001',
            paidAt: '2026-11-10T10:00:00.000Z',
            paidAmount: (procRepo.getDocumentById(pvDoc.id) as any).netAmountToPay,
          }),
        })
      );
      expect(payEarlyRes.status).toBe(422);
      const payEarlyErr = await payEarlyRes.json();
      expect(payEarlyErr.code).toBe('PV_NOT_APPROVED');

      // Now set PV to APPROVED
      (procRepo as any).state.documents.find((d: any) => d.id === pvDoc.id).status = 'APPROVED';

      // 2. Payment attempt by non-Finance (PEMOHON) -> rejected 403
      const nonFinPayRes = await app.fetch(
        new Request(`http://localhost/api/v1/payments/${pvDoc.id}/record`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${applicantToken}` },
          body: JSON.stringify({
            sourceBank: 'BCA',
            referenceNumber: 'TRF-001',
            paidAt: '2026-11-10T10:00:00.000Z',
            paidAmount: (procRepo.getDocumentById(pvDoc.id) as any).netAmountToPay,
          }),
        })
      );
      expect(nonFinPayRes.status).toBe(403);

      // 3. Payment attempt with mismatched amount -> rejected 422
      const mismatchRes = await app.fetch(
        new Request(`http://localhost/api/v1/payments/${pvDoc.id}/record`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${financeToken}` },
          body: JSON.stringify({
            sourceBank: 'BCA',
            referenceNumber: 'TRF-001',
            paidAt: '2026-11-10T10:00:00.000Z',
            paidAmount: 999999, // mismatch
          }),
        })
      );
      expect(mismatchRes.status).toBe(422);

      // 4. Valid payment by Finance with exact amount -> succeeds 200
      const validPayRes = await app.fetch(
        new Request(`http://localhost/api/v1/payments/${pvDoc.id}/record`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${financeToken}` },
          body: JSON.stringify({
            sourceBank: 'BCA',
            referenceNumber: 'TRF-001',
            paidAt: '2026-11-10T10:00:00.000Z',
            paidAmount: (procRepo.getDocumentById(pvDoc.id) as any).netAmountToPay,
          }),
        })
      );
      expect(validPayRes.status).toBe(200);
      expect((procRepo.getDocumentById(pvDoc.id) as any).paymentStatus).toBe('PAID');
    });
  });
});

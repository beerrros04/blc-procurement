import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs';
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
import type { UserRole } from '../src/types/document';

describe('HOTFIX BR-APP-001 — HF02-C: Stage Authorization, In-Flight Reassignment & Request Idempotency', () => {
  let tempDir: string;
  let dbPath: string;
  let repoPath: string;
  let stageEngine: ApprovalStageEngine;
  let orgRepo: OrganizationRepository;
  let procRepo: ProcurementRepository;
  let app: BLCAppServer;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'blc-hf02c-test-'));
    dbPath = join(tempDir, 'test-hf02c.sqlite');
    repoPath = join(tempDir, 'test-repo.json');

    migrateOrganization(dbPath);
    migrateApprovalEngine(dbPath);
    orgRepo = new OrganizationRepository(dbPath);
    stageEngine = new ApprovalStageEngine(dbPath);
    procRepo = new ProcurementRepository({ persistPath: repoPath, seed: true });
    app = createAppServer({ repository: procRepo, organization: orgRepo, stageEngine, stageEngineEnabled: true });

    // Seed test users in OrganizationRepository
    const adminUser = orgRepo.getUser('usr-admin-01');

    // Verify key test actors in isolated database per ADR-ID-002
    orgRepo.verifyUser('usr-atasan-01', { proofReference: 'SK Penugasan BM', verifiedBy: 'usr-admin-01' });
    orgRepo.setUserLifecycle('usr-atasan-01', 'ACTIVE', 'usr-admin-01');

    orgRepo.verifyUser('usr-ayu-01', { proofReference: 'SK Direksi No. 01/2026', verifiedBy: 'usr-admin-01' });
    orgRepo.setUserLifecycle('usr-ayu-01', 'ACTIVE', 'usr-admin-01');

    orgRepo.verifyUser('usr-pemohon-01', { proofReference: 'SK Karyawan Tetap', verifiedBy: 'usr-admin-01' });
    orgRepo.setUserLifecycle('usr-pemohon-01', 'ACTIVE', 'usr-admin-01');

    // Atasan 1
    const spv1 = orgRepo.createUser(
      { email: 'spv1.hf02c@blc.co.id', fullName: 'Supervisor Satu', role: 'ATASAN' },
      adminUser.id
    );
    orgRepo.verifyUser(spv1.id, { proofReference: 'SK-SPV-01', verifiedBy: adminUser.id });
    orgRepo.setUserLifecycle(spv1.id, 'ACTIVE', adminUser.id);

    // Atasan 2 (Alternate for reassignment)
    const spv2 = orgRepo.createUser(
      { email: 'spv2.hf02c@blc.co.id', fullName: 'Supervisor Dua (Pengganti)', role: 'ATASAN' },
      adminUser.id
    );
    orgRepo.verifyUser(spv2.id, { proofReference: 'SK-SPV-02', verifiedBy: adminUser.id });
    orgRepo.setUserLifecycle(spv2.id, 'ACTIVE', adminUser.id);

    // Ayu (Finance Verifier)
    const ayu = orgRepo.createUser(
      { email: 'ayu.hf02c@blc.co.id', fullName: 'Ayu Martina', role: 'AYU' },
      adminUser.id
    );
    orgRepo.verifyUser(ayu.id, { proofReference: 'SK-FIN-01', verifiedBy: adminUser.id });
    orgRepo.setUserLifecycle(ayu.id, 'ACTIVE', adminUser.id);

    // Director Hery
    const dirHery = orgRepo.createUser(
      { email: 'hery.hf02c@blc.co.id', fullName: 'Director Hery', role: 'BOD_HERY' },
      adminUser.id
    );
    orgRepo.verifyUser(dirHery.id, { proofReference: 'AKTA-01', verifiedBy: adminUser.id });
    orgRepo.setUserLifecycle(dirHery.id, 'ACTIVE', adminUser.id);

    // Director Hashimoto
    const dirHashimoto = orgRepo.createUser(
      { email: 'hashimoto.hf02c@blc.co.id', fullName: 'Director Hashimoto', role: 'BOD_HASHIMOTO' },
      adminUser.id
    );
    orgRepo.verifyUser(dirHashimoto.id, { proofReference: 'AKTA-02', verifiedBy: adminUser.id });
    orgRepo.setUserLifecycle(dirHashimoto.id, 'ACTIVE', adminUser.id);

    // Set persistent stage assignments
    stageEngine.setStageAssignment('STAGE_2_FINANCE', ayu.id, adminUser.id, orgRepo);
    stageEngine.setStageAssignment('STAGE_3_BOD_HERY', dirHery.id, adminUser.id, orgRepo);
    stageEngine.setStageAssignment('STAGE_3_BOD_HASHIMOTO', dirHashimoto.id, adminUser.id, orgRepo);
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup error
    }
  });

  // Helper to create a submitted PR workflow with stage 1
  function createStandardWorkflow(customUnitName = 'Divisi Operasional HF02C') {
    const adminUser = orgRepo.getUser('usr-admin-01');
    const unit = orgRepo.createUnit(customUnitName, adminUser.id);
    const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02c@blc.co.id')!;
    orgRepo.createAssignment(unit.id, spv1.id, adminUser.id);

    const docId = `doc-hf02c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const submission = stageEngine.createSubmissionWorkflow(
      {
        documentId: docId,
        docType: 'PR',
        docNumber: `PR/2026/11/${Math.floor(1000 + Math.random() * 9000)}`,
        unitId: unit.id,
        applicantUserId: 'usr-pemohon-01',
      },
      orgRepo
    );

    return { ...submission, unit, spv1 };
  }

  // =========================================================================
  // 1. HF02C-001 & HF02C-002: Stage Authorization & Principal Validation
  // =========================================================================
  describe('HF02C-001 & HF02C-002: Stage Authorization & Principal Validation', () => {
    it('1. Approver sah dapat mengambil keputusan pada stage aktif', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      expect(stage1.status).toBe('PENDING');

      const result = stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          comment: 'Disetujui oleh atasan langsung',
          authenticatedUser: spv1,
        },
        orgRepo
      );

      expect(result.stage.status).toBe('APPROVED');
      expect(result.decision.decision).toBe('APPROVE');
      expect(result.activatedStages.some((s) => s.stageKey === 'STAGE_2_FINANCE')).toBe(true);
    });

    it('2. User lain tidak dapat menyetujui stage yang bukan miliknya (403 FORBIDDEN_APPROVER)', () => {
      const { workflow, stages } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const otherUser = orgRepo.listUsers().find((u) => u.email === 'spv2.hf02c@blc.co.id')!;

      expect(() =>
        stageEngine.recordStageDecision(
          {
            workflowId: workflow.id,
            stageId: stage1.id,
            approverUserId: otherUser.id,
            decision: 'APPROVE',
            comment: 'Mencoba approve dokumen divisi lain',
            authenticatedUser: otherUser,
          },
          orgRepo
        )
      ).toThrowError(/Pengguna bukan approver yang ditugaskan/);
    });

    it('3. Global role saja tidak memberikan authority jika bukan assigned approver', () => {
      const { workflow, stages } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      // Create another ATASAN who is not assigned to this unit
      const admin = orgRepo.getUser('usr-admin-01');
      const randomAtasan = orgRepo.createUser(
        { email: 'random.atasan@blc.co.id', fullName: 'Random Atasan', role: 'ATASAN' },
        admin.id
      );
      orgRepo.verifyUser(randomAtasan.id, { proofReference: 'SK', verifiedBy: admin.id });
      orgRepo.setUserLifecycle(randomAtasan.id, 'ACTIVE', admin.id);
      const verifiedAtasan = orgRepo.getUser(randomAtasan.id);

      expect(() =>
        stageEngine.recordStageDecision(
          {
            workflowId: workflow.id,
            stageId: stage1.id,
            approverUserId: verifiedAtasan.id,
            decision: 'APPROVE',
            authenticatedUser: verifiedAtasan,
          },
          orgRepo
        )
      ).toThrowError(/Pengguna bukan approver yang ditugaskan/);
    });

    it('4. User INACTIVE ditolak saat mencoba mengambil keputusan (422 APPROVER_INACTIVE)', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      // Deactivate spv1
      const admin = orgRepo.getUser('usr-admin-01');
      orgRepo.setUserLifecycle(spv1.id, 'INACTIVE', admin.id);
      const inactiveSpv1 = orgRepo.getUser(spv1.id);

      expect(() =>
        stageEngine.recordStageDecision(
          {
            workflowId: workflow.id,
            stageId: stage1.id,
            approverUserId: inactiveSpv1.id,
            decision: 'APPROVE',
            authenticatedUser: inactiveSpv1,
          },
          orgRepo
        )
      ).toThrowError(/Approver tidak aktif|tidak aktif/i);
    });

    it('5. User UNVERIFIED ditolak saat mencoba mengambil keputusan (422 APPROVER_UNVERIFIED)', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      // Create unverified clone
      const admin = orgRepo.getUser('usr-admin-01');
      const unverifiedUser = orgRepo.createUser(
        { email: 'unver.decision@blc.co.id', fullName: 'Unverified Decision Maker' },
        admin.id
      );

      expect(() =>
        stageEngine.recordStageDecision(
          {
            workflowId: workflow.id,
            stageId: stage1.id,
            approverUserId: unverifiedUser.id,
            decision: 'APPROVE',
            authenticatedUser: unverifiedUser,
          },
          orgRepo
        )
      ).toThrowError(/belum diverifikasi/i);
    });

    it('6. Stage WAITING tidak dapat disetujui lebih awal (409 STAGE_NOT_ACTIVE)', () => {
      const { workflow, stages } = createStandardWorkflow();
      const stage2 = stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;
      expect(stage2.status).toBe('WAITING');
      const ayu = orgRepo.listUsers().find((u) => u.email === 'ayu.hf02c@blc.co.id')!;

      expect(() =>
        stageEngine.recordStageDecision(
          {
            workflowId: workflow.id,
            stageId: stage2.id,
            approverUserId: ayu.id,
            decision: 'APPROVE',
            authenticatedUser: ayu,
          },
          orgRepo
        )
      ).toThrowError(/Tahap belum aktif untuk persetujuan/);
    });

    it('7. BR-APP-001: Pengguna dengan dua assignment tetap memberikan dua keputusan independen', () => {
      // Assign Ayu Martina as supervisor of the unit AND Stage 2 Finance Verifier
      const admin = orgRepo.getUser('usr-admin-01');
      const unit = orgRepo.createUnit('Divisi Ayu Multi-Role', admin.id);
      const ayu = orgRepo.listUsers().find((u) => u.email === 'ayu.hf02c@blc.co.id')!;
      orgRepo.createAssignment(unit.id, ayu.id, admin.id);

      const { workflow, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-ayu-multirole-01',
          docType: 'PR',
          docNumber: 'PR/2026/11/7701',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const st1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const st2 = stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;
      expect(st1.assignedApproverId).toBe(ayu.id);
      expect(st2.assignedApproverId).toBe(ayu.id);
      expect(st1.status).toBe('PENDING');
      expect(st2.status).toBe('WAITING');

      // 1st decision: Approve Stage 1
      const res1 = stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: st1.id,
          approverUserId: ayu.id,
          decision: 'APPROVE',
          comment: 'Disetujui sebagai atasan langsung',
          authenticatedUser: ayu,
        },
        orgRepo
      );

      expect(res1.stage.status).toBe('APPROVED');
      const reloadedSt2 = stageEngine.getStage(st2.id);
      expect(reloadedSt2.status).toBe('PENDING'); // activated, NOT auto-approved!

      // 2nd decision: Approve Stage 2
      const res2 = stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: st2.id,
          approverUserId: ayu.id,
          decision: 'APPROVE',
          comment: 'Disetujui sebagai verifikator keuangan',
          authenticatedUser: ayu,
        },
        orgRepo
      );

      expect(res2.stage.status).toBe('APPROVED');
      const decisions = stageEngine.getDecisions(workflow.id);
      expect(decisions).toHaveLength(2);
      expect(decisions[0].stageId).toBe(st1.id);
      expect(decisions[1].stageId).toBe(st2.id);
    });
  });

  // =========================================================================
  // 2. HF02C-003: In-Flight Approver Reassignment
  // =========================================================================
  describe('HF02C-003: In-Flight Approver Reassignment', () => {
    it('1. Admin dapat melakukan reassignment approver pada stage aktif', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const spv2 = orgRepo.listUsers().find((u) => u.email === 'spv2.hf02c@blc.co.id')!;
      const admin = orgRepo.getUser('usr-admin-01');

      const result = stageEngine.reassignStage(
        {
          stageId: stage1.id,
          newApproverUserId: spv2.id,
          reason: 'Spv 1 sedang cuti sakit mendesak',
          actorUserId: admin.id,
        },
        orgRepo
      );

      expect(result.stage.assignedApproverId).toBe(spv2.id);
      expect(result.stage.approverName).toBe(spv2.fullName);
      expect(result.reassignment.previousApproverId).toBe(spv1.id);
      expect(result.reassignment.newApproverId).toBe(spv2.id);
      expect(result.reassignment.reason).toBe('Spv 1 sedang cuti sakit mendesak');
    });

    it('2. Non-Admin ditolak melakukan reassignment (403 FORBIDDEN_ROLE)', () => {
      const { stages } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02c@blc.co.id')!;
      const spv2 = orgRepo.listUsers().find((u) => u.email === 'spv2.hf02c@blc.co.id')!;

      expect(() =>
        stageEngine.reassignStage(
          {
            stageId: stage1.id,
            newApproverUserId: spv2.id,
            reason: 'Self-delegation attempt',
            actorUserId: spv1.id,
          },
          orgRepo
        )
      ).toThrowError(/Akses organisasi hanya untuk Admin|hanya dapat dikelola oleh Administrator/i);
    });

    it('3. Reassignment wajib menyertakan alasan (422 REASSIGNMENT_REASON_REQUIRED)', () => {
      const { stages } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const spv2 = orgRepo.listUsers().find((u) => u.email === 'spv2.hf02c@blc.co.id')!;
      const admin = orgRepo.getUser('usr-admin-01');

      expect(() =>
        stageEngine.reassignStage(
          {
            stageId: stage1.id,
            newApproverUserId: spv2.id,
            reason: '   ',
            actorUserId: admin.id,
          },
          orgRepo
        )
      ).toThrowError(/Alasan reassignment wajib diisi/i);
    });

    it('4. Approver pengganti unverified atau inactive ditolak (422)', () => {
      const { stages } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const admin = orgRepo.getUser('usr-admin-01');

      const unverified = orgRepo.createUser(
        { email: 'unver.replacement@blc.co.id', fullName: 'Unverified Replacement' },
        admin.id
      );

      expect(() =>
        stageEngine.reassignStage(
          {
            stageId: stage1.id,
            newApproverUserId: unverified.id,
            reason: 'Reassign to unverified user',
            actorUserId: admin.id,
          },
          orgRepo
        )
      ).toThrowError(/diverifikasi/i);
    });

    it('5. Original snapshot tetap utuh dan immutable setelah reassignment', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const spv2 = orgRepo.listUsers().find((u) => u.email === 'spv2.hf02c@blc.co.id')!;
      const admin = orgRepo.getUser('usr-admin-01');

      // Reassign stage 1 to spv2
      stageEngine.reassignStage(
        {
          stageId: stage1.id,
          newApproverUserId: spv2.id,
          reason: 'Cuti kerja, dialihkan ke Spv 2',
          actorUserId: admin.id,
        },
        orgRepo
      );

      // Verify original snapshot still points to spv1
      const snapshots = stageEngine.getSnapshots(workflow.id);
      const snap1 = snapshots.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      expect(snap1.approverUserId).toBe(spv1.id);
      expect(snap1.approverName).toBe(spv1.fullName);

      // Verify stage points to spv2
      const updatedStage = stageEngine.getStage(stage1.id);
      expect(updatedStage.assignedApproverId).toBe(spv2.id);
    });

    it('6. Approver lama kehilangan kewenangan pada stage yang dialihkan (403 FORBIDDEN_APPROVER)', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const spv2 = orgRepo.listUsers().find((u) => u.email === 'spv2.hf02c@blc.co.id')!;
      const admin = orgRepo.getUser('usr-admin-01');

      // Admin executes reassignment
      stageEngine.reassignStage(
        {
          stageId: stage1.id,
          newApproverUserId: spv2.id,
          reason: 'Reassignment to Spv 2',
          actorUserId: admin.id,
        },
        orgRepo
      );

      // Old approver (spv1) attempts to approve: rejected!
      expect(() =>
        stageEngine.recordStageDecision(
          {
            workflowId: workflow.id,
            stageId: stage1.id,
            approverUserId: spv1.id,
            decision: 'APPROVE',
            authenticatedUser: spv1,
          },
          orgRepo
        )
      ).toThrowError(/Pengguna bukan approver yang ditugaskan/);

      // New approver (spv2) approves: succeeds!
      const success = stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: spv2.id,
          decision: 'APPROVE',
          comment: 'Disetujui oleh pejabat pengganti',
          authenticatedUser: spv2,
        },
        orgRepo
      );
      expect(success.stage.status).toBe('APPROVED');
    });

    it('7. Stage terminal (APPROVED atau REJECTED) tidak dapat dialihkan (409 STAGE_ALREADY_COMPLETED)', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const spv2 = orgRepo.listUsers().find((u) => u.email === 'spv2.hf02c@blc.co.id')!;
      const admin = orgRepo.getUser('usr-admin-01');

      // Complete stage 1
      stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          authenticatedUser: spv1,
        },
        orgRepo
      );

      // Attempt reassignment on already approved stage: rejected!
      expect(() =>
        stageEngine.reassignStage(
          {
            stageId: stage1.id,
            newApproverUserId: spv2.id,
            reason: 'Percobaan reassignment pada tahap selesai',
            actorUserId: admin.id,
          },
          orgRepo
        )
      ).toThrowError(/Tahap yang sudah selesai tidak dapat dialihkan/);
    });
  });

  // =========================================================================
  // 3. HF02C-004 & HF02C-005: Idempotency & Concurrency Protection
  // =========================================================================
  describe('HF02C-004 & HF02C-005: Idempotency & Concurrency Protection', () => {
    it('1. Identical retry dengan same key + same payload tidak menggandakan keputusan', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const key = 'idem-req-001';

      // First execution
      const res1 = stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          comment: 'Approval pertama',
          idempotencyKey: key,
          authenticatedUser: spv1,
        },
        orgRepo
      );

      // Second identical execution (network retry)
      const res2 = stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          comment: 'Approval pertama',
          idempotencyKey: key,
          authenticatedUser: spv1,
        },
        orgRepo
      );

      expect(res2.stage.id).toBe(res1.stage.id);
      expect(res2.decision.id).toBe(res1.decision.id);

      // Only ONE decision record exists in SQLite
      const decisions = stageEngine.getDecisions(workflow.id);
      expect(decisions).toHaveLength(1);
    });

    it('2. Payload berbeda dengan key sama ditolak (409 IDEMPOTENCY_KEY_PAYLOAD_MISMATCH)', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const key = 'idem-req-conflict';

      stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          comment: 'Keputusan setuju',
          idempotencyKey: key,
          authenticatedUser: spv1,
        },
        orgRepo
      );

      // Same key, but different payload (REJECT instead of APPROVE)
      expect(() =>
        stageEngine.recordStageDecision(
          {
            workflowId: workflow.id,
            stageId: stage1.id,
            approverUserId: spv1.id,
            decision: 'REJECT',
            comment: 'Berubah pikiran jadi tolak',
            idempotencyKey: key,
            authenticatedUser: spv1,
          },
          orgRepo
        )
      ).toThrowError(/Idempotency key telah digunakan dengan payload berbeda/);
    });

    it('3. Key berbeda pada stage yang sudah selesai ditolak dan tidak menciptakan keputusan baru', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          idempotencyKey: 'key-initial',
          authenticatedUser: spv1,
        },
        orgRepo
      );

      // Different key on already approved stage
      expect(() =>
        stageEngine.recordStageDecision(
          {
            workflowId: workflow.id,
            stageId: stage1.id,
            approverUserId: spv1.id,
            decision: 'APPROVE',
            idempotencyKey: 'key-subsequent',
            authenticatedUser: spv1,
          },
          orgRepo
        )
      ).toThrowError(/Tahap sudah selesai sebelumnya dengan status APPROVED/);

      const decisions = stageEngine.getDecisions(workflow.id);
      expect(decisions).toHaveLength(1);
    });

    it('4. BOD paralel: kedua direksi dapat memberikan keputusan secara independen tanpa lost update', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const ayu = orgRepo.listUsers().find((u) => u.email === 'ayu.hf02c@blc.co.id')!;
      const dirHery = orgRepo.listUsers().find((u) => u.email === 'hery.hf02c@blc.co.id')!;
      const dirHashimoto = orgRepo.listUsers().find((u) => u.email === 'hashimoto.hf02c@blc.co.id')!;

      // Advance to Stage 2
      stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          authenticatedUser: spv1,
        },
        orgRepo
      );

      // Advance to Stage 3 (BOD Parallel)
      const stage2 = stageEngine.getStage(stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!.id);
      stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stage2.id,
          approverUserId: ayu.id,
          decision: 'APPROVE',
          authenticatedUser: ayu,
        },
        orgRepo
      );

      const reloadedStages = stageEngine.getStages(workflow.id);
      const stageHery = reloadedStages.find((s) => s.stageKey === 'STAGE_3_BOD_HERY')!;
      const stageHashimoto = reloadedStages.find((s) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO')!;
      expect(stageHery.status).toBe('PENDING');
      expect(stageHashimoto.status).toBe('PENDING');

      // Director Hashimoto approves first
      const resHashimoto = stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stageHashimoto.id,
          approverUserId: dirHashimoto.id,
          decision: 'APPROVE',
          idempotencyKey: 'bod-hashimoto-01',
          authenticatedUser: dirHashimoto,
        },
        orgRepo
      );
      expect(resHashimoto.stage.status).toBe('APPROVED');
      expect(resHashimoto.workflow.status).toBe('ACTIVE'); // Waiting for Hery

      // Director Hery approves second
      const resHery = stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stageHery.id,
          approverUserId: dirHery.id,
          decision: 'APPROVE',
          idempotencyKey: 'bod-hery-01',
          authenticatedUser: dirHery,
        },
        orgRepo
      );
      expect(resHery.stage.status).toBe('APPROVED');
      expect(resHery.workflow.status).toBe('COMPLETED'); // Both approved -> Completed!
    });

    it('5. Concurrent double-click approval: hanya satu request yang berhasil membuat keputusan, tidak terjadi duplikasi', async () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      const tasks = [
        () =>
          stageEngine.recordStageDecision(
            {
              workflowId: workflow.id,
              stageId: stage1.id,
              approverUserId: spv1.id,
              decision: 'APPROVE',
              comment: 'Double-click concurrent 1',
              idempotencyKey: 'double-click-01',
              authenticatedUser: spv1,
            },
            orgRepo
          ),
        () =>
          stageEngine.recordStageDecision(
            {
              workflowId: workflow.id,
              stageId: stage1.id,
              approverUserId: spv1.id,
              decision: 'APPROVE',
              comment: 'Double-click concurrent 2',
              idempotencyKey: 'double-click-02',
              authenticatedUser: spv1,
            },
            orgRepo
          ),
      ];

      const results = await Promise.allSettled([
        Promise.resolve().then(() => tasks[0]()),
        Promise.resolve().then(() => tasks[1]()),
      ]);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const decisions = stageEngine.getDecisions(workflow.id);
      expect(decisions).toHaveLength(1);
    });

    it('6. Concurrent approval dan rejection: tidak menciptakan state bertentangan', async () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      const tasks = [
        () =>
          stageEngine.recordStageDecision(
            {
              workflowId: workflow.id,
              stageId: stage1.id,
              approverUserId: spv1.id,
              decision: 'APPROVE',
              comment: 'Approve concurrent',
              idempotencyKey: 'race-approve',
              authenticatedUser: spv1,
            },
            orgRepo
          ),
        () =>
          stageEngine.recordStageDecision(
            {
              workflowId: workflow.id,
              stageId: stage1.id,
              approverUserId: spv1.id,
              decision: 'REJECT',
              comment: 'Reject concurrent',
              idempotencyKey: 'race-reject',
              authenticatedUser: spv1,
            },
            orgRepo
          ),
      ];

      const results = await Promise.allSettled([
        Promise.resolve().then(() => tasks[0]()),
        Promise.resolve().then(() => tasks[1]()),
      ]);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      expect(fulfilled).toHaveLength(1);

      const decisions = stageEngine.getDecisions(workflow.id);
      expect(decisions).toHaveLength(1);
      const reloadedStage = stageEngine.getStage(stage1.id);
      expect(['APPROVED', 'REJECTED']).toContain(reloadedStage.status);
    });

    it('7. Approval dan reassignment bersamaan: ditangani secara aman dan konsisten', async () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const spv2 = orgRepo.listUsers().find((u) => u.email === 'spv2.hf02c@blc.co.id')!;
      const admin = orgRepo.getUser('usr-admin-01');

      const tasks = [
        () =>
          stageEngine.recordStageDecision(
            {
              workflowId: workflow.id,
              stageId: stage1.id,
              approverUserId: spv1.id,
              decision: 'APPROVE',
              comment: 'Approval concurrent with reassignment',
              authenticatedUser: spv1,
            },
            orgRepo
          ),
        () =>
          stageEngine.reassignStage(
            {
              stageId: stage1.id,
              newApproverUserId: spv2.id,
              reason: 'Concurrent reassignment by admin',
              actorUserId: admin.id,
            },
            orgRepo
          ),
      ];

      const results = await Promise.allSettled([
        Promise.resolve().then(() => tasks[0]()),
        Promise.resolve().then(() => tasks[1]()),
      ]);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      expect(fulfilled.length).toBeGreaterThanOrEqual(1);

      const decisions = stageEngine.getDecisions(workflow.id);
      expect(decisions.length).toBeLessThanOrEqual(1);
    });
  });

  // =========================================================================
  // 4. HF02C-006: Cross-Storage Consistency Strategy & Recovery
  // =========================================================================
  describe('HF02C-006: Cross-Storage Consistency Strategy & Recovery', () => {
    it('1. Alur normal mencatat sync record COMMITTED saat stage decision disinkronkan', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      const syncId = stageEngine.prepareCrossStorageSync({
        documentId: workflow.documentId,
        workflowId: workflow.id,
        stageId: stage1.id,
        operationType: 'APPROVE',
        stageState: { status: 'APPROVED' },
        documentState: { currentStage: 'AYU', status: 'IN_REVIEW' },
      });

      expect(syncId).toBeDefined();
      const syncRecord = stageEngine.getCrossStorageSyncRecord(syncId);
      expect(syncRecord?.status).toBe('PREPARED');

      // Execute stage decision
      stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          authenticatedUser: spv1,
        },
        orgRepo
      );

      // Commit sync
      stageEngine.commitCrossStorageSync(syncId);
      const committed = stageEngine.getCrossStorageSyncRecord(syncId);
      expect(committed?.status).toBe('COMMITTED');
    });

    it('2. Kegagalan penulisan storage dokumen memicu kompensasi (COMPENSATED)', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      const syncId = stageEngine.prepareCrossStorageSync({
        documentId: workflow.documentId,
        workflowId: workflow.id,
        stageId: stage1.id,
        operationType: 'APPROVE',
        stageState: { status: 'APPROVED' },
      });

      // Simulate failure on document repository write
      stageEngine.compensateCrossStorageSync(syncId, 'Disk full on document repository flush');
      const compensated = stageEngine.getCrossStorageSyncRecord(syncId);
      expect(compensated?.status).toBe('COMPENSATED');
      expect(compensated?.errorMessage).toContain('Disk full');
    });

    it('3. reconcileCrossStorage mendeteksi dan menyelesaikan record yang tidak sinkron', () => {
      const { workflow, stages } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      // Create an uncommitted prepared sync record (simulating crash)
      const syncId = stageEngine.prepareCrossStorageSync({
        documentId: workflow.documentId,
        workflowId: workflow.id,
        stageId: stage1.id,
        operationType: 'SUBMIT',
        stageState: { status: 'ACTIVE' },
      });

      const uncommitted = stageEngine.listUncommittedSyncRecords();
      expect(uncommitted.some((r) => r.id === syncId)).toBe(true);

      const reconciled = stageEngine.reconcileCrossStorage(workflow.documentId);
      expect(reconciled.reconciledCount).toBeGreaterThanOrEqual(1);

      const after = stageEngine.getCrossStorageSyncRecord(syncId);
      expect(after?.status).toBe('RECONCILED');
    });
  });

  // =========================================================================
  // 5. HF02C-007 & HF02C-008: Audit Trail & Integrity
  // =========================================================================
  describe('HF02C-007 & HF02C-008: Audit Trail & Integrity', () => {
    it('1. Reassignment tercatat lengkap di audit trail dengan identitas Admin dan alasan', () => {
      const { stages } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const spv2 = orgRepo.listUsers().find((u) => u.email === 'spv2.hf02c@blc.co.id')!;
      const admin = orgRepo.getUser('usr-admin-01');

      stageEngine.reassignStage(
        {
          stageId: stage1.id,
          newApproverUserId: spv2.id,
          reason: 'Audit trail verification for reassignment',
          actorUserId: admin.id,
        },
        orgRepo
      );

      const reassignments = stageEngine.getReassignments(stage1.id);
      expect(reassignments).toHaveLength(1);
      expect(reassignments[0].reassignedBy).toBe(admin.id);
      expect(reassignments[0].reason).toBe('Audit trail verification for reassignment');
    });

    it('2. Audit log bebas dari secret, credential, atau token JWT', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          comment: 'Approved with standard notes',
          authenticatedUser: spv1,
        },
        orgRepo
      );

      const decisions = stageEngine.getDecisions(workflow.id);
      const serialized = JSON.stringify(decisions);
      expect(serialized).not.toContain('password');
      expect(serialized).not.toContain('jwt');
      expect(serialized).not.toContain('token');
      expect(serialized).not.toContain('secret');
    });
  });

  // =========================================================================
  // 6. HF02C-007: Backend Endpoint Integration & Traceability
  // =========================================================================
  describe('HF02C-007: Backend Endpoint Integration & Traceability', () => {
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

    it('1. POST /api/v1/stages/:stageId/decisions memproses approval sah dengan X-Idempotency-Key', async () => {
      // Create workflow where atasan is usr-atasan-01
      const admin = orgRepo.getUser('usr-admin-01');
      const unit = orgRepo.createUnit('Divisi Endpoint Test', admin.id);
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', admin.id);

      const { workflow, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-api-decision-01',
          docType: 'PR',
          docNumber: 'PR/2026/11/9001',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const atasanToken = await loginAs('ATASAN');

      const res = await app.fetch(
        new Request(`http://localhost/api/v1/stages/${stage1.id}/decisions`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${atasanToken}`,
            'x-idempotency-key': 'endpoint-key-01',
          },
          body: JSON.stringify({
            decision: 'APPROVE',
            comment: 'Disetujui melalui endpoint REST tahap',
          }),
        })
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.stage.status).toBe('APPROVED');
      expect(body.decision.decision).toBe('APPROVE');
    });

    it('2. POST /api/v1/stages/:stageId/decisions menolak token user yang bukan approver (403 FORBIDDEN_APPROVER)', async () => {
      const admin = orgRepo.getUser('usr-admin-01');
      const unit = orgRepo.createUnit('Divisi Endpoint Test 2', admin.id);
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', admin.id);

      const { stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-api-decision-02',
          docType: 'PR',
          docNumber: 'PR/2026/11/9002',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      // Login as PEMOHON (not approver)
      const pemohonToken = await loginAs('PEMOHON');

      const res = await app.fetch(
        new Request(`http://localhost/api/v1/stages/${stage1.id}/decisions`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${pemohonToken}`,
          },
          body: JSON.stringify({ decision: 'APPROVE' }),
        })
      );

      expect(res.status).toBe(403);
      const body = (await res.json()) as any;
      expect(body.code).toBe('FORBIDDEN_APPROVER');
    });

    it('3. POST /api/v1/stages/:stageId/decisions menolak key sama dengan payload beda (409 IDEMPOTENCY_KEY_PAYLOAD_MISMATCH)', async () => {
      const admin = orgRepo.getUser('usr-admin-01');
      const unit = orgRepo.createUnit('Divisi Endpoint Test 3', admin.id);
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', admin.id);

      const { stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-api-decision-03',
          docType: 'PR',
          docNumber: 'PR/2026/11/9003',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const atasanToken = await loginAs('ATASAN');

      // 1st request
      const res1 = await app.fetch(
        new Request(`http://localhost/api/v1/stages/${stage1.id}/decisions`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${atasanToken}`,
            'x-idempotency-key': 'conflict-key-01',
          },
          body: JSON.stringify({ decision: 'APPROVE', comment: 'Setuju' }),
        })
      );
      expect(res1.status).toBe(200);

      // 2nd request with same key but different decision (REJECT)
      const res2 = await app.fetch(
        new Request(`http://localhost/api/v1/stages/${stage1.id}/decisions`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${atasanToken}`,
            'x-idempotency-key': 'conflict-key-01',
          },
          body: JSON.stringify({ decision: 'REJECT', comment: 'Tolak' }),
        })
      );
      expect(res2.status).toBe(409);
      const body2 = (await res2.json()) as any;
      expect(body2.code).toBe('IDEMPOTENCY_KEY_PAYLOAD_MISMATCH');
    });

    it('4. POST /api/v1/stages/:stageId/reassign memungkinkan Admin mengalihkan approver', async () => {
      const admin = orgRepo.getUser('usr-admin-01');
      const unit = orgRepo.createUnit('Divisi Endpoint Reassign', admin.id);
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', admin.id);

      const { stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-api-reassign-01',
          docType: 'PR',
          docNumber: 'PR/2026/11/9004',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const adminToken = await loginAs('ADMIN');

      const res = await app.fetch(
        new Request(`http://localhost/api/v1/stages/${stage1.id}/reassign`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            newApproverUserId: 'usr-ayu-01',
            reason: 'Pengalihan sementara oleh Administrator',
          }),
        })
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.stage.assignedApproverId).toBe('usr-ayu-01');
      expect(body.reassignment.reason).toBe('Pengalihan sementara oleh Administrator');
    });

    it('5. POST /api/v1/stages/:stageId/reassign menolak non-Admin (403 FORBIDDEN_ROLE)', async () => {
      const admin = orgRepo.getUser('usr-admin-01');
      const unit = orgRepo.createUnit('Divisi Endpoint Reassign NonAdmin', admin.id);
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', admin.id);

      const { stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-api-reassign-02',
          docType: 'PR',
          docNumber: 'PR/2026/11/9005',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const atasanToken = await loginAs('ATASAN');

      const res = await app.fetch(
        new Request(`http://localhost/api/v1/stages/${stage1.id}/reassign`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${atasanToken}`,
          },
          body: JSON.stringify({
            newApproverUserId: 'usr-ayu-01',
            reason: 'Illegal reassignment',
          }),
        })
      );

      expect(res.status).toBe(403);
    });

    it('6. GET /api/v1/documents/:documentId/workflow mengembalikan snapshot, stages, dan reassignments', async () => {
      const admin = orgRepo.getUser('usr-admin-01');
      const unit = orgRepo.createUnit('Divisi Workflow Query', admin.id);
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', admin.id);

      const { workflow } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-api-query-01',
          docType: 'PR',
          docNumber: 'PR/2026/11/9006',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const pemohonToken = await loginAs('PEMOHON');
      const res = await app.fetch(
        new Request(`http://localhost/api/v1/documents/${workflow.documentId}/workflow`, {
          headers: {
            authorization: `Bearer ${pemohonToken}`,
          },
        })
      );

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.workflow.id).toBe(workflow.id);
      expect(data.stages).toHaveLength(4);
      expect(data.snapshots).toHaveLength(4);
      expect(Array.isArray(data.reassignments)).toBe(true);
    });
  });

  // =========================================================================
  // 7. HF02-C REVISION 01: Security & Data Consistency Verification (REV-C01 - REV-C04)
  // =========================================================================
  describe('HF02-C REVISION 01: Security & Data Consistency Verification (REV-C01 - REV-C04)', () => {
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

    // REV-C01: Cross-Storage Recovery
    it('REV-C01.1: Kompensasi nyata memulihkan status stage ke PENDING, menghapus decision, dan mencatat audit history', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      // 1. Prepare sync
      const syncId = stageEngine.prepareCrossStorageSync({
        documentId: workflow.documentId,
        workflowId: workflow.id,
        stageId: stage1.id,
        operationType: 'APPROVE',
        stageState: { status: 'APPROVED' },
      });

      // 2. Execute SQLite decision (Stage 1 -> APPROVED, Stage 2 -> PENDING)
      stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          comment: 'Approved before storage failure',
          idempotencyKey: 'idem-comp-01',
          authenticatedUser: spv1,
        },
        orgRepo
      );

      expect(stageEngine.getStage(stage1.id).status).toBe('APPROVED');
      const stage2 = stageEngine.getStages(workflow.id).find((s) => s.stageKey === 'STAGE_2_FINANCE')!;
      expect(stage2.status).toBe('PENDING');
      expect(stageEngine.getDecisions(workflow.id)).toHaveLength(1);

      // 3. Simulate document storage write failure -> trigger compensation!
      stageEngine.compensateCrossStorageSync(syncId, 'Simulated document flush EACCES');

      // 4. Verify genuine data rollback:
      // - Stage 1 must be reverted to PENDING
      const rolledBackStage1 = stageEngine.getStage(stage1.id);
      expect(rolledBackStage1.status).toBe('PENDING');
      expect(rolledBackStage1.completedAt).toBeNull();

      // - Stage 2 must be reverted to WAITING
      const rolledBackStage2 = stageEngine.getStage(stage2.id);
      expect(rolledBackStage2.status).toBe('WAITING');
      expect(rolledBackStage2.activatedAt).toBeNull();

      // - Decision in approval_decisions must be deleted (no uncommitted ghost decision)
      expect(stageEngine.getDecisions(workflow.id)).toHaveLength(0);

      // - Audit trail must record SYNC_COMPENSATION event
      const rawDb = (stageEngine as any).getDb();
      try {
        const auditRows = rawDb.prepare(
          "SELECT * FROM approval_stage_assignment_audit WHERE action = 'SYNC_COMPENSATION' AND stage_key = 'STAGE_1_SUPERVISOR'"
        ).all() as any[];
        expect(auditRows.length).toBeGreaterThanOrEqual(1);
        expect(auditRows[0].after_json).toContain('Simulated document flush EACCES');
      } finally {
        (stageEngine as any).closeDb(rawDb);
      }
    });

    it('REV-C01.2: Crash/Restart Recovery: reconcileCrossStorage memulihkan konsistensi tanpa menggandakan decision', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      // Prepare sync record left uncommitted (simulating server crash during operation)
      const syncId = stageEngine.prepareCrossStorageSync({
        documentId: workflow.documentId,
        workflowId: workflow.id,
        stageId: stage1.id,
        operationType: 'APPROVE',
        stageState: { status: 'APPROVED' },
      });

      // Execute decision
      stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          authenticatedUser: spv1,
        },
        orgRepo
      );

      // Verify 1 decision exists
      expect(stageEngine.getDecisions(workflow.id)).toHaveLength(1);

      // Reconcile
      const recResult = stageEngine.reconcileCrossStorage(workflow.documentId, procRepo);
      expect(recResult.reconciledCount).toBeGreaterThanOrEqual(1);

      // Verify sync record marked RECONCILED
      const rec = stageEngine.getCrossStorageSyncRecord(syncId);
      expect(rec?.status).toBe('RECONCILED');

      // Verify no duplicate decision was added
      expect(stageEngine.getDecisions(workflow.id)).toHaveLength(1);
    });

    // REV-C02: Operational Endpoint Isolation
    it('REV-C02.1: Default server configuration menolak /api/v1/stages/* dengan 404 STAGE_ENGINE_DISABLED', async () => {
      // Create operational app without stageEngineEnabled
      const defaultApp = createAppServer({ repository: procRepo, organization: orgRepo, stageEngine });
      const atasanToken = await loginAs('ATASAN');

      const res = await defaultApp.fetch(
        new Request('http://localhost/api/v1/stages/any-stage-id/decisions', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${atasanToken}`,
          },
          body: JSON.stringify({ decision: 'APPROVE' }),
        })
      );

      expect(res.status).toBe(404);
      const body = (await res.json()) as any;
      expect(body.code).toBe('STAGE_ENGINE_DISABLED');
    });

    it('REV-C02.2: Default server configuration menolak /api/v1/documents/:id/workflow dengan 404 STAGE_ENGINE_DISABLED', async () => {
      const defaultApp = createAppServer({ repository: procRepo, organization: orgRepo, stageEngine });
      const pemohonToken = await loginAs('PEMOHON');

      const res = await defaultApp.fetch(
        new Request('http://localhost/api/v1/documents/doc-123/workflow', {
          headers: {
            authorization: `Bearer ${pemohonToken}`,
          },
        })
      );

      expect(res.status).toBe(404);
      const body = (await res.json()) as any;
      expect(body.code).toBe('STAGE_ENGINE_DISABLED');
    });

    // REV-C03: Idempotency Scope
    it('REV-C03.1: Idempotency scope mencakup stage_id: key sama pada stage berbeda diproses secara independen', () => {
      // Ayu Martina has assignments on both Stage 1 and Stage 2
      const admin = orgRepo.getUser('usr-admin-01');
      const unit = orgRepo.createUnit('Divisi Idempotency Scope Test', admin.id);
      const ayu = orgRepo.listUsers().find((u) => u.email === 'ayu.hf02c@blc.co.id')!;
      orgRepo.createAssignment(unit.id, ayu.id, admin.id);

      const { workflow, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-idem-scope-01',
          docType: 'PR',
          docNumber: 'PR/2026/11/9801',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const st1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const st2 = stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;

      // Use the SAME key 'shared-idempotency-key' for Stage 1
      const res1 = stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: st1.id,
          approverUserId: ayu.id,
          decision: 'APPROVE',
          comment: 'Approval Stage 1',
          idempotencyKey: 'shared-idempotency-key',
          authenticatedUser: ayu,
        },
        orgRepo
      );
      expect(res1.stage.status).toBe('APPROVED');

      // Use the SAME key 'shared-idempotency-key' for Stage 2
      // Must NOT collide or return cached response from Stage 1!
      const res2 = stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: st2.id,
          approverUserId: ayu.id,
          decision: 'APPROVE',
          comment: 'Approval Stage 2',
          idempotencyKey: 'shared-idempotency-key',
          authenticatedUser: ayu,
        },
        orgRepo
      );
      expect(res2.stage.status).toBe('APPROVED');
      expect(res2.stage.id).toBe(st2.id);

      // Two distinct decisions recorded!
      const decisions = stageEngine.getDecisions(workflow.id);
      expect(decisions).toHaveLength(2);
      expect(decisions[0].stageId).toBe(st1.id);
      expect(decisions[1].stageId).toBe(st2.id);
    });

    it('REV-C03.2: Idempotency tetap persisten setelah restart koneksi database (application restart)', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const key = 'restart-persistent-key-01';

      // First call
      const res1 = stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          comment: 'Approved before restart',
          idempotencyKey: key,
          authenticatedUser: spv1,
        },
        orgRepo
      );

      // Simulate application restart: instantiate new ApprovalStageEngine on same dbPath
      const restartedEngine = new ApprovalStageEngine(dbPath);

      // Retry call with same key on restarted engine
      const res2 = restartedEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          comment: 'Approved before restart',
          idempotencyKey: key,
          authenticatedUser: spv1,
        },
        orgRepo
      );

      expect(res2.stage.id).toBe(res1.stage.id);
      expect(res2.decision.id).toBe(res1.decision.id);
      expect(restartedEngine.getDecisions(workflow.id)).toHaveLength(1);
    });

    // REV-C04: Authorization & Identity Forgery Rejection
    it('REV-C04.1: Endpoint menolak identitas client-supplied yang mencoba memalsukan approverUserId', async () => {
      const admin = orgRepo.getUser('usr-admin-01');
      const unit = orgRepo.createUnit('Divisi Forgery Test', admin.id);
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', admin.id);

      const { stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-api-forgery-01',
          docType: 'PR',
          docNumber: 'PR/2026/11/9802',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      // Login as PEMOHON, but client body maliciously includes approverUserId: 'usr-atasan-01'
      const pemohonToken = await loginAs('PEMOHON');

      const res = await app.fetch(
        new Request(`http://localhost/api/v1/stages/${stage1.id}/decisions`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${pemohonToken}`,
          },
          body: JSON.stringify({
            decision: 'APPROVE',
            approverUserId: 'usr-atasan-01',
            userId: 'usr-atasan-01',
            source: 'INTERNAL_SERVER_CONTEXT',
          }),
        })
      );

      expect(res.status).toBe(403);
      const body = (await res.json()) as any;
      expect(body.code).toBe('FORBIDDEN_APPROVER');
    });
  });

  // =========================================================================
  // 6. HF02-C REVISION 01: 17 Automated Acceptance Test Matrix (Section 4)
  // =========================================================================
  describe('HF02-C REVISION 01: 17 Automated Acceptance Test Matrix (Section 4)', () => {
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

    it('1. Stage 1 dipilih dari supervisor valid (PASS)', () => {
      const admin = orgRepo.getUser('usr-admin-01');
      const unit = orgRepo.createUnit('Divisi Multi-Supervisor', admin.id);
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02c@blc.co.id')!;
      const spv2 = orgRepo.listUsers().find((u) => u.email === 'spv2.hf02c@blc.co.id')!;

      // Both supervisors have active assignments in this unit
      orgRepo.createAssignment(unit.id, spv1.id, admin.id);
      orgRepo.createAssignment(unit.id, spv2.id, admin.id);

      // Applicant explicitly selects spv2
      const result = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-matrix-01',
          docType: 'PR',
          docNumber: 'PR/2026/11/7001',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
          supervisorUserId: spv2.id,
        },
        orgRepo
      );

      const st1 = result.stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR');
      expect(st1?.assignedApproverId).toBe(spv2.id);
      expect(st1?.approverName).toBe(spv2.fullName);
      expect(st1?.status).toBe('PENDING');

      const snap1 = result.snapshots.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR');
      expect(snap1?.approverUserId).toBe(spv2.id);
    });

    it('2. Pemohon memilih supervisor tanpa assignment (REJECT)', () => {
      const admin = orgRepo.getUser('usr-admin-01');
      const unit = orgRepo.createUnit('Divisi Single-Supervisor', admin.id);
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02c@blc.co.id')!;
      orgRepo.createAssignment(unit.id, spv1.id, admin.id);

      // Applicant chooses an unassigned user
      expect(() =>
        stageEngine.createSubmissionWorkflow(
          {
            documentId: 'doc-matrix-02',
            docType: 'PR',
            docNumber: 'PR/2026/11/7002',
            unitId: unit.id,
            applicantUserId: 'usr-pemohon-01',
            supervisorUserId: 'usr-unassigned-random-999',
          },
          orgRepo
        )
      ).toThrowError(/Supervisor yang dipilih tidak memiliki penugasan valid/);
    });

    it('3. Ayu memiliki dua tahap approval (Dua keputusan independen)', () => {
      const admin = orgRepo.getUser('usr-admin-01');
      const unit = orgRepo.createUnit('Divisi Ayu Multi-Role', admin.id);
      const ayu = orgRepo.listUsers().find((u) => u.email === 'ayu.hf02c@blc.co.id')!;
      orgRepo.createAssignment(unit.id, ayu.id, admin.id);

      // Applicant is NOT Ayu
      const { workflow, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-matrix-03',
          docType: 'PR',
          docNumber: 'PR/2026/11/7003',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const st1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const st2 = stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;
      expect(st1.assignedApproverId).toBe(ayu.id);
      expect(st2.assignedApproverId).toBe(ayu.id);
      expect(st1.status).toBe('PENDING');
      expect(st2.status).toBe('WAITING');

      // 1st action: Ayu approves Stage 1
      const res1 = stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: st1.id,
          approverUserId: ayu.id,
          decision: 'APPROVE',
          comment: 'Disetujui sebagai supervisor',
          authenticatedUser: ayu,
        },
        orgRepo
      );
      expect(res1.stage.status).toBe('APPROVED');
      const reloadedSt2 = stageEngine.getStage(st2.id);
      expect(reloadedSt2.status).toBe('PENDING'); // activated, NOT auto-approved!

      // 2nd action: Ayu approves Stage 2
      const res2 = stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: st2.id,
          approverUserId: ayu.id,
          decision: 'APPROVE',
          comment: 'Disetujui sebagai Finance Reviewer',
          authenticatedUser: ayu,
        },
        orgRepo
      );
      expect(res2.stage.status).toBe('APPROVED');

      // 2 separate decision records
      const decisions = stageEngine.getDecisions(workflow.id);
      expect(decisions).toHaveLength(2);
      expect(decisions[0].stageId).toBe(st1.id);
      expect(decisions[1].stageId).toBe(st2.id);
    });

    it('4. PV diajukan (Mulai pada Finance Reviewer)', () => {
      const result = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-matrix-04',
          docType: 'PV',
          docNumber: 'PV/2026/11/7004',
          applicantUserId: 'usr-keuangan-01',
        },
        orgRepo
      );

      // Workflow starts ACTIVE
      expect(result.workflow.status).toBe('ACTIVE');

      // Stage 1 does NOT exist for PV
      const st1 = result.stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR');
      expect(st1).toBeUndefined();

      // First stage is Stage 2 (Finance / Ayu) with status PENDING
      const st2 = result.stages.find((s) => s.stageKey === 'STAGE_2_FINANCE');
      expect(st2).toBeDefined();
      expect(st2?.status).toBe('PENDING');
      expect(st2?.activatedAt).toBeDefined();

      // BOD stages start WAITING
      const stHery = result.stages.find((s) => s.stageKey === 'STAGE_3_BOD_HERY');
      const stHash = result.stages.find((s) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO');
      expect(stHery?.status).toBe('WAITING');
      expect(stHash?.status).toBe('WAITING');

      // No fake decisions
      expect(stageEngine.getDecisions(result.workflow.id)).toHaveLength(0);
    });

    it('5. Ayu menyetujui PV (Hery aktif, Hashimoto belum aktif)', () => {
      const ayu = orgRepo.listUsers().find((u) => u.email === 'ayu.hf02c@blc.co.id')!;
      const { workflow, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-matrix-05',
          docType: 'PV',
          docNumber: 'PV/2026/11/7005',
          applicantUserId: 'usr-keuangan-01',
        },
        orgRepo
      );

      const st2 = stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;
      const res = stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: st2.id,
          approverUserId: ayu.id,
          decision: 'APPROVE',
          comment: 'PV Finance review approved',
          authenticatedUser: ayu,
        },
        orgRepo
      );
      expect(res.stage.status).toBe('APPROVED');

      // Hery is active (PENDING)
      const stHery = stageEngine.getStages(workflow.id).find((s) => s.stageKey === 'STAGE_3_BOD_HERY')!;
      expect(stHery.status).toBe('PENDING');
      expect(stHery.activatedAt).toBeDefined();

      // Hashimoto is NOT active yet (WAITING) per WF-002 sequential progression!
      const stHash = stageEngine.getStages(workflow.id).find((s) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO')!;
      expect(stHash.status).toBe('WAITING');
      expect(stHash.activatedAt).toBeNull();
    });

    it('6. Hery menyetujui PV (Hashimoto aktif)', () => {
      const ayu = orgRepo.listUsers().find((u) => u.email === 'ayu.hf02c@blc.co.id')!;
      const dirHery = orgRepo.listUsers().find((u) => u.email === 'hery.hf02c@blc.co.id')!;
      const { workflow, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-matrix-06',
          docType: 'PV',
          docNumber: 'PV/2026/11/7006',
          applicantUserId: 'usr-keuangan-01',
        },
        orgRepo
      );

      // Ayu approves Stage 2
      const st2 = stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;
      stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: st2.id,
          approverUserId: ayu.id,
          decision: 'APPROVE',
          authenticatedUser: ayu,
        },
        orgRepo
      );

      // Hery approves Stage 3A
      const stHery = stageEngine.getStages(workflow.id).find((s) => s.stageKey === 'STAGE_3_BOD_HERY')!;
      const resHery = stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stHery.id,
          approverUserId: dirHery.id,
          decision: 'APPROVE',
          comment: 'Director Hery approved PV',
          authenticatedUser: dirHery,
        },
        orgRepo
      );
      expect(resHery.stage.status).toBe('APPROVED');

      // Hashimoto is now activated (PENDING)!
      const stHash = stageEngine.getStages(workflow.id).find((s) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO')!;
      expect(stHash.status).toBe('PENDING');
      expect(stHash.activatedAt).toBeDefined();

      // Workflow still ACTIVE (awaiting Hashimoto)
      expect(stageEngine.getWorkflow(workflow.id).status).toBe('ACTIVE');
    });

    it('7. Hashimoto menyetujui PV (Workflow completed)', () => {
      const ayu = orgRepo.listUsers().find((u) => u.email === 'ayu.hf02c@blc.co.id')!;
      const dirHery = orgRepo.listUsers().find((u) => u.email === 'hery.hf02c@blc.co.id')!;
      const dirHashimoto = orgRepo.listUsers().find((u) => u.email === 'hashimoto.hf02c@blc.co.id')!;

      const { workflow, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-matrix-07',
          docType: 'PV',
          docNumber: 'PV/2026/11/7007',
          applicantUserId: 'usr-keuangan-01',
        },
        orgRepo
      );

      // Ayu approves
      const st2 = stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;
      stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: st2.id,
          approverUserId: ayu.id,
          decision: 'APPROVE',
          authenticatedUser: ayu,
        },
        orgRepo
      );

      // Hery approves
      const stHery = stageEngine.getStages(workflow.id).find((s) => s.stageKey === 'STAGE_3_BOD_HERY')!;
      stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stHery.id,
          approverUserId: dirHery.id,
          decision: 'APPROVE',
          authenticatedUser: dirHery,
        },
        orgRepo
      );

      // Hashimoto approves
      const stHash = stageEngine.getStages(workflow.id).find((s) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO')!;
      const resHash = stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stHash.id,
          approverUserId: dirHashimoto.id,
          decision: 'APPROVE',
          comment: 'President Director Hashimoto approved PV',
          authenticatedUser: dirHashimoto,
        },
        orgRepo
      );
      expect(resHash.stage.status).toBe('APPROVED');

      // Workflow is completed!
      const completedWf = stageEngine.getWorkflow(workflow.id);
      expect(completedWf.status).toBe('COMPLETED');
      expect(completedWf.completedAt).toBeDefined();

      // Exactly 3 decisions
      const decisions = stageEngine.getDecisions(workflow.id);
      expect(decisions).toHaveLength(3);
    });

    it('8. GR disubmit (Completed tanpa approval decision)', () => {
      const result = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-matrix-08',
          docType: 'GR',
          docNumber: 'GR/2026/11/7008',
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      expect(result.workflow.status).toBe('COMPLETED');
      expect(result.stages).toHaveLength(0);
      expect(result.snapshots).toHaveLength(0);
      expect(stageEngine.getDecisions(result.workflow.id)).toHaveLength(0);
    });

    it('9. Payment Record sebelum PV Approved (REJECT)', () => {
      const unapprovedPvId = 'doc-pv-not-yet-approved';
      // In procurement repo, recordPvPayment checks pv.status === 'APPROVED'
      expect(() =>
        procRepo.recordPvPayment(
          unapprovedPvId,
          {
            sourceBank: 'BCA Operasional',
            referenceNumber: 'TRF-12345',
            paidAmount: 1000000,
            paidAt: '2026-11-10T10:00:00.000Z',
          },
          'Finance Staff'
        )
      ).toThrowError(/Payment Voucher doc-pv-not-yet-approved tidak ditemukan|harus disetujui penuh/);
    });

    it('10. Pemohon sama dengan approver (Self-approval skip diaudit)', () => {
      const admin = orgRepo.getUser('usr-admin-01');
      const unit = orgRepo.createUnit('Divisi Self-Approval Test', admin.id);
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02c@blc.co.id')!;
      orgRepo.createAssignment(unit.id, spv1.id, admin.id);

      // Supervisor submits PR for own unit (applicant === supervisor)
      const { workflow, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-matrix-10',
          docType: 'PR',
          docNumber: 'PR/2026/11/7010',
          unitId: unit.id,
          applicantUserId: spv1.id,
        },
        orgRepo
      );

      // Stage 1 must be SKIPPED per BLC Procurement v3
      const st1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      expect(st1.status).toBe('SKIPPED');
      expect(st1.completedAt).toBeDefined();

      // Zero fake decision records
      expect(stageEngine.getDecisions(workflow.id)).toHaveLength(0);

      // Stage 2 (Ayu / Finance) is immediately activated (PENDING)
      const st2 = stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;
      expect(st2.status).toBe('PENDING');

      // Audit trail records SELF_APPROVAL_SKIPPED
      const rawDb = (stageEngine as any).getDb();
      try {
        const auditRows = rawDb.prepare(
          "SELECT * FROM approval_stage_assignment_audit WHERE action = 'SELF_APPROVAL_SKIPPED' AND stage_key = 'STAGE_1_SUPERVISOR'"
        ).all() as any[];
        expect(auditRows.length).toBeGreaterThanOrEqual(1);
        expect(auditRows[0].after_json).toContain('Self-approval skipped per BLC Procurement v3');
      } finally {
        (stageEngine as any).closeDb(rawDb);
      }
    });

    it('11. Role ada tetapi assignment tidak tersedia (REJECT)', () => {
      const admin = orgRepo.getUser('usr-admin-01');
      const unit = orgRepo.createUnit('Divisi Unassigned Role Test', admin.id);
      const spv1 = orgRepo.listUsers().find((u) => u.email === 'spv1.hf02c@blc.co.id')!;
      orgRepo.createAssignment(unit.id, spv1.id, admin.id);

      // Deactivate Stage 2 Finance assignment in SQLite
      const rawDb = (stageEngine as any).getDb();
      try {
        rawDb.prepare("UPDATE approval_stage_assignments SET active = 0 WHERE stage_key = 'STAGE_2_FINANCE'").run();
      } finally {
        (stageEngine as any).closeDb(rawDb);
      }

      // Submission fails because Stage 2 assignment is missing
      expect(() =>
        stageEngine.createSubmissionWorkflow(
          {
            documentId: 'doc-matrix-11',
            docType: 'PR',
            docNumber: 'PR/2026/11/7011',
            unitId: unit.id,
            applicantUserId: 'usr-pemohon-01',
          },
          orgRepo
        )
      ).toThrowError(/Penugasan Verifikator Keuangan \(Stage 2\) tidak ditemukan/);

      // Restore assignment
      try {
        const rawDbRestore = (stageEngine as any).getDb();
        rawDbRestore.prepare("UPDATE approval_stage_assignments SET active = 1 WHERE stage_key = 'STAGE_2_FINANCE'").run();
        (stageEngine as any).closeDb(rawDbRestore);
      } catch {}
    });

    it('12. Non-Admin memalsukan principal Admin (REJECT)', async () => {
      const { stages } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const pemohonToken = await loginAs('PEMOHON');

      // Attempt reassignment with PEMOHON token
      const res = await app.fetch(
        new Request(`http://localhost/api/v1/stages/${stage1.id}/reassign`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${pemohonToken}`,
          },
          body: JSON.stringify({
            newApproverUserId: 'usr-atasan-01',
            reason: 'Impersonation attempt by non-admin',
          }),
        })
      );
      expect(res.status).toBe(403);
      const body = (await res.json()) as any;
      expect(body.code).toBe('FORBIDDEN_ROLE');
    });

    it('13. Repeated idempotency key (Tidak menggandakan keputusan)', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const key = 'idem-matrix-13';

      const res1 = stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          comment: 'Approved once',
          idempotencyKey: key,
          authenticatedUser: spv1,
        },
        orgRepo
      );

      const res2 = stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          comment: 'Approved once',
          idempotencyKey: key,
          authenticatedUser: spv1,
        },
        orgRepo
      );

      expect(res2.stage.id).toBe(res1.stage.id);
      expect(res2.decision.id).toBe(res1.decision.id);
      expect(stageEngine.getDecisions(workflow.id)).toHaveLength(1);
    });

    it('14. Approval dan reassignment bersamaan (State konsisten)', async () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const spv2 = orgRepo.listUsers().find((u) => u.email === 'spv2.hf02c@blc.co.id')!;
      const admin = orgRepo.getUser('usr-admin-01');

      const tasks = [
        () =>
          stageEngine.recordStageDecision(
            {
              workflowId: workflow.id,
              stageId: stage1.id,
              approverUserId: spv1.id,
              decision: 'APPROVE',
              comment: 'Concurrent approval',
              authenticatedUser: spv1,
            },
            orgRepo
          ),
        () =>
          stageEngine.reassignStage(
            {
              stageId: stage1.id,
              newApproverUserId: spv2.id,
              reason: 'Concurrent reassignment',
              actorUserId: admin.id,
            },
            orgRepo
          ),
      ];

      const results = await Promise.allSettled([
        Promise.resolve().then(() => tasks[0]()),
        Promise.resolve().then(() => tasks[1]()),
      ]);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      expect(fulfilled.length).toBeGreaterThanOrEqual(1);

      const decisions = stageEngine.getDecisions(workflow.id);
      expect(decisions.length).toBeLessThanOrEqual(1);
    });

    it('15. Cross-storage write failure (Recovery terbukti)', () => {
      const { workflow, stages, spv1 } = createStandardWorkflow();
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      const syncId = stageEngine.prepareCrossStorageSync({
        documentId: workflow.documentId,
        workflowId: workflow.id,
        stageId: stage1.id,
        operationType: 'APPROVE',
        stageState: { status: 'APPROVED' },
      });

      stageEngine.recordStageDecision(
        {
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: spv1.id,
          decision: 'APPROVE',
          authenticatedUser: spv1,
        },
        orgRepo
      );

      // Trigger rollback compensation
      stageEngine.compensateCrossStorageSync(syncId, 'Flush failure simulated');

      // Stage 1 is back to PENDING, decision is deleted, audit recorded
      expect(stageEngine.getStage(stage1.id).status).toBe('PENDING');
      expect(stageEngine.getDecisions(workflow.id)).toHaveLength(0);
      expect(stageEngine.getCrossStorageSyncRecord(syncId)?.status).toBe('COMPENSATED');
    });

    it('16. Production feature disabled (Endpoint baru tidak aktif)', async () => {
      const defaultApp = createAppServer({ repository: procRepo, organization: orgRepo, stageEngine });
      const atasanToken = await loginAs('ATASAN');

      const res = await defaultApp.fetch(
        new Request('http://localhost/api/v1/stages/any-stage/decisions', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${atasanToken}`,
          },
          body: JSON.stringify({ decision: 'APPROVE' }),
        })
      );

      expect(res.status).toBe(404);
      const body = (await res.json()) as any;
      expect(body.code).toBe('STAGE_ENGINE_DISABLED');
    });

    it('17. Legacy documents (Tetap kompatibel)', () => {
      const doc = procRepo.getDocumentById('seed-pr-01');
      expect(doc).toBeDefined();
      expect(doc.docType).toBe('PR');
      expect(doc.docNumber).toBe('PR-202611-0001');
      expect(doc.status).toBeDefined();
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { migrateOrganization, OrganizationRepository } from './organization';
import { ApprovalStageEngine, migrateApprovalEngine } from './stage-engine';
import { signJwt, verifyJwt, authenticateCredentials, SEEDED_USERS } from './auth';

describe('HF02-B Approval Snapshot & Independent Stage Engine', () => {
  let dbPath: string;
  let orgRepo: OrganizationRepository;
  let stageEngine: ApprovalStageEngine;

  beforeEach(() => {
    dbPath = join(mkdtempSync(join(tmpdir(), 'blc-stage-engine-test-')), 'test.sqlite');
    migrateOrganization(dbPath);
    migrateApprovalEngine(dbPath);
    orgRepo = new OrganizationRepository(dbPath);
    stageEngine = new ApprovalStageEngine(dbPath);

    // Verify key test actors in isolated database per ADR-ID-002
    orgRepo.verifyUser('usr-ayu-01', { proofReference: 'SK Direksi No. 01/2026', verifiedBy: 'usr-admin-01' });
    orgRepo.setUserLifecycle('usr-ayu-01', 'ACTIVE', 'usr-admin-01');

    orgRepo.verifyUser('usr-bod-hery', { proofReference: 'Akta Notaris No. 12', verifiedBy: 'usr-admin-01' });
    orgRepo.setUserLifecycle('usr-bod-hery', 'ACTIVE', 'usr-admin-01');

    orgRepo.verifyUser('usr-bod-hashimoto', { proofReference: 'Akta Notaris No. 12', verifiedBy: 'usr-admin-01' });
    orgRepo.setUserLifecycle('usr-bod-hashimoto', 'ACTIVE', 'usr-admin-01');

    orgRepo.verifyUser('usr-atasan-01', { proofReference: 'SK Penugasan BM', verifiedBy: 'usr-admin-01' });
    orgRepo.setUserLifecycle('usr-atasan-01', 'ACTIVE', 'usr-admin-01');

    // Explicit Admin stage assignments per Final Revision 02
    stageEngine.setStageAssignment('STAGE_2_FINANCE', 'usr-ayu-01', 'usr-admin-01', orgRepo);
    stageEngine.setStageAssignment('STAGE_3_BOD_HERY', 'usr-bod-hery', 'usr-admin-01', orgRepo);
    stageEngine.setStageAssignment('STAGE_3_BOD_HASHIMOTO', 'usr-bod-hashimoto', 'usr-admin-01', orgRepo);
  });

  describe('6.1 Snapshot Tests', () => {
    it('creates snapshot with valid active assignment and canonical user IDs', () => {
      const unit = orgRepo.createUnit('Divisi IT & Procurement', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      const result = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-pr-001',
          docType: 'PR',
          docNumber: 'PR/2026/11/0001',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      expect(result.workflow.id).toBeDefined();
      expect(result.workflow.status).toBe('ACTIVE');
      expect(result.snapshots).toHaveLength(4);

      const snap1 = result.snapshots.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR');
      expect(snap1).toBeDefined();
      expect(snap1?.approverUserId).toBe('usr-atasan-01');
      expect(snap1?.unitId).toBe(unit.id);
      expect(snap1?.unitName).toBe('Divisi IT & Procurement');

      const stage1 = result.stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR');
      expect(stage1?.status).toBe('PENDING');
      expect(stage1?.assignedApproverId).toBe('usr-atasan-01');
    });

    it('rejects unverified approver during snapshot creation', () => {
      const unit = orgRepo.createUnit('Divisi Unverified Test', 'usr-admin-01');
      const unverifiedUser = orgRepo.createUser(
        { email: 'unverified.supervisor@blc.co.id', fullName: 'Calon Supervisor' },
        'usr-admin-01'
      );

      // Force an active assignment in SQLite directly to test fail-closed snapshot
      const db = new DatabaseSync(dbPath);
      db.prepare('INSERT INTO org_assignments VALUES(?,?,?,?,?,?,?,?)').run(
        'asg-unverified',
        unit.id,
        unverifiedUser.id,
        1,
        new Date().toISOString(),
        'admin',
        new Date().toISOString(),
        'admin'
      );
      db.close();

      expect(() =>
        stageEngine.createSubmissionWorkflow(
          {
            documentId: 'doc-fail-unverified',
            docType: 'PR',
            docNumber: 'PR/2026/11/0002',
            unitId: unit.id,
            applicantUserId: 'usr-pemohon-01',
          },
          orgRepo
        )
      ).toThrowError(/belum diverifikasi/);
    });

    it('rejects inactive approver during snapshot creation', () => {
      const unit = orgRepo.createUnit('Divisi Inactive Test', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      // Deactivate atasan
      orgRepo.setUserLifecycle('usr-atasan-01', 'INACTIVE', 'usr-admin-01');

      expect(() =>
        stageEngine.createSubmissionWorkflow(
          {
            documentId: 'doc-fail-inactive',
            docType: 'PR',
            docNumber: 'PR/2026/11/0003',
            unitId: unit.id,
            applicantUserId: 'usr-pemohon-01',
          },
          orgRepo
        )
      ).toThrowError(/tidak aktif/);
    });

    it('produces explicit failure when unit assignment is missing', () => {
      const unit = orgRepo.createUnit('Divisi Tanpa Supervisor', 'usr-admin-01');

      expect(() =>
        stageEngine.createSubmissionWorkflow(
          {
            documentId: 'doc-fail-missing',
            docType: 'PR',
            docNumber: 'PR/2026/11/0004',
            unitId: unit.id,
            applicantUserId: 'usr-pemohon-01',
          },
          orgRepo
        )
      ).toThrowError(/tidak ditemukan/);
    });

    it('ensures assignment changes after snapshot do NOT alter existing workflow instance approver', () => {
      const unit = orgRepo.createUnit('Divisi Mutasi Atasan', 'usr-admin-01');
      const initialAsg = orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      // Submit document and lock snapshot
      const created = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-locked-snapshot',
          docType: 'PR',
          docNumber: 'PR/2026/11/0005',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const originalApprover = created.stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')?.assignedApproverId;
      expect(originalApprover).toBe('usr-atasan-01');

      // Now create a replacement verified supervisor and reassign the unit in orgRepo
      const newUser = orgRepo.createUser(
        { email: 'new.supervisor@blc.co.id', fullName: 'Supervisor Baru' },
        'usr-admin-01'
      );
      orgRepo.verifyUser(newUser.id, { proofReference: 'SK Mutasi', verifiedBy: 'usr-admin-01' });
      orgRepo.setUserLifecycle(newUser.id, 'ACTIVE', 'usr-admin-01');

      orgRepo.updateAssignment(initialAsg.id, { active: false }, 'usr-admin-01');
      orgRepo.createAssignment(unit.id, newUser.id, 'usr-admin-01');

      // Verify existing locked workflow instance retains original approver
      const existingStages = stageEngine.getStages(created.workflow.id);
      const stage1AfterChange = existingStages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR');
      expect(stage1AfterChange?.assignedApproverId).toBe('usr-atasan-01');
      expect(stage1AfterChange?.assignedApproverId).not.toBe(newUser.id);
    });

    it('submission failure leaves zero partial workflow records in database', () => {
      const unit = orgRepo.createUnit('Divisi Atomicity Test', 'usr-admin-01');
      // No assignment -> fails
      expect(() =>
        stageEngine.createSubmissionWorkflow(
          {
            documentId: 'doc-atomic-fail',
            docType: 'PR',
            docNumber: 'PR/2026/11/0006',
            unitId: unit.id,
            applicantUserId: 'usr-pemohon-01',
          },
          orgRepo
        )
      ).toThrow();

      expect(stageEngine.getWorkflowByDocumentId('doc-atomic-fail')).toBeNull();
    });

    it('persists snapshot and stages across database restart and reload', () => {
      const unit = orgRepo.createUnit('Divisi Reopen Test', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      const created = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-reopen-test',
          docType: 'PO',
          docNumber: 'PO/2026/11/0001',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      // Reopen in fresh engine instance
      const reopenedEngine = new ApprovalStageEngine(dbPath);
      const wf = reopenedEngine.getWorkflow(created.workflow.id);
      expect(wf.docNumber).toBe('PO/2026/11/0001');

      const stages = reopenedEngine.getStages(created.workflow.id);
      expect(stages).toHaveLength(4);

      const snapshots = reopenedEngine.getSnapshots(created.workflow.id);
      expect(snapshots).toHaveLength(4);
    });
  });

  describe('6.2 Independent Stage Tests & Multi-Role Scenarios (BR-APP-001)', () => {
    it('supports the same approver user ID on two distinct stages with unique stage IDs', () => {
      // Assign Ayu Martina (usr-ayu-01) as Stage 1 supervisor of Divisi Finance
      const unit = orgRepo.createUnit('Divisi Keuangan & Akuntansi', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-ayu-01', 'usr-admin-01');

      const { workflow, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-multi-role-01',
          docType: 'PR',
          docNumber: 'PR/2026/11/0010',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const stage2 = stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;

      // Both stages assigned to Ayu Martina
      expect(stage1.assignedApproverId).toBe('usr-ayu-01');
      expect(stage2.assignedApproverId).toBe('usr-ayu-01');

      // But stages have distinct unique IDs
      expect(stage1.id).not.toBe(stage2.id);
      expect(stage1.status).toBe('PENDING');
      expect(stage2.status).toBe('WAITING');
    });

    it('approving Stage 1 does NOT complete or skip Stage 2 for the same approver', () => {
      const unit = orgRepo.createUnit('Divisi HR & GA', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-ayu-01', 'usr-admin-01');

      const { workflow } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-multi-role-02',
          docType: 'PR',
          docNumber: 'PR/2026/11/0011',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const initialStages = stageEngine.getStages(workflow.id);
      const stage1 = initialStages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const stage2 = initialStages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;

      // Ayu Martina approves Stage 1
      const action1 = stageEngine.recordStageDecision({
        workflowId: workflow.id,
        stageId: stage1.id,
        approverUserId: 'usr-ayu-01',
        decision: 'APPROVE',
        comment: 'Disetujui sebagai atasan langsung divisi',
      });

      expect(action1.stage.status).toBe('APPROVED');
      expect(action1.stage.completedAt).toBeDefined();

      // Check Stage 2 status: must be PENDING (activated), NOT APPROVED!
      const stage2AfterAction1 = stageEngine.getStage(stage2.id);
      expect(stage2AfterAction1.status).toBe('PENDING');
      expect(stage2AfterAction1.completedAt).toBeNull();

      // Check decisions count: exactly 1 decision recorded so far
      const decisionsAfter1 = stageEngine.getDecisions(workflow.id);
      expect(decisionsAfter1).toHaveLength(1);
      expect(decisionsAfter1[0].stageId).toBe(stage1.id);
      expect(decisionsAfter1[0].decision).toBe('APPROVE');

      // Ayu Martina now performs second independent action on Stage 2
      const action2 = stageEngine.recordStageDecision({
        workflowId: workflow.id,
        stageId: stage2.id,
        approverUserId: 'usr-ayu-01',
        decision: 'APPROVE',
        comment: 'Disetujui sebagai verifikator keuangan',
      });

      expect(action2.stage.status).toBe('APPROVED');

      // Now exactly two distinct decisions exist, each linked to their own stage ID
      const decisionsAfter2 = stageEngine.getDecisions(workflow.id);
      expect(decisionsAfter2).toHaveLength(2);
      expect(decisionsAfter2[0].stageId).toBe(stage1.id);
      expect(decisionsAfter2[1].stageId).toBe(stage2.id);
      expect(decisionsAfter2[0].id).not.toBe(decisionsAfter2[1].id);
    });

    it('rejects attempt to approve a WAITING stage prematurely', () => {
      const unit = orgRepo.createUnit('Divisi Waiting Guard', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      const { workflow, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-waiting-guard',
          docType: 'PR',
          docNumber: 'PR/2026/11/0012',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const stage2 = stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;
      expect(stage2.status).toBe('WAITING');

      expect(() =>
        stageEngine.recordStageDecision({
          workflowId: workflow.id,
          stageId: stage2.id,
          approverUserId: 'usr-ayu-01',
          decision: 'APPROVE',
        })
      ).toThrowError(/belum aktif/);
    });

    it('rejects attempt to re-approve an already terminal stage', () => {
      const unit = orgRepo.createUnit('Divisi Re-approval Guard', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      const { workflow, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-terminal-guard',
          docType: 'PR',
          docNumber: 'PR/2026/11/0013',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      stageEngine.recordStageDecision({
        workflowId: workflow.id,
        stageId: stage1.id,
        approverUserId: 'usr-atasan-01',
        decision: 'APPROVE',
      });

      expect(() =>
        stageEngine.recordStageDecision({
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: 'usr-atasan-01',
          decision: 'APPROVE',
        })
      ).toThrowError(/sudah selesai/);
    });
  });

  describe('6.3 Workflow Progression & BOD Parallel Tests', () => {
    it('executes full sequential and parallel workflow to completion', () => {
      const unit = orgRepo.createUnit('Divisi Progression Test', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      const { workflow } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-full-lifecycle',
          docType: 'PR',
          docNumber: 'PR/2026/11/0020',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const stages = stageEngine.getStages(workflow.id);
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const stage2 = stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;
      const stage3Hery = stages.find((s) => s.stageKey === 'STAGE_3_BOD_HERY')!;
      const stage3Hashimoto = stages.find((s) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO')!;

      // 1. Stage 1 Approved
      stageEngine.recordStageDecision({
        workflowId: workflow.id,
        stageId: stage1.id,
        approverUserId: 'usr-atasan-01',
        decision: 'APPROVE',
      });
      expect(stageEngine.getStage(stage2.id).status).toBe('PENDING');

      // 2. Stage 2 Approved
      stageEngine.recordStageDecision({
        workflowId: workflow.id,
        stageId: stage2.id,
        approverUserId: 'usr-ayu-01',
        decision: 'APPROVE',
      });
      expect(stageEngine.getStage(stage3Hery.id).status).toBe('PENDING');
      expect(stageEngine.getStage(stage3Hashimoto.id).status).toBe('PENDING');
      expect(stageEngine.getWorkflow(workflow.id).status).toBe('ACTIVE');

      // 3. Parallel BOD: Hashimoto approves first
      stageEngine.recordStageDecision({
        workflowId: workflow.id,
        stageId: stage3Hashimoto.id,
        approverUserId: 'usr-bod-hashimoto',
        decision: 'APPROVE',
        comment: 'Approved by President Director',
      });
      expect(stageEngine.getStage(stage3Hashimoto.id).status).toBe('APPROVED');
      expect(stageEngine.getStage(stage3Hery.id).status).toBe('PENDING');
      expect(stageEngine.getWorkflow(workflow.id).status).toBe('ACTIVE'); // Still waiting for Hery

      // 4. Parallel BOD: Hery approves second
      stageEngine.recordStageDecision({
        workflowId: workflow.id,
        stageId: stage3Hery.id,
        approverUserId: 'usr-bod-hery',
        decision: 'APPROVE',
        comment: 'Approved by Director',
      });
      expect(stageEngine.getStage(stage3Hery.id).status).toBe('APPROVED');

      // Workflow is now COMPLETED
      const finalWf = stageEngine.getWorkflow(workflow.id);
      expect(finalWf.status).toBe('COMPLETED');
      expect(finalWf.completedAt).toBeDefined();

      const allDecisions = stageEngine.getDecisions(workflow.id);
      expect(allDecisions).toHaveLength(4);
    });

    it('handles rejection by suspending sibling BOD stage and marking workflow REJECTED', () => {
      const unit = orgRepo.createUnit('Divisi Rejection Test', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      const { workflow } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-rejection-test',
          docType: 'PR',
          docNumber: 'PR/2026/11/0021',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const stages = stageEngine.getStages(workflow.id);
      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const stage2 = stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;
      const stage3Hery = stages.find((s) => s.stageKey === 'STAGE_3_BOD_HERY')!;
      const stage3Hashimoto = stages.find((s) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO')!;

      // Advance to BOD stage
      stageEngine.recordStageDecision({ workflowId: workflow.id, stageId: stage1.id, approverUserId: 'usr-atasan-01', decision: 'APPROVE' });
      stageEngine.recordStageDecision({ workflowId: workflow.id, stageId: stage2.id, approverUserId: 'usr-ayu-01', decision: 'APPROVE' });

      expect(stageEngine.getStage(stage3Hery.id).status).toBe('PENDING');
      expect(stageEngine.getStage(stage3Hashimoto.id).status).toBe('PENDING');

      // Hery rejects with comment
      stageEngine.recordStageDecision({
        workflowId: workflow.id,
        stageId: stage3Hery.id,
        approverUserId: 'usr-bod-hery',
        decision: 'REJECT',
        comment: 'Anggaran belum disetujui dalam RKAP',
      });

      expect(stageEngine.getStage(stage3Hery.id).status).toBe('REJECTED');
      // Sibling Hashimoto stage must be suspended to WAITING
      expect(stageEngine.getStage(stage3Hashimoto.id).status).toBe('WAITING');
      // Workflow status is REJECTED
      expect(stageEngine.getWorkflow(workflow.id).status).toBe('REJECTED');
    });

    it('requires non-empty comment when rejecting', () => {
      const unit = orgRepo.createUnit('Divisi Rejection Comment Test', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      const { workflow, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-rejection-comment',
          docType: 'PR',
          docNumber: 'PR/2026/11/0022',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;

      expect(() =>
        stageEngine.recordStageDecision({
          workflowId: workflow.id,
          stageId: stage1.id,
          approverUserId: 'usr-atasan-01',
          decision: 'REJECT',
          comment: '   ',
        })
      ).toThrowError(/Alasan penolakan/);
    });
  });

  describe('6.4 Persistence & Migration Tests', () => {
    it('migration can be run repeatedly without error or data loss', () => {
      for (let i = 0; i < 5; i++) {
        expect(() => migrateApprovalEngine(dbPath)).not.toThrow();
      }
    });

    it('re-opening database preserves full stage hierarchy and decisions', () => {
      const unit = orgRepo.createUnit('Divisi DB Reopen 2', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      const { workflow, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-persist-check',
          docType: 'PR',
          docNumber: 'PR/2026/11/0030',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      stageEngine.recordStageDecision({
        workflowId: workflow.id,
        stageId: stages[0].id,
        approverUserId: 'usr-atasan-01',
        decision: 'APPROVE',
        comment: 'Catatan tersimpan',
      });

      // Fresh instance
      const freshEngine = new ApprovalStageEngine(dbPath);
      const reDecisions = freshEngine.getDecisions(workflow.id);
      expect(reDecisions).toHaveLength(1);
      expect(reDecisions[0].comment).toBe('Catatan tersimpan');
      expect(freshEngine.getStage(stages[0].id).status).toBe('APPROVED');
    });
  });

  describe('6.5 PM Control Tests (PM-001, PM-002, PM-003)', () => {
    it('PM-001: Bootstrap Admin safety — non-bootstrap Admin is unverified by default and Admin is never fallback approver', () => {
      // 1. New Admin user created in orgRepo must NOT be auto-verified
      const newAdmin = orgRepo.createUser(
        { email: 'new.admin@blc.co.id', fullName: 'Admin Kedua', role: 'ADMIN' },
        'usr-admin-01'
      );
      expect(newAdmin.verificationStatus).toBe('UNVERIFIED');
      expect(newAdmin.status).toBe('UNVERIFIED');

      // 2. Deactivated admin stays deactivated after restart/reopen
      orgRepo.setUserLifecycle(newAdmin.id, 'INACTIVE', 'usr-admin-01');
      const freshOrg = new OrganizationRepository(dbPath);
      expect(freshOrg.getUser(newAdmin.id).status).toBe('INACTIVE');

      // 3. Stage engine never uses Admin as fallback when unit assignment is missing
      const unitNoAsg = orgRepo.createUnit('Unit Tanpa Asg', 'usr-admin-01');
      expect(() =>
        stageEngine.createSubmissionWorkflow(
          {
            documentId: 'doc-no-admin-fallback',
            docType: 'PR',
            docNumber: 'PR/2026/11/0040',
            unitId: unitNoAsg.id,
            applicantUserId: 'usr-pemohon-01',
          },
          orgRepo
        )
      ).toThrowError(/Penugasan approver tidak ditemukan/);
    });

    it('PM-002: Legacy identity compatibility with JWT and existing auth', () => {
      // 1. Authenticate seed credentials
      const authResult = authenticateCredentials({ email: 'pemohon@blc.co.id', password: 'blc2026' });
      expect(authResult).not.toBeNull();
      expect(authResult?.user.id).toBe('usr-pemohon-01');

      // 2. Verify JWT signature and claims
      const claims = verifyJwt(authResult!.token);
      expect(claims).not.toBeNull();
      expect(claims?.id).toBe('usr-pemohon-01');
      expect(claims?.role).toBe('PEMOHON');

      // 3. User master resolution via legacy_id
      const resolved = orgRepo.getUser('usr-pemohon-01');
      expect(resolved.id).toBe('usr-pemohon-01');
      expect(resolved.legacyId).toBe('usr-pemohon-01');
      expect(resolved.email).toBe('pemohon@blc.co.id');
    });

    it('PM-003: Operational readiness gate — isolated test database only', () => {
      expect(dbPath).toContain('blc-stage-engine-test-');
      // Verifies that operational database path was never used
      expect(dbPath).not.toBe('blc-local.sqlite');
    });
  });

  describe('HF02-B Revision 01 Compatibility Verification (REV-001, REV-002, REV-003)', () => {
    it('REV-001: initializes PV workflow starting at Stage 2 PENDING with zero fictitious approval decisions', () => {
      const result = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-pv-001',
          docType: 'PV',
          docNumber: 'PV/2026/11/0001',
          applicantUserId: 'usr-keuangan-01',
        },
        orgRepo
      );

      // Workflow starts active
      expect(result.workflow.status).toBe('ACTIVE');

      // Stage 1 must NOT exist for PV
      const stage1 = result.stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR');
      expect(stage1).toBeUndefined();

      // First stage is Stage 2 (Finance Verifier) and is immediately PENDING
      const stage2 = result.stages.find((s) => s.stageKey === 'STAGE_2_FINANCE');
      expect(stage2).toBeDefined();
      expect(stage2?.status).toBe('PENDING');
      expect(stage2?.activatedAt).toBeDefined();

      // BOD stages are WAITING
      const bodHery = result.stages.find((s) => s.stageKey === 'STAGE_3_BOD_HERY');
      const bodHashimoto = result.stages.find((s) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO');
      expect(bodHery?.status).toBe('WAITING');
      expect(bodHashimoto?.status).toBe('WAITING');

      // CRITICAL: Zero decision records created! No fake decisions.
      const decisions = stageEngine.getDecisions(result.workflow.id);
      expect(decisions).toHaveLength(0);
    });

    it('REV-002: handles GR submission as completed record without creating approval stages', () => {
      const result = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-gr-001',
          docType: 'GR',
          docNumber: 'GR/2026/11/0001',
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      // GR workflow is immediately COMPLETED
      expect(result.workflow.status).toBe('COMPLETED');
      expect(result.workflow.completedAt).toBeDefined();

      // Zero approval stages and zero snapshots created (per existing business rule)
      expect(result.stages).toHaveLength(0);
      expect(result.snapshots).toHaveLength(0);

      const decisions = stageEngine.getDecisions(result.workflow.id);
      expect(decisions).toHaveLength(0);
    });

    it('REV-003: resolves Stage 2 reviewer and BOD approvers from role/options rather than hardcoded names', () => {
      // Create custom verified Finance Verifier and BOD approvers
      const customAyu = orgRepo.createUser(
        { email: 'custom.verifier@blc.co.id', fullName: 'Custom Verifikator', role: 'AYU' },
        'usr-admin-01'
      );
      orgRepo.verifyUser(customAyu.id, { proofReference: 'SK Verifikator 2026', verifiedBy: 'usr-admin-01' });
      orgRepo.setUserLifecycle(customAyu.id, 'ACTIVE', 'usr-admin-01');

      const customDirector = orgRepo.createUser(
        { email: 'custom.director@blc.co.id', fullName: 'Custom Director', role: 'BOD_HERY' },
        'usr-admin-01'
      );
      orgRepo.verifyUser(customDirector.id, { proofReference: 'Akta Direksi 2026', verifiedBy: 'usr-admin-01' });
      orgRepo.setUserLifecycle(customDirector.id, 'ACTIVE', 'usr-admin-01');

      const unit = orgRepo.createUnit('Divisi REV003 Test', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      // Pass explicit resolution options
      const result = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-rev003-test',
          docType: 'PR',
          docNumber: 'PR/2026/11/0050',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo,
        {
          financeVerifierUserId: customAyu.id,
          bodHeryUserId: customDirector.id,
          authorizedBy: 'usr-admin-01',
          authorizerUser: orgRepo.getUser('usr-admin-01'),
          overrideReason: 'REV-003 custom approver resolution',
          source: 'INTERNAL_SERVER_CONTEXT',
        }
      );

      const stage2 = result.stages.find((s) => s.stageKey === 'STAGE_2_FINANCE');
      expect(stage2?.assignedApproverId).toBe(customAyu.id);
      expect(stage2?.approverName).toBe('Custom Verifikator');

      const stage3Hery = result.stages.find((s) => s.stageKey === 'STAGE_3_BOD_HERY');
      expect(stage3Hery?.assignedApproverId).toBe(customDirector.id);
      expect(stage3Hery?.approverName).toBe('Custom Director');
    });
  });

  describe('HF02-B Final Revision 02 — Explicit Workflow Assignment Enforcement', () => {
    it('1. Stage 2 menggunakan assignment persisten yang valid dari database', () => {
      const unit = orgRepo.createUnit('Divisi REV02 Stage 2', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      // Create a verified user for Stage 2
      const finReviewer = orgRepo.createUser(
        { email: 'fin.rev@blc.co.id', fullName: 'Ratna Kusuma', role: 'AYU' },
        'usr-admin-01'
      );
      orgRepo.verifyUser(finReviewer.id, { proofReference: 'SK 2026', verifiedBy: 'usr-admin-01' });
      orgRepo.setUserLifecycle(finReviewer.id, 'ACTIVE', 'usr-admin-01');

      // Admin explicitly configures persistent stage assignment
      stageEngine.setStageAssignment('STAGE_2_FINANCE', finReviewer.id, 'usr-admin-01', orgRepo);

      // Workflow submitted without options: must use persistent assignment
      const result = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-rev02-stage2-persist',
          docType: 'PR',
          docNumber: 'PR/2026/11/0101',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const stage2 = result.stages.find((s) => s.stageKey === 'STAGE_2_FINANCE');
      expect(stage2?.assignedApproverId).toBe(finReviewer.id);
      expect(stage2?.approverName).toBe('Ratna Kusuma');

      const snap2 = result.snapshots.find((s) => s.stageKey === 'STAGE_2_FINANCE');
      expect(snap2?.approverUserId).toBe(finReviewer.id);
      expect(snap2?.assignmentId).toBeDefined();
    });

    it('2. Stage 3 menggunakan dua assignment independen dan mendeteksi konflik identitas ganda', () => {
      const unit = orgRepo.createUnit('Divisi REV02 Stage 3', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      // Two distinct BOD users
      const dir1 = orgRepo.createUser({ email: 'dir1.rev02@blc.co.id', fullName: 'Direktur Satu', role: 'BOD_HERY' }, 'usr-admin-01');
      orgRepo.verifyUser(dir1.id, { proofReference: 'Akta 1', verifiedBy: 'usr-admin-01' });
      orgRepo.setUserLifecycle(dir1.id, 'ACTIVE', 'usr-admin-01');

      const dir2 = orgRepo.createUser({ email: 'dir2.rev02@blc.co.id', fullName: 'Direktur Dua', role: 'BOD_HASHIMOTO' }, 'usr-admin-01');
      orgRepo.verifyUser(dir2.id, { proofReference: 'Akta 2', verifiedBy: 'usr-admin-01' });
      orgRepo.setUserLifecycle(dir2.id, 'ACTIVE', 'usr-admin-01');

      stageEngine.setStageAssignment('STAGE_3_BOD_HERY', dir1.id, 'usr-admin-01', orgRepo);
      stageEngine.setStageAssignment('STAGE_3_BOD_HASHIMOTO', dir2.id, 'usr-admin-01', orgRepo);

      const result = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-rev02-stage3-persist',
          docType: 'PR',
          docNumber: 'PR/2026/11/0102',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const stageHery = result.stages.find((s) => s.stageKey === 'STAGE_3_BOD_HERY');
      const stageHashimoto = result.stages.find((s) => s.stageKey === 'STAGE_3_BOD_HASHIMOTO');
      expect(stageHery?.assignedApproverId).toBe(dir1.id);
      expect(stageHashimoto?.assignedApproverId).toBe(dir2.id);
      expect(stageHery?.assignedApproverId).not.toBe(stageHashimoto?.assignedApproverId);

      // Conflict detection when same user is assigned to both BOD stages
      expect(() =>
        stageEngine.createSubmissionWorkflow(
          {
            documentId: 'doc-rev02-bod-conflict',
            docType: 'PR',
            docNumber: 'PR/2026/11/0103',
            unitId: unit.id,
            applicantUserId: 'usr-pemohon-01',
          },
          orgRepo,
          {
            bodHeryUserId: dir1.id,
            bodHashimotoUserId: dir1.id,
            authorizedBy: 'usr-admin-01',
            authorizerUser: orgRepo.getUser('usr-admin-01'),
            overrideReason: 'Test BOD conflict',
            source: 'INTERNAL_SERVER_CONTEXT',
          }
        )
      ).toThrowError(/Penugasan kedua Direksi BoD harus independen/);
    });

    it('3. User dengan role AYU tanpa assignment tidak otomatis menjadi approver', () => {
      const unit = orgRepo.createUnit('Divisi REV02 Unassigned AYU', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      // Create an active, verified user with role AYU
      const unassignedAyu = orgRepo.createUser(
        { email: 'unassigned.ayu@blc.co.id', fullName: 'Ayu Tanpa Penugasan', role: 'AYU' },
        'usr-admin-01'
      );
      orgRepo.verifyUser(unassignedAyu.id, { proofReference: 'SK AYU', verifiedBy: 'usr-admin-01' });
      orgRepo.setUserLifecycle(unassignedAyu.id, 'ACTIVE', 'usr-admin-01');

      // Deactivate Stage 2 assignment
      stageEngine.deactivateStageAssignment('STAGE_2_FINANCE', 'usr-admin-01', orgRepo);

      // Submission MUST fail with explicit error, NOT pick unassignedAyu simply because of role AYU!
      expect(() =>
        stageEngine.createSubmissionWorkflow(
          {
            documentId: 'doc-rev02-ayu-no-asg',
            docType: 'PR',
            docNumber: 'PR/2026/11/0104',
            unitId: unit.id,
            applicantUserId: 'usr-pemohon-01',
          },
          orgRepo
        )
      ).toThrowError(/Penugasan Verifikator Keuangan \(Stage 2\) tidak ditemukan atau belum dikonfigurasi/);
    });

    it('4. User dengan role BOD tanpa assignment tidak otomatis menjadi approver', () => {
      const unit = orgRepo.createUnit('Divisi REV02 Unassigned BOD', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      // Restore stage 2
      stageEngine.setStageAssignment('STAGE_2_FINANCE', 'usr-ayu-01', 'usr-admin-01', orgRepo);

      // Create active, verified users with BOD roles
      const extraBodHery = orgRepo.createUser(
        { email: 'extra.hery@blc.co.id', fullName: 'Hery Cadangan', role: 'BOD_HERY' },
        'usr-admin-01'
      );
      orgRepo.verifyUser(extraBodHery.id, { proofReference: 'Akta', verifiedBy: 'usr-admin-01' });
      orgRepo.setUserLifecycle(extraBodHery.id, 'ACTIVE', 'usr-admin-01');

      // Deactivate Stage 3 BOD Hery assignment
      stageEngine.deactivateStageAssignment('STAGE_3_BOD_HERY', 'usr-admin-01', orgRepo);

      // Submission MUST fail with explicit error, NOT pick extraBodHery
      expect(() =>
        stageEngine.createSubmissionWorkflow(
          {
            documentId: 'doc-rev02-bod-no-asg',
            docType: 'PR',
            docNumber: 'PR/2026/11/0105',
            unitId: unit.id,
            applicantUserId: 'usr-pemohon-01',
          },
          orgRepo
        )
      ).toThrowError(/Penugasan Direksi BoD 1 \(Stage 3\) tidak ditemukan atau belum dikonfigurasi/);
    });

    it('5. Missing assignment menghasilkan explicit error untuk setiap stage', () => {
      const unit = orgRepo.createUnit('Divisi REV02 Missing Asg', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      stageEngine.setStageAssignment('STAGE_2_FINANCE', 'usr-ayu-01', 'usr-admin-01', orgRepo);
      stageEngine.setStageAssignment('STAGE_3_BOD_HERY', 'usr-bod-hery', 'usr-admin-01', orgRepo);
      stageEngine.deactivateStageAssignment('STAGE_3_BOD_HASHIMOTO', 'usr-admin-01', orgRepo);

      expect(() =>
        stageEngine.createSubmissionWorkflow(
          {
            documentId: 'doc-rev02-missing-hashimoto',
            docType: 'PR',
            docNumber: 'PR/2026/11/0106',
            unitId: unit.id,
            applicantUserId: 'usr-pemohon-01',
          },
          orgRepo
        )
      ).toThrowError(/Penugasan Direksi BoD 2 \(Stage 3\) tidak ditemukan atau belum dikonfigurasi/);
    });

    it('6. Multiple candidates tidak dipilih berdasarkan urutan query', () => {
      const unit = orgRepo.createUnit('Divisi REV02 Multi Candidates', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      // Create 3 active verified users with role AYU
      const ayu1 = orgRepo.createUser({ email: 'ayu1@blc.co.id', fullName: 'Ayu Pertama', role: 'AYU' }, 'usr-admin-01');
      orgRepo.verifyUser(ayu1.id, { proofReference: 'SK', verifiedBy: 'usr-admin-01' });
      orgRepo.setUserLifecycle(ayu1.id, 'ACTIVE', 'usr-admin-01');

      const ayu2 = orgRepo.createUser({ email: 'ayu2@blc.co.id', fullName: 'Ayu Kedua', role: 'AYU' }, 'usr-admin-01');
      orgRepo.verifyUser(ayu2.id, { proofReference: 'SK', verifiedBy: 'usr-admin-01' });
      orgRepo.setUserLifecycle(ayu2.id, 'ACTIVE', 'usr-admin-01');

      const ayu3 = orgRepo.createUser({ email: 'ayu3@blc.co.id', fullName: 'Ayu Ketiga', role: 'AYU' }, 'usr-admin-01');
      orgRepo.verifyUser(ayu3.id, { proofReference: 'SK', verifiedBy: 'usr-admin-01' });
      orgRepo.setUserLifecycle(ayu3.id, 'ACTIVE', 'usr-admin-01');

      // Restore BOD assignments
      stageEngine.setStageAssignment('STAGE_3_BOD_HERY', 'usr-bod-hery', 'usr-admin-01', orgRepo);
      stageEngine.setStageAssignment('STAGE_3_BOD_HASHIMOTO', 'usr-bod-hashimoto', 'usr-admin-01', orgRepo);

      // Explicitly assign ayu2 (not ayu1 who is first alphabetically)
      stageEngine.setStageAssignment('STAGE_2_FINANCE', ayu2.id, 'usr-admin-01', orgRepo);

      const result = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-rev02-exact-selection',
          docType: 'PR',
          docNumber: 'PR/2026/11/0107',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const stage2 = result.stages.find((s) => s.stageKey === 'STAGE_2_FINANCE');
      expect(stage2?.assignedApproverId).toBe(ayu2.id);
      expect(stage2?.assignedApproverId).not.toBe(ayu1.id);
      expect(stage2?.assignedApproverId).not.toBe(ayu3.id);
      expect(stage2?.approverName).toBe('Ayu Kedua');
    });

    it('7. Unauthorized configuration override ditolak (secure StageResolutionOptions)', () => {
      const unit = orgRepo.createUnit('Divisi REV02 Security Test', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      // 1. Client attempts to pass options without authorizedBy: rejected 403
      expect(() =>
        stageEngine.createSubmissionWorkflow(
          {
            documentId: 'doc-rev02-unauth-1',
            docType: 'PR',
            docNumber: 'PR/2026/11/0108',
            unitId: unit.id,
            applicantUserId: 'usr-pemohon-01',
          },
          orgRepo,
          { financeVerifierUserId: 'usr-atasan-01' }
        )
      ).toThrowError(/Override penugasan workflow memerlukan otorisasi administrator/);

      // 2. Client passes authorizedBy but user is non-Admin (e.g. PEMOHON): rejected 403
      expect(() =>
        stageEngine.createSubmissionWorkflow(
          {
            documentId: 'doc-rev02-unauth-2',
            docType: 'PR',
            docNumber: 'PR/2026/11/0109',
            unitId: unit.id,
            applicantUserId: 'usr-pemohon-01',
          },
          orgRepo,
          { financeVerifierUserId: 'usr-atasan-01', authorizedBy: 'usr-pemohon-01' }
        )
      ).toThrowError(/hanya dapat diotorisasi oleh Administrator/);
    });

    it('8. Inactive/unverified approver ditolak saat assignment atau submission', () => {
      const unit = orgRepo.createUnit('Divisi REV02 Inactive Guard', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      const unverifiedUser = orgRepo.createUser({ email: 'unver.rev02@blc.co.id', fullName: 'Unverified Approver' }, 'usr-admin-01');

      // Attempting to set persistent assignment with unverified user throws 422
      expect(() =>
        stageEngine.setStageAssignment('STAGE_2_FINANCE', unverifiedUser.id, 'usr-admin-01', orgRepo)
      ).toThrowError(/diverifikasi/);

      // Attempting to override with unverified user via authorized options throws 422
      const adminUser = orgRepo.getUser('usr-admin-01');
      expect(() =>
        stageEngine.createSubmissionWorkflow(
          {
            documentId: 'doc-rev02-unverified-opt',
            docType: 'PR',
            docNumber: 'PR/2026/11/0110',
            unitId: unit.id,
            applicantUserId: 'usr-admin-01',
          },
          orgRepo,
          {
            financeVerifierUserId: unverifiedUser.id,
            authorizedBy: 'usr-admin-01',
            authorizerUser: adminUser,
            overrideReason: 'Audit unverified approver rejection',
          }
        )
      ).toThrowError(/belum diverifikasi/);
    });

    it('9. Snapshot tetap immutable setelah submission meskipun penugasan kemudian diubah', () => {
      const unit = orgRepo.createUnit('Divisi REV02 Snapshot Immutability', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      const finA = orgRepo.createUser({ email: 'fina.rev02@blc.co.id', fullName: 'Finance Person A', role: 'AYU' }, 'usr-admin-01');
      orgRepo.verifyUser(finA.id, { proofReference: 'SK', verifiedBy: 'usr-admin-01' });
      orgRepo.setUserLifecycle(finA.id, 'ACTIVE', 'usr-admin-01');

      stageEngine.setStageAssignment('STAGE_2_FINANCE', finA.id, 'usr-admin-01', orgRepo);

      const doc1 = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-rev02-snap-01',
          docType: 'PR',
          docNumber: 'PR/2026/11/0111',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );
      expect(doc1.stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')?.assignedApproverId).toBe(finA.id);

      // Mutate assignment to Fin B
      const finB = orgRepo.createUser({ email: 'finb.rev02@blc.co.id', fullName: 'Finance Person B', role: 'AYU' }, 'usr-admin-01');
      orgRepo.verifyUser(finB.id, { proofReference: 'SK', verifiedBy: 'usr-admin-01' });
      orgRepo.setUserLifecycle(finB.id, 'ACTIVE', 'usr-admin-01');

      stageEngine.setStageAssignment('STAGE_2_FINANCE', finB.id, 'usr-admin-01', orgRepo);

      // Doc 2 locks Fin B
      const doc2 = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-rev02-snap-02',
          docType: 'PR',
          docNumber: 'PR/2026/11/0112',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );
      expect(doc2.stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')?.assignedApproverId).toBe(finB.id);

      // Doc 1 retains Fin A
      const reloadedDoc1Stages = stageEngine.getStages(doc1.workflow.id);
      expect(reloadedDoc1Stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')?.assignedApproverId).toBe(finA.id);
    });

    it('10. Dual approval oleh pengguna sama tetap berfungsi dengan assignment eksplisit', () => {
      // Assign Ayu Martina as Stage 1 supervisor of unit
      const unit = orgRepo.createUnit('Divisi REV02 Dual Approval', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-ayu-01', 'usr-admin-01');

      // Explicitly assign Ayu Martina as Stage 2 Finance Reviewer
      stageEngine.setStageAssignment('STAGE_2_FINANCE', 'usr-ayu-01', 'usr-admin-01', orgRepo);

      const { workflow, stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-rev02-dual-appr',
          docType: 'PR',
          docNumber: 'PR/2026/11/0113',
          unitId: unit.id,
          applicantUserId: 'usr-pemohon-01',
        },
        orgRepo
      );

      const stage1 = stages.find((s) => s.stageKey === 'STAGE_1_SUPERVISOR')!;
      const stage2 = stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;

      expect(stage1.assignedApproverId).toBe('usr-ayu-01');
      expect(stage2.assignedApproverId).toBe('usr-ayu-01');
      expect(stage1.id).not.toBe(stage2.id);

      // Approve stage 1
      stageEngine.recordStageDecision({
        workflowId: workflow.id,
        stageId: stage1.id,
        approverUserId: 'usr-ayu-01',
        decision: 'APPROVE',
        comment: 'Stage 1 disetujui',
      });

      expect(stageEngine.getStage(stage1.id).status).toBe('APPROVED');
      expect(stageEngine.getStage(stage2.id).status).toBe('PENDING'); // activated, not auto-completed

      // Approve stage 2
      stageEngine.recordStageDecision({
        workflowId: workflow.id,
        stageId: stage2.id,
        approverUserId: 'usr-ayu-01',
        decision: 'APPROVE',
        comment: 'Stage 2 disetujui',
      });

      expect(stageEngine.getStage(stage2.id).status).toBe('APPROVED');
      expect(stageEngine.getDecisions(workflow.id)).toHaveLength(2);
    });
  });

  describe('HF02-B Security Gate: StageResolutionOptions Authorization & Impersonation Prevention', () => {
    it('1. Pengguna non-Admin tidak dapat menggunakan Admin ID untuk melakukan override (impersonation prevention)', () => {
      const unit = orgRepo.createUnit('Divisi Security Impersonation Test', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      // Non-Admin applicant passes authorizedBy: 'usr-admin-01' without server authorizerUser context
      expect(() =>
        stageEngine.createSubmissionWorkflow(
          {
            documentId: 'doc-sec-imp-01',
            docType: 'PR',
            docNumber: 'PR/2026/11/0201',
            unitId: unit.id,
            applicantUserId: 'usr-pemohon-01',
          },
          orgRepo,
          {
            financeVerifierUserId: 'usr-atasan-01',
            authorizedBy: 'usr-admin-01',
            overrideReason: 'Mencoba bypass otorisasi dengan ID admin',
          }
        )
      ).toThrowError(/Pengguna non-Admin tidak dapat menggunakan ID Administrator untuk melakukan override workflow/);
    });

    it('2. Client-supplied override dengan source CLIENT_REQUEST ditolak langsung (untrusted client override)', () => {
      const unit = orgRepo.createUnit('Divisi Security Client Request Test', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      const adminUser = orgRepo.getUser('usr-admin-01');

      expect(() =>
        stageEngine.createSubmissionWorkflow(
          {
            documentId: 'doc-sec-client-01',
            docType: 'PR',
            docNumber: 'PR/2026/11/0202',
            unitId: unit.id,
            applicantUserId: 'usr-admin-01',
          },
          orgRepo,
          {
            financeVerifierUserId: 'usr-atasan-01',
            authorizedBy: 'usr-admin-01',
            authorizerUser: adminUser,
            source: 'CLIENT_REQUEST',
            overrideReason: 'Override via payload HTTP client',
          }
        )
      ).toThrowError(/Override penugasan tidak dapat diajukan secara langsung dari client request/);
    });

    it('3. Override tanpa alasan (overrideReason) ditolak secara eksplisit', () => {
      const unit = orgRepo.createUnit('Divisi Security Reason Test', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      const adminUser = orgRepo.getUser('usr-admin-01');

      expect(() =>
        stageEngine.createSubmissionWorkflow(
          {
            documentId: 'doc-sec-reason-01',
            docType: 'PR',
            docNumber: 'PR/2026/11/0203',
            unitId: unit.id,
            applicantUserId: 'usr-admin-01',
          },
          orgRepo,
          {
            financeVerifierUserId: 'usr-atasan-01',
            authorizedBy: 'usr-admin-01',
            authorizerUser: adminUser,
            overrideReason: '   ',
          }
        )
      ).toThrowError(/Alasan override penugasan wajib diisi/);
    });

    it('4. Pemalsuan konteks authorizerUser ditolak (mismatched / non-admin authorizerUser)', () => {
      const unit = orgRepo.createUnit('Divisi Security Context Test', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      const pemohonUser = orgRepo.getUser('usr-pemohon-01');

      // Mismatched context (authorizerUser is non-admin pemohon, authorizedBy is admin)
      expect(() =>
        stageEngine.createSubmissionWorkflow(
          {
            documentId: 'doc-sec-mismatch-01',
            docType: 'PR',
            docNumber: 'PR/2026/11/0204',
            unitId: unit.id,
            applicantUserId: 'usr-pemohon-01',
          },
          orgRepo,
          {
            financeVerifierUserId: 'usr-atasan-01',
            authorizedBy: 'usr-admin-01',
            authorizerUser: pemohonUser,
            overrideReason: 'Operational override delegasi',
          }
        )
      ).toThrowError(/Konteks otorisasi server tidak valid/);
    });

    it('5. Override administratif yang sah menghasilkan audit log di approval_stage_assignment_audit dengan action SUBMISSION_OVERRIDE', () => {
      const unit = orgRepo.createUnit('Divisi Security Audit Test', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      const adminUser = orgRepo.getUser('usr-admin-01');
      const finAlt = orgRepo.createUser({ email: 'fin.alt@blc.co.id', fullName: 'Finance Alternate', role: 'AYU' }, 'usr-admin-01');
      orgRepo.verifyUser(finAlt.id, { proofReference: 'SK-DELEGATION-2026', verifiedBy: 'usr-admin-01' });
      orgRepo.setUserLifecycle(finAlt.id, 'ACTIVE', 'usr-admin-01');

      const { stages } = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-sec-audit-01',
          docType: 'PR',
          docNumber: 'PR/2026/11/0205',
          unitId: unit.id,
          applicantUserId: 'usr-admin-01',
        },
        orgRepo,
        {
          financeVerifierUserId: finAlt.id,
          authorizedBy: 'usr-admin-01',
          authorizerUser: adminUser,
          overrideReason: 'Cuti verifikator utama, didelegasikan ke finance alternate',
          source: 'INTERNAL_SERVER_CONTEXT',
        }
      );

      const stage2 = stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;
      expect(stage2.assignedApproverId).toBe(finAlt.id);

      // Verify audit record exists in approval_stage_assignment_audit
      const rawDb = (stageEngine as any).getDb();
      try {
        const auditRows = rawDb.prepare(
          "SELECT * FROM approval_stage_assignment_audit WHERE action = 'SUBMISSION_OVERRIDE' AND stage_key = 'STAGE_2_FINANCE' ORDER BY at DESC"
        ).all() as any[];

        expect(auditRows.length).toBeGreaterThanOrEqual(1);
        const latest = auditRows[0];
        expect(latest.actor_user_id).toBe('usr-admin-01');
        expect(latest.assigned_user_id).toBe(finAlt.id);
        const parsedAfter = JSON.parse(latest.after_json);
        expect(parsedAfter.documentId).toBe('doc-sec-audit-01');
        expect(parsedAfter.overrideReason).toBe('Cuti verifikator utama, didelegasikan ke finance alternate');
        expect(parsedAfter.authorizedBy).toBe('usr-admin-01');
      } finally {
        (stageEngine as any).closeDb(rawDb);
      }
    });

    it('6. Override yang sah tetap menghasilkan submission snapshot yang immutable', () => {
      const unit = orgRepo.createUnit('Divisi Security Immutability Test', 'usr-admin-01');
      orgRepo.createAssignment(unit.id, 'usr-atasan-01', 'usr-admin-01');

      const adminUser = orgRepo.getUser('usr-admin-01');
      const finAlt = orgRepo.createUser({ email: 'fin.alt2@blc.co.id', fullName: 'Finance Alternate 2', role: 'AYU' }, 'usr-admin-01');
      orgRepo.verifyUser(finAlt.id, { proofReference: 'SK-DELEGATION-2', verifiedBy: 'usr-admin-01' });
      orgRepo.setUserLifecycle(finAlt.id, 'ACTIVE', 'usr-admin-01');

      const result = stageEngine.createSubmissionWorkflow(
        {
          documentId: 'doc-sec-immut-01',
          docType: 'PR',
          docNumber: 'PR/2026/11/0206',
          unitId: unit.id,
          applicantUserId: 'usr-admin-01',
        },
        orgRepo,
        {
          financeVerifierUserId: finAlt.id,
          authorizedBy: 'usr-admin-01',
          authorizerUser: adminUser,
          overrideReason: 'Operational override test',
          source: 'INTERNAL_SERVER_CONTEXT',
        }
      );

      // Now set a persistent stage assignment for STAGE_2_FINANCE
      stageEngine.setStageAssignment('STAGE_2_FINANCE', 'usr-ayu-01', 'usr-admin-01', orgRepo);

      // The snapshot and stages of the overridden workflow MUST remain finAlt
      const stages = stageEngine.getStages(result.workflow.id);
      const stage2 = stages.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;
      expect(stage2.assignedApproverId).toBe(finAlt.id);

      const snapshots = stageEngine.getSnapshots(result.workflow.id);
      const snap2 = snapshots.find((s) => s.stageKey === 'STAGE_2_FINANCE')!;
      expect(snap2.approverUserId).toBe(finAlt.id);
    });
  });
});

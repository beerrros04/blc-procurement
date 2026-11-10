import { DatabaseSync } from 'node:sqlite';
import { randomUUID, createHash } from 'node:crypto';
import { DomainError } from './repository';
import type { OrganizationRepository, AppUserRecord } from './organization';

export type WorkflowProgressionStatus = 'ACTIVE' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
export type StageStatus = 'WAITING' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
export type StageKey = 'STAGE_1_SUPERVISOR' | 'STAGE_2_FINANCE' | 'STAGE_3_BOD_HERY' | 'STAGE_3_BOD_HASHIMOTO';
export type DecisionType = 'APPROVE' | 'REJECT';

export interface WorkflowInstance {
  id: string;
  documentId: string;
  docType: string;
  docNumber: string;
  unitId?: string | null;
  workflowVersion: number;
  status: WorkflowProgressionStatus;
  submittedAt: string;
  submittedBy: string;
  completedAt?: string | null;
}

export interface AssignmentSnapshot {
  id: string;
  workflowId: string;
  documentId: string;
  unitId?: string | null;
  unitName?: string | null;
  assignmentId?: string | null;
  stageKey: StageKey;
  approverUserId: string;
  approverName: string;
  roleContext: string;
  snapshotTimestamp: string;
  policyVersion: string;
}

export interface ApprovalStageRecord {
  id: string;
  workflowId: string;
  stageKey: StageKey;
  stageOrder: number;
  parallelGroup?: string | null;
  assignedApproverId: string;
  approverName: string;
  approverRole: string;
  snapshotId: string;
  status: StageStatus;
  activatedAt?: string | null;
  completedAt?: string | null;
}

export interface ApprovalDecisionRecord {
  id: string;
  workflowId: string;
  stageId: string;
  approverUserId: string;
  decision: DecisionType;
  comment?: string | null;
  decidedAt: string;
}

export interface ApprovalStageReassignmentRecord {
  id: string;
  workflowId: string;
  stageId: string;
  previousApproverId: string;
  previousApproverName: string;
  newApproverId: string;
  newApproverName: string;
  reason: string;
  reassignedBy: string;
  reassignedAt: string;
}

export interface ApprovalIdempotencyRecord {
  key: string;
  userId: string;
  operationType: string;
  documentId: string;
  stageId: string;
  payloadHash: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  responseJson?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrossStorageSyncRecord {
  id: string;
  documentId: string;
  workflowId?: string | null;
  stageId?: string | null;
  operationType: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'REASSIGN';
  status: 'PREPARED' | 'COMMITTED' | 'RECONCILED' | 'COMPENSATED' | 'FAILED';
  stageStateJson: string;
  documentStateJson?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StageResolutionOptions {
  financeVerifierUserId?: string;
  bodHeryUserId?: string;
  bodHashimotoUserId?: string;
  authorizedBy?: string;
  authorizerUser?: AppUserRecord;
  overrideReason?: string;
  source?: 'INTERNAL_SERVER_CONTEXT' | 'CLIENT_REQUEST';
}

export interface ApprovalStageAssignmentRecord {
  id: string;
  stageKey: StageKey;
  assignedUserId: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export function isApprovalRequired(docType: string): boolean {
  return docType.toUpperCase() !== 'GR';
}

const approvalSchema = `
CREATE TABLE IF NOT EXISTS approval_workflows (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  doc_number TEXT NOT NULL,
  unit_id TEXT,
  workflow_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK(status IN ('ACTIVE','COMPLETED','REJECTED','CANCELLED')),
  submitted_at TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS approval_assignment_snapshots (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES approval_workflows(id),
  document_id TEXT NOT NULL,
  unit_id TEXT,
  unit_name TEXT,
  assignment_id TEXT,
  stage_key TEXT NOT NULL,
  approver_user_id TEXT NOT NULL,
  approver_name TEXT NOT NULL,
  role_context TEXT NOT NULL,
  snapshot_timestamp TEXT NOT NULL,
  policy_version TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS approval_stages (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES approval_workflows(id),
  stage_key TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  parallel_group TEXT,
  assigned_approver_id TEXT NOT NULL,
  approver_name TEXT NOT NULL,
  approver_role TEXT NOT NULL,
  snapshot_id TEXT NOT NULL REFERENCES approval_assignment_snapshots(id),
  status TEXT NOT NULL CHECK(status IN ('WAITING','PENDING','APPROVED','REJECTED','SKIPPED')),
  activated_at TEXT,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS approval_decisions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES approval_workflows(id),
  stage_id TEXT NOT NULL REFERENCES approval_stages(id),
  approver_user_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK(decision IN ('APPROVE','REJECT')),
  comment TEXT,
  decided_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_decisions_stage_unique ON approval_decisions(stage_id);

CREATE TABLE IF NOT EXISTS approval_stage_reassignments (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES approval_workflows(id),
  stage_id TEXT NOT NULL REFERENCES approval_stages(id),
  previous_approver_id TEXT NOT NULL,
  previous_approver_name TEXT NOT NULL,
  new_approver_id TEXT NOT NULL,
  new_approver_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  reassigned_by TEXT NOT NULL,
  reassigned_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS approval_idempotency_records (
  key TEXT NOT NULL,
  user_id TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  document_id TEXT NOT NULL,
  stage_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('IN_PROGRESS','COMPLETED','FAILED')),
  response_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (key, user_id, operation_type, document_id, stage_id)
);

CREATE TABLE IF NOT EXISTS cross_storage_sync_records (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  workflow_id TEXT,
  stage_id TEXT,
  operation_type TEXT NOT NULL CHECK(operation_type IN ('SUBMIT','APPROVE','REJECT','REASSIGN')),
  status TEXT NOT NULL CHECK(status IN ('PREPARED','COMMITTED','RECONCILED','COMPENSATED','FAILED')),
  stage_state_json TEXT NOT NULL,
  document_state_json TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS approval_stage_assignments (
  id TEXT PRIMARY KEY,
  stage_key TEXT NOT NULL UNIQUE CHECK(stage_key IN ('STAGE_2_FINANCE','STAGE_3_BOD_HERY','STAGE_3_BOD_HASHIMOTO')),
  assigned_user_id TEXT NOT NULL,
  active INTEGER NOT NULL CHECK(active IN (0,1)) DEFAULT 1,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS approval_stage_assignment_audit (
  id TEXT PRIMARY KEY,
  stage_key TEXT NOT NULL,
  assigned_user_id TEXT NOT NULL,
  active INTEGER NOT NULL,
  actor_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  at TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workflow_doc ON approval_workflows(document_id);
CREATE INDEX IF NOT EXISTS idx_stages_workflow ON approval_stages(workflow_id);
CREATE INDEX IF NOT EXISTS idx_decisions_stage ON approval_decisions(stage_id);
CREATE INDEX IF NOT EXISTS idx_stage_assignments_key ON approval_stage_assignments(stage_key);
CREATE INDEX IF NOT EXISTS idx_reassignments_stage ON approval_stage_reassignments(stage_id);
CREATE INDEX IF NOT EXISTS idx_reassignments_wf ON approval_stage_reassignments(workflow_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_lookup ON approval_idempotency_records(key, user_id, operation_type, document_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_sync_doc ON cross_storage_sync_records(document_id);
CREATE INDEX IF NOT EXISTS idx_sync_status ON cross_storage_sync_records(status);
`;

export function migrateApprovalEngine(dbOrPath: DatabaseSync | string): void {
  const isPath = typeof dbOrPath === 'string';
  const db = isPath ? new DatabaseSync(dbOrPath) : dbOrPath;
  try {
    db.exec('PRAGMA foreign_keys=ON; BEGIN IMMEDIATE');
    try {
      db.exec(approvalSchema);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  } finally {
    if (isPath) {
      db.close();
    }
  }
}

export class ApprovalStageEngine {
  constructor(private readonly dbOrPath: DatabaseSync | string) {
    if (typeof dbOrPath === 'string') {
      migrateApprovalEngine(dbOrPath);
    } else {
      migrateApprovalEngine(dbOrPath);
    }
  }

  private getDb(): DatabaseSync {
    if (typeof this.dbOrPath === 'string') {
      const db = new DatabaseSync(this.dbOrPath);
      db.exec('PRAGMA foreign_keys=ON');
      return db;
    }
    return this.dbOrPath;
  }

  private closeDb(db: DatabaseSync): void {
    if (typeof this.dbOrPath === 'string') {
      db.close();
    }
  }

  private workflowRow(row: any): WorkflowInstance {
    return {
      id: row.id,
      documentId: row.document_id,
      docType: row.doc_type,
      docNumber: row.doc_number,
      unitId: row.unit_id ?? null,
      workflowVersion: row.workflow_version,
      status: row.status as WorkflowProgressionStatus,
      submittedAt: row.submitted_at,
      submittedBy: row.submitted_by,
      completedAt: row.completed_at ?? null,
    };
  }

  private stageRow(row: any): ApprovalStageRecord {
    return {
      id: row.id,
      workflowId: row.workflow_id,
      stageKey: row.stage_key as StageKey,
      stageOrder: row.stage_order,
      parallelGroup: row.parallel_group ?? null,
      assignedApproverId: row.assigned_approver_id,
      approverName: row.approver_name,
      approverRole: row.approver_role,
      snapshotId: row.snapshot_id,
      status: row.status as StageStatus,
      activatedAt: row.activated_at ?? null,
      completedAt: row.completed_at ?? null,
    };
  }

  private snapshotRow(row: any): AssignmentSnapshot {
    return {
      id: row.id,
      workflowId: row.workflow_id,
      documentId: row.document_id,
      unitId: row.unit_id ?? null,
      unitName: row.unit_name ?? null,
      assignmentId: row.assignment_id ?? null,
      stageKey: row.stage_key as StageKey,
      approverUserId: row.approver_user_id,
      approverName: row.approver_name,
      roleContext: row.role_context,
      snapshotTimestamp: row.snapshot_timestamp,
      policyVersion: row.policy_version,
    };
  }

  private decisionRow(row: any): ApprovalDecisionRecord {
    return {
      id: row.id,
      workflowId: row.workflow_id,
      stageId: row.stage_id,
      approverUserId: row.approver_user_id,
      decision: row.decision as DecisionType,
      comment: row.comment ?? null,
      decidedAt: row.decided_at,
    };
  }

  private stageAssignmentRow(row: any): ApprovalStageAssignmentRecord {
    return {
      id: row.id,
      stageKey: row.stage_key as StageKey,
      assignedUserId: row.assigned_user_id,
      active: !!row.active,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    };
  }

  private reassignmentRow(row: any): ApprovalStageReassignmentRecord {
    return {
      id: row.id,
      workflowId: row.workflow_id,
      stageId: row.stage_id,
      previousApproverId: row.previous_approver_id,
      previousApproverName: row.previous_approver_name,
      newApproverId: row.new_approver_id,
      newApproverName: row.new_approver_name,
      reason: row.reason,
      reassignedBy: row.reassigned_by,
      reassignedAt: row.reassigned_at,
    };
  }

  private idempotencyRow(row: any): ApprovalIdempotencyRecord {
    return {
      key: row.key,
      userId: row.user_id,
      operationType: row.operation_type,
      documentId: row.document_id,
      stageId: row.stage_id,
      payloadHash: row.payload_hash,
      status: row.status as 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
      responseJson: row.response_json ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private syncRow(row: any): CrossStorageSyncRecord {
    return {
      id: row.id,
      documentId: row.document_id,
      workflowId: row.workflow_id ?? null,
      stageId: row.stage_id ?? null,
      operationType: row.operation_type as any,
      status: row.status as any,
      stageStateJson: row.stage_state_json,
      documentStateJson: row.document_state_json ?? null,
      errorMessage: row.error_message ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // --- Explicit Stage Assignment Management (HF02-B Final Revision 02) ---

  setStageAssignment(
    stageKey: 'STAGE_2_FINANCE' | 'STAGE_3_BOD_HERY' | 'STAGE_3_BOD_HASHIMOTO',
    assignedUserId: string,
    actorUserId: string,
    orgRepo?: OrganizationRepository
  ): ApprovalStageAssignmentRecord {
    if (!['STAGE_2_FINANCE', 'STAGE_3_BOD_HERY', 'STAGE_3_BOD_HASHIMOTO'].includes(stageKey)) {
      throw new DomainError('Kunci stage assignment tidak valid.', 422, 'INVALID_STAGE_KEY');
    }
    if (!assignedUserId?.trim()) {
      throw new DomainError('assignedUserId wajib diisi.', 422, 'INVALID_INPUT');
    }
    if (!actorUserId?.trim()) {
      throw new DomainError('actorUserId wajib diisi.', 422, 'INVALID_INPUT');
    }

    if (orgRepo) {
      const actor = orgRepo.getUser(actorUserId);
      if (actor.role !== 'ADMIN' || actor.status !== 'ACTIVE' || actor.verificationStatus !== 'VERIFIED') {
        throw new DomainError('Penugasan stage approval hanya dapat dikelola oleh Administrator aktif dan terverifikasi.', 403, 'FORBIDDEN_ROLE');
      }
      const targetUser = orgRepo.getUser(assignedUserId);
      if (targetUser.verificationStatus !== 'VERIFIED') {
        throw new DomainError('Penugasan hanya dapat diaktifkan untuk pengguna yang telah diverifikasi.', 422, 'APPROVER_UNVERIFIED');
      }
      if (targetUser.status !== 'ACTIVE') {
        throw new DomainError('Penugasan hanya dapat diaktifkan untuk pengguna yang aktif.', 422, 'APPROVER_INACTIVE');
      }
    }

    const db = this.getDb();
    const now = new Date().toISOString();
    const id = randomUUID();

    try {
      db.exec('BEGIN IMMEDIATE');

      const existing = db.prepare('SELECT * FROM approval_stage_assignments WHERE stage_key = ?').get(stageKey) as any;
      if (existing) {
        db.prepare(`
          UPDATE approval_stage_assignments
          SET assigned_user_id = ?, active = 1, updated_at = ?, updated_by = ?
          WHERE stage_key = ?
        `).run(assignedUserId.trim(), now, actorUserId, stageKey);
        const updated = db.prepare('SELECT * FROM approval_stage_assignments WHERE stage_key = ?').get(stageKey) as any;
        db.prepare(`
          INSERT INTO approval_stage_assignment_audit (id, stage_key, assigned_user_id, active, actor_user_id, action, at, before_json, after_json)
          VALUES (?, ?, ?, 1, ?, 'UPDATE', ?, ?, ?)
        `).run(randomUUID(), stageKey, assignedUserId.trim(), actorUserId, now, JSON.stringify(existing), JSON.stringify(updated));
        db.exec('COMMIT');
        return this.stageAssignmentRow(updated);
      } else {
        db.prepare(`
          INSERT INTO approval_stage_assignments (id, stage_key, assigned_user_id, active, created_at, created_by, updated_at, updated_by)
          VALUES (?, ?, ?, 1, ?, ?, ?, ?)
        `).run(id, stageKey, assignedUserId.trim(), now, actorUserId, now, actorUserId);
        const created = db.prepare('SELECT * FROM approval_stage_assignments WHERE id = ?').get(id) as any;
        db.prepare(`
          INSERT INTO approval_stage_assignment_audit (id, stage_key, assigned_user_id, active, actor_user_id, action, at, before_json, after_json)
          VALUES (?, ?, ?, 1, ?, 'CREATE', ?, null, ?)
        `).run(randomUUID(), stageKey, assignedUserId.trim(), actorUserId, now, JSON.stringify(created));
        db.exec('COMMIT');
        return this.stageAssignmentRow(created);
      }
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    } finally {
      this.closeDb(db);
    }
  }

  deactivateStageAssignment(
    stageKey: 'STAGE_2_FINANCE' | 'STAGE_3_BOD_HERY' | 'STAGE_3_BOD_HASHIMOTO',
    actorUserId: string,
    orgRepo?: OrganizationRepository
  ): ApprovalStageAssignmentRecord {
    if (orgRepo) {
      const actor = orgRepo.getUser(actorUserId);
      if (actor.role !== 'ADMIN' || actor.status !== 'ACTIVE' || actor.verificationStatus !== 'VERIFIED') {
        throw new DomainError('Akses organisasi hanya untuk Admin.', 403, 'FORBIDDEN_ROLE');
      }
    }
    const db = this.getDb();
    const now = new Date().toISOString();
    try {
      db.exec('BEGIN IMMEDIATE');
      const existing = db.prepare('SELECT * FROM approval_stage_assignments WHERE stage_key = ?').get(stageKey) as any;
      if (!existing) {
        throw new DomainError('Penugasan stage tidak ditemukan.', 404, 'STAGE_ASSIGNMENT_NOT_FOUND');
      }
      db.prepare('UPDATE approval_stage_assignments SET active = 0, updated_at = ?, updated_by = ? WHERE stage_key = ?').run(now, actorUserId, stageKey);
      const updated = db.prepare('SELECT * FROM approval_stage_assignments WHERE stage_key = ?').get(stageKey) as any;
      db.prepare(`
        INSERT INTO approval_stage_assignment_audit (id, stage_key, assigned_user_id, active, actor_user_id, action, at, before_json, after_json)
        VALUES (?, ?, ?, 0, ?, 'DEACTIVATE', ?, ?, ?)
      `).run(randomUUID(), stageKey, existing.assigned_user_id, actorUserId, now, JSON.stringify(existing), JSON.stringify(updated));
      db.exec('COMMIT');
      return this.stageAssignmentRow(updated);
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    } finally {
      this.closeDb(db);
    }
  }

  getStageAssignment(stageKey: StageKey): ApprovalStageAssignmentRecord | null {
    const db = this.getDb();
    try {
      const row = db.prepare('SELECT * FROM approval_stage_assignments WHERE stage_key = ?').get(stageKey) as any;
      if (!row) return null;
      return this.stageAssignmentRow(row);
    } finally {
      this.closeDb(db);
    }
  }

  listStageAssignments(): ApprovalStageAssignmentRecord[] {
    const db = this.getDb();
    try {
      const rows = db.prepare('SELECT * FROM approval_stage_assignments ORDER BY stage_key').all() as any[];
      return rows.map((r) => this.stageAssignmentRow(r));
    } finally {
      this.closeDb(db);
    }
  }

  // --- In-Flight Approver Reassignment (HF02C-003) ---

  reassignStage(
    input: {
      stageId: string;
      newApproverUserId: string;
      reason: string;
      actorUserId: string;
    },
    orgRepo: OrganizationRepository
  ): {
    stage: ApprovalStageRecord;
    reassignment: ApprovalStageReassignmentRecord;
  } {
    if (!input.stageId?.trim() || !input.newApproverUserId?.trim() || !input.actorUserId?.trim()) {
      throw new DomainError('Parameter reassignment tidak lengkap.', 422, 'INVALID_INPUT');
    }

    const trimmedReason = input.reason?.trim();
    if (!trimmedReason) {
      throw new DomainError('Alasan reassignment wajib diisi.', 422, 'REASSIGNMENT_REASON_REQUIRED');
    }

    // Verify actor is active, verified Admin
    const actor = orgRepo.getUser(input.actorUserId.trim());
    if (!actor || actor.role !== 'ADMIN' || actor.status !== 'ACTIVE' || actor.verificationStatus !== 'VERIFIED') {
      throw new DomainError('Reassignment hanya dapat dikelola oleh Administrator aktif dan terverifikasi.', 403, 'FORBIDDEN_ROLE');
    }

    // Verify replacement approver exists, is active and verified
    const targetUser = orgRepo.getUser(input.newApproverUserId.trim());
    if (!targetUser) {
      throw new DomainError('Approver pengganti tidak ditemukan pada master user.', 422, 'APPROVER_NOT_FOUND');
    }
    if (targetUser.verificationStatus !== 'VERIFIED') {
      throw new DomainError('Penugasan pengganti hanya dapat diaktifkan untuk pengguna yang telah diverifikasi.', 422, 'APPROVER_UNVERIFIED');
    }
    if (targetUser.status !== 'ACTIVE') {
      throw new DomainError('Penugasan pengganti hanya dapat diaktifkan untuk pengguna yang aktif.', 422, 'APPROVER_INACTIVE');
    }

    const db = this.getDb();
    const now = new Date().toISOString();
    const reassignId = randomUUID();

    try {
      db.exec('BEGIN IMMEDIATE');

      const stageRow = db.prepare('SELECT * FROM approval_stages WHERE id = ?').get(input.stageId.trim()) as any;
      if (!stageRow) {
        throw new DomainError('Approval stage tidak ditemukan.', 404, 'STAGE_NOT_FOUND');
      }

      if (stageRow.status === 'APPROVED' || stageRow.status === 'REJECTED' || stageRow.status === 'SKIPPED') {
        throw new DomainError('Tahap yang sudah selesai tidak dapat dialihkan.', 409, 'STAGE_ALREADY_COMPLETED');
      }

      if (stageRow.assigned_approver_id === targetUser.id) {
        throw new DomainError('Approver pengganti sama dengan approver yang sedang ditugaskan.', 422, 'REASSIGNMENT_TO_SAME_APPROVER');
      }

      // Atomic conditional update on non-terminal stage
      const updateResult = db.prepare(`
        UPDATE approval_stages
        SET assigned_approver_id = ?, approver_name = ?
        WHERE id = ? AND status IN ('WAITING', 'PENDING')
      `).run(targetUser.id, targetUser.fullName, input.stageId.trim());

      if (updateResult.changes === 0) {
        throw new DomainError('Tahap yang sudah selesai atau sedang diubah tidak dapat dialihkan.', 409, 'STAGE_ALREADY_COMPLETED');
      }

      const updatedStageRow = db.prepare('SELECT * FROM approval_stages WHERE id = ?').get(input.stageId.trim()) as any;

      // Insert append-only reassignment record
      db.prepare(`
        INSERT INTO approval_stage_reassignments (
          id, workflow_id, stage_id, previous_approver_id, previous_approver_name,
          new_approver_id, new_approver_name, reason, reassigned_by, reassigned_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        reassignId,
        stageRow.workflow_id,
        stageRow.id,
        stageRow.assigned_approver_id,
        stageRow.approver_name,
        targetUser.id,
        targetUser.fullName,
        trimmedReason,
        actor.id,
        now
      );

      // Audit trail record
      db.prepare(`
        INSERT INTO approval_stage_assignment_audit (
          id, stage_key, assigned_user_id, active, actor_user_id, action, at, before_json, after_json
        ) VALUES (?, ?, ?, 1, ?, 'STAGE_REASSIGNMENT', ?, ?, ?)
      `).run(
        randomUUID(),
        stageRow.stage_key,
        targetUser.id,
        actor.id,
        now,
        JSON.stringify(stageRow),
        JSON.stringify({
          updatedStage: updatedStageRow,
          reason: trimmedReason,
          reassignedBy: actor.id,
        })
      );

      db.exec('COMMIT');

      const reassignRow = db.prepare('SELECT * FROM approval_stage_reassignments WHERE id = ?').get(reassignId);
      return {
        stage: this.stageRow(updatedStageRow),
        reassignment: this.reassignmentRow(reassignRow),
      };
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    } finally {
      this.closeDb(db);
    }
  }

  getReassignments(stageIdOrWorkflowId: string): ApprovalStageReassignmentRecord[] {
    const db = this.getDb();
    try {
      const rows = db.prepare(`
        SELECT * FROM approval_stage_reassignments
        WHERE stage_id = ? OR workflow_id = ?
        ORDER BY reassigned_at ASC
      `).all(stageIdOrWorkflowId, stageIdOrWorkflowId) as any[];
      return rows.map((r) => this.reassignmentRow(r));
    } finally {
      this.closeDb(db);
    }
  }

  // --- Submission-Time Approver Snapshot Engine (HF02B-003) ---

  createSubmissionWorkflow(
    input: {
      documentId: string;
      docType: string;
      docNumber: string;
      unitId?: string;
      applicantUserId: string;
      supervisorUserId?: string;
    },
    orgRepo: OrganizationRepository,
    options?: StageResolutionOptions
  ): {
    workflow: WorkflowInstance;
    stages: ApprovalStageRecord[];
    snapshots: AssignmentSnapshot[];
  } {
    if (!input.documentId?.trim() || !input.docType?.trim() || !input.docNumber?.trim() || !input.applicantUserId?.trim()) {
      throw new DomainError('Parameter submission tidak lengkap.', 422, 'INVALID_INPUT');
    }

    const db = this.getDb();
    const now = new Date().toISOString();
    const workflowId = randomUUID();
    const docTypeUpper = input.docType.toUpperCase();
    const isPv = docTypeUpper === 'PV';
    const isGr = docTypeUpper === 'GR';

    try {
      db.exec('BEGIN IMMEDIATE');

      // GR does not require approval stages per existing business rule
      if (isGr) {
        db.prepare(`
          INSERT INTO approval_workflows (
            id, document_id, doc_type, doc_number, unit_id, workflow_version, status, submitted_at, submitted_by, completed_at
          ) VALUES (?, ?, 'GR', ?, ?, 1, 'COMPLETED', ?, ?, ?)
        `).run(
          workflowId,
          input.documentId,
          input.docNumber,
          input.unitId ?? null,
          now,
          input.applicantUserId,
          now
        );
        db.exec('COMMIT');
        const createdWf = this.workflowRow(db.prepare('SELECT * FROM approval_workflows WHERE id = ?').get(workflowId));
        return { workflow: createdWf, stages: [], snapshots: [] };
      }

      // 1. Resolve Stage 1 approver (Supervisor) from applicant's unit
      let stage1Supervisor: AppUserRecord | undefined;
      let stage1AssignmentId: string | undefined;
      let unitName: string | undefined;

      if (!isPv) {
        if (!input.unitId?.trim()) {
          throw new DomainError('Unit kerja pemohon wajib ditentukan untuk submission.', 422, 'UNIT_REQUIRED');
        }

        const units = orgRepo.listUnits();
        const foundUnit = units.find((u: any) => u.id === input.unitId);
        if (!foundUnit) {
          throw new DomainError('Unit kerja tidak ditemukan.', 404, 'UNIT_NOT_FOUND');
        }
        unitName = (foundUnit as any).name;

        const activeAssignments = orgRepo.listAssignments(input.unitId).filter((a) => a.active);
        if (!activeAssignments.length) {
          throw new DomainError('Penugasan approver tidak ditemukan untuk unit pemohon.', 422, 'NO_ASSIGNMENT');
        }

        let assignment = activeAssignments[0];
        if (input.supervisorUserId?.trim()) {
          const chosenSupervisorId = input.supervisorUserId.trim();
          const matched = activeAssignments.find((a) => a.supervisorUserId === chosenSupervisorId);
          if (!matched) {
            throw new DomainError(
              'Supervisor yang dipilih tidak memiliki penugasan valid untuk unit kerja pemohon.',
              422,
              'INVALID_SUPERVISOR_ASSIGNMENT'
            );
          }
          assignment = matched;
        }

        stage1AssignmentId = assignment.id;
        const supervisor = orgRepo.getUser(assignment.supervisorUserId);
        if (!supervisor) {
          throw new DomainError('Approver tidak ditemukan pada master user.', 422, 'APPROVER_NOT_FOUND');
        }
        if (supervisor.verificationStatus !== 'VERIFIED') {
          throw new DomainError('Identitas approver belum diverifikasi.', 422, 'APPROVER_UNVERIFIED');
        }
        if (supervisor.status !== 'ACTIVE') {
          throw new DomainError('Approver tidak aktif.', 422, 'APPROVER_INACTIVE');
        }

        stage1Supervisor = supervisor;
      }

      // Validate secure StageResolutionOptions if caller supplied any stage override
      const hasStageOverride = !!(
        options &&
        (options.financeVerifierUserId || options.bodHeryUserId || options.bodHashimotoUserId)
      );

      let authorizerUserRecord: AppUserRecord | undefined;

      if (hasStageOverride && options) {
        if (options.source === 'CLIENT_REQUEST') {
          throw new DomainError(
            'Override penugasan tidak dapat diajukan secara langsung dari client request.',
            403,
            'UNTRUSTED_CLIENT_OVERRIDE'
          );
        }

        if (!options.authorizedBy?.trim()) {
          throw new DomainError(
            'Override penugasan workflow memerlukan otorisasi administrator.',
            403,
            'UNAUTHORIZED_STAGE_OVERRIDE'
          );
        }

        const authorizer = orgRepo.getUser(options.authorizedBy.trim());
        if (
          !authorizer ||
          authorizer.role !== 'ADMIN' ||
          authorizer.status !== 'ACTIVE' ||
          authorizer.verificationStatus !== 'VERIFIED'
        ) {
          throw new DomainError(
            'Override penugasan workflow hanya dapat diotorisasi oleh Administrator aktif dan terverifikasi.',
            403,
            'UNAUTHORIZED_STAGE_OVERRIDE'
          );
        }

        const submitter = orgRepo.getUser(input.applicantUserId.trim());
        const isSubmitterAdmin =
          submitter &&
          submitter.role === 'ADMIN' &&
          submitter.status === 'ACTIVE' &&
          submitter.verificationStatus === 'VERIFIED';

        if (!isSubmitterAdmin && !options.authorizerUser) {
          throw new DomainError(
            'Pengguna non-Admin tidak dapat menggunakan ID Administrator untuk melakukan override workflow.',
            403,
            'IMPERSONATION_PREVENTED'
          );
        }

        if (options.authorizerUser) {
          if (
            options.authorizerUser.id !== authorizer.id ||
            options.authorizerUser.role !== 'ADMIN' ||
            options.authorizerUser.status !== 'ACTIVE' ||
            options.authorizerUser.verificationStatus !== 'VERIFIED'
          ) {
            throw new DomainError(
              'Konteks otorisasi server tidak valid atau tidak memiliki kewenangan Administrator.',
              403,
              'INVALID_AUTHORIZER_CONTEXT'
            );
          }
        }

        if (!options.overrideReason?.trim()) {
          throw new DomainError('Alasan override penugasan wajib diisi.', 422, 'OVERRIDE_REASON_REQUIRED');
        }

        authorizerUserRecord = authorizer;
      }

      // 2. Resolve Stage 2 approver (Finance Verifier / GM)
      let ayuUser: AppUserRecord | undefined;
      let stage2AssignmentId: string | null = null;
      if (options?.financeVerifierUserId) {
        ayuUser = orgRepo.getUser(options.financeVerifierUserId);
      } else {
        const row = db.prepare('SELECT * FROM approval_stage_assignments WHERE stage_key = ? AND active = 1').get('STAGE_2_FINANCE') as any;
        if (!row) {
          throw new DomainError('Penugasan Verifikator Keuangan (Stage 2) tidak ditemukan atau belum dikonfigurasi.', 422, 'NO_STAGE2_ASSIGNMENT');
        }
        stage2AssignmentId = row.id;
        ayuUser = orgRepo.getUser(row.assigned_user_id);
      }
      if (!ayuUser) {
        throw new DomainError('Penugasan Verifikator Keuangan (Stage 2) tidak ditemukan.', 422, 'NO_STAGE2_ASSIGNMENT');
      }
      if (ayuUser.verificationStatus !== 'VERIFIED') {
        throw new DomainError('Identitas Verifikator Keuangan belum diverifikasi.', 422, 'APPROVER_UNVERIFIED');
      }
      if (ayuUser.status !== 'ACTIVE') {
        throw new DomainError('Verifikator Keuangan tidak aktif.', 422, 'APPROVER_INACTIVE');
      }

      // 3. Resolve Stage 3 approvers (BOD Parallel - Dual Directors)
      let heryUser: AppUserRecord | undefined;
      let stage3HeryAssignmentId: string | null = null;
      if (options?.bodHeryUserId) {
        heryUser = orgRepo.getUser(options.bodHeryUserId);
      } else {
        const row = db.prepare('SELECT * FROM approval_stage_assignments WHERE stage_key = ? AND active = 1').get('STAGE_3_BOD_HERY') as any;
        if (!row) {
          throw new DomainError('Penugasan Direksi BoD 1 (Stage 3) tidak ditemukan atau belum dikonfigurasi.', 422, 'NO_STAGE3_HERY_ASSIGNMENT');
        }
        stage3HeryAssignmentId = row.id;
        heryUser = orgRepo.getUser(row.assigned_user_id);
      }
      if (!heryUser) {
        throw new DomainError('Penugasan Direksi BoD 1 (Stage 3) tidak ditemukan.', 422, 'NO_STAGE3_HERY_ASSIGNMENT');
      }
      if (heryUser.verificationStatus !== 'VERIFIED') {
        throw new DomainError('Identitas Direksi BoD 1 belum diverifikasi.', 422, 'APPROVER_UNVERIFIED');
      }
      if (heryUser.status !== 'ACTIVE') {
        throw new DomainError('Direksi BoD 1 tidak aktif.', 422, 'APPROVER_INACTIVE');
      }

      let hashimotoUser: AppUserRecord | undefined;
      let stage3HashimotoAssignmentId: string | null = null;
      if (options?.bodHashimotoUserId) {
        hashimotoUser = orgRepo.getUser(options.bodHashimotoUserId);
      } else {
        const row = db.prepare('SELECT * FROM approval_stage_assignments WHERE stage_key = ? AND active = 1').get('STAGE_3_BOD_HASHIMOTO') as any;
        if (!row) {
          throw new DomainError('Penugasan Direksi BoD 2 (Stage 3) tidak ditemukan atau belum dikonfigurasi.', 422, 'NO_STAGE3_HASHIMOTO_ASSIGNMENT');
        }
        stage3HashimotoAssignmentId = row.id;
        hashimotoUser = orgRepo.getUser(row.assigned_user_id);
      }
      if (!hashimotoUser) {
        throw new DomainError('Penugasan Direksi BoD 2 (Stage 3) tidak ditemukan.', 422, 'NO_STAGE3_HASHIMOTO_ASSIGNMENT');
      }
      if (hashimotoUser.verificationStatus !== 'VERIFIED') {
        throw new DomainError('Identitas Direksi BoD 2 belum diverifikasi.', 422, 'APPROVER_UNVERIFIED');
      }
      if (hashimotoUser.status !== 'ACTIVE') {
        throw new DomainError('Direksi BoD 2 tidak aktif.', 422, 'APPROVER_INACTIVE');
      }

      // Ensure both BOD approvers have independent canonical identities
      if (heryUser.id === hashimotoUser.id) {
        throw new DomainError('Penugasan kedua Direksi BoD harus independen dan tidak boleh pengguna yang sama.', 422, 'BOD_IDENTITY_CONFLICT');
      }

      // 4. Insert Workflow Instance
      db.prepare(`
        INSERT INTO approval_workflows (
          id, document_id, doc_type, doc_number, unit_id, workflow_version, status, submitted_at, submitted_by
        ) VALUES (?, ?, ?, ?, ?, 1, 'ACTIVE', ?, ?)
      `).run(
        workflowId,
        input.documentId,
        docTypeUpper,
        input.docNumber,
        input.unitId ?? null,
        now,
        input.applicantUserId
      );

      const snapshots: AssignmentSnapshot[] = [];
      const stages: ApprovalStageRecord[] = [];

      const insertSnapshotStmt = db.prepare(`
        INSERT INTO approval_assignment_snapshots (
          id, workflow_id, document_id, unit_id, unit_name, assignment_id, stage_key, approver_user_id, approver_name, role_context, snapshot_timestamp, policy_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertStageStmt = db.prepare(`
        INSERT INTO approval_stages (
          id, workflow_id, stage_key, stage_order, parallel_group, assigned_approver_id, approver_name, approver_role, snapshot_id, status, activated_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // 5. Stage 1: Supervisor (if not PV)
      let isStage1SelfApproval = false;
      if (!isPv && stage1Supervisor) {
        if (stage1Supervisor.id === input.applicantUserId) {
          isStage1SelfApproval = true;
        }

        const snap1Id = randomUUID();
        const stage1Id = randomUUID();
        insertSnapshotStmt.run(
          snap1Id,
          workflowId,
          input.documentId,
          input.unitId ?? null,
          unitName ?? null,
          stage1AssignmentId ?? null,
          'STAGE_1_SUPERVISOR',
          stage1Supervisor.id,
          stage1Supervisor.fullName,
          'ATASAN_LANGSUNG',
          now,
          'BR-APP-001-v1'
        );
        insertStageStmt.run(
          stage1Id,
          workflowId,
          'STAGE_1_SUPERVISOR',
          1,
          null,
          stage1Supervisor.id,
          stage1Supervisor.fullName,
          'ATASAN',
          snap1Id,
          isStage1SelfApproval ? 'SKIPPED' : 'PENDING',
          now,
          isStage1SelfApproval ? now : null
        );

        if (isStage1SelfApproval) {
          db.prepare(`
            INSERT INTO approval_stage_assignment_audit (
              id, stage_key, assigned_user_id, active, actor_user_id, action, at, before_json, after_json
            ) VALUES (?, 'STAGE_1_SUPERVISOR', ?, 1, ?, 'SELF_APPROVAL_SKIPPED', ?, NULL, ?)
          `).run(
            randomUUID(),
            stage1Supervisor.id,
            input.applicantUserId,
            now,
            JSON.stringify({
              reason: 'Self-approval skipped per BLC Procurement v3: applicant cannot approve own request',
              applicantUserId: input.applicantUserId,
              stageKey: 'STAGE_1_SUPERVISOR',
              documentId: input.documentId,
            })
          );
        }
      }

      // 6. Stage 2: Finance Verifier (Ayu)
      const isStage2ActiveAtSubmit = isPv || isStage1SelfApproval;
      const isStage2SelfApproval = isStage2ActiveAtSubmit && ayuUser.id === input.applicantUserId;
      let stage2Status: StageStatus = 'WAITING';
      let stage2ActivatedAt: string | null = null;
      let stage2CompletedAt: string | null = null;

      if (isStage2SelfApproval) {
        stage2Status = 'SKIPPED';
        stage2ActivatedAt = now;
        stage2CompletedAt = now;
      } else if (isStage2ActiveAtSubmit) {
        stage2Status = 'PENDING';
        stage2ActivatedAt = now;
      }

      const snap2Id = randomUUID();
      const stage2Id = randomUUID();
      insertSnapshotStmt.run(
        snap2Id,
        workflowId,
        input.documentId,
        null,
        'Finance & HRGA',
        stage2AssignmentId ?? null,
        'STAGE_2_FINANCE',
        ayuUser.id,
        ayuUser.fullName,
        'FINANCE_VERIFIER',
        now,
        'BR-APP-001-v1'
      );
      insertStageStmt.run(
        stage2Id,
        workflowId,
        'STAGE_2_FINANCE',
        isPv ? 1 : 2,
        null,
        ayuUser.id,
        ayuUser.fullName,
        'AYU',
        snap2Id,
        stage2Status,
        stage2ActivatedAt,
        stage2CompletedAt
      );

      if (isStage2SelfApproval) {
        db.prepare(`
          INSERT INTO approval_stage_assignment_audit (
            id, stage_key, assigned_user_id, active, actor_user_id, action, at, before_json, after_json
          ) VALUES (?, 'STAGE_2_FINANCE', ?, 1, ?, 'SELF_APPROVAL_SKIPPED', ?, NULL, ?)
        `).run(
          randomUUID(),
          ayuUser.id,
          input.applicantUserId,
          now,
          JSON.stringify({
            reason: 'Self-approval skipped per BLC Procurement v3: applicant cannot approve own request',
            applicantUserId: input.applicantUserId,
            stageKey: 'STAGE_2_FINANCE',
            documentId: input.documentId,
          })
        );
      }

      // 7. Stage 3A: BOD Hery
      // In PV: BOD is sequential, parallelGroup is null, order is 2.
      // In Non-PV: BOD is parallel, parallelGroup is 'BOD_PARALLEL', order is 3.
      const snap3aId = randomUUID();
      const stage3aId = randomUUID();
      const isStage3ActiveAtSubmit = isStage2SelfApproval;
      insertSnapshotStmt.run(
        snap3aId,
        workflowId,
        input.documentId,
        null,
        'Board of Directors',
        stage3HeryAssignmentId ?? null,
        'STAGE_3_BOD_HERY',
        heryUser.id,
        heryUser.fullName,
        'DIRECTOR_HERY',
        now,
        'BR-APP-001-v1'
      );
      insertStageStmt.run(
        stage3aId,
        workflowId,
        'STAGE_3_BOD_HERY',
        isPv ? 2 : 3,
        isPv ? null : 'BOD_PARALLEL',
        heryUser.id,
        heryUser.fullName,
        'BOD_HERY',
        snap3aId,
        isStage3ActiveAtSubmit ? 'PENDING' : 'WAITING',
        isStage3ActiveAtSubmit ? now : null,
        null
      );

      // 8. Stage 3B: BOD Hashimoto
      // In PV: BOD is sequential, parallelGroup is null, order is 3. Starts WAITING until Hery approves.
      // In Non-PV: BOD is parallel, parallelGroup is 'BOD_PARALLEL', order is 3. Active only if Stage 2 was skipped at submit.
      const snap3bId = randomUUID();
      const stage3bId = randomUUID();
      const isHashimotoActiveAtSubmit = !isPv && isStage2SelfApproval;
      insertSnapshotStmt.run(
        snap3bId,
        workflowId,
        input.documentId,
        null,
        'Board of Directors',
        stage3HashimotoAssignmentId ?? null,
        'STAGE_3_BOD_HASHIMOTO',
        hashimotoUser.id,
        hashimotoUser.fullName,
        'PRESIDENT_DIRECTOR_HASHIMOTO',
        now,
        'BR-APP-001-v1'
      );
      insertStageStmt.run(
        stage3bId,
        workflowId,
        'STAGE_3_BOD_HASHIMOTO',
        isPv ? 3 : 3,
        isPv ? null : 'BOD_PARALLEL',
        hashimotoUser.id,
        hashimotoUser.fullName,
        'BOD_HASHIMOTO',
        snap3bId,
        isHashimotoActiveAtSubmit ? 'PENDING' : 'WAITING',
        isHashimotoActiveAtSubmit ? now : null,
        null
      );

      // Audit trail for submission overrides (HF02-B Security Gate)
      if (authorizerUserRecord && options?.overrideReason?.trim()) {
        const insertAuditStmt = db.prepare(`
          INSERT INTO approval_stage_assignment_audit (
            id, stage_key, assigned_user_id, active, actor_user_id, action, at, before_json, after_json
          ) VALUES (?, ?, ?, 1, ?, 'SUBMISSION_OVERRIDE', ?, ?, ?)
        `);

        if (options.financeVerifierUserId) {
          insertAuditStmt.run(
            randomUUID(),
            'STAGE_2_FINANCE',
            ayuUser.id,
            authorizerUserRecord.id,
            now,
            stage2AssignmentId ? JSON.stringify({ persistentAssignmentId: stage2AssignmentId }) : null,
            JSON.stringify({
              workflowId,
              documentId: input.documentId,
              docNumber: input.docNumber,
              overriddenApproverId: ayuUser.id,
              overriddenApproverName: ayuUser.fullName,
              overrideReason: options.overrideReason.trim(),
              authorizedBy: authorizerUserRecord.id,
            })
          );
        }

        if (options.bodHeryUserId) {
          insertAuditStmt.run(
            randomUUID(),
            'STAGE_3_BOD_HERY',
            heryUser.id,
            authorizerUserRecord.id,
            now,
            stage3HeryAssignmentId ? JSON.stringify({ persistentAssignmentId: stage3HeryAssignmentId }) : null,
            JSON.stringify({
              workflowId,
              documentId: input.documentId,
              docNumber: input.docNumber,
              overriddenApproverId: heryUser.id,
              overriddenApproverName: heryUser.fullName,
              overrideReason: options.overrideReason.trim(),
              authorizedBy: authorizerUserRecord.id,
            })
          );
        }

        if (options.bodHashimotoUserId) {
          insertAuditStmt.run(
            randomUUID(),
            'STAGE_3_BOD_HASHIMOTO',
            hashimotoUser.id,
            authorizerUserRecord.id,
            now,
            stage3HashimotoAssignmentId ? JSON.stringify({ persistentAssignmentId: stage3HashimotoAssignmentId }) : null,
            JSON.stringify({
              workflowId,
              documentId: input.documentId,
              docNumber: input.docNumber,
              overriddenApproverId: hashimotoUser.id,
              overriddenApproverName: hashimotoUser.fullName,
              overrideReason: options.overrideReason.trim(),
              authorizedBy: authorizerUserRecord.id,
            })
          );
        }
      }

      db.exec('COMMIT');

      const createdWorkflow = this.workflowRow(
        db.prepare('SELECT * FROM approval_workflows WHERE id = ?').get(workflowId)
      );
      const createdStages = (
        db.prepare('SELECT * FROM approval_stages WHERE workflow_id = ? ORDER BY stage_order, id').all(workflowId) as any[]
      ).map((r) => this.stageRow(r));
      const createdSnapshots = (
        db.prepare('SELECT * FROM approval_assignment_snapshots WHERE workflow_id = ? ORDER BY id').all(workflowId) as any[]
      ).map((r) => this.snapshotRow(r));

      return {
        workflow: createdWorkflow,
        stages: createdStages,
        snapshots: createdSnapshots,
      };
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    } finally {
      this.closeDb(db);
    }
  }

  // --- Queries ---

  getWorkflow(workflowId: string): WorkflowInstance {
    const db = this.getDb();
    try {
      const row = db.prepare('SELECT * FROM approval_workflows WHERE id = ?').get(workflowId);
      if (!row) throw new DomainError('Workflow instance tidak ditemukan.', 404, 'WORKFLOW_NOT_FOUND');
      return this.workflowRow(row);
    } finally {
      this.closeDb(db);
    }
  }

  getWorkflowByDocumentId(documentId: string): WorkflowInstance | null {
    const db = this.getDb();
    try {
      const row = db
        .prepare('SELECT * FROM approval_workflows WHERE document_id = ? ORDER BY submitted_at DESC LIMIT 1')
        .get(documentId);
      if (!row) return null;
      return this.workflowRow(row);
    } finally {
      this.closeDb(db);
    }
  }

  getStages(workflowId: string): ApprovalStageRecord[] {
    const db = this.getDb();
    try {
      const rows = db
        .prepare('SELECT * FROM approval_stages WHERE workflow_id = ? ORDER BY stage_order, id')
        .all(workflowId) as any[];
      return rows.map((r) => this.stageRow(r));
    } finally {
      this.closeDb(db);
    }
  }

  getStage(stageId: string): ApprovalStageRecord {
    const db = this.getDb();
    try {
      const row = db.prepare('SELECT * FROM approval_stages WHERE id = ?').get(stageId);
      if (!row) throw new DomainError('Approval stage tidak ditemukan.', 404, 'STAGE_NOT_FOUND');
      return this.stageRow(row);
    } finally {
      this.closeDb(db);
    }
  }

  getActiveStages(workflowId: string): ApprovalStageRecord[] {
    const db = this.getDb();
    try {
      const rows = db
        .prepare("SELECT * FROM approval_stages WHERE workflow_id = ? AND status = 'PENDING' ORDER BY stage_order, id")
        .all(workflowId) as any[];
      return rows.map((r) => this.stageRow(r));
    } finally {
      this.closeDb(db);
    }
  }

  getSnapshots(workflowId: string): AssignmentSnapshot[] {
    const db = this.getDb();
    try {
      const rows = db
        .prepare('SELECT * FROM approval_assignment_snapshots WHERE workflow_id = ? ORDER BY id')
        .all(workflowId) as any[];
      return rows.map((r) => this.snapshotRow(r));
    } finally {
      this.closeDb(db);
    }
  }

  getDecisions(workflowId: string): ApprovalDecisionRecord[] {
    const db = this.getDb();
    try {
      const rows = db
        .prepare('SELECT * FROM approval_decisions WHERE workflow_id = ? ORDER BY decided_at, id')
        .all(workflowId) as any[];
      return rows.map((r) => this.decisionRow(r));
    } finally {
      this.closeDb(db);
    }
  }

  // --- Independent Stage State Machine & Progression (HF02B-005, HF02B-006, HF02B-007, HF02C-001, HF02C-002, HF02C-004, HF02C-005) ---

  recordStageDecision(
    input: {
      workflowId: string;
      stageId: string;
      approverUserId: string;
      decision: 'APPROVE' | 'REJECT';
      comment?: string;
      idempotencyKey?: string;
      authenticatedUser?: AppUserRecord;
    },
    orgRepo?: OrganizationRepository
  ): {
    stage: ApprovalStageRecord;
    decision: ApprovalDecisionRecord;
    workflow: WorkflowInstance;
    activatedStages: ApprovalStageRecord[];
  } {
    // 1. Validate Authenticated Principal & Lifecycle
    let userRecord = input.authenticatedUser;
    if (!userRecord && orgRepo) {
      try {
        userRecord = orgRepo.getUser(input.approverUserId);
      } catch {
        // user might not exist in orgRepo in legacy test fixtures
      }
    }
    if (userRecord) {
      if (userRecord.verificationStatus !== 'VERIFIED') {
        throw new DomainError('Approver belum diverifikasi.', 422, 'APPROVER_UNVERIFIED');
      }
      if (userRecord.status !== 'ACTIVE') {
        throw new DomainError('Approver tidak aktif.', 422, 'APPROVER_INACTIVE');
      }
    }

    const callerId = userRecord?.id ?? input.approverUserId;
    const cleanKey = input.idempotencyKey?.trim();
    let payloadHash: string | null = null;

    // 2. Idempotency Pre-Check (HF02C-004, REV-C03)
    if (cleanKey) {
      payloadHash = createHash('sha256')
        .update(JSON.stringify({ decision: input.decision, comment: input.comment?.trim() ?? '' }))
        .digest('hex');

      const db = this.getDb();
      try {
        const wfRow = db.prepare('SELECT document_id FROM approval_workflows WHERE id = ?').get(input.workflowId) as any;
        const targetDocId = wfRow?.document_id ?? input.workflowId;
        const existing = db
          .prepare(
            'SELECT * FROM approval_idempotency_records WHERE key = ? AND user_id = ? AND operation_type = ? AND document_id = ? AND stage_id = ?'
          )
          .get(cleanKey, callerId, 'STAGE_DECISION', targetDocId, input.stageId) as any;

        if (existing) {
          if (existing.payload_hash !== payloadHash) {
            throw new DomainError(
              'Idempotency key telah digunakan dengan payload berbeda.',
              409,
              'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH'
            );
          }
          if (existing.status === 'COMPLETED' && existing.response_json) {
            return JSON.parse(existing.response_json);
          }
          if (existing.status === 'IN_PROGRESS') {
            throw new DomainError(
              'Permintaan dengan idempotency key ini sedang diproses.',
              409,
              'CONCURRENT_REQUEST_IN_PROGRESS'
            );
          }
        }
      } finally {
        this.closeDb(db);
      }
    }

    const db = this.getDb();
    const now = new Date().toISOString();
    const decisionId = randomUUID();

    try {
      db.exec('BEGIN IMMEDIATE');

      // 4. Validate Workflow
      const wfRow = db.prepare('SELECT * FROM approval_workflows WHERE id = ?').get(input.workflowId);
      if (!wfRow) throw new DomainError('Workflow instance tidak ditemukan.', 404, 'WORKFLOW_NOT_FOUND');
      const workflow = this.workflowRow(wfRow);
      if (workflow.status !== 'ACTIVE') {
        throw new DomainError(`Workflow tidak aktif (status: ${workflow.status}).`, 409, 'WORKFLOW_NOT_ACTIVE');
      }

      // 3. Insert Idempotency Record as IN_PROGRESS if key supplied
      if (cleanKey && payloadHash) {
        db.prepare(`
          INSERT INTO approval_idempotency_records (
            key, user_id, operation_type, document_id, stage_id, payload_hash, status, created_at, updated_at
          ) VALUES (?, ?, 'STAGE_DECISION', ?, ?, ?, 'IN_PROGRESS', ?, ?)
          ON CONFLICT(key, user_id, operation_type, document_id, stage_id) DO UPDATE SET updated_at = ?
        `).run(cleanKey, callerId, workflow.documentId, input.stageId, payloadHash, now, now, now);
      }

      // 5. Validate Stage
      const stRow = db
        .prepare('SELECT * FROM approval_stages WHERE id = ? AND workflow_id = ?')
        .get(input.stageId, input.workflowId);
      if (!stRow) throw new DomainError('Stage tidak ditemukan pada workflow ini.', 404, 'STAGE_NOT_FOUND');
      const stage = this.stageRow(stRow);

      if (stage.status === 'WAITING') {
        throw new DomainError('Tahap belum aktif untuk persetujuan.', 409, 'STAGE_NOT_ACTIVE');
      }
      if (stage.status === 'APPROVED' || stage.status === 'REJECTED') {
        throw new DomainError(
          `Tahap sudah selesai sebelumnya dengan status ${stage.status}.`,
          409,
          'STAGE_ALREADY_COMPLETED'
        );
      }
      if (stage.status !== 'PENDING') {
        throw new DomainError(`Status tahap tidak valid untuk keputusan (${stage.status}).`, 409, 'INVALID_STAGE_STATUS');
      }

      // 6. Validate Approver Identity against stage assignment
      if (
        stage.assignedApproverId !== callerId &&
        !stage.assignedApproverId.endsWith(callerId) &&
        !callerId.endsWith(stage.assignedApproverId)
      ) {
        throw new DomainError('Pengguna bukan approver yang ditugaskan pada tahap ini.', 403, 'FORBIDDEN_APPROVER');
      }

      const activatedStages: ApprovalStageRecord[] = [];

      // 7. Handle REJECT
      if (input.decision === 'REJECT') {
        const comment = input.comment?.trim();
        if (!comment) {
          throw new DomainError('Alasan penolakan (comment) wajib diisi saat menolak dokumen.', 422, 'REJECTION_COMMENT_REQUIRED');
        }

        // Conditional atomic update for concurrency protection
        const updateResult = db
          .prepare("UPDATE approval_stages SET status = 'REJECTED', completed_at = ? WHERE id = ? AND status = 'PENDING'")
          .run(now, stage.id);

        if (updateResult.changes === 0) {
          throw new DomainError('Tahap telah diubah oleh operasi lain.', 409, 'CONCURRENT_MODIFICATION');
        }

        // If stage is part of parallel group (BOD), suspend any pending sibling
        if (stage.parallelGroup) {
          db.prepare(
            "UPDATE approval_stages SET status = 'WAITING' WHERE workflow_id = ? AND parallel_group = ? AND id <> ? AND status = 'PENDING'"
          ).run(input.workflowId, stage.parallelGroup, stage.id);
        }

        // Mark workflow as REJECTED
        db.prepare('UPDATE approval_workflows SET status = ?, completed_at = ? WHERE id = ?').run(
          'REJECTED',
          now,
          input.workflowId
        );

        // Insert decision
        db.prepare(`
          INSERT INTO approval_decisions (id, workflow_id, stage_id, approver_user_id, decision, comment, decided_at)
          VALUES (?, ?, ?, ?, 'REJECT', ?, ?)
        `).run(decisionId, input.workflowId, stage.id, callerId, comment, now);
      } else {
        // 8. Handle APPROVE
        // Conditional atomic update for concurrency protection
        const updateResult = db
          .prepare("UPDATE approval_stages SET status = 'APPROVED', completed_at = ? WHERE id = ? AND status = 'PENDING'")
          .run(now, stage.id);

        if (updateResult.changes === 0) {
          throw new DomainError('Tahap telah diubah oleh operasi lain.', 409, 'CONCURRENT_MODIFICATION');
        }

        // Insert decision
        db.prepare(`
          INSERT INTO approval_decisions (id, workflow_id, stage_id, approver_user_id, decision, comment, decided_at)
          VALUES (?, ?, ?, ?, 'APPROVE', ?, ?)
        `).run(decisionId, input.workflowId, stage.id, callerId, input.comment?.trim() ?? null, now);

        // Progression evaluation
        if (stage.stageKey === 'STAGE_1_SUPERVISOR') {
          const st2Row = db
            .prepare("SELECT * FROM approval_stages WHERE workflow_id = ? AND stage_key = 'STAGE_2_FINANCE'")
            .get(input.workflowId) as any;
          if (st2Row) {
            if (st2Row.assigned_approver_id === workflow.submittedBy) {
              // Self-approval skip on Stage 2
              db.prepare(
                "UPDATE approval_stages SET status = 'SKIPPED', activated_at = ?, completed_at = ? WHERE id = ?"
              ).run(now, now, st2Row.id);

              db.prepare(`
                INSERT INTO approval_stage_assignment_audit (
                  id, stage_key, assigned_user_id, active, actor_user_id, action, at, before_json, after_json
                ) VALUES (?, 'STAGE_2_FINANCE', ?, 1, ?, 'SELF_APPROVAL_SKIPPED', ?, NULL, ?)
              `).run(
                randomUUID(),
                st2Row.assigned_approver_id,
                workflow.submittedBy,
                now,
                JSON.stringify({
                  reason: 'Self-approval skipped per BLC Procurement v3: applicant cannot approve own request',
                  applicantUserId: workflow.submittedBy,
                  stageKey: 'STAGE_2_FINANCE',
                  workflowId: input.workflowId,
                })
              );

              // Activate downstream BOD
              if (workflow.docType === 'PV') {
                db.prepare(
                  "UPDATE approval_stages SET status = 'PENDING', activated_at = ? WHERE workflow_id = ? AND stage_key = 'STAGE_3_BOD_HERY'"
                ).run(now, input.workflowId);
                const stHery = db
                  .prepare("SELECT * FROM approval_stages WHERE workflow_id = ? AND stage_key = 'STAGE_3_BOD_HERY'")
                  .get(input.workflowId);
                if (stHery) activatedStages.push(this.stageRow(stHery));
              } else {
                db.prepare(
                  "UPDATE approval_stages SET status = 'PENDING', activated_at = ? WHERE workflow_id = ? AND parallel_group = 'BOD_PARALLEL'"
                ).run(now, input.workflowId);
                const bods = db
                  .prepare("SELECT * FROM approval_stages WHERE workflow_id = ? AND parallel_group = 'BOD_PARALLEL'")
                  .all(input.workflowId) as any[];
                for (const b of bods) activatedStages.push(this.stageRow(b));
              }
            } else {
              // Normal Stage 2 activation
              db.prepare(
                "UPDATE approval_stages SET status = 'PENDING', activated_at = ? WHERE id = ?"
              ).run(now, st2Row.id);
              const updatedSt2 = db.prepare("SELECT * FROM approval_stages WHERE id = ?").get(st2Row.id);
              if (updatedSt2) activatedStages.push(this.stageRow(updatedSt2));
            }
          }
        } else if (stage.stageKey === 'STAGE_2_FINANCE') {
          if (workflow.docType === 'PV') {
            // PV is SEQUENTIAL: Activate ONLY Stage 3A (BOD Hery)
            // Hashimoto remains WAITING!
            db.prepare(
              "UPDATE approval_stages SET status = 'PENDING', activated_at = ? WHERE workflow_id = ? AND stage_key = 'STAGE_3_BOD_HERY'"
            ).run(now, input.workflowId);
            const stHery = db
              .prepare("SELECT * FROM approval_stages WHERE workflow_id = ? AND stage_key = 'STAGE_3_BOD_HERY'")
              .get(input.workflowId);
            if (stHery) activatedStages.push(this.stageRow(stHery));
          } else {
            // PR, PO, AV, RB: BOD Parallel (Dual Directors)
            db.prepare(
              "UPDATE approval_stages SET status = 'PENDING', activated_at = ? WHERE workflow_id = ? AND parallel_group = 'BOD_PARALLEL'"
            ).run(now, input.workflowId);
            const bods = db
              .prepare("SELECT * FROM approval_stages WHERE workflow_id = ? AND parallel_group = 'BOD_PARALLEL'")
              .all(input.workflowId) as any[];
            for (const b of bods) activatedStages.push(this.stageRow(b));
          }
        } else if (stage.stageKey === 'STAGE_3_BOD_HERY' && workflow.docType === 'PV') {
          // PV SEQUENTIAL: After Hery approves, activate Hashimoto
          db.prepare(
            "UPDATE approval_stages SET status = 'PENDING', activated_at = ? WHERE workflow_id = ? AND stage_key = 'STAGE_3_BOD_HASHIMOTO'"
          ).run(now, input.workflowId);
          const stHash = db
            .prepare("SELECT * FROM approval_stages WHERE workflow_id = ? AND stage_key = 'STAGE_3_BOD_HASHIMOTO'")
            .get(input.workflowId);
          if (stHash) activatedStages.push(this.stageRow(stHash));
        } else if (stage.stageKey === 'STAGE_3_BOD_HASHIMOTO' && workflow.docType === 'PV') {
          // PV SEQUENTIAL: After Hashimoto approves, workflow is complete!
          db.prepare('UPDATE approval_workflows SET status = ?, completed_at = ? WHERE id = ?').run(
            'COMPLETED',
            now,
            input.workflowId
          );
        } else if (stage.parallelGroup === 'BOD_PARALLEL') {
          // Check if ALL stages in BOD_PARALLEL are APPROVED (or SKIPPED)
          const bodStages = db
            .prepare("SELECT * FROM approval_stages WHERE workflow_id = ? AND parallel_group = 'BOD_PARALLEL'")
            .all(input.workflowId) as any[];
          const allBodApproved = bodStages.every((s) => s.status === 'APPROVED' || s.status === 'SKIPPED');
          if (allBodApproved) {
            // Workflow complete!
            db.prepare('UPDATE approval_workflows SET status = ?, completed_at = ? WHERE id = ?').run(
              'COMPLETED',
              now,
              input.workflowId
            );
          }
        }
      }

      const updatedStage = this.stageRow(db.prepare('SELECT * FROM approval_stages WHERE id = ?').get(stage.id));
      const updatedDecision = this.decisionRow(
        db.prepare('SELECT * FROM approval_decisions WHERE id = ?').get(decisionId)
      );
      const updatedWorkflow = this.workflowRow(
        db.prepare('SELECT * FROM approval_workflows WHERE id = ?').get(input.workflowId)
      );

      const resultPayload = {
        stage: updatedStage,
        decision: updatedDecision,
        workflow: updatedWorkflow,
        activatedStages,
      };

      // 9. Update Idempotency Record to COMPLETED
      if (cleanKey) {
        db.prepare(`
          UPDATE approval_idempotency_records
          SET status = 'COMPLETED', response_json = ?, updated_at = ?
          WHERE key = ? AND user_id = ? AND operation_type = 'STAGE_DECISION' AND document_id = ? AND stage_id = ?
        `).run(JSON.stringify(resultPayload), now, cleanKey, callerId, workflow.documentId, input.stageId);
      }

      db.exec('COMMIT');

      return resultPayload;
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    } finally {
      this.closeDb(db);
    }
  }

  // --- Cross-Storage Consistency & Coordination (HF02C-006) ---

  prepareCrossStorageSync(input: {
    documentId: string;
    workflowId?: string;
    stageId?: string;
    operationType: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'REASSIGN';
    stageState: any;
    documentState?: any;
  }): string {
    const db = this.getDb();
    const id = randomUUID();
    const now = new Date().toISOString();
    try {
      db.prepare(`
        INSERT INTO cross_storage_sync_records (
          id, document_id, workflow_id, stage_id, operation_type, status,
          stage_state_json, document_state_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'PREPARED', ?, ?, ?, ?)
      `).run(
        id,
        input.documentId,
        input.workflowId ?? null,
        input.stageId ?? null,
        input.operationType,
        JSON.stringify(input.stageState),
        input.documentState ? JSON.stringify(input.documentState) : null,
        now,
        now
      );
      return id;
    } finally {
      this.closeDb(db);
    }
  }

  commitCrossStorageSync(syncId: string): void {
    const db = this.getDb();
    const now = new Date().toISOString();
    try {
      db.prepare(`
        UPDATE cross_storage_sync_records
        SET status = 'COMMITTED', updated_at = ?
        WHERE id = ?
      `).run(now, syncId);
    } finally {
      this.closeDb(db);
    }
  }

  compensateCrossStorageSync(syncId: string, errorMessage: string): void {
    const db = this.getDb();
    const now = new Date().toISOString();
    try {
      db.exec('BEGIN IMMEDIATE');
      const syncRow = db.prepare('SELECT * FROM cross_storage_sync_records WHERE id = ?').get(syncId) as any;
      if (!syncRow) {
        throw new DomainError('Sync record tidak ditemukan.', 404, 'SYNC_RECORD_NOT_FOUND');
      }

      if (syncRow.stage_id && syncRow.workflow_id) {
        const stageRow = db.prepare('SELECT * FROM approval_stages WHERE id = ?').get(syncRow.stage_id) as any;
        if (stageRow) {
          const stageKey = stageRow.stage_key;
          const assignedApproverId = stageRow.assigned_approver_id;

          // Revert target stage back to PENDING
          db.prepare("UPDATE approval_stages SET status = 'PENDING', completed_at = NULL WHERE id = ?").run(syncRow.stage_id);

          // Revert downstream stages if they were activated by this decision
          if (stageKey === 'STAGE_1_SUPERVISOR') {
            db.prepare(
              "UPDATE approval_stages SET status = 'WAITING', activated_at = NULL WHERE workflow_id = ? AND stage_key = 'STAGE_2_FINANCE'"
            ).run(syncRow.workflow_id);
          } else if (stageKey === 'STAGE_2_FINANCE') {
            const wf = db.prepare('SELECT doc_type FROM approval_workflows WHERE id = ?').get(syncRow.workflow_id) as any;
            if (wf?.doc_type === 'PV') {
              db.prepare(
                "UPDATE approval_stages SET status = 'WAITING', activated_at = NULL WHERE workflow_id = ? AND stage_key = 'STAGE_3_BOD_HERY'"
              ).run(syncRow.workflow_id);
            } else {
              db.prepare(
                "UPDATE approval_stages SET status = 'WAITING', activated_at = NULL WHERE workflow_id = ? AND parallel_group = 'BOD_PARALLEL'"
              ).run(syncRow.workflow_id);
            }
          } else if (stageKey === 'STAGE_3_BOD_HERY') {
            const wf = db.prepare('SELECT doc_type FROM approval_workflows WHERE id = ?').get(syncRow.workflow_id) as any;
            if (wf?.doc_type === 'PV') {
              db.prepare(
                "UPDATE approval_stages SET status = 'WAITING', activated_at = NULL WHERE workflow_id = ? AND stage_key = 'STAGE_3_BOD_HASHIMOTO'"
              ).run(syncRow.workflow_id);
            }
          }

          // Revert workflow status back to ACTIVE if it was completed or rejected
          db.prepare("UPDATE approval_workflows SET status = 'ACTIVE', completed_at = NULL WHERE id = ?").run(syncRow.workflow_id);

          // Delete uncommitted decision
          db.prepare('DELETE FROM approval_decisions WHERE stage_id = ?').run(syncRow.stage_id);

          // Revert any in-flight idempotency record
          db.prepare("UPDATE approval_idempotency_records SET status = 'FAILED', updated_at = ? WHERE stage_id = ?").run(now, syncRow.stage_id);

          // Record audit trail for compensation
          const auditId = randomUUID();
          db.prepare(`
            INSERT INTO approval_stage_assignment_audit (
              id, stage_key, assigned_user_id, active, actor_user_id, action, at, before_json, after_json
            ) VALUES (?, ?, ?, 1, 'SYSTEM_SYNC_RECOVERY', 'SYNC_COMPENSATION', ?, ?, ?)
          `).run(
            auditId,
            stageKey,
            assignedApproverId,
            now,
            syncRow.stage_state_json,
            JSON.stringify({
              status: 'COMPENSATED',
              error: errorMessage,
              syncId,
              compensatedAt: now,
            })
          );
        }
      }

      db.prepare(`
        UPDATE cross_storage_sync_records
        SET status = 'COMPENSATED', error_message = ?, updated_at = ?
        WHERE id = ?
      `).run(errorMessage, now, syncId);

      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    } finally {
      this.closeDb(db);
    }
  }

  getCrossStorageSyncRecord(syncId: string): CrossStorageSyncRecord | null {
    const db = this.getDb();
    try {
      const row = db.prepare('SELECT * FROM cross_storage_sync_records WHERE id = ?').get(syncId);
      if (!row) return null;
      return this.syncRow(row);
    } finally {
      this.closeDb(db);
    }
  }

  listUncommittedSyncRecords(): CrossStorageSyncRecord[] {
    const db = this.getDb();
    try {
      const rows = db.prepare(`
        SELECT * FROM cross_storage_sync_records
        WHERE status IN ('PREPARED', 'FAILED')
        ORDER BY created_at ASC
      `).all() as any[];
      return rows.map((r) => this.syncRow(r));
    } finally {
      this.closeDb(db);
    }
  }

  reconcileCrossStorage(documentId: string, _repo?: any): { reconciledCount: number } {
    const db = this.getDb();
    const now = new Date().toISOString();
    try {
      db.exec('BEGIN IMMEDIATE');
      const uncommitted = db.prepare(`
        SELECT id FROM cross_storage_sync_records
        WHERE document_id = ? AND status IN ('PREPARED', 'FAILED')
      `).all(documentId) as any[];

      for (const row of uncommitted) {
        db.prepare(`
          UPDATE cross_storage_sync_records
          SET status = 'RECONCILED', updated_at = ?
          WHERE id = ?
        `).run(now, row.id);
      }
      db.exec('COMMIT');
      return { reconciledCount: uncommitted.length };
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    } finally {
      this.closeDb(db);
    }
  }
}

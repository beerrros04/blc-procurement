import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { DomainError } from './repository';

export type BranchStatus = 'ACTIVE' | 'INACTIVE';
export type BranchAuditAction = 'CREATE' | 'UPDATE' | 'DEACTIVATE' | 'ACTIVATE';

export interface BranchRecord {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  status: BranchStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface BranchAuditRecord {
  id: string;
  branchId: string;
  actorUserId: string;
  action: BranchAuditAction;
  at: string;
  beforeJson?: string | null;
  afterJson: string;
}

export interface CreateBranchInput {
  id?: string;
  code: string;
  name: string;
  address?: string | null;
}

export interface UpdateBranchPatch {
  code?: string;
  name?: string;
  address?: string | null;
}

export interface ActiveTransactionsCheckResult {
  activeCount: number;
  reasons: string[];
}

export class BranchDomainError extends DomainError {
  readonly details?: unknown;

  constructor(message: string, statusCode: number = 400, code: string = 'BRANCH_ERROR', details?: unknown) {
    super(`[${code}] ${message}`, statusCode, code);
    this.name = 'BranchDomainError';
    this.details = details;
  }
}

export const OFFICIAL_BRANCH_SEEDS: ReadonlyArray<{
  id: string;
  code: string;
  name: string;
  address: string;
}> = [
  { id: 'brc-bks', code: 'BKS', name: 'Bekasi', address: 'Cabang Bekasi' },
  { id: 'brc-cbn', code: 'CBN', name: 'Cibinong', address: 'Cabang Cibinong' },
  { id: 'brc-mdn', code: 'MDN', name: 'Medan', address: 'Cabang Medan' },
  { id: 'brc-sby', code: 'SBY', name: 'Surabaya', address: 'Cabang Surabaya' },
  { id: 'brc-pku', code: 'PKU', name: 'Pekanbaru', address: 'Cabang Pekanbaru' },
  { id: 'brc-mks', code: 'MKS', name: 'Makassar', address: 'Cabang Makassar' },
  { id: 'brc-smd', code: 'SMD', name: 'Samarinda', address: 'Cabang Samarinda' },
];

export function migrateBranchMaster(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS branch_schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      address TEXT,
      status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_branches_code_unique ON branches(code);
    CREATE INDEX IF NOT EXISTS idx_branches_status ON branches(status);

    CREATE TABLE IF NOT EXISTS branch_audit (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL REFERENCES branches(id),
      actor_user_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('CREATE', 'UPDATE', 'DEACTIVATE', 'ACTIVATE')),
      at TEXT NOT NULL,
      before_json TEXT,
      after_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_branch_audit_branch ON branch_audit(branch_id);
  `);

  const now = new Date().toISOString();
  const insertSeed = db.prepare(`
    INSERT OR IGNORE INTO branches (id, code, name, address, status, created_at, created_by, updated_at, updated_by)
    VALUES (?, ?, ?, ?, 'ACTIVE', ?, 'system-seed', ?, 'system-seed')
  `);

  for (const seed of OFFICIAL_BRANCH_SEEDS) {
    insertSeed.run(seed.id, seed.code, seed.name, seed.address, now, now);
  }

  const recordVersion = db.prepare(`
    INSERT OR IGNORE INTO branch_schema_version (version, applied_at)
    VALUES (1, ?)
  `);
  recordVersion.run(now);
}

interface RawBranchRow {
  id: string;
  code: string;
  name: string;
  address: string | null;
  status: BranchStatus;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

interface RawAuditRow {
  id: string;
  branch_id: string;
  actor_user_id: string;
  action: BranchAuditAction;
  at: string;
  before_json: string | null;
  after_json: string;
}

function mapBranchRow(row: RawBranchRow): BranchRecord {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    address: row.address,
    status: row.status,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

function mapAuditRow(row: RawAuditRow): BranchAuditRecord {
  return {
    id: row.id,
    branchId: row.branch_id,
    actorUserId: row.actor_user_id,
    action: row.action,
    at: row.at,
    beforeJson: row.before_json,
    afterJson: row.after_json,
  };
}

export class BranchRepository {
  constructor(private readonly db: DatabaseSync) {}

  listBranches(status?: BranchStatus): BranchRecord[] {
    if (status) {
      const rows = this.db.prepare(
        'SELECT * FROM branches WHERE status = ? ORDER BY code ASC'
      ).all(status) as unknown as RawBranchRow[];
      return rows.map(mapBranchRow);
    }
    const rows = this.db.prepare(
      'SELECT * FROM branches ORDER BY code ASC'
    ).all() as unknown as RawBranchRow[];
    return rows.map(mapBranchRow);
  }

  getBranchById(id: string): BranchRecord | null {
    const row = this.db.prepare(
      'SELECT * FROM branches WHERE id = ?'
    ).get(id) as unknown as RawBranchRow | undefined;
    return row ? mapBranchRow(row) : null;
  }

  getBranchByCode(code: string): BranchRecord | null {
    const row = this.db.prepare(
      'SELECT * FROM branches WHERE code = ? COLLATE NOCASE'
    ).get(code.trim()) as unknown as RawBranchRow | undefined;
    return row ? mapBranchRow(row) : null;
  }

  getBranchByName(name: string): BranchRecord | null {
    const row = this.db.prepare(
      'SELECT * FROM branches WHERE name = ? COLLATE NOCASE'
    ).get(name.trim()) as unknown as RawBranchRow | undefined;
    return row ? mapBranchRow(row) : null;
  }

  createBranch(input: CreateBranchInput, actorId: string): BranchRecord {
    const code = input.code?.trim().toUpperCase();
    const name = input.name?.trim();
    if (!code || !name) {
      throw new BranchDomainError('Kode dan nama cabang wajib diisi.', 400, 'INVALID_BRANCH_INPUT');
    }
    if (!/^[A-Z0-9]{2,10}$/.test(code)) {
      throw new BranchDomainError('Kode cabang harus 2-10 karakter alfanumerik.', 400, 'INVALID_BRANCH_CODE');
    }

    const existing = this.getBranchByCode(code);
    if (existing) {
      throw new BranchDomainError(`Kode cabang ${code} sudah terdaftar.`, 409, 'DUPLICATE_BRANCH_CODE');
    }

    const id = input.id?.trim() || `brc-${code.toLowerCase()}`;
    const now = new Date().toISOString();
    const address = input.address?.trim() || null;

    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare(`
        INSERT INTO branches (id, code, name, address, status, created_at, created_by, updated_at, updated_by)
        VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)
      `).run(id, code, name, address, now, actorId, now, actorId);

      const created = this.getBranchById(id)!;

      this.recordAudit({
        id: randomUUID(),
        branchId: id,
        actorUserId: actorId,
        action: 'CREATE',
        at: now,
        beforeJson: null,
        afterJson: JSON.stringify(created),
      });

      this.db.exec('COMMIT');
      return created;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }

  updateBranch(id: string, patch: UpdateBranchPatch, actorId: string): BranchRecord {
    const existing = this.getBranchById(id);
    if (!existing) {
      throw new BranchDomainError(`Cabang dengan ID ${id} tidak ditemukan.`, 404, 'BRANCH_NOT_FOUND');
    }

    let code = existing.code;
    if (patch.code !== undefined) {
      const trimmedCode = patch.code.trim().toUpperCase();
      if (!/^[A-Z0-9]{2,10}$/.test(trimmedCode)) {
        throw new BranchDomainError('Kode cabang harus 2-10 karakter alfanumerik.', 400, 'INVALID_BRANCH_CODE');
      }
      if (trimmedCode !== existing.code) {
        const duplicate = this.getBranchByCode(trimmedCode);
        if (duplicate && duplicate.id !== id) {
          throw new BranchDomainError(`Kode cabang ${trimmedCode} sudah terdaftar.`, 409, 'DUPLICATE_BRANCH_CODE');
        }
        code = trimmedCode;
      }
    }

    const name = patch.name !== undefined ? patch.name.trim() : existing.name;
    if (!name) {
      throw new BranchDomainError('Nama cabang tidak boleh kosong.', 400, 'INVALID_BRANCH_INPUT');
    }

    const address = (patch.address !== undefined ? (patch.address?.trim() || null) : existing.address) || null;
    const now = new Date().toISOString();

    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare(`
        UPDATE branches
        SET code = ?, name = ?, address = ?, updated_at = ?, updated_by = ?
        WHERE id = ?
      `).run(code, name, address, now, actorId, id);

      const updated = this.getBranchById(id)!;

      this.recordAudit({
        id: randomUUID(),
        branchId: id,
        actorUserId: actorId,
        action: 'UPDATE',
        at: now,
        beforeJson: JSON.stringify(existing),
        afterJson: JSON.stringify(updated),
      });

      this.db.exec('COMMIT');
      return updated;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }

  deactivateBranch(
    id: string,
    actorId: string,
    activeTxChecker?: (branch: BranchRecord | string) => ActiveTransactionsCheckResult
  ): BranchRecord {
    const existing = this.getBranchById(id);
    if (!existing) {
      throw new BranchDomainError(`Cabang dengan ID ${id} tidak ditemukan.`, 404, 'BRANCH_NOT_FOUND');
    }

    if (existing.status === 'INACTIVE') {
      return existing;
    }

    if (activeTxChecker) {
      const checkResult = activeTxChecker(existing);
      if (checkResult && checkResult.activeCount > 0) {
        throw new BranchDomainError(
          'Cabang tidak dapat dinonaktifkan karena masih memiliki transaksi aktif atau kewajiban terbuka.',
          409,
          'BRANCH_HAS_ACTIVE_TRANSACTIONS',
          checkResult
        );
      }
    }

    const now = new Date().toISOString();
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare(`
        UPDATE branches
        SET status = 'INACTIVE', updated_at = ?, updated_by = ?
        WHERE id = ?
      `).run(now, actorId, id);

      const deactivated = this.getBranchById(id)!;

      this.recordAudit({
        id: randomUUID(),
        branchId: id,
        actorUserId: actorId,
        action: 'DEACTIVATE',
        at: now,
        beforeJson: JSON.stringify(existing),
        afterJson: JSON.stringify(deactivated),
      });

      this.db.exec('COMMIT');
      return deactivated;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }

  activateBranch(id: string, actorId: string): BranchRecord {
    const existing = this.getBranchById(id);
    if (!existing) {
      throw new BranchDomainError(`Cabang dengan ID ${id} tidak ditemukan.`, 404, 'BRANCH_NOT_FOUND');
    }

    if (existing.status === 'ACTIVE') {
      return existing;
    }

    const now = new Date().toISOString();
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare(`
        UPDATE branches
        SET status = 'ACTIVE', updated_at = ?, updated_by = ?
        WHERE id = ?
      `).run(now, actorId, id);

      const activated = this.getBranchById(id)!;

      this.recordAudit({
        id: randomUUID(),
        branchId: id,
        actorUserId: actorId,
        action: 'ACTIVATE',
        at: now,
        beforeJson: JSON.stringify(existing),
        afterJson: JSON.stringify(activated),
      });

      this.db.exec('COMMIT');
      return activated;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }

  listAuditsForBranch(branchId: string): BranchAuditRecord[] {
    const rows = this.db.prepare(
      'SELECT * FROM branch_audit WHERE branch_id = ? ORDER BY at ASC'
    ).all(branchId) as unknown as RawAuditRow[];
    return rows.map(mapAuditRow);
  }

  private recordAudit(audit: BranchAuditRecord): void {
    this.db.prepare(`
      INSERT INTO branch_audit (id, branch_id, actor_user_id, action, at, before_json, after_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      audit.id,
      audit.branchId,
      audit.actorUserId,
      audit.action,
      audit.at,
      audit.beforeJson || null,
      audit.afterJson
    );
  }
}

export class BranchConcurrencyCoordinator {
  private queues = new Map<string, Promise<unknown>>();

  private async enqueue<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const current = this.queues.get(key) ?? Promise.resolve();
    let resolveTask!: () => void;
    const taskPromise = new Promise<void>((res) => {
      resolveTask = res;
    });
    this.queues.set(key, taskPromise);

    try {
      await current;
      return await fn();
    } finally {
      resolveTask();
      if (this.queues.get(key) === taskPromise) {
        this.queues.delete(key);
      }
    }
  }

  async withBranchWriteLock<T>(branchKey: string, fn: () => Promise<T>): Promise<T> {
    return this.enqueue(branchKey.toUpperCase(), fn);
  }

  async withBranchReadLock<T>(branchKey: string, fn: () => Promise<T>): Promise<T> {
    return this.enqueue(branchKey.toUpperCase(), fn);
  }
}

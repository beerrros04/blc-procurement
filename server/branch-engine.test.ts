import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { rmSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import {
  migrateBranchMaster,
  BranchRepository,
  OFFICIAL_BRANCH_SEEDS,
  BranchConcurrencyCoordinator,
  type CreateBranchInput,
} from './branch-engine';

describe('DB-01: Branch Master Schema & Repository', () => {
  let dbPath: string;
  let db: DatabaseSync;
  let repo: BranchRepository;

  beforeEach(() => {
    dbPath = join(tmpdir(), `blc-branch-test-${randomUUID()}.sqlite`);
    db = new DatabaseSync(dbPath);
    migrateBranchMaster(db);
    repo = new BranchRepository(db);
  });

  afterEach(() => {
    db.close();
    if (existsSync(dbPath)) {
      rmSync(dbPath, { force: true });
    }
  });

  it('T12: applies migration idempotently without errors on rerun', () => {
    expect(() => migrateBranchMaster(db)).not.toThrow();
    expect(() => migrateBranchMaster(db)).not.toThrow();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('branches', 'branch_audit', 'branch_schema_version')").all();
    expect(tables).toHaveLength(3);
  });

  it('T01 & T04: seeds official branches and enforces unique uppercase branch code', () => {
    const list = repo.listBranches();
    expect(list.length).toBeGreaterThanOrEqual(7);
    const bekasi = repo.getBranchByCode('BKS');
    expect(bekasi).toBeDefined();
    expect(bekasi?.name).toBe('Bekasi');
    expect(bekasi?.status).toBe('ACTIVE');

    // Duplicate code must be rejected
    expect(() => {
      repo.createBranch(
        {
          code: 'BKS', // Same as Bekasi
          name: 'Bekasi Barat',
        },
        'usr-admin-01'
      );
    }).toThrowError(/DUPLICATE_BRANCH_CODE|UNIQUE constraint failed/);
  });

  it('T01: Admin can create a new branch with valid fields', () => {
    const newBranch = repo.createBranch(
      {
        code: 'BDG',
        name: 'Bandung',
        address: 'Jl. Soekarno Hatta No. 123, Bandung',
      },
      'usr-admin-01'
    );

    expect(newBranch.id).toBeDefined();
    expect(newBranch.code).toBe('BDG');
    expect(newBranch.name).toBe('Bandung');
    expect(newBranch.status).toBe('ACTIVE');
    expect(newBranch.createdBy).toBe('usr-admin-01');

    // Audit trail verification
    const audits = repo.listAuditsForBranch(newBranch.id);
    expect(audits).toHaveLength(1);
    expect(audits[0].action).toBe('CREATE');
    expect(audits[0].actorUserId).toBe('usr-admin-01');
    expect(JSON.parse(audits[0].afterJson).code).toBe('BDG');
  });

  it('T02: Admin can update branch attributes and generates audit log', () => {
    const created = repo.createBranch(
      {
        code: 'SMG',
        name: 'Semarang',
        address: 'Kawasan Industri Candi',
      },
      'usr-admin-01'
    );

    const updated = repo.updateBranch(
      created.id,
      {
        name: 'Semarang Barat',
        address: 'Jl. Pandanaran No. 50',
      },
      'usr-admin-01'
    );

    expect(updated.name).toBe('Semarang Barat');
    expect(updated.address).toBe('Jl. Pandanaran No. 50');

    const audits = repo.listAuditsForBranch(created.id);
    expect(audits).toHaveLength(2);
    expect(audits[1].action).toBe('UPDATE');
    expect(JSON.parse(audits[1].beforeJson!).name).toBe('Semarang');
    expect(JSON.parse(audits[1].afterJson).name).toBe('Semarang Barat');
  });

  it('T09 & T10: rejects branch deactivation if active transactions blocker callback reports blockers', () => {
    const branch = repo.getBranchByCode('BKS');
    expect(branch).toBeDefined();

    // Blocker simulation: callback reports active transactions
    expect(() => {
      repo.deactivateBranch(branch!.id, 'usr-admin-01', () => ({
        activeCount: 3,
        reasons: ['2 dokumen dalam proses approval (IN_REVIEW)', '1 Payment Voucher belum lunas (UNPAID)'],
      }));
    }).toThrowError(/BRANCH_HAS_ACTIVE_TRANSACTIONS/);

    // Verify branch status remains ACTIVE
    const refreshed = repo.getBranchById(branch!.id);
    expect(refreshed?.status).toBe('ACTIVE');
  });

  it('deactivates and reactivates branch cleanly when no blockers exist', () => {
    const created = repo.createBranch(
      {
        code: 'PLB',
        name: 'Palembang',
      },
      'usr-admin-01'
    );

    // Deactivate with 0 blockers
    const deactivated = repo.deactivateBranch(created.id, 'usr-admin-01', () => ({
      activeCount: 0,
      reasons: [],
    }));
    expect(deactivated.status).toBe('INACTIVE');

    // Reactivate
    const reactivated = repo.activateBranch(created.id, 'usr-admin-01');
    expect(reactivated.status).toBe('ACTIVE');

    const audits = repo.listAuditsForBranch(created.id);
    expect(audits.map((a) => a.action)).toEqual(['CREATE', 'DEACTIVATE', 'ACTIVATE']);
  });

  it('T11: Concurrency coordinator protects against race conditions', async () => {
    const coordinator = new BranchConcurrencyCoordinator();
    const branchCode = 'SBY';
    const executionOrder: string[] = [];

    // Simulate concurrent deactivation and submission
    const p1 = coordinator.withBranchWriteLock(branchCode, async () => {
      executionOrder.push('write-start');
      await new Promise((resolve) => setTimeout(resolve, 50));
      executionOrder.push('write-finish');
      return 'deactivated';
    });

    const p2 = coordinator.withBranchReadLock(branchCode, async () => {
      executionOrder.push('read-start');
      return 'submitted';
    });

    const results = await Promise.all([p1, p2]);
    expect(results).toEqual(['deactivated', 'submitted']);
    expect(executionOrder).toEqual(['write-start', 'write-finish', 'read-start']);
  });
});

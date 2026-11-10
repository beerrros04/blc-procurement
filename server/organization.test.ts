import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { migrateOrganization, OrganizationRepository } from './organization';
import { createAppServer } from './app';
import { signJwt, SEEDED_USERS } from './auth';

const admin = signJwt({ id:'usr-admin-01', email:'admin@blc.co.id', fullName:'Admin', role:'ADMIN', branch:'Bekasi', branchScope:'*' });
const gm = signJwt({ id:'usr-ayu-01', email:'ayu@blc.co.id', fullName:'GM', role:'AYU', branch:'Bekasi', branchScope:'*' });

function setup(options?: { unverified?: boolean }) {
  const file = join(mkdtempSync(join(tmpdir(), 'blc-org-test-')), 'test.sqlite');
  const db = new DatabaseSync(file);
  db.exec("CREATE TABLE workspace (id INTEGER PRIMARY KEY, payload TEXT); INSERT INTO workspace VALUES(1, '{\"documents\":[]}')");
  db.close();
  migrateOrganization(file);
  migrateOrganization(file);
  const org = new OrganizationRepository(file);
  if (!options?.unverified) {
    org.verifyUser('usr-ayu-01', { proofReference: 'Test setup fixture verification', verifiedBy: 'usr-admin-01' });
    org.setUserLifecycle('usr-ayu-01', 'ACTIVE', 'usr-admin-01');
  }
  return { file, org };
}

async function request(app: ReturnType<typeof createAppServer>, path:string, token:string, method='GET', body?:unknown) {
  const r = await app.fetch(new Request('http://localhost/api/v1'+path,{method,headers:{authorization:`Bearer ${token}`, 'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}));
  return {status:r.status, body:await r.json() as any};
}

describe('organization assignment foundation', () => {
  it('does not create or migrate an unconfigured database', async () => {
    const file=join(mkdtempSync(join(tmpdir(),'blc-no-org-')),'missing.sqlite');
    const org=new OrganizationRepository(file);
    const app=createAppServer({organization:org});
    expect((await request(app,'/organization/units',admin)).status).toBe(503);
    expect((await request(app,'/organization/readiness',admin)).body.reachable).toBe(false);
    expect((await import('node:fs')).existsSync(file)).toBe(false);
  });

  it('reports readiness and fails closed for a partial schema', () => {
    const file=join(mkdtempSync(join(tmpdir(),'blc-partial-')),'test.sqlite');
    const db=new DatabaseSync(file); db.exec('CREATE TABLE org_assignments (id TEXT PRIMARY KEY)'); db.close();
    const org=new OrganizationRepository(file);
    expect(org.readiness().schema).toBe('INCOMPATIBLE');
    expect(()=>migrateOrganization(file)).toThrow();
    expect(()=>org.listAssignments()).toThrow();
  });

  it('requires migration for complete legacy schema and preserves assignments', () => {
    const {file,org}=setup(); const unit=org.createUnit('Legacy','usr-admin-01'); org.createAssignment(unit.id,'usr-ayu-01','usr-admin-01');
    const db=new DatabaseSync(file); db.exec('DROP TABLE org_schema_version'); db.close();
    expect(org.readiness().schema).toBe('MIGRATION_REQUIRED');
    migrateOrganization(file); migrateOrganization(file);
    expect(new OrganizationRepository(file).eligible(unit.id).userIds).toEqual(['usr-ayu-01']);
  });

  it('detects unresolved identity instead of silently omitting it', () => {
    const {org}=setup(); const unit=org.createUnit('Division','usr-admin-01');
    org.createAssignment(unit.id,'usr-ayu-01','usr-admin-01');
    const original=SEEDED_USERS['ayu@blc.co.id'];
    try {
      delete SEEDED_USERS['ayu@blc.co.id'];
      expect(org.eligible(unit.id)).toEqual({status:'IDENTITY_INVALID',userIds:[]});
      expect(org.readiness().identity).toBe('INVALID_REFERENCES');
    } finally {
      SEEDED_USERS['ayu@blc.co.id']=original;
    }
  });

  it('preserves fixed IDs across reload and is independent of display name and email', async () => {
    const first=(await import('./auth')).SEEDED_USERS;
    const ids=Object.values(first).map(u=>u.id);
    expect(new Set(ids).size).toBe(ids.length);
    const original=first['ayu@blc.co.id']; const oldName=original.fullName, oldEmail=original.email;
    try {
      original.fullName='Synthetic renamed'; original.email='renamed@example.test'; expect(original.id).toBe('usr-ayu-01');
    } finally {
      original.fullName=oldName; original.email=oldEmail;
    }
    const {org,file}=setup();const u=org.createUnit('Unit','usr-admin-01');org.createAssignment(u.id,original.id,'usr-admin-01');
    expect(new OrganizationRepository(file).eligible(u.id).userIds).toEqual([original.id]);
  });

  it('uses isolated synthetic multi-stage identity fixture only for assignment eligibility', () => {
    const synthetic={id:'fixture-reviewer',email:'fixture@example.test',fullName:'Fixture',role:'AYU' as const,branch:'Test',branchScope:'*',password:'fixture'};
    SEEDED_USERS[synthetic.email]=synthetic;
    try {
      const {org}=setup();
      org.verifyUser(synthetic.id, { proofReference: 'Synthetic test fixture verification', verifiedBy: 'usr-admin-01' });
      org.setUserLifecycle(synthetic.id, 'ACTIVE', 'usr-admin-01');
      const first=org.createUnit('Fixture division A','usr-admin-01'); const second=org.createUnit('Fixture division B','usr-admin-01');
      const stages={firstStageUnitId:first.id,subsequentReviewerUserId:synthetic.id,staffUserId:'fixture-staff'};
      org.createAssignment(first.id,synthetic.id,'usr-admin-01'); org.createAssignment(second.id,synthetic.id,'usr-admin-01');
      expect(org.eligible(stages.firstStageUnitId).userIds).toEqual([stages.subsequentReviewerUserId]);
      expect(org.eligible(second.id).userIds).toEqual([synthetic.id]);
    } finally {
      delete SEEDED_USERS[synthetic.email];
    }
  });

  it('detects colliding user IDs', () => {
    const {org}=setup(); const original=SEEDED_USERS['ayu@blc.co.id'].id;
    try {
      SEEDED_USERS['ayu@blc.co.id'].id=SEEDED_USERS['admin@blc.co.id'].id;
      expect(org.readiness().identity).toBe('DUPLICATE_IDS');
      expect(()=>org.createUnit('Division','usr-admin-01')).toThrow();
    } finally {
      SEEDED_USERS['ayu@blc.co.id'].id=original;
    }
  });

  it('migrates additively, persists distinct divisions, validates references and resolves only active assignments', () => {
    const {file, org}=setup(); const one=org.createUnit('Division A','usr-admin-01'); const two=org.createUnit('Division B','usr-admin-01');
    expect(org.eligible(one.id)).toEqual({status:'NO_ASSIGNMENT',userIds:[]});
    expect(()=>org.createAssignment(one.id,'missing','usr-admin-01')).toThrow();
    expect(()=>org.createAssignment('missing','usr-ayu-01','usr-admin-01')).toThrow();
    const a=org.createAssignment(one.id,'usr-ayu-01','usr-admin-01'); org.createAssignment(two.id,'usr-ayu-01','usr-admin-01');
    expect(()=>org.createAssignment(one.id,'usr-ayu-01','usr-admin-01')).toThrow();
    expect(org.eligible(one.id)).toEqual({status:'AVAILABLE',userIds:['usr-ayu-01']});
    org.updateAssignment(a.id,{active:false},'usr-admin-01');
    expect(org.eligible(one.id).status).toBe('NO_ASSIGNMENT');
    const reopened = new OrganizationRepository(file); expect(reopened.listAssignments().length).toBe(2);
    expect(reopened.eligible(two.id).userIds).toEqual(['usr-ayu-01']);
    const db=new DatabaseSync(file);
    expect(db.prepare('SELECT payload FROM workspace').get()).toEqual({payload:'{"documents":[]}'});
    expect((db.prepare('SELECT COUNT(*) AS n FROM org_assignment_audit').get() as any).n).toBe(3);
    db.close();
  });

  it('enforces admin mutations and returns assignment lookup without altering existing approval', async () => {
    const {org}=setup(); const app=createAppServer({organization:org});
    expect((await request(app,'/organization/units',gm,'POST',{name:'X'})).status).toBe(403);
    const u=await request(app,'/organization/units',admin,'POST',{name:'X'}); expect(u.status).toBe(201);
    const path='/organization/assignments'; expect((await request(app,path,gm,'POST',{unitId:u.body.unit.id,supervisorUserId:'usr-ayu-01'})).status).toBe(403);
    expect((await request(app,path,admin,'POST',{unitId:'bad',supervisorUserId:'usr-ayu-01'})).status).toBe(404);
    expect((await request(app,path,admin,'POST',{unitId:u.body.unit.id,supervisorUserId:'bad'})).status).toBe(422);
    const a=await request(app,path,admin,'POST',{unitId:u.body.unit.id,supervisorUserId:'usr-ayu-01'}); expect(a.status).toBe(201);
    expect((await request(app,path,admin,'POST',{unitId:u.body.unit.id,supervisorUserId:'usr-ayu-01'})).status).toBe(409);
    expect((await request(app,`/organization/units/${u.body.unit.id}/assignments`,admin)).body.assignments.length).toBe(1);
    expect((await request(app,path+'/'+a.body.assignment.id,gm,'PATCH',{active:false})).status).toBe(403);
    expect((await request(app,path+'/'+a.body.assignment.id+'/deactivate',gm,'POST',{})).status).toBe(403);
    expect((await request(app,`/organization/units/${u.body.unit.id}/eligible`,admin)).body.userIds).toEqual(['usr-ayu-01']);
    expect((await request(app,path+'/'+a.body.assignment.id,admin,'PATCH',{active:false})).status).toBe(200);
    expect((await request(app,path+'/'+a.body.assignment.id,admin,'PATCH',{active:true})).status).toBe(200);
    expect((await request(app,path+'/'+a.body.assignment.id+'/deactivate',admin,'POST',{})).status).toBe(200);
    expect((await request(app,`/organization/units/${u.body.unit.id}/eligible`,admin)).body.status).toBe('NO_ASSIGNMENT');
  });

  it('enforces admin authorization for workflow stage assignments and handles deactivation', async () => {
    const { org } = setup();
    const app = createAppServer({ organization: org });

    // Non-admin is rejected 403
    expect((await request(app, '/organization/stage-assignments', gm, 'GET')).status).toBe(403);
    expect((await request(app, '/organization/stage-assignments', gm, 'POST', { stageKey: 'STAGE_2_FINANCE', assignedUserId: 'usr-ayu-01' })).status).toBe(403);

    // Admin lists stage assignments
    const listRes = await request(app, '/organization/stage-assignments', admin, 'GET');
    expect(listRes.status).toBe(200);

    // Admin sets Stage 2 assignment
    const setRes = await request(app, '/organization/stage-assignments', admin, 'POST', {
      stageKey: 'STAGE_2_FINANCE',
      assignedUserId: 'usr-ayu-01',
    });
    expect(setRes.status).toBe(201);
    expect(setRes.body.stageAssignment.stage_key).toBe('STAGE_2_FINANCE');
    expect(setRes.body.stageAssignment.assigned_user_id).toBe('usr-ayu-01');

    // Admin deactivates stage assignment
    const deactRes = await request(app, '/organization/stage-assignments/STAGE_2_FINANCE/deactivate', admin, 'POST', {});
    expect(deactRes.status).toBe(200);
    expect(deactRes.body.stageAssignment.active).toBe(0);
  });
});

describe('HF02-A Revision 01 Persistent Identity Foundation', () => {
  it('retains canonical user ID and metadata across database reloads and restarts', () => {
    const { file, org: org1 } = setup({ unverified: true });
    const user = org1.createUser({
      email: 'staff.finance@blc.co.id',
      fullName: 'Staff Finance Baru',
      role: 'KEUANGAN',
      branch: 'Bekasi',
      branchScope: 'Bekasi',
    }, 'usr-admin-01');

    expect(user.id).toBeDefined();
    expect(user.status).toBe('UNVERIFIED');
    expect(user.verificationStatus).toBe('UNVERIFIED');

    org1.verifyUser(user.id, { proofReference: 'Workbook C25 + ID Card', verifiedBy: 'usr-admin-01' });
    org1.setUserLifecycle(user.id, 'ACTIVE', 'usr-admin-01');

    // Reopen database in fresh instance (simulating restart)
    const org2 = new OrganizationRepository(file);
    const retrieved = org2.getUser(user.id);
    expect(retrieved.id).toBe(user.id);
    expect(retrieved.fullName).toBe('Staff Finance Baru');
    expect(retrieved.status).toBe('ACTIVE');
    expect(retrieved.verificationStatus).toBe('VERIFIED');
    expect(retrieved.verificationProof).toBe('Workbook C25 + ID Card');
    expect(retrieved.verifiedBy).toBe('usr-admin-01');
  });

  it('preserves immutable user ID when full name, email, or branch are updated', () => {
    const { org } = setup({ unverified: true });
    const user = org.createUser({
      email: 'original.email@blc.co.id',
      fullName: 'Nama Asli',
      role: 'PEMOHON',
    }, 'usr-admin-01');

    const originalId = user.id;
    const updated = org.updateUser(originalId, {
      fullName: 'Nama Baru Setelah Menikah',
      email: 'updated.email@blc.co.id',
      branch: 'Surabaya',
    }, 'usr-admin-01');

    expect(updated.id).toBe(originalId);
    expect(updated.fullName).toBe('Nama Baru Setelah Menikah');
    expect(updated.email).toBe('updated.email@blc.co.id');
    expect(updated.branch).toBe('Surabaya');

    // Attempting to change ID must be rejected
    expect(() => org.updateUser(originalId, { id: 'new-id' } as any, 'usr-admin-01')).toThrow();
  });

  it('rejects duplicate user identifiers and duplicate emails', () => {
    const { org } = setup();
    expect(() => org.createUser({
      id: 'duplicate-user-id',
      email: 'user1@blc.co.id',
      fullName: 'User 1',
    }, 'usr-admin-01')).not.toThrow();

    // Duplicate ID
    expect(() => org.createUser({
      id: 'duplicate-user-id',
      email: 'user2@blc.co.id',
      fullName: 'User 2',
    }, 'usr-admin-01')).toThrow();

    // Duplicate Email
    expect(() => org.createUser({
      email: 'user1@blc.co.id',
      fullName: 'User Duplicate Email',
    }, 'usr-admin-01')).toThrow();
  });

  it('permanently retires identifiers so they can never be reused', () => {
    const { org } = setup();
    const user = org.createUser({
      email: 'retiree@blc.co.id',
      fullName: 'Karyawan Pensiun',
    }, 'usr-admin-01');

    const retiredId = user.id;
    org.retireUser(retiredId, 'Pensiun dini per SK 100/2026', 'usr-admin-01');

    const retiredUser = org.getUser(retiredId);
    expect(retiredUser.status).toBe('INACTIVE');

    // Attempting to re-register with retired ID must fail
    expect(() => org.createUser({
      id: retiredId,
      email: 'replacement@blc.co.id',
      fullName: 'Pengganti',
    }, 'usr-admin-01')).toThrow();
  });

  it('rejects assignment for unverified user and denies approval eligibility', () => {
    const { file, org } = setup({ unverified: true });
    const unit = org.createUnit('Unverified Unit', 'usr-admin-01');

    // Creating assignment for unverified user usr-ayu-01 throws USER_UNVERIFIED
    expect(() => org.createAssignment(unit.id, 'usr-ayu-01', 'usr-admin-01')).toThrow();

    // Force an assignment row into the database directly to test fail-closed eligibility
    const db = new DatabaseSync(file);
    db.prepare('INSERT INTO org_assignments VALUES(?,?,?,?,?,?,?,?)').run(
      'forced-unverified-assign', unit.id, 'usr-ayu-01', 1, new Date().toISOString(), 'admin', new Date().toISOString(), 'admin'
    );
    db.close();

    const result = org.eligible(unit.id);
    expect(result.status).toBe('IDENTITY_UNVERIFIED');
    expect(result.userIds).toEqual([]);
  });

  it('denies approval eligibility for inactive users and prevents new assignments', () => {
    const { org } = setup();
    const unit = org.createUnit('Inactive Unit Test', 'usr-admin-01');
    const assignment = org.createAssignment(unit.id, 'usr-ayu-01', 'usr-admin-01');

    expect(org.eligible(unit.id).status).toBe('AVAILABLE');

    // Deactivate user
    org.setUserLifecycle('usr-ayu-01', 'INACTIVE', 'usr-admin-01', 'Resigned');

    // Eligibility must now fail-closed
    expect(org.eligible(unit.id).status).toBe('IDENTITY_INACTIVE');
    expect(org.eligible(unit.id).userIds).toEqual([]);

    // Attempting new assignment with inactive user is rejected
    const unit2 = org.createUnit('Second Unit', 'usr-admin-01');
    expect(() => org.createAssignment(unit2.id, 'usr-ayu-01', 'usr-admin-01')).toThrow();
  });

  it('identifies assignments needing review when supervisor is unverified or inactive', () => {
    const { org } = setup();
    const unit = org.createUnit('Audit Review Unit', 'usr-admin-01');
    org.createAssignment(unit.id, 'usr-ayu-01', 'usr-admin-01');

    // Initially clean
    expect(org.listAssignmentsNeedingReview()).toHaveLength(0);

    // Deactivate supervisor
    org.setUserLifecycle('usr-ayu-01', 'INACTIVE', 'usr-admin-01');

    const needingReview = org.listAssignmentsNeedingReview();
    expect(needingReview).toHaveLength(1);
    expect(needingReview[0].reason).toBe('SUPERVISOR_INACTIVE');
    expect(needingReview[0].supervisorUserId).toBe('usr-ayu-01');
    expect(needingReview[0].unitName).toBe('Audit Review Unit');
  });

  it('allows Admin to verify identity with proof metadata and manage lifecycle via REST API', async () => {
    const { org } = setup({ unverified: true });
    const app = createAppServer({ organization: org });

    // 1. Create new user as Admin
    const createRes = await request(app, '/organization/users', admin, 'POST', {
      email: 'calon.atasan@blc.co.id',
      fullName: 'Calon Atasan',
      role: 'ATASAN',
      branch: 'Bekasi',
      branchScope: '*',
    });
    expect(createRes.status).toBe(201);
    const userId = createRes.body.user.id;
    expect(createRes.body.user.verificationStatus).toBe('UNVERIFIED');
    expect(createRes.body.user.status).toBe('UNVERIFIED');

    // 2. Admin verifies identity with proof reference
    const verifyRes = await request(app, `/organization/users/${userId}/verify`, admin, 'POST', {
      proofReference: 'Workbook Organization_BLC Row 18 + KTP No. 3275...',
    });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.user.verificationStatus).toBe('VERIFIED');
    expect(verifyRes.body.user.verificationProof).toBe('Workbook Organization_BLC Row 18 + KTP No. 3275...');
    expect(verifyRes.body.user.verifiedBy).toBe('usr-admin-01');

    // 3. Admin activates account
    const lifecycleRes = await request(app, `/organization/users/${userId}/lifecycle`, admin, 'POST', {
      status: 'ACTIVE',
    });
    expect(lifecycleRes.status).toBe(200);
    expect(lifecycleRes.body.user.status).toBe('ACTIVE');

    // 4. Admin creates unit and assigns the now active & verified user
    const unitRes = await request(app, '/organization/units', admin, 'POST', { name: 'Divisi Operasional' });
    const assignRes = await request(app, '/organization/assignments', admin, 'POST', {
      unitId: unitRes.body.unit.id,
      supervisorUserId: userId,
    });
    expect(assignRes.status).toBe(201);

    // 5. Eligible lookup succeeds
    const eligibleRes = await request(app, `/organization/units/${unitRes.body.unit.id}/eligible`, admin);
    expect(eligibleRes.body.status).toBe('AVAILABLE');
    expect(eligibleRes.body.userIds).toEqual([userId]);

    // 6. Admin deactivates user -> eligible becomes IDENTITY_INACTIVE
    await request(app, `/organization/users/${userId}/deactivate`, admin, 'POST', { reason: 'Mutasi cabang' });
    const eligibleAfterDeact = await request(app, `/organization/units/${unitRes.body.unit.id}/eligible`, admin);
    expect(eligibleAfterDeact.body.status).toBe('IDENTITY_INACTIVE');

    // 7. Review needed endpoint lists this assignment
    const reviewRes = await request(app, '/organization/assignments/review-needed', admin);
    expect(reviewRes.body.reviewItems.some((r: any) => r.supervisorUserId === userId)).toBe(true);
  });

  it('rejects non-Admin requests for all identity management endpoints with 403', async () => {
    const { org } = setup();
    const app = createAppServer({ organization: org });

    expect((await request(app, '/organization/users', gm, 'GET')).status).toBe(403);
    expect((await request(app, '/organization/users', gm, 'POST', { email: 'x@b.co', fullName: 'X' })).status).toBe(403);
    expect((await request(app, '/organization/users/usr-ayu-01', gm, 'GET')).status).toBe(403);
    expect((await request(app, '/organization/users/usr-ayu-01', gm, 'PATCH', { fullName: 'Hacked' })).status).toBe(403);
    expect((await request(app, '/organization/users/usr-ayu-01/verify', gm, 'POST', { proofReference: 'Fake' })).status).toBe(403);
    expect((await request(app, '/organization/users/usr-ayu-01/lifecycle', gm, 'POST', { status: 'INACTIVE' })).status).toBe(403);
    expect((await request(app, '/organization/users/usr-ayu-01/deactivate', gm, 'POST', {})).status).toBe(403);
    expect((await request(app, '/organization/assignments/review-needed', gm, 'GET')).status).toBe(403);
  });

  it('ensures migration is idempotent, safe, and repeatable', () => {
    const { file, org } = setup();
    for (let i = 0; i < 5; i++) {
      expect(() => migrateOrganization(file)).not.toThrow();
    }
    expect(org.readiness().schema).toBe('COMPATIBLE');
  });

  it('T03: validates user primary_branch_id and rejects inactive branch on create/update', async () => {
    const { file, org } = setup();
    const db = new DatabaseSync(file);
    const { BranchRepository } = await import('./branch-engine');
    const branchRepo = new BranchRepository(db);

    // Verify seeded users have primaryBranchId reconciled
    const adminUser = org.getUser('usr-admin-01');
    expect(adminUser.primaryBranchId).toBe('brc-bks');
    expect(adminUser.branch).toBe('Bekasi');

    const surabayaUser = org.getUser('usr-atasan-01');
    expect(surabayaUser.primaryBranchId).toBe('brc-sby');
    expect(surabayaUser.branch).toBe('Surabaya');

    // Deactivate Cibinong
    branchRepo.deactivateBranch('brc-cbn', 'usr-admin-01');

    // Creating user with inactive branch must throw 422 BRANCH_INACTIVE
    expect(() => {
      org.createUser({
        email: 'staff.cibinong@blc.co.id',
        fullName: 'Staff Cibinong',
        branch: 'Cibinong',
      }, 'usr-admin-01');
    }).toThrowError(/BRANCH_INACTIVE/);

    // Creating user with active branch works and sets primaryBranchId
    const created = org.createUser({
      email: 'staff.medan@blc.co.id',
      fullName: 'Staff Medan',
      branch: 'Medan',
    }, 'usr-admin-01');
    expect(created.branch).toBe('Medan');
    expect(created.primaryBranchId).toBe('brc-mdn');

    // Updating user to inactive branch must throw 422 BRANCH_INACTIVE
    expect(() => {
      org.updateUser(created.id, { branch: 'Cibinong' }, 'usr-admin-01');
    }).toThrowError(/BRANCH_INACTIVE/);

    db.close();
  });
});

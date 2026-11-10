import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AnyDocument, DocType, PVPaymentDetails, UserRole } from '../src/types/document';
import { authenticateCredentials, verifyJwt, SEEDED_USERS, type AuthUser } from './auth';
import { DomainError, ProcurementRepository, type PvGenerationOptions } from './repository';
import type { OrganizationRepository, AppUserRecord } from './organization';
import type { ApprovalStageEngine } from './stage-engine';
import {
  LocalAttachmentStorage,
  type AttachmentCategory,
} from './storage';

export interface AppServerOptions {
  repository?: ProcurementRepository;
  storage?: LocalAttachmentStorage;
  organization?: OrganizationRepository;
  stageEngine?: ApprovalStageEngine;
  stageEngineEnabled?: boolean;
}

export interface BLCAppServer extends Server {
  readonly repo: ProcurementRepository;
  readonly storage: LocalAttachmentStorage;
  fetch: (req: Request) => Promise<Response>;
}

function jsonResponse(body: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

function extractAuthUser(req: Request): AuthUser {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    throw new DomainError('Token autentikasi Bearer wajib disertakan.', 401, 'UNAUTHORIZED');
  }
  const token = authHeader.slice(7).trim();
  const claims = verifyJwt(token);
  if (!claims) {
    throw new DomainError('Token JWT tidak valid atau telah kedaluwarsa.', 401, 'INVALID_TOKEN');
  }
  return {
    id: claims.id,
    email: claims.email,
    fullName: claims.fullName,
    role: claims.role,
    branch: claims.branch,
    branchScope: claims.branchScope,
  };
}

function requireOwner(user: AuthUser, document: { ownerId?: string; docType?: DocType }): void {
  if (document.docType === 'PV' && user.role === 'KEUANGAN') {
    return;
  }
  if (user.role !== 'PEMOHON' || document.ownerId !== user.id) {
    throw new DomainError('Hanya pengaju pemilik dokumen yang dapat melakukan tindakan ini.', 403, 'FORBIDDEN_OWNER');
  }
}

function canViewAttachments(user: AuthUser, document: { ownerId?: string; stage1ApproverEmail?: string }): boolean {
  if (user.role === 'PEMOHON') return document.ownerId === user.id;
  if (user.role === 'ATASAN') return document.stage1ApproverEmail?.trim().toLowerCase() === user.email.trim().toLowerCase();
  return true;
}

function visibleDocument(user: AuthUser, document: AnyDocument): AnyDocument {
  if (user.role !== 'ATASAN' && (user.role !== 'PEMOHON' || document.ownerId === user.id)) return document;
  const copy = structuredClone(document);
  if (!canViewAttachments(user, document)) delete copy.attachments;
  if (copy.docType === 'PO' || copy.docType === 'AV') delete copy.bankDetails;
  if (copy.docType === 'RB' || copy.docType === 'PV') copy.beneficiaryBank = { bankName: '', accountNumber: '', accountHolder: '' };
  if (copy.docType === 'RC') delete copy.reimbursementBank;
  if (copy.docType === 'PV' && copy.paymentDetails) copy.paymentDetails.sourceBank = '';
  return copy;
}

async function parseJsonBody<T = Record<string, unknown>>(req: Request): Promise<T> {
  const text = await req.text();
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new DomainError('Payload JSON tidak valid.', 400, 'INVALID_JSON');
  }
}

export function createAppServer(options?: AppServerOptions): BLCAppServer {
  const repo = options?.repository ?? new ProcurementRepository();
  const storage = options?.storage ?? new LocalAttachmentStorage();
  const stageEngine = options?.stageEngine;
  const stageEngineEnabled = options?.stageEngineEnabled ?? (process.env.ENABLE_STAGE_ENGINE === 'true');

  async function handleFetch(req: Request): Promise<Response> {
    const url = new URL(req.url, 'http://localhost');
    const method = req.method.toUpperCase();
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      // 1. POST /api/v1/auth/login
      if (method === 'POST' && path === '/api/v1/auth/login') {
        const body = await parseJsonBody<{
          email?: string;
          password?: string;
          role?: UserRole;
        }>(req);
        const result = authenticateCredentials(body);
        if (!result) {
          throw new DomainError(
            'Email, peran, atau kata sandi tidak valid.',
            401,
            'INVALID_CREDENTIALS'
          );
        }
        return jsonResponse(result, 200);
      }

      // Semua endpoint /api/v1/* di bawah ini wajib terautentikasi JWT
      const user = extractAuthUser(req);

      // Organizational assignments are deliberately separate from document approval.
      if (path.startsWith('/api/v1/organization/')) {
        if (user.role !== 'ADMIN') throw new DomainError('Akses organisasi hanya untuk Admin.', 403, 'FORBIDDEN_ROLE');
        const org = options?.organization;
        if (path === '/api/v1/organization/readiness' && method === 'GET') return jsonResponse(org ? org.readiness() : { configured: false, reachable: false, schema: 'UNAVAILABLE', identity: 'UNKNOWN', assignments: 'UNKNOWN' });
        if (!org) throw new DomainError('Penyimpanan organisasi belum dikonfigurasi.', 503, 'ORGANIZATION_UNAVAILABLE');
        if (path === '/api/v1/organization/units') {
          if (method === 'GET') return jsonResponse({ units: org.listUnits() });
          if (method === 'POST') { const body = await parseJsonBody(req); if (!body || typeof body !== 'object' || Array.isArray(body)) throw new DomainError('Payload harus objek.', 422, 'INVALID_INPUT'); return jsonResponse({ unit: org.createUnit(body.name, user.id) }, 201); }
        }
        if (path === '/api/v1/organization/assignments/review-needed' && method === 'GET') {
          return jsonResponse({ reviewItems: org.listAssignmentsNeedingReview() });
        }
        if (path === '/api/v1/organization/assignments') {
          if (method === 'GET') return jsonResponse({ assignments: org.listAssignments(url.searchParams.get('unitId') || undefined) });
          if (method === 'POST') { const body = await parseJsonBody(req); if (!body || typeof body !== 'object' || Array.isArray(body)) throw new DomainError('Payload harus objek.', 422, 'INVALID_INPUT'); return jsonResponse({ assignment: org.createAssignment(body.unitId, body.supervisorUserId, user.id) }, 201); }
        }
        const byUnit = path.match(/^\/api\/v1\/organization\/units\/([^/]+)\/(assignments|eligible)$/);
        if (byUnit && method === 'GET') { const id = decodeURIComponent(byUnit[1]); return jsonResponse(byUnit[2] === 'eligible' ? org.eligible(id) : { assignments: org.listAssignments(id) }); }
        const assignment = path.match(/^\/api\/v1\/organization\/assignments\/([^/]+)(\/deactivate)?$/);
        if (assignment && assignment[1] !== 'review-needed' && ((method === 'PATCH' && !assignment[2]) || (method === 'POST' && assignment[2]))) {
          const body = assignment[2] ? { active: false } : await parseJsonBody(req);
          if (!body || typeof body !== 'object' || Array.isArray(body)) throw new DomainError('Payload harus objek.', 422, 'INVALID_INPUT');
          if (!assignment[2] && !['unitId','supervisorUserId','active'].some(k => Object.hasOwn(body,k))) throw new DomainError('Perubahan wajib diisi.', 422, 'INVALID_INPUT');
          return jsonResponse({ assignment: org.updateAssignment(decodeURIComponent(assignment[1]), body, user.id) });
        }

        // Explicit Workflow Stage Assignment Management (HF02-B Final Revision 02)
        if (path === '/api/v1/organization/stage-assignments') {
          if (method === 'GET') {
            return jsonResponse({ stageAssignments: org.listStageAssignments() });
          }
          if (method === 'POST') {
            const body = await parseJsonBody<Record<string, unknown>>(req);
            if (!body || typeof body !== 'object' || Array.isArray(body)) throw new DomainError('Payload harus objek.', 422, 'INVALID_INPUT');
            return jsonResponse({ stageAssignment: org.setStageAssignment(body.stageKey, body.assignedUserId, user.id) }, 201);
          }
        }
        const stageAssignmentDeact = path.match(/^\/api\/v1\/organization\/stage-assignments\/([^/]+)\/deactivate$/);
        if (stageAssignmentDeact && method === 'POST') {
          return jsonResponse({ stageAssignment: org.deactivateStageAssignment(decodeURIComponent(stageAssignmentDeact[1]), user.id) });
        }

        // Identity Management Endpoints (ADR-ID-001, ADR-ID-002, ADR-ID-003)
        if (path === '/api/v1/organization/users') {
          if (method === 'GET') {
            const status = url.searchParams.get('status') as any;
            const verificationStatus = url.searchParams.get('verificationStatus') as any;
            return jsonResponse({ users: org.listUsers({ status, verificationStatus }) });
          }
          if (method === 'POST') {
            const body = await parseJsonBody<Record<string, unknown>>(req);
            if (!body || typeof body !== 'object' || Array.isArray(body)) throw new DomainError('Payload harus objek.', 422, 'INVALID_INPUT');
            return jsonResponse({ user: org.createUser(body as any, user.id) }, 201);
          }
        }

        const userAction = path.match(/^\/api\/v1\/organization\/users\/([^/]+)(\/(verify|lifecycle|deactivate|retire))?$/);
        if (userAction) {
          const targetUserId = decodeURIComponent(userAction[1]);
          const action = userAction[3];

          if (method === 'GET' && !action) {
            return jsonResponse({ user: org.getUser(targetUserId) });
          }
          if (method === 'PATCH' && !action) {
            const body = await parseJsonBody<Record<string, unknown>>(req);
            if (!body || typeof body !== 'object' || Array.isArray(body)) throw new DomainError('Payload harus objek.', 422, 'INVALID_INPUT');
            return jsonResponse({ user: org.updateUser(targetUserId, body as any, user.id) });
          }
          if (method === 'POST' && action === 'verify') {
            const body = await parseJsonBody<{ proofReference?: unknown }>(req);
            if (!body || typeof body !== 'object' || Array.isArray(body)) throw new DomainError('Payload harus objek.', 422, 'INVALID_INPUT');
            return jsonResponse({ user: org.verifyUser(targetUserId, { proofReference: body.proofReference, verifiedBy: user.id }) });
          }
          if (method === 'POST' && action === 'lifecycle') {
            const body = await parseJsonBody<{ status?: unknown; reason?: string }>(req);
            if (!body || typeof body !== 'object' || Array.isArray(body)) throw new DomainError('Payload harus objek.', 422, 'INVALID_INPUT');
            return jsonResponse({ user: org.setUserLifecycle(targetUserId, body.status, user.id, body.reason) });
          }
          if (method === 'POST' && action === 'deactivate') {
            const body = await parseJsonBody<{ reason?: string }>(req);
            return jsonResponse({ user: org.setUserLifecycle(targetUserId, 'INACTIVE', user.id, body?.reason) });
          }
          if (method === 'POST' && action === 'retire') {
            const body = await parseJsonBody<{ reason?: unknown }>(req);
            if (!body || typeof body !== 'object' || Array.isArray(body)) throw new DomainError('Payload harus objek.', 422, 'INVALID_INPUT');
            org.retireUser(targetUserId, body.reason, user.id);
            return jsonResponse({ success: true });
          }
        }
      }

      // 2. GET /api/v1/me
      if (method === 'GET' && path === '/api/v1/me') {
        return jsonResponse({ user }, 200);
      }

      // 3. GET /api/v1/dashboard/metrics
      if (method === 'GET' && path === '/api/v1/dashboard/metrics') {
        const metrics = repo.getDashboardMetrics(user.role, user.email);
        return jsonResponse({ metrics, user }, 200);
      }

      // 4. GET /api/v1/documents & POST /api/v1/documents
      if (path === '/api/v1/documents') {
        if (method === 'GET') {
          const docType = (url.searchParams.get('docType') as DocType | null) || undefined;
          const status = url.searchParams.get('status') || undefined;
          const search = url.searchParams.get('search') || undefined;
          const branchParam = url.searchParams.get('branch') || undefined;
          const effectiveBranch = branchParam;

          const documents = repo.listDocuments({
            docType,
            status,
            branch: effectiveBranch,
            search,
          });
          return jsonResponse({ documents: documents.map((document) => visibleDocument(user, document)) }, 200);
        }

        if (method === 'POST') {
          const body = await parseJsonBody<{ docType: DocType } & Record<string, unknown>>(req);
          if (!body.docType) {
            throw new DomainError('Parameter docType wajib diisi.', 400, 'MISSING_DOC_TYPE');
          }
          if (user.role !== 'PEMOHON') throw new DomainError('Hanya pengaju yang dapat membuat pengajuan.', 403, 'FORBIDDEN_ROLE');
          const created = repo.createDocument({ ...body, ownerId: user.id }, user.fullName);
          return jsonResponse({ document: visibleDocument(user, created) }, 201);
        }
      }

      // 5. GET / PUT /api/v1/documents/:id
      const docMatch = path.match(/^\/api\/v1\/documents\/([^/]+)$/);
      if (docMatch) {
        const docId = decodeURIComponent(docMatch[1]);
        if (method === 'GET') {
          const document = repo.getDocumentById(docId);
          const attachments = repo.listAttachments(docId);
          const visibleAttachments = !canViewAttachments(user, document) ? [] : attachments.map(({ storagePath: _storagePath, ...attachment }) => attachment);
          return jsonResponse({ document: visibleDocument(user, document), attachments: visibleAttachments }, 200);
        }
        if (method === 'PUT') {
          requireOwner(user, repo.getDocumentById(docId));
          const body = await parseJsonBody<Record<string, unknown>>(req);
          const ifMatch = req.headers.get('if-match');
          const expectedVersion =
            typeof body.expectedVersion === 'number'
              ? body.expectedVersion
              : ifMatch
              ? Number(ifMatch)
              : undefined;

          const updated = repo.updateDocument(
            docId,
            { ...body, expectedVersion },
            user.fullName
          );
          return jsonResponse({ document: visibleDocument(user, updated) }, 200);
        }
      }

      // 6. POST /api/v1/documents/:id/submit
      const submitMatch = path.match(/^\/api\/v1\/documents\/([^/]+)\/submit$/);
      if (method === 'POST' && submitMatch) {
        const docId = decodeURIComponent(submitMatch[1]);
        const submission = repo.getDocumentById(docId);
        requireOwner(user, submission);
        const body = await parseJsonBody<{
          expectedVersion?: number;
          supervisorUserId?: string;
          unitId?: string;
        }>(req);
        const idempotencyKey = req.headers.get('idempotency-key') || undefined;

        if (stageEngineEnabled && stageEngine) {
          if (submission.docType === 'GR') {
            const submitted = repo.submitDocument(docId, user.fullName, {
              expectedVersion: body.expectedVersion,
              idempotencyKey,
            });
            return jsonResponse({ document: visibleDocument(user, submitted) }, 200);
          }

          if (submission.docType === 'PV') {
            if (user.role !== 'KEUANGAN') {
              throw new DomainError('Hanya peran KEUANGAN yang dapat mengajukan Payment Voucher.', 403, 'FORBIDDEN_ROLE');
            }
            if (submission.sourceDocId) {
              const parentDoc = repo.getDocumentById(submission.sourceDocId);
              if (parentDoc.status !== 'APPROVED') {
                throw new DomainError('Dokumen induk PO/AV/RB harus disetujui sebelum mengajukan PV.', 422, 'PARENT_DOCUMENT_NOT_APPROVED');
              }
            }
            if (!options?.organization) {
              throw new DomainError('Penyimpanan organisasi belum dikonfigurasi.', 503, 'ORGANIZATION_UNAVAILABLE');
            }
            stageEngine.createSubmissionWorkflow(
              {
                documentId: docId,
                docType: submission.docType,
                docNumber: submission.docNumber,
                applicantUserId: user.id,
              },
              options.organization
            );
            const submitted = repo.submitDocument(docId, user.fullName, {
              expectedVersion: body.expectedVersion,
              idempotencyKey,
            });
            return jsonResponse({ document: visibleDocument(user, submitted) }, 200);
          }

          // PR, PO, AV, RB
          let supervisorUserId = body.supervisorUserId?.trim();
          if (!supervisorUserId && submission.stage1ApproverEmail && options?.organization) {
            const matched = options.organization.listUsers().find(
              (u) => u.email.toLowerCase() === submission.stage1ApproverEmail?.toLowerCase()
            );
            if (matched) {
              supervisorUserId = matched.id;
            }
          }

          if (!supervisorUserId) {
            throw new DomainError('Pilih atasan langsung yang memiliki penugasan sah.', 422, 'SUPERVISOR_REQUIRED');
          }

          if (!options?.organization) {
            throw new DomainError('Penyimpanan organisasi belum dikonfigurasi.', 503, 'ORGANIZATION_UNAVAILABLE');
          }

          // Create submission workflow in stageEngine - validates organizational assignment and identity
          stageEngine.createSubmissionWorkflow(
            {
              documentId: docId,
              docType: submission.docType,
              docNumber: submission.docNumber,
              unitId: body.unitId,
              applicantUserId: user.id,
              supervisorUserId,
            },
            options.organization
          );

          const submitted = repo.submitDocument(docId, user.fullName, {
            expectedVersion: body.expectedVersion,
            idempotencyKey,
          });
          return jsonResponse({ document: visibleDocument(user, submitted) }, 200);
        }

        // Legacy submission logic
        if (submission.docType !== 'GR' && submission.docType !== 'PV') {
          const approverEmail = submission.stage1ApproverEmail?.trim().toLowerCase();
          if (!approverEmail || approverEmail === user.email.toLowerCase() || SEEDED_USERS[approverEmail]?.role !== 'ATASAN') {
            throw new DomainError('Pilih email atasan yang tersedia dan berbeda dari pengaju.', 422, 'INVALID_APPROVER');
          }
        }
        const submitted = repo.submitDocument(docId, user.fullName, {
          expectedVersion: body.expectedVersion,
          idempotencyKey,
        });
        return jsonResponse({ document: visibleDocument(user, submitted) }, 200);
      }

      // 7. POST /api/v1/documents/:id/decisions
      const decisionMatch = path.match(/^\/api\/v1\/documents\/([^/]+)\/decisions$/);
      if (method === 'POST' && decisionMatch) {
        const docId = decodeURIComponent(decisionMatch[1]);
        const decisionDoc = repo.getDocumentById(docId);
        if (decisionDoc.ownerId === user.id || (user.role === 'ATASAN' && decisionDoc.stage1ApproverEmail?.toLowerCase() !== user.email.toLowerCase())) {
          throw new DomainError('Anda bukan penyetuju yang ditugaskan untuk dokumen ini.', 403, 'FORBIDDEN_APPROVER');
        }
        const body = await parseJsonBody<{
          decision: 'APPROVE' | 'REJECT';
          comment?: string;
          expectedVersion?: number;
        }>(req);

        if (body.decision !== 'APPROVE' && body.decision !== 'REJECT') {
          throw new DomainError(
            'Keputusan (decision) harus bernilai APPROVE atau REJECT.',
            400,
            'INVALID_DECISION'
          );
        }

        const idempotencyKey = req.headers.get('idempotency-key') || undefined;
        const decided = repo.recordDecision({
          documentId: docId,
          role: user.role,
          actor: user.fullName,
          decision: body.decision,
          comment: body.comment,
          expectedVersion: body.expectedVersion,
          idempotencyKey,
        });
        return jsonResponse({ document: visibleDocument(user, decided) }, 200);
      }

      // HF02-C: Isolated Approval Stage Engine Endpoints (REV-C02)
      if (path.startsWith('/api/v1/stages/') || path.match(/^\/api\/v1\/documents\/[^/]+\/workflow$/)) {
        if (!stageEngineEnabled || !stageEngine) {
          throw new DomainError(
            'Integrasi approval stage engine belum diaktifkan (feature disabled).',
            404,
            'STAGE_ENGINE_DISABLED'
          );
        }
      }

      // POST /api/v1/stages/:stageId/decisions
      const stageDecisionMatch = path.match(/^\/api\/v1\/stages\/([^/]+)\/decisions$/);
      if (method === 'POST' && stageDecisionMatch) {
        if (!stageEngine) {
          throw new DomainError('Engine persetujuan tahap belum dikonfigurasi.', 503, 'STAGE_ENGINE_UNAVAILABLE');
        }
        const stageId = decodeURIComponent(stageDecisionMatch[1]);
        const body = await parseJsonBody<{
          decision: 'APPROVE' | 'REJECT';
          comment?: string;
        }>(req);

        if (body.decision !== 'APPROVE' && body.decision !== 'REJECT') {
          throw new DomainError('Keputusan (decision) harus bernilai APPROVE atau REJECT.', 400, 'INVALID_DECISION');
        }

        const idempotencyKey =
          req.headers.get('x-idempotency-key') || req.headers.get('idempotency-key') || undefined;

        // Fetch stage & workflow to coordinate sync
        const targetStage = stageEngine.getStage(stageId);
        const wf = stageEngine.getWorkflow(targetStage.workflowId);

        let orgUser: AppUserRecord | undefined;
        if (options?.organization) {
          try {
            orgUser = options.organization.getUser(user.id);
          } catch {
            // fallback
          }
        }

        const syncId = stageEngine.prepareCrossStorageSync({
          documentId: wf.documentId,
          workflowId: wf.id,
          stageId: targetStage.id,
          operationType: body.decision,
          stageState: { decision: body.decision, approverUserId: user.id },
        });

        try {
          const result = stageEngine.recordStageDecision(
            {
              workflowId: targetStage.workflowId,
              stageId,
              approverUserId: user.id,
              decision: body.decision,
              comment: body.comment,
              idempotencyKey,
              authenticatedUser: orgUser,
            },
            options?.organization
          );

          // Synchronize document lifecycle to repository if document exists
          if (repo) {
            try {
              const doc = (repo as any).state?.documents?.find((d: any) => d.id === wf.documentId);
              if (doc) {
                const now = new Date().toISOString();
                if (result.workflow.status === 'COMPLETED') {
                  doc.status = 'APPROVED';
                } else if (result.workflow.status === 'REJECTED') {
                  doc.status = 'REJECTED';
                } else {
                  doc.status = 'IN_REVIEW';
                }

                if (targetStage.stageKey === 'STAGE_1_SUPERVISOR' && doc.approvalSteps?.atasan) {
                  doc.approvalSteps.atasan.status = body.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
                  doc.approvalSteps.atasan.decisionAt = now;
                  doc.approvalSteps.atasan.comment = body.comment;
                } else if (targetStage.stageKey === 'STAGE_2_FINANCE' && doc.approvalSteps?.ayu) {
                  doc.approvalSteps.ayu.status = body.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
                  doc.approvalSteps.ayu.decisionAt = now;
                  doc.approvalSteps.ayu.comment = body.comment;
                } else if (targetStage.stageKey === 'STAGE_3_BOD_HERY' && doc.approvalSteps?.bod) {
                  doc.approvalSteps.bod.heryStatus = body.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
                  doc.approvalSteps.bod.heryDecisionAt = now;
                  doc.approvalSteps.bod.heryComment = body.comment;
                } else if (targetStage.stageKey === 'STAGE_3_BOD_HASHIMOTO' && doc.approvalSteps?.bod) {
                  doc.approvalSteps.bod.hashimotoStatus = body.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
                  doc.approvalSteps.bod.hashimotoDecisionAt = now;
                  doc.approvalSteps.bod.hashimotoComment = body.comment;
                }

                doc.updatedAt = now;
                doc.auditLog.push({
                  id: (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2)),
                  timestamp: now,
                  actor: user.fullName,
                  action: body.decision,
                  comment: body.comment || `Keputusan tahap ${targetStage.stageKey}`,
                });

                (repo as any).flush?.();
              }
            } catch (repoErr: any) {
              if (repoErr?.code === 'NOT_FOUND') {
                // Standalone stage engine document in isolated unit test
              } else {
                throw repoErr;
              }
            }
          }

          stageEngine.commitCrossStorageSync(syncId);
          return jsonResponse(result, 200);
        } catch (err: any) {
          stageEngine.compensateCrossStorageSync(syncId, err.message || 'Stage decision error');
          throw err;
        }
      }

      // POST /api/v1/stages/:stageId/reassign
      const stageReassignMatch = path.match(/^\/api\/v1\/stages\/([^/]+)\/reassign$/);
      if (method === 'POST' && stageReassignMatch) {
        if (!stageEngine) {
          throw new DomainError('Engine persetujuan tahap belum dikonfigurasi.', 503, 'STAGE_ENGINE_UNAVAILABLE');
        }
        if (user.role !== 'ADMIN') {
          throw new DomainError('Reassignment hanya dapat dikelola oleh Administrator.', 403, 'FORBIDDEN_ROLE');
        }
        if (!options?.organization) {
          throw new DomainError('Penyimpanan organisasi belum dikonfigurasi.', 503, 'ORGANIZATION_UNAVAILABLE');
        }

        const stageId = decodeURIComponent(stageReassignMatch[1]);
        const body = await parseJsonBody<{
          newApproverUserId: string;
          reason: string;
        }>(req);

        const result = stageEngine.reassignStage(
          {
            stageId,
            newApproverUserId: body.newApproverUserId,
            reason: body.reason,
            actorUserId: user.id,
          },
          options.organization
        );

        return jsonResponse(result, 200);
      }

      // GET /api/v1/documents/:documentId/workflow
      const docWfMatch = path.match(/^\/api\/v1\/documents\/([^/]+)\/workflow$/);
      if (method === 'GET' && docWfMatch) {
        if (!stageEngine) {
          throw new DomainError('Engine persetujuan tahap belum dikonfigurasi.', 503, 'STAGE_ENGINE_UNAVAILABLE');
        }
        const docId = decodeURIComponent(docWfMatch[1]);
        const workflow = stageEngine.getWorkflowByDocumentId(docId);
        if (!workflow) {
          throw new DomainError(`Workflow untuk dokumen ${docId} tidak ditemukan.`, 404, 'WORKFLOW_NOT_FOUND');
        }

        const stages = stageEngine.getStages(workflow.id);
        const snapshots = stageEngine.getSnapshots(workflow.id);
        const reassignments = stageEngine.getReassignments(workflow.id);
        const decisions = stageEngine.getDecisions(workflow.id);

        return jsonResponse(
          {
            workflow,
            stages,
            snapshots,
            reassignments,
            decisions,
          },
          200
        );
      }

      // 8. POST /api/v1/documents/:id/generate-pv
      const genPvMatch = path.match(/^\/api\/v1\/documents\/([^/]+)\/generate-pv$/);
      if (method === 'POST' && genPvMatch) {
        if (user.role !== 'KEUANGAN') {
          throw new DomainError(
            'Hanya peran KEUANGAN yang dapat menerbitkan Payment Voucher.',
            403,
            'FORBIDDEN_ROLE'
          );
        }
        const sourceDocId = decodeURIComponent(genPvMatch[1]);
        const body = await parseJsonBody<PvGenerationOptions>(req);
        const pv = repo.generatePvFromSource(sourceDocId, user.fullName, body);
        if (stageEngineEnabled && stageEngine && options?.organization) {
          stageEngine.createSubmissionWorkflow(
            {
              documentId: pv.id,
              docType: 'PV',
              docNumber: pv.docNumber,
              applicantUserId: user.id,
            },
            options.organization
          );
        }
        return jsonResponse({ document: visibleDocument(user, pv) }, 201);
      }

      const confirmRcMatch = path.match(/^\/api\/v1\/documents\/([^/]+)\/confirm-rc$/);
      if (method === 'POST' && confirmRcMatch) {
        if (user.role !== 'KEUANGAN') throw new DomainError('Hanya Finance yang dapat mengonfirmasi realisasi.', 403, 'FORBIDDEN_ROLE');
        const confirmed = repo.confirmRcSettlement(decodeURIComponent(confirmRcMatch[1]), user.fullName);
        return jsonResponse({ document: visibleDocument(user, confirmed) });
      }

      // 9. POST /api/v1/payments/:pvId/record
      const payMatch = path.match(/^\/api\/v1\/payments\/([^/]+)\/record$/);
      if (method === 'POST' && payMatch) {
        if (user.role !== 'KEUANGAN') {
          throw new DomainError(
            'Hanya peran KEUANGAN yang dapat mencatat pelunasan Payment Voucher.',
            403,
            'FORBIDDEN_ROLE'
          );
        }
        const pvId = decodeURIComponent(payMatch[1]);
        const body = await parseJsonBody<PVPaymentDetails>(req);
        const paidPv = repo.recordPvPayment(pvId, body, user.fullName);
        return jsonResponse({ document: visibleDocument(user, paidPv) }, 200);
      }

      // 10. POST /api/v1/documents/:id/attachments
      const attachUploadMatch = path.match(/^\/api\/v1\/documents\/([^/]+)\/attachments$/);
      if (method === 'POST' && attachUploadMatch) {
        const docId = decodeURIComponent(attachUploadMatch[1]);
        // Pastikan dokumen ada terlebih dahulu
        requireOwner(user, repo.getDocumentById(docId));

        const body = await parseJsonBody<{
          originalName: string;
          mimeType: string;
          category?: AttachmentCategory;
          contentBase64: string;
        }>(req);

        if (!body.contentBase64) {
          throw new DomainError('Isi file (contentBase64) wajib disertakan.', 400, 'EMPTY_FILE');
        }

        const buffer = Buffer.from(body.contentBase64, 'base64');
        let stored;
        try {
          stored = storage.saveFile({
            documentId: docId,
            category: body.category,
            originalName: body.originalName || 'document.pdf',
            mimeType: body.mimeType,
            content: buffer,
            uploadedBy: user.id,
          });
        } catch (err) {
          throw new DomainError(
            err instanceof Error ? err.message : 'Gagal menyimpan lampiran.',
            422,
            'ATTACHMENT_VALIDATION_ERROR'
          );
        }

        const registered = repo.registerAttachment(stored, user.fullName);
        return jsonResponse({ attachment: registered }, 201);
      }

      // 11. GET /api/v1/attachments/:attachmentId
      const attachGetMatch = path.match(/^\/api\/v1\/attachments\/([^/]+)$/);
      if (method === 'GET' && attachGetMatch) {
        const attachmentId = decodeURIComponent(attachGetMatch[1]);
        const meta = repo.getAttachmentById(attachmentId);
        if (!canViewAttachments(user, repo.getDocumentById(meta.documentId))) {
          throw new DomainError('Anda tidak memiliki akses ke lampiran ini.', 403, 'FORBIDDEN_ATTACHMENT');
        }
        const stream = storage.openDownloadStream(meta);

        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const fileBuffer = Buffer.concat(chunks);

        return new Response(fileBuffer, {
          status: 200,
          headers: {
            'content-type': meta.mimeType,
            'content-length': String(meta.sizeBytes),
            'content-disposition': `inline; filename="${meta.originalName}"`,
            'x-sha256-hash': meta.sha256Hash,
          },
        });
      }

      return jsonResponse({ error: `Endpoint ${method} ${path} tidak ditemukan.` }, 404);
    } catch (err) {
      if (err instanceof DomainError) {
        return jsonResponse(
          { error: err.message, code: err.code },
          err.statusCode
        );
      }
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      return jsonResponse({ error: message, code: 'INTERNAL_ERROR' }, 500);
    }
  }

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const rawBody = Buffer.concat(chunks);

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) {
        headers.set(k, v.join(', '));
      } else if (typeof v === 'string') {
        headers.set(k, v);
      }
    }

    const method = req.method || 'GET';
    const webReq = new Request(`http://${req.headers.host || 'localhost'}${req.url || '/'}`, {
      method,
      headers,
      body: method !== 'GET' && method !== 'HEAD' && rawBody.byteLength > 0 ? rawBody : undefined,
    });

    const webRes = await handleFetch(webReq);
    res.statusCode = webRes.status;
    webRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    const arrayBuf = await webRes.arrayBuffer();
    res.end(Buffer.from(arrayBuf));
  }) as BLCAppServer;

  Object.defineProperty(server, 'repo', { value: repo, enumerable: true });
  Object.defineProperty(server, 'storage', { value: storage, enumerable: true });
  Object.defineProperty(server, 'fetch', { value: handleFetch, enumerable: true });

  return server;
}

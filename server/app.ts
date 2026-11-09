import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AnyDocument, DocType, PVPaymentDetails, UserRole } from '../src/types/document';
import { authenticateCredentials, verifyJwt, SEEDED_USERS, type AuthUser } from './auth';
import { DomainError, ProcurementRepository, type PvGenerationOptions } from './repository';
import {
  LocalAttachmentStorage,
  type AttachmentCategory,
} from './storage';

export interface AppServerOptions {
  repository?: ProcurementRepository;
  storage?: LocalAttachmentStorage;
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
        if (submission.docType !== 'GR' && submission.docType !== 'PV') {
          const approverEmail = submission.stage1ApproverEmail?.trim().toLowerCase();
          if (!approverEmail || approverEmail === user.email.toLowerCase() || SEEDED_USERS[approverEmail]?.role !== 'ATASAN') {
            throw new DomainError('Pilih email atasan yang tersedia dan berbeda dari pengaju.', 422, 'INVALID_APPROVER');
          }
        }
        const body = await parseJsonBody<{ expectedVersion?: number }>(req);
        const idempotencyKey = req.headers.get('idempotency-key') || undefined;

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

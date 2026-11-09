import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { ReadStream } from 'node:fs';

// shortcut: local filesystem storage in .data/uploads, upgrade to S3/SharePoint Graph API when cloud bucket is provisioned
export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
]);

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

export type AttachmentCategory =
  | 'IAM_MEMO'
  | 'QUOTATION'
  | 'INVOICE'
  | 'RECEIPT'
  | 'REFUND_PROOF'
  | 'PAYMENT_PROOF'
  | 'PHOTO'
  | 'BAST'
  | 'SUPPORTING';

export interface StoredAttachment {
  id: string;
  documentId: string;
  category: AttachmentCategory;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  storagePath: string;
  uploadedBy: string;
  createdAt: string;
}

export interface SaveAttachmentInput {
  documentId: string;
  category?: AttachmentCategory;
  originalName: string;
  mimeType: string;
  content: Buffer;
  uploadedBy: string;
}

export class LocalAttachmentStorage {
  private readonly uploadDir: string;

  constructor(uploadDir: string = join(process.cwd(), '.data', 'uploads')) {
    this.uploadDir = uploadDir;
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  saveFile(input: SaveAttachmentInput): StoredAttachment {
    if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
      throw new Error(
        `Tipe file ${input.mimeType} tidak diizinkan. Hanya PDF, PNG, atau JPEG yang diperbolehkan.`
      );
    }

    if (!input.content || input.content.byteLength === 0) {
      throw new Error('File lampiran tidak boleh kosong.');
    }

    if (input.content.byteLength > MAX_ATTACHMENT_BYTES) {
      throw new Error(
        `Ukuran file (${input.content.byteLength} bytes) melebihi batas maksimum 10MB.`
      );
    }

    const id = randomUUID();
    const safeName = basename(input.originalName || 'attachment.bin').replace(
      /[^a-zA-Z0-9._-]/g,
      '_'
    );
    const sha256Hash = createHash('sha256').update(input.content).digest('hex');
    const storedFileName = `${id}-${safeName}`;
    const fullPath = join(this.uploadDir, storedFileName);

    writeFileSync(fullPath, input.content);

    return {
      id,
      documentId: input.documentId,
      category: input.category ?? 'SUPPORTING',
      originalName: safeName,
      mimeType: input.mimeType,
      sizeBytes: input.content.byteLength,
      sha256Hash,
      storagePath: fullPath,
      uploadedBy: input.uploadedBy,
      createdAt: new Date().toISOString(),
    };
  }

  openDownloadStream(attachment: StoredAttachment): ReadStream {
    if (!existsSync(attachment.storagePath)) {
      throw new Error(`File fisik lampiran ${attachment.id} tidak ditemukan di penyimpanan.`);
    }
    return createReadStream(attachment.storagePath);
  }
}

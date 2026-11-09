import type { DocumentAttachment } from '../types/document';

export function readAttachment(file: File, category: DocumentAttachment['category']): Promise<DocumentAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Berkas tidak dapat dibaca.'));
    reader.onload = () => resolve({ id: crypto.randomUUID(), name: file.name, size: file.size, mimeType: file.type, category, uploadedAt: new Date().toISOString(), dataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  });
}

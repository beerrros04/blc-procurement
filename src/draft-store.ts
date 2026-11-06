import { validateDraft, type DraftInput } from './draft';

export type Draft = { id: string; title: string; branch: string; amount: number; createdAt: string; purpose?: string; requiredDate?: string };
type DraftStorage = Pick<Storage, 'getItem' | 'setItem'>;
const storageKey = 'blc-pr-drafts-v1';

export function readDrafts(storage: DraftStorage): Draft[] {
  const raw = storage.getItem(storageKey);
  if (raw === null) return [];
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data) || !data.every(d => d && typeof d.id === 'string' && typeof d.title === 'string' &&
    typeof d.branch === 'string' && Number.isSafeInteger(d.amount) && d.amount > 0 &&
    typeof d.createdAt === 'string' && Number.isFinite(Date.parse(d.createdAt)) &&
    (d.purpose === undefined || typeof d.purpose === 'string') &&
    (d.requiredDate === undefined || typeof d.requiredDate === 'string'))) {
    throw new Error('Data draf tidak dapat dibaca.');
  }
  return data as Draft[];
}

export function saveDraft(storage: DraftStorage, input: DraftInput, editingId?: string): Draft[] {
  if (Object.keys(validateDraft(input)).length) throw new Error('Data draf tidak valid.');
  const drafts = readDrafts(storage);
  const values = { title: input.title.trim(), branch: input.branch.trim(), amount: Number(input.amount),
    ...(input.purpose === undefined ? {} : { purpose: input.purpose.trim() }),
    ...(input.requiredDate === undefined ? {} : { requiredDate: input.requiredDate }) };
  let next: Draft[];
  if (editingId) {
    if (!drafts.some(d => d.id === editingId)) throw new Error('Draf tidak ditemukan.');
    next = drafts.map(d => d.id === editingId ? { ...d, ...values } : d);
  } else {
    next = [{ id: crypto.randomUUID(), ...values, createdAt: new Date().toISOString() }, ...drafts];
  }
  storage.setItem(storageKey, JSON.stringify(next));
  return next;
}

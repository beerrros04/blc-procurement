import { describe, expect, it } from 'vitest';
import { readDrafts, saveDraft } from './draft-store';

function memoryStorage(initial: string | null = null) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => { value = next; },
  };
}

describe('penyimpanan draf PR', () => {
  it('membuat dan mengubah draf tanpa mengubah ID dan tanggal pembuatannya', () => {
    const storage = memoryStorage();
    const created = saveDraft(storage, { title: 'Alat', branch: 'Jakarta', amount: '500000' });
    const original = created[0];
    const updated = saveDraft(storage, { title: 'Alat kantor', branch: 'Bandung', amount: '750000' }, original.id);
    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({ id: original.id, createdAt: original.createdAt, title: 'Alat kantor', branch: 'Bandung', amount: 750000 });
    expect(readDrafts(storage)).toEqual(updated);
  });

  it('menolak data tidak valid dan draf yang sudah tidak ada tanpa menimpa data', () => {
    const storage = memoryStorage();
    const original = saveDraft(storage, { title: 'Alat', branch: 'Jakarta', amount: '500000' });
    expect(() => saveDraft(storage, { title: '', branch: 'Jakarta', amount: '1' })).toThrow();
    expect(() => saveDraft(storage, { title: 'Alat', branch: 'Jakarta', amount: '1' }, 'missing')).toThrow();
    expect(readDrafts(storage)).toEqual(original);
  });

  it('tidak menimpa data penyimpanan yang rusak', () => {
    const storage = memoryStorage('{invalid');
    expect(() => readDrafts(storage)).toThrow();
    expect(() => saveDraft(storage, { title: 'Alat', branch: 'Jakarta', amount: '1' })).toThrow();
    expect(storage.getItem()).toBe('{invalid');
  });

  it('mempertahankan draf lain yang ditambahkan pada tab berbeda', () => {
    const storage = memoryStorage();
    const first = saveDraft(storage, { title: 'Pertama', branch: 'Jakarta', amount: '1' })[0];
    saveDraft(storage, { title: 'Kedua', branch: 'Jakarta', amount: '2' });
    const updated = saveDraft(storage, { title: 'Pertama diperbarui', branch: 'Jakarta', amount: '3' }, first.id);
    expect(updated.map(d => d.title)).toEqual(['Kedua', 'Pertama diperbarui']);
  });

  it('menyimpan tujuan dan tanggal kebutuhan sambil mempertahankan draf lama', () => {
    const storage = memoryStorage();
    const legacy = saveDraft(storage, { title: 'Lama', branch: 'Jakarta', amount: '1000' })[0];
    const updated = saveDraft(storage, { title: 'Lama', branch: 'Jakarta', amount: '1000', purpose: 'Perlengkapan tim', requiredDate: '2026-11-30' }, legacy.id);
    expect(readDrafts(storage)[0]).toMatchObject({ id: legacy.id, purpose: 'Perlengkapan tim', requiredDate: '2026-11-30' });
    expect(updated[0].createdAt).toBe(legacy.createdAt);
  });
});

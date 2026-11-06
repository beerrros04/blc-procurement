import { describe, expect, it } from 'vitest';
import { validateDraft } from './draft';

describe('validasi draf PR', () => {
  it('menerima judul dan cabang yang diisi serta nominal positif', () => {
    expect(validateDraft({ title: '  Peralatan  ', branch: 'Jakarta', amount: '500000' })).toEqual({});
  });

  it('menolak kolom kosong dan nominal yang tidak positif', () => {
    expect(validateDraft({ title: '  ', branch: '', amount: '0' })).toEqual({
      title: 'Isi judul permintaan.',
      branch: 'Isi cabang.',
      amount: 'Masukkan nominal lebih dari Rp0.',
    });
    expect(validateDraft({ title: 'Pembelian', branch: 'Jakarta', amount: 'abc' }).amount).toBeDefined();
  });

  it('menolak tanggal kebutuhan yang tidak valid', () => {
    expect(validateDraft({ title: 'Alat', branch: 'Jakarta', amount: '1', requiredDate: '2026-02-30' }).requiredDate).toBeDefined();
    expect(validateDraft({ title: 'Alat', branch: 'Jakarta', amount: '1', requiredDate: '2026-11-30' })).toEqual({});
  });
});

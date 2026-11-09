import { describe, expect, it } from 'vitest';
import { displayPersonName } from './display-name';

describe('displayPersonName', () => {
  it('maps known identities and historical role labels to the requested names', () => {
    expect(displayPersonName('Bu Ayu (Verifikator Keuangan)')).toBe('Ayu Martina');
    expect(displayPersonName('Pak Hery (Direksi BoD)')).toBe('Hery Sugiarto');
    expect(displayPersonName('Mr. Hashimoto (Direksi BoD)')).toBe('Koji Hashimoto');
    expect(displayPersonName('Pak Hendra (Atasan Langsung)')).toBe('Hendra');
    expect(displayPersonName('Dewi Lestari (Pemohon Pusat)')).toBe('Dewi Lestari');
    expect(displayPersonName('Erika Ayu Fitriana (Keuangan)')).toBe('Erika Ayu Fitriana');
  });

  it('does not invent names for empty or generic role labels', () => {
    for (const input of [undefined, '', '  ', 'Atasan Langsung', 'Manajer Operasional', 'Staff Surabaya']) {
      expect(displayPersonName(input)).toBe('Belum ditentukan');
    }
  });

  it('resolves approver name from approverEmail or raw email when raw is missing or generic', () => {
    expect(displayPersonName(undefined, 'atasan@blc.co.id')).toBe('Pak Hendra');
    expect(displayPersonName('Atasan Langsung', 'atasan@blc.co.id')).toBe('Pak Hendra');
    expect(displayPersonName('atasan@blc.co.id')).toBe('Pak Hendra');
    expect(displayPersonName(undefined, 'ayu@blc.co.id')).toBe('Ayu Martina');
    expect(displayPersonName('', 'pemohon@blc.co.id')).toBe('Dewi Lestari');
    expect(displayPersonName(undefined, 'unknown@example.com')).toBe('Belum ditentukan');
    expect(displayPersonName('Atasan Langsung', 'unknown@example.com')).toBe('Belum ditentukan');
  });

  it('respects a custom fallback when provided', () => {
    expect(displayPersonName(undefined, undefined, 'Menunggu')).toBe('Menunggu');
    expect(displayPersonName('Atasan Langsung', undefined, 'Menunggu')).toBe('Menunggu');
  });

  it('keeps unknown names intact without stripping meaningful text or guessing identities', () => {
    expect(displayPersonName('  Jane (Née Doe)  ')).toBe('Jane (Née Doe)');
    expect(displayPersonName('Ayu Puspita')).toBe('Ayu Puspita');
    expect(displayPersonName('Hendra Wijaya')).toBe('Hendra Wijaya');
  });
});

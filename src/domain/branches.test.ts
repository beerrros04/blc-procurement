import { expect, it } from 'vitest';
import { branchOptions } from './branches';

it('includes all requested branches and retains existing document branches', () => {
  expect(branchOptions(['Bandung', 'Bekasi'])).toEqual([
    'Bekasi', 'Semarang', 'Medan', 'Makassar', 'Surabaya',
    'Pekanbaru', 'Palembang', 'Cibinong', 'Bandung',
  ]);
});

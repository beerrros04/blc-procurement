import { expect, it } from 'vitest';
import { branchOptions, OFFICIAL_BRANCHES } from './branches';

it('includes all requested official branches and retains existing document branches', () => {
  expect(branchOptions(['Bandung', 'Bekasi'])).toEqual([
    'Bekasi',
    'Cibinong',
    'Medan',
    'Surabaya',
    'Pekanbaru',
    'Makassar',
    'Samarinda',
    'Bandung',
  ]);
  expect(OFFICIAL_BRANCHES).toContain('Samarinda');
});

import { expect, it } from 'vitest';
import { addWorkingDays } from './working-days';

it('skips weekends and handles an empty date', () => {
  expect(addWorkingDays('2026-11-06', 2)).toBe('2026-11-10');
  expect(addWorkingDays('', 2)).toBe('');
});

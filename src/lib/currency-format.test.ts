import { describe, expect, it } from 'vitest';
import { formatCurrencyInput, parseCurrencyInput } from './currency-format';

describe('currency-format utilities', () => {
  describe('formatCurrencyInput', () => {
    it('formats plain numeric values with thousands dots', () => {
      expect(formatCurrencyInput(15000000)).toBe('15.000.000');
      expect(formatCurrencyInput(50000)).toBe('50.000');
      expect(formatCurrencyInput(500)).toBe('500');
      expect(formatCurrencyInput(0)).toBe('0');
    });

    it('formats raw string digits with thousands dots', () => {
      expect(formatCurrencyInput('15000000')).toBe('15.000.000');
      expect(formatCurrencyInput('1234567')).toBe('1.234.567');
    });

    it('handles already formatted or noisy string input by stripping non-digits', () => {
      expect(formatCurrencyInput('15.000.000')).toBe('15.000.000');
      expect(formatCurrencyInput('Rp 2.500.000')).toBe('2.500.000');
      expect(formatCurrencyInput('10,000')).toBe('10.000');
    });

    it('returns empty string for empty or whitespace inputs', () => {
      expect(formatCurrencyInput('')).toBe('');
      expect(formatCurrencyInput('   ')).toBe('');
    });
  });

  describe('parseCurrencyInput', () => {
    it('parses formatted dot strings back into integer numbers', () => {
      expect(parseCurrencyInput('15.000.000')).toBe(15000000);
      expect(parseCurrencyInput('50.000')).toBe(50000);
      expect(parseCurrencyInput('500')).toBe(500);
      expect(parseCurrencyInput('0')).toBe(0);
    });

    it('parses noisy strings with currency prefixes into integer numbers', () => {
      expect(parseCurrencyInput('Rp 15.000.000')).toBe(15000000);
      expect(parseCurrencyInput('Rp. 1.250.000')).toBe(1250000);
    });

    it('returns 0 for empty or invalid strings', () => {
      expect(parseCurrencyInput('')).toBe(0);
      expect(parseCurrencyInput('   ')).toBe(0);
      expect(parseCurrencyInput('abc')).toBe(0);
    });
  });
});

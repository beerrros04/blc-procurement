/**
 * Currency input masking helpers for Indonesian Rupiah amounts.
 * Formats numbers into dot-separated thousands groups (e.g. 15.000.000)
 * and safely parses user input back to integer values.
 */

const formatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
});

export function formatCurrencyInput(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    if (isNaN(value)) return '';
    return formatter.format(value);
  }
  const digitsOnly = value.replace(/\D/g, '');
  if (!digitsOnly) return '';
  const parsed = parseInt(digitsOnly, 10);
  if (isNaN(parsed)) return '';
  return formatter.format(parsed);
}

export function parseCurrencyInput(displayValue: string | null | undefined): number {
  if (!displayValue) return 0;
  const digitsOnly = displayValue.replace(/\D/g, '');
  if (!digitsOnly) return 0;
  const parsed = parseInt(digitsOnly, 10);
  return isNaN(parsed) ? 0 : parsed;
}

import { describe, expect, it } from 'vitest';
import {
  calculatePoTotal,
  calculateRcOutcome,
  calculatePvNet,
} from './calculations';

describe('Financial calculations', () => {
  it('calculates PO total correctly including PPN and PPh deductions', () => {
    // subtotal (Rp10.000.000) + otherCosts (Rp500.000) - discount (Rp200.000) = DPP Rp10.300.000
    // PPN 11% = Rp1.133.000, PPh 2% = Rp206.000
    // Total = Rp10.300.000 + Rp1.133.000 - Rp206.000 = Rp11.227.000
    const result = calculatePoTotal({
      subtotal: 10_000_000,
      otherCosts: 500_000,
      discount: 200_000,
      ppnRate: 0.11,
      pphRate: 0.02,
    });

    expect(result.ppnAmount).toBe(1_133_000);
    expect(result.pphAmount).toBe(206_000);
    expect(result.totalAmount).toBe(11_227_000);
  });

  it('handles zero or omitted optional discounts and costs without producing NaN', () => {
    const result = calculatePoTotal({
      subtotal: 5_000_000,
      otherCosts: 0,
      discount: 0,
      ppnRate: 0.11,
      pphRate: 0,
    });

    expect(result.ppnAmount).toBe(550_000);
    expect(result.pphAmount).toBe(0);
    expect(result.totalAmount).toBe(5_550_000);
  });

  it('calculates RC outcomes correctly for SURPLUS, DEFICIT, and EXACT', () => {
    // Skenario SURPLUS: realisasi lebih kecil dari AV (sisa uang kembali)
    const surplus = calculateRcOutcome({
      avOriginalAmount: 10_000_000,
      realizedAmount: 8_000_000,
    });
    expect(surplus.balanceAmount).toBe(2_000_000);
    expect(surplus.outcomeType).toBe('SURPLUS');

    // Skenario DEFICIT: realisasi lebih besar dari AV (karyawan nombok, perlu reimburse)
    const deficit = calculateRcOutcome({
      avOriginalAmount: 10_000_000,
      realizedAmount: 12_000_000,
    });
    expect(deficit.balanceAmount).toBe(-2_000_000);
    expect(deficit.outcomeType).toBe('DEFICIT');

    // Skenario EXACT: realisasi pas sama dengan AV (selesai nihil)
    const exact = calculateRcOutcome({
      avOriginalAmount: 10_000_000,
      realizedAmount: 10_000_000,
    });
    expect(exact.balanceAmount).toBe(0);
    expect(exact.outcomeType).toBe('EXACT');
  });

  it('calculates PV net amount correctly', () => {
    const pv = calculatePvNet({
      grossAmount: 11_200_000,
      pphDeduction: 200_000,
    });
    expect(pv.netAmountToPay).toBe(11_000_000);
  });
});

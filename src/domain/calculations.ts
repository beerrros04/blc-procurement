import type { RcOutcomeType } from '../types/document';

export interface PoCalculationInput {
  subtotal: number;
  otherCosts?: number;
  discount?: number;
  ppnRate?: number;
  pphRate?: number;
}

export interface PoCalculationResult {
  subtotal: number;
  otherCosts: number;
  discount: number;
  ppnAmount: number;
  pphAmount: number;
  totalAmount: number;
}

export function calculatePoTotal(input: PoCalculationInput): PoCalculationResult {
  const subtotal = Math.max(0, Math.round(Number(input.subtotal) || 0));
  const otherCosts = Math.max(0, Math.round(Number(input.otherCosts) || 0));
  const discount = Math.max(0, Math.round(Number(input.discount) || 0));

  const ppnRate = Number(input.ppnRate ?? 0.11);
  const pphRate = Number(input.pphRate ?? 0);

  // PPN dihitung dari (subtotal + otherCosts - discount)
  const taxableBase = Math.max(0, subtotal + otherCosts - discount);
  const ppnAmount = Math.round(taxableBase * ppnRate);
  const pphAmount = Math.round(taxableBase * pphRate);

  const totalAmount = taxableBase + ppnAmount - pphAmount;

  return {
    subtotal,
    otherCosts,
    discount,
    ppnAmount,
    pphAmount,
    totalAmount,
  };
}

export interface RcCalculationInput {
  avOriginalAmount: number;
  realizedAmount: number;
}

export interface RcCalculationResult {
  avOriginalAmount: number;
  realizedAmount: number;
  balanceAmount: number;
  outcomeType: RcOutcomeType;
}

export function calculateRcOutcome(input: RcCalculationInput): RcCalculationResult {
  const avOriginalAmount = Math.round(Number(input.avOriginalAmount) || 0);
  const realizedAmount = Math.round(Number(input.realizedAmount) || 0);

  const balanceAmount = avOriginalAmount - realizedAmount;

  let outcomeType: RcOutcomeType = 'EXACT';
  if (balanceAmount > 0) {
    outcomeType = 'SURPLUS';
  } else if (balanceAmount < 0) {
    outcomeType = 'DEFICIT';
  }

  return {
    avOriginalAmount,
    realizedAmount,
    balanceAmount,
    outcomeType,
  };
}

export interface PvCalculationInput {
  grossAmount: number;
  pphDeduction?: number;
}

export interface PvCalculationResult {
  grossAmount: number;
  pphDeduction: number;
  netAmountToPay: number;
}

export function calculatePvNet(input: PvCalculationInput): PvCalculationResult {
  const grossAmount = Math.round(Number(input.grossAmount) || 0);
  const pphDeduction = Math.max(0, Math.round(Number(input.pphDeduction) || 0));
  const netAmountToPay = Math.max(0, grossAmount - pphDeduction);

  return {
    grossAmount,
    pphDeduction,
    netAmountToPay,
  };
}

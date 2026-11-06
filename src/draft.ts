export type DraftInput = { title: string; branch: string; amount: string; purpose?: string; requiredDate?: string };
export type DraftErrors = Partial<Record<keyof DraftInput, string>>;

export function validateDraft(input: DraftInput): DraftErrors {
  const errors: DraftErrors = {};
  if (!input.title.trim()) errors.title = 'Isi judul permintaan.';
  if (!input.branch.trim()) errors.branch = 'Isi cabang.';
  const amount = Number(input.amount);
  if (!/^\d+$/.test(input.amount) || !Number.isSafeInteger(amount) || amount <= 0) {
    errors.amount = 'Masukkan nominal lebih dari Rp0.';
  }
  if (input.requiredDate) {
    const date = new Date(`${input.requiredDate}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.requiredDate) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== input.requiredDate) {
      errors.requiredDate = 'Masukkan tanggal yang valid.';
    }
  }
  return errors;
}

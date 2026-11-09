export function addWorkingDays(date: string, days: number): string {
  if (!date) return '';
  const result = new Date(`${date}T00:00:00Z`);
  for (let remaining = days; remaining > 0;) {
    result.setUTCDate(result.getUTCDate() + 1);
    if (result.getUTCDay() !== 0 && result.getUTCDay() !== 6) remaining--;
  }
  // shortcut: excludes weekends only; add the approved holiday calendar when available
  return result.toISOString().slice(0, 10);
}

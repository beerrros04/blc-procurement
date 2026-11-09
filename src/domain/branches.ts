export function branchOptions(existing: string[] = []): string[] {
  return Array.from(new Set([
    'Bekasi', 'Semarang', 'Medan', 'Makassar', 'Surabaya',
    'Pekanbaru', 'Palembang', 'Cibinong', ...existing.filter(Boolean),
  ]));
}

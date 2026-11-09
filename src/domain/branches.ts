export const OFFICIAL_BRANCHES = [
  'Bekasi',
  'Cibinong',
  'Medan',
  'Surabaya',
  'Pekanbaru',
  'Makassar',
  'Samarinda',
] as const;

export type OfficialBranch = (typeof OFFICIAL_BRANCHES)[number];

export function branchOptions(existing: string[] = []): string[] {
  return Array.from(new Set([
    ...OFFICIAL_BRANCHES,
    ...existing.filter(Boolean),
  ]));
}

const UNKNOWN_PERSON = 'Nama belum tersedia';

const GENERIC_LABELS = new Set([
  'atasan langsung',
  'kepala satuan pengawas',
  'manajer operasional',
  'staf keuangan',
  'staff surabaya',
  'staff pemohon',
  'admin lokal',
  'tim keuangan & treasury',
]);

const KNOWN_ROLE_SUFFIX = /\s*\((?:pemohon(?: pusat)?|staff pemohon|atasan(?: langsung)?|kacab surabaya|verifikator(?: keuangan)?|keuangan|(?:direksi\s+)?bod)\)\s*$/i;

const KNOWN_NAMES: Record<string, string> = {
  'ayu': 'Ayu Martina',
  'bu ayu': 'Ayu Martina',
  'ayu martina': 'Ayu Martina',
  'hery': 'Hery Sugiarto',
  'pak hery': 'Hery Sugiarto',
  'hery sugiarto': 'Hery Sugiarto',
  'hashimoto': 'Koji Hashimoto',
  'mr. hashimoto': 'Koji Hashimoto',
  'pak hashimoto': 'Koji Hashimoto',
  'koji hashimoto': 'Koji Hashimoto',
  'pak hendra': 'Hendra',
  'hendra': 'Hendra',
};

export function displayPersonName(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value || GENERIC_LABELS.has(value.toLocaleLowerCase('id-ID'))) return UNKNOWN_PERSON;

  const withoutKnownRole = value.replace(KNOWN_ROLE_SUFFIX, '').trim();
  const normalized = withoutKnownRole.toLocaleLowerCase('id-ID');
  if (!normalized || GENERIC_LABELS.has(normalized)) return UNKNOWN_PERSON;
  return KNOWN_NAMES[normalized] ?? withoutKnownRole;
}

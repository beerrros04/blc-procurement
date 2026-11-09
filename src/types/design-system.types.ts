export type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'ghost' | 'icon' | 'destructive';
export type ControlSize = 'sm' | 'md' | 'lg';

export type DocumentStatus =
  | 'draft'
  | 'diajukan'
  | 'menunggu'
  | 'ditinjau'
  | 'disetujui'
  | 'ditolak'
  | 'revisi'
  | 'dibayarkan'
  | 'lunas'
  | 'inactive';

export type ApprovalStepState =
  | 'pending'
  | 'waiting'
  | 'current'
  | 'approved'
  | 'rejected'
  | 'revision'
  | 'completed';

export type StepperVariant = 'compact' | 'expanded' | 'adaptive';
export type TableDensity = 'regular' | 'compact';

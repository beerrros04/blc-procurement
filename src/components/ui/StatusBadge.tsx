import React from 'react';
import {
  CheckCircle2,
  CreditCard,
  XCircle,
  Eye,
  Clock,
  FileEdit,
  RotateCcw,
  MinusCircle,
  LucideIcon,
} from 'lucide-react';
import type { DocumentStatus as DomainDocumentStatus } from '../../types/document';
import type { DocumentStatus as DesignDocumentStatus } from '../../types/design-system.types';

export type StatusBadgeValue = DomainDocumentStatus | DesignDocumentStatus | string;

export interface StatusBadgeProps {
  status: StatusBadgeValue;
  className?: string;
  showIcon?: boolean;
}

interface StatusConfig {
  key: string;
  label: string;
  icon: LucideIcon;
}

export function getStatusConfig(status: StatusBadgeValue): StatusConfig {
  const normalized = String(status || '').trim().toLowerCase();

  switch (normalized) {
    case 'approved':
    case 'disetujui':
    case 'selesai':
      return {
        key: 'approved',
        label: 'Disetujui',
        icon: CheckCircle2,
      };

    case 'paid':
    case 'lunas':
      return {
        key: 'paid',
        label: 'Lunas',
        icon: CreditCard,
      };

    case 'dibayarkan':
      return { key: 'disbursed', label: 'Dibayarkan', icon: CreditCard };

    case 'inactive':
      return { key: 'inactive', label: 'Nonaktif', icon: MinusCircle };

    case 'rejected':
    case 'ditolak':
      return {
        key: 'rejected',
        label: 'Ditolak',
        icon: XCircle,
      };

    case 'revision':
    case 'revisi':
      return {
        key: 'revision',
        label: 'Revisi',
        icon: RotateCcw,
      };

    case 'in_review':
    case 'in-review':
    case 'ditinjau':
      return {
        key: 'in_review',
        label: 'Ditinjau',
        icon: Eye,
      };

    case 'submitted':
    case 'diajukan':
      return {
        key: 'submitted',
        label: 'Diajukan',
        icon: Clock,
      };

    case 'menunggu':
    case 'waiting':
    case 'pending':
      return {
        key: 'waiting',
        label: 'Menunggu',
        icon: Clock,
      };

    case 'draft':
    case 'draf':
      return {
        key: 'draft',
        label: 'Draf',
        icon: FileEdit,
      };

    default:
      return {
        key: normalized.replace(/[^a-z0-9_-]/g, '_') || 'draft',
        label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Draf',
        icon: FileEdit,
      };
  }
}

export function StatusBadge({
  status,
  className,
  showIcon = true,
}: StatusBadgeProps): React.JSX.Element {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  const badgeClass = ['status-badge', `status-${config.key}`, className].filter(Boolean).join(' ');

  return (
    <span className={badgeClass}>
      {showIcon && <Icon size={12} className="status-badge-icon" aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
}

export default StatusBadge;

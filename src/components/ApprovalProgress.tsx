import React from 'react';
import type { BaseDocument, PVDocument, StageDecision } from '../types/document';
import { displayPersonName } from '../domain/display-name';
import ProgressIndicator, { type ProgressStage, type PaymentStatus } from './ui/progress-indicator';

export interface ApprovalProgressProps {
  document: BaseDocument;
  compact?: boolean;
  variant?: 'capsule' | 'inline' | string;
}

export function ApprovalProgress({ document, compact, variant }: ApprovalProgressProps) {
  if (document.docType === 'GR') return <span>Tidak memerlukan persetujuan</span>;
  const { atasan, ayu, bod } = document.approvalSteps;
  const approvals = [bod.heryStatus, bod.hashimotoStatus];
  const count = approvals.filter((status) => status === 'APPROVED').length;
  const bodStatus: StageDecision = approvals.includes('REJECTED') ? 'REJECTED'
    : count === 2 ? 'APPROVED' : approvals.includes('PENDING') || count > 0 ? 'PENDING' : 'WAITING';
  const steps: ProgressStage[] = [
    ...(document.docType === 'PV' ? [] : [{ id: 'atasan', name: displayPersonName(atasan.assignedTo, document.stage1ApproverEmail), status: atasan.status }]),
    { id: 'ayu', name: 'Ayu Martina', status: ayu.status },
    { id: 'bod', name: 'Hery Sugiarto & Koji Hashimoto', status: bodStatus, detail: bodStatus === 'PENDING' ? `${count}/2 disetujui` : undefined,
      participants: [
        { name: 'Hery Sugiarto', status: bod.heryStatus },
        { name: 'Koji Hashimoto', status: bod.hashimotoStatus },
      ] },
  ];

  const isPaid = document.status === 'PAID' || (document.docType === 'PV' && (document as PVDocument).paymentStatus === 'PAID');
  const paymentStatus: PaymentStatus = isPaid
    ? { isPaid: true, label: 'Lunas', tone: 'success' }
    : document.status === 'APPROVED'
    ? { isPaid: false, label: 'Menunggu Pembayaran', tone: 'warning' }
    : { isPaid: false, label: 'Belum Dibayar', tone: 'neutral' };

  return <ProgressIndicator steps={steps} compact={compact} variant={variant} paymentStatus={paymentStatus} />;
}

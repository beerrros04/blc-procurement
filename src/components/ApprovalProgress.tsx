import React from 'react';
import type { BaseDocument, StageDecision } from '../types/document';
import { displayPersonName } from '../domain/display-name';
import ProgressIndicator, { type ProgressStage } from './ui/progress-indicator';

export function ApprovalProgress({ document }: { document: BaseDocument }) {
  if (document.docType === 'GR') return <span>Tidak memerlukan persetujuan</span>;
  const { atasan, ayu, bod } = document.approvalSteps;
  const approvals = [bod.heryStatus, bod.hashimotoStatus];
  const count = approvals.filter((status) => status === 'APPROVED').length;
  const bodStatus: StageDecision = approvals.includes('REJECTED') ? 'REJECTED'
    : count === 2 ? 'APPROVED' : approvals.includes('PENDING') || count > 0 ? 'PENDING' : 'WAITING';
  const steps: ProgressStage[] = [
    ...(document.docType === 'PV' ? [] : [{ id: 'atasan', name: displayPersonName(atasan.assignedTo), status: atasan.status }]),
    { id: 'ayu', name: 'Ayu Martina', status: ayu.status },
    { id: 'bod', name: 'Hery Sugiarto & Koji Hashimoto', status: bodStatus, detail: bodStatus === 'PENDING' ? `${count}/2 disetujui` : undefined,
      participants: [
        { name: 'Hery Sugiarto', status: bod.heryStatus },
        { name: 'Koji Hashimoto', status: bod.hashimotoStatus },
      ] },
  ];
  return <ProgressIndicator steps={steps} />;
}

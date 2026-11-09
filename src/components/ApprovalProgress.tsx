import React from 'react';
import type { BaseDocument, StageDecision } from '../types/document';

const labels: Record<StageDecision, string> = {
  WAITING: 'Belum dimulai', PENDING: 'Menunggu', APPROVED: 'Disetujui', REJECTED: 'Dikembalikan',
};

export function ApprovalProgress({ document }: { document: BaseDocument }) {
  const { atasan, ayu, bod } = document.approvalSteps;
  const approvals = [bod.heryStatus, bod.hashimotoStatus];
  const count = approvals.filter((status) => status === 'APPROVED').length;
  const bodStatus: StageDecision = approvals.includes('REJECTED') ? 'REJECTED'
    : count === 2 ? 'APPROVED' : approvals.includes('PENDING') || count > 0 ? 'PENDING' : 'WAITING';
  const steps: Array<{ name: string; status: StageDecision; detail?: string }> = [
    { name: 'Head', status: atasan.status },
    { name: 'GM', status: ayu.status },
    { name: 'Direksi', status: bodStatus, detail: bodStatus === 'PENDING' ? `${count}/2 disetujui` : undefined },
  ];
  return <ol className="approval-progress" aria-label="Progres persetujuan">
    {steps.map((step) => <li key={step.name} className={`approval-progress-step is-${step.status.toLowerCase()}`}>
      <span className="approval-progress-dot" aria-hidden="true">{step.status === 'APPROVED' ? '✓' : step.status === 'REJECTED' ? '×' : ''}</span>
      <span className="approval-progress-copy"><strong>{step.name}</strong><small>{step.detail || labels[step.status]}</small></span>
    </li>)}
  </ol>;
}

import React from 'react';
import type { BaseDocument, StageDecision } from '../types/document';
import { displayPersonName } from '../domain/display-name';

export interface ApprovalStepperProps {
  document: BaseDocument;
}

function getDecisionBadge(status: StageDecision): { label: string; className: string } {
  switch (status) {
    case 'APPROVED':
      return { label: 'Disetujui', className: 'status-approved' };
    case 'REJECTED':
      return { label: 'Ditolak', className: 'status-rejected' };
    case 'PENDING':
      return { label: 'Menunggu Persetujuan', className: 'status-pending' };
    case 'WAITING':
    default:
      return { label: 'Menunggu Giliran', className: 'status-waiting' };
  }
}

function formatDate(iso?: string): string {
  if (!iso) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const ApprovalStepper: React.FC<ApprovalStepperProps> = ({ document }) => {
  const { atasan, ayu, bod } = document.approvalSteps;

  const atasanBadge = getDecisionBadge(atasan.status);
  const ayuBadge = getDecisionBadge(ayu.status);
  const heryBadge = getDecisionBadge(bod.heryStatus);
  const hashimotoBadge = getDecisionBadge(bod.hashimotoStatus);

  if (document.docType === 'GR') return null;

  return (
    <section className="stepper-section" aria-label="Alur Persetujuan">
      <div className="stepper-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 className="stepper-title">Progres Persetujuan Berjenjang</h3>
          <span className="stepper-subtitle">
            Status Dokumen:{' '}
            <span className={`badge status-${document.status.toLowerCase()}`}>
              {document.status}
            </span>
          </span>
        </div>
      </div>

      <div className="stepper-track">
        {/* Tahap 1: Atasan */}
        {document.docType !== 'PV' && <>
        <div className={`step-node ${atasan.status === 'PENDING' ? 'step-active' : ''}`}>
          <div className="step-circle">1</div>
          <div className="step-content">
            <div className="step-title-row">
              <strong>{displayPersonName(atasan.assignedTo, document.stage1ApproverEmail)}</strong>
              <span className={`step-badge ${atasanBadge.className}`}>{atasanBadge.label}</span>
            </div>
            {atasan.decisionAt && (
              <p className="step-time">Waktu: {formatDate(atasan.decisionAt)}</p>
            )}
            {atasan.comment && <blockquote className="step-comment">"{atasan.comment}"</blockquote>}
          </div>
        </div>

        <div className="step-connector" />
        </>}

        {/* Tahap 2: Ayu Martina */}
        <div className={`step-node ${ayu.status === 'PENDING' ? 'step-active' : ''}`}>
          <div className="step-circle">{document.docType === 'PV' ? 1 : 2}</div>
          <div className="step-content">
            <div className="step-title-row">
              <strong>Ayu Martina</strong>
              <span className={`step-badge ${ayuBadge.className}`}>{ayuBadge.label}</span>
            </div>
            {ayu.decisionAt && <p className="step-time">Waktu: {formatDate(ayu.decisionAt)}</p>}
            {ayu.comment && <blockquote className="step-comment">"{ayu.comment}"</blockquote>}
          </div>
        </div>

        <div className="step-connector" />

        {/* Tahap 3: BOD Parallel */}
        <div
          className={`step-node ${
            bod.heryStatus === 'PENDING' || bod.hashimotoStatus === 'PENDING' ? 'step-active' : ''
          }`}
        >
          <div className="step-circle">{document.docType === 'PV' ? 2 : 3}</div>
          <div className="step-content">
            <div className="step-title-row">
              <strong>Persetujuan bersama</strong>
            </div>

            <div className="bod-parallel-box">
              <div className="bod-reviewer">
                <div className="bod-reviewer-head">
                  <strong>Hery Sugiarto</strong>
                  <span className={`step-badge ${heryBadge.className}`}>{heryBadge.label}</span>
                </div>
                {bod.heryDecisionAt && (
                  <p className="step-time">{formatDate(bod.heryDecisionAt)}</p>
                )}
                {bod.heryComment && <p className="step-comment">"{bod.heryComment}"</p>}
              </div>

              <div className="bod-reviewer">
                <div className="bod-reviewer-head">
                  <strong>Koji Hashimoto</strong>
                  <span className={`step-badge ${hashimotoBadge.className}`}>{hashimotoBadge.label}</span>
                </div>
                {bod.hashimotoDecisionAt && (
                  <p className="step-time">{formatDate(bod.hashimotoDecisionAt)}</p>
                )}
                {bod.hashimotoComment && (
                  <p className="step-comment">"{bod.hashimotoComment}"</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

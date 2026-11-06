import React, { useState } from 'react';
import type {
  AnyDocument,
  AVDocument,
  PODocument,
  PRDocument,
  PVDocument,
  RBDocument,
  RCDocument,
  UserRole,
} from '../types/document';
import { ApprovalStepper } from './ApprovalStepper';

export interface DocumentDetailModalProps {
  document: AnyDocument;
  activeRole: UserRole;
  onClose: () => void;
  onApprove: (
    docId: string,
    role: 'ATASAN' | 'AYU' | 'BOD_HERY' | 'BOD_HASHIMOTO',
    comment?: string
  ) => void;
  onReject: (
    docId: string,
    role: 'ATASAN' | 'AYU' | 'BOD_HERY' | 'BOD_HASHIMOTO',
    comment: string
  ) => void;
}

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  activeRole,
  onClose,
  onApprove,
  onReject,
}) => {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  // Check if active role has pending approval task on this document
  let canApproveRole: 'ATASAN' | 'AYU' | 'BOD_HERY' | 'BOD_HASHIMOTO' | null = null;

  if (document.status === 'SUBMITTED' || document.status === 'IN_REVIEW') {
    if (activeRole === 'ATASAN' && document.approvalSteps.atasan.status === 'PENDING') {
      canApproveRole = 'ATASAN';
    } else if (activeRole === 'AYU' && document.approvalSteps.ayu.status === 'PENDING') {
      canApproveRole = 'AYU';
    } else if (activeRole === 'BOD_HERY' && document.approvalSteps.bod.heryStatus === 'PENDING') {
      canApproveRole = 'BOD_HERY';
    } else if (
      activeRole === 'BOD_HASHIMOTO' &&
      document.approvalSteps.bod.hashimotoStatus === 'PENDING'
    ) {
      canApproveRole = 'BOD_HASHIMOTO';
    }
  }

  function handleApprove() {
    if (!canApproveRole) return;
    onApprove(document.id, canApproveRole, comment || undefined);
    onClose();
  }

  function handleReject() {
    if (!canApproveRole) return;
    if (!comment.trim()) {
      setError('Alasan penolakan wajib diisi untuk instruksi revisi kepada pemohon.');
      return;
    }
    onReject(document.id, canApproveRole, comment);
    onClose();
  }

  return (
    <dialog
      className="modal"
      open
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <section className="drawer" style={{ width: 'min(720px, 100%)' }}>
        <div className="drawer-head">
          <div>
            <div className="eyebrow">{document.docType} SPECIFICATION</div>
            <h2>{document.docNumber}</h2>
            <p>{document.title}</p>
          </div>
          <button className="close" type="button" onClick={onClose} aria-label="Tutup detail">
            ×
          </button>
        </div>

        <div className="form-body">
          {/* Visual Stepper */}
          {document.docType !== 'PV' && <ApprovalStepper document={document} />}

          {/* Document Specific Breakdown */}
          <div className="form-summary-box">
            <strong>Rincian Data Dokumen</strong>
            <div className="form-summary-row" style={{ marginTop: '8px' }}>
              <span>Cabang:</span>
              <strong>{document.branch}</strong>
            </div>
            <div className="form-summary-row">
              <span>Status Dokumen:</span>
              <span>{document.status}</span>
            </div>
            <div className="form-summary-row">
              <span>Tujuan / Keperluan:</span>
              <span>{document.purpose || '-'}</span>
            </div>

            {document.docType === 'PR' && (
              <>
                <div className="form-summary-row">
                  <span>Tipe Anggaran:</span>
                  <span>{(document as PRDocument).budgetType}</span>
                </div>
                <div className="form-summary-row">
                  <span>Wajib Memo IAM (≥ Rp 5 Juta):</span>
                  <span>{(document as PRDocument).isIamRequired ? 'Ya (Wajib)' : 'Tidak'}</span>
                </div>
                <div className="form-summary-total">
                  <span>SUBTOTAL PR:</span>
                  <span>{rupiah.format((document as PRDocument).subtotalAmount)}</span>
                </div>
              </>
            )}

            {document.docType === 'PO' && (
              <>
                <div className="form-summary-row">
                  <span>Vendor Rekanan:</span>
                  <strong>{(document as PODocument).vendorName}</strong>
                </div>
                <div className="form-summary-row">
                  <span>Kategori PO:</span>
                  <span>{(document as PODocument).poCategory}</span>
                </div>
                <div className="form-summary-row">
                  <span>Metode Pembayaran:</span>
                  <span>{(document as PODocument).paymentMethod}</span>
                </div>
                {(document as PODocument).bankDetails && (
                  <div className="form-summary-row">
                    <span>Rekening Vendor:</span>
                    <span>
                      {(document as PODocument).bankDetails?.bankName} -{' '}
                      {(document as PODocument).bankDetails?.accountNumber} (a/n{' '}
                      {(document as PODocument).bankDetails?.accountHolder})
                    </span>
                  </div>
                )}
                <div className="form-summary-row">
                  <span>Subtotal + Biaya - Diskon:</span>
                  <span>
                    {rupiah.format(
                      (document as PODocument).subtotal +
                        (document as PODocument).otherCosts -
                        (document as PODocument).discount
                    )}
                  </span>
                </div>
                <div className="form-summary-row">
                  <span>PPN:</span>
                  <span>+ {rupiah.format((document as PODocument).ppnAmount)}</span>
                </div>
                <div className="form-summary-row">
                  <span>PPh:</span>
                  <span>- {rupiah.format((document as PODocument).pphAmount)}</span>
                </div>
                <div className="form-summary-total">
                  <span>TOTAL PO:</span>
                  <span>{rupiah.format((document as PODocument).totalAmount)}</span>
                </div>
              </>
            )}

            {document.docType === 'AV' && (
              <>
                <div className="form-summary-row">
                  <span>Rencana Kegiatan:</span>
                  <span>{(document as AVDocument).activityDate}</span>
                </div>
                <div className="form-summary-row">
                  <span>Tanggal Dana Dibutuhkan:</span>
                  <span>{(document as AVDocument).paymentDueDate}</span>
                </div>
                <div className="form-summary-total">
                  <span>NOMINAL UANG MUKA:</span>
                  <span>{rupiah.format((document as AVDocument).amount)}</span>
                </div>
              </>
            )}

            {document.docType === 'RB' && (
              <>
                <div className="form-summary-row">
                  <span>Kategori Pengeluaran:</span>
                  <span>{(document as RBDocument).expenseCategory}</span>
                </div>
                <div className="form-summary-row">
                  <span>Tanggal Kuitansi:</span>
                  <span>{(document as RBDocument).transactionDate}</span>
                </div>
                <div className="form-summary-row">
                  <span>Jumlah Lampiran Struk:</span>
                  <span>{(document as RBDocument).attachmentCount} lembar</span>
                </div>
                <div className="form-summary-total">
                  <span>TOTAL KLAIM REIMBURSEMENT:</span>
                  <span>{rupiah.format((document as RBDocument).totalAmount)}</span>
                </div>
              </>
            )}

            {document.docType === 'RC' && (
              <>
                <div className="form-summary-row">
                  <span>Uang Muka Diterima:</span>
                  <span>{rupiah.format((document as RCDocument).avOriginalAmount)}</span>
                </div>
                <div className="form-summary-row">
                  <span>Pengeluaran Realisasi:</span>
                  <span>{rupiah.format((document as RCDocument).realizedAmount)}</span>
                </div>
                <div className="form-summary-row">
                  <span>Hasil Penyelesaian:</span>
                  <strong>{(document as RCDocument).outcomeType}</strong>
                </div>
                <div className="form-summary-total">
                  <span>SELISIH SALDO:</span>
                  <span>{rupiah.format((document as RCDocument).balanceAmount)}</span>
                </div>
              </>
            )}

            {document.docType === 'PV' && (
              <>
                <div className="form-summary-row">
                  <span>Pihak Penerima (Payee):</span>
                  <strong>{(document as PVDocument).vendorOrPayeeName}</strong>
                </div>
                <div className="form-summary-row">
                  <span>Dokumen Induk:</span>
                  <span>{(document as PVDocument).sourceDocNumber}</span>
                </div>
                <div className="form-summary-row">
                  <span>Status Pembayaran:</span>
                  <strong>{(document as PVDocument).paymentStatus}</strong>
                </div>
                {(document as PVDocument).paymentDetails && (
                  <div className="form-summary-row">
                    <span>Bukti Transfer:</span>
                    <span>
                      {(document as PVDocument).paymentDetails?.sourceBank} - Ref:{' '}
                      {(document as PVDocument).paymentDetails?.referenceNumber} (
                      {(document as PVDocument).paymentDetails?.paidAt})
                    </span>
                  </div>
                )}
                <div className="form-summary-total">
                  <span>NILAI NET TRANSFER:</span>
                  <span>{rupiah.format((document as PVDocument).netAmountToPay)}</span>
                </div>
              </>
            )}
          </div>

          {/* Action Decision Box if user has authority */}
          {canApproveRole && (
            <div className="form-summary-box" style={{ background: '#fffbe6', border: '1px solid #ffe58f' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px' }}>⚡</span>
                <div>
                  <strong style={{ color: '#874d00' }}>
                    Tindakan Persetujuan: {canApproveRole}
                  </strong>
                  <p style={{ fontSize: '12px', margin: '2px 0 0', color: '#613400' }}>
                    Profil aktif Anda memiliki kewenangan untuk mengambil keputusan atas pengajuan ini.
                  </p>
                </div>
              </div>

              {error && <div className="notice error-notice" role="alert">{error}</div>}

              <label htmlFor="decision-note">Catatan Peninjauan / Alasan</label>
              <textarea
                id="decision-note"
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tuliskan catatan persetujuan atau alasan revisi/penolakan..."
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="secondary"
                  style={{ color: '#a13f34', borderColor: '#e8bcbc' }}
                  onClick={handleReject}
                >
                  Tolak (Kembalikan ke Draf)
                </button>
                <button type="button" className="primary" onClick={handleApprove}>
                  Setujui Dokumen (Approve) <span aria-hidden="true">✔</span>
                </button>
              </div>
            </div>
          )}

          {/* Audit Log History */}
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#254b38' }}>
              Riwayat Log Audit & Jejak Persetujuan
            </h4>
            <ul className="audit-list">
              {document.auditLog.map((log) => (
                <li key={log.id} className="audit-item">
                  <div className="audit-item-head">
                    <span>
                      {log.actor} — <span style={{ color: '#527563' }}>{log.action}</span>
                    </span>
                    <small style={{ color: '#8a9990' }}>
                      {new Intl.DateTimeFormat('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(log.timestamp))}
                    </small>
                  </div>
                  {log.comment && <p style={{ margin: '4px 0 0', color: '#4a6355' }}>"{log.comment}"</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </section>
    </dialog>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import type {
  AnyDocument,
  AVDocument,
  GRDocument,
  PODocument,
  PRDocument,
  PVDocument,
  RBDocument,
  RCDocument,
  UserRole,
} from '../types/document';
import { ApprovalStepper } from './ApprovalStepper';
import { openAttachment } from '../api';
import { displayPersonName } from '../domain/display-name';
import './document-detail.css';

export interface DocumentDetailModalProps {
  document: AnyDocument;
  allDocuments?: AnyDocument[];
  activeRole: UserRole;
  activeUserId?: string;
  activeUserEmail?: string;
  onClose: () => void;
  onApprove: (
    docId: string,
    role: 'ATASAN' | 'AYU' | 'BOD_HERY' | 'BOD_HASHIMOTO',
    comment?: string
  ) => Promise<void>;
  onReject: (
    docId: string,
    role: 'ATASAN' | 'AYU' | 'BOD_HERY' | 'BOD_HASHIMOTO',
    comment: string
  ) => Promise<void>;
}

export async function runDecision(submit: () => Promise<void>, onClose: () => void): Promise<void> {
  await submit();
  onClose();
}

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  allDocuments = [],
  activeRole,
  activeUserId,
  activeUserEmail,
  onClose,
  onApprove,
  onReject,
}) => {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = window.document.activeElement as HTMLElement | null;
    const panel = drawerRef.current;
    panel?.querySelector<HTMLButtonElement>('button')?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!isSubmittingRef.current) closeRef.current();
      } else if (event.key === 'Tab' && panel) {
        const controls = Array.from(panel.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        ));
        if (!controls.length) { event.preventDefault(); return; }
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && window.document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && window.document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    }
    window.document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  // Check if active role has pending approval task on this document
  let canApproveRole: 'ATASAN' | 'AYU' | 'BOD_HERY' | 'BOD_HASHIMOTO' | null = null;

  const identityCanReview = Boolean(activeUserId) && document.ownerId !== activeUserId;
  const assignedHead = Boolean(activeUserEmail && document.stage1ApproverEmail) &&
    activeUserEmail!.toLowerCase() === document.stage1ApproverEmail!.toLowerCase();
  if (identityCanReview && document.docType !== 'GR' && (document.status === 'SUBMITTED' || document.status === 'IN_REVIEW')) {
    if (activeRole === 'ATASAN' && assignedHead && document.approvalSteps.atasan.status === 'PENDING') {
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

  async function handleApprove() {
    if (!canApproveRole) return;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError('');
    try {
      await runDecision(() => onApprove(document.id, canApproveRole, comment || undefined), onClose);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal menyetujui dokumen.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    if (!canApproveRole) return;
    if (isSubmittingRef.current) return;
    if (!comment.trim()) {
      setError('Alasan penolakan wajib diisi untuk instruksi revisi kepada pemohon.');
      return;
    }
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError('');
    try {
      await runDecision(() => onReject(document.id, canApproveRole, comment), onClose);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal mengembalikan dokumen.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <dialog
      className="modal detail-overlay"
      open
      aria-modal="true"
      aria-labelledby="document-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      onCancel={(e) => {
        e.preventDefault();
        if (!isSubmitting) onClose();
      }}
    >
      <section className="drawer s-drawer" ref={drawerRef}>
        <div className="drawer-head">
          <div>
            <h2 id="document-detail-title">{document.docNumber}</h2>
            <p>{document.title}</p>
          </div>
          <button className="close" type="button" onClick={onClose} aria-label="Tutup detail" disabled={isSubmitting}>
            <X size={18} />
          </button>
        </div>

        <div className="form-body">
          {/* Visual Stepper */}
          {document.docType !== 'GR' && <ApprovalStepper document={document} />}

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
            {document.attachments && document.attachments.length > 0 && (
              <div className="form-summary-row">
                <span>Lampiran Berkas:</span>
                <span>{document.attachments.map((a) => (
                  <button key={a.id} type="button" className="secondary" onClick={() => void openAttachment(a.id).catch(() => setError('Lampiran tidak dapat dibuka.'))}>
                    {a.name} ({Math.ceil(a.size / 1024)} KB)
                  </button>
                ))}</span>
              </div>
            )}

            {document.docType === 'PR' && (
              <>
                <div className="form-summary-row">
                  <span>Tipe Anggaran:</span>
                  <span>{(document as PRDocument).budgetType}</span>
                </div>
                <div className="form-summary-row">
                  <span>Kelengkapan IAM (≥ Rp 5 Juta):</span>
                  <span>{(document as PRDocument).isIamRequired ? `Wajib IAM (${(document as PRDocument).iamNumber || 'Belum diisi'})` : 'Di bawah ambang Rp 5 Juta'}</span>
                </div>
                <div className="form-summary-total">
                  <span>SUBTOTAL PR:</span>
                  <span>{rupiah.format((document as PRDocument).subtotalAmount)}</span>
                </div>
                {(document as PRDocument).totalAmount !== undefined && <div className="form-summary-row"><span>Perkiraan total:</span><strong>{rupiah.format((document as PRDocument).totalAmount ?? 0)}</strong></div>}
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
                {Boolean(
                  (document as PODocument).bankDetails?.bankName ||
                    (document as PODocument).bankDetails?.accountNumber ||
                    (document as PODocument).bankDetails?.accountHolder
                ) && (
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

            {document.docType === 'GR' && (
              <>
                <div className="form-summary-row">
                  <span>PO Terkait:</span>
                  <strong>{(document as GRDocument).parentPoNumber || (document as GRDocument).parentPoId}</strong>
                </div>
                <div className="form-summary-row">
                  <span>Jenis Penerimaan:</span>
                  <span>{(document as GRDocument).receiptType === 'SERVICE' ? 'Jasa (Wajib BAST)' : 'Barang (Wajib Foto)'}</span>
                </div>
                <div className="form-summary-row">
                  <span>Tanggal Diterima:</span>
                  <span>{(document as GRDocument).receivedDate}</span>
                </div>
                <div className="form-summary-row">
                  <span>Kondisi Barang / Jasa:</span>
                  <strong>{(document as GRDocument).itemCondition}</strong>
                </div>
                <div className="form-summary-row">
                  <span>Tindak Lanjut:</span>
                  <strong style={{ color: (document as GRDocument).itemCondition !== 'BAIK' ? '#991B1B' : '#065F46' }}>
                    {(document as GRDocument).itemCondition !== 'BAIK' ? 'Perlu tindakan' : 'Sesuai pesanan'}
                  </strong>
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
                {Boolean(
                  (document as PVDocument).beneficiaryBank?.bankName ||
                    (document as PVDocument).beneficiaryBank?.accountNumber
                ) && (
                  <div className="form-summary-row">
                    <span>Rekening Tujuan:</span>
                    <span>
                      {(document as PVDocument).beneficiaryBank.bankName} -{' '}
                      {(document as PVDocument).beneficiaryBank.accountNumber} (a/n{' '}
                      {(document as PVDocument).beneficiaryBank.accountHolder})
                    </span>
                  </div>
                )}
                {(document as PVDocument).paymentDueDate && (
                  <div className="form-summary-row">
                    <span>Jatuh Tempo Pembayaran:</span>
                    <span>{(document as PVDocument).paymentDueDate}</span>
                  </div>
                )}
                {(document as PVDocument).plannedSourceAccount && (
                  <div className="form-summary-row">
                    <span>Rekening Sumber Rencana:</span>
                    <span>{(document as PVDocument).plannedSourceAccount}</span>
                  </div>
                )}
                {(document as PVDocument).invoiceNumber && (
                  <div className="form-summary-row">
                    <span>Nomor Invoice:</span>
                    <span>
                      {(document as PVDocument).invoiceNumber}
                      {(document as PVDocument).invoiceDate ? ` (${(document as PVDocument).invoiceDate})` : ''}
                    </span>
                  </div>
                )}
                <div className="form-summary-row">
                  <span>Status Pembayaran:</span>
                  <strong>{(document as PVDocument).paymentStatus}</strong>
                </div>
                {(document as PVDocument).paymentDetails && (
                  <div className="form-summary-row">
                    <span>Bukti Transfer:</span>
                    <span>
                      {(document as PVDocument).paymentDetails?.sourceBank
                        ? `${(document as PVDocument).paymentDetails?.sourceBank} - `
                        : ''}
                      Ref: {(document as PVDocument).paymentDetails?.referenceNumber} (
                      {(document as PVDocument).paymentDetails?.paidAt})
                    </span>
                  </div>
                )}
                <div className="form-summary-total">
                  <span>DIBAYARKAN (TOTAL - PPH):</span>
                  <span>{rupiah.format((document as PVDocument).netAmountToPay)}</span>
                </div>
              </>
            )}
          </div>

          {/* Paket Audit PV (Only for PAID PVs and authorized roles) */}
          {document.docType === 'PV' &&
            (document as PVDocument).paymentStatus === 'PAID' &&
            (activeRole === 'KEUANGAN' ||
              activeRole === 'AYU' ||
              activeRole === 'BOD_HERY' ||
              activeRole === 'BOD_HASHIMOTO' ||
              activeRole === 'ADMIN') && (() => {
              const pv = document as PVDocument;
              const source = allDocuments.find((d) => d.id === pv.sourceDocId);
              const parentAv =
                source?.docType === 'RC'
                  ? allDocuments.find((d) => d.id === (source as RCDocument).parentAvId)
                  : undefined;
              const parentPo =
                source?.docType === 'PO'
                  ? (source as PODocument)
                  : source?.docType === 'AV' && (source as AVDocument).parentPoId
                  ? (allDocuments.find((d) => d.id === (source as AVDocument).parentPoId) as PODocument | undefined)
                  : parentAv?.docType === 'AV' && (parentAv as AVDocument).parentPoId
                  ? (allDocuments.find((d) => d.id === (parentAv as AVDocument).parentPoId) as PODocument | undefined)
                  : undefined;
              const parentPr =
                parentPo?.parentPrId
                  ? allDocuments.find((d) => d.id === parentPo.parentPrId)
                  : undefined;
              const linkedGrs = parentPo
                ? allDocuments.filter((d): d is GRDocument => d.docType === 'GR' && d.parentPoId === parentPo.id)
                : [];
              const chainDocs = [
                ...(parentPr ? [parentPr] : []),
                ...(parentPo && parentPo.id !== source?.id ? [parentPo] : []),
                ...(parentAv ? [parentAv] : []),
                ...(source ? [source] : []),
                ...linkedGrs,
                pv,
              ];
              return (
                <div className="form-summary-box" style={{ background: '#F8FAFC', border: '1px solid #CBD5E1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <ShieldCheck size={18} color="#065F46" />
                    <strong style={{ color: '#065F46' }}>
                      Paket Audit PV: Audit &rarr; {pv.docNumber}
                    </strong>
                  </div>
                  <p className="help" style={{ marginBottom: '8px' }}>
                    Bundel otomatis dokumen rujukan dari hulu ke hilir beserta lampiran pendukung dan ringkasan persetujuan.
                  </p>
                  <ul style={{ margin: '0 0 8px 18px', padding: 0, fontSize: '12.5px' }}>
                    {chainDocs.map((d) => (
                      <li key={d.id} style={{ marginBottom: '4px' }}>
                        <strong>[{d.docType}] {d.docNumber}</strong> — {d.title} ({d.status})
                        {d.attachments && d.attachments.length > 0 && (
                          <span>
                            {' '}· Berkas: {d.attachments.map((a) => a.name).join(', ')}
                          </span>
                        )}
                      </li>
                    ))}
                    {pv.paymentDetails && (
                      <li>
                        <strong>[PaymentProof]</strong> Ref: {pv.paymentDetails.referenceNumber} · Tanggal Bayar: {pv.paymentDetails.paidAt}
                        {pv.paymentDetails.proofUrl ? ` · Berkas: ${pv.paymentDetails.proofUrl}` : ''}
                      </li>
                    )}
                  </ul>
                </div>
              );
            })()}

          {/* Action Decision Box if user has authority */}
          {canApproveRole && (
            <div className="form-summary-box" style={{ background: '#fffbe6', border: '1px solid #ffe58f' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <strong style={{ color: '#874d00' }}>
                    Tindakan Persetujuan: {canApproveRole}
                  </strong>
                  <p style={{ fontSize: '12px', margin: '2px 0 0', color: '#613400' }}>
                    Profil aktif Anda memiliki kewenangan untuk mengambil keputusan atas pengajuan ini.
                  </p>
                </div>
              </div>

              <label htmlFor="decision-note">Catatan Peninjauan / Alasan</label>
              <textarea
                id="decision-note"
                rows={2}
                disabled={isSubmitting}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tuliskan catatan persetujuan atau alasan revisi/penolakan..."
              />

              <div className="decision-actions">
                <button
                  type="button"
                  className="secondary"
                  style={{ color: '#a13f34', borderColor: '#e8bcbc' }}
                  onClick={handleReject}
                  disabled={isSubmitting}
                >
                  Tolak (Kembalikan ke Draf)
                </button>
                <button
                  type="button"
                  className="primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={handleApprove}
                  disabled={isSubmitting}
                >
                  <Check size={16} />
                  Setujui Dokumen
                </button>
              </div>
            </div>
          )}

          {/* Audit Log History */}
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--text-primary)' }}>
              Riwayat Log Audit & Jejak Persetujuan
            </h4>
            <ul className="audit-list">
              {document.auditLog.map((log) => (
                <li key={log.id} className="audit-item">
                  <div className="audit-item-head">
                    <span>
                      {displayPersonName(log.actor)} : <span style={{ color: 'var(--accent-ruby)' }}>{log.action}</span>
                    </span>
                    <small style={{ color: 'var(--text-muted)' }}>
                      {new Intl.DateTimeFormat('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(log.timestamp))}
                    </small>
                  </div>
                  {log.comment && <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>"{log.comment}"</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {error && <div className="notice error-notice" role="alert">{error}</div>}
        {isSubmitting && <div className="notice" role="status">Memproses keputusan…</div>}
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose} disabled={isSubmitting}>
            Tutup
          </button>
        </div>
      </section>
    </dialog>
  );
};

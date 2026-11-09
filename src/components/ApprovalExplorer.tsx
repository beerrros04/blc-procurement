import React, { useMemo, useState } from 'react';
import {
  Banknote,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Receipt,
  Scale,
  Search,
  ShoppingBag,
  XCircle,
} from 'lucide-react';
import type { AnyDocument, DocType } from '../types/document';
import { openAttachment } from '../api';

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

function getDocAmount(doc: AnyDocument): number {
  switch (doc.docType) {
    case 'PR':
      return doc.totalAmount ?? doc.subtotalAmount;
    case 'PO':
      return doc.totalAmount;
    case 'AV':
      return doc.amount;
    case 'RB':
      return doc.totalAmount;
    case 'RC':
      return doc.realizedAmount;
    case 'PV':
      return doc.netAmountToPay;
    default:
      return 0;
  }
}

function getDocTypeVisual(docType: DocType) {
  switch (docType) {
    case 'PR':
      return { icon: FileText, bg: '#FDF2F4', color: '#E51937', label: 'Purchase Request' };
    case 'PO':
      return { icon: ShoppingBag, bg: '#E5F3FB', color: '#0085DB', label: 'Purchase Order' };
    case 'AV':
      return { icon: Banknote, bg: '#FEF5E5', color: '#FFAE1F', label: 'Cash Advance' };
    case 'RB':
      return { icon: Receipt, bg: '#F2ECF9', color: '#8763DA', label: 'Reimbursement' };
    case 'RC':
      return { icon: Scale, bg: '#E6FFFA', color: '#00CEB6', label: 'Realisasi AV' };
    case 'PV':
      return { icon: CreditCard, bg: '#E6FFFA', color: '#008A7A', label: 'Payment Voucher' };
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'APPROVED':
      return { label: 'Disetujui', color: '#008A7A', bg: '#E6FFFA', border: '#B2F5EA' };
    case 'PAID':
      return { label: 'Lunas', color: '#008A7A', bg: '#E6FFFA', border: '#B2F5EA' };
    case 'REJECTED':
      return { label: 'Ditolak', color: '#C8132D', bg: '#FDF2F4', border: '#FECDD3' };
    case 'SUBMITTED':
      return { label: 'Diajukan', color: '#B4690E', bg: '#FEF5E5', border: '#FDE68A' };
    case 'IN_REVIEW':
      return { label: 'Ditinjau', color: '#E51937', bg: '#FDF2F4', border: '#FBCFE8' };
    case 'DRAFT':
    default:
      return { label: 'Draf', color: '#5A6A85', bg: '#F0F5F9', border: '#DFE5EF' };
  }
}

function getDocApplicant(doc: AnyDocument): string {
  const firstLog = doc.auditLog[0];
  if (firstLog && firstLog.actor) {
    return firstLog.actor.replace(/\s*\(.*?\)\s*/g, '');
  }
  return `Staff ${doc.branch}`;
}

function formatDateShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  IAM_MEMO: 'Internal Approval Memo',
  QUOTATION: 'Quotation Vendor',
  RECEIPT: 'Kwitansi / Struk',
  REFUND_PROOF: 'Bukti Pengembalian',
  PAYMENT_PROOF: 'Bukti Transfer',
  OTHER: 'Dokumen Pendukung',
};

// ============================================================================
// 1. APPROVAL REGISTER VIEW
// ============================================================================

export interface ApprovalRegisterViewProps {
  documents: AnyDocument[];
  onOpenDetail: (doc: AnyDocument) => void;
}

export const ApprovalRegisterView: React.FC<ApprovalRegisterViewProps> = ({
  documents,
  onOpenDetail,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocType | 'ALL'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      if (typeFilter !== 'ALL' && doc.docType !== typeFilter) return false;
      const isPaid = doc.status === 'PAID' || (doc.docType === 'PV' && doc.paymentStatus === 'PAID');
      if (paymentFilter === 'PAID' && !isPaid) return false;
      if (paymentFilter === 'UNPAID' && isPaid) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          doc.docNumber.toLowerCase().includes(q) ||
          doc.title.toLowerCase().includes(q) ||
          doc.branch.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [documents, search, typeFilter, paymentFilter]);

  return (
    <section
      className="list-card"
      aria-label="Approval Register"
      style={{ padding: '26px', borderRadius: 'var(--card-radius)', marginTop: 0 }}
    >
      {/* Card Header & Search */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#111C2D' }}>
          Approval Register
        </h2>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#7C8FAC',
            }}
          />
          <input
            type="search"
            placeholder="Cari nomor dokumen, judul, cabang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px 9px 38px',
              fontSize: '13px',
              borderRadius: '30px',
              border: '1px solid var(--border-medium)',
              background: '#F8FAFD',
              color: '#111C2D',
            }}
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '22px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#7C8FAC',
            marginRight: '4px',
          }}
        >
          <Filter size={13} />
          Modul:
        </span>
        {(['ALL', 'PR', 'PO', 'AV', 'RB', 'RC', 'PV'] as const).map((t) => {
          const isSelected = typeFilter === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '30px',
                cursor: 'pointer',
                border: `1px solid ${isSelected ? '#E51937' : 'var(--border-subtle)'}`,
                background: isSelected ? '#E51937' : '#F8FAFD',
                color: isSelected ? '#FFFFFF' : '#5A6A85',
              }}
            >
              {t === 'ALL' ? 'Semua' : t}
            </button>
          );
        })}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {(['ALL', 'PAID', 'UNPAID'] as const).map((p) => {
            const active = paymentFilter === p;
            const label = p === 'ALL' ? 'Semua Bayar' : p === 'PAID' ? 'Lunas' : 'Belum Dibayar';
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPaymentFilter(p)}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '30px',
                  cursor: 'pointer',
                  border: `1px solid ${active ? '#E51937' : 'var(--border-subtle)'}`,
                  background: active ? '#FFF5F7' : '#F8FAFD',
                  color: active ? '#E51937' : '#5A6A85',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Register Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nomor & Judul</th>
              <th>Cabang</th>
              <th>Total Pengajuan</th>
              <th>Dibayarkan</th>
              <th>Tahap</th>
              <th>Status</th>
              <th>Pembayaran</th>
              <th>Pemohon</th>
              <th>Tanggal</th>
              <th style={{ textAlign: 'right' }}>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc) => {
              const visual = getDocTypeVisual(doc.docType);
              const DocIcon = visual.icon;
              const badge = getStatusBadge(doc.status);
              const totalAmt = getDocAmount(doc);
              const isPaid =
                doc.status === 'PAID' || (doc.docType === 'PV' && doc.paymentStatus === 'PAID');
              const paidAmt = isPaid ? totalAmt : 0;

              const dots = [
                { name: '1. Atasan', st: doc.approvalSteps.atasan.status },
                { name: '2. Bu Ayu', st: doc.approvalSteps.ayu.status },
                { name: '3a. Pak Hery', st: doc.approvalSteps.bod.heryStatus },
                { name: '3b. Hashimoto', st: doc.approvalSteps.bod.hashimotoStatus },
              ];

              return (
                <tr key={doc.id}>
                  <td>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                      onClick={() => onOpenDetail(doc)}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: visual.bg,
                          color: visual.color,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <DocIcon size={18} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#111C2D' }}>
                            {doc.docNumber}
                          </strong>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '6px',
                              background: visual.bg,
                              color: visual.color,
                            }}
                          >
                            {doc.docType}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#7C8FAC', marginTop: '2px' }}>
                          {doc.title}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                      <Building2 size={13} color="#7C8FAC" />
                      {doc.branch}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#111C2D' }}>
                    {rupiah.format(totalAmt)}
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: paidAmt > 0 ? '#008A7A' : '#7C8FAC',
                    }}
                  >
                    {rupiah.format(paidAmt)}
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      {dots.map((d, i) => {
                        let bg = '#CBD5E1';
                        if (d.st === 'APPROVED') bg = '#00CEB6';
                        else if (d.st === 'PENDING') bg = '#FFAE1F';
                        else if (d.st === 'REJECTED') bg = '#E51937';
                        return (
                          <span
                            key={i}
                            title={`${d.name}: ${d.st}`}
                            style={{
                              width: '9px',
                              height: '9px',
                              borderRadius: '50%',
                              background: bg,
                              display: 'inline-block',
                            }}
                          />
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: isPaid ? '#E6FFFA' : '#FEF5E5',
                        color: isPaid ? '#008A7A' : '#B4690E',
                      }}
                    >
                      {isPaid ? 'Lunas' : 'Belum Dibayar'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '12.5px', color: '#5A6A85' }}>
                    {getDocApplicant(doc)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#7C8FAC' }}>
                    {formatDateShort(doc.createdAt)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="secondary"
                      style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '30px' }}
                      onClick={() => onOpenDetail(doc)}
                    >
                      <Eye size={13} /> Detail
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// ============================================================================
// 2. APPROVAL HISTORY VIEW
// ============================================================================

export interface ApprovalHistoryViewProps {
  documents: AnyDocument[];
  onOpenDetail: (doc: AnyDocument) => void;
}

interface HistoryRow {
  id: string;
  timestamp: string;
  doc: AnyDocument;
  docNumber: string;
  docType: DocType;
  stageLabel: string;
  actionType: 'APPROVE' | 'REJECT' | 'SUBMIT' | 'PAYMENT' | 'DRAFT';
  actionBadge: string;
  actor: string;
  comment: string;
}

export const ApprovalHistoryView: React.FC<ApprovalHistoryViewProps> = ({
  documents,
  onOpenDetail,
}) => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'APPROVE' | 'REJECT' | 'SUBMIT' | 'PAYMENT'>('ALL');

  const historyRows = useMemo<HistoryRow[]>(() => {
    const rows: HistoryRow[] = [];

    for (const doc of documents) {
      for (const log of doc.auditLog) {
        const actUpper = log.action.toUpperCase();
        let actionType: HistoryRow['actionType'] = 'DRAFT';
        let actionBadge = 'Draf Dibuat';
        let stageLabel = 'Pemohon';

        if (actUpper.includes('APPROVE')) {
          actionType = 'APPROVE';
          actionBadge = 'Disetujui';
          if (actUpper.includes('ATASAN')) stageLabel = 'Tahap 1: Atasan';
          else if (actUpper.includes('AYU')) stageLabel = 'Tahap 2: Bu Ayu';
          else if (actUpper.includes('HERY')) stageLabel = 'Tahap 3A: Pak Hery';
          else if (actUpper.includes('HASHIMOTO')) stageLabel = 'Tahap 3B: Hashimoto';
          else stageLabel = 'Persetujuan BoD';
        } else if (actUpper.includes('REJECT')) {
          actionType = 'REJECT';
          actionBadge = 'Ditolak';
          stageLabel = 'Revisi';
        } else if (actUpper.includes('SUBMIT')) {
          actionType = 'SUBMIT';
          actionBadge = 'Diajukan';
          stageLabel = 'Pengajuan';
        } else if (actUpper.includes('PAYMENT') || actUpper.includes('PV')) {
          actionType = 'PAYMENT';
          actionBadge = 'Dibayarkan';
          stageLabel = 'Keuangan';
        }

        rows.push({
          id: `${doc.id}-${log.id}`,
          timestamp: log.timestamp,
          doc,
          docNumber: doc.docNumber,
          docType: doc.docType,
          stageLabel,
          actionType,
          actionBadge,
          actor: log.actor,
          comment: log.comment || '-',
        });
      }
    }

    return rows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [documents]);

  const filteredRows = useMemo(() => {
    return historyRows.filter((r) => {
      if (actionFilter !== 'ALL' && r.actionType !== actionFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.docNumber.toLowerCase().includes(q) ||
          r.actor.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q) ||
          r.doc.title.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [historyRows, actionFilter, search]);

  return (
    <section
      className="list-card"
      aria-label="Approval History"
      style={{ padding: '26px', borderRadius: 'var(--card-radius)', marginTop: 0 }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#111C2D' }}>
          Approval History
        </h2>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#7C8FAC',
            }}
          />
          <input
            type="search"
            placeholder="Cari dokumen, pejabat, komentar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px 9px 38px',
              fontSize: '13px',
              borderRadius: '30px',
              border: '1px solid var(--border-medium)',
              background: '#F8FAFD',
              color: '#111C2D',
            }}
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '22px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#7C8FAC',
            marginRight: '4px',
          }}
        >
          <Filter size={13} />
          Keputusan:
        </span>
        {(
          [
            { id: 'ALL', label: 'Semua Aktivitas' },
            { id: 'APPROVE', label: 'Disetujui' },
            { id: 'REJECT', label: 'Ditolak' },
            { id: 'SUBMIT', label: 'Diajukan' },
            { id: 'PAYMENT', label: 'Dibayarkan' },
          ] as const
        ).map((f) => {
          const active = actionFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActionFilter(f.id)}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '30px',
                cursor: 'pointer',
                border: `1px solid ${active ? '#E51937' : 'var(--border-subtle)'}`,
                background: active ? '#E51937' : '#F8FAFD',
                color: active ? '#FFFFFF' : '#5A6A85',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Dokumen</th>
              <th>Tahap</th>
              <th>Keputusan</th>
              <th>Pejabat</th>
              <th>Catatan</th>
              <th style={{ textAlign: 'right' }}>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              let badgeBg = '#F0F5F9';
              let badgeColor = '#5A6A85';
              let IconComp = Clock;

              if (row.actionType === 'APPROVE' || row.actionType === 'PAYMENT') {
                badgeBg = '#E6FFFA';
                badgeColor = '#008A7A';
                IconComp = CheckCircle2;
              } else if (row.actionType === 'REJECT') {
                badgeBg = '#FDF2F4';
                badgeColor = '#C8132D';
                IconComp = XCircle;
              } else if (row.actionType === 'SUBMIT') {
                badgeBg = '#E5F3FB';
                badgeColor = '#0085DB';
              }

              return (
                <tr key={row.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#7C8FAC' }}>
                    {formatDateTime(row.timestamp)}
                  </td>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: '#111C2D', fontSize: '13px' }}>
                      {row.docNumber}
                    </strong>
                    <div style={{ fontSize: '12px', color: '#7C8FAC' }}>{row.doc.title}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#111C2D' }}>{row.stageLabel}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: badgeBg,
                        color: badgeColor,
                      }}
                    >
                      <IconComp size={13} />
                      {row.actionBadge}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: '#111C2D' }}>{row.actor}</td>
                  <td style={{ color: '#5A6A85', maxWidth: '280px' }}>{row.comment}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="secondary"
                      style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '30px' }}
                      onClick={() => onOpenDetail(row.doc)}
                    >
                      <Eye size={13} /> Detail
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// ============================================================================
// 3. APPROVAL DOCS VIEW
// ============================================================================

export interface ApprovalDocsViewProps {
  documents: AnyDocument[];
  onOpenDetail: (doc: AnyDocument) => void;
}

interface DocLibraryItem {
  id: string;
  fileName: string;
  category: string;
  sizeBytes: number;
  uploadedAt: string;
  attachmentId: string;
  parentDoc: AnyDocument;
}

export const ApprovalDocsView: React.FC<ApprovalDocsViewProps> = ({
  documents,
  onOpenDetail,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [fileError, setFileError] = useState('');

  const libraryItems = useMemo<DocLibraryItem[]>(() => {
    const items: DocLibraryItem[] = [];

    for (const doc of documents) {
      if (doc.attachments && doc.attachments.length > 0) {
        for (const att of doc.attachments) {
          items.push({
            id: `${doc.id}-${att.id}`,
            fileName: att.name,
            category: att.category,
            sizeBytes: att.size,
            uploadedAt: att.uploadedAt,
            attachmentId: att.id,
            parentDoc: doc,
          });
        }
      }

    }

    return items.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }, [documents]);

  const filteredItems = useMemo(() => {
    return libraryItems.filter((item) => {
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.fileName.toLowerCase().includes(q) ||
          item.parentDoc.docNumber.toLowerCase().includes(q) ||
          item.parentDoc.title.toLowerCase().includes(q) ||
          item.parentDoc.branch.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [libraryItems, categoryFilter, search]);

  return (
    <section
      className="list-card"
      aria-label="Approval Docs"
      style={{ padding: '26px', borderRadius: 'var(--card-radius)', marginTop: 0 }}
    >
      {fileError && <div className="notice error-notice" role="alert">{fileError}</div>}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#111C2D' }}>
          Approval Docs
        </h2>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#7C8FAC',
            }}
          />
          <input
            type="search"
            placeholder="Cari nama berkas, nomor dokumen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px 9px 38px',
              fontSize: '13px',
              borderRadius: '30px',
              border: '1px solid var(--border-medium)',
              background: '#F8FAFD',
              color: '#111C2D',
            }}
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '22px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#7C8FAC',
            marginRight: '4px',
          }}
        >
          <Filter size={13} />
          Kategori:
        </span>
        {(
          [
            { id: 'ALL', label: 'Semua' },
            { id: 'IAM_MEMO', label: 'IAM Memo' },
            { id: 'QUOTATION', label: 'Quotation' },
            { id: 'RECEIPT', label: 'Kwitansi' },
            { id: 'PAYMENT_PROOF', label: 'Bukti Transfer' },
            { id: 'REFUND_PROOF', label: 'Bukti Pengembalian' },
          ] as const
        ).map((c) => {
          const active = categoryFilter === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryFilter(c.id)}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '30px',
                cursor: 'pointer',
                border: `1px solid ${active ? '#E51937' : 'var(--border-subtle)'}`,
                background: active ? '#E51937' : '#F8FAFD',
                color: active ? '#FFFFFF' : '#5A6A85',
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nama Berkas</th>
              <th>Kategori</th>
              <th>Dokumen Induk</th>
              <th>Cabang</th>
              <th>Pemohon</th>
              <th>Nominal</th>
              <th style={{ textAlign: 'right' }}>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const doc = item.parentDoc;
              const catLabel = CATEGORY_LABELS[item.category] || item.category;

              return (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: '#FDF2F4',
                          color: '#E51937',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <FileText size={18} />
                      </div>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#111C2D' }}>{item.fileName}</strong>
                        <div style={{ fontSize: '11px', color: '#7C8FAC', fontFamily: 'var(--font-mono)' }}>
                          {Math.round(item.sizeBytes / 1024)} KB • {formatDateShort(item.uploadedAt)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: '#F0F5F9',
                        color: '#5A6A85',
                      }}
                    >
                      {catLabel}
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: '#E51937', fontSize: '13px' }}>
                      {doc.docNumber}
                    </strong>
                    <div style={{ fontSize: '12px', color: '#7C8FAC' }}>{doc.title}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#5A6A85' }}>{doc.branch}</td>
                  <td style={{ fontWeight: 700, color: '#5A6A85' }}>{getDocApplicant(doc)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#111C2D' }}>
                    {rupiah.format(getDocAmount(doc))}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => void openAttachment(item.attachmentId).catch(() => setFileError('Lampiran tidak dapat dibuka.'))}
                          className="secondary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            borderRadius: '30px',
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={13} /> Unduh
                        </button>
                      <button
                        type="button"
                        className="secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '30px' }}
                        onClick={() => onOpenDetail(doc)}
                      >
                        <Eye size={13} /> Detail
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

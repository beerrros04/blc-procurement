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
import { branchOptions } from '../domain/branches';
import { displayPersonName } from '../domain/display-name';
import { ApprovalProgress } from './ApprovalProgress';
import { StatusBadge } from './ui/StatusBadge';
import './document-lists.css';

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

function getDocAmount(doc: AnyDocument): number {
  switch (doc.docType) {
    case 'PR':
      return (doc.totalAmount ?? doc.subtotalAmount) + (doc.pphAmount ?? 0);
    case 'PO':
      return doc.totalAmount + doc.pphAmount;
    case 'AV':
      return doc.amount + (doc.pphAmount ?? 0);
    case 'RB':
      return doc.totalAmount + (doc.pphAmount ?? 0);
    case 'RC':
      return doc.realizedAmount;
    case 'PV':
      return doc.grossAmount;
    default:
      return 0;
  }
}

function getNetPayableAmount(doc: AnyDocument): number {
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
      return { icon: ShoppingBag, bg: '#F1F5F9', color: '#1E293B', label: 'Purchase Order' };
    case 'GR':
      return { icon: CheckCircle2, bg: '#ECFDF5', color: '#065F46', label: 'Laporan Penerimaan' };
    case 'AV':
      return { icon: Banknote, bg: '#F1F5F9', color: '#1E293B', label: 'Cash Advance' };
    case 'RB':
      return { icon: Receipt, bg: '#F1F5F9', color: '#1E293B', label: 'Reimbursement' };
    case 'RC':
      return { icon: Scale, bg: '#F1F5F9', color: '#1E293B', label: 'Realisasi AV' };
    case 'PV':
      return { icon: CreditCard, bg: '#F1F5F9', color: '#1E293B', label: 'Payment Voucher' };
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'APPROVED':
      return { label: 'Disetujui', color: '#008A7A', bg: '#E6FFFA', border: '#B2F5EA' };
    case 'PAID':
      return { label: 'Lunas', color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' };
    case 'REJECTED':
      return { label: 'Ditolak', color: '#C8132D', bg: '#FDF2F4', border: '#FECDD3' };
    case 'SUBMITTED':
      return { label: 'Diajukan', color: '#B4690E', bg: '#FEF5E5', border: '#FDE68A' };
    case 'IN_REVIEW':
      return { label: 'Ditinjau', color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' };
    case 'DRAFT':
    default:
      return { label: 'Draf', color: '#5A6A85', bg: '#F0F5F9', border: '#DFE5EF' };
  }
}

function getDocApplicant(doc: AnyDocument): string {
  const firstLog = doc.auditLog[0];
  if (firstLog && firstLog.actor) {
    return displayPersonName(firstLog.actor);
  }
  return 'Nama belum tersedia';
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
  INVOICE: 'Invoice / Tagihan',
  RECEIPT: 'Kwitansi / Struk',
  REFUND_PROOF: 'Bukti Pengembalian',
  PAYMENT_PROOF: 'Bukti Transfer',
  PHOTO: 'Foto Barang (GR)',
  BAST: 'BAST Jasa (GR)',
  SUPPORTING: 'Dokumen Pendukung',
  OTHER: 'Dokumen Pendukung',
};

// ============================================================================
// 1. APPROVAL REGISTER VIEW
// ============================================================================

export interface ApprovalRegisterViewProps {
  documents: AnyDocument[];
  onOpenDetail: (doc: AnyDocument) => void;
}

export type QuickLedgerFilter =
  | 'ALL'
  | 'MENUNGGU'
  | 'MENUNGGU_PV'
  | 'JADWAL_PEMBAYARAN'
  | 'UNPAID'
  | 'PAID'
  | 'AV_TANPA_PO'
  | 'CA_BELUM_REALISASI';

export interface RegisterFilters {
  search: string;
  type: DocType | 'ALL';
  branch: string;
  progress: 'ALL' | 'DRAFT' | 'MENUNGGU' | 'REJECTED' | 'APPROVED' | 'PAID';
  action: QuickLedgerFilter;
}

export function filterRegisterDocuments(documents: AnyDocument[], filters: RegisterFilters): AnyDocument[] {
  const { search, type, branch, progress, action } = filters;
  return documents.filter((doc) => {
    if (type !== 'ALL' && doc.docType !== type) return false;
    if (branch !== 'ALL' && doc.branch !== branch) return false;
    if (progress === 'MENUNGGU' && doc.status !== 'SUBMITTED' && doc.status !== 'IN_REVIEW') return false;
    const lastDecision = [...doc.auditLog].reverse().find((entry) => entry.action === 'REJECT' || entry.action === 'SUBMIT');
    const needsRevision = doc.status === 'REJECTED' || (doc.status === 'DRAFT' && lastDecision?.action === 'REJECT');
    if (progress === 'REJECTED' && !needsRevision) return false;
    if (progress === 'DRAFT' && (doc.status !== 'DRAFT' || needsRevision)) return false;
    if (progress !== 'ALL' && progress !== 'MENUNGGU' && progress !== 'REJECTED' && progress !== 'DRAFT' && doc.status !== progress) return false;
    const isPvPaid = doc.docType === 'PV' && doc.paymentStatus === 'PAID';
    if (action === 'MENUNGGU' && doc.status !== 'SUBMITTED' && doc.status !== 'IN_REVIEW') return false;
    if (action === 'MENUNGGU_PV') {
      const needsPv = doc.status === 'APPROVED' &&
        (doc.docType === 'PO' || doc.docType === 'AV' || doc.docType === 'RB' || (doc.docType === 'RC' && doc.outcomeType === 'DEFICIT')) &&
        !documents.some((d) => d.docType === 'PV' && d.sourceDocId === doc.id && d.status !== 'REJECTED');
      if (!needsPv) return false;
    }
    if (action === 'JADWAL_PEMBAYARAN' && !(doc.docType === 'PV' && doc.paymentStatus === 'UNPAID')) return false;
    if (action === 'PAID' && !isPvPaid) return false;
    if (action === 'UNPAID' && !(doc.docType === 'PV' && doc.paymentStatus === 'UNPAID')) return false;
    if (action === 'AV_TANPA_PO' && !(doc.docType === 'AV' && !doc.parentPoId)) return false;
    if (action === 'CA_BELUM_REALISASI') {
      if (doc.docType !== 'AV' || doc.status !== 'PAID') return false;
      if (documents.some((rc) => rc.docType === 'RC' && rc.parentAvId === doc.id && Boolean(rc.financeConfirmedAt))) return false;
    }
    const q = search.trim().toLowerCase();
    return !q || [doc.docNumber, doc.title, doc.branch, doc.purpose].some((value) => value.toLowerCase().includes(q));
  });
}

export const ApprovalRegisterView: React.FC<ApprovalRegisterViewProps> = ({
  documents,
  onOpenDetail,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocType | 'ALL'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<QuickLedgerFilter>('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [progressFilter, setProgressFilter] = useState<RegisterFilters['progress']>('ALL');

  const filtered = useMemo(() => filterRegisterDocuments(documents, {
    search, type: typeFilter, branch: branchFilter, progress: progressFilter, action: paymentFilter,
  }), [documents, search, typeFilter, branchFilter, progressFilter, paymentFilter]);

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
            aria-label="Cari nomor, judul, tujuan, atau cabang di register"
            placeholder="Cari nomor dokumen, judul, cabang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="control-height-md"
            style={{
              width: '100%',
              height: '36px',
              padding: '0 14px 0 38px',
              fontSize: '13px',
              borderRadius: '30px',
              border: '1px solid var(--border-medium)',
              background: '#F8FAFD',
              color: '#111C2D',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div className="register-filters" aria-label="Filter register">
        <label>Jenis pengajuan
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as DocType | 'ALL')}>
            {(['ALL', 'PR', 'PO', 'GR', 'AV', 'RB', 'RC', 'PV'] as const).map((type) => <option key={type} value={type}>{type === 'ALL' ? 'Semua jenis' : type}</option>)}
          </select>
        </label>
        <label>Cabang
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
            <option value="ALL">Semua cabang</option>
            {branchOptions(documents.map((doc) => doc.branch)).map((branch) => <option key={branch} value={branch}>{branch}</option>)}
          </select>
        </label>
        <label>Progres
          <select value={progressFilter} onChange={(e) => setProgressFilter(e.target.value as RegisterFilters['progress'])}>
            <option value="ALL">Semua progres</option><option value="DRAFT">Draf</option><option value="MENUNGGU">Menunggu</option><option value="REJECTED">Perlu revisi</option><option value="APPROVED">Disetujui</option><option value="PAID">Lunas</option>
          </select>
        </label>
        <label>Tindak lanjut
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as QuickLedgerFilter)}>
            <option value="ALL">Semua tindak lanjut</option><option value="MENUNGGU">Menunggu</option><option value="MENUNGGU_PV">Menunggu PV</option><option value="JADWAL_PEMBAYARAN">Jadwal Pembayaran</option><option value="UNPAID">Belum Dibayar</option><option value="PAID">Lunas</option><option value="AV_TANPA_PO">AV Tanpa PO</option><option value="CA_BELUM_REALISASI">CA Belum Direalisasikan</option>
          </select>
        </label>
        <button type="button" className="secondary control-height-md" onClick={() => { setSearch(''); setTypeFilter('ALL'); setBranchFilter('ALL'); setProgressFilter('ALL'); setPaymentFilter('ALL'); }}>Atur ulang</button>
      </div>
      <p className="register-filter-summary" role="status">{filtered.length} dari {documents.length} dokumen ditampilkan</p>

      {/* Register Table */}
      <div className="table-wrap">
        <table className="document-table register-table">
          <thead>
            <tr>
              <th>Nomor & Judul</th>
              <th>Cabang</th>
              <th scope="col" className="th-nominal text-right" style={{ textAlign: 'right' }}>Total Pengajuan</th>
              <th scope="col" className="th-nominal text-right" style={{ textAlign: 'right' }} title="Nilai neto yang direncanakan; status aktual ada pada kolom Pembayaran">Dibayarkan <span className="register-column-note">(neto)</span></th>
              <th>Tahap</th>
              <th>Status</th>
              <th>Pembayaran</th>
              <th>Pemohon</th>
              <th>Tanggal</th>
              <th style={{ textAlign: 'right' }}>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={10}>Tidak ada dokumen yang sesuai dengan filter.</td></tr>}
            {filtered.map((doc) => {
              const visual = getDocTypeVisual(doc.docType);
              const DocIcon = visual.icon;
              const totalAmt = getDocAmount(doc);
              const netPayableAmt = getNetPayableAmount(doc);
              const isPvPaid = doc.docType === 'PV' && doc.paymentStatus === 'PAID';

              return (
                <tr key={doc.id}>
                  <td data-label="Dokumen">
                    <button
                      type="button"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'transparent',
                        border: 0,
                        padding: 0,
                        cursor: 'pointer',
                        textAlign: 'left',
                        font: 'inherit',
                        color: 'inherit',
                        width: '100%',
                      }}
                      onClick={() => onOpenDetail(doc)}
                      aria-label={`Buka detail ${doc.docNumber}: ${doc.title}`}
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
                          border: '1px solid #E2E8F0',
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
                              border: '1px solid #E2E8F0',
                            }}
                          >
                            {doc.docType}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted, #4B5563)', marginTop: '2px' }}>
                          {doc.title}
                        </div>
                      </div>
                    </button>
                  </td>
                  <td data-label="Cabang">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                      <Building2 size={13} color="#4B5563" />
                      {doc.branch}
                    </span>
                  </td>
                  <td
                    data-label="Total Pengajuan"
                    className="col-nominal text-right tabular-nums tabular-currency font-mono"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: '#111C2D',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {rupiah.format(totalAmt)}
                  </td>
                  <td
                    data-label="Dibayarkan"
                    className="col-nominal text-right tabular-nums tabular-currency font-mono"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: netPayableAmt > 0 ? '#008A7A' : 'var(--text-muted, #4B5563)',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {rupiah.format(netPayableAmt)}
                  </td>
                  <td data-label="Tahap"><ApprovalProgress document={doc} compact /></td>
                  <td data-label="Status">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td data-label="Pembayaran">
                    {doc.docType === 'PV' ? (
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: isPvPaid ? '#E6FFFA' : '#FEF5E5',
                          color: isPvPaid ? '#008A7A' : '#B4690E',
                        }}
                      >
                        {isPvPaid ? 'Lunas' : 'Belum Dibayar'}
                      </span>
                    ) : (
                      <span style={{ color: '#94A3B8', fontWeight: 700 }}>—</span>
                    )}
                  </td>
                  <td data-label="Pemohon" style={{ fontWeight: 700, fontSize: '12.5px', color: '#374151' }}>
                    {getDocApplicant(doc)}
                  </td>
                  <td data-label="Tanggal" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted, #4B5563)' }}>
                    {formatDateShort(doc.createdAt)}
                  </td>
                  <td data-label="Tindakan" style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="secondary"
                      style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--btn-radius, 8px)' }}
                      onClick={() => onOpenDetail(doc)}
                      aria-label={`Buka detail ${doc.docNumber}`}
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
          else if (actUpper.includes('AYU')) stageLabel = 'Ayu Martina';
          else if (actUpper.includes('HERY')) stageLabel = 'Hery Sugiarto';
          else if (actUpper.includes('HASHIMOTO')) stageLabel = 'Koji Hashimoto';
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
              color: 'var(--text-muted, #4B5563)',
            }}
          />
          <input
            type="search"
            placeholder="Cari dokumen, pejabat, komentar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="control-height-md"
            style={{
              width: '100%',
              height: '36px',
              padding: '0 14px 0 38px',
              fontSize: '13px',
              borderRadius: '30px',
              border: '1px solid var(--border-medium)',
              background: '#F8FAFD',
              color: '#111C2D',
              boxSizing: 'border-box',
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
            color: 'var(--text-secondary, #374151)',
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
              className="control-height-md"
              style={{
                height: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 14px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '30px',
                cursor: 'pointer',
                border: `1px solid ${active ? '#E51937' : 'var(--border-subtle)'}`,
                background: active ? '#E51937' : '#F8FAFD',
                color: active ? '#FFFFFF' : 'var(--text-secondary, #374151)',
                boxSizing: 'border-box',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="table-wrap">
        <table className="document-table register-table" data-density="compact">
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
              return (
                <tr key={row.id}>
                  <td
                    data-label="Waktu"
                    className="tabular-nums font-mono"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      color: 'var(--text-muted, #4B5563)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatDateTime(row.timestamp)}
                  </td>
                  <td data-label="Dokumen">
                    <strong style={{ fontFamily: 'var(--font-mono)', color: '#111C2D', fontSize: '13px' }}>
                      {row.docNumber}
                    </strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted, #4B5563)' }}>{row.doc.title}</div>
                  </td>
                  <td data-label="Tahap" style={{ fontWeight: 700, color: '#111C2D' }}>{row.stageLabel}</td>
                  <td data-label="Keputusan">
                    <StatusBadge
                      status={
                        row.actionType === 'PAYMENT'
                          ? 'PAID'
                          : row.actionType === 'APPROVE'
                          ? 'APPROVED'
                          : row.actionType === 'REJECT'
                          ? 'REJECTED'
                          : row.actionType === 'SUBMIT'
                          ? 'SUBMITTED'
                          : 'DRAFT'
                      }
                    />
                  </td>
                  <td data-label="Pejabat" style={{ fontWeight: 800, color: '#111C2D' }}>{displayPersonName(row.actor)}</td>
                  <td data-label="Catatan" style={{ color: 'var(--text-secondary, #374151)', maxWidth: '280px' }}>{row.comment}</td>
                  <td data-label="Tindakan" style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="secondary"
                      style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--btn-radius, 8px)' }}
                      onClick={() => onOpenDetail(row.doc)}
                      aria-label={`Buka detail ${row.docNumber}`}
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
              color: 'var(--text-muted, #4B5563)',
            }}
          />
          <input
            type="search"
            placeholder="Cari nama berkas, nomor dokumen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="control-height-md"
            style={{
              width: '100%',
              height: '36px',
              padding: '0 14px 0 38px',
              fontSize: '13px',
              borderRadius: '30px',
              border: '1px solid var(--border-medium)',
              background: '#F8FAFD',
              color: '#111C2D',
              boxSizing: 'border-box',
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
            color: 'var(--text-secondary, #374151)',
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
              className="control-height-md"
              style={{
                height: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 14px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '30px',
                cursor: 'pointer',
                border: `1px solid ${active ? '#E51937' : 'var(--border-subtle)'}`,
                background: active ? '#E51937' : '#F8FAFD',
                color: active ? '#FFFFFF' : 'var(--text-secondary, #374151)',
                boxSizing: 'border-box',
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="table-wrap">
        <table className="document-table register-table">
          <thead>
            <tr>
              <th>Nama Berkas</th>
              <th>Kategori</th>
              <th>Dokumen Induk</th>
              <th>Cabang</th>
              <th>Pemohon</th>
              <th scope="col" className="th-nominal text-right" style={{ textAlign: 'right' }}>Nominal</th>
              <th style={{ textAlign: 'right' }}>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const doc = item.parentDoc;
              const catLabel = CATEGORY_LABELS[item.category] || item.category;

              return (
                <tr key={item.id}>
                  <td data-label="Nama Berkas">
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
                        <div style={{ fontSize: '11px', color: 'var(--text-muted, #4B5563)', fontFamily: 'var(--font-mono)' }}>
                          {Math.round(item.sizeBytes / 1024)} KB • {formatDateShort(item.uploadedAt)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Kategori">
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: '#F0F5F9',
                        color: 'var(--text-secondary, #374151)',
                      }}
                    >
                      {catLabel}
                    </span>
                  </td>
                  <td data-label="Dokumen Induk">
                    <strong style={{ fontFamily: 'var(--font-mono)', color: '#E51937', fontSize: '13px' }}>
                      {doc.docNumber}
                    </strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted, #4B5563)' }}>{doc.title}</div>
                  </td>
                  <td data-label="Cabang" style={{ fontWeight: 700, color: 'var(--text-secondary, #374151)' }}>{doc.branch}</td>
                  <td data-label="Pemohon" style={{ fontWeight: 700, color: 'var(--text-secondary, #374151)' }}>{getDocApplicant(doc)}</td>
                  <td
                    data-label="Nominal"
                    className="col-nominal text-right tabular-nums tabular-currency font-mono"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: '#111C2D',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {rupiah.format(getDocAmount(doc))}
                  </td>
                  <td data-label="Tindakan" style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--btn-radius, 8px)' }}
                        onClick={() => onOpenDetail(doc)}
                        aria-label={`Buka detail ${doc.docNumber}`}
                      >
                        <Eye size={13} /> Lihat
                      </button>
                      <button
                        type="button"
                        onClick={() => void openAttachment(item.attachmentId).catch(() => setFileError('Lampiran tidak dapat dibuka.'))}
                        className="secondary"
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          borderRadius: 'var(--btn-radius, 8px)',
                          textDecoration: 'none',
                        }}
                        aria-label={`Unduh ${item.fileName}`}
                      >
                        <ExternalLink size={13} /> Unduh
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

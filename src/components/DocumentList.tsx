import React, { useMemo, useState } from 'react';
import { branchOptions } from '../domain/branches';
import {
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Download,
  Edit3,
  Eye,
  FileText,
  Filter,
  Inbox,
  PlusCircle,
  Receipt,
  Scale,
  Search,
  Send,
  ShoppingBag,
} from 'lucide-react';
import type { AnyDocument, DocType, PVDocument, UserRole } from '../types/document';
import { paymentLabel } from '../domain/payment-label';
import { ApprovalProgress } from './ApprovalProgress';
import { StatusBadge } from './ui/StatusBadge';
import './document-lists.css';

export interface DocumentListProps {
  documents: AnyDocument[];
  activeTab?: DocType | 'ALL';
  activeRole?: UserRole;
  activeUserId?: string;
  activeUserEmail?: string;
  onOpenDetail?: (doc: AnyDocument) => void;
  onEditDoc?: (doc: AnyDocument) => void;
  onSubmitDoc?: (docId: string) => void;
  onGeneratePv?: (docId: string) => void;
  onPayPv?: (pv: PVDocument) => void;
  onCreateRelated?: (doc: AnyDocument) => void;
  onConfirmRc?: (id: string) => void;
  onOpenExport?: () => void;
  onSelectTab?: (tab: DocType | 'ALL') => void;
  onSelect?: (doc: AnyDocument) => void;
  title?: string;
  ownerOnly?: boolean;
}

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
      return { icon: ShoppingBag, bg: '#F1F5F9', color: '#1E293B', label: 'Purchase Order' };
    case 'GR':
      return { icon: CheckCircle2, bg: '#ECFDF5', color: '#065F46', label: 'Laporan Penerimaan' };
    case 'AV':
      return { icon: Banknote, bg: '#F1F5F9', color: '#1E293B', label: 'Cash Advance' };
    case 'RB':
      return { icon: Receipt, bg: '#F1F5F9', color: '#1E293B', label: 'Reimbursement' };
    case 'RC':
      return { icon: Scale, bg: '#F1F5F9', color: '#1E293B', label: 'Realization AV' };
    case 'PV':
      return { icon: CreditCard, bg: '#F1F5F9', color: '#1E293B', label: 'Payment Voucher' };
  }
}

function canCreatePvFromDoc(doc: AnyDocument, allDocs: AnyDocument[]): boolean {
  if (doc.status !== 'APPROVED') return false;
  if (doc.docType === 'PO') {
    const committed = allDocs.reduce((sum, d) => {
      if (d.status === 'REJECTED' || d.status === 'DRAFT') return sum;
      if (d.docType === 'PV' && d.sourceDocId === doc.id) return sum + d.netAmountToPay;
      if (d.docType === 'AV' && d.parentPoId === doc.id) return sum + d.amount;
      return sum;
    }, 0);
    return doc.totalAmount - committed > 0;
  }
  if (doc.docType === 'AV' || doc.docType === 'RB') {
    return !allDocs.some((d) => d.docType === 'PV' && d.sourceDocId === doc.id && d.status !== 'REJECTED');
  }
  if (doc.docType === 'RC' && doc.outcomeType === 'DEFICIT') {
    return !allDocs.some((d) => d.docType === 'PV' && d.sourceDocId === doc.id && d.status !== 'REJECTED');
  }
  return false;
}

function requiresRoleAction(doc: AnyDocument, activeRole: UserRole, allDocs: AnyDocument[], activeUserId: string, activeUserEmail?: string): boolean {
  if (activeRole === 'PEMOHON') return doc.status === 'DRAFT' || doc.status === 'REJECTED';
  if (['ATASAN', 'AYU', 'BOD_HERY', 'BOD_HASHIMOTO'].includes(activeRole) && doc.ownerId === activeUserId) return false;
  if (activeRole === 'ATASAN') {
    return (
      (doc.status === 'SUBMITTED' || doc.status === 'IN_REVIEW') &&
      Boolean(activeUserEmail && doc.stage1ApproverEmail && activeUserEmail.trim().toLowerCase() === doc.stage1ApproverEmail.trim().toLowerCase()) &&
      doc.approvalSteps.atasan.status === 'PENDING'
    );
  }
  if (activeRole === 'AYU') {
    return (
      (doc.status === 'SUBMITTED' || doc.status === 'IN_REVIEW') &&
      doc.approvalSteps.ayu.status === 'PENDING'
    );
  }
  if (activeRole === 'BOD_HERY') {
    return (
      (doc.status === 'SUBMITTED' || doc.status === 'IN_REVIEW') &&
      doc.approvalSteps.bod.heryStatus === 'PENDING'
    );
  }
  if (activeRole === 'BOD_HASHIMOTO') {
    return (
      (doc.status === 'SUBMITTED' || doc.status === 'IN_REVIEW') &&
      doc.approvalSteps.bod.hashimotoStatus === 'PENDING'
    );
  }
  if (activeRole === 'KEUANGAN') {
    if (doc.docType === 'PV') return doc.status === 'APPROVED' && (doc as PVDocument).paymentStatus === 'UNPAID';
    if (doc.docType === 'RC' && doc.outcomeType !== 'DEFICIT' && doc.status === 'APPROVED' && !doc.financeConfirmedAt) {
      return true;
    }
    return canCreatePvFromDoc(doc, allDocs);
  }
  return false;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  activeTab = 'ALL',
  activeRole = 'PEMOHON',
  activeUserId = '',
  activeUserEmail,
  onOpenDetail = () => {},
  onEditDoc = () => {},
  onSubmitDoc = () => {},
  onGeneratePv = () => {},
  onPayPv = () => {},
  onCreateRelated = () => {},
  onConfirmRc = () => {},
  onOpenExport,
  onSelectTab,
  onSelect,
  title,
  ownerOnly = false,
}) => {
  const handleDetail = onSelect || onOpenDetail;
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [onlyMyActions, setOnlyMyActions] = useState(false);
  const [ownType, setOwnType] = useState<DocType | 'ALL'>('ALL');
  const [ownStatus, setOwnStatus] = useState<'ALL' | 'DRAFT' | 'PENDING' | 'REJECTED' | 'APPROVED' | 'PAID'>('ALL');

  const branches = useMemo(() => {
    return ['ALL', ...branchOptions(documents.map((d) => d.branch))];
  }, [documents]);

  const filtered = useMemo(() => {
    let list = ownerOnly ? documents.filter((document) => document.ownerId === activeUserId) : documents;
    if (ownerOnly && ownType !== 'ALL') list = list.filter((d) => d.docType === ownType);
    if (ownerOnly && ownStatus === 'PENDING') list = list.filter((d) => d.status === 'SUBMITTED' || d.status === 'IN_REVIEW');
    else if (ownerOnly && (ownStatus === 'DRAFT' || ownStatus === 'REJECTED')) list = list.filter((d) => {
      const last = [...d.auditLog].reverse().find((entry) => entry.action === 'REJECT' || entry.action === 'SUBMIT');
      const revision = d.status === 'REJECTED' || (d.status === 'DRAFT' && last?.action === 'REJECT');
      return ownStatus === 'REJECTED' ? revision : d.status === 'DRAFT' && !revision;
    });
    else if (ownerOnly && ownStatus !== 'ALL') list = list.filter((d) => d.status === ownStatus);
    if (activeTab !== 'ALL') {
      list = list.filter((d) => d.docType === activeTab);
    }
    if (selectedBranch !== 'ALL') {
      list = list.filter((d) => d.branch === selectedBranch);
    }
    if (onlyMyActions) {
      list = list.filter((d) => (activeRole !== 'PEMOHON' || d.ownerId === activeUserId) && requiresRoleAction(d, activeRole, documents, activeUserId, activeUserEmail));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.purpose.toLowerCase().includes(q) ||
          d.docNumber.toLowerCase().includes(q) ||
          d.branch.toLowerCase().includes(q)
      );
    }
    return list;
  }, [documents, activeTab, selectedBranch, onlyMyActions, activeRole, activeUserId, activeUserEmail, search, ownerOnly, ownType, ownStatus]);

  return (
    <section
      className={`list-card${ownerOnly ? ' submission-list' : ''}`}
      aria-label="Daftar Dokumen Transaksi"
      style={{ padding: '26px', borderRadius: 'var(--card-radius)' }}
    >
      {/* Table Card Header & Search Bar */}
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
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#111C2D' }}>
            {title ?? (activeTab === 'ALL' ? 'Daftar Transaksi Pengadaan' : `Dokumen Modul ${activeTab}`)}
          </h2>
        </div>

        {/* Search & Export Pill Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '270px' }}>
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
              aria-label="Cari nomor, judul, tujuan, atau cabang"
              placeholder="Cari nomor, judul, tujuan, cabang..."
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

          {onOpenExport && (
            <button
              type="button"
              className="secondary control-height-md"
              onClick={onOpenExport}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                height: '36px',
                padding: '0 16px',
                fontSize: '13px',
                borderRadius: '30px',
                boxSizing: 'border-box',
              }}
            >
              <Download size={15} />
              Ekspor
            </button>
          )}
        </div>
      </div>

      {onSelectTab && (
        <div className="document-tabs-scroll">
          <div className="s-tabs" aria-label="Jenis dokumen">
            {(['ALL', 'PR', 'PO', 'GR', 'AV', 'RB', 'RC', 'PV'] as const).map((type) => (
              <button key={type} type="button" className={activeTab === type ? 'current' : ''}
                aria-pressed={activeTab === type} onClick={() => onSelectTab(type)}>
                {type === 'ALL' ? 'Semua' : type}
                <span className="s-count">{type === 'ALL' ? documents.length : documents.filter((doc) => doc.docType === type).length}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {ownerOnly && <div className="register-filters">
        <label>Jenis pengajuan<select value={ownType} onChange={(e) => setOwnType(e.target.value as DocType | 'ALL')}>
          {(['ALL', 'PR', 'PO', 'GR', 'AV', 'RB', 'RC', 'PV'] as const).map((type) => <option key={type} value={type}>{type === 'ALL' ? 'Semua jenis' : type}</option>)}
        </select></label>
        <label>Status<select value={ownStatus} onChange={(e) => setOwnStatus(e.target.value as typeof ownStatus)}>
          <option value="ALL">Semua status</option><option value="DRAFT">Draf</option><option value="PENDING">Menunggu</option><option value="REJECTED">Perlu revisi</option><option value="APPROVED">Disetujui</option><option value="PAID">Lunas</option>
        </select></label>
        <button type="button" className="secondary" onClick={() => { setSearch(''); setOwnType('ALL'); setOwnStatus('ALL'); setOnlyMyActions(false); setSelectedBranch('ALL'); }}>Atur ulang</button>
      </div>}

      {/* Branch Filter Pills */}
      {!ownerOnly && <div
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
            marginRight: '6px',
          }}
        >
          <Filter size={13} />
          Cabang:
        </span>
        {branches.map((b) => {
          const isSelected = selectedBranch === b;
          return (
            <button
              key={b}
              type="button"
              onClick={() => setSelectedBranch(b)}
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
                border: `1px solid ${isSelected ? '#E51937' : 'var(--border-subtle)'}`,
                background: isSelected ? '#E51937' : '#F8FAFD',
                color: isSelected ? '#FFFFFF' : '#5A6A85',
                boxShadow: isSelected ? '0 3px 10px rgba(229, 25, 55, 0.2)' : 'none',
                boxSizing: 'border-box',
              }}
            >
              {b === 'ALL' ? 'Semua Cabang' : b}
            </button>
          );
        })}

        <button
          type="button"
          aria-pressed={onlyMyActions}
          onClick={() => setOnlyMyActions((v) => !v)}
          className="control-height-md"
          style={{
            marginLeft: 'auto',
            height: '36px',
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0 14px',
            fontSize: '12px',
            fontWeight: 700,
            borderRadius: '30px',
            cursor: 'pointer',
            border: `1px solid ${onlyMyActions ? '#E51937' : 'var(--border-subtle)'}`,
            background: onlyMyActions ? '#E51937' : '#FFF5F7',
            color: onlyMyActions ? '#FFFFFF' : '#E51937',
            boxSizing: 'border-box',
          }}
        >
          Menunggu Tindakan Saya
        </button>
      </div>}

      {filtered.length === 0 ? (
        <div className="empty" style={{ padding: '48px 16px', textAlign: 'center' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              margin: '0 auto 14px auto',
              borderRadius: 'var(--card-radius, 10px)',
              background: 'var(--accent-ruby-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E51937',
            }}
          >
            <Inbox size={24} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111C2D', marginBottom: '6px' }}>
            Belum ada dokumen yang sesuai
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted, #4B5563)', maxWidth: '360px', margin: '0 auto' }}>
            {search || selectedBranch !== 'ALL'
              ? 'Coba sesuaikan kata kunci pencarian atau pilih cabang lain.'
              : activeRole === 'PEMOHON' ? 'Gunakan tombol pembuatan dokumen di atas untuk membuat pengajuan baru.' : 'Tidak ada dokumen untuk ditampilkan.'}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="document-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th scope="col">Dokumen & Pengajuan</th>
                <th scope="col">Cabang</th>
                <th scope="col" className="th-nominal text-right" style={{ textAlign: 'right' }}>Nominal (IDR)</th>
                <th scope="col">Status</th>
                <th scope="col">Alur Persetujuan (3 Tahap)</th>
                <th
                  scope="col"
                  style={{
                    textAlign: 'right',
                    position: 'sticky',
                    right: 0,
                    background: '#f8fafc',
                    zIndex: 5,
                    boxShadow: '-4px 0 6px -2px rgba(0,0,0,0.04)',
                  }}
                >
                  Tindakan
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => {
                const lastDecision = [...doc.auditLog].reverse().find((entry) => entry.action === 'REJECT' || entry.action === 'SUBMIT');
                const visual = getDocTypeVisual(doc.docType);
                const DocIcon = visual.icon;
                const amount = getDocAmount(doc);

                // Role permission checks
                const canSubmit =
                  ((activeRole === 'PEMOHON' && doc.ownerId === activeUserId) ||
                    (activeRole === 'KEUANGAN' && doc.docType === 'PV')) &&
                  doc.status === 'DRAFT';
                const canEdit = canSubmit;

                const isApproverRole =
                  activeRole === 'ATASAN' ||
                  activeRole === 'AYU' ||
                  activeRole === 'BOD_HERY' ||
                  activeRole === 'BOD_HASHIMOTO';
                const isReviewable = isApproverRole && requiresRoleAction(doc, activeRole, documents, activeUserId, activeUserEmail);

                const canGeneratePv =
                  activeRole === 'KEUANGAN' && canCreatePvFromDoc(doc, documents);

                const canPayPv =
                  activeRole === 'KEUANGAN' &&
                  doc.docType === 'PV' &&
                  doc.status === 'APPROVED' &&
                  (doc as PVDocument).paymentStatus === 'UNPAID';

                return (
                  <tr key={doc.id}>
                    {/* Document Number & Title */}
                    <td data-label="Dokumen">
                      <button
                        type="button"
                        style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'transparent', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                        onClick={() => handleDetail(doc)}
                        aria-label={`Buka detail ${doc.docNumber}: ${doc.title}`}
                      >
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--btn-radius)',
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong
                              style={{
                                fontSize: '13.5px',
                                fontWeight: 800,
                                color: '#111827',
                              }}
                            >
                              {doc.docNumber}
                            </strong>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: visual.bg,
                                color: visual.color,
                                border: '1px solid #E2E8F0',
                              }}
                            >
                              {doc.docType}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '12.5px',
                              color: '#4B5563',
                              marginTop: '2px',
                              maxWidth: '360px',
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {doc.title}
                          </div>
                        </div>
                      </button>
                    </td>

                    {/* Branch */}
                    <td data-label="Cabang">
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#5A6A85',
                        }}
                      >
                        <Building2 size={14} color="#7C8FAC" />
                        {doc.branch}
                      </span>
                    </td>

                    {/* Nominal */}
                    <td
                      data-label="Nominal"
                      className="col-nominal text-right tabular-nums tabular-currency font-mono"
                      style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        color: '#111C2D',
                        fontVariantNumeric: 'tabular-nums',
                        textAlign: 'right',
                      }}
                    >
                      {rupiah.format(amount)}
                    </td>

                    {/* Status Pill */}
                    <td data-label="Status">
                      <StatusBadge
                        status={
                          doc.status === 'DRAFT' && lastDecision?.action === 'REJECT'
                            ? 'REVISION'
                            : doc.status
                        }
                      />
                      {paymentLabel(doc, documents) && (
                        <div style={{ marginTop: '6px', fontSize: '11px', color: '#5A6A85' }}>
                          Pembayaran: {paymentLabel(doc, documents)}
                        </div>
                      )}
                    </td>

                    {/* Multi-Stage Stepper Mini Preview */}
                    <td data-label="Persetujuan">
                      {doc.docType === 'GR' ? (
                        <span style={{ fontSize: '12px', color: doc.itemCondition !== 'BAIK' ? '#991B1B' : '#065F46', fontWeight: 700 }}>
                          {doc.itemCondition !== 'BAIK' ? `Perlu tindakan (${doc.itemCondition})` : 'Tanpa persetujuan · Baik'}
                        </span>
                      ) : (
                        <ApprovalProgress document={doc} compact />
                      )}
                    </td>

                    {/* Action Buttons (Sticky Right) */}
                    <td
                      data-label="Tindakan"
                      style={{
                        textAlign: 'right',
                        position: 'sticky',
                        right: 0,
                        background: '#ffffff',
                        zIndex: 5,
                        boxShadow: '-4px 0 6px -2px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="secondary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            borderRadius: 'var(--btn-radius)',
                          }}
                          onClick={() => handleDetail(doc)}
                          aria-label={`Lihat detail ${doc.docNumber}`}
                        >
                          <Eye size={13} />
                          Detail
                        </button>

                        {activeRole === 'PEMOHON' && doc.docType === 'PR' && doc.status === 'APPROVED' && !documents.some((item) => item.docType === 'PO' && item.parentPrId === doc.id && item.status !== 'REJECTED') && (
                          <button
                            type="button"
                            className="secondary"
                            style={{ borderRadius: 'var(--btn-radius)', padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => onCreateRelated(doc)}
                            aria-label={`Buat PO dari ${doc.docNumber}`}
                          >
                            Buat PO
                          </button>
                        )}
                        {activeRole === 'PEMOHON' && doc.docType === 'PO' && (doc.status === 'APPROVED' || doc.status === 'PAID') && (
                          <button
                            type="button"
                            className="secondary"
                            style={{ borderRadius: 'var(--btn-radius)', padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => onCreateRelated(doc)}
                            aria-label={`Buat GR dari ${doc.docNumber}`}
                          >
                            Catat GR
                          </button>
                        )}
                        {activeRole === 'PEMOHON' && doc.docType === 'AV' && doc.status === 'PAID' && doc.ownerId === activeUserId && documents.some((item) => item.docType === 'PV' && item.sourceDocId === doc.id && item.paymentStatus === 'PAID') && !documents.some((item) => item.docType === 'RC' && item.parentAvId === doc.id) && (
                          <button
                            type="button"
                            className="secondary"
                            style={{ borderRadius: 'var(--btn-radius)', padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => onCreateRelated(doc)}
                            aria-label={`Buat RC dari ${doc.docNumber}`}
                          >
                            Buat RC
                          </button>
                        )}
                        {activeRole === 'KEUANGAN' && doc.docType === 'RC' && doc.outcomeType !== 'DEFICIT' && (doc.status === 'APPROVED' || doc.status === 'PAID') && !doc.financeConfirmedAt && (
                          <button
                            type="button"
                            className="secondary"
                            style={{ borderRadius: 'var(--btn-radius)', padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => onConfirmRc(doc.id)}
                            aria-label={`Konfirmasi penyelesaian ${doc.docNumber}`}
                          >
                            Konfirmasi penyelesaian
                          </button>
                        )}

                        {canEdit && (
                          <button
                            type="button"
                            className="secondary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              borderRadius: 'var(--btn-radius)',
                            }}
                            onClick={() => onEditDoc(doc)}
                            aria-label={`Ubah draf ${doc.docNumber}`}
                          >
                            <Edit3 size={13} />
                            Ubah
                          </button>
                        )}

                        {canSubmit && (
                          <button
                            type="button"
                            className="primary"
                            style={{
                              padding: '6px 14px',
                              fontSize: '12px',
                              borderRadius: 'var(--btn-radius)',
                            }}
                            onClick={() => onSubmitDoc(doc.id)}
                            aria-label={`Ajukan ${doc.docNumber}`}
                          >
                            <Send size={13} />
                            Ajukan
                          </button>
                        )}

                        {isReviewable && (
                          <button
                            type="button"
                            className="primary"
                            style={{
                              padding: '6px 14px',
                              fontSize: '12px',
                              background: '#F59E0B',
                              borderColor: '#F59E0B',
                              color: '#FFFFFF',
                              borderRadius: 'var(--btn-radius)',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                            }}
                            onClick={() => handleDetail(doc)}
                            aria-label={`Tinjau pengajuan ${doc.docNumber}`}
                          >
                            <CheckCircle2 size={13} />
                            Tinjau
                          </button>
                        )}

                        {canGeneratePv && (
                          <button
                            type="button"
                            className="primary"
                            style={{
                              padding: '6px 14px',
                              fontSize: '12px',
                              background: '#2563EB',
                              borderColor: '#2563EB',
                              borderRadius: 'var(--btn-radius)',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                            }}
                            onClick={() => onGeneratePv(doc.id)}
                            aria-label={`Buat Payment Voucher dari ${doc.docNumber}`}
                          >
                            <PlusCircle size={13} />
                            Buat PV
                          </button>
                        )}

                        {canPayPv && (
                          <button
                            type="button"
                            className="primary"
                            style={{
                              padding: '6px 14px',
                              fontSize: '12px',
                              background: '#10B981',
                              borderColor: '#10B981',
                              borderRadius: 'var(--btn-radius)',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                            }}
                            onClick={() => onPayPv(doc as PVDocument)}
                            aria-label={`Catat pembayaran ${doc.docNumber}`}
                          >
                            <CreditCard size={13} />
                            Bayar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

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

export interface DocumentListProps {
  documents: AnyDocument[];
  activeTab: DocType | 'ALL';
  activeRole: UserRole;
  activeUserId: string;
  onOpenDetail: (doc: AnyDocument) => void;
  onEditDoc: (doc: AnyDocument) => void;
  onSubmitDoc: (docId: string) => void;
  onGeneratePv: (docId: string) => void;
  onPayPv: (pv: PVDocument) => void;
  onCreateRelated: (doc: AnyDocument) => void;
  onConfirmRc: (id: string) => void;
  onOpenExport?: () => void;
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
      return { icon: ShoppingBag, bg: '#E5F3FB', color: '#0085DB', label: 'Purchase Order' };
    case 'AV':
      return { icon: Banknote, bg: '#FEF5E5', color: '#FFAE1F', label: 'Cash Advance' };
    case 'RB':
      return { icon: Receipt, bg: '#F2ECF9', color: '#8763DA', label: 'Reimbursement' };
    case 'RC':
      return { icon: Scale, bg: '#E6FFFA', color: '#00CEB6', label: 'Realization AV' };
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
      return { label: 'Ditolak (Revisi)', color: '#C8132D', bg: '#FDF2F4', border: '#FECDD3' };
    case 'SUBMITTED':
      return { label: 'Diajukan', color: '#B4690E', bg: '#FEF5E5', border: '#FDE68A' };
    case 'IN_REVIEW':
      return { label: 'Sedang Ditinjau', color: '#E51937', bg: '#FDF2F4', border: '#FBCFE8' };
    case 'DRAFT':
    default:
      return { label: 'Draf', color: '#5A6A85', bg: '#F0F5F9', border: '#DFE5EF' };
  }
}

function requiresRoleAction(doc: AnyDocument, activeRole: UserRole, allDocs: AnyDocument[]): boolean {
  if (activeRole === 'PEMOHON') return doc.status === 'DRAFT' || doc.status === 'REJECTED';
  if (activeRole === 'ATASAN') {
    return (
      (doc.status === 'SUBMITTED' || doc.status === 'IN_REVIEW') &&
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
    if (doc.docType === 'PV') return (doc as PVDocument).paymentStatus === 'UNPAID';
    const hasPv = allDocs.some((d) => d.docType === 'PV' && (d as PVDocument).sourceDocId === doc.id);
    return (
      doc.status === 'APPROVED' &&
      !hasPv &&
      (doc.docType !== 'RC' || doc.outcomeType === 'DEFICIT')
    );
  }
  return false;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  activeTab,
  activeRole,
  activeUserId,
  onOpenDetail,
  onEditDoc,
  onSubmitDoc,
  onGeneratePv,
  onPayPv,
  onCreateRelated,
  onConfirmRc,
  onOpenExport,
}) => {
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [onlyMyActions, setOnlyMyActions] = useState(false);

  const branches = useMemo(() => {
    return ['ALL', ...branchOptions(documents.map((d) => d.branch))];
  }, [documents]);

  const filtered = useMemo(() => {
    let list = documents;
    if (activeTab !== 'ALL') {
      list = list.filter((d) => d.docType === activeTab);
    }
    if (selectedBranch !== 'ALL') {
      list = list.filter((d) => d.branch === selectedBranch);
    }
    if (onlyMyActions) {
      list = list.filter((d) => (activeRole !== 'PEMOHON' || d.ownerId === activeUserId) && requiresRoleAction(d, activeRole, documents));
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
  }, [documents, activeTab, selectedBranch, onlyMyActions, activeRole, activeUserId, search]);

  return (
    <section
      className="list-card"
      aria-label="Daftar Dokumen Transaksi"
      style={{ padding: '26px', borderRadius: 'var(--card-radius)' }}
    >
      {/* Spike Pro Card Header & Search Bar */}
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
            {activeTab === 'ALL' ? 'Daftar Transaksi Pengadaan' : `Dokumen Modul ${activeTab}`}
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

          {onOpenExport && (
            <button
              type="button"
              className="secondary"
              onClick={onOpenExport}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                fontSize: '13px',
                borderRadius: '30px',
              }}
            >
              <Download size={15} />
              Ekspor
            </button>
          )}
        </div>
      </div>

      {/* Spike Pro Faceted Filter Pills (Cabang) */}
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
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '30px',
                cursor: 'pointer',
                border: `1px solid ${isSelected ? '#E51937' : 'var(--border-subtle)'}`,
                background: isSelected ? '#E51937' : '#F8FAFD',
                color: isSelected ? '#FFFFFF' : '#5A6A85',
                boxShadow: isSelected ? '0 3px 10px rgba(229, 25, 55, 0.2)' : 'none',
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
          style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 700,
            borderRadius: '30px',
            cursor: 'pointer',
            border: `1px solid ${onlyMyActions ? '#E51937' : 'var(--border-subtle)'}`,
            background: onlyMyActions ? '#E51937' : '#FFF5F7',
            color: onlyMyActions ? '#FFFFFF' : '#E51937',
          }}
        >
          Menunggu Tindakan Saya
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty" style={{ padding: '48px 16px', textAlign: 'center' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              margin: '0 auto 14px auto',
              borderRadius: '16px',
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
          <p style={{ fontSize: '13px', color: '#7C8FAC', maxWidth: '360px', margin: '0 auto' }}>
            {search || selectedBranch !== 'ALL'
              ? 'Coba sesuaikan kata kunci pencarian atau pilih cabang lain.'
              : 'Gunakan tombol pembuatan dokumen di atas untuk membuat pengajuan baru.'}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="document-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th scope="col">Dokumen & Pengajuan</th>
                <th scope="col">Cabang</th>
                <th scope="col">Nominal (IDR)</th>
                <th scope="col">Status</th>
                <th scope="col">Alur Persetujuan (3 Tahap)</th>
                <th scope="col" style={{ textAlign: 'right' }}>
                  Tindakan
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => {
                const lastDecision = [...doc.auditLog].reverse().find((entry) => entry.action === 'REJECT' || entry.action === 'SUBMIT');
                const badge = doc.status === 'DRAFT' && lastDecision?.action === 'REJECT'
                  ? { label: 'Perlu revisi', color: '#9a5800', bg: '#fff4e3', border: '#f5d49f' }
                  : getStatusBadge(doc.status);
                const visual = getDocTypeVisual(doc.docType);
                const DocIcon = visual.icon;
                const amount = getDocAmount(doc);

                // Role permission checks
                const canSubmit = activeRole === 'PEMOHON' && doc.ownerId === activeUserId && doc.status === 'DRAFT';
                const canEdit = canSubmit;

                const isApproverRole =
                  activeRole === 'ATASAN' ||
                  activeRole === 'AYU' ||
                  activeRole === 'BOD_HERY' ||
                  activeRole === 'BOD_HASHIMOTO';
                const isReviewable =
                  isApproverRole && (doc.status === 'SUBMITTED' || doc.status === 'IN_REVIEW');

                const hasExistingPv = documents.some(
                  (d) => d.docType === 'PV' && (d as PVDocument).sourceDocId === doc.id
                );

                const canGeneratePv =
                  activeRole === 'KEUANGAN' &&
                  doc.status === 'APPROVED' &&
                  !hasExistingPv &&
                  doc.docType !== 'PV' &&
                  (doc.docType !== 'RC' || doc.outcomeType === 'DEFICIT');

                const canPayPv =
                  activeRole === 'KEUANGAN' &&
                  doc.docType === 'PV' &&
                  (doc as PVDocument).paymentStatus === 'UNPAID';

                return (
                  <tr key={doc.id}>
                    {/* Spike Pro Avatar Box + Document Number & Title */}
                    <td data-label="Dokumen">
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
                        onClick={() => onOpenDetail(doc)}
                      >
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: visual.bg,
                            color: visual.color,
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <DocIcon size={20} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong
                              style={{
                                fontSize: '13.5px',
                                fontWeight: 800,
                                color: '#111C2D',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {doc.docNumber}
                            </strong>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: '6px',
                                background: visual.bg,
                                color: visual.color,
                              }}
                            >
                              {doc.docType}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '12.5px',
                              color: '#7C8FAC',
                              marginTop: '2px',
                              maxWidth: '290px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {doc.title}
                          </div>
                        </div>
                      </div>
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
                    <td data-label="Nominal"
                      style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        color: '#111C2D',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {rupiah.format(amount)}
                    </td>

                    {/* Status Pill */}
                    <td data-label="Status">
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 12px',
                          borderRadius: '999px',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: badge.color,
                          }}
                        />
                        {badge.label}
                      </span>
                      {paymentLabel(doc, documents) && (
                        <div style={{ marginTop: '6px', fontSize: '11px', color: '#5A6A85' }}>
                          Pembayaran: {paymentLabel(doc, documents)}
                        </div>
                      )}
                    </td>

                    {/* Multi-Stage Stepper Mini Preview */}
                    <td data-label="Persetujuan">
                      {doc.docType === 'PV' ? (
                        <span style={{ fontSize: '12px', color: '#7C8FAC' }}>
                          Status Bayar:{' '}
                          <strong
                            style={{
                              color:
                                (doc as PVDocument).paymentStatus === 'PAID' ? '#008A7A' : '#B4690E',
                            }}
                          >
                            {paymentLabel(doc, documents)}
                          </strong>
                        </span>
                      ) : (
                        <ApprovalProgress document={doc} />
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td data-label="Tindakan" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="secondary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            borderRadius: '30px',
                          }}
                          onClick={() => onOpenDetail(doc)}
                        >
                          <Eye size={13} />
                          Detail
                        </button>

                        {activeRole === 'PEMOHON' && doc.docType === 'PR' && doc.status === 'APPROVED' && (
                          <button type="button" className="secondary" onClick={() => onCreateRelated(doc)}>Buat PO</button>
                        )}
                        {activeRole === 'PEMOHON' && doc.docType === 'AV' && doc.status === 'PAID' && doc.ownerId === activeUserId && documents.some((item) => item.docType === 'PV' && item.sourceDocId === doc.id && item.paymentStatus === 'PAID') && !documents.some((item) => item.docType === 'RC' && item.parentAvId === doc.id) && (
                          <button type="button" className="secondary" onClick={() => onCreateRelated(doc)}>Buat RC</button>
                        )}
                        {activeRole === 'KEUANGAN' && doc.docType === 'RC' && (doc.status === 'APPROVED' || doc.status === 'PAID') && !doc.financeConfirmedAt && (
                          <button type="button" className="secondary" onClick={() => onConfirmRc(doc.id)}>Konfirmasi penyelesaian</button>
                        )}

                        {canEdit && (
                          <button
                            type="button"
                            className="secondary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              borderRadius: '30px',
                            }}
                            onClick={() => onEditDoc(doc)}
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
                              borderRadius: '30px',
                            }}
                            onClick={() => onSubmitDoc(doc.id)}
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
                              background: '#FFAE1F',
                              borderColor: '#FFAE1F',
                              color: '#111C2D',
                              borderRadius: '30px',
                              boxShadow: '0 4px 12px rgba(255, 174, 31, 0.25)',
                            }}
                            onClick={() => onOpenDetail(doc)}
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
                              background: '#00CEB6',
                              borderColor: '#00CEB6',
                              borderRadius: '30px',
                              boxShadow: '0 4px 12px rgba(0, 206, 182, 0.25)',
                            }}
                            onClick={() => onGeneratePv(doc.id)}
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
                              background: '#008A7A',
                              borderColor: '#008A7A',
                              borderRadius: '30px',
                              boxShadow: '0 4px 12px rgba(0, 138, 122, 0.25)',
                            }}
                            onClick={() => onPayPv(doc as PVDocument)}
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

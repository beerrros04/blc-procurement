import React from 'react';
import {
  Banknote,
  BookOpen,
  FileText,
  Plus,
  Receipt,
  Scale,
  ShoppingBag,
} from 'lucide-react';
import type { AnyDocument, DocType, PVDocument, UserRole } from '../types/document';
import { DocumentList } from './DocumentList';

export interface StaffBerandaProps {
  userName: string;
  userId: string;
  userEmail: string;
  userBranch: string;
  activeRole: UserRole;
  documents: AnyDocument[];
  onCreateDoc: (type: DocType) => void;
  onOpenDetail: (doc: AnyDocument) => void;
  onEditDoc: (doc: AnyDocument) => void;
  onSubmitDoc: (docId: string) => void;
  onGeneratePv: (docId: string) => void;
  onPayPv: (pv: PVDocument) => void;
  onCreateRelated: (doc: AnyDocument) => void;
  onConfirmRc: (id: string) => void;
  onOpenExport: () => void;
  onNavigateTab: (tab: DocType | 'REGISTER' | 'HISTORY' | 'DOCS') => void;
}

export const StaffBeranda: React.FC<StaffBerandaProps> = ({
  userName,
  userId,
  userEmail,
  userBranch,
  activeRole,
  documents,
  onCreateDoc,
  onOpenDetail,
  onEditDoc,
  onSubmitDoc,
  onGeneratePv,
  onPayPv,
  onCreateRelated,
  onConfirmRc,
  onOpenExport,
  onNavigateTab,
}) => {
  const nonPvDocs = documents.filter((d) => d.docType !== 'PV' && d.ownerId === userId);
  const draftCount = nonPvDocs.filter((d) => d.status === 'DRAFT' || d.status === 'REJECTED').length;
  const inReviewCount = nonPvDocs.filter((d) => d.status === 'SUBMITTED' || d.status === 'IN_REVIEW').length;
  const approvedCount = nonPvDocs.filter((d) => d.status === 'APPROVED' || d.status === 'PAID').length;

  const quickActions: Array<{
    id: DocType | 'REGISTER';
    code: string;
    title: string;
    icon: React.ComponentType<{ size?: number }>;
    accent: string;
    bg: string;
  }> = [
    {
      id: 'PR',
      code: 'PR',
      title: 'Purchase Request',
      icon: FileText,
      accent: '#E51937',
      bg: '#FDF2F4',
    },
    {
      id: 'PO',
      code: 'PO',
      title: 'Purchase Order',
      icon: ShoppingBag,
      accent: '#1E293B',
      bg: '#F1F5F9',
    },
    {
      id: 'GR',
      code: 'GR',
      title: 'Laporan Penerimaan',
      icon: FileText,
      accent: '#065F46',
      bg: '#ECFDF5',
    },
    {
      id: 'AV',
      code: 'AV',
      title: 'Cash Advance',
      icon: Banknote,
      accent: '#1E293B',
      bg: '#F1F5F9',
    },
    {
      id: 'RB',
      code: 'RB',
      title: 'Reimbursement',
      icon: Receipt,
      accent: '#1E293B',
      bg: '#F1F5F9',
    },
    {
      id: 'RC',
      code: 'RC',
      title: 'Realisasi Uang Muka',
      icon: Scale,
      accent: '#1E293B',
      bg: '#F1F5F9',
    },
    {
      id: 'REGISTER',
      code: 'REG',
      title: 'Approval Register',
      icon: BookOpen,
      accent: '#4B5563',
      bg: '#F3F4F6',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* =====================================================================
          ROW 1: OPERATIONAL WORKSPACE HERO FOR STAFF
         ===================================================================== */}
      <section
        aria-label="Beranda Caready"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '20px',
        }}
      >
        {/* Welcome Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--card-radius)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
            <img
              src="/logo.png"
              alt="Caready Logo"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: '#E51937',
                padding: '6px',
                objectFit: 'contain',
              }}
            />
            <div>
              <div className="eyebrow" style={{ color: '#4B5563', fontSize: '11px', fontWeight: 700 }}>
                BERANDA CAREADY · CABANG {userBranch.toUpperCase()}
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: '4px 0 0 0' }}>
                Selamat Datang, {userName}
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#991B1B' }}>
                {draftCount}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#4B5563' }}>Draf / Revisi</div>
            </div>
            <div style={{ width: '1px', height: '28px', background: '#E2E8F0' }} />
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#92400E' }}>
                {inReviewCount}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#4B5563' }}>Ditinjau</div>
            </div>
            <div style={{ width: '1px', height: '28px', background: '#E2E8F0' }} />
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#065F46' }}>
                {approvedCount}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#4B5563' }}>Disetujui / Lunas</div>
            </div>
          </div>
        </div>

        {/* Quick Create Action Card */}
        {activeRole === 'PEMOHON' && <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--card-radius)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: 0 }}>
              Ajukan Permohonan Baru
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
              gap: '10px',
            }}
          >
            {quickActions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    item.id === 'REGISTER' ? onNavigateTab('REGISTER') : onCreateDoc(item.id)
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '16px',
                    borderRadius: 'var(--card-radius, 10px)',
                    border: '1px solid var(--border-clean)',
                    background: '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                  aria-label={item.id === 'REGISTER' ? 'Buka Approval Register' : `Buat dokumen baru ${item.title}`}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      background: item.bg,
                      color: item.accent,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: item.accent,
                      }}
                    >
                      {item.id === 'REGISTER' ? 'REGISTER' : `+ Buat ${item.code}`}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#111827',
                        lineHeight: 1.3,
                      }}
                    >
                      {item.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>}
      </section>

      {/* =====================================================================
          ROW 2: OPERATIONAL TRANSACTION TABLE
         ===================================================================== */}
      <DocumentList
        documents={documents}
        title="Daftar Pengajuan Saya"
        ownerOnly
        activeTab="ALL"
        activeRole={activeRole}
        activeUserId={userId}
        activeUserEmail={userEmail}
        onOpenDetail={onOpenDetail}
        onEditDoc={onEditDoc}
        onSubmitDoc={onSubmitDoc}
        onGeneratePv={onGeneratePv}
        onPayPv={onPayPv}
        onCreateRelated={onCreateRelated}
        onConfirmRc={onConfirmRc}
        onOpenExport={onOpenExport}
      />
    </div>
  );
};

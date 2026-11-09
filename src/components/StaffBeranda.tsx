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
import type { AnyDocument, DocType, PVDocument } from '../types/document';
import { DocumentList } from './DocumentList';

export interface StaffBerandaProps {
  userName: string;
  userId: string;
  userEmail: string;
  userBranch: string;
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
  userBranch,
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
      accent: '#0085DB',
      bg: '#E5F3FB',
    },
    {
      id: 'AV',
      code: 'AV',
      title: 'Cash Advance',
      icon: Banknote,
      accent: '#FFAE1F',
      bg: '#FEF5E5',
    },
    {
      id: 'RB',
      code: 'RB',
      title: 'Reimbursement',
      icon: Receipt,
      accent: '#8763DA',
      bg: '#F2ECF9',
    },
    {
      id: 'RC',
      code: 'RC',
      title: 'Realisasi Uang Muka',
      icon: Scale,
      accent: '#00CEB6',
      bg: '#E6FFFA',
    },
    {
      id: 'REGISTER',
      code: 'REG',
      title: 'Approval Register',
      icon: BookOpen,
      accent: '#5A6A85',
      bg: '#F0F5F9',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* =====================================================================
          ROW 1: SPIKE PRO WELCOMING HERO FOR STAFF
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
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F7 100%)',
            borderRadius: 'var(--card-radius)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid #FBCFE8',
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
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: '#E51937',
                padding: '6px',
                objectFit: 'contain',
                boxShadow: '0 4px 12px rgba(229, 25, 55, 0.25)',
              }}
            />
            <div>
              <div className="eyebrow">BERANDA CAREADY · CABANG {userBranch.toUpperCase()}</div>
              <h1 style={{ fontSize: '21px', fontWeight: 900, color: '#111C2D', margin: '4px 0 0 0' }}>
                Selamat Datang, {userName}
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#E51937', fontFamily: 'var(--font-mono)' }}>
                {draftCount}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#5A6A85' }}>Draf / Revisi</div>
            </div>
            <div style={{ width: '1px', height: '28px', background: '#EAEFF4' }} />
            <div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#111C2D', fontFamily: 'var(--font-mono)' }}>
                {inReviewCount}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#5A6A85' }}>Ditinjau</div>
            </div>
            <div style={{ width: '1px', height: '28px', background: '#EAEFF4' }} />
            <div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#008A7A', fontFamily: 'var(--font-mono)' }}>
                {approvedCount}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#5A6A85' }}>Disetujui</div>
            </div>
          </div>
        </div>

        {/* Quick Create Action Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--card-radius)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#111C2D', margin: 0 }}>
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
                    padding: '10px 12px',
                    borderRadius: '14px',
                    border: '1px solid var(--border-subtle)',
                    background: '#F8FAFD',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: item.bg,
                      color: item.accent,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 900,
                        color: item.accent,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {item.id === 'REGISTER' ? 'REGISTER' : `+ Buat ${item.code}`}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#111C2D',
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
        </div>
      </section>

      {/* =====================================================================
          ROW 2: SPIKE PRO TRANSACTION TABLE (SAME DESIGN SYSTEM AS MAIN LIST)
         ===================================================================== */}
      <DocumentList
        documents={documents}
        activeTab="ALL"
        activeRole="PEMOHON"
        activeUserId={userId}
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

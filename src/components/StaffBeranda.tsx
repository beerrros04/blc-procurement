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
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
        <Card className="bg-white rounded-xl border border-[#E4E2DD] shadow-xs p-6 flex justify-between items-center gap-5 flex-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
            <img
              src="/logo.png"
              alt="Caready Logo"
              className="w-12 h-12 rounded-xl bg-[#DC2626] p-1.5 object-contain shadow-xs"
            />
            <div>
              <div className="eyebrow" style={{ color: '#4B5563', fontSize: '11px', fontWeight: 700 }}>
                BERANDA CAREADY · CABANG {userBranch.toUpperCase()}
              </div>
              <h1 className="text-xl font-bold text-[#111827] mt-1 m-0">
                Selamat Datang, {userName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div>
              <div className="text-xl font-bold text-[#991B1B] tabular-nums">
                {draftCount}
              </div>
              <div className="text-xs font-semibold text-[#4B5563]">Draf / Revisi</div>
            </div>
            <div className="w-px h-7 bg-[#E4E2DD]" />
            <div>
              <div className="text-xl font-bold text-[#92400E] tabular-nums">
                {inReviewCount}
              </div>
              <div className="text-xs font-semibold text-[#4B5563]">Ditinjau</div>
            </div>
            <div className="w-px h-7 bg-[#E4E2DD]" />
            <div>
              <div className="text-xl font-bold text-[#065F46] tabular-nums">
                {approvedCount}
              </div>
              <div className="text-xs font-semibold text-[#4B5563]">Disetujui / Lunas</div>
            </div>
          </div>
        </Card>

        {/* Quick Create Action Card */}
        {activeRole === 'PEMOHON' && (
          <Card className="bg-white rounded-xl border border-[#E4E2DD] shadow-xs p-6 flex flex-col justify-between gap-3.5">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm sm:text-base font-bold text-[#111827] m-0">
                Ajukan Permohonan Baru
              </CardTitle>
            </div>

            <div
              className="grid gap-2.5"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
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
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E4E2DD] bg-white hover:border-[#DC2626] hover:shadow-xs transition-all text-left cursor-pointer group"
                    aria-label={item.id === 'REGISTER' ? 'Buka Approval Register' : `Buat dokumen baru ${item.title}`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl grid place-items-center shrink-0 border border-[#E4E2DD] transition-colors group-hover:border-[#DC2626]"
                      style={{
                        background: item.bg,
                        color: item.accent,
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="text-[11px] font-bold"
                        style={{ color: item.accent }}
                      >
                        {item.id === 'REGISTER' ? 'REGISTER' : `+ Buat ${item.code}`}
                      </div>
                      <div className="text-xs font-semibold text-[#111827] leading-snug">
                        {item.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        )}
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

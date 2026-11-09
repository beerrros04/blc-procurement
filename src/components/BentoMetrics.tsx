import React, { useMemo } from 'react';
import type { AnyDocument, AVDocument, DocType, UserRole } from '../types/document';
import { displayPersonName } from '../domain/display-name';

export interface BentoMetricsProps {
  documents: AnyDocument[];
  activeRole: UserRole;
  onCreatePr?: () => void;
  onSelectTab?: (tab: DocType | 'ALL') => void;
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

const MODULE_NAMES: Record<DocType, string> = {
  PR: 'Purchase Request',
  PO: 'Purchase Order',
  GR: 'Laporan Penerimaan',
  AV: 'Cash Advance',
  RB: 'Reimbursement',
  RC: 'Realisasi Uang Muka',
  PV: 'Payment Voucher',
};

const ACTIVITY_LABELS: Record<string, string> = {
  UPLOAD_ATTACHMENT: 'Menambahkan lampiran',
  CREATE_DRAFT: 'Membuat draf',
  UPDATE_DRAFT: 'Memperbarui draf',
  SUBMIT: 'Mengajukan dokumen',
  APPROVE: 'Menyetujui pengajuan',
  REJECT: 'Mengembalikan pengajuan',
  GENERATE_PV: 'Menerbitkan payment voucher',
  RECORD_PAYMENT: 'Mencatat pembayaran',
  PARENT_MARKED_PAID: 'Menandai dokumen dibayar',
};

function formatCompactRupiah(val: number): string {
  if (val === 0) return 'Rp 0';
  if (val >= 1_000_000) {
    const jt = val / 1_000_000;
    return `Rp ${jt % 1 === 0 ? jt.toFixed(0) : jt.toFixed(1).replace('.', ',')} Jt`;
  }
  if (val >= 1_000) {
    return `Rp ${Math.round(val / 1_000)} Rb`;
  }
  return rupiah.format(val);
}

const ROLE_TITLES: Record<UserRole, string> = {
  ADMIN: 'Admin Lokal',
  PEMOHON: 'Staff Pemohon',
  ATASAN: 'Atasan Langsung (Tahap 1)',
  AYU: 'GM',
  BOD_HERY: 'Direksi',
  BOD_HASHIMOTO: 'Direksi',
  KEUANGAN: 'Kasir & Akuntansi Keuangan',
};

export const BentoMetrics: React.FC<BentoMetricsProps> = ({
  documents,
  activeRole,
  onSelectTab,
}) => {
  const {
    pendingForRole,
    approvedOrPaidCount,
    inReviewCount,
    draftOrRejectedCount,
    unsettledAvs,
    outstandingAvTotal,
    settledAvRatio,
    moduleStats,
    maxModuleVal,
    recentLogs,
  } = useMemo(() => {
    // 1. Pending actions specifically for active role
    const pendingForRole = documents.filter((d) => {
      if (activeRole === 'PEMOHON') return d.status === 'DRAFT' || d.status === 'REJECTED';
      if (activeRole === 'ATASAN') {
        return (
          (d.status === 'SUBMITTED' || d.status === 'IN_REVIEW') &&
          d.approvalSteps.atasan.status === 'PENDING'
        );
      }
      if (activeRole === 'AYU') {
        return (
          (d.status === 'SUBMITTED' || d.status === 'IN_REVIEW') &&
          d.approvalSteps.ayu.status === 'PENDING'
        );
      }
      if (activeRole === 'BOD_HERY') {
        return (
          (d.status === 'SUBMITTED' || d.status === 'IN_REVIEW') &&
          d.approvalSteps.bod.heryStatus === 'PENDING'
        );
      }
      if (activeRole === 'BOD_HASHIMOTO') {
        return (
          (d.status === 'SUBMITTED' || d.status === 'IN_REVIEW') &&
          d.approvalSteps.bod.hashimotoStatus === 'PENDING'
        );
      }
      if (activeRole === 'KEUANGAN') {
        return (
          (d.status === 'APPROVED' && d.docType !== 'PV' && d.docType !== 'PR' && d.docType !== 'GR') ||
          (d.docType === 'PV' && d.status === 'APPROVED' && d.paymentStatus === 'UNPAID')
        );
      }
      return false;
    }).length;

    // 2. Status counts
    const approvedOrPaidCount = documents.filter(
      (d) => d.status === 'APPROVED' || d.status === 'PAID'
    ).length;
    const inReviewCount = documents.filter(
      (d) => d.status === 'SUBMITTED' || d.status === 'IN_REVIEW'
    ).length;
    const draftOrRejectedCount = documents.filter(
      (d) => d.status === 'DRAFT' || d.status === 'REJECTED'
    ).length;

    // 3. Outstanding AV vs Realized RC
    const allPaidAvs = documents.filter(
      (d): d is AVDocument => d.docType === 'AV' && d.status === 'PAID'
    );
    const unsettledAvs = allPaidAvs.filter(
      (av) =>
        !documents.some(
          (rc) =>
            rc.docType === 'RC' &&
            rc.parentAvId === av.id &&
            Boolean(rc.financeConfirmedAt)
        )
    );
    const outstandingAvTotal = unsettledAvs.reduce((sum, d) => sum + d.amount, 0);
    const settledAvRatio =
      allPaidAvs.length > 0
        ? Math.round(((allPaidAvs.length - unsettledAvs.length) / allPaidAvs.length) * 100)
        : 0;

    // 4. Module breakdown by document type
    const docTypes: DocType[] = ['PR', 'PO', 'AV', 'RB', 'RC', 'PV'];
    const moduleStats = docTypes.map((t) => {
      const docsOfType = documents.filter((d) => d.docType === t);
      const totalVal = docsOfType.reduce((s, d) => s + getDocAmount(d), 0);
      const approvedVal = docsOfType
        .filter((d) => d.status === 'APPROVED' || d.status === 'PAID')
        .reduce((s, d) => s + getDocAmount(d), 0);
      return {
        type: t,
        count: docsOfType.length,
        totalVal,
        approvedVal,
      };
    });
    const maxModuleVal = Math.max(...moduleStats.map((m) => m.totalVal), 10_000_000);

    // 5. Recent Audit Logs
    const recentLogs = documents
      .flatMap((doc) =>
        doc.auditLog.map((log) => ({
          ...log,
          docNumber: doc.docNumber,
          docType: doc.docType,
        }))
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    return {
      pendingForRole,
      approvedOrPaidCount,
      inReviewCount,
      draftOrRejectedCount,
      unsettledAvs,
      outstandingAvTotal,
      settledAvRatio,
      moduleStats,
      maxModuleVal,
      recentLogs,
    };
  }, [documents, activeRole]);

  return (
    <div className="flex flex-col gap-5 mb-6">
      {/* =====================================================================
          ROW 1: OPERATIONAL ACTION QUEUE BAR (4 FUNCTIONAL CARDS)
         ===================================================================== */}
      <section
        aria-label="Antrean Tindakan dan Status Pengadaan"
        className="stats-strip"
      >
        {/* CARD 1: Tugas Menunggu Sesuai Peran */}
        <div
          className={`stat metric-summary ${
            pendingForRole > 0
              ? 'metric-summary-pending'
              : ''
          }`}
        >
          <div className="metric-summary-heading">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">
                Tugas Menunggu Saya
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  pendingForRole > 0
                    ? 'bg-[#E51937] text-white'
                    : 'bg-[#F3F4F6] text-[#4B5563]'
                }`}
              >
                {pendingForRole} Tugas
              </span>
          </div>
            <div className="metric-summary-value">
              {pendingForRole}{' '}
              <span className="text-xs font-semibold text-[#4B5563]">dokumen</span>
            </div>
          <p className="metric-summary-footer">
            Peran: <strong className="text-[#111827]">{ROLE_TITLES[activeRole]}</strong>
          </p>
        </div>

        {/* CARD 2: Outstanding Uang Muka (AV) */}
        <div className="stat metric-summary">
          <div className="metric-summary-heading">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">
                Uang Muka Beredar
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
                {unsettledAvs.length} Belum dikonfirmasi
              </span>
          </div>
            <div className="metric-summary-value tabular-nums">
              {rupiah.format(outstandingAvTotal)}
            </div>
          <div className="metric-summary-footer">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-[#4B5563]">
              <span>Realisasi AV Selesai</span>
              <span className="font-bold text-[#111827]">{settledAvRatio}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
              <div
                className="h-full bg-[#10B981] rounded-full transition-all duration-300"
                style={{ width: `${settledAvRatio}%` }}
              />
            </div>
          </div>
        </div>

        {/* CARD 3: Dokumen Ditinjau & Revisi */}
        <div className="stat metric-summary">
          <div className="metric-summary-heading">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">
                Sedang Diproses & Revisi
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
                {inReviewCount} Ditinjau
              </span>
          </div>
            <div className="metric-summary-value">
              {inReviewCount + draftOrRejectedCount}{' '}
              <span className="text-xs font-semibold text-[#4B5563]">dokumen</span>
            </div>
          <div className="metric-summary-footer metric-summary-breakdown">
            <span>
              Sedang Ditinjau: <strong className="text-[#92400E]">{inReviewCount}</strong>
            </span>
            <span>
              Draf / Revisi: <strong className="text-[#991b1b]">{draftOrRejectedCount}</strong>
            </span>
          </div>
        </div>

        {/* CARD 4: Dokumen Disetujui / Lunas */}
        <div className="stat metric-summary">
          <div className="metric-summary-heading">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">
                Penyelesaian Berjalan
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                Aktif
              </span>
          </div>
            <div className="metric-summary-value">
              {approvedOrPaidCount}{' '}
              <span className="text-xs font-semibold text-[#4B5563]">dokumen</span>
            </div>
          <p className="metric-summary-footer">
            Tercatat <strong className="text-[#065F46]">Disetujui</strong> atau{' '}
            <strong className="text-[#1E40AF]">Lunas</strong> di sistem
          </p>
        </div>
      </section>

      {/* =====================================================================
          ROW 2: MODULAR VOLUME SUMMARY & AUDIT TIMELINE
         ===================================================================== */}
      <section
        aria-label="Ringkasan Modul dan Rekam Jejak"
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        {/* LEFT 2-COLS: Interactive Module Breakdown Bar */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-white border border-[#E2E8F0] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">
                Volume & Nominal per Jenis Dokumen
              </h3>
              <p className="text-xs text-[#4B5563]">
                Pilih jenis dokumen untuk memfilter daftar pengadaan
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="inline-flex items-center gap-1.5 text-[#111827]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E51937]" />
                Nilai Diajukan
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#4B5563]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                Disetujui / Lunas
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {moduleStats.map((m) => {
              const totalH =
                m.totalVal > 0 ? Math.max(Math.round((m.totalVal / maxModuleVal) * 90), 12) : 6;
              const appH =
                m.approvedVal > 0
                  ? Math.max(Math.round((m.approvedVal / maxModuleVal) * 90), 8)
                  : 6;

              return (
                <button
                  type="button"
                  key={m.type}
                  onClick={() => onSelectTab && onSelectTab(m.type)}
                  className="flex flex-col items-center justify-between p-3 rounded-lg border border-[#E2E8F0] hover:border-[#CBD5E1] bg-[#F8FAFC] hover:bg-white transition-all cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E51937]"
                  title={`${MODULE_NAMES[m.type]} (${m.type}) : Pengajuan: ${rupiah.format(m.totalVal)} | Disetujui: ${rupiah.format(m.approvedVal)}`}
                  aria-label={`Filter tabel ke modul ${MODULE_NAMES[m.type]}, total nilai ${formatCompactRupiah(m.totalVal)}`}
                >
                  <div className="text-center w-full">
                    <span className="text-xs font-bold text-[#111827] block">
                      {formatCompactRupiah(m.totalVal)}
                    </span>
                    <span className="text-[10px] text-[#4B5563] font-medium block">
                      {m.count} dok
                    </span>
                  </div>

                  <div className="flex items-end justify-center gap-1.5 h-24 w-full my-2 pb-1 border-b border-dashed border-[#CBD5E1]">
                    <div
                      className="w-3 rounded-t transition-all duration-200"
                      style={{
                        height: `${totalH}px`,
                        backgroundColor: m.totalVal > 0 ? '#E51937' : '#E2E8F0',
                      }}
                    />
                    <div
                      className="w-3 rounded-t transition-all duration-200"
                      style={{
                        height: `${appH}px`,
                        backgroundColor: m.approvedVal > 0 ? '#10B981' : '#E2E8F0',
                      }}
                    />
                  </div>

                  <div className="text-center w-full">
                    <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#E51937]">
                      {m.type}
                    </span>
                    <span className="text-[11px] text-[#4B5563] block truncate mt-1">
                      {m.type === 'PR' ? 'Req' : m.type === 'PO' ? 'Order' : m.type === 'AV' ? 'Advance' : m.type === 'RB' ? 'Reimburse' : m.type === 'RC' ? 'Realisasi' : 'Voucher'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT 1-COL: Activity Timeline */}
        <div className="p-5 rounded-lg bg-white border border-[#E2E8F0] flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#111827]">Rekam Jejak Aktivitas Terkini</h3>
            <p className="text-xs text-[#4B5563]">Log riwayat keputusan sistem terbaru</p>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {recentLogs.map((log) => {
              let timeStr = '';
              try {
                timeStr = new Intl.DateTimeFormat('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(log.timestamp));
              } catch {
                timeStr = 'Baru saja';
              }

              return (
                <div key={log.id} className="flex items-start gap-2.5 text-xs">
                  <span className="w-11 text-[11px] font-semibold text-[#4B5563] shrink-0 pt-0.5">
                    {timeStr}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-[#E51937] shrink-0 mt-1.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#111827] truncate">
                      {ACTIVITY_LABELS[log.action] ?? log.action.replaceAll('_', ' ')}
                    </p>
                    <p className="text-[11px] text-[#4B5563] truncate">
                      <strong className="text-[#E51937]">{log.docNumber}</strong> · {displayPersonName(log.actor)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BentoMetrics;

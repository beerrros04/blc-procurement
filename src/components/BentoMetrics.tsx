import React, { useMemo } from 'react';
import type { AnyDocument, AVDocument, DocType, UserRole } from '../types/document';

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

const MODULE_SHORT_NAMES: Record<DocType, string> = {
  PR: 'Purchase Req',
  PO: 'Purchase Order',
  AV: 'Cash Advance',
  RB: 'Reimburse',
  RC: 'Realisasi AV',
  PV: 'Payment Vch',
};

const ACTIVITY_LABELS: Record<string, string> = {
  UPLOAD_ATTACHMENT: 'Menambahkan lampiran', CREATE_DRAFT: 'Membuat draf',
  UPDATE_DRAFT: 'Memperbarui draf', SUBMIT: 'Mengajukan dokumen',
  APPROVE: 'Menyetujui pengajuan', REJECT: 'Mengembalikan pengajuan',
  GENERATE_PV: 'Menerbitkan payment voucher', RECORD_PAYMENT: 'Mencatat pembayaran',
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

const ROLE_GREETING_NAMES: Record<UserRole, string> = {
  ADMIN: 'Admin Lokal',
  PEMOHON: 'Dewi Lestari (Staff Pemohon)',
  ATASAN: 'Pak Hendra (Atasan Langsung)',
  AYU: 'Bu Ayu (Verifikator Keuangan)',
  BOD_HERY: 'Pak Hery (Direksi BoD)',
  BOD_HASHIMOTO: 'Koji Hashimoto (Direksi BoD)',
  KEUANGAN: 'Erika Ayu Fitriana (Keuangan)',
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
    completionPct,
    unsettledAvs,
    outstandingAvTotal,
    settledAvRatio,
    moduleStats,
    maxModuleVal,
    recentLogs,
  } = useMemo(() => {
    // 2. Pending Actions specific to active role
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
          (d.status === 'APPROVED' && d.docType !== 'PV') ||
          (d.docType === 'PV' && d.paymentStatus === 'UNPAID')
        );
      }
      return false;
    }).length;

    // 3. Status counts for Donut Ring
    const approvedOrPaidCount = documents.filter(
      (d) => d.status === 'APPROVED' || d.status === 'PAID'
    ).length;
    const inReviewCount = documents.filter(
      (d) => d.status === 'SUBMITTED' || d.status === 'IN_REVIEW'
    ).length;
    const draftOrRejectedCount = documents.filter(
      (d) => d.status === 'DRAFT' || d.status === 'REJECTED'
    ).length;
    const totalCount = Math.max(documents.length, 1);
    const completionPct = Math.round((approvedOrPaidCount / totalCount) * 100);

    // 4. Outstanding AV vs Realized RC
    const allPaidAvs = documents.filter(
      (d): d is AVDocument => d.docType === 'AV' && d.status === 'PAID'
    );
    const unsettledAvs = allPaidAvs.filter((av) => !documents.some((rc) => rc.docType === 'RC' && rc.parentAvId === av.id && Boolean(rc.financeConfirmedAt)));
    const outstandingAvTotal = unsettledAvs.reduce((sum, d) => sum + d.amount, 0);
    const settledAvRatio =
      allPaidAvs.length > 0
        ? Math.round(((allPaidAvs.length - unsettledAvs.length) / allPaidAvs.length) * 100)
        : 0;

    // 5. Module breakdown for Spike Pro "Profit & Expenses" Bar Chart
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

    // 6. Recent Audit Logs for Spike Pro "Upcoming Schedules / Activity Timeline"
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
      completionPct,
      unsettledAvs,
      outstandingAvTotal,
      settledAvRatio,
      moduleStats,
      maxModuleVal,
      recentLogs,
    };
  }, [documents, activeRole]);

  const timelineColors = ['#E51937', '#00CEB6', '#FFAE1F', '#0085DB', '#8763DA'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
      {/* =====================================================================
          ROW 1: SPIKE PRO TOP BENTO ROW (Welcome Card + 3 Micro-Chart Cards)
         ===================================================================== */}
      <section
        aria-label="Metrik Utama Pengadaan"
        className="metrics-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: '20px',
        }}
      >
        {/* CARD 1: Spike Pro Welcome / Greeting Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F7 100%)',
            borderRadius: 'var(--card-radius)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid #FBCFE8',
          }}
        >
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#111C2D', margin: '0 0 6px 0' }}>
              {ROLE_GREETING_NAMES[activeRole]}
            </h3>
            <p style={{ fontSize: '12.5px', color: '#5A6A85', margin: 0 }}>
              {pendingForRole > 0
                ? `${pendingForRole} dokumen menunggu tindak lanjut.`
                : 'Tidak ada antrean tugas.'}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(229, 25, 55, 0.12)',
            }}
          >
            <div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#E51937', fontFamily: 'var(--font-mono)' }}>
                {pendingForRole}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#5A6A85' }}>Tugas Menunggu</div>
            </div>
            <div style={{ width: '1px', height: '28px', background: 'rgba(229, 25, 55, 0.15)' }} />
            <div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#111C2D', fontFamily: 'var(--font-mono)' }}>
                {completionPct}%
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#5A6A85' }}>Rasio Selesai</div>
            </div>
          </div>
        </div>

        {/* CARD 2: Total Nilai Pengadaan */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--card-radius)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#111C2D', margin: 0 }}>
              Dokumen Disetujui / Dibayar
            </h4>

            <div
              style={{
                fontSize: '22px',
                fontWeight: 900,
                color: '#111C2D',
                fontFamily: 'var(--font-mono)',
                marginTop: '12px',
              }}
            >
              {approvedOrPaidCount} dokumen
            </div>
          </div>

          {/* Mini 6-Column Bar Sparkline */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '48px', gap: '8px' }}>
              {moduleStats.map((m, idx) => {
                const h = Math.max(Math.round((m.totalVal / maxModuleVal) * 44), 8);
                const isPrimary = idx % 2 === 0;
                return (
                  <div
                    key={m.type}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                    title={`${m.type}: ${rupiah.format(m.totalVal)}`}
                  >
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '18px',
                        height: `${h}px`,
                        borderRadius: '6px',
                        background: isPrimary ? '#E51937' : '#FCD4DA',
                        transition: 'height 0.3s ease',
                      }}
                    />
                    <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#7C8FAC' }}>{m.type}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CARD 3: Pipeline Persetujuan */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--card-radius)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#111C2D', margin: 0 }}>
              Pipeline Persetujuan
            </h4>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#111C2D', fontFamily: 'var(--font-mono)' }}>
                {inReviewCount} <span style={{ fontSize: '13px', fontWeight: 700, color: '#7C8FAC' }}>Aktif</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#5A6A85' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00CEB6' }} />
                  Selesai: <strong>{approvedOrPaidCount}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#5A6A85' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E51937' }} />
                  Ditinjau: <strong>{inReviewCount}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#5A6A85' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFAE1F' }} />
                  Draf: <strong>{draftOrRejectedCount}</strong>
                </div>
              </div>
            </div>

            {/* SVG Donut Ring Chart */}
            <svg width="84" height="84" viewBox="0 0 42 42" aria-hidden="true">
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#F0F5F9" strokeWidth="5" />
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke="#00CEB6"
                strokeWidth="5"
                strokeDasharray={`${completionPct} ${100 - completionPct}`}
                strokeDashoffset="25"
                strokeLinecap="round"
              />
              <text
                x="50%"
                y="53%"
                dominantBaseline="middle"
                textAnchor="middle"
                fontSize="8.5"
                fontWeight="800"
                fill="#111C2D"
              >
                {completionPct}%
              </text>
            </svg>
          </div>
        </div>

        {/* CARD 4: Outstanding Uang Muka */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--card-radius)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#111C2D', margin: 0 }}>
                Outstanding Uang Muka
              </h4>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 800,
                  background: 'var(--spike-amber-subtle)',
                  color: '#B4690E',
                }}
              >
                {unsettledAvs.length} Belum dikonfirmasi
              </span>
            </div>

            <div
              style={{
                fontSize: '22px',
                fontWeight: 900,
                color: '#111C2D',
                fontFamily: 'var(--font-mono)',
                marginTop: '12px',
              }}
            >
              {rupiah.format(outstandingAvTotal)}
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px' }}>
              <span style={{ color: '#5A6A85' }}>Realisasi AV Selesai</span>
              <span style={{ color: '#E51937' }}>{settledAvRatio}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                background: '#F0F5F9',
                borderRadius: '999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${settledAvRatio}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #E51937 0%, #FF6B81 100%)',
                  borderRadius: '999px',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          ROW 2: ANALYTICS BAR CHART (8 COL) + ACTIVITY TIMELINE (4 COL)
         ===================================================================== */}
      <section
        aria-label="Analitik & Jejak Aktivitas"
        className="analytics-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px',
        }}
      >
        {/* LEFT: Module Volume Chart (Spike Next.js Pro Grouped Vertical Bars) */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--card-radius)',
            padding: '26px',
            boxShadow: 'var(--shadow-card)',
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#111C2D', margin: 0 }}>
              Nilai Pengajuan per Modul
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', fontWeight: 700 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#111C2D' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#E51937' }} />
                Total Pengajuan
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#5A6A85' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00CEB6' }} />
                Disetujui / Dibayar
              </span>
            </div>
          </div>

          {/* Interactive Visual Grouped Bars with Clear Nominal & Module Context */}
          <div
            className="module-chart"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
              gap: '10px',
              padding: '16px 14px',
              background: '#F8FAFD',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {moduleStats.map((m) => {
              const totalH = m.totalVal > 0 ? Math.max(Math.round((m.totalVal / maxModuleVal) * 110), 14) : 6;
              const appH = m.approvedVal > 0 ? Math.max(Math.round((m.approvedVal / maxModuleVal) * 110), 10) : 6;
              return (
                <div
                  key={m.type}
                  onClick={() => onSelectTab && onSelectTab(m.type)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '12px 8px',
                    borderRadius: '12px',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-subtle)',
                    cursor: onSelectTab ? 'pointer' : 'default',
                  }}
                  title={`${MODULE_SHORT_NAMES[m.type]} (${m.type}) — Pengajuan: ${rupiah.format(m.totalVal)} | Disetujui: ${rupiah.format(m.approvedVal)}`}
                >
                  {/* Top Context: Document Count + Compact Nominal */}
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 900,
                        color: m.totalVal > 0 ? '#111C2D' : '#7C8FAC',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {formatCompactRupiah(m.totalVal)}
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#7C8FAC',
                        marginTop: '2px',
                      }}
                    >
                      {m.count} dok
                    </div>
                  </div>

                  {/* Grouped Vertical Bars */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      gap: '6px',
                      height: '115px',
                      width: '100%',
                      borderBottom: '1px dashed var(--border-subtle)',
                      paddingBottom: '6px',
                    }}
                  >
                    <div
                      style={{
                        width: '14px',
                        height: `${totalH}px`,
                        borderRadius: '6px 6px 3px 3px',
                        background: m.totalVal > 0 ? '#E51937' : '#EAEFF4',
                        transition: 'height 0.3s ease',
                      }}
                    />
                    <div
                      style={{
                        width: '14px',
                        height: `${appH}px`,
                        borderRadius: '6px 6px 3px 3px',
                        background: m.approvedVal > 0 ? '#00CEB6' : '#EAEFF4',
                        transition: 'height 0.3s ease',
                      }}
                    />
                  </div>

                  {/* Bottom Module Identity */}
                  <div style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '11.5px',
                        fontWeight: 900,
                        color: m.count > 0 ? '#E51937' : '#5A6A85',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: m.count > 0 ? '#FDF2F4' : '#F0F5F9',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {m.type}
                    </span>
                    <div
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: '#5A6A85',
                        marginTop: '4px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {MODULE_SHORT_NAMES[m.type]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Vertical Activity Timeline Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--card-radius)',
            padding: '26px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#111C2D', margin: 0 }}>
              Jejak Aktivitas Terkini
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', flex: 1 }}>
            {recentLogs.map((log, i) => {
              const ringColor = timelineColors[i % timelineColors.length];
              const isLast = i === recentLogs.length - 1;
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
                <div
                  key={log.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '54px 24px 1fr',
                    gap: '8px',
                    minHeight: isLast ? 'auto' : '58px',
                  }}
                >
                  {/* Time column */}
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#5A6A85', paddingTop: '1px', fontFamily: 'var(--font-mono)' }}>
                    {timeStr}
                  </div>

                  {/* Spike Pro Hollow Circle + Vertical Line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        border: `3px solid ${ringColor}`,
                        background: '#FFFFFF',
                        flexShrink: 0,
                        marginTop: '3px',
                      }}
                    />
                    {!isLast && (
                      <span
                        style={{
                          width: '2px',
                          flex: 1,
                          background: '#EAEFF4',
                          margin: '4px 0',
                        }}
                      />
                    )}
                  </div>

                  {/* Event details */}
                  <div style={{ paddingBottom: isLast ? '0' : '12px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#111C2D', lineHeight: 1.3 }}>
                      {ACTIVITY_LABELS[log.action] ?? log.action.replaceAll('_', ' ')}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#7C8FAC', marginTop: '2px' }}>
                      <strong style={{ color: '#E51937', fontFamily: 'var(--font-mono)' }}>{log.docNumber}</strong> • {log.actor}
                    </div>
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

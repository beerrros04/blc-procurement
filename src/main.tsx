import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Banknote,
  BookOpen,
  CreditCard,
  FileCheck2,
  FileText,
  History,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Receipt,
  Scale,
  ShoppingBag,
  X,
} from 'lucide-react';
import {
  ApprovalDocsView,
  ApprovalHistoryView,
  ApprovalRegisterView,
} from './components/ApprovalExplorer';
import { BentoMetrics } from './components/BentoMetrics';
import { DocumentDetailModal } from './components/DocumentDetailModal';
import { DocumentList } from './components/DocumentList';
import { ExportModal } from './components/ExportModal';
import { FormAV } from './components/forms/FormAV';
import { FormPO } from './components/forms/FormPO';
import { FormPR } from './components/forms/FormPR';
import { FormPVPayment } from './components/forms/FormPVPayment';
import { FormRB } from './components/forms/FormRB';
import { FormRC } from './components/forms/FormRC';
import { StaffBeranda } from './components/StaffBeranda';
import { SignInPage } from './components/ui/sign-in';
import { branchOptions } from './domain/branches';
import { api, clearApiToken, hasApiToken, setApiToken } from './api';
import { createEmptyDocument } from './store/document-store';
import './style.css';
import type {
  AnyDocument,
  AVDocument,
  DocType,
  PODocument,
  PRDocument,
  PVDocument,
  PVPaymentDetails,
  RBDocument,
  RCDocument,
  UserRole,
} from './types/document';

export type WorkspaceTab = DocType | 'ALL' | 'BERANDA' | 'REGISTER' | 'HISTORY' | 'DOCS';

interface AuthAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  branch: string;
}

const CORPORATE_ACCOUNTS: AuthAccount[] = [
  { id: 'usr-admin', email: 'admin@blc.co.id', name: 'Admin Lokal', role: 'ADMIN', roleTitle: 'Admin', branch: 'Bekasi' },
  {
    id: 'usr-pemohon',
    email: 'pemohon@blc.co.id',
    name: 'Dewi Lestari',
    role: 'PEMOHON',
    roleTitle: 'Staff Pemohon',
    branch: 'Bekasi',
  },
  {
    id: 'usr-atasan',
    email: 'atasan@blc.co.id',
    name: 'Pak Hendra',
    role: 'ATASAN',
    roleTitle: 'Atasan Tahap 1',
    branch: 'Surabaya',
  },
  {
    id: 'usr-ayu',
    email: 'ayu@blc.co.id',
    name: 'Bu Ayu',
    role: 'AYU',
    roleTitle: 'GM / Penyetuju Tahap 2',
    branch: 'Bekasi',
  },
  {
    id: 'usr-hery',
    email: 'hery@blc.co.id',
    name: 'Pak Hery',
    role: 'BOD_HERY',
    roleTitle: 'Direksi BoD',
    branch: 'Bekasi',
  },
  {
    id: 'usr-hashimoto',
    email: 'hashimoto@blc.co.id',
    name: 'Koji Hashimoto',
    role: 'BOD_HASHIMOTO',
    roleTitle: 'Direksi BoD',
    branch: 'Bekasi',
  },
  {
    id: 'usr-keuangan',
    email: 'keuangan@blc.co.id',
    name: 'Erika Ayu Fitriana',
    role: 'KEUANGAN',
    roleTitle: 'Keuangan Finance',
    branch: 'Bekasi',
  },
];

const AUTH_SESSION_KEY = 'blc_auth_session_v1';

interface NavItem {
  id: WorkspaceTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  section: 'HOME' | 'APPS' | 'SHAREPOINT';
  badgeCount?: (docs: AnyDocument[]) => number;
}

const APP_NAV_ITEMS: NavItem[] = [
  {
    id: 'PR',
    label: 'Purchase Request (PR)',
    icon: FileText,
    section: 'APPS',
    badgeCount: (docs) => docs.filter((d) => d.docType === 'PR').length,
  },
  {
    id: 'PO',
    label: 'Purchase Order (PO)',
    icon: ShoppingBag,
    section: 'APPS',
    badgeCount: (docs) => docs.filter((d) => d.docType === 'PO').length,
  },
  {
    id: 'AV',
    label: 'Cash Advance (AV)',
    icon: Banknote,
    section: 'APPS',
    badgeCount: (docs) => docs.filter((d) => d.docType === 'AV').length,
  },
  {
    id: 'RB',
    label: 'Reimbursement (RB)',
    icon: Receipt,
    section: 'APPS',
    badgeCount: (docs) => docs.filter((d) => d.docType === 'RB').length,
  },
  {
    id: 'RC',
    label: 'Realisasi Uang Muka (RC)',
    icon: Scale,
    section: 'APPS',
    badgeCount: (docs) => docs.filter((d) => d.docType === 'RC').length,
  },
  {
    id: 'PV',
    label: 'Payment Voucher (PV)',
    icon: CreditCard,
    section: 'APPS',
    badgeCount: (docs) => docs.filter((d) => d.docType === 'PV').length,
  },
];

const SHAREPOINT_NAV_ITEMS: NavItem[] = [
  {
    id: 'REGISTER',
    label: 'Approval Register',
    icon: BookOpen,
    section: 'SHAREPOINT',
    badgeCount: (docs) => docs.length,
  },
  {
    id: 'HISTORY',
    label: 'Approval History',
    icon: History,
    section: 'SHAREPOINT',
    badgeCount: (docs) => docs.reduce((s, d) => s + d.auditLog.length, 0),
  },
  {
    id: 'DOCS',
    label: 'Approval Docs',
    icon: FileCheck2,
    section: 'SHAREPOINT',
    badgeCount: (docs) =>
      docs.reduce((s, d) => s + (d.attachments?.length ?? 0), 0),
  },
];

function isExecutiveOrApproverRole(role: UserRole): boolean {
  return (
    role === 'ATASAN' ||
    role === 'ADMIN' ||
    role === 'AYU' ||
    role === 'BOD_HERY' ||
    role === 'BOD_HASHIMOTO' ||
    role === 'KEUANGAN'
  );
}

function App() {
  const [authUser, setAuthUser] = useState<AuthAccount | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_SESSION_KEY);
      if (saved && hasApiToken()) {
        return JSON.parse(saved) as AuthAccount;
      }
    } catch {
      // Ignore invalid session
    }
    return null;
  });
  const [loginError, setLoginError] = useState<string>('');

  const [documents, setDocuments] = useState<AnyDocument[]>([]);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => {
    if (authUser && !isExecutiveOrApproverRole(authUser.role)) {
      return 'BERANDA';
    }
    return 'ALL';
  });
  const [notice, setNotice] = useState<string>('');
  const [formError, setFormError] = useState('');

  // Modals state
  const [activeFormType, setActiveFormType] = useState<DocType | null>(null);
  const [editingDoc, setEditingDoc] = useState<AnyDocument | null>(null);
  const [detailDoc, setDetailDoc] = useState<AnyDocument | null>(null);
  const [payingPv, setPayingPv] = useState<PVDocument | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function refreshDocs() {
    if (!hasApiToken()) return;
    try { const result = await api<{ documents: AnyDocument[] }>('/documents'); setDocuments(result.documents); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Gagal memuat data server.'); }
  }

  useEffect(() => {
    if (!hasApiToken()) return;
    void api<{ user: { id: string } }>('/me').then(({ user }) => {
      setAuthUser((previous) => {
        if (!previous || previous.id === user.id) return previous;
        const updated = { ...previous, id: user.id };
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updated));
        return updated;
      });
      return refreshDocs();
    }).catch(() => { clearApiToken(); setAuthUser(null); setLoginError('Sesi berakhir. Silakan masuk kembali.'); });
  }, []);

  async function completeLogin(account: AuthAccount, password: string) {
    try {
      const result = await api<{ token: string; user: { id: string } }>('/auth/login', 'POST', { email: account.email, password });
      setApiToken(result.token);
      account = { ...account, id: result.user.id };
    } catch (error) { setLoginError(error instanceof Error ? error.message : 'Server tidak tersedia.'); return; }
    setAuthUser(account);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(account));
    setLoginError('');
    if (isExecutiveOrApproverRole(account.role)) {
      setActiveTab('ALL');
    } else {
      setActiveTab('BERANDA');
    }
    setNotice('');

    void refreshDocs();
  }

  function handleSignInSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get('email') || '')
      .trim()
      .toLowerCase();
    const password = String(formData.get('password') || '');

    const account = CORPORATE_ACCOUNTS.find((a) => a.email.toLowerCase() === email);
    if (!account || password !== 'blc2026') {
      setLoginError('Email atau kata sandi tidak sesuai (gunakan kata sandi: blc2026).');
      return;
    }

    void completeLogin(account, password);
  }

  function handleSignOut() {
    setAuthUser(null);
    localStorage.removeItem(AUTH_SESSION_KEY);
    clearApiToken();
    setDocuments([]);
    setNotice('');
  }

  if (!authUser) {
    return (
      <SignInPage
        title={<span className="font-black text-[#111C2D] tracking-tight">Masuk ke BLC Procurement</span>}
        description="Mode demo: pilih akun contoh untuk mencoba ruang kerja. Login Microsoft 365 belum terhubung."
        heroImageSrc="/logo.png"
        errorMessage={loginError}
        quickAccounts={CORPORATE_ACCOUNTS.map((a) => ({
          label: a.name,
          email: a.email,
          roleBadge: a.role === 'AYU' ? 'GM' : a.role.startsWith('BOD_') ? 'BOD' : a.role === 'KEUANGAN' ? 'FINANCE' : a.role === 'PEMOHON' ? 'PENGAJU' : a.role,
        }))}
        onSignIn={handleSignInSubmit}
        onResetPassword={() => setLoginError('Kata sandi default pengujian: blc2026')}
      />
    );
  }

  const activeRole = authUser.role;
  const canSeeExecutiveDashboard = isExecutiveOrApproverRole(activeRole);

  function handleCreateDoc(type: DocType) {
    setFormError('');
    const emptyDoc = createEmptyDocument(type, authUser?.branch || 'Bekasi');
    setEditingDoc(emptyDoc);
    setActiveFormType(type);
  }

  function handleEditDoc(doc: AnyDocument) {
    setFormError('');
    setEditingDoc(doc);
    setActiveFormType(doc.docType);
  }

  function handleCreateRelated(parent: AnyDocument) {
    setFormError('');
    if (parent.docType === 'PR' && parent.status === 'APPROVED') {
      const doc = createEmptyDocument('PO', parent.branch) as PODocument;
      setEditingDoc({ ...doc, parentPrId: parent.id, title: `PO: ${parent.title}`, purpose: parent.purpose, subtotal: parent.subtotalAmount });
      setActiveFormType('PO');
    } else if (parent.docType === 'AV' && parent.status === 'PAID') {
      const av = availableAvs.find((item) => item.id === parent.id);
      if (!av) return;
      const doc = createEmptyDocument('RC', parent.branch) as RCDocument;
      setEditingDoc({ ...doc, parentAvId: av.id, avOriginalAmount: av.amount, title: `Realisasi AV: ${av.docNumber} - ${av.title}` });
      setActiveFormType('RC');
    }
  }

  async function handleSaveDoc(doc: AnyDocument) {
    setFormError('');
    try {
    const exists = documents.some((item) => item.id === doc.id);
    const pending = (doc.attachments ?? []).filter((attachment) => attachment.dataUrl);
    const payload = { ...doc, expectedVersion: (doc as AnyDocument & { version?: number }).version, attachments: (doc.attachments ?? []).filter((attachment) => !attachment.dataUrl) };
    const saved = await api<{ document: AnyDocument }>(exists ? `/documents/${encodeURIComponent(doc.id)}` : '/documents', exists ? 'PUT' : 'POST', payload);
    await refreshDocs();
    for (const attachment of pending) {
      await api(`/documents/${encodeURIComponent(doc.id)}/attachments`, 'POST', {
        originalName: attachment.name, mimeType: attachment.mimeType,
        category: attachment.category === 'QUOTATION' || attachment.category === 'OTHER' ? 'SUPPORTING' : attachment.category,
        contentBase64: attachment.dataUrl?.split(',')[1],
      });
    }
    await refreshDocs();
    setActiveFormType(null);
    setEditingDoc(null);
    setNotice(`Draf dokumen ${saved.document.docNumber} berhasil disimpan.`);
    } catch (error) { setFormError(error instanceof Error ? error.message : 'Gagal menyimpan draf.'); }
  }

  async function handleSubmitDoc(docId: string) {
    try { await api(`/documents/${encodeURIComponent(docId)}/submit`, 'POST', { expectedVersion: (documents.find((item) => item.id === docId) as (AnyDocument & { version?: number }) | undefined)?.version });
    await refreshDocs();
    setNotice(`Dokumen berhasil diajukan ke Tahap 1 (Atasan Langsung).`);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Gagal mengajukan.'); }
  }

  async function handleApproveDoc(
    docId: string,
    role: 'ATASAN' | 'AYU' | 'BOD_HERY' | 'BOD_HASHIMOTO',
    comment?: string
  ) {
    void role;
    try { await api(`/documents/${encodeURIComponent(docId)}/decisions`, 'POST', { decision: 'APPROVE', comment, expectedVersion: (documents.find((item) => item.id === docId) as (AnyDocument & { version?: number }) | undefined)?.version });
    await refreshDocs();
    setNotice(`Persetujuan berhasil dicatat oleh ${authUser?.name}.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Gagal menyetujui.'); }
  }

  async function handleRejectDoc(
    docId: string,
    role: 'ATASAN' | 'AYU' | 'BOD_HERY' | 'BOD_HASHIMOTO',
    comment: string
  ) {
    void role;
    try { await api(`/documents/${encodeURIComponent(docId)}/decisions`, 'POST', { decision: 'REJECT', comment, expectedVersion: (documents.find((item) => item.id === docId) as (AnyDocument & { version?: number }) | undefined)?.version });
    await refreshDocs();
    setNotice(`Dokumen ditolak dan dikembalikan ke Draf untuk revisi pemohon.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Gagal mengembalikan dokumen.'); }
  }

  async function handleGeneratePv(sourceDocId: string) {
    try { const result = await api<{ document: PVDocument }>(`/documents/${encodeURIComponent(sourceDocId)}/generate-pv`, 'POST', {});
    await refreshDocs();
    setNotice(`Payment Voucher ${result.document.docNumber} berhasil dibuat dan masuk antrean pembayaran.`);
    setActiveTab('PV');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Gagal membuat PV.'); }
  }

  async function handleRecordPvPayment(pvId: string, details: PVPaymentDetails) {
    try { await api(`/payments/${encodeURIComponent(pvId)}/record`, 'POST', details);
    await refreshDocs();
    setPayingPv(null);
    setNotice(`Pembayaran berhasil dicatat. Status PV & dokumen induk kini LUNAS (Paid).`);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Gagal mencatat pembayaran.'); }
  }

  async function handleConfirmRc(id: string) {
    try {
      await api(`/documents/${encodeURIComponent(id)}/confirm-rc`, 'POST', {});
      await refreshDocs();
      setNotice('Penyelesaian realisasi telah dikonfirmasi Finance.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Gagal mengonfirmasi realisasi.'); }
  }

  const availablePrs = documents.filter(
    (d): d is PRDocument => d.docType === 'PR' && d.status === 'APPROVED'
  );
  const availableAvs = documents.filter((d): d is AVDocument =>
    d.docType === 'AV' && d.status === 'PAID' && d.ownerId === authUser.id &&
    !documents.some((rc) => rc.docType === 'RC' && rc.id !== editingDoc?.id && (rc as RCDocument).parentAvId === d.id)
  ).flatMap((av) => {
    const payment = documents.find((item): item is PVDocument => item.docType === 'PV' && item.sourceDocId === av.id && item.paymentStatus === 'PAID');
    return payment ? [{ ...av, amount: payment.netAmountToPay }] : [];
  });

  const homeNavItems: NavItem[] = canSeeExecutiveDashboard
    ? [
        {
          id: 'ALL',
          label: 'Dashboard Pengadaan',
          icon: LayoutDashboard,
          section: 'HOME',
          badgeCount: (docs) => docs.length,
        },
        {
          id: 'BERANDA',
          label: 'Beranda Caready',
          icon: Home,
          section: 'HOME',
        },
      ]
    : [
        {
          id: 'BERANDA',
          label: 'Beranda Caready',
          icon: Home,
          section: 'HOME',
        },
      ];

  return (
    <div className="shell">
      <datalist id="branch-options">{branchOptions(documents.map((doc) => doc.branch)).map((branch) => <option key={branch} value={branch} />)}</datalist>
      {/* =====================================================================
          SPIKE NEXT.JS PRO FLOATING ROUNDED SIDEBAR
         ===================================================================== */}
      <aside className="sidebar">
        <div className="server-status" style={{ padding: '10px 22px 0', fontSize: '12px', color: '#5A6A85' }}>Mode uji · Data tersimpan di server lokal</div>
        <div
          className="brand"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '24px 22px 16px',
          }}
        >
          <img
            src="/logo.png"
            alt="BLC Logo"
            style={{
              width: '42px',
              height: '42px',
              objectFit: 'contain',
              borderRadius: '12px',
              background: '#E51937',
              padding: '4px',
              boxShadow: '0 4px 12px rgba(229, 25, 55, 0.25)',
            }}
          />
          <div>
            <div
              style={{
                fontSize: '17px',
                fontWeight: 900,
                color: '#111C2D',
                letterSpacing: '-0.01em',
                lineHeight: 1.15,
              }}
            >
              BLC Caready
            </div>
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 800,
                color: '#E51937',
                letterSpacing: '0.08em',
                marginTop: '2px',
              }}
            >
              PROCUREMENT PRO
            </div>
          </div>
        </div>

        <button type="button" className="mobile-menu-toggle" aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'} aria-expanded={mobileMenuOpen} aria-controls="main-navigation" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          <span>{mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}</span>
        </button>
        <div id="main-navigation" className={`sidebar-navigation ${mobileMenuOpen ? 'is-open' : ''}`}>
        {/* Section: HOME */}
        <div className="nav-label">HOME</div>
        <nav aria-label="Menu Utama">
          {homeNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const count = item.badgeCount ? item.badgeCount(documents) : undefined;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={isActive ? 'nav-active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                style={{ justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {count !== undefined && (
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '20px',
                      background: isActive ? '#E51937' : '#F0F5F9',
                      color: isActive ? '#FFFFFF' : '#5A6A85',
                      fontWeight: 800,
                    }}
                  >
                    {count}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Section: MODUL DOKUMEN */}
        <div className="nav-label" style={{ marginTop: '18px' }}>
          MODUL DOKUMEN
        </div>
        <nav aria-label="Navigasi jenis dokumen">
          {APP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const count = item.badgeCount ? item.badgeCount(documents) : 0;
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={isActive ? 'nav-active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                style={{ justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    background: isActive ? '#E51937' : '#F0F5F9',
                    color: isActive ? '#FFFFFF' : '#5A6A85',
                    fontWeight: 800,
                  }}
                >
                  {count}
                </span>
              </a>
            );
          })}
        </nav>

        {/* Section: ARSIP PERSETUJUAN */}
        <div className="nav-label" style={{ marginTop: '18px' }}>
          ARSIP PERSETUJUAN
        </div>
        <nav aria-label="Register, Riwayat, dan Pustaka Dokumen">
          {SHAREPOINT_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const count = item.badgeCount ? item.badgeCount(documents) : 0;
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={isActive ? 'nav-active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                style={{ justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    background: isActive ? '#E51937' : '#F0F5F9',
                    color: isActive ? '#FFFFFF' : '#5A6A85',
                    fontWeight: 800,
                  }}
                >
                  {count}
                </span>
              </a>
            );
          })}
        </nav>

        </div>

        {/* Compact User Account Footer at Bottom of Sidebar */}
        <div
          className="sidebar-account"
          style={{
            marginTop: 'auto',
            padding: '16px 18px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#111C2D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {authUser.name}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#5A6A85' }}>
              {authUser.roleTitle}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="secondary"
            style={{ padding: '7px 12px', fontSize: '11.5px', borderRadius: '30px' }}
            title="Keluar / Ganti Akun"
          >
            <LogOut size={13} /> Keluar
          </button>
        </div>
      </aside>

      {/* =====================================================================
          MAIN FLUID WORKSPACE
         ===================================================================== */}
      <main className="main" id="workspace-main">
        <div className="content">
          {notice && (
            <div className="notice" role="status">
              <strong>Notifikasi Sistem:</strong> {notice}
            </div>
          )}

          {/* VIEW 1: BERANDA CAREADY (Default for PEMOHON) */}
          {(activeTab === 'BERANDA' || (!canSeeExecutiveDashboard && activeTab === 'ALL')) && (
            <StaffBeranda
              userName={authUser.name}
              userId={authUser.id}
              userEmail={authUser.email}
              userBranch={authUser.branch}
              documents={documents}
              onCreateDoc={handleCreateDoc}
              onOpenDetail={setDetailDoc}
              onEditDoc={handleEditDoc}
              onSubmitDoc={handleSubmitDoc}
              onGeneratePv={handleGeneratePv}
              onPayPv={setPayingPv}
              onCreateRelated={handleCreateRelated}
              onConfirmRc={handleConfirmRc}
              onOpenExport={() => setIsExportOpen(true)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {/* VIEW 2: APPROVAL REGISTER */}
          {activeTab === 'REGISTER' && (
            <ApprovalRegisterView documents={documents} onOpenDetail={setDetailDoc} />
          )}

          {/* VIEW 3: APPROVAL HISTORY */}
          {activeTab === 'HISTORY' && (
            <ApprovalHistoryView documents={documents} onOpenDetail={setDetailDoc} />
          )}

          {/* VIEW 4: APPROVAL DOCS */}
          {activeTab === 'DOCS' && (
            <ApprovalDocsView documents={documents} onOpenDetail={setDetailDoc} />
          )}

          {/* VIEW 5: EXECUTIVE DASHBOARD ('ALL') OR SPECIFIC MODULE */}
          {(activeTab === 'PR' ||
            activeTab === 'PO' ||
            activeTab === 'AV' ||
            activeTab === 'RB' ||
            activeTab === 'RC' ||
            activeTab === 'PV' ||
            (activeTab === 'ALL' && canSeeExecutiveDashboard)) && (
            <>
              <div className="page-heading" style={{ flexWrap: 'wrap' }}>
                <div>
                  <h1>Ruang Kerja Siklus Pengadaan</h1>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {activeRole === 'PEMOHON' && (
                    <>
                      <button
                        type="button"
                        className="primary"
                        onClick={() => handleCreateDoc('PR')}
                      >
                        <Plus size={15} /> Buat PR
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleCreateDoc('PO')}
                      >
                        <Plus size={15} /> Buat PO
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleCreateDoc('AV')}
                      >
                        <Plus size={15} /> Buat AV
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleCreateDoc('RB')}
                      >
                        <Plus size={15} /> Buat RB
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleCreateDoc('RC')}
                      >
                        <Plus size={15} /> Buat RC
                      </button>
                    </>
                  )}
                </div>
              </div>

              {canSeeExecutiveDashboard && activeTab === 'ALL' && (
                <BentoMetrics
                  documents={documents}
                  activeRole={activeRole}
                  onSelectTab={(tab) => setActiveTab(tab)}
                />
              )}

              <DocumentList
                documents={documents}
                activeTab={
                  activeTab === 'PR' ||
                  activeTab === 'PO' ||
                  activeTab === 'AV' ||
                  activeTab === 'RB' ||
                  activeTab === 'RC' ||
                  activeTab === 'PV'
                    ? activeTab
                    : 'ALL'
                }
                activeRole={activeRole}
                activeUserId={authUser.id}
                onOpenDetail={setDetailDoc}
                onEditDoc={handleEditDoc}
                onSubmitDoc={handleSubmitDoc}
                onGeneratePv={handleGeneratePv}
                onPayPv={setPayingPv}
                onCreateRelated={handleCreateRelated}
                onConfirmRc={handleConfirmRc}
                onOpenExport={() => setIsExportOpen(true)}
              />
            </>
          )}
        </div>
      </main>

      {/* Creation / Edit Modals */}
      {activeFormType === 'PR' && editingDoc && (
        <dialog
          className="modal"
          open
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveFormType(null);
              setEditingDoc(null);
            }
          }}
          onCancel={(e) => {
            e.preventDefault();
            setActiveFormType(null);
            setEditingDoc(null);
          }}
        >
          <section className="drawer">
            <div className="drawer-head">
              <div>
                <h2>Formulir Draf PR</h2>
              </div>
              <button
                className="close"
                aria-label="Tutup formulir"
                type="button"
                onClick={() => {
                  setActiveFormType(null);
                  setEditingDoc(null);
                }}
              >
                <X size={18} />
              </button>
            </div>
            {formError && <div className="notice error-notice" role="alert">{formError}</div>}
            <FormPR
              initialDoc={editingDoc as PRDocument}
              onSave={handleSaveDoc}
              onClose={() => {
                setActiveFormType(null);
                setEditingDoc(null);
              }}
            />
          </section>
        </dialog>
      )}

      {activeFormType === 'PO' && editingDoc && (
        <dialog
          className="modal"
          open
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveFormType(null);
              setEditingDoc(null);
            }
          }}
          onCancel={(e) => {
            e.preventDefault();
            setActiveFormType(null);
            setEditingDoc(null);
          }}
        >
          <section className="drawer" style={{ width: 'min(680px, 100%)' }}>
            <div className="drawer-head">
              <div>
                <h2>Formulir Draf PO</h2>
              </div>
              <button
                className="close"
                aria-label="Tutup formulir"
                type="button"
                onClick={() => {
                  setActiveFormType(null);
                  setEditingDoc(null);
                }}
              >
                <X size={18} />
              </button>
            </div>
            {formError && <div className="notice error-notice" role="alert">{formError}</div>}
            <FormPO
              initialDoc={editingDoc as PODocument}
              availablePrs={availablePrs}
              onSave={handleSaveDoc}
              onClose={() => {
                setActiveFormType(null);
                setEditingDoc(null);
              }}
            />
          </section>
        </dialog>
      )}

      {activeFormType === 'AV' && editingDoc && (
        <dialog
          className="modal"
          open
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveFormType(null);
              setEditingDoc(null);
            }
          }}
          onCancel={(e) => {
            e.preventDefault();
            setActiveFormType(null);
            setEditingDoc(null);
          }}
        >
          <section className="drawer">
            <div className="drawer-head">
              <div>
                <h2>Formulir Draf AV</h2>
              </div>
              <button
                className="close"
                aria-label="Tutup formulir"
                type="button"
                onClick={() => {
                  setActiveFormType(null);
                  setEditingDoc(null);
                }}
              >
                <X size={18} />
              </button>
            </div>
            {formError && <div className="notice error-notice" role="alert">{formError}</div>}
            <FormAV
              initialDoc={editingDoc as AVDocument}
              availablePos={documents.filter((d): d is PODocument => d.docType === 'PO' && d.status === 'APPROVED')}
              onSave={handleSaveDoc}
              onClose={() => {
                setActiveFormType(null);
                setEditingDoc(null);
              }}
            />
          </section>
        </dialog>
      )}

      {activeFormType === 'RB' && editingDoc && (
        <dialog
          className="modal"
          open
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveFormType(null);
              setEditingDoc(null);
            }
          }}
          onCancel={(e) => {
            e.preventDefault();
            setActiveFormType(null);
            setEditingDoc(null);
          }}
        >
          <section className="drawer">
            <div className="drawer-head">
              <div>
                <h2>Formulir Draf RB</h2>
              </div>
              <button
                className="close"
                aria-label="Tutup formulir"
                type="button"
                onClick={() => {
                  setActiveFormType(null);
                  setEditingDoc(null);
                }}
              >
                <X size={18} />
              </button>
            </div>
            {formError && <div className="notice error-notice" role="alert">{formError}</div>}
            <FormRB
              initialDoc={editingDoc as RBDocument}
              onSave={handleSaveDoc}
              onClose={() => {
                setActiveFormType(null);
                setEditingDoc(null);
              }}
            />
          </section>
        </dialog>
      )}

      {activeFormType === 'RC' && editingDoc && (
        <dialog
          className="modal"
          open
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveFormType(null);
              setEditingDoc(null);
            }
          }}
          onCancel={(e) => {
            e.preventDefault();
            setActiveFormType(null);
            setEditingDoc(null);
          }}
        >
          <section className="drawer" style={{ width: 'min(640px, 100%)' }}>
            <div className="drawer-head">
              <div>
                <h2>Formulir Draf RC</h2>
              </div>
              <button
                className="close"
                aria-label="Tutup formulir"
                type="button"
                onClick={() => {
                  setActiveFormType(null);
                  setEditingDoc(null);
                }}
              >
                <X size={18} />
              </button>
            </div>
            {formError && <div className="notice error-notice" role="alert">{formError}</div>}
            <FormRC
              initialDoc={editingDoc as RCDocument}
              availableAvs={availableAvs}
              onSave={handleSaveDoc}
              onClose={() => {
                setActiveFormType(null);
                setEditingDoc(null);
              }}
            />
          </section>
        </dialog>
      )}

      {payingPv && (
        <dialog
          className="modal"
          open
          onClick={(e) => {
            if (e.target === e.currentTarget) setPayingPv(null);
          }}
          onCancel={(e) => {
            e.preventDefault();
            setPayingPv(null);
          }}
        >
          <section className="drawer" style={{ width: 'min(600px, 100%)' }}>
            <div className="drawer-head">
              <div>
                <h2>Eksekusi Pembayaran PV</h2>
              </div>
              <button
                className="close"
                aria-label="Tutup formulir"
                type="button"
                onClick={() => setPayingPv(null)}
              >
                <X size={18} />
              </button>
            </div>
            <FormPVPayment
              pv={payingPv}
              onRecordPayment={handleRecordPvPayment}
              onClose={() => setPayingPv(null)}
            />
          </section>
        </dialog>
      )}

      {detailDoc && (
        <DocumentDetailModal
          document={detailDoc}
          activeRole={activeRole}
          onClose={() => {
            setDetailDoc(null);
            refreshDocs();
          }}
          onApprove={handleApproveDoc}
          onReject={handleRejectDoc}
        />
      )}

      {isExportOpen && (
        <ExportModal
          documents={documents}
          onClose={() => setIsExportOpen(false)}
        />
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

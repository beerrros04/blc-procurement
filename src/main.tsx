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
import { FormGR } from './components/forms/FormGR';
import { FormPO } from './components/forms/FormPO';
import { FormPR } from './components/forms/FormPR';
import { FormPV, type PvGenerationPayload } from './components/forms/FormPV';
import { FormPVPayment } from './components/forms/FormPVPayment';
import { FormRB } from './components/forms/FormRB';
import { FormRC } from './components/forms/FormRC';
import { StaffBeranda } from './components/StaffBeranda';
import { ModalDialog } from './components/ui/modal-dialog';
import { SignInPage } from './components/ui/sign-in';
import { branchOptions } from './domain/branches';
import { displayPersonName } from './domain/display-name';
import { api, clearApiToken, hasApiToken, setApiToken } from './api';
import { createEmptyDocument } from './store/document-store';
import './style.css';
import type {
  AnyDocument,
  AVDocument,
  DocType,
  GRDocument,
  PODocument,
  PRDocument,
  PVDocument,
  PVPaymentDetails,
  RBDocument,
  RCDocument,
  UserRole,
} from './types/document';

export type WorkspaceTab =
  | DocType
  | 'ALL'
  | 'BERANDA'
  | 'REGISTER'
  | 'HISTORY'
  | 'DOCS'
  | 'PENGAJUAN'
  | 'DASHBOARD';

export interface OperationNavItem {
  id: 'DASHBOARD' | 'PENGAJUAN' | 'DOKUMEN';
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tab: WorkspaceTab;
  roles: UserRole[];
}

export function getVisibleOperationsNav(role: UserRole): OperationNavItem[] {
  const allOps: OperationNavItem[] = [
    {
      id: 'DASHBOARD',
      label: 'Dashboard',
      icon: LayoutDashboard,
      tab: 'DASHBOARD',
      roles: ['ADMIN', 'AYU', 'BOD_HERY', 'BOD_HASHIMOTO'],
    },
    {
      id: 'PENGAJUAN',
      label: 'Pengajuan',
      icon: Plus,
      tab: 'PENGAJUAN',
      roles: ['PEMOHON', 'ATASAN', 'ADMIN', 'AYU', 'BOD_HERY', 'BOD_HASHIMOTO', 'KEUANGAN'],
    },
    {
      id: 'DOKUMEN',
      label: 'Dokumen',
      icon: FileText,
      tab: 'ALL',
      roles: ['ADMIN', 'BOD_HERY', 'BOD_HASHIMOTO', 'AYU', 'KEUANGAN'],
    },
  ];

  return allOps.filter((item) => item.roles.includes(role));
}

export function getInitialWorkspaceTab(role: UserRole): WorkspaceTab {
  return getVisibleOperationsNav(role).some((item) => item.id === 'DASHBOARD')
    ? 'DASHBOARD'
    : 'PENGAJUAN';
}

export interface AuthAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  branch: string;
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  PEMOHON: 'Staff Pemohon: Pengajuan dokumen baru PR/PO/AV/RB/RC',
  ATASAN: 'Atasan Tahap 1: Approval awal permohonan staf cabang',
  AYU: 'GM: Approval Tahap 2 & Operasional Pengadaan',
  BOD_HERY: 'Direksi BoD: Otorisasi final dokumen material & strategis',
  BOD_HASHIMOTO: 'Direksi BoD: Otorisasi final dokumen material & strategis',
  KEUANGAN: 'Keuangan: Verifikasi, penerbitan PV, dan pembayaran',
  ADMIN: 'Administrator: Akses penuh seluruh modul dan sistem',
};

export const CORPORATE_ACCOUNTS: AuthAccount[] = [
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
    id: 'GR',
    label: 'Laporan Penerimaan (GR)',
    icon: FileCheck2,
    section: 'APPS',
    badgeCount: (docs) => docs.filter((d) => d.docType === 'GR').length,
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

export function Topbar({
  activeTab,
  onOpenExport,
  currentUserEmail,
  onSwitchAccount,
}: {
  activeTab: WorkspaceTab;
  onOpenExport: () => void;
  currentUserEmail?: string;
  onSwitchAccount?: (email: string) => void;
}) {
  const title =
    activeTab === 'DASHBOARD'
      ? 'Cockpit Eksekutif & Telemetry'
      : activeTab === 'PENGAJUAN' || activeTab === 'BERANDA'
      ? 'Pengajuan & Pelacakan Alur'
      : activeTab === 'REGISTER'
      ? 'Approval Register'
      : activeTab === 'HISTORY'
      ? 'Approval History'
      : activeTab === 'DOCS'
      ? 'Approval Docs'
      : 'Dokumen Pengadaan';

  return (
    <header
      className="topbar"
      style={{
        marginBottom: '20px',
        borderRadius: 'var(--card-radius, 10px)',
        border: '1px solid var(--border-clean, #ededeb)',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#191C1A' }}>
          {title}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {onSwitchAccount && (
          <div className="test-role-switcher" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label
              htmlFor="topbar-role-switcher"
              style={{ fontSize: '12px', fontWeight: 700, color: '#4B5563', whiteSpace: 'nowrap' }}
            >
              Peran Uji:
            </label>
            <select
              id="topbar-role-switcher"
              aria-label="Ganti Peran Uji"
              value={currentUserEmail}
              onChange={(e) => onSwitchAccount(e.target.value)}
              style={{
                fontSize: '12px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#F8FAFC',
                fontWeight: 600,
                color: '#1E293B',
                cursor: 'pointer',
              }}
            >
              {CORPORATE_ACCOUNTS.map((acc) => (
                <option key={acc.email} value={acc.email}>
                  {acc.roleTitle}: {acc.name} ({acc.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          className="s-action"
          onClick={onOpenExport}
          title="Ekspor rekap 13 kolom untuk Finance"
        >
          Ekspor Laporan (13 Kolom)
        </button>
      </div>
    </header>
  );
}

export function getUserInitials(name?: string): string {
  if (!name) return 'U';
  const clean = name.trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export interface SidebarProps {
  sidebarCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  authUser: {
    id: string;
    name: string;
    role: UserRole;
    email?: string;
  };
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  documents: AnyDocument[];
  onSignOut: () => void;
}

export function Sidebar({
  sidebarCollapsed,
  onToggleCollapse,
  mobileMenuOpen,
  setMobileMenuOpen,
  authUser,
  activeTab,
  setActiveTab,
  documents,
  onSignOut,
}: SidebarProps) {
  const displayName = authUser.role === 'ADMIN' ? authUser.name : displayPersonName(authUser.name);
  const initials = getUserInitials(displayName);

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'is-collapsed' : ''}`}>
      <div className="server-status">Mode uji · Data tersimpan di server lokal</div>
      <div className="brand">
        <div className="brand-main">
          <img
            src="/logo.png"
            alt="BLC Logo"
            className="brand-logo"
          />
          <div className="brand-text">
            <div className="brand-title">BLC Caready</div>
            <div className="brand-subtitle">PROCUREMENT PRO</div>
          </div>
        </div>
        <button
          type="button"
          className="sidebar-collapse-toggle"
          aria-label={sidebarCollapsed ? 'Buka sidebar' : 'Lipat sidebar'}
          aria-expanded={!sidebarCollapsed}
          onClick={onToggleCollapse}
          title={sidebarCollapsed ? 'Buka sidebar' : 'Lipat sidebar'}
        >
          <Menu size={18} aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
        aria-expanded={mobileMenuOpen}
        aria-controls="main-navigation"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        <span>{mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}</span>
      </button>
      <div id="main-navigation" className={`sidebar-navigation ${mobileMenuOpen ? 'is-open' : ''}`}>
        {/* Section: OPERATIONS (Elera Architecture per User Specification) */}
        <div className="nav-label">OPERATIONS</div>
        <nav aria-label="Menu Operations">
          {getVisibleOperationsNav(authUser.role).map((item) => {
            const Icon = item.icon;
            const isActive =
              (item.id === 'DASHBOARD' && activeTab === 'DASHBOARD') ||
              (item.id === 'PENGAJUAN' && (activeTab === 'PENGAJUAN' || activeTab === 'BERANDA')) ||
              (item.id === 'DOKUMEN' && (activeTab === 'ALL' || ['PR', 'PO', 'GR', 'AV', 'RB', 'RC', 'PV'].includes(activeTab)));
            const badge =
              item.id === 'DASHBOARD'
                ? documents.filter((d) => d.status === 'IN_REVIEW').length
                : item.id === 'DOKUMEN'
                ? documents.length
                : undefined;

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={isActive ? 'nav-active' : ''}
                aria-current={isActive ? 'page' : undefined}
                title={item.label}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(item.tab);
                  setMobileMenuOpen(false);
                }}
              >
                <div className="nav-item-content">
                  <Icon size={18} />
                  <span className="nav-item-label">{item.label}</span>
                </div>
                {badge !== undefined && (
                  <span className="s-count">{badge}</span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Section: DOKUMEN & AUDIT */}
        <div className="nav-label" style={{ marginTop: '18px' }}>
          DOKUMEN & AUDIT
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
                aria-current={isActive ? 'page' : undefined}
                title={item.label}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
              >
                <div className="nav-item-content">
                  <Icon size={18} />
                  <span className="nav-item-label">{item.label}</span>
                </div>
                <span className="s-count">{count}</span>
              </a>
            );
          })}
        </nav>
      </div>

      {/* Compact User Account Footer at Bottom of Sidebar */}
      <div className="sidebar-account">
        <div className="sidebar-user-row">
          <div className="sidebar-user-avatar" aria-hidden="true" title={displayName}>
            {initials}
          </div>
          <div className="sidebar-user-name">
            {displayName}
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="secondary sidebar-logout-btn"
          title="Keluar"
          aria-label="Keluar dari akun"
        >
          <LogOut size={13} aria-hidden="true" />
          <span className="sidebar-logout-text">Keluar</span>
        </button>
      </div>
    </aside>
  );
}

export function App() {
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
    return authUser ? getInitialWorkspaceTab(authUser.role) : 'PENGAJUAN';
  });
  const [notice, setNotice] = useState<string>('');
  const [formError, setFormError] = useState('');

  // Modals state
  const [activeFormType, setActiveFormType] = useState<DocType | null>(null);
  const [editingDoc, setEditingDoc] = useState<AnyDocument | null>(null);
  const [detailDoc, setDetailDoc] = useState<AnyDocument | null>(null);
  const [generatingPvSource, setGeneratingPvSource] = useState<AnyDocument | null>(null);
  const [payingPv, setPayingPv] = useState<PVDocument | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    setActiveTab(getInitialWorkspaceTab(account.role));
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

  async function handleSwitchAccount(email: string) {
    const account = CORPORATE_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (account) {
      await completeLogin(account, 'blc2026');
    }
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
        title="Portal Pengadaan & Keuangan"
        description="Masuk menggunakan akun korporat Anda untuk pengajuan permohonan atau otorisasi berjenjang."
        heroImageSrc="/logo.png"
        errorMessage={loginError}
        quickAccounts={CORPORATE_ACCOUNTS.map((a) => ({
          label: a.role === 'ADMIN' ? a.name : displayPersonName(a.name),
          email: a.email,
          roleBadge: a.role === 'AYU' ? 'GM' : a.role.startsWith('BOD_') ? 'BOD' : a.role === 'KEUANGAN' ? 'FINANCE' : a.role === 'PEMOHON' ? 'PENGAJU' : a.role,
          description: ROLE_DESCRIPTIONS[a.role],
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
      setEditingDoc({
        ...doc,
        parentPrId: parent.id,
        title: `PO: ${parent.title}`,
        purpose: parent.purpose,
        subtotal: parent.subtotalAmount,
        budgetType: parent.budgetType,
        iamNumber: parent.iamNumber,
        otherCosts: parent.otherCosts ?? 0,
        discount: parent.discount ?? 0,
        ppnRate: parent.ppnRate ?? 0.11,
        pphRate: parent.pphRate ?? 0,
        stage1ApproverEmail: parent.stage1ApproverEmail,
      });
      setActiveFormType('PO');
    } else if (parent.docType === 'PO' && (parent.status === 'APPROVED' || parent.status === 'PAID')) {
      const doc = createEmptyDocument('GR', parent.branch) as GRDocument;
      setEditingDoc({
        ...doc,
        parentPoId: parent.id,
        parentPoNumber: parent.docNumber,
        vendorName: parent.vendorName,
        title: `Laporan Penerimaan: ${parent.title}`,
        purpose: parent.purpose,
      });
      setActiveFormType('GR');
    } else if (parent.docType === 'AV' && parent.status === 'PAID') {
      const av = availableAvs.find((item) => item.id === parent.id);
      if (!av) return;
      const doc = createEmptyDocument('RC', parent.branch) as RCDocument;
      setEditingDoc({ ...doc, parentAvId: av.id, avOriginalAmount: av.amount, title: `Realisasi AV: ${av.docNumber} - ${av.title}` });
      setActiveFormType('RC');
    }
  }

  async function handleSaveDoc(doc: AnyDocument, andSubmit = false) {
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
          category: attachment.category === 'OTHER' ? 'SUPPORTING' : attachment.category,
          contentBase64: attachment.dataUrl?.split(',')[1],
        });
      }
      if (doc.docType === 'GR') {
        await api(`/documents/${encodeURIComponent(doc.id)}/submit`, 'POST', {});
        await refreshDocs();
        setNotice(`Laporan Penerimaan ${saved.document.docNumber} berhasil dicatat.`);
      } else if (andSubmit) {
        await handleSubmitDoc(saved.document.id, (saved.document as any).version, saved.document.docType);
      } else {
        await refreshDocs();
        setNotice(`Draf dokumen ${saved.document.docNumber} berhasil disimpan.`);
      }
      setActiveFormType(null);
      setEditingDoc(null);
    } catch (error) { setFormError(error instanceof Error ? error.message : 'Gagal menyimpan draf.'); }
  }

  async function handleSubmitDoc(docId: string, version?: number, docType?: string) {
    try {
      const targetDoc = documents.find((item) => item.id === docId) as (AnyDocument & { version?: number }) | undefined;
      await api(`/documents/${encodeURIComponent(docId)}/submit`, 'POST', { expectedVersion: version ?? targetDoc?.version });
      await refreshDocs();
      const type = docType ?? targetDoc?.docType;
      setNotice(
        type === 'GR'
          ? 'Laporan Penerimaan berhasil dicatat (Tanpa Persetujuan).'
          : type === 'PV'
          ? 'Payment Voucher berhasil diajukan ulang ke Ayu Martina.'
          : 'Dokumen berhasil diajukan ke Tahap 1 (Atasan Langsung).'
      );
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
    setNotice(`Persetujuan berhasil dicatat oleh ${displayPersonName(authUser?.name)}.`);
    } catch (error) { throw error instanceof Error ? error : new Error('Gagal menyetujui.'); }
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
    } catch (error) { throw error instanceof Error ? error : new Error('Gagal mengembalikan dokumen.'); }
  }

  function handleOpenGeneratePv(sourceDocId: string) {
    const src = documents.find((d) => d.id === sourceDocId);
    if (src) {
      setGeneratingPvSource(src);
    }
  }

  async function handleConfirmGeneratePv(sourceDocId: string, options: PvGenerationPayload) {
    try {
      const result = await api<{ document: PVDocument }>(
        `/documents/${encodeURIComponent(sourceDocId)}/generate-pv`,
        'POST',
        options
      );
      await refreshDocs();
      setGeneratingPvSource(null);
      setNotice(
        `Payment Voucher ${result.document.docNumber} berhasil diajukan dan menunggu persetujuan Ayu Martina, Hery Sugiarto, dan Koji Hashimoto.`
      );
      setActiveTab('PV');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Gagal membuat PV.');
    }
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
    (d): d is PRDocument =>
      d.docType === 'PR' &&
      d.status === 'APPROVED' &&
      !documents.some(
        (po) =>
          po.docType === 'PO' &&
          po.id !== editingDoc?.id &&
          po.status !== 'REJECTED' &&
          (po as PODocument).parentPrId === d.id
      )
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
          BLC CAREAADY CORPORATE SIDEBAR
         ===================================================================== */}
      <Sidebar
        sidebarCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        authUser={authUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        documents={documents}
        onSignOut={handleSignOut}
      />

      {/* =====================================================================
          MAIN FLUID WORKSPACE
         ===================================================================== */}
      <main className="main" id="workspace-main">
        <div className="content">
          {/* =====================================================================
              ELERA CORPORATE TOPBAR (Elera Architecture)
             ===================================================================== */}
          <Topbar
            activeTab={activeTab}
            onOpenExport={() => setIsExportOpen(true)}
            currentUserEmail={authUser.email}
            onSwitchAccount={handleSwitchAccount}
          />

          {notice && (
            <div
              className="notice"
              role="status"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div><strong>Notifikasi Sistem:</strong> {notice}</div>
              <button
                type="button"
                onClick={() => setNotice('')}
                aria-label="Tutup notifikasi"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '16px',
                  lineHeight: 1,
                  color: 'inherit',
                }}
              >
                &times;
              </button>
            </div>
          )}

          {/* VIEW 0: EXECUTIVE DASHBOARD COCKPIT (Admin, GM, BoD) */}
          {activeTab === 'DASHBOARD' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="page-heading">
                <div>
                  <p style={{ color: '#8A8F89', fontSize: '13px', margin: '4px 0 0' }}>
                    Pemantauan alur pengadaan, percepatan otorisasi berjenjang, dan ringkasan anggaran.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="s-action s-action-caready"
                    onClick={() => setActiveTab('ALL')}
                  >
                    Buka Register Dokumen
                  </button>
                </div>
              </div>

              <BentoMetrics
                documents={documents}
                activeRole={activeRole}
                onSelectTab={(type) => setActiveTab(type)}
              />

              <div style={{ marginTop: '12px' }}>
                <ApprovalRegisterView documents={documents} onOpenDetail={setDetailDoc} />
              </div>
            </div>
          )}

          {/* VIEW 1: PENGAJUAN (Staff Beranda - Semua Role) */}
          {(activeTab === 'PENGAJUAN' || activeTab === 'BERANDA') && (
            <StaffBeranda
              userName={authUser.role === 'ADMIN' ? authUser.name : displayPersonName(authUser.name)}
              userId={authUser.id}
              userEmail={authUser.email}
              userBranch={authUser.branch}
              activeRole={activeRole}
              documents={documents}
              onCreateDoc={handleCreateDoc}
              onOpenDetail={setDetailDoc}
              onEditDoc={handleEditDoc}
              onSubmitDoc={handleSubmitDoc}
              onGeneratePv={handleOpenGeneratePv}
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
            activeTab === 'GR' ||
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
                        onClick={() => handleCreateDoc('GR')}
                      >
                        <Plus size={15} /> Catat GR
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

              <DocumentList
                documents={documents}
                activeTab={
                  activeTab === 'PR' ||
                  activeTab === 'PO' ||
                  activeTab === 'GR' ||
                  activeTab === 'AV' ||
                  activeTab === 'RB' ||
                  activeTab === 'RC' ||
                  activeTab === 'PV'
                    ? activeTab
                    : 'ALL'
                }
                activeRole={activeRole}
                activeUserId={authUser.id}
                activeUserEmail={authUser.email}
                onOpenDetail={setDetailDoc}
                onEditDoc={handleEditDoc}
                onSubmitDoc={handleSubmitDoc}
                onGeneratePv={handleOpenGeneratePv}
                onPayPv={setPayingPv}
                onCreateRelated={handleCreateRelated}
                onConfirmRc={handleConfirmRc}
                onOpenExport={() => setIsExportOpen(true)}
                onSelectTab={(tab) => setActiveTab(tab)}
              />
            </>
          )}
        </div>
      </main>

      {/* Creation / Edit Modals */}
      {activeFormType === 'PR' && editingDoc && (
        <ModalDialog
          isOpen={true}
          title="Formulir Draf PR"
          errorMessage={formError}
          onClose={() => {
            setActiveFormType(null);
            setEditingDoc(null);
          }}
        >
          <FormPR
            initialDoc={editingDoc as PRDocument}
            onSave={handleSaveDoc}
            onClose={() => {
              setActiveFormType(null);
              setEditingDoc(null);
            }}
          />
        </ModalDialog>
      )}

      {activeFormType === 'PO' && editingDoc && (
        <ModalDialog
          isOpen={true}
          title="Formulir Draf PO"
          maxWidth="min(680px, 100%)"
          errorMessage={formError}
          onClose={() => {
            setActiveFormType(null);
            setEditingDoc(null);
          }}
        >
          <FormPO
            initialDoc={editingDoc as PODocument}
            availablePrs={availablePrs}
            onSave={handleSaveDoc}
            onClose={() => {
              setActiveFormType(null);
              setEditingDoc(null);
            }}
          />
        </ModalDialog>
      )}

      {activeFormType === 'AV' && editingDoc && (
        <ModalDialog
          isOpen={true}
          title="Formulir Draf AV"
          errorMessage={formError}
          onClose={() => {
            setActiveFormType(null);
            setEditingDoc(null);
          }}
        >
          <FormAV
            initialDoc={editingDoc as AVDocument}
            availablePos={documents.filter((d): d is PODocument => d.docType === 'PO' && d.status === 'APPROVED')}
            onSave={handleSaveDoc}
            onClose={() => {
              setActiveFormType(null);
              setEditingDoc(null);
            }}
          />
        </ModalDialog>
      )}

      {activeFormType === 'RB' && editingDoc && (
        <ModalDialog
          isOpen={true}
          title="Formulir Draf RB"
          errorMessage={formError}
          onClose={() => {
            setActiveFormType(null);
            setEditingDoc(null);
          }}
        >
          <FormRB
            initialDoc={editingDoc as RBDocument}
            onSave={handleSaveDoc}
            onClose={() => {
              setActiveFormType(null);
              setEditingDoc(null);
            }}
          />
        </ModalDialog>
      )}

      {activeFormType === 'RC' && editingDoc && (
        <ModalDialog
          isOpen={true}
          title="Formulir Draf RC"
          maxWidth="min(640px, 100%)"
          errorMessage={formError}
          onClose={() => {
            setActiveFormType(null);
            setEditingDoc(null);
          }}
        >
          <FormRC
            initialDoc={editingDoc as RCDocument}
            availableAvs={availableAvs}
            onSave={handleSaveDoc}
            onClose={() => {
              setActiveFormType(null);
              setEditingDoc(null);
            }}
          />
        </ModalDialog>
      )}

      {activeFormType === 'GR' && editingDoc && (
        <ModalDialog
          isOpen={true}
          title="Formulir Laporan Penerimaan (GR)"
          maxWidth="min(640px, 100%)"
          errorMessage={formError}
          onClose={() => {
            setActiveFormType(null);
            setEditingDoc(null);
          }}
        >
          <FormGR
            initialDoc={editingDoc as GRDocument}
            availablePos={documents.filter(
              (d): d is PODocument =>
                d.docType === 'PO' && (d.status === 'APPROVED' || d.status === 'PAID')
            )}
            onSave={handleSaveDoc}
            onClose={() => {
              setActiveFormType(null);
              setEditingDoc(null);
            }}
          />
        </ModalDialog>
      )}

      {generatingPvSource && (
        <ModalDialog
          isOpen={true}
          title="Penerbitan & Pengajuan Payment Voucher (PV)"
          maxWidth="min(660px, 100%)"
          onClose={() => setGeneratingPvSource(null)}
        >
          <FormPV
            sourceDoc={generatingPvSource}
            linkedGrs={documents.filter(
              (d): d is GRDocument =>
                d.docType === 'GR' && d.parentPoId === generatingPvSource.id
            )}
            alreadyCommittedOnPo={
              generatingPvSource.docType === 'PO'
                ? documents.reduce((sum, d) => {
                    if (d.status === 'REJECTED' || d.status === 'DRAFT') return sum;
                    if (d.docType === 'PV' && d.sourceDocId === generatingPvSource.id) {
                      return sum + d.netAmountToPay;
                    }
                    if (d.docType === 'AV' && d.parentPoId === generatingPvSource.id) {
                      return sum + d.amount;
                    }
                    return sum;
                  }, 0)
                : 0
            }
            onGenerate={handleConfirmGeneratePv}
            onClose={() => setGeneratingPvSource(null)}
          />
        </ModalDialog>
      )}

      {payingPv && (
        <ModalDialog
          isOpen={true}
          title="Eksekusi Pembayaran PV"
          maxWidth="min(600px, 100%)"
          onClose={() => setPayingPv(null)}
        >
          <FormPVPayment
            pv={payingPv}
            onRecordPayment={handleRecordPvPayment}
            onClose={() => setPayingPv(null)}
          />
        </ModalDialog>
      )}

      {detailDoc && (
        <DocumentDetailModal
          document={detailDoc}
          allDocuments={documents}
          activeRole={activeRole}
          activeUserId={authUser.id}
          activeUserEmail={authUser.email}
          onClose={() => {
            setDetailDoc(null);
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

const rootEl = typeof document !== 'undefined' ? document.getElementById('root') : null;
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

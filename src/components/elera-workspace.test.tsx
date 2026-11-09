import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { BentoMetrics } from './BentoMetrics';
import { DocumentList } from './DocumentList';
import { DocumentDetailModal } from './DocumentDetailModal';
import { StaffBeranda } from './StaffBeranda';
import { createEmptyDocument } from '../store/document-store';

const noop = vi.fn();
const actions = {
  onOpenDetail: noop, onEditDoc: noop, onSubmitDoc: noop, onGeneratePv: noop,
  onPayPv: noop, onCreateRelated: noop, onConfirmRc: noop,
};

describe('Elera workspace', () => {
  it('shows a connected summary with amounts in tabular figures', () => {
    const html = renderToStaticMarkup(<BentoMetrics documents={[]} activeRole="ADMIN" />);
    expect(html).toContain('stats-strip');
    expect(html).toContain('tabular-nums');
  });

  it('offers document type filters in the register', () => {
    const html = renderToStaticMarkup(<DocumentList documents={[]} activeTab="ALL" activeRole="ADMIN" activeUserId="u1" {...actions} onSelectTab={noop} />);
    expect(html).toContain('aria-label="Jenis dokumen"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('>GR<');
  });

  it('limits the submission hub to the signed-in user’s documents', () => {
    const own = { ...createEmptyDocument('PR'), ownerId: 'u1', title: 'Dokumen saya' };
    const other = { ...createEmptyDocument('PR'), ownerId: 'u2', title: 'Dokumen orang lain' };
    const html = renderToStaticMarkup(<StaffBeranda userName="A" userId="u1" userEmail="a@example.com" userBranch="Bekasi" activeRole="PEMOHON" documents={[own, other]} {...actions} onCreateDoc={noop} onOpenExport={noop} onNavigateTab={noop} />);
    expect(html).toContain('Dokumen saya');
    expect(html).toContain('Daftar Pengajuan Saya');
    expect(html).not.toContain('Dokumen orang lain');
  });

  it('does not offer draft creation to a role rejected by the server', () => {
    const html = renderToStaticMarkup(<StaffBeranda userName="A" userId="u1" userEmail="a@example.com" userBranch="Bekasi" activeRole="ADMIN" documents={[]} {...actions} onCreateDoc={noop} onOpenExport={noop} onNavigateTab={noop} />);
    expect(html).not.toContain('Buat dokumen baru Purchase Request');
  });

  it('presents document details in a labelled side drawer', () => {
    const doc = createEmptyDocument('PR');
    const html = renderToStaticMarkup(<DocumentDetailModal document={doc} activeRole="ADMIN" onClose={noop} onApprove={noop} onReject={noop} />);
    expect(html).toContain('s-drawer');
    expect(html).toContain('aria-labelledby="document-detail-title"');
  });

  it('uses standard card radius for quick-action buttons in StaffBeranda', () => {
    const html = renderToStaticMarkup(<StaffBeranda userName="A" userId="u1" userEmail="a@example.com" userBranch="Bekasi" activeRole="PEMOHON" documents={[]} {...actions} onCreateDoc={noop} onOpenExport={noop} onNavigateTab={noop} />);
    expect(html).not.toContain('border-radius:16px');
    expect(html).toContain('border-radius:var(--card-radius, 10px)');
  });

  it('toggles collapsible sidebar with hamburger button and retains route icons', async () => {
    const { Sidebar } = await import('../main');
    const authUser = {
      id: 'u1',
      name: 'Ayu Martina',
      role: 'ADMIN' as const,
      email: 'ayu@blc.co.id',
    };
    const onToggle = vi.fn();

    // 1. Expanded state
    const expandedHtml = renderToStaticMarkup(
      <Sidebar
        sidebarCollapsed={false}
        onToggleCollapse={onToggle}
        mobileMenuOpen={false}
        setMobileMenuOpen={noop}
        authUser={authUser}
        activeTab="ALL"
        setActiveTab={noop}
        documents={[]}
        onSignOut={noop}
      />
    );
    expect(expandedHtml).toContain('class="sidebar "');
    expect(expandedHtml).not.toContain('is-collapsed');
    expect(expandedHtml).toContain('aria-label="Lipat sidebar"');
    expect(expandedHtml).toContain('aria-expanded="true"');
    expect(expandedHtml).toContain('BLC Caready');
    expect(expandedHtml).toContain('PROCUREMENT PRO');
    expect(expandedHtml).toContain('title="Dashboard"');
    expect(expandedHtml).toContain('title="Pengajuan"');
    expect(expandedHtml).toContain('title="Dokumen"');
    expect(expandedHtml).toContain('title="Approval Register"');

    // 2. Collapsed state
    const collapsedHtml = renderToStaticMarkup(
      <Sidebar
        sidebarCollapsed={true}
        onToggleCollapse={onToggle}
        mobileMenuOpen={false}
        setMobileMenuOpen={noop}
        authUser={authUser}
        activeTab="ALL"
        setActiveTab={noop}
        documents={[]}
        onSignOut={noop}
      />
    );
    expect(collapsedHtml).toContain('sidebar is-collapsed');
    expect(collapsedHtml).toContain('aria-label="Buka sidebar"');
    expect(collapsedHtml).toContain('aria-expanded="false"');
    // Verify brand logo and route icon anchors retained with title tooltips
    expect(collapsedHtml).toContain('alt="BLC Logo"');
    expect(collapsedHtml).toContain('title="Dashboard"');
    expect(collapsedHtml).toContain('title="Pengajuan"');
    expect(collapsedHtml).toContain('title="Dokumen"');
    expect(collapsedHtml).toContain('title="Approval Register"');
    expect(collapsedHtml).toContain('title="Approval History"');
    expect(collapsedHtml).toContain('title="Approval Docs"');
    // Verify compact avatar and logout title
    expect(collapsedHtml).toContain('sidebar-user-avatar');
    expect(collapsedHtml).toContain('AM');
    expect(collapsedHtml).toContain('title="Keluar"');

    // 3. Verify clicking hamburger invokes onToggleCollapse
    const tree = Sidebar({
      sidebarCollapsed: false,
      onToggleCollapse: onToggle,
      mobileMenuOpen: false,
      setMobileMenuOpen: noop,
      authUser,
      activeTab: 'ALL',
      setActiveTab: noop,
      documents: [],
      onSignOut: noop,
    });
    const brandDiv = tree.props.children.find(
      (c: any) => c && c.props && c.props.className === 'brand'
    );
    const toggleBtn = brandDiv?.props.children.find(
      (c: any) => c && c.props && c.props.className === 'sidebar-collapse-toggle'
    );
    expect(toggleBtn).toBeDefined();
    toggleBtn.props.onClick();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

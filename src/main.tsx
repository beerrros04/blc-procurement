import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DocumentDetailModal } from './components/DocumentDetailModal';
import { DocumentList } from './components/DocumentList';
import { FormAV } from './components/forms/FormAV';
import { FormPO } from './components/forms/FormPO';
import { FormPR } from './components/forms/FormPR';
import { FormPVPayment } from './components/forms/FormPVPayment';
import { FormRB } from './components/forms/FormRB';
import { FormRC } from './components/forms/FormRC';
import { RoleSwitcher } from './components/RoleSwitcher';
import { ensureSeedDataLoaded } from './store/seed-data';
import {
  approveDocumentStage,
  createEmptyDocument,
  generatePvFromSource,
  loadAllDocuments,
  recordPvPayment,
  rejectDocument,
  saveDocument,
  submitDocument,
} from './store/document-store';
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

const NAV_ITEMS: Array<{ id: DocType | 'ALL'; label: string; icon: string }> = [
  { id: 'ALL', label: 'Ringkasan & Semua Dokumen', icon: '▤' },
  { id: 'PR', label: 'Permintaan Pembelian (PR)', icon: '📝' },
  { id: 'PO', label: 'Pesanan Pembelian (PO)', icon: '📦' },
  { id: 'AV', label: 'Uang Muka (AV)', icon: '💵' },
  { id: 'RB', label: 'Penggantian Biaya (RB)', icon: '🧾' },
  { id: 'RC', label: 'Realisasi Uang Muka (RC)', icon: '⚖️' },
  { id: 'PV', label: 'Voucher Pembayaran (PV)', icon: '💳' },
];

function App() {
  const [documents, setDocuments] = useState<AnyDocument[]>(() => {
    ensureSeedDataLoaded(localStorage);
    return loadAllDocuments(localStorage);
  });
  const [activeTab, setActiveTab] = useState<DocType | 'ALL'>('ALL');
  const [activeRole, setActiveRole] = useState<UserRole>('PEMOHON');
  const [notice, setNotice] = useState<string>('');

  // Modals state
  const [activeFormType, setActiveFormType] = useState<DocType | null>(null);
  const [editingDoc, setEditingDoc] = useState<AnyDocument | null>(null);
  const [detailDoc, setDetailDoc] = useState<AnyDocument | null>(null);
  const [payingPv, setPayingPv] = useState<PVDocument | null>(null);

  // Sync documents state when updated
  function refreshDocs() {
    setDocuments(loadAllDocuments(localStorage));
  }

  useEffect(() => {
    refreshDocs();
  }, []);

  function handleCreateDoc(type: DocType) {
    const emptyDoc = createEmptyDocument(type, 'Pusat');
    setEditingDoc(emptyDoc);
    setActiveFormType(type);
  }

  function handleEditDoc(doc: AnyDocument) {
    setEditingDoc(doc);
    setActiveFormType(doc.docType);
  }

  function handleSaveDoc(doc: AnyDocument) {
    saveDocument(localStorage, doc);
    refreshDocs();
    setActiveFormType(null);
    setEditingDoc(null);
    setNotice(`Draf dokumen ${doc.docNumber} berhasil disimpan.`);
  }

  function handleSubmitDoc(docId: string) {
    submitDocument(localStorage, docId, `${activeRole} (User Aktif)`);
    refreshDocs();
    setNotice(`Dokumen berhasil diajukan ke Tahap 1 (Atasan Langsung).`);
  }

  function handleApproveDoc(
    docId: string,
    role: 'ATASAN' | 'AYU' | 'BOD_HERY' | 'BOD_HASHIMOTO',
    comment?: string
  ) {
    approveDocumentStage(localStorage, docId, role, `${role} (Simulator)`, comment);
    refreshDocs();
    setNotice(`Persetujuan berhasil dicatat oleh ${role}.`);
  }

  function handleRejectDoc(
    docId: string,
    role: 'ATASAN' | 'AYU' | 'BOD_HERY' | 'BOD_HASHIMOTO',
    comment: string
  ) {
    rejectDocument(localStorage, docId, role, `${role} (Simulator)`, comment);
    refreshDocs();
    setNotice(`Dokumen ditolak dan dikembalikan ke Draf untuk revisi pemohon.`);
  }

  function handleGeneratePv(sourceDocId: string) {
    const pv = generatePvFromSource(localStorage, sourceDocId, 'Keuangan (Simulator)');
    refreshDocs();
    setNotice(`Payment Voucher ${pv.docNumber} berhasil dibuat dan masuk antrean pembayaran.`);
    setActiveTab('PV');
  }

  function handleRecordPvPayment(pvId: string, details: PVPaymentDetails) {
    recordPvPayment(localStorage, pvId, details);
    refreshDocs();
    setPayingPv(null);
    setNotice(`Pembayaran berhasil dicatat. Status PV & dokumen induk kini LUNAS (Paid).`);
  }

  // Pre-filtered lists for inheritance
  const availablePrs = documents.filter(
    (d): d is PRDocument => d.docType === 'PR' && d.status === 'APPROVED'
  );
  const availableAvs = documents.filter(
    (d): d is AVDocument => d.docType === 'AV' && d.status === 'PAID'
  );

  // Metrics
  const myDraftsCount = documents.filter((d) => d.status === 'DRAFT').length;
  const inReviewCount = documents.filter(
    (d) => d.status === 'SUBMITTED' || d.status === 'IN_REVIEW'
  ).length;
  const approvedQueueCount = documents.filter(
    (d) => d.status === 'APPROVED' && d.docType !== 'PV'
  ).length;
  const paidCount = documents.filter((d) => d.status === 'PAID').length;

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">B</span>
          <div>
            <strong>BLC</strong>
            <small>PROCUREMENT</small>
          </div>
        </div>

        <div className="nav-label">RUANG KERJA SIKLUS PENGADAAN</div>
        <nav aria-label="Navigasi jenis dokumen">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={activeTab === item.id ? 'nav-active' : ''}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(item.id);
              }}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="sidebar-note">
          <span className="dot" />
          Prototipe Front-End Interaktif
          <span>Fase 1 IPD — Multi-Peran & Multi-Tahap</span>
        </div>
      </aside>

      {/* Main Container */}
      <main className="main" id="workspace-main">
        <header className="topbar">
          <span>
            BLC Procurement <span className="slash">/</span> Ruang Kerja{' '}
            <span className="slash">/</span>{' '}
            <strong>{NAV_ITEMS.find((n) => n.id === activeTab)?.label}</strong>
          </span>
          <span className="top-tag">LOCAL EVALUATION PROTOTYPE</span>
        </header>

        <div className="content">
          {/* Role Simulator Bar */}
          <RoleSwitcher activeRole={activeRole} onRoleChange={setActiveRole} />

          {/* Quick Notice */}
          {notice && (
            <div className="notice" role="status" style={{ marginBottom: '20px' }}>
              <strong>Notifikasi Sistem:</strong> {notice}
            </div>
          )}

          {/* Page Heading & Creation Actions */}
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                BLC PROCUREMENT <span> / </span> DOCUMENT LIFECYCLE
              </div>
              <h1>Ruang Kerja Transaksi Pengadaan</h1>
              <p>
                Kelola seluruh siklus hidup dokumen: pengajuan, persetujuan berjenjang, penerbitan
                voucher, dan pembayaran.
              </p>
            </div>

            {activeRole === 'PEMOHON' && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="primary"
                  onClick={() => handleCreateDoc('PR')}
                >
                  <span aria-hidden="true">＋</span> Buat PR
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => handleCreateDoc('PO')}
                >
                  <span aria-hidden="true">＋</span> Buat PO
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => handleCreateDoc('AV')}
                >
                  <span aria-hidden="true">＋</span> Buat AV
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => handleCreateDoc('RB')}
                >
                  <span aria-hidden="true">＋</span> Buat RB
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => handleCreateDoc('RC')}
                >
                  <span aria-hidden="true">＋</span> Buat RC
                </button>
              </div>
            )}
          </div>

          {/* Summary Metric Cards */}
          <section className="summary" aria-label="Ringkasan Aktivitas">
            <div>
              <span className="summary-label">DRAF AKTIF</span>
              <strong>{myDraftsCount.toString().padStart(2, '0')}</strong>
              <span className="summary-caption">Dokumen draf</span>
            </div>
            <div className="summary-rule" />
            <div>
              <span className="summary-label">SEDANG DITINJAU</span>
              <strong>{inReviewCount.toString().padStart(2, '0')}</strong>
              <span className="summary-caption">Persetujuan berjenjang</span>
            </div>
            <div className="summary-rule" />
            <div>
              <span className="summary-label">ANTREAN PV (APPROVED)</span>
              <strong>{approvedQueueCount.toString().padStart(2, '0')}</strong>
              <span className="summary-caption">Siap dibuat voucher</span>
            </div>
            <div className="summary-rule" />
            <div>
              <span className="summary-label">LUNAS / SELESAI</span>
              <strong>{paidCount.toString().padStart(2, '0')}</strong>
              <span className="summary-caption">Tuntas dibayar</span>
            </div>
          </section>

          {/* Main Document List */}
          <DocumentList
            documents={documents}
            activeTab={activeTab}
            activeRole={activeRole}
            onOpenDetail={setDetailDoc}
            onEditDoc={handleEditDoc}
            onSubmitDoc={handleSubmitDoc}
            onGeneratePv={handleGeneratePv}
            onPayPv={setPayingPv}
          />
        </div>
      </main>

      {/* Creation / Edit Modals */}
      {activeFormType === 'PR' && editingDoc && (
        <dialog className="modal" open>
          <section className="drawer">
            <div className="drawer-head">
              <div>
                <div className="eyebrow">PURCHASE REQUEST</div>
                <h2>Formulir Draf PR</h2>
              </div>
              <button
                className="close"
                type="button"
                onClick={() => {
                  setActiveFormType(null);
                  setEditingDoc(null);
                }}
              >
                ×
              </button>
            </div>
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
        <dialog className="modal" open>
          <section className="drawer" style={{ width: 'min(680px, 100%)' }}>
            <div className="drawer-head">
              <div>
                <div className="eyebrow">PURCHASE ORDER</div>
                <h2>Formulir Draf PO</h2>
              </div>
              <button
                className="close"
                type="button"
                onClick={() => {
                  setActiveFormType(null);
                  setEditingDoc(null);
                }}
              >
                ×
              </button>
            </div>
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
        <dialog className="modal" open>
          <section className="drawer">
            <div className="drawer-head">
              <div>
                <div className="eyebrow">CASH ADVANCE</div>
                <h2>Formulir Draf AV</h2>
              </div>
              <button
                className="close"
                type="button"
                onClick={() => {
                  setActiveFormType(null);
                  setEditingDoc(null);
                }}
              >
                ×
              </button>
            </div>
            <FormAV
              initialDoc={editingDoc as AVDocument}
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
        <dialog className="modal" open>
          <section className="drawer">
            <div className="drawer-head">
              <div>
                <div className="eyebrow">REIMBURSEMENT</div>
                <h2>Formulir Draf RB</h2>
              </div>
              <button
                className="close"
                type="button"
                onClick={() => {
                  setActiveFormType(null);
                  setEditingDoc(null);
                }}
              >
                ×
              </button>
            </div>
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
        <dialog className="modal" open>
          <section className="drawer" style={{ width: 'min(640px, 100%)' }}>
            <div className="drawer-head">
              <div>
                <div className="eyebrow">REALIZATION CASH ADVANCE</div>
                <h2>Formulir Draf RC</h2>
              </div>
              <button
                className="close"
                type="button"
                onClick={() => {
                  setActiveFormType(null);
                  setEditingDoc(null);
                }}
              >
                ×
              </button>
            </div>
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

      {/* PV Payment Modal for Finance */}
      {payingPv && (
        <dialog className="modal" open>
          <section className="drawer" style={{ width: 'min(600px, 100%)' }}>
            <div className="drawer-head">
              <div>
                <div className="eyebrow">FINANCE DISBURSEMENT</div>
                <h2>Eksekusi Pembayaran PV</h2>
              </div>
              <button
                className="close"
                type="button"
                onClick={() => setPayingPv(null)}
              >
                ×
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

      {/* Detail & Multi-Stage Approval Modal */}
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
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

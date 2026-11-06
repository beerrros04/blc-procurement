import React, { useMemo, useState } from 'react';
import type { AnyDocument, DocType, PVDocument, UserRole } from '../types/document';

export interface DocumentListProps {
  documents: AnyDocument[];
  activeTab: DocType | 'ALL';
  activeRole: UserRole;
  onOpenDetail: (doc: AnyDocument) => void;
  onEditDoc: (doc: AnyDocument) => void;
  onSubmitDoc: (docId: string) => void;
  onGeneratePv: (docId: string) => void;
  onPayPv: (pv: PVDocument) => void;
}

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

function getDocAmount(doc: AnyDocument): number {
  switch (doc.docType) {
    case 'PR':
      return doc.subtotalAmount;
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
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'APPROVED':
      return { label: 'Disetujui', className: 'status-approved' };
    case 'PAID':
      return { label: 'Lunas / Dibayar', className: 'status-approved' };
    case 'REJECTED':
      return { label: 'Ditolak (Perlu Revisi)', className: 'status-rejected' };
    case 'SUBMITTED':
      return { label: 'Diajukan', className: 'status-pending' };
    case 'IN_REVIEW':
      return { label: 'Sedang Ditinjau', className: 'status-pending' };
    case 'DRAFT':
    default:
      return { label: 'Draf', className: 'status-waiting' };
  }
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  activeTab,
  activeRole,
  onOpenDetail,
  onEditDoc,
  onSubmitDoc,
  onGeneratePv,
  onPayPv,
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = documents;
    if (activeTab !== 'ALL') {
      list = list.filter((d) => d.docType === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.docNumber.toLowerCase().includes(q) ||
          d.branch.toLowerCase().includes(q)
      );
    }
    return list;
  }, [documents, activeTab, search]);

  return (
    <section className="list-card" aria-label="Daftar Dokumen Transaksi">
      <div className="section-head">
        <div>
          <h2>
            {activeTab === 'ALL'
              ? 'Seluruh Dokumen Transaksi'
              : `Daftar Dokumen ${activeTab}`}
          </h2>
          <p>
            {filtered.length} transaksi tercatat di penyimpanan lokal perangkat ini.
          </p>
        </div>
        <div style={{ maxWidth: '300px' }}>
          <input
            type="search"
            placeholder="Cari nomor, judul, cabang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon" aria-hidden="true">
            ▤
          </div>
          <h3>Belum ada dokumen yang sesuai</h3>
          <p>
            {search
              ? 'Tidak ditemukan dokumen dengan kata kunci tersebut.'
              : 'Gunakan tombol pembuatan dokumen di atas untuk membuat transaksi baru.'}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">DOKUMEN</th>
                <th scope="col">TIPE</th>
                <th scope="col">CABANG</th>
                <th scope="col">NOMINAL</th>
                <th scope="col">STATUS</th>
                <th scope="col">TAHAP PERSETUJUAN</th>
                <th scope="col">TINDAKAN</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => {
                const badge = getStatusBadge(doc.status);
                const amount = getDocAmount(doc);

                // Role permission checks for quick actions
                const canSubmit = activeRole === 'PEMOHON' && doc.status === 'DRAFT';
                const canEdit = activeRole === 'PEMOHON' && doc.status === 'DRAFT';

                const isApproverRole =
                  activeRole === 'ATASAN' ||
                  activeRole === 'AYU' ||
                  activeRole === 'BOD_HERY' ||
                  activeRole === 'BOD_HASHIMOTO';
                const isReviewable =
                  isApproverRole && (doc.status === 'SUBMITTED' || doc.status === 'IN_REVIEW');

                const canGeneratePv =
                  activeRole === 'KEUANGAN' &&
                  doc.status === 'APPROVED' &&
                  doc.docType !== 'PV' &&
                  (doc.docType !== 'RC' || doc.outcomeType === 'DEFICIT');

                const canPayPv =
                  activeRole === 'KEUANGAN' &&
                  doc.docType === 'PV' &&
                  (doc as PVDocument).paymentStatus === 'UNPAID';

                return (
                  <tr key={doc.id}>
                    <td>
                      <strong>{doc.docNumber}</strong>
                      <small>{doc.title}</small>
                    </td>
                    <td>
                      <span className="count">{doc.docType}</span>
                    </td>
                    <td>{doc.branch}</td>
                    <td>
                      <strong>{rupiah.format(amount)}</strong>
                    </td>
                    <td>
                      <span className={`badge ${badge.className}`}>{badge.label}</span>
                    </td>
                    <td>
                      {doc.docType === 'PV' ? (
                        <small>PV: {(doc as PVDocument).paymentStatus}</small>
                      ) : (
                        <small>
                          {doc.status === 'APPROVED'
                            ? 'Selesai (BOD Approved)'
                            : doc.status === 'DRAFT'
                            ? 'Menunggu Submit'
                            : `Tahap: ${doc.currentStage}`}
                        </small>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => onOpenDetail(doc)}
                        >
                          Detail
                        </button>

                        {canEdit && (
                          <button
                            type="button"
                            className="secondary"
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                            onClick={() => onEditDoc(doc)}
                          >
                            Ubah
                          </button>
                        )}

                        {canSubmit && (
                          <button
                            type="button"
                            className="primary"
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                            onClick={() => onSubmitDoc(doc.id)}
                          >
                            Ajukan ↗
                          </button>
                        )}

                        {isReviewable && (
                          <button
                            type="button"
                            className="primary"
                            style={{ padding: '6px 10px', fontSize: '11px', background: '#8d6e19' }}
                            onClick={() => onOpenDetail(doc)}
                          >
                            Tinjau Persetujuan ⚡
                          </button>
                        )}

                        {canGeneratePv && (
                          <button
                            type="button"
                            className="primary"
                            style={{ padding: '6px 10px', fontSize: '11px', background: '#135200' }}
                            onClick={() => onGeneratePv(doc.id)}
                          >
                            Buat PV ＋
                          </button>
                        )}

                        {canPayPv && (
                          <button
                            type="button"
                            className="primary"
                            style={{ padding: '6px 10px', fontSize: '11px', background: '#1e6a38' }}
                            onClick={() => onPayPv(doc as PVDocument)}
                          >
                            Bayar 💰
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

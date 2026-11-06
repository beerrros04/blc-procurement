import React, { useMemo, useState } from 'react';
import { calculateRcOutcome } from '../../domain/calculations';
import type { AVDocument, RCDocument } from '../../types/document';

export interface FormRCProps {
  initialDoc: RCDocument;
  availableAvs: AVDocument[];
  onSave: (doc: RCDocument) => void;
  onClose: () => void;
}

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export const FormRC: React.FC<FormRCProps> = ({
  initialDoc,
  availableAvs,
  onSave,
  onClose,
}) => {
  const [doc, setDoc] = useState<RCDocument>(initialDoc);
  const [realizedStr, setRealizedStr] = useState<string>(
    String(initialDoc.realizedAmount || '')
  );
  const [error, setError] = useState<string>('');

  const outcome = useMemo(() => {
    return calculateRcOutcome({
      avOriginalAmount: doc.avOriginalAmount,
      realizedAmount: Number(realizedStr) || 0,
    });
  }, [doc.avOriginalAmount, realizedStr]);

  function handleAvSelect(avId: string) {
    const selectedAv = availableAvs.find((a) => a.id === avId);
    if (selectedAv) {
      setDoc((prev) => ({
        ...prev,
        parentAvId: avId,
        title: `Realisasi AV: ${selectedAv.docNumber} - ${selectedAv.title}`,
        branch: selectedAv.branch,
        avOriginalAmount: selectedAv.amount,
      }));
    } else {
      setDoc((prev) => ({
        ...prev,
        parentAvId: '',
        avOriginalAmount: 0,
      }));
    }
  }

  function handleDateChange(date: string) {
    // Tambah 2 hari kerja sebagai batas penyerahan realisasi (H+2)
    const baseDate = new Date(date);
    baseDate.setDate(baseDate.getDate() + 2);
    const deadline = baseDate.toISOString().slice(0, 10);

    setDoc((prev) => ({
      ...prev,
      activityCompletedDate: date,
      submissionDeadline: deadline,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!doc.parentAvId) {
      setError('Pilih dokumen Uang Muka (AV) berstatus Paid yang akan direalisasikan.');
      return;
    }
    if (!doc.activityCompletedDate) {
      setError('Tanggal selesai kegiatan operasional wajib diisi.');
      return;
    }
    if (outcome.realizedAmount <= 0) {
      setError('Total realisasi penggunaan dana harus lebih dari Rp 0.');
      return;
    }

    // Skenario SURPLUS: wajib lampirkan bukti transfer setor balik sisa dana
    if (outcome.outcomeType === 'SURPLUS') {
      if (!doc.refundProofUrl?.trim()) {
        setError('Karena terdapat sisa dana uang muka (Surplus), bukti setor pengembalian sisa dana ke rekening perusahaan wajib dilampirkan.');
        return;
      }
    }

    // Skenario DEFICIT: wajib data rekening untuk penggantian dana
    if (outcome.outcomeType === 'DEFICIT') {
      const bank = doc.reimbursementBank;
      if (!bank?.bankName?.trim() || !bank?.accountNumber?.trim() || !bank?.accountHolder?.trim()) {
        setError('Karena realisasi melebihi uang muka (Defisit), rekening karyawan untuk penggantian selisih wajib diisi lengkap.');
        return;
      }
    }

    onSave({
      ...doc,
      realizedAmount: outcome.realizedAmount,
      balanceAmount: outcome.balanceAmount,
      outcomeType: outcome.outcomeType,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-body">
        <div className="form-intro">
          <span>RC</span>
          <div>
            <strong>Informasi Realisasi Uang Muka (Realization Cash Advance)</strong>
            <p>Pertanggungjawaban penggunaan dana uang muka operasional yang telah dicairkan.</p>
          </div>
        </div>

        {error && <div className="notice error-notice" role="alert">{error}</div>}

        <label htmlFor="rc-av-select">Pilih Dokumen Uang Muka (AV) Terbayar <span>*</span></label>
        <select
          id="rc-av-select"
          value={doc.parentAvId}
          onChange={(e) => handleAvSelect(e.target.value)}
        >
          <option value="">-- Pilih AV Yang Sudah Dibayar (Status Paid) --</option>
          {availableAvs.map((av) => (
            <option key={av.id} value={av.id}>
              {av.docNumber} - {av.title} (Nilai: {rupiah.format(av.amount)})
            </option>
          ))}
        </select>

        {doc.parentAvId && (
          <div className="form-grid-2" style={{ marginTop: '14px' }}>
            <div>
              <label>Nominal Uang Muka Diterima (AV)</label>
              <input value={rupiah.format(doc.avOriginalAmount)} disabled readOnly />
            </div>
            <div>
              <label htmlFor="rc-realized">Realisasi Pengeluaran Aktual <span>*</span></label>
              <div className="money">
                <span>Rp</span>
                <input
                  id="rc-realized"
                  inputMode="numeric"
                  value={realizedStr}
                  onChange={(e) => setRealizedStr(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Outcome Box */}
        {doc.parentAvId && (
          <div className="form-summary-box">
            <div className="form-summary-row">
              <span>Uang Muka Diterima:</span>
              <strong>{rupiah.format(doc.avOriginalAmount)}</strong>
            </div>
            <div className="form-summary-row">
              <span>Realisasi Pengeluaran:</span>
              <span>{rupiah.format(outcome.realizedAmount)}</span>
            </div>
            <div className="form-summary-total">
              <span>SELISIH SALDO:</span>
              <span>{rupiah.format(outcome.balanceAmount)}</span>
            </div>

            <div style={{ marginTop: '12px' }}>
              {outcome.outcomeType === 'SURPLUS' && (
                <div className="form-callout form-callout-warning">
                  <strong>Hasil: SURPLUS (Sisa Dana Rp {rupiah.format(outcome.balanceAmount)})</strong>
                  <p>
                    Realisasi lebih kecil dari uang muka yang diterima. Sisa dana wajib disetor
                    kembali ke kas / rekening operasional perusahaan.
                  </p>
                </div>
              )}
              {outcome.outcomeType === 'DEFICIT' && (
                <div className="form-callout form-callout-info">
                  <strong>Hasil: DEFICIT (Kekurangan Dana Rp {rupiah.format(Math.abs(outcome.balanceAmount))})</strong>
                  <p>
                    Pengeluaran melebihi uang muka. Perusahaan akan menerbitkan Payment Voucher
                    (PV) untuk mengganti kekurangan ke rekening karyawan.
                  </p>
                </div>
              )}
              {outcome.outcomeType === 'EXACT' && (
                <div className="form-callout form-callout-success">
                  <strong>Hasil: EXACT (Nihil / Sesuai Pas)</strong>
                  <p>Total pengeluaran tepat sama dengan uang muka yang dicairkan. Administrasi selesai.</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="form-grid-2">
          <div>
            <label htmlFor="rc-complete-date">Tanggal Selesai Kegiatan <span>*</span></label>
            <input
              id="rc-complete-date"
              type="date"
              value={doc.activityCompletedDate}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="rc-deadline">Batas Waktu Pengajuan (H+2 Hari Kerja)</label>
            <input id="rc-deadline" value={doc.submissionDeadline} disabled readOnly />
          </div>
        </div>

        {/* Kondisi SURPLUS: Input bukti setor balik */}
        {outcome.outcomeType === 'SURPLUS' && (
          <div>
            <label htmlFor="rc-refund-proof">
              Tautan / Nomor Referensi Bukti Setor Pengembalian Sisa Dana <span>*</span>
            </label>
            <input
              id="rc-refund-proof"
              value={doc.refundProofUrl || ''}
              onChange={(e) => setDoc({ ...doc, refundProofUrl: e.target.value })}
              placeholder="Contoh: Bukti Transfer Kas Masuk #TRF-RETURN-0921"
            />
          </div>
        )}

        {/* Kondisi DEFICIT: Rekening penggantian */}
        {outcome.outcomeType === 'DEFICIT' && (
          <div className="form-summary-box">
            <strong>Rekening Karyawan (Penerimaan Penggantian Kekurangan Dana)</strong>
            <div className="form-grid-3" style={{ marginTop: '10px' }}>
              <div>
                <label htmlFor="rc-bank-name">Nama Bank <span>*</span></label>
                <input
                  id="rc-bank-name"
                  value={doc.reimbursementBank?.bankName || ''}
                  onChange={(e) =>
                    setDoc({
                      ...doc,
                      reimbursementBank: {
                        ...(doc.reimbursementBank || { accountNumber: '', accountHolder: '' }),
                        bankName: e.target.value,
                      },
                    })
                  }
                  placeholder="BCA"
                />
              </div>
              <div>
                <label htmlFor="rc-bank-acc">Nomor Rekening <span>*</span></label>
                <input
                  id="rc-bank-acc"
                  value={doc.reimbursementBank?.accountNumber || ''}
                  onChange={(e) =>
                    setDoc({
                      ...doc,
                      reimbursementBank: {
                        ...(doc.reimbursementBank || { bankName: '', accountHolder: '' }),
                        accountNumber: e.target.value,
                      },
                    })
                  }
                  placeholder="08219201"
                />
              </div>
              <div>
                <label htmlFor="rc-bank-holder">Nama Pemilik <span>*</span></label>
                <input
                  id="rc-bank-holder"
                  value={doc.reimbursementBank?.accountHolder || ''}
                  onChange={(e) =>
                    setDoc({
                      ...doc,
                      reimbursementBank: {
                        ...(doc.reimbursementBank || { bankName: '', accountNumber: '' }),
                        accountHolder: e.target.value,
                      },
                    })
                  }
                  placeholder="Nama Karyawan"
                />
              </div>
            </div>
          </div>
        )}

        <label htmlFor="rc-purpose">Ringkasan Laporan Realisasi</label>
        <textarea
          id="rc-purpose"
          rows={3}
          value={doc.purpose}
          onChange={(e) => setDoc({ ...doc, purpose: e.target.value })}
          placeholder="Ringkasan hasil kegiatan dan pemanfaatan anggaran..."
        />
      </div>

      <div className="form-actions">
        <button type="button" className="secondary" onClick={onClose}>
          Batal
        </button>
        <button type="submit" className="primary">
          Simpan Draf RC <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
};

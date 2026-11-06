import React, { useState } from 'react';
import type { AVDocument } from '../../types/document';

export interface FormAVProps {
  initialDoc: AVDocument;
  onSave: (doc: AVDocument) => void;
  onClose: () => void;
}

export const FormAV: React.FC<FormAVProps> = ({ initialDoc, onSave, onClose }) => {
  const [doc, setDoc] = useState<AVDocument>(initialDoc);
  const [amountStr, setAmountStr] = useState<string>(String(initialDoc.amount || ''));
  const [error, setError] = useState<string>('');

  const amount = Number(amountStr) || 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!doc.title.trim()) {
      setError('Judul pengajuan uang muka (AV) wajib diisi.');
      return;
    }
    if (!doc.activityDate) {
      setError('Tanggal kegiatan operasional wajib diisi.');
      return;
    }
    if (!doc.paymentDueDate) {
      setError('Batas waktu kebutuhan pencairan dana wajib diisi.');
      return;
    }
    if (amount <= 0) {
      setError('Nominal uang muka harus lebih besar dari Rp 0.');
      return;
    }
    if (doc.disbursementMethod === 'TRANSFER') {
      const bank = doc.bankDetails;
      if (!bank?.bankName?.trim() || !bank?.accountNumber?.trim() || !bank?.accountHolder?.trim()) {
        setError('Untuk pencairan via transfer, data bank, nomor rekening, dan nama penerima wajib diisi.');
        return;
      }
    }

    onSave({
      ...doc,
      amount,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-body">
        <div className="form-intro">
          <span>AV</span>
          <div>
            <strong>Informasi Uang Muka (Cash Advance)</strong>
            <p>Formulir permohonan uang muka kegiatan operasional atau perjalanan dinas.</p>
          </div>
        </div>

        {error && <div className="notice error-notice" role="alert">{error}</div>}

        <label htmlFor="av-title">Judul Pengajuan Uang Muka <span>*</span></label>
        <input
          id="av-title"
          value={doc.title}
          onChange={(e) => setDoc({ ...doc, title: e.target.value })}
          placeholder="Contoh: Uang Muka Perjalanan Dinas Audit Cabang Semarang"
        />

        <div className="form-grid-2">
          <div>
            <label htmlFor="av-branch">Cabang <span>*</span></label>
            <input
              id="av-branch"
              value={doc.branch}
              onChange={(e) => setDoc({ ...doc, branch: e.target.value })}
              placeholder="Contoh: Semarang"
            />
          </div>
          <div>
            <label htmlFor="av-disbursement">Metode Pencairan <span>*</span></label>
            <select
              id="av-disbursement"
              value={doc.disbursementMethod}
              onChange={(e) =>
                setDoc({
                  ...doc,
                  disbursementMethod: e.target.value as 'TRANSFER' | 'CASH',
                })
              }
            >
              <option value="TRANSFER">Transfer ke Rekening Karyawan</option>
              <option value="CASH">Tunai dari Kasir Cabang/Pusat</option>
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div>
            <label htmlFor="av-activity-date">Tanggal Rencana Kegiatan <span>*</span></label>
            <input
              id="av-activity-date"
              type="date"
              value={doc.activityDate}
              onChange={(e) => setDoc({ ...doc, activityDate: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="av-due-date">Tanggal Dana Dibutuhkan <span>*</span></label>
            <input
              id="av-due-date"
              type="date"
              value={doc.paymentDueDate}
              onChange={(e) => setDoc({ ...doc, paymentDueDate: e.target.value })}
            />
          </div>
        </div>

        <label htmlFor="av-amount">Nominal Uang Muka Yang Diminta <span>*</span></label>
        <div className="money">
          <span>Rp</span>
          <input
            id="av-amount"
            inputMode="numeric"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="0"
          />
        </div>

        <label htmlFor="av-purpose">Rincian Tujuan & Keperluan Penggunaan Dana</label>
        <textarea
          id="av-purpose"
          rows={3}
          value={doc.purpose}
          onChange={(e) => setDoc({ ...doc, purpose: e.target.value })}
          placeholder="Sebutkan perkiraan rincian tiket, penginapan, uang saku, atau biaya lokal..."
        />

        {doc.disbursementMethod === 'TRANSFER' && (
          <div className="form-summary-box">
            <strong>Rekening Penerima Uang Muka</strong>
            <div className="form-grid-3" style={{ marginTop: '10px' }}>
              <div>
                <label htmlFor="av-bank-name">Nama Bank <span>*</span></label>
                <input
                  id="av-bank-name"
                  value={doc.bankDetails?.bankName || ''}
                  onChange={(e) =>
                    setDoc({
                      ...doc,
                      bankDetails: {
                        ...(doc.bankDetails || { accountNumber: '', accountHolder: '' }),
                        bankName: e.target.value,
                      },
                    })
                  }
                  placeholder="BCA / Mandiri"
                />
              </div>
              <div>
                <label htmlFor="av-bank-acc">Nomor Rekening <span>*</span></label>
                <input
                  id="av-bank-acc"
                  value={doc.bankDetails?.accountNumber || ''}
                  onChange={(e) =>
                    setDoc({
                      ...doc,
                      bankDetails: {
                        ...(doc.bankDetails || { bankName: '', accountHolder: '' }),
                        accountNumber: e.target.value,
                      },
                    })
                  }
                  placeholder="50201928"
                />
              </div>
              <div>
                <label htmlFor="av-bank-holder">Nama Pemilik <span>*</span></label>
                <input
                  id="av-bank-holder"
                  value={doc.bankDetails?.accountHolder || ''}
                  onChange={(e) =>
                    setDoc({
                      ...doc,
                      bankDetails: {
                        ...(doc.bankDetails || { bankName: '', accountNumber: '' }),
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
      </div>

      <div className="form-actions">
        <button type="button" className="secondary" onClick={onClose}>
          Batal
        </button>
        <button type="submit" className="primary">
          Simpan Draf AV <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
};

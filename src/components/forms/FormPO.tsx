import React, { useMemo, useState } from 'react';
import { calculatePoTotal } from '../../domain/calculations';
import type { PODocument, PRDocument } from '../../types/document';

export interface FormPOProps {
  initialDoc: PODocument;
  availablePrs: PRDocument[];
  onSave: (doc: PODocument) => void;
  onClose: () => void;
}

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export const FormPO: React.FC<FormPOProps> = ({
  initialDoc,
  availablePrs,
  onSave,
  onClose,
}) => {
  const [doc, setDoc] = useState<PODocument>(initialDoc);
  const [subtotalStr, setSubtotalStr] = useState<string>(String(initialDoc.subtotal || ''));
  const [otherCostsStr, setOtherCostsStr] = useState<string>(String(initialDoc.otherCosts || '0'));
  const [discountStr, setDiscountStr] = useState<string>(String(initialDoc.discount || '0'));
  const [ppnRate, setPpnRate] = useState<number>(initialDoc.ppnRate ?? 0.11);
  const [pphRate, setPphRate] = useState<number>(initialDoc.pphRate ?? 0);
  const [error, setError] = useState<string>('');

  const calc = useMemo(() => {
    return calculatePoTotal({
      subtotal: Number(subtotalStr) || 0,
      otherCosts: Number(otherCostsStr) || 0,
      discount: Number(discountStr) || 0,
      ppnRate,
      pphRate,
    });
  }, [subtotalStr, otherCostsStr, discountStr, ppnRate, pphRate]);

  function handlePrSelect(prId: string) {
    const selectedPr = availablePrs.find((p) => p.id === prId);
    if (selectedPr) {
      setDoc((prev) => ({
        ...prev,
        parentPrId: prId,
        title: prev.title || `PO: ${selectedPr.title}`,
        branch: selectedPr.branch,
        purpose: prev.purpose || selectedPr.purpose,
      }));
      setSubtotalStr(String(selectedPr.subtotalAmount));
    } else {
      setDoc((prev) => ({ ...prev, parentPrId: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!doc.title.trim()) {
      setError('Judul pesanan pembelian (PO) wajib diisi.');
      return;
    }
    if (!doc.vendorName.trim()) {
      setError('Nama vendor / rekanan wajib diisi.');
      return;
    }
    if (calc.totalAmount <= 0) {
      setError('Total pesanan harus lebih besar dari Rp 0.');
      return;
    }

    // Aturan bisnis: Nilai >= Rp 5 juta kategori STANDARD wajib memiliki Parent PR
    if (calc.totalAmount >= 5_000_000 && doc.poCategory === 'STANDARD' && !doc.parentPrId) {
      setError(
        'Untuk pengadaan standar bernilai ≥ Rp 5.000.000, dokumen induk PR (Purchase Request) wajib dipilih.'
      );
      return;
    }

    // Aturan bisnis: Jika metode Transfer, wajib rekening bank lengkap
    if (doc.paymentMethod === 'BANK_TRANSFER') {
      const bank = doc.bankDetails;
      if (!bank?.bankName?.trim() || !bank?.accountNumber?.trim() || !bank?.accountHolder?.trim()) {
        setError('Untuk metode Transfer Bank, nama bank, nomor rekening, dan nama pemilik rekening wajib diisi.');
        return;
      }
    }

    onSave({
      ...doc,
      subtotal: calc.subtotal,
      otherCosts: calc.otherCosts,
      discount: calc.discount,
      ppnRate,
      ppnAmount: calc.ppnAmount,
      pphRate,
      pphAmount: calc.pphAmount,
      totalAmount: calc.totalAmount,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-body">
        <div className="form-intro">
          <span>PO</span>
          <div>
            <strong>Informasi Pesanan Pembelian (Purchase Order)</strong>
            <p>Formulir penerbitan pesanan resmi kepada vendor rekanan terpilih.</p>
          </div>
        </div>

        {error && <div className="notice error-notice" role="alert">{error}</div>}

        <label htmlFor="po-pr-select">Rujukan Dokumen Induk (Purchase Request)</label>
        <select
          id="po-pr-select"
          value={doc.parentPrId || ''}
          onChange={(e) => handlePrSelect(e.target.value)}
        >
          <option value="">-- Tanpa PR (Pembayaran Rutin / Mobilisasi Langsung) --</option>
          {availablePrs.map((pr) => (
            <option key={pr.id} value={pr.id}>
              {pr.docNumber} - {pr.title} ({rupiah.format(pr.subtotalAmount)})
            </option>
          ))}
        </select>

        <div className="form-grid-2">
          <div>
            <label htmlFor="po-category">Kategori PO <span>*</span></label>
            <select
              id="po-category"
              value={doc.poCategory}
              onChange={(e) =>
                setDoc({ ...doc, poCategory: e.target.value as PODocument['poCategory'] })
              }
            >
              <option value="STANDARD">Standard (Pengadaan Barang/Jasa)</option>
              <option value="ROUTINE">Rutin (Listrik, Air, Internet, Sewa)</option>
              <option value="MOBILIZATION">Mobilisasi & Proyek Lapangan</option>
            </select>
          </div>
          <div>
            <label htmlFor="po-branch">Cabang <span>*</span></label>
            <input
              id="po-branch"
              value={doc.branch}
              onChange={(e) => setDoc({ ...doc, branch: e.target.value })}
              placeholder="Contoh: Bandung"
            />
          </div>
        </div>

        <label htmlFor="po-title">Judul Pesanan Pembelian <span>*</span></label>
        <input
          id="po-title"
          value={doc.title}
          onChange={(e) => setDoc({ ...doc, title: e.target.value })}
          placeholder="Contoh: Pembelian Perangkat Jaringan Kantor Cabang"
        />

        <div className="form-grid-2">
          <div>
            <label htmlFor="po-vendor">Nama Vendor / Rekanan <span>*</span></label>
            <input
              id="po-vendor"
              value={doc.vendorName}
              onChange={(e) => setDoc({ ...doc, vendorName: e.target.value })}
              placeholder="PT Sinar Perkasa Jaya"
            />
          </div>
          <div>
            <label htmlFor="po-pay-method">Metode Pembayaran <span>*</span></label>
            <select
              id="po-pay-method"
              value={doc.paymentMethod}
              onChange={(e) =>
                setDoc({
                  ...doc,
                  paymentMethod: e.target.value as 'BANK_TRANSFER' | 'CASH',
                })
              }
            >
              <option value="BANK_TRANSFER">Transfer Bank</option>
              <option value="CASH">Tunai / Kas Kecil</option>
            </select>
          </div>
        </div>

        {doc.paymentMethod === 'BANK_TRANSFER' && (
          <div className="form-summary-box">
            <strong>Detail Rekening Pembayaran Vendor</strong>
            <div className="form-grid-3" style={{ marginTop: '10px' }}>
              <div>
                <label htmlFor="po-bank-name">Nama Bank <span>*</span></label>
                <input
                  id="po-bank-name"
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
                  placeholder="BCA / Mandiri / BNI"
                />
              </div>
              <div>
                <label htmlFor="po-bank-acc">Nomor Rekening <span>*</span></label>
                <input
                  id="po-bank-acc"
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
                  placeholder="882019281"
                />
              </div>
              <div>
                <label htmlFor="po-bank-holder">Nama Pemilik <span>*</span></label>
                <input
                  id="po-bank-holder"
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
                  placeholder="PT Sinar Perkasa Jaya"
                />
              </div>
            </div>
          </div>
        )}

        <div className="form-grid-3">
          <div>
            <label htmlFor="po-subtotal">Subtotal <span>*</span></label>
            <input
              id="po-subtotal"
              inputMode="numeric"
              value={subtotalStr}
              onChange={(e) => setSubtotalStr(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="po-other">Biaya Lain (+)</label>
            <input
              id="po-other"
              inputMode="numeric"
              value={otherCostsStr}
              onChange={(e) => setOtherCostsStr(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="po-discount">Diskon (-)</label>
            <input
              id="po-discount"
              inputMode="numeric"
              value={discountStr}
              onChange={(e) => setDiscountStr(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div>
            <label htmlFor="po-ppn">Tarif PPN (Pajak Pertambahan Nilai)</label>
            <select
              id="po-ppn"
              value={String(ppnRate)}
              onChange={(e) => setPpnRate(Number(e.target.value))}
            >
              <option value="0.11">11% (Standar Nasional)</option>
              <option value="0">0% (Bebas PPN / Non-PKP)</option>
            </select>
          </div>
          <div>
            <label htmlFor="po-pph">Tarif PPh (Pemotongan Pajak)</label>
            <select
              id="po-pph"
              value={String(pphRate)}
              onChange={(e) => setPphRate(Number(e.target.value))}
            >
              <option value="0">0% (Tanpa Potongan PPh)</option>
              <option value="0.02">2% (PPh Pasal 23 Jasa)</option>
              <option value="0.005">0.5% (PPh Final UMKM)</option>
            </select>
          </div>
        </div>

        {/* Live Financial Calculation Box */}
        <div className="form-summary-box">
          <div className="form-summary-row">
            <span>Subtotal Barang/Jasa:</span>
            <strong>{rupiah.format(calc.subtotal)}</strong>
          </div>
          <div className="form-summary-row">
            <span>Biaya Tambahan Lain:</span>
            <span>+ {rupiah.format(calc.otherCosts)}</span>
          </div>
          <div className="form-summary-row">
            <span>Potongan Harga / Diskon:</span>
            <span>- {rupiah.format(calc.discount)}</span>
          </div>
          <div className="form-summary-row">
            <span>PPN ({Math.round(ppnRate * 100)}%):</span>
            <span>+ {rupiah.format(calc.ppnAmount)}</span>
          </div>
          <div className="form-summary-row">
            <span>PPh ({Math.round(pphRate * 100)}%):</span>
            <span>- {rupiah.format(calc.pphAmount)}</span>
          </div>
          <div className="form-summary-total">
            <span>TOTAL TERUTANG:</span>
            <span>{rupiah.format(calc.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="secondary" onClick={onClose}>
          Batal
        </button>
        <button type="submit" className="primary">
          Simpan Draf PO <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
};

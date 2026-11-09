import React from 'react';

type TaxValues = { ppnRate?: number; pphRate?: number };
export function TaxFields({ prefix, values, onChange }: { prefix: string; values: TaxValues; onChange: (values: TaxValues) => void }) {
  return (
    <div className="form-grid-2">
      <div>
        <label htmlFor={`${prefix}-ppn`}>Tarif PPN (Pajak Pertambahan Nilai)</label>
        <select
          id={`${prefix}-ppn`}
          value={String(values.ppnRate ?? 0)}
          onChange={(event) => onChange({ ...values, ppnRate: Number(event.target.value) })}
        >
          <option value="0">0% (Tanpa PPN / Non-PKP)</option>
          <option value="0.11">11% efektif (PPN Umum)</option>
          <option value="0.011">1.1% (PPN Besaran Tertentu)</option>
        </select>
      </div>
      <div>
        <label htmlFor={`${prefix}-pph`}>Tarif PPh (Pemotongan Pajak)</label>
        <select
          id={`${prefix}-pph`}
          value={String(values.pphRate ?? 0)}
          onChange={(event) => onChange({ ...values, pphRate: Number(event.target.value) })}
        >
          <option value="0">0% (Tanpa Potongan PPh)</option>
          <option value="0.02">2% (PPh Pasal 23 Jasa)</option>
          <option value="0.005">0.5% (PPh Final UMKM)</option>
          <option value="0.025">2.5% (PPh Pasal 21 Tenaga Ahli)</option>
          <option value="0.1">10% (PPh Final Pasal 4(2) Sewa)</option>
        </select>
      </div>
    </div>
  );
}

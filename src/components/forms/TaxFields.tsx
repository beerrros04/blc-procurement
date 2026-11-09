import React from 'react';

type TaxValues = { ppnRate?: number; pphRate?: number };
export function TaxFields({ prefix, values, onChange }: { prefix: string; values: TaxValues; onChange: (values: TaxValues) => void }) {
  return <div className="form-grid-2">
    <div><label htmlFor={`${prefix}-ppn`}>PPN (perkiraan)</label><select id={`${prefix}-ppn`} value={values.ppnRate ?? 0} onChange={(event) => onChange({ ...values, ppnRate: Number(event.target.value) })}><option value="0">Tanpa PPN</option><option value="0.11">11% efektif</option></select></div>
    <div><label htmlFor={`${prefix}-pph`}>PPh (perkiraan)</label><select id={`${prefix}-pph`} value={values.pphRate ?? 0} onChange={(event) => onChange({ ...values, pphRate: Number(event.target.value) })}><option value="0">Tanpa PPh</option><option value="0.02">2% PPh 23</option></select></div>
  </div>;
}

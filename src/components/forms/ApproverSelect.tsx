import React, { useState } from 'react';

export const STANDARD_APPROVERS = [
  {
    email: 'atasan@blc.co.id',
    label: 'Pak Hendra (Atasan Langsung) - atasan@blc.co.id',
  },
  {
    email: 'ayu@blc.co.id',
    label: 'Ayu Martina (GM / Penyetuju Tahap 2) - ayu@blc.co.id',
  },
];

export interface ApproverSelectProps {
  id: string;
  value?: string;
  onChange: (email: string) => void;
  label?: string;
  required?: boolean;
}

export const ApproverSelect: React.FC<ApproverSelectProps> = ({
  id,
  value,
  onChange,
  label = 'Email Atasan Langsung',
  required = true,
}) => {
  const currentEmail = (value || '').trim();
  const isStandard = STANDARD_APPROVERS.some(
    (a) => a.email.toLowerCase() === currentEmail.toLowerCase()
  );
  const [isCustom, setIsCustom] = useState(!isStandard && Boolean(currentEmail));

  const selectValue = isCustom ? '__CUSTOM__' : (currentEmail || 'atasan@blc.co.id');

  return (
    <div className="approver-select-container">
      <label htmlFor={id}>
        {label} {required && <span>*</span>}
      </label>
      <select
        id={id}
        aria-label={label}
        value={selectValue}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '__CUSTOM__') {
            setIsCustom(true);
          } else {
            setIsCustom(false);
            onChange(val);
          }
        }}
      >
        {STANDARD_APPROVERS.map((appr) => (
          <option key={appr.email} value={appr.email}>
            {appr.label}
          </option>
        ))}
        <option value="__CUSTOM__">Email Lainnya (Kustom)...</option>
      </select>

      {isCustom && (
        <div style={{ marginTop: '6px' }}>
          <input
            id={`${id}-custom`}
            type="email"
            placeholder="Masukkan email atasan (contoh: atasan.cabang@blc.co.id)"
            value={STANDARD_APPROVERS.some((a) => a.email.toLowerCase() === currentEmail.toLowerCase()) ? '' : currentEmail}
            onChange={(e) => onChange(e.target.value)}
            required={required}
          />
        </div>
      )}
    </div>
  );
};

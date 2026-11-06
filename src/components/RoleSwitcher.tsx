import React from 'react';
import type { UserRole } from '../types/document';

export interface RoleSwitcherProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const ROLE_DEFINITIONS: Array<{
  role: UserRole;
  title: string;
  badge: string;
  description: string;
}> = [
  {
    role: 'PEMOHON',
    title: 'Pemohon',
    badge: 'Staff',
    description: 'Draf, simpan, ajukan, dan revisi dokumen',
  },
  {
    role: 'ATASAN',
    title: 'Atasan Langsung',
    badge: 'Tahap 1',
    description: 'Persetujuan operasional dasar bawahan',
  },
  {
    role: 'AYU',
    title: 'Bu Ayu (Verifikator)',
    badge: 'Tahap 2',
    description: 'Review anggaran & kelayakan administrasi keuangan',
  },
  {
    role: 'BOD_HERY',
    title: 'Pak Hery',
    badge: 'Tahap 3 (BOD)',
    description: 'Otorisasi direksi paralel',
  },
  {
    role: 'BOD_HASHIMOTO',
    title: 'Hashimoto',
    badge: 'Tahap 3 (BOD)',
    description: 'Otorisasi direksi paralel',
  },
  {
    role: 'KEUANGAN',
    title: 'Keuangan',
    badge: 'Finance',
    description: 'Penerbitan PV & pencatatan bukti bayar',
  },
];

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ activeRole, onRoleChange }) => {
  return (
    <aside className="role-simulator-card" aria-label="Simulator Peran">
      <div className="role-card-header">
        <span className="role-icon" aria-hidden="true">👤</span>
        <div>
          <strong>Simulator Peran Pengguna</strong>
          <small>Pilih profil untuk menguji otorisasi tindakan & alur persetujuan</small>
        </div>
      </div>
      <div className="role-options-grid" role="radiogroup" aria-label="Pilih Peran">
        {ROLE_DEFINITIONS.map((def) => {
          const isActive = activeRole === def.role;
          return (
            <button
              key={def.role}
              type="button"
              className={`role-chip ${isActive ? 'role-chip-active' : ''}`}
              role="radio"
              aria-checked={isActive}
              onClick={() => onRoleChange(def.role)}
            >
              <div className="role-chip-head">
                <span className="role-chip-badge">{def.badge}</span>
                <strong>{def.title}</strong>
              </div>
              <p>{def.description}</p>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

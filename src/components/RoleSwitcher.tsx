import React from 'react';
import { ShieldCheck } from 'lucide-react';
import type { UserRole } from '../types/document';
import { Badge } from '@/components/ui/badge';

export interface RoleSwitcherProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const ROLE_DEFINITIONS: Array<{
  role: UserRole;
  title: string;
  badge: string;
}> = [
  { role: 'PEMOHON', title: 'Pemohon', badge: 'Staff' },
  { role: 'ATASAN', title: 'Atasan', badge: 'Tahap 1' },
  { role: 'AYU', title: 'Ayu Martina', badge: 'Tahap 2' },
  { role: 'BOD_HERY', title: 'Hery Sugiarto', badge: 'BOD' },
  { role: 'BOD_HASHIMOTO', title: 'Koji Hashimoto', badge: 'BOD' },
  { role: 'KEUANGAN', title: 'Keuangan', badge: 'Finance' },
];

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ activeRole, onRoleChange }) => {
  return (
    <aside className="role-simulator-card" aria-label="Simulator Peran">
      <div className="role-card-header">
        <span className="role-icon" aria-hidden="true">
          <ShieldCheck size={16} />
        </span>
        <strong>Peran Aktif:</strong>
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
              <strong>{def.title}</strong>
              <Badge variant="secondary" className="role-chip-badge">{def.badge}</Badge>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

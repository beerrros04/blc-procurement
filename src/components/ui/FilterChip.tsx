import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { corporateTransition, pressableProps } from '../../lib/motion';

export interface FilterChipProps extends Omit<HTMLMotionProps<'button'>, 'children' | 'onClick'> {
  active: boolean;
  count?: number;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function FilterChip({
  active,
  count,
  onClick,
  children,
  className,
  disabled = false,
  ...restProps
}: FilterChipProps): React.JSX.Element {
  const chipClass = ['filter-chip', active ? 'active' : '', className].filter(Boolean).join(' ');

  return (
    <motion.button
      type="button"
      className={chipClass}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      whileTap={disabled ? undefined : pressableProps.whileTap}
      transition={corporateTransition}
      {...restProps}
    >
      <span className="filter-chip-label">{children}</span>
      {count !== undefined && <span className="filter-chip-count">{count}</span>}
    </motion.button>
  );
}

export default FilterChip;

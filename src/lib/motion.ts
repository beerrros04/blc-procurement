import type { Transition, Variants } from 'framer-motion';

/**
 * Enterprise Corporate motion archetype transition constants.
 * Adheres to cubic-bezier(0.2, 0, 0, 1) ease curves for high-density, professional business UIs.
 */
export const corporateTransition = {
  ease: [0.2, 0, 0, 1] as const,
  duration: 0.25,
} satisfies Transition;

export const modalEnterTransition = {
  ease: [0.05, 0.7, 0.1, 1] as const,
  duration: 0.32,
} satisfies Transition;

export const modalExitTransition = {
  ease: [0.3, 0, 1, 1] as const,
  duration: 0.2,
} satisfies Transition;

/**
 * Micro-interaction props for pressable controls (buttons, icon buttons, chips).
 */
export const pressableProps = {
  whileTap: { scale: 0.98 },
};

/**
 * Micro-interaction props for cards providing subtle elevation translateY on hover.
 */
export const hoverableCardProps = {
  whileHover: {
    y: -2,
    transition: {
      duration: 0.15,
      ease: [0.2, 0, 0, 1] as const,
    },
  },
};

/**
 * Modal dialogue animation variants (backdrop and dialogue enter/exit).
 */
export const modalMotionVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.05, 0.7, 0.1, 1] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 8,
    transition: { duration: 0.2, ease: [0.3, 0, 1, 1] as const },
  },
} satisfies Variants;

/**
 * Mobile drawer and sheet animation variants.
 */
export const drawerMotionVariants = {
  hidden: { x: '-100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.25, ease: [0.2, 0, 0, 1] as const },
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: { duration: 0.2, ease: [0.3, 0, 1, 1] as const },
  },
} satisfies Variants;

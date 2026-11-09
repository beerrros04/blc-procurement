import { describe, it, expect } from 'vitest';
import { corporateTransition, modalMotionVariants, pressableProps, hoverableCardProps, drawerMotionVariants } from './motion';

describe('Corporate Motion Engine', () => {
  it('exports corporate cubic-bezier transition curves', () => {
    expect(corporateTransition.ease).toEqual([0.2, 0, 0, 1]);
    expect(corporateTransition.duration).toBe(0.25);
  });

  it('provides scale tap feedback for interactive controls', () => {
    expect(pressableProps.whileTap).toEqual({ scale: 0.98 });
  });

  it('provides subtle elevation translateY on hoverable cards', () => {
    expect(hoverableCardProps.whileHover).toEqual({ y: -2, transition: { duration: 0.15, ease: [0.2, 0, 0, 1] } });
  });

  it('defines modal entrance and exit states', () => {
    expect(modalMotionVariants.hidden.opacity).toBe(0);
    expect(modalMotionVariants.visible.opacity).toBe(1);
    expect(modalMotionVariants.exit.opacity).toBe(0);
  });

  it('defines mobile drawer entrance and exit states', () => {
    expect(drawerMotionVariants.hidden.x).toBe('-100%');
    expect(drawerMotionVariants.visible.x).toBe(0);
  });
});

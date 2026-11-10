import { describe, it, expect } from 'vitest';
import { cn } from './utils';
import { cva } from 'class-variance-authority';

describe('shadcn utils (cn & cva)', () => {
  it('correctly merges conditional classes and resolves tailwind conflicts', () => {
    const result = cn('px-4 py-2 text-sm', true && 'text-base', false && 'hidden', 'px-6');
    expect(result).toBe('py-2 text-base px-6');
  });

  it('works seamlessly with class-variance-authority variants', () => {
    const buttonVariants = cva('inline-flex items-center justify-center font-medium transition-colors', {
      variants: {
        variant: {
          default: 'bg-primary text-primary-foreground',
          destructive: 'bg-destructive text-destructive-foreground',
        },
        size: {
          default: 'h-9 px-4 py-2',
          sm: 'h-8 px-3',
        },
      },
      defaultVariants: {
        variant: 'default',
        size: 'default',
      },
    });

    const renderedClass = cn(buttonVariants({ variant: 'destructive', size: 'sm' }), 'custom-extra-class');
    expect(renderedClass).toContain('bg-destructive');
    expect(renderedClass).toContain('h-8');
    expect(renderedClass).toContain('custom-extra-class');
  });
});

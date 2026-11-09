import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Elera Design Tokens in style.css', () => {
  it('defines Enterprise Design System tokens and retains backward-compatible Caready aliases', () => {
    const css = readFileSync(resolve(__dirname, 'style.css'), 'utf-8');
    // New Design System tokens
    expect(css).toContain('--palette-primary-600: #DC2626;');
    expect(css).toContain('--palette-neutral-100: #F4F3EF;');
    expect(css).toContain('--color-primary:');
    expect(css).toContain('--color-background:');
    expect(css).toContain('--easing-standard: cubic-bezier(0.2, 0, 0, 1);');
    expect(css).toContain('--elevation-1:');
    // Legacy aliases for existing tests
    expect(css).toContain('--canvas-bg: #f6f5f3;');
    expect(css).toContain('--border-clean: #ededeb;');
    expect(css).toContain('--accent-caready: #e51937;');
  });

  it('defines Elera canvas, Caready corporate palette variables, and component classes', () => {
    const css = readFileSync(resolve(__dirname, 'style.css'), 'utf-8');
    expect(css).toContain('--canvas-bg: #f6f5f3');
    expect(css).toContain('--border-clean: #ededeb');
    expect(css).toContain('--btn-charcoal: #191c1a');
    expect(css).toContain('--accent-caready: #e51937');
    expect(css).toContain('.stats-strip');
    expect(css).toContain('.s-tabs');
    expect(css).toContain('.s-drawer');
    expect(css).toContain('.s-icon-chip');
    expect(css).toContain('.s-action-caready');
    expect(css).toContain('--pill-radius: 9999px;');
    expect(css).toContain('.step-badge');
    expect(css).toContain('.step-badge.status-waiting');
    expect(css).toContain('.step-badge.status-pending');
    expect(css).toContain('.step-badge.status-approved');
    expect(css).toContain('.step-badge.status-rejected');
    expect(css).toContain('.bod-reviewer-head');
  });

  it('fulfills WCAG AA text contrast, print media rules, and selective reduced motion', () => {
    const css = readFileSync(resolve(__dirname, 'style.css'), 'utf-8');
    expect(css).toContain('--text-muted: #4b5563');
    expect(css).toContain('--text-secondary: #374151');
    expect(css).toContain('@media print');
    expect(css).not.toContain('*, *::before, *::after {\n    animation-duration: 0.01ms !important;');
  });
});

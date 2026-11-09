import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Elera Design Tokens in style.css', () => {
  it('defines Elera canvas, Caready corporate palette variables, and component classes', () => {
    const css = fs.readFileSync(path.resolve(__dirname, 'style.css'), 'utf-8');
    expect(css).toContain('--canvas-bg: #f6f5f3');
    expect(css).toContain('--border-clean: #ededeb');
    expect(css).toContain('--btn-charcoal: #191c1a');
    expect(css).toContain('--accent-caready: #e51937');
    expect(css).toContain('.stats-strip');
    expect(css).toContain('.s-tabs');
    expect(css).toContain('.s-drawer');
    expect(css).toContain('.s-icon-chip');
    expect(css).toContain('.s-action-caready');
  });

  it('fulfills WCAG AA text contrast, print media rules, and selective reduced motion', () => {
    const css = fs.readFileSync(path.resolve(__dirname, 'style.css'), 'utf-8');
    expect(css).toContain('--text-muted: #4b5563');
    expect(css).toContain('--text-secondary: #374151');
    expect(css).toContain('@media print');
    expect(css).not.toContain('*, *::before, *::after {\n    animation-duration: 0.01ms !important;');
  });
});

import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Badge } from './badge';

describe('shadcn/ui Badge', () => {
  it('renders default variant with primary styling', () => {
    const html = renderToStaticMarkup(<Badge>Caready</Badge>);
    expect(html).toContain('Caready');
    expect(html).toContain('bg-primary');
    expect(html).toContain('text-primary-foreground');
  });

  it('renders secondary and destructive variants', () => {
    const secHtml = renderToStaticMarkup(<Badge variant="secondary">Draft</Badge>);
    expect(secHtml).toContain('Draft');
    expect(secHtml).toContain('bg-secondary');

    const destHtml = renderToStaticMarkup(<Badge variant="destructive">Rejected</Badge>);
    expect(destHtml).toContain('Rejected');
    expect(destHtml).toContain('bg-destructive');
  });

  it('renders outline variant', () => {
    const html = renderToStaticMarkup(<Badge variant="outline">PO-2026-001</Badge>);
    expect(html).toContain('PO-2026-001');
    expect(html).toContain('text-foreground');
  });

  it('renders custom semantic variants if provided (success, warning, info)', () => {
    const successHtml = renderToStaticMarkup(<Badge variant="success">Disetujui</Badge>);
    expect(successHtml).toContain('Disetujui');
    expect(successHtml).toContain('border-[#A7F3D0]');

    const warningHtml = renderToStaticMarkup(<Badge variant="warning">Menunggu</Badge>);
    expect(warningHtml).toContain('Menunggu');
    expect(warningHtml).toContain('border-[#FDE68A]');

    const infoHtml = renderToStaticMarkup(<Badge variant="info">Ditinjau</Badge>);
    expect(infoHtml).toContain('Ditinjau');
    expect(infoHtml).toContain('border-[#BFDBFE]');
  });
});

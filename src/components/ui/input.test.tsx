import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';

describe('shadcn/ui Form Primitives (Input, Label, Textarea)', () => {
  it('renders Input with proper type, placeholder, and styling classes', () => {
    const html = renderToStaticMarkup(
      <Input type="text" placeholder="Masukkan Nomor PR" disabled={false} />
    );
    expect(html).toContain('<input');
    expect(html).toContain('type="text"');
    expect(html).toContain('placeholder="Masukkan Nomor PR"');
    expect(html).toContain('border-input');
    expect(html).toContain('focus-visible:ring-ring');
  });

  it('renders disabled Input properly', () => {
    const html = renderToStaticMarkup(<Input disabled />);
    expect(html).toContain('disabled=""');
    expect(html).toContain('disabled:cursor-not-allowed');
  });

  it('renders Label with semantic association and styling', () => {
    const html = renderToStaticMarkup(
      <Label htmlFor="pr-number">Nomor Pengajuan (PR)</Label>
    );
    expect(html).toContain('<label');
    expect(html).toContain('for="pr-number"');
    expect(html).toContain('Nomor Pengajuan (PR)');
    expect(html).toContain('text-sm');
    expect(html).toContain('font-medium');
  });

  it('renders Textarea with proper classes and rows', () => {
    const html = renderToStaticMarkup(
      <Textarea id="notes" placeholder="Catatan persetujuan..." rows={4} />
    );
    expect(html).toContain('<textarea');
    expect(html).toContain('id="notes"');
    expect(html).toContain('placeholder="Catatan persetujuan..."');
    expect(html).toContain('rows="4"');
    expect(html).toContain('border-input');
  });
});

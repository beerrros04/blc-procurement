import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge Component', () => {
  it('renders semantic badge with icon and label for APPROVED / disetujui', () => {
    const html = renderToStaticMarkup(<StatusBadge status="APPROVED" />);
    expect(html).toContain('class="status-badge status-approved"');
    expect(html).toContain('Disetujui');
    expect(html).toContain('svg'); // Lucide check icon
  });

  it('renders semantic badge with icon and label for PAID / lunas', () => {
    const html = renderToStaticMarkup(<StatusBadge status="PAID" />);
    expect(html).toContain('status-paid');
    expect(html).toContain('Lunas');
  });

  it('renders semantic badge with icon and label for REJECTED / ditolak', () => {
    const html = renderToStaticMarkup(<StatusBadge status="REJECTED" />);
    expect(html).toContain('status-rejected');
    expect(html).toContain('Ditolak');
  });

  it('renders semantic badge with icon and label for IN_REVIEW / ditinjau', () => {
    const html = renderToStaticMarkup(<StatusBadge status="IN_REVIEW" />);
    expect(html).toContain('status-in_review');
    expect(html).toContain('Ditinjau');
  });

  it('renders semantic badge with icon and label for SUBMITTED / diajukan', () => {
    const html = renderToStaticMarkup(<StatusBadge status="SUBMITTED" />);
    expect(html).toContain('status-submitted');
    expect(html).toContain('Diajukan');
  });

  it('renders semantic badge for DRAFT / draf', () => {
    const html = renderToStaticMarkup(<StatusBadge status="DRAFT" />);
    expect(html).toContain('status-draft');
    expect(html).toContain('Draf');
  });

  it('normalizes lowercase and indonesian status aliases', () => {
    expect(renderToStaticMarkup(<StatusBadge status="disetujui" />)).toContain('status-approved');
    expect(renderToStaticMarkup(<StatusBadge status="lunas" />)).toContain('status-paid');
    expect(renderToStaticMarkup(<StatusBadge status="ditolak" />)).toContain('status-rejected');
    expect(renderToStaticMarkup(<StatusBadge status="ditinjau" />)).toContain('status-in_review');
    expect(renderToStaticMarkup(<StatusBadge status="diajukan" />)).toContain('status-submitted');
    expect(renderToStaticMarkup(<StatusBadge status="draft" />)).toContain('status-draft');
  });

  it('hides icon when showIcon is false', () => {
    const html = renderToStaticMarkup(<StatusBadge status="APPROVED" showIcon={false} />);
    expect(html).not.toContain('<svg');
    expect(html).toContain('Disetujui');
  });

  it('appends custom className when provided', () => {
    const html = renderToStaticMarkup(<StatusBadge status="APPROVED" className="custom-test-class" />);
    expect(html).toContain('status-badge status-approved custom-test-class');
  });
});

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { FilterChip } from './FilterChip';

describe('FilterChip Component', () => {
  it('renders inactive chip with proper class and aria-pressed', () => {
    const html = renderToStaticMarkup(
      <FilterChip active={false}>Semua</FilterChip>
    );
    expect(html).toContain('class="filter-chip"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('Semua');
  });

  it('renders active chip with active class and aria-pressed true', () => {
    const html = renderToStaticMarkup(
      <FilterChip active={true}>Disetujui</FilterChip>
    );
    expect(html).toContain('class="filter-chip active"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('Disetujui');
  });

  it('renders count pill when count is provided', () => {
    const html = renderToStaticMarkup(
      <FilterChip active={false} count={12}>Menunggu</FilterChip>
    );
    expect(html).toContain('filter-chip-count');
    expect(html).toContain('12');
  });

  it('omits count pill when count is undefined', () => {
    const html = renderToStaticMarkup(
      <FilterChip active={false}>Draft</FilterChip>
    );
    expect(html).not.toContain('filter-chip-count');
  });

  it('renders disabled attribute when disabled is true', () => {
    const html = renderToStaticMarkup(
      <FilterChip active={false} disabled>Dinonaktifkan</FilterChip>
    );
    expect(html).toContain('disabled=""');
  });

  it('merges custom className when provided', () => {
    const html = renderToStaticMarkup(
      <FilterChip active={false} className="custom-filter-class">Filter</FilterChip>
    );
    expect(html).toContain('class="filter-chip custom-filter-class"');
  });
});

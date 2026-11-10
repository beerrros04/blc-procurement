import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from './button';

describe('shadcn/ui Button', () => {
  it('renders default button with primary Caready styling', () => {
    const html = renderToStaticMarkup(<Button>Submit PR</Button>);
    expect(html).toContain('Submit PR');
    expect(html).toContain('bg-primary');
    expect(html).toContain('text-primary-foreground');
  });

  it('renders outline variant with crisp border', () => {
    const html = renderToStaticMarkup(<Button variant="outline">Export</Button>);
    expect(html).toContain('Export');
    expect(html).toContain('border');
  });

  it('renders destructive variant', () => {
    const html = renderToStaticMarkup(<Button variant="destructive">Reject</Button>);
    expect(html).toContain('Reject');
    expect(html).toContain('bg-destructive');
  });

  it('renders sizes sm, lg, icon correctly', () => {
    const smHtml = renderToStaticMarkup(<Button size="sm">Small</Button>);
    expect(smHtml).toContain('h-8');

    const lgHtml = renderToStaticMarkup(<Button size="lg">Large</Button>);
    expect(lgHtml).toContain('h-11');

    const iconHtml = renderToStaticMarkup(<Button size="icon" aria-label="Icon Btn">★</Button>);
    expect(iconHtml).toContain('h-9');
    expect(iconHtml).toContain('w-9');
  });

  it('supports asChild pattern with Radix Slot', () => {
    const html = renderToStaticMarkup(
      <Button asChild>
        <a href="/portal">Link Action</a>
      </Button>
    );
    expect(html).toContain('<a');
    expect(html).toContain('href="/portal"');
    expect(html).toContain('Link Action');
    expect(html).toContain('bg-primary');
  });
});

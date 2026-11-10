import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';

describe('shadcn/ui Sheet', () => {
  it('renders sheet side drawer structure', () => {
    const html = renderToStaticMarkup(
      <Sheet defaultOpen>
        <SheetTrigger>Lihat Detail Drawer</SheetTrigger>
        <SheetContent side="right" portal={false}>
          <SheetHeader>
            <SheetTitle>Rincian Berkas PR-2026-001</SheetTitle>
            <SheetDescription>
              Detail transaksi pengadaan barang operasional.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );

    expect(html).toContain('Lihat Detail Drawer');
    expect(html).toContain('Rincian Berkas PR-2026-001');
    expect(html).toContain('Detail transaksi pengadaan barang operasional');
  });
});

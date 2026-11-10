import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

describe('shadcn/ui Dialog', () => {
  it('renders dialog trigger and modal structure', () => {
    const html = renderToStaticMarkup(
      <Dialog defaultOpen>
        <DialogTrigger>Open Modal</DialogTrigger>
        <DialogContent portal={false}>
          <DialogHeader>
            <DialogTitle>Konfirmasi Otorisasi</DialogTitle>
            <DialogDescription>
              Pastikan seluruh nilai dokumen sudah diverifikasi.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    expect(html).toContain('Open Modal');
    expect(html).toContain('Konfirmasi Otorisasi');
    expect(html).toContain('Pastikan seluruh nilai dokumen sudah diverifikasi');
  });

  it('renders tooltip trigger without error', () => {
    const html = renderToStaticMarkup(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Info</button>
          </TooltipTrigger>
          <TooltipContent>Informasi Tambahan</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(html).toContain('Info');
  });
});

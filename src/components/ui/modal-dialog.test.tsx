import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ModalDialog } from './modal-dialog';

describe('ModalDialog accessible container', () => {
  it('renders open dialog with title, aria-modal, and close button', () => {
    const onClose = vi.fn();
    const html = renderToStaticMarkup(
      <ModalDialog isOpen={true} onClose={onClose} title="Formulir Purchase Request (PR)" ariaLabel="Formulir Purchase Request">
        <div>Isi Formulir</div>
      </ModalDialog>
    );

    expect(html).toContain('class="modal"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Formulir Purchase Request (PR)');
    expect(html).toContain('aria-label="Tutup formulir"');
    expect(html).toContain('Isi Formulir');
  });

  it('does not render when isOpen is false', () => {
    const html = renderToStaticMarkup(
      <ModalDialog isOpen={false} onClose={vi.fn()} title="Test Modal">
        <div>Content</div>
      </ModalDialog>
    );
    expect(html).toBe('');
  });
});

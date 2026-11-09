import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  ariaLabel?: string;
  maxWidth?: string;
  errorMessage?: string;
  busy?: boolean;
  children: React.ReactNode;
}

export const ModalDialog: React.FC<ModalDialogProps> = ({
  isOpen,
  onClose,
  title,
  ariaLabel,
  maxWidth = 'min(640px, 100%)',
  errorMessage,
  busy = false,
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (typeof document !== 'undefined') {
      previouslyFocusedElement.current = document.activeElement as HTMLElement | null;
    }

    const panel = dialogRef.current;
    if (panel) {
      const focusable = panel.querySelector<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab' && panel) {
        const controls = Array.from(
          panel.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
          )
        );
        if (!controls.length) {
          event.preventDefault();
          return;
        }

        const first = controls[0];
        const last = controls[controls.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeyDown);
      }
      previouslyFocusedElement.current?.focus();
    };
  }, [isOpen, onClose, busy]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      open
      aria-modal="true"
      aria-label={ariaLabel || title}
      onClick={(e) => {
        if (!busy && e.target === e.currentTarget) {
          onClose();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <section className="drawer" style={{ width: maxWidth }}>
        <div className="drawer-head">
          <div>
            <h2>{title}</h2>
          </div>
          <button
            className="close"
            aria-label="Tutup formulir"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        {errorMessage && (
          <div className="notice error-notice" role="alert">
            {errorMessage}
          </div>
        )}
        {busy && <div className="notice" role="status">Menyimpan dokumen...</div>}
        <fieldset disabled={busy} aria-busy={busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          {children}
        </fieldset>
      </section>
    </dialog>
  );
};

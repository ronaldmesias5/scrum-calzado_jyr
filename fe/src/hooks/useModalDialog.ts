import { useEffect, useRef, useCallback } from 'react';

export function useModalDialog(
  isOpen: boolean,
  onClose: () => void,
  autoFocus = true
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActive = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previousActive.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';

    if (autoFocus && containerRef.current) {
      requestAnimationFrame(() => {
        const focusable = containerRef.current?.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      });
    }
    return () => {
      document.body.style.overflow = '';
      requestAnimationFrame(() => previousActive.current?.focus());
    };
  }, [isOpen, autoFocus]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !containerRef.current) return;
      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const f = focusable[0]!, l = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
      else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const dialogProps = {
    ref: containerRef,
    role: 'dialog' as const,
    'aria-modal': true as const,
    tabIndex: -1 as const,
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  };

  const closeOnBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  return { containerRef, dialogProps, closeOnBackdrop };
}

import { useEffect, useRef, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  titleId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'blur' | 'dark' | 'light';
  showClose?: boolean;
  className?: string;
  initialFocus?: boolean;
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl max-h-[90vh]',
};

const OVERLAY_CLASSES: Record<string, string> = {
  blur: 'bg-black/85 backdrop-blur-md',
  dark: 'bg-black/80',
  light: 'bg-black/40',
};

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  titleId = 'modal-title',
  size = 'md',
  variant = 'blur',
  showClose = true,
  className = '',
  initialFocus = true,
}: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      if (initialFocus && containerRef.current) {
        requestAnimationFrame(() => {
          const firstFocusable = containerRef.current?.querySelector<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusable) firstFocusable.focus();
          else containerRef.current?.focus();
        });
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown, initialFocus]);

  const handleClose = useCallback(() => {
    onClose();
    requestAnimationFrame(() => previousActiveElement.current?.focus());
  }, [onClose]);

  if (!isOpen) return null;

  const overlay = OVERLAY_CLASSES[variant] || OVERLAY_CLASSES.blur;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${overlay} transition-all duration-300`}
      onClick={handleClose}
      aria-hidden="true"
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ${sizeClass} w-full overflow-hidden flex flex-col border border-gray-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showClose) && (
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-5 flex justify-between items-start rounded-t-2xl z-10 shrink-0">
            {title ? (
              <h2 id={titleId} className="text-lg font-bold text-gray-900 dark:text-white">
                {title}
              </h2>
            ) : (
              <span />
            )}
            {showClose && (
              <button
                onClick={handleClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all flex-shrink-0 ml-4 -mr-1 -mt-1"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}

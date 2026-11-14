import {
  useEffect,
  useRef,
  useCallback,
  useState,
  type ReactNode
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  titleId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  variant?: 'blur' | 'dark' | 'light';
  showClose?: boolean;
  className?: string;
  initialFocus?: boolean;
  centered?: boolean;
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'max-w-sm max-h-[85vh]',
  md: 'max-w-md max-h-[85vh]',
  lg: 'max-w-lg max-h-[85vh]',
  xl: 'max-w-xl max-h-[85vh]',
  '2xl': 'max-w-2xl max-h-[85vh]',
  full: 'max-w-4xl max-h-[90vh]'
};

const OVERLAY_CLASSES: Record<string, string> = {
  blur: 'bg-black/40 backdrop-blur-sm',
  dark: 'bg-black/80 backdrop-blur-[2px]',
  light: 'bg-black/40 backdrop-blur-sm'
};

const CLOSE_DURATION_MS = 200;

type ModalPhase = 'entering' | 'entered' | 'exiting';

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
  centered = false
}: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const closingTimerRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<ModalPhase>('entering');

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleClose = useCallback(() => {
    if (closingTimerRef.current !== null) return;
    setPhase('exiting');
    closingTimerRef.current = window.setTimeout(() => {
      closingTimerRef.current = null;
      onCloseRef.current();
      previousActiveElement.current?.focus();
    }, CLOSE_DURATION_MS);
  }, []);

  const handleCloseRef = useRef(handleClose);
  useEffect(() => {
    handleCloseRef.current = handleClose;
  }, [handleClose]);

  useEffect(() => {
    if (isOpen) {
      setPhase('entering');
      const raf = requestAnimationFrame(() => setPhase('entered'));
      return () => cancelAnimationFrame(raf);
    }
    setPhase('entering');
  }, [isOpen]);

  useEffect(
    () => () => {
      if (closingTimerRef.current !== null) {
        clearTimeout(closingTimerRef.current);
        closingTimerRef.current = null;
      }
    },
    []
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCloseRef.current();
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
  }, []);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      if (initialFocus && containerRef.current) {
        requestAnimationFrame(() => {
          const firstFocusable =
            containerRef.current?.querySelector<HTMLElement>(
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
  }, [handleKeyDown, initialFocus, isOpen]);

  if (!isOpen) return null;

  const overlay = OVERLAY_CLASSES[variant] || OVERLAY_CLASSES.blur;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const isHidden = phase === 'entering' || phase === 'exiting';
  const panelState = isHidden ? 'opacity-0 scale-95' : 'opacity-100 scale-100';
  const overlayState = isHidden ? 'opacity-0' : 'opacity-100';

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex justify-center overflow-y-auto p-4 ${centered ? 'items-center' : 'items-start'}`}
    >
      <div
        className={`absolute inset-0 ${overlay} ${overlayState} transition-all duration-200 ease-out`}
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ${sizeClass} w-full border border-gray-200 dark:border-slate-800 ${panelState} transition-all duration-200 ease-out will-change-transform my-8 flex flex-col overflow-hidden ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showClose) && (
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-5 flex justify-between items-start rounded-t-2xl z-10 shrink-0">
            {title ? (
              <h2
                id={titleId}
                className="text-lg font-bold text-gray-900 dark:text-white"
              >
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
        <div className="flex-1 overflow-y-auto min-h-0 p-0 modal-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

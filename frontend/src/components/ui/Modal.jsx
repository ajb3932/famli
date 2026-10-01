import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Glass dialog. Slides up as a bottom sheet on phones and scales in as a
 * centred card on larger screens. Traps focus and restores it on close.
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return undefined;
    }
    if (!mounted) return undefined;
    setClosing(true);
    const timer = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!mounted) return undefined;
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    const first = panel?.querySelector('[data-autofocus]') ?? panel?.querySelector('input, select, textarea');
    (first ?? panel)?.focus();

    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbar}px`;

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
      } else if (e.key === 'Tab' && panel) {
        const items = [...panel.querySelectorAll(FOCUSABLE)];
        if (!items.length) return;
        const [firstItem, lastItem] = [items[0], items[items.length - 1]];
        if (e.shiftKey && document.activeElement === firstItem) {
          e.preventDefault();
          lastItem.focus();
        } else if (!e.shiftKey && document.activeElement === lastItem) {
          e.preventDefault();
          firstItem.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      previouslyFocused?.focus?.();
    };
  }, [mounted]);

  if (!mounted) return null;

  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className={`absolute inset-0 bg-slate-950/35 backdrop-blur-[3px] ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
        onClick={() => onClose?.()}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`glass-strong relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] outline-none sm:rounded-[28px] ${widths[size]} ${
          closing ? 'animate-sheet-down sm:animate-scale-out' : 'animate-sheet-up sm:animate-scale-in'
        }`}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-slate-400/40 sm:hidden" aria-hidden="true" />
        <header className="flex items-start gap-4 px-6 pt-4 pb-2 sm:pt-6">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          <button
            onClick={() => onClose?.()}
            aria-label="Close"
            className="-mr-2 rounded-xl p-2 text-slate-400 transition hover:bg-slate-500/10 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <footer className="flex flex-col-reverse gap-2 border-t border-slate-900/5 px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:flex-row sm:justify-end sm:pb-5 dark:border-white/5">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}

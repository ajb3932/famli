import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const ICONS = {
  success: <CircleCheck className="size-5 text-emerald-500" />,
  error: <CircleAlert className="size-5 text-coral-500" />,
  info: <Info className="size-5 text-brand-500" />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (type, message, { action, duration = 4000 } = {}) => {
      const id = ++nextId.current;
      setToasts((list) => [...list.slice(-2), { id, type, message, action }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      success: (msg, opts) => show('success', msg, opts),
      error: (msg, opts) => show('error', msg, opts),
      info: (msg, opts) => show('info', msg, opts),
      dismiss,
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[70] flex flex-col items-center gap-2 px-4 md:bottom-6"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              className="glass-strong pointer-events-auto flex w-full max-w-sm animate-toast-in items-center gap-3 rounded-2xl py-3 pr-2 pl-4 text-sm font-medium"
            >
              {ICONS[toast.type]}
              <span className="flex-1">{toast.message}</span>
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action.onClick();
                    dismiss(toast.id);
                  }}
                  className="rounded-lg px-2.5 py-1.5 font-semibold text-brand-600 transition hover:bg-brand-500/10 dark:text-brand-300"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-500/10 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

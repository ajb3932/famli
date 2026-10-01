import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

const ConfirmContext = createContext(null);

/** `const ok = await confirm({ title, message, confirmLabel, tone })` */
export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context;
};

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [open, setOpen] = useState(false);
  const resolver = useRef(null);

  const confirm = useCallback((options) => {
    setDialog(options);
    setOpen(true);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (result) => {
    setOpen(false);
    resolver.current?.(result);
    resolver.current = null;
  };

  const danger = dialog?.tone !== 'neutral';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={open}
        onClose={() => settle(false)}
        size="sm"
        title={dialog?.title ?? 'Are you sure?'}
        footer={
          <>
            <Button variant="secondary" onClick={() => settle(false)}>
              Cancel
            </Button>
            <Button variant={danger ? 'danger' : 'primary'} onClick={() => settle(true)} data-autofocus>
              {dialog?.confirmLabel ?? 'Confirm'}
            </Button>
          </>
        }
      >
        <div className="flex gap-4">
          {danger && (
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-coral-500/12 text-coral-500">
              <TriangleAlert className="size-5" />
            </div>
          )}
          <p className="pt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{dialog?.message}</p>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

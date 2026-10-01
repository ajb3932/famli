import { useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useOnline } from '../../lib/hooks';
import { useToast } from '../../context/ToastContext';

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+5.5rem)] z-50 flex justify-center px-4">
      <div
        role="status"
        className="glass-strong flex animate-toast-in items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300"
      >
        <WifiOff className="size-4" /> You're offline — changes can't be saved right now
      </div>
    </div>
  );
}

const HOUR = 60 * 60 * 1000;

export function PwaUpdatePrompt() {
  const toast = useToast();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => registration.update(), HOUR);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    toast.info('A new version of Famli is ready', {
      duration: 0,
      action: { label: 'Update', onClick: () => updateServiceWorker(true) },
    });
  }, [needRefresh, toast, updateServiceWorker]);

  return null;
}

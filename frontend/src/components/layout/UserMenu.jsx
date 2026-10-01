import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Globe, KeyRound, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar, Badge } from '../ui/misc';
import { Segmented } from '../ui/Field';
import { ChangePasswordModal } from '../account/ChangePasswordModal';

const ROLE_TONE = { admin: 'brand', editor: 'sage', viewer: 'slate' };

export function UserMenu() {
  const { user, logout } = useAuth();
  const { locale, availableLocales, changeLocale } = useLocale();
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const item =
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/8';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl py-1 pr-2 pl-1 transition hover:bg-slate-900/5 dark:hover:bg-white/8"
      >
        <Avatar label={user.username.slice(0, 2).toUpperCase()} color="#5b8a9a" size="sm" />
        <span className="hidden max-w-32 truncate text-sm font-semibold lg:block">{user.username}</span>
        <ChevronDown className={`size-4 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="glass-strong absolute top-full right-0 z-50 mt-2 bg-white! dark:bg-[rgb(22_32_47)]! w-[min(20rem,calc(100vw-2rem))] origin-top-right animate-scale-in rounded-2xl p-2"
        >
          <div className="flex items-center gap-3 px-3 pt-2 pb-3">
            <Avatar label={user.username.slice(0, 2).toUpperCase()} color="#5b8a9a" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900 dark:text-white">{user.username}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
            <Badge tone={ROLE_TONE[user.role]}>{user.role}</Badge>
          </div>

          <div className="space-y-3 border-t border-slate-900/5 px-3 py-3 dark:border-white/8">
            <div>
              <p className="mb-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">Theme</p>
              <Segmented
                label="Theme"
                className="w-full"
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'Auto' },
                ]}
              />
            </div>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                <Globe className="size-3.5" /> Region
              </span>
              <select
                value={locale}
                onChange={(e) => changeLocale(e.target.value)}
                className="w-full rounded-xl border border-slate-200/90 bg-white/75 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-white/10 dark:bg-white/5"
              >
                {availableLocales.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
              <span className="mt-1.5 block text-xs text-slate-400">Sets address labels and date format</span>
            </label>
          </div>

          <div className="border-t border-slate-900/5 pt-2 dark:border-white/8">
            <button
              role="menuitem"
              className={item}
              onClick={() => {
                setOpen(false);
                setPasswordOpen(true);
              }}
            >
              <KeyRound className="size-4.5 text-slate-400" /> Change password
            </button>
            <button role="menuitem" className={`${item} text-coral-600 dark:text-coral-400`} onClick={logout}>
              <LogOut className="size-4.5" /> Sign out
            </button>
          </div>
        </div>
      )}

      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}

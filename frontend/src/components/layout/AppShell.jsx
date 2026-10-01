import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { Activity, House, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

const NAV = [
  { to: '/', label: 'Households', icon: House, match: (p) => p === '/' || p.startsWith('/households') },
  { to: '/people', label: 'People', icon: Users },
  { to: '/users', label: 'Users', icon: ShieldCheck, admin: true },
  { to: '/activity', label: 'Activity', icon: Activity, admin: true },
];

export function AppShell() {
  const { isAdmin } = useAuth();
  const { pathname } = useLocation();
  const items = NAV.filter((n) => !n.admin || isAdmin);
  const isActive = (n) => (n.match ? n.match(pathname) : pathname.startsWith(n.to));

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-white px-3 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-6">
        <div className="glass mx-auto flex h-16 max-w-6xl items-center gap-2 rounded-2xl pr-2 pl-3 sm:pl-4">
          <Link to="/" className="group mr-2 flex items-center gap-2.5" aria-label="Famli home">
            <img
              src="/images/famli-logo.png"
              alt=""
              className="size-10 transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-rotate-6 group-hover:scale-110"
            />
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Famli</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {items.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
                  isActive(n)
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5 dark:bg-white/12 dark:text-white dark:ring-white/10'
                    : 'text-slate-500 hover:bg-slate-900/5 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/6 dark:hover:text-slate-100'
                }`}
              >
                <n.icon className={`size-4.5 ${isActive(n) ? 'text-brand-500 dark:text-brand-300' : ''}`} />
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 pt-8 pb-36 sm:px-6 md:pb-16">
        <div key={pathname} className="animate-fade-up">
          <Outlet />
        </div>
      </main>

      {/* Mobile tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:hidden"
      >
        <div
          className="glass-strong mx-auto grid max-w-md rounded-2xl p-1.5"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((n) => {
            const active = isActive(n);
            return (
              <NavLink
                key={n.to}
                to={n.to}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition-all duration-200 active:scale-95 ${
                  active
                    ? 'bg-brand-500/12 text-brand-600 dark:bg-brand-400/15 dark:text-brand-200'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <n.icon className={`size-5.5 transition-transform duration-300 ${active ? '-translate-y-0.5' : ''}`} />
                {n.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

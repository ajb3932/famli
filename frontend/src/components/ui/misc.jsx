import { ChevronLeft, ChevronRight, CircleAlert, RotateCw, Search, X } from 'lucide-react';
import { initials, safeColor } from '../../lib/format';

export function Spinner({ className = 'size-5' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Avatar({ first, last, label, color = '#64748b', size = 'md', className = '' }) {
  const sizes = {
    xs: 'size-7 text-[10px]',
    sm: 'size-9 text-xs',
    md: 'size-11 text-sm',
    lg: 'size-14 text-lg',
    xl: 'size-20 text-2xl',
  };
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide text-white shadow-sm ring-2 ring-white/80 dark:ring-white/10 ${sizes[size]} ${className}`}
      style={{ background: `linear-gradient(140deg, color-mix(in oklab, ${safeColor(color)} 78%, white), ${safeColor(color)})` }}
      aria-hidden="true"
    >
      {label ?? initials(first, last)}
    </span>
  );
}

export function Badge({ tone = 'slate', children, className = '' }) {
  const tones = {
    slate: 'bg-slate-500/10 text-slate-600 ring-slate-500/15 dark:text-slate-300',
    brand: 'bg-brand-500/12 text-brand-700 ring-brand-500/20 dark:text-brand-200',
    coral: 'bg-coral-500/12 text-coral-600 ring-coral-500/20 dark:text-coral-300',
    sage: 'bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    amber: 'bg-amber-500/14 text-amber-700 ring-amber-500/25 dark:text-amber-300',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`group relative ${className}`}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-brand-500" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="glass h-12 w-full rounded-2xl pr-10 pl-10.5 text-[15px] outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-brand-500/15 dark:placeholder:text-slate-500 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-500/10 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="glass flex animate-fade-up flex-col items-center rounded-3xl px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-brand-500/10 text-brand-500 [&_svg]:size-8">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorNotice({ error, onRetry }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="mb-4 flex animate-fade-in items-center gap-3 rounded-2xl border border-coral-500/25 bg-coral-500/10 px-4 py-3 text-sm text-coral-700 dark:text-coral-300"
    >
      <CircleAlert className="size-5 shrink-0" />
      <span className="flex-1">{error.message || String(error)}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold transition hover:bg-coral-500/10"
        >
          <RotateCw className="size-4" /> Retry
        </button>
      )}
    </div>
  );
}

export function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages } = pagination;
  const btn =
    'glass grid size-10 place-items-center rounded-xl transition hover:scale-105 disabled:pointer-events-none disabled:opacity-40';
  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
      <button className={btn} onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft className="size-5" />
      </button>
      <span className="text-sm font-medium text-slate-600 tabular-nums dark:text-slate-300">
        Page {page} of {pages}
      </span>
      <button className={btn} onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page">
        <ChevronRight className="size-5" />
      </button>
    </nav>
  );
}

/** Staggered entrance animation for list items. */
export const stagger = (index, step = 45, max = 12) => ({
  animationDelay: `${Math.min(index, max) * step}ms`,
});

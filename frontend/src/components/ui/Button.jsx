import { Spinner } from './misc';

const VARIANTS = {
  primary:
    'bg-linear-to-b from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-600/25 ring-1 ring-inset ring-white/15 hover:from-brand-400 hover:to-brand-600 hover:shadow-brand-600/35 dark:from-brand-400 dark:to-brand-600',
  secondary:
    'bg-white/70 text-slate-700 ring-1 ring-slate-900/8 shadow-sm hover:bg-white dark:bg-white/8 dark:text-slate-100 dark:ring-white/10 dark:hover:bg-white/14',
  ghost: 'text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/8',
  danger:
    'bg-linear-to-b from-coral-500 to-coral-600 text-white shadow-lg shadow-coral-600/25 ring-1 ring-inset ring-white/15 hover:from-coral-400 hover:to-coral-600',
  'danger-ghost': 'text-coral-600 hover:bg-coral-500/10 dark:text-coral-400',
};

const SIZES = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-sm',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-[15px]',
  icon: 'size-10 rounded-xl',
  'icon-sm': 'size-8 rounded-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-all duration-200 ease-out select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55 [&_svg]:size-[1.1em] [&_svg]:shrink-0 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : null}
      {children}
    </button>
  );
}

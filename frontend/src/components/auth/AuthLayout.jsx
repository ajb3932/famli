import { ThemeToggle } from '../layout/ThemeToggle';

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <ThemeToggle className="glass fixed top-[calc(env(safe-area-inset-top)+1rem)] right-4" />

      <div className="w-full max-w-md">
        <div className="mb-8 flex animate-fade-up flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="absolute inset-2 rounded-full bg-butter-300/60 blur-2xl dark:bg-amber-300/15" />
            <img src="/images/famli-logo.png" alt="Famli" className="relative size-28 animate-float drop-shadow-xl" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>

        <div className="glass-strong animate-fade-up rounded-[28px] p-6 sm:p-8" style={{ animationDelay: '80ms' }}>
          {children}
        </div>

        {footer && (
          <p
            className="mt-6 animate-fade-up text-center text-xs text-slate-500 dark:text-slate-400"
            style={{ animationDelay: '160ms' }}
          >
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}

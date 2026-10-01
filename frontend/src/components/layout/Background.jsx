// Slowly drifting colour fields in the logo's palette, sitting behind the
// glass surfaces so the blur has something to refract.
export function Background() {
  const blob = 'absolute rounded-full blur-[72px] will-change-transform animate-blob';
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className={`${blob} -top-48 -left-40 size-[36rem] bg-coral-300/45 dark:bg-coral-500/16`} />
      <div
        className={`${blob} top-[18%] -right-48 size-[40rem] bg-brand-300/50 dark:bg-brand-500/22`}
        style={{ animationDelay: '-9s' }}
      />
      <div
        className={`${blob} -bottom-56 left-[18%] size-[38rem] bg-sage-400/30 dark:bg-emerald-600/12`}
        style={{ animationDelay: '-17s' }}
      />
      <div
        className={`${blob} top-[45%] left-[38%] size-[22rem] bg-butter-300/45 dark:bg-amber-300/6`}
        style={{ animationDelay: '-4s' }}
      />
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(rgb(100 116 139 / 0.35) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)',
        }}
      />
    </div>
  );
}

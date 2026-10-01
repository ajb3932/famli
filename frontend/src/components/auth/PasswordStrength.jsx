import { passwordScore } from '../../lib/forms';

const LEVELS = [
  { label: 'Too short', color: 'bg-coral-500' },
  { label: 'Weak', color: 'bg-coral-500' },
  { label: 'Fair', color: 'bg-amber-500' },
  { label: 'Good', color: 'bg-emerald-500' },
  { label: 'Strong', color: 'bg-emerald-500' },
];

export function PasswordStrength({ password }) {
  if (!password) return null;
  const score = password.length < 8 ? 0 : passwordScore(password);
  const level = LEVELS[score];
  return (
    <div className="mt-2 flex animate-fade-in items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i <= Math.max(score, 1) ? level.color : 'bg-slate-300/50 dark:bg-white/10'
            }`}
          />
        ))}
      </div>
      <span className="w-16 text-right text-xs font-medium text-slate-500 dark:text-slate-400">{level.label}</span>
    </div>
  );
}

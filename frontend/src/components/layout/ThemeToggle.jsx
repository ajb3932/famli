import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ICONS = { light: Sun, dark: Moon, system: Monitor };
const NEXT_LABEL = { light: 'Switch to dark theme', dark: 'Use system theme', system: 'Switch to light theme' };

export function ThemeToggle({ className = '' }) {
  const { mode, cycleMode } = useTheme();
  const Icon = ICONS[mode];
  return (
    <button
      onClick={cycleMode}
      aria-label={NEXT_LABEL[mode]}
      title={NEXT_LABEL[mode]}
      className={`grid size-10 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-900/5 active:scale-90 dark:text-slate-300 dark:hover:bg-white/8 ${className}`}
    >
      <Icon key={mode} className="size-5 animate-scale-in" />
    </button>
  );
}

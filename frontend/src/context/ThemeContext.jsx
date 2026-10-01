import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

const MODES = ['light', 'dark', 'system'];
const THEME_COLORS = { light: '#f7f4ef', dark: '#121b26' };
const media = window.matchMedia('(prefers-color-scheme: dark)');

function readMode() {
  try {
    const saved = localStorage.getItem('theme');
    return MODES.includes(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(readMode);
  const [systemDark, setSystemDark] = useState(media.matches);

  useEffect(() => {
    const listener = (e) => setSystemDark(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[isDark ? 'dark' : 'light']);
    try {
      localStorage.setItem('theme', mode);
    } catch {
      /* ignore */
    }
  }, [isDark, mode]);

  const value = useMemo(
    () => ({
      mode,
      isDark,
      setMode,
      cycleMode: () => setMode((m) => MODES[(MODES.indexOf(m) + 1) % MODES.length]),
    }),
    [mode, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

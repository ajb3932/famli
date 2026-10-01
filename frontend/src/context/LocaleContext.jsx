import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const LocaleContext = createContext(null);

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
};

const FALLBACK = {
  code: 'en-US',
  name: 'United States',
  addressFields: {
    line1: 'Address Line 1',
    line2: 'Address Line 2',
    city: 'City',
    state: 'State',
    postalCode: 'ZIP Code',
    country: 'Country',
  },
};

function initialLocale() {
  try {
    const saved = localStorage.getItem('locale');
    if (saved) return saved;
  } catch {
    /* ignore */
  }
  return navigator.language || FALLBACK.code;
}

export function LocaleProvider({ children }) {
  const { user, updatePreferences } = useAuth();
  const [locale, setLocale] = useState(initialLocale);
  const [available, setAvailable] = useState([FALLBACK]);

  useEffect(() => {
    api
      .get('/config/locales')
      .then((data) => setAvailable(data.locales))
      .catch(() => {});
  }, []);

  // A preference saved on the account wins, so it follows the user across devices.
  const accountLocale = user?.preferences?.locale;
  useEffect(() => {
    if (accountLocale) setLocale(accountLocale);
  }, [accountLocale]);

  const config = available.find((l) => l.code === locale) ?? available.find((l) => l.code === 'en-US') ?? FALLBACK;

  const changeLocale = useCallback(
    (code) => {
      setLocale(code);
      try {
        localStorage.setItem('locale', code);
      } catch {
        /* ignore */
      }
      if (user) updatePreferences({ locale: code }).catch(() => {});
    },
    [user, updatePreferences]
  );

  const value = useMemo(
    () => ({
      locale: config.code,
      localeConfig: config,
      availableLocales: available,
      changeLocale,
      addressLabel: (field) => config.addressFields?.[field] ?? field,
    }),
    [config, available, changeLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

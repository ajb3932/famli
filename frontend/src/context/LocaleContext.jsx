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

function savedLocale() {
  try {
    return localStorage.getItem('locale');
  } catch {
    return null;
  }
}

export function LocaleProvider({ children }) {
  const { user, updatePreferences } = useAuth();
  // Precedence: the account's saved choice, then this device's, then the
  // server default (DEFAULT_LOCALE env var).
  const [locale, setLocale] = useState(savedLocale);
  const [available, setAvailable] = useState([FALLBACK]);
  const [serverDefault, setServerDefault] = useState(FALLBACK.code);

  useEffect(() => {
    api
      .get('/config/locales')
      .then((data) => {
        setAvailable(data.locales);
        if (data.default) setServerDefault(data.default);
      })
      .catch(() => {});
  }, []);

  const accountLocale = user?.preferences?.locale;
  useEffect(() => {
    if (accountLocale) setLocale(accountLocale);
  }, [accountLocale]);

  const active = locale ?? serverDefault;
  const config =
    available.find((l) => l.code === active) ?? available.find((l) => l.code === serverDefault) ?? FALLBACK;

  useEffect(() => {
    document.documentElement.lang = config.code;
  }, [config.code]);

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

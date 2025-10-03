import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const LocaleContext = createContext(null);

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
};

export const LocaleProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('locale') || 'en-US';
  });
  const [localeConfig, setLocaleConfig] = useState(null);
  const [availableLocales, setAvailableLocales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocales = async () => {
      try {
        const data = await fetch('/api/config/locales').then(r => r.json());
        setAvailableLocales(data.locales);

        // Load current locale config
        const currentConfig = data.locales.find(l => l.code === locale);
        setLocaleConfig(currentConfig || data.locales.find(l => l.code === data.default));
      } catch (err) {
        console.error('Failed to load locale config:', err);
        // Fallback config
        setLocaleConfig({
          code: 'en-US',
          name: 'United States',
          addressFields: {
            line1: 'Address Line 1',
            line2: 'Address Line 2',
            city: 'City',
            state: 'State',
            postalCode: 'ZIP Code',
            country: 'Country'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLocales();
  }, []);

  useEffect(() => {
    if (availableLocales.length > 0) {
      const config = availableLocales.find(l => l.code === locale);
      if (config) {
        setLocaleConfig(config);
        localStorage.setItem('locale', locale);
      }
    }
  }, [locale, availableLocales]);

  const changeLocale = (newLocale) => {
    if (availableLocales.find(l => l.code === newLocale)) {
      setLocale(newLocale);
    }
  };

  const value = {
    locale,
    localeConfig,
    availableLocales,
    changeLocale,
    loading,
    getAddressLabel: (field) => {
      return localeConfig?.addressFields?.[field] || field;
    }
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
};

// Locale configuration for country-specific address fields
const LOCALE_CONFIG = {
  'en-US': {
    name: 'United States',
    addressFields: {
      line1: 'Address Line 1',
      line2: 'Address Line 2',
      city: 'City',
      state: 'State',
      postalCode: 'ZIP Code',
      country: 'Country'
    }
  },
  'en-GB': {
    name: 'United Kingdom',
    addressFields: {
      line1: 'Address Line 1',
      line2: 'Address Line 2',
      city: 'Town',
      state: 'County',
      postalCode: 'Postcode',
      country: 'Country'
    }
  },
  'en-CA': {
    name: 'Canada',
    addressFields: {
      line1: 'Address Line 1',
      line2: 'Address Line 2',
      city: 'City',
      state: 'Province',
      postalCode: 'Postal Code',
      country: 'Country'
    }
  },
  'en-AU': {
    name: 'Australia',
    addressFields: {
      line1: 'Address Line 1',
      line2: 'Address Line 2',
      city: 'City',
      state: 'State',
      postalCode: 'Postcode',
      country: 'Country'
    }
  }
};

const SUPPORTED_LOCALES = Object.keys(LOCALE_CONFIG);

// Server-wide default, e.g. DEFAULT_LOCALE=en-GB. Users can still pick their own.
const DEFAULT_LOCALE = SUPPORTED_LOCALES.includes(process.env.DEFAULT_LOCALE) ? process.env.DEFAULT_LOCALE : 'en-US';
if (process.env.DEFAULT_LOCALE && DEFAULT_LOCALE !== process.env.DEFAULT_LOCALE) {
  console.warn(`Unsupported DEFAULT_LOCALE "${process.env.DEFAULT_LOCALE}", using en-US. Supported: ${SUPPORTED_LOCALES.join(', ')}`);
}

function getLocaleConfig(locale) {
  return LOCALE_CONFIG[locale] || LOCALE_CONFIG[DEFAULT_LOCALE];
}

function isValidLocale(locale) {
  return SUPPORTED_LOCALES.includes(locale);
}

module.exports = {
  LOCALE_CONFIG,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  getLocaleConfig,
  isValidLocale
};

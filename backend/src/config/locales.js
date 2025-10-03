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

const DEFAULT_LOCALE = 'en-US';
const SUPPORTED_LOCALES = Object.keys(LOCALE_CONFIG);

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

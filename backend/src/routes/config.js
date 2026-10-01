const express = require('express');
const { SUPPORTED_LOCALES, getLocaleConfig, isValidLocale, DEFAULT_LOCALE } = require('../config/locales');
const { HttpError } = require('../lib/http');

module.exports = function configRoutes() {
  const router = express.Router();

  router.get('/locales', (req, res) => {
    res.set('Cache-Control', 'public, max-age=3600');
    res.json({
      supported: SUPPORTED_LOCALES,
      default: DEFAULT_LOCALE,
      locales: SUPPORTED_LOCALES.map((code) => ({ code, ...getLocaleConfig(code) })),
    });
  });

  router.get('/locales/:code', (req, res) => {
    const { code } = req.params;
    if (!isValidLocale(code)) throw new HttpError(404, 'Locale not found');
    res.json({ code, ...getLocaleConfig(code) });
  });

  return router;
};

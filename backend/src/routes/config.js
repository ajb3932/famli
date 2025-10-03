const express = require('express');
const { SUPPORTED_LOCALES, getLocaleConfig, DEFAULT_LOCALE } = require('../config/locales');

const router = express.Router();

// Get supported locales
router.get('/locales', (req, res) => {
  res.json({
    supported: SUPPORTED_LOCALES,
    default: DEFAULT_LOCALE,
    locales: SUPPORTED_LOCALES.map(code => ({
      code,
      ...getLocaleConfig(code)
    }))
  });
});

// Get specific locale configuration
router.get('/locales/:code', (req, res) => {
  const { code } = req.params;
  const config = getLocaleConfig(code);

  if (!config) {
    return res.status(404).json({ error: 'Locale not found' });
  }

  res.json({ code, ...config });
});

module.exports = router;

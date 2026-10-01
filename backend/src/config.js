const path = require('path');

require('dotenv').config({ quiet: true });

function parseTrustProxy(value) {
  if (value === undefined || value === '' || value === 'false') return false;
  if (value === 'true') return true;
  if (/^\d+$/.test(value)) return Number(value);
  // Comma separated list of subnets / keywords ("loopback", "uniquelocal", ...)
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}

function parseCookieSecure(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return 'auto';
}

const env = process.env.NODE_ENV || 'development';

const config = {
  env,
  isProduction: env === 'production',
  isTest: env === 'test',
  port: Number(process.env.PORT) || 3000,
  dbPath: path.resolve(process.env.DB_PATH || path.join(__dirname, '../data/famli.db')),
  frontendDist: path.resolve(process.env.FRONTEND_DIST || path.join(__dirname, '../frontend/dist')),

  // Express "trust proxy" setting. Needed behind a reverse proxy so rate
  // limiting sees real client IPs and secure cookies work over TLS.
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),

  // 'auto' marks cookies Secure whenever the request arrived over HTTPS.
  cookieSecure: parseCookieSecure(process.env.COOKIE_SECURE),

  session: {
    cookieName: 'famli_session',
    // Sliding idle timeout and a hard absolute lifetime.
    idleTtlMs: 30 * 24 * 60 * 60 * 1000,
    absoluteTtlMs: 180 * 24 * 60 * 60 * 1000,
    // Only write "last seen" back to the DB this often per session.
    touchIntervalMs: 60 * 60 * 1000,
  },

  bcryptRounds: 12,
};

module.exports = config;

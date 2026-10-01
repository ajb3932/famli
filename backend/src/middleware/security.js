const { HttpError } = require('../lib/http');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// CSRF defence in depth (session cookies are already SameSite=Strict):
//  1. Browsers send Sec-Fetch-Site; only accept same-origin requests.
//  2. Older browsers: fall back to comparing Origin with the Host header.
//  3. State-changing requests with a body must be JSON, which a cross-site
//     HTML form cannot produce without a CORS preflight.
function csrfGuard(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const fetchSite = req.get('sec-fetch-site');
  if (fetchSite) {
    if (fetchSite !== 'same-origin' && fetchSite !== 'none') {
      return next(new HttpError(403, 'Cross-site request blocked'));
    }
  } else {
    const origin = req.get('origin');
    if (origin && origin !== 'null') {
      let originHost;
      try {
        originHost = new URL(origin).host;
      } catch {
        return next(new HttpError(403, 'Cross-site request blocked'));
      }
      const hosts = [req.get('host'), req.get('x-forwarded-host')].filter(Boolean);
      if (!hosts.includes(originHost)) {
        return next(new HttpError(403, 'Cross-site request blocked'));
      }
    } else if (origin === 'null') {
      return next(new HttpError(403, 'Cross-site request blocked'));
    }
  }

  const hasBody = Number(req.get('content-length') || 0) > 0 || req.get('transfer-encoding');
  if (hasBody && !req.is('application/json')) {
    return next(new HttpError(415, 'Content-Type must be application/json'));
  }

  next();
}

module.exports = { csrfGuard };

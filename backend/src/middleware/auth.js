const config = require('../config');
const { findSession } = require('../lib/sessions');
const { HttpError } = require('../lib/http');

// Attaches req.user / req.sessionId when a valid session cookie is present.
// The user row is re-read on every request, so role changes, deletions and
// logouts take effect immediately.
const loadSession = (db) => (req, res, next) => {
  const token = req.cookies?.[config.session.cookieName];
  if (token) {
    const found = findSession(db, token);
    if (found) {
      req.user = found.user;
      req.sessionId = found.sessionId;
      req.sessionToken = token;
    }
  }
  next();
};

const requireAuth = (req, res, next) => {
  if (!req.user) return next(new HttpError(401, 'Authentication required'));
  next();
};

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(new HttpError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'Insufficient permissions'));
    next();
  };

module.exports = { loadSession, requireAuth, requireRole };

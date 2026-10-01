const crypto = require('crypto');
const config = require('../config');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function createSession(db, userId, userAgent) {
  const token = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  db.prepare(
    `INSERT INTO sessions (user_id, token_hash, user_agent, created_at, last_seen_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(userId, hashToken(token), userAgent?.slice(0, 255) ?? null, now, now, now + config.session.idleTtlMs);
  return token;
}

// Returns { session, user } for a valid token, sliding the idle expiry forward.
function findSession(db, token) {
  if (typeof token !== 'string' || token.length > 100) return null;

  const row = db
    .prepare(
      `SELECT s.id AS session_id, s.created_at, s.last_seen_at, s.expires_at,
              u.id, u.username, u.email, u.role, u.preferences
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .get(hashToken(token));
  if (!row) return null;

  const now = Date.now();
  const hardLimit = row.created_at + config.session.absoluteTtlMs;
  if (row.expires_at <= now || hardLimit <= now) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(row.session_id);
    return null;
  }

  if (now - row.last_seen_at > config.session.touchIntervalMs) {
    db.prepare('UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?').run(
      now,
      Math.min(now + config.session.idleTtlMs, hardLimit),
      row.session_id
    );
  }

  return {
    sessionId: row.session_id,
    user: {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      preferences: parsePreferences(row.preferences),
    },
  };
}

function destroySession(db, token) {
  if (typeof token === 'string') {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
  }
}

function destroyUserSessions(db, userId, { exceptSessionId } = {}) {
  db.prepare('DELETE FROM sessions WHERE user_id = ? AND id IS NOT ?').run(userId, exceptSessionId ?? null);
}

function purgeExpiredSessions(db) {
  const now = Date.now();
  return db
    .prepare('DELETE FROM sessions WHERE expires_at <= ? OR created_at <= ?')
    .run(now, now - config.session.absoluteTtlMs).changes;
}

function parsePreferences(raw) {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function cookieOptions(req) {
  const secure = config.cookieSecure === 'auto' ? req.secure : config.cookieSecure;
  return {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/api',
  };
}

function setSessionCookie(req, res, token) {
  res.cookie(config.session.cookieName, token, {
    ...cookieOptions(req),
    maxAge: config.session.idleTtlMs,
  });
}

function clearSessionCookie(req, res) {
  res.clearCookie(config.session.cookieName, cookieOptions(req));
}

module.exports = {
  createSession,
  findSession,
  destroySession,
  destroyUserSessions,
  purgeExpiredSessions,
  parsePreferences,
  setSessionCookie,
  clearSessionCookie,
};

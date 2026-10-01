const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const schemas = require('../lib/schemas');
const { HttpError, parse } = require('../lib/http');
const { audit } = require('../lib/audit');
const {
  createSession,
  destroySession,
  destroyUserSessions,
  parsePreferences,
  setSessionCookie,
  clearSessionCookie,
} = require('../lib/sessions');
const { requireAuth } = require('../middleware/auth');

// Compared against when the username doesn't exist, so response timing
// doesn't reveal which usernames are valid.
let dummyHash;
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync('famli-timing-equaliser', config.bcryptRounds));

const publicUser = (u) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  role: u.role,
  preferences: typeof u.preferences === 'string' ? parsePreferences(u.preferences) : u.preferences || {},
});

module.exports = function authRoutes(db, { loginLimit = 10 } = {}) {
  const router = express.Router();

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: loginLimit,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many sign-in attempts. Please try again in a few minutes.' },
  });

  const countUsers = () => db.prepare('SELECT COUNT(*) AS count FROM users').get().count;

  // Single boot call for the SPA: is setup needed, and who am I?
  router.get('/status', (req, res) => {
    res.json({
      setupRequired: countUsers() === 0,
      user: req.user ? publicUser(req.user) : null,
    });
  });

  router.post('/setup', loginLimiter, async (req, res) => {
    const data = parse(schemas.setup, req.body);
    if (countUsers() > 0) throw new HttpError(409, 'Setup has already been completed');

    const passwordHash = await bcrypt.hash(data.password, config.bcryptRounds);

    // better-sqlite3 transactions are synchronous, so two concurrent setup
    // requests cannot both create an admin.
    const user = db.transaction(() => {
      if (countUsers() > 0) throw new HttpError(409, 'Setup has already been completed');
      const { lastInsertRowid } = db
        .prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)')
        .run(data.username, data.email, passwordHash, 'admin');
      audit(db, { userId: lastInsertRowid, action: 'SETUP', entityType: 'user', entityId: lastInsertRowid });
      return db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid);
    })();

    setSessionCookie(req, res, createSession(db, user.id, req.get('user-agent')));
    res.status(201).json({ user: publicUser(user) });
  });

  router.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = parse(schemas.login, req.body);
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    const valid = await bcrypt.compare(password, user?.password_hash ?? getDummyHash());
    if (!user || !valid) {
      audit(db, {
        userId: user?.id,
        action: 'LOGIN_FAILED',
        entityType: 'auth',
        details: { username: username.slice(0, 50), ip: req.ip },
      });
      throw new HttpError(401, 'Invalid username or password');
    }

    // Transparently upgrade hashes created with a lower work factor (1.x used 10).
    if (bcrypt.getRounds(user.password_hash) < config.bcryptRounds) {
      const upgraded = await bcrypt.hash(password, config.bcryptRounds);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(upgraded, user.id);
    }

    // Replace any session the browser already had (prevents fixation).
    destroySession(db, req.sessionToken);
    setSessionCookie(req, res, createSession(db, user.id, req.get('user-agent')));
    audit(db, { userId: user.id, action: 'LOGIN', entityType: 'auth', details: { ip: req.ip } });
    res.json({ user: publicUser(user) });
  });

  router.post('/logout', (req, res) => {
    destroySession(db, req.sessionToken);
    clearSessionCookie(req, res);
    res.status(204).end();
  });

  router.post('/password', requireAuth, loginLimiter, async (req, res) => {
    const { currentPassword, newPassword } = parse(schemas.changePassword, req.body);
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);

    if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
      throw new HttpError(400, 'Current password is incorrect', { currentPassword: ['Incorrect password'] });
    }

    const hash = await bcrypt.hash(newPassword, config.bcryptRounds);
    db.transaction(() => {
      db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        hash,
        req.user.id
      );
      // Sign out every other device.
      destroyUserSessions(db, req.user.id, { exceptSessionId: req.sessionId });
      audit(db, { userId: req.user.id, action: 'PASSWORD_CHANGE', entityType: 'user', entityId: req.user.id });
    })();

    res.status(204).end();
  });

  return router;
};

module.exports.publicUser = publicUser;

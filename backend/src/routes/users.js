const express = require('express');
const bcrypt = require('bcryptjs');
const config = require('../config');
const schemas = require('../lib/schemas');
const { HttpError, parse, paginate } = require('../lib/http');
const { audit } = require('../lib/audit');
const { destroyUserSessions } = require('../lib/sessions');
const { requireAuth, requireRole } = require('../middleware/auth');
const { publicUser } = require('./auth');

const USER_COLUMNS = 'id, username, email, role, created_at, updated_at';

function rethrowUnique(err) {
  if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    throw new HttpError(409, 'That username or email is already in use');
  }
  throw err;
}

module.exports = function userRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  const adminOnly = requireRole('admin');
  const adminCount = () => db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get().n;
  const getUser = (id) => db.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`).get(id);

  // ---- Current user ----------------------------------------------------------

  router.get('/me', (req, res) => {
    res.json(publicUser(req.user));
  });

  router.put('/me/preferences', (req, res) => {
    const updates = parse(schemas.preferences, req.body);
    const preferences = { ...req.user.preferences, ...updates };
    db.prepare('UPDATE users SET preferences = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      JSON.stringify(preferences),
      req.user.id
    );
    res.json({ preferences });
  });

  // ---- Administration --------------------------------------------------------

  router.get('/', adminOnly, (req, res) => {
    res.json(db.prepare(`SELECT ${USER_COLUMNS} FROM users ORDER BY username COLLATE NOCASE`).all());
  });

  router.post('/', adminOnly, async (req, res) => {
    const data = parse(schemas.createUser, req.body);
    const passwordHash = await bcrypt.hash(data.password, config.bcryptRounds);

    let id;
    try {
      id = db.transaction(() => {
        const { lastInsertRowid } = db
          .prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)')
          .run(data.username, data.email, passwordHash, data.role);
        audit(db, {
          userId: req.user.id,
          action: 'CREATE',
          entityType: 'user',
          entityId: lastInsertRowid,
          details: { username: data.username, role: data.role },
        });
        return lastInsertRowid;
      })();
    } catch (err) {
      rethrowUnique(err);
    }
    res.status(201).json(getUser(id));
  });

  router.put('/:id', adminOnly, async (req, res) => {
    const id = parse(schemas.id, req.params.id);
    const data = parse(schemas.updateUser, req.body);
    const existing = getUser(id);
    if (!existing) throw new HttpError(404, 'User not found');

    const passwordHash = data.password ? await bcrypt.hash(data.password, config.bcryptRounds) : undefined;

    try {
      db.transaction(() => {
        if (data.role && data.role !== 'admin' && existing.role === 'admin' && adminCount() <= 1) {
          throw new HttpError(400, 'There must always be at least one admin');
        }

        const sets = [];
        const params = {};
        for (const field of ['username', 'email', 'role']) {
          if (data[field] !== undefined) {
            sets.push(`${field} = @${field}`);
            params[field] = data[field];
          }
        }
        if (passwordHash) {
          sets.push('password_hash = @password_hash');
          params.password_hash = passwordHash;
        }
        db.prepare(`UPDATE users SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`).run({
          ...params,
          id,
        });

        // A password reset by an admin signs that user out everywhere.
        if (passwordHash) {
          destroyUserSessions(db, id, { exceptSessionId: id === req.user.id ? req.sessionId : undefined });
        }

        audit(db, {
          userId: req.user.id,
          action: 'UPDATE',
          entityType: 'user',
          entityId: id,
          details: {
            username: data.username ?? existing.username,
            ...(data.role && data.role !== existing.role && { role: data.role }),
            ...(passwordHash && { password_reset: true }),
          },
        });
      })();
    } catch (err) {
      rethrowUnique(err);
    }

    res.json(getUser(id));
  });

  router.delete('/:id', adminOnly, (req, res) => {
    const id = parse(schemas.id, req.params.id);
    if (id === req.user.id) throw new HttpError(400, 'You cannot delete your own account');

    const user = getUser(id);
    if (!user) throw new HttpError(404, 'User not found');

    db.transaction(() => {
      if (user.role === 'admin' && adminCount() <= 1) {
        throw new HttpError(400, 'There must always be at least one admin');
      }
      // Sessions are removed by ON DELETE CASCADE.
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      audit(db, {
        userId: req.user.id,
        action: 'DELETE',
        entityType: 'user',
        entityId: id,
        details: { username: user.username },
      });
    })();
    res.status(204).end();
  });

  // ---- Audit log ---------------------------------------------------------------

  const auditQuery = schemas.listQuery(50, 200);

  router.get('/audit/log', adminOnly, (req, res) => {
    const { page, limit } = parse(auditQuery, req.query);
    const { total } = db.prepare('SELECT COUNT(*) AS total FROM audit_log').get();
    const logs = db
      .prepare(
        `SELECT a.*, u.username FROM audit_log a
         LEFT JOIN users u ON u.id = a.user_id
         ORDER BY a.id DESC LIMIT ? OFFSET ?`
      )
      .all(limit, (page - 1) * limit)
      .map((log) => {
        let details = null;
        try {
          details = log.details ? JSON.parse(log.details) : null;
        } catch {
          details = { raw: log.details };
        }
        return { ...log, details };
      });

    res.json({ logs, pagination: paginate(total, page, limit) });
  });

  return router;
};

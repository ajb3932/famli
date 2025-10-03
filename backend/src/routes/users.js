const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database/schema');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all users (admin only)
router.get('/', authorizeRole('admin'), (req, res) => {
  db.all('SELECT id, username, email, role, created_at, updated_at FROM users ORDER BY username ASC', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Get current user profile
router.get('/me', (req, res) => {
  db.get('SELECT id, username, email, role, preferences, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ...user,
      preferences: user.preferences ? JSON.parse(user.preferences) : {}
    });
  });
});

// Update current user preferences
router.put('/me/preferences', (req, res) => {
  const { preferences } = req.body;

  db.run(
    'UPDATE users SET preferences = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [JSON.stringify(preferences), req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update preferences' });
      }

      res.json({ message: 'Preferences updated successfully', preferences });
    }
  );
});

// Create user (admin only)
router.post('/', authorizeRole('admin'), async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  if (!['admin', 'editor', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, role],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Failed to create user' });
        }

        // Log audit
        db.run(
          'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
          [req.user.id, 'CREATE', 'user', this.lastID, JSON.stringify({ username, role })]
        );

        res.status(201).json({
          id: this.lastID,
          username,
          email,
          role,
          message: 'User created successfully'
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user (admin only)
router.put('/:id', authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { username, email, role, password } = req.body;

  // Build update query dynamically
  const updates = [];
  const params = [];

  if (username) {
    updates.push('username = ?');
    params.push(username);
  }
  if (email) {
    updates.push('email = ?');
    params.push(email);
  }
  if (role) {
    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    updates.push('role = ?');
    params.push(role);
  }
  if (password) {
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    updates.push('password_hash = ?');
    params.push(passwordHash);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  db.run(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        return res.status(500).json({ error: 'Failed to update user' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log audit
      db.run(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, 'UPDATE', 'user', id, JSON.stringify({ username, role })]
      );

      db.get('SELECT id, username, email, role FROM users WHERE id = ?', [id], (err, user) => {
        res.json(user);
      });
    }
  );
});

// Delete user (admin only)
router.delete('/:id', authorizeRole('admin'), (req, res) => {
  const { id } = req.params;

  // Prevent deleting yourself
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  db.get('SELECT username FROM users WHERE id = ?', [id], (err, user) => {
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete user' });
      }

      // Log audit
      db.run(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, 'DELETE', 'user', id, JSON.stringify({ username: user.username })]
      );

      res.json({ message: 'User deleted successfully' });
    });
  });
});

// Get audit log (admin only)
router.get('/audit/log', authorizeRole('admin'), (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  db.get('SELECT COUNT(*) as total FROM audit_log', (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    db.all(
      `SELECT a.*, u.username
       FROM audit_log a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)],
      (err, logs) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          logs: logs.map(log => ({
            ...log,
            details: log.details ? JSON.parse(log.details) : null
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult.total,
            pages: Math.ceil(countResult.total / limit)
          }
        });
      }
    );
  });
});

module.exports = router;

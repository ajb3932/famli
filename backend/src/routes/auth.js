const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database/schema');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');

const router = express.Router();

// Check if first run (no users exist)
router.get('/first-run', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ isFirstRun: row.count === 0 });
  });
});

// First-run setup - create initial admin user
router.post('/setup', async (req, res) => {
  const { username, email, password } = req.body;

  // Check if already setup
  db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (row.count > 0) {
      return res.status(400).json({ error: 'Setup already completed' });
    }

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
      const passwordHash = await bcrypt.hash(password, 10);

      db.run(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [username, email, passwordHash, 'admin'],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
          }

          const tokens = generateTokens({
            id: this.lastID,
            username,
            role: 'admin'
          });

          // Store session
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          db.run(
            'INSERT INTO user_sessions (user_id, token, refresh_token, expires_at) VALUES (?, ?, ?, ?)',
            [this.lastID, tokens.accessToken, tokens.refreshToken, expiresAt]
          );

          res.status(201).json({
            message: 'Setup completed successfully',
            user: { id: this.lastID, username, email, role: 'admin' },
            ...tokens
          });
        }
      );
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const tokens = generateTokens({
        id: user.id,
        username: user.username,
        role: user.role
      });

      // Store session
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      db.run(
        'INSERT INTO user_sessions (user_id, token, refresh_token, expires_at) VALUES (?, ?, ?, ?)',
        [user.id, tokens.accessToken, tokens.refreshToken, expiresAt],
        (err) => {
          if (err) {
            console.error('Failed to store session:', err);
          }
        }
      );

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          preferences: user.preferences ? JSON.parse(user.preferences) : {}
        },
        ...tokens
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Refresh token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = await verifyRefreshToken(refreshToken);

    // Check if session exists and is valid
    db.get(
      'SELECT * FROM user_sessions WHERE refresh_token = ? AND expires_at > datetime("now")',
      [refreshToken],
      (err, session) => {
        if (err || !session) {
          return res.status(403).json({ error: 'Invalid refresh token' });
        }

        // Get user data
        db.get('SELECT * FROM users WHERE id = ?', [session.user_id], (err, user) => {
          if (err || !user) {
            return res.status(403).json({ error: 'User not found' });
          }

          const tokens = generateTokens({
            id: user.id,
            username: user.username,
            role: user.role
          });

          // Update session with new tokens
          db.run(
            'UPDATE user_sessions SET token = ?, refresh_token = ? WHERE id = ?',
            [tokens.accessToken, tokens.refreshToken, session.id]
          );

          res.json(tokens);
        });
      }
    );
  } catch (err) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    db.run('DELETE FROM user_sessions WHERE refresh_token = ?', [refreshToken]);
  }

  res.json({ message: 'Logged out successfully' });
});

module.exports = router;

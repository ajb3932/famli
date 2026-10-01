const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { request, setupApp } = require('./helpers');
const { openDatabase } = require('../src/database');

// Recreates the on-disk schema written by Famli 1.x (sqlite3 driver, no
// user_version, foreign keys off) and checks it upgrades cleanly.
test('a Famli 1.x database is migrated in place and existing users can sign in', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'famli-'));
  const file = path.join(dir, 'famli.db');

  const legacy = new Database(file);
  legacy.pragma('foreign_keys = OFF'); // the old sqlite3 driver never enabled them
  legacy.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'viewer',
      preferences TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE user_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL, refresh_token TEXT UNIQUE NOT NULL, expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);
    CREATE TABLE households (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, address_line1 TEXT,
      address_line2 TEXT, city TEXT, state TEXT, postal_code TEXT, country TEXT, notes TEXT,
      color_theme TEXT DEFAULT '#3b82f6', created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE household_members (id INTEGER PRIMARY KEY AUTOINCREMENT, household_id INTEGER NOT NULL,
      first_name TEXT NOT NULL, last_name TEXT, role TEXT, birthday DATE, email TEXT, phone TEXT, notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE);
    CREATE TABLE audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, action TEXT NOT NULL,
      entity_type TEXT NOT NULL, entity_id INTEGER, details TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL);
  `);
  legacy
    .prepare("INSERT INTO users (username, email, password_hash, role) VALUES ('alex', 'a@example.com', ?, 'admin')")
    .run(bcrypt.hashSync('legacy-password', 10));
  legacy.exec(`
    INSERT INTO user_sessions (user_id, token, refresh_token, expires_at) VALUES (1, 'jwt', 'refresh', '2099-01-01');
    INSERT INTO households (name) VALUES ('Kept');
    INSERT INTO household_members (household_id, first_name) VALUES (1, 'Kept member');
    INSERT INTO household_members (household_id, first_name) VALUES (42, 'Orphan');
  `);
  legacy.close();

  const db = openDatabase(file);
  assert.equal(db.pragma('user_version', { simple: true }), 3);
  assert.equal(db.pragma('foreign_keys', { simple: true }), 1);
  assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name = 'user_sessions'").get(), undefined);
  assert.deepEqual(
    db.prepare('SELECT first_name FROM household_members').all().map((r) => r.first_name),
    ['Kept member']
  );

  const { app } = setupApp({ db });
  const res = await request(app).post('/api/auth/login').send({ username: 'alex', password: 'legacy-password' });
  assert.equal(res.status, 200);

  // Re-opening is a no-op.
  db.close();
  openDatabase(file).close();
  fs.rmSync(dir, { recursive: true, force: true });
});

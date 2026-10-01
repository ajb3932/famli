// Ordered schema migrations. Each runs once inside a transaction and bumps
// PRAGMA user_version. Never edit a released migration - add a new one.
module.exports = [
  {
    version: 1,
    name: 'baseline schema (matches Famli 1.x)',
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'viewer',
          preferences TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS households (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          address_line1 TEXT,
          address_line2 TEXT,
          city TEXT,
          state TEXT,
          postal_code TEXT,
          country TEXT,
          notes TEXT,
          color_theme TEXT DEFAULT '#3b82f6',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS household_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          household_id INTEGER NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT,
          role TEXT,
          birthday DATE,
          email TEXT,
          phone TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS audit_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id INTEGER,
          details TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_households_name ON households(name);
        CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);
        CREATE INDEX IF NOT EXISTS idx_household_members_name ON household_members(first_name, last_name);
        CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
      `);
    },
  },
  {
    version: 2,
    name: 'server-side sessions, data integrity clean-up',
    up(db) {
      // 1.x stored JWTs (in plaintext) here. Sessions are now opaque random
      // tokens stored as SHA-256 hashes; everyone signs in again once.
      db.exec(`
        DROP TABLE IF EXISTS user_sessions;

        CREATE TABLE sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          user_agent TEXT,
          created_at INTEGER NOT NULL,
          last_seen_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        );
        CREATE INDEX idx_sessions_user_id ON sessions(user_id);
        CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
        CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

        -- 1.x never enabled foreign keys, so cascades did not fire.
        DELETE FROM household_members
          WHERE household_id NOT IN (SELECT id FROM households);
        UPDATE audit_log SET user_id = NULL
          WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);
      `);
    },
  },
  {
    version: 3,
    name: 'member nicknames',
    up(db) {
      // "role" (relationship) is no longer shown or edited, but the column is
      // kept so existing data isn't destroyed.
      db.exec('ALTER TABLE household_members ADD COLUMN nickname TEXT;');
    },
  },
];

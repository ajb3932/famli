const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/famli.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'viewer',
          preferences TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // User sessions table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT UNIQUE NOT NULL,
          refresh_token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Households table
      db.run(`
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
        )
      `);

      // Household members table
      db.run(`
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
        )
      `);

      // Audit log table
      db.run(`
        CREATE TABLE IF NOT EXISTS audit_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id INTEGER,
          details TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });

      // Create indexes for better query performance
      db.run('CREATE INDEX IF NOT EXISTS idx_households_name ON households(name)');
      db.run('CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_household_members_name ON household_members(first_name, last_name)');
      db.run('CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)');
    });
  });
};

module.exports = { db, initDatabase };

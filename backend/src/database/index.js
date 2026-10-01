const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const migrations = require('./migrations');

function openDatabase(dbPath) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true, mode: 0o750 });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('busy_timeout = 5000');
  // Without this SQLite silently ignores ON DELETE CASCADE.
  db.pragma('foreign_keys = ON');

  migrate(db);

  if (dbPath !== ':memory:') {
    // The DB holds contact details and password hashes: owner-only access.
    for (const file of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
      try {
        fs.chmodSync(file, 0o600);
      } catch {
        // WAL/SHM files may not exist yet, or the FS may not support chmod.
      }
    }
  }

  return db;
}

function migrate(db) {
  const current = db.pragma('user_version', { simple: true });
  const pending = migrations.filter((m) => m.version > current);

  for (const migration of pending) {
    db.transaction(() => {
      migration.up(db);
      db.pragma(`user_version = ${migration.version}`);
    })();
    if (process.env.NODE_ENV !== 'test') console.log(`Applied database migration ${migration.version}: ${migration.name}`);
  }
}

module.exports = { openDatabase };

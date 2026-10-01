const config = require('./config');
const { openDatabase } = require('./database');
const { createApp } = require('./app');
const { purgeExpiredSessions } = require('./lib/sessions');

let db;
try {
  db = openDatabase(config.dbPath);
} catch (err) {
  console.error(`Failed to open database at ${config.dbPath}: ${err.message}`);
  if (err.code === 'SQLITE_CANTOPEN' || err.code === 'EACCES') {
    console.error(
      `Check that the data directory exists and is writable by UID ${process.getuid?.()}.` +
        ' For Docker: sudo chown -R 1000:1000 ./famli-data'
    );
  }
  process.exit(1);
}

const app = createApp(db);

const server = app.listen(config.port, () => {
  console.log(`Famli listening on port ${config.port} (${config.env})`);
});

const purge = () => {
  const removed = purgeExpiredSessions(db);
  if (removed) console.log(`Purged ${removed} expired session(s)`);
};
purge();
const purgeTimer = setInterval(purge, 60 * 60 * 1000);
purgeTimer.unref();

function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  clearInterval(purgeTimer);
  server.close(() => {
    db.close();
    process.exit(0);
  });
  // Don't hang forever on keep-alive connections.
  setTimeout(() => {
    db.close();
    process.exit(0);
  }, 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

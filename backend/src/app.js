const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { HttpError } = require('./lib/http');
const { loadSession } = require('./middleware/auth');
const { csrfGuard } = require('./middleware/security');

function createApp(db, { apiLimit = 1000, loginLimit = 10, frontendDist = config.frontendDist } = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'"],
          'img-src': ["'self'", 'data:', 'blob:'],
          'font-src': ["'self'", 'data:'],
          'connect-src': ["'self'"],
          'manifest-src': ["'self'"],
          'worker-src': ["'self'"],
          'object-src': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'frame-ancestors': ["'none'"],
          // Many installs are plain HTTP on a LAN; forcing upgrades breaks them.
          'upgrade-insecure-requests': null,
        },
      },
      // Only meaningful over HTTPS and painful to undo; leave to the reverse proxy.
      strictTransportSecurity: false,
    })
  );
  app.use((req, res, next) => {
    res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    next();
  });

  if (!config.isTest) {
    app.use((req, res, next) => {
      const start = process.hrtime.bigint();
      res.on('finish', () => {
        const ms = Number(process.hrtime.bigint() - start) / 1e6;
        console.log(`${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${ms.toFixed(1)}ms`);
      });
      next();
    });
  }

  // ---- API -------------------------------------------------------------------

  const api = express.Router();

  api.get('/health', (req, res) => {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok' });
  });

  api.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: apiLimit,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: 'Too many requests, please slow down.' },
    })
  );
  api.use((req, res, next) => {
    // Personal data: never let browsers or proxies cache API responses.
    res.set('Cache-Control', 'no-store');
    next();
  });
  api.use(cookieParser());
  api.use(csrfGuard);
  api.use(express.json({ limit: '100kb' }));
  api.use(loadSession(db));

  api.use('/auth', require('./routes/auth')(db, { loginLimit }));
  api.use('/households', require('./routes/households')(db));
  api.use('/people', require('./routes/people')(db));
  api.use('/users', require('./routes/users')(db));
  api.use('/config', require('./routes/config')());

  api.use((req, res, next) => next(new HttpError(404, 'Not found')));

  app.use('/api', api);

  // ---- Frontend ----------------------------------------------------------------

  const indexHtml = path.join(frontendDist, 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.use(
      express.static(frontendDist, {
        index: false,
        setHeaders(res, filePath) {
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            // Vite fingerprints these, so they can be cached forever.
            res.set('Cache-Control', 'public, max-age=31536000, immutable');
          } else {
            // index.html, sw.js, manifest: always revalidate so updates ship.
            res.set('Cache-Control', 'no-cache');
          }
        },
      })
    );

    app.get(/^\/(?!api(?:\/|$)).*/, (req, res) => {
      res.set('Cache-Control', 'no-cache');
      res.sendFile(indexHtml);
    });
  }

  // ---- Errors --------------------------------------------------------------------

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message, ...(err.details && { fields: err.details }) });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Malformed JSON body' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body too large' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  });

  return app;
}

module.exports = { createApp };

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const { uploadDir, useCloudinary } = require('./services/upload.service');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet());
  const origins = (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
  app.use(cors({ origin: origins.length ? origins : true }));
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  if (!useCloudinary()) {
    // Uploaded photos/videos. Loaded by the shop from its own domain, hence cross-origin.
    app.use('/uploads', (req, res, next) => {
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      res.set('Content-Security-Policy', "default-src 'none'; img-src 'self'; media-src 'self'");
      next();
    }, express.static(uploadDir(), { maxAge: '30d', immutable: true, index: false, dotfiles: 'deny' }));
  }
  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };

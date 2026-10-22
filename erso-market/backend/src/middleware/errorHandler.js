const mongoose = require('mongoose');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFound(req, res) {
  res.status(404).json({ error: `Nuk u gjet: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ error: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: `Vlerë e pavlefshme për ${err.path}` });
  }
  if (err && err.code === 11000) {
    return res.status(409).json({ error: `Ekziston tashmë: ${Object.keys(err.keyValue || {}).join(', ')}` });
  }

  const status = err.status || 500;
  if (status >= 500) console.error('[error]', err);
  return res.status(status).json({ error: status >= 500 ? 'Gabim në server' : err.message });
}

// Lets async route handlers throw instead of calling next(err) by hand.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { HttpError, notFound, errorHandler, asyncHandler };

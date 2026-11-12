function notFoundHandler(req, res) {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || err.status || 500;
  const message =
    status >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Something went wrong';

  if (status >= 500) {
    console.error('[Server Error]', err);
  }

  res.status(status).json({ error: message });
}

module.exports = { notFoundHandler, errorHandler };


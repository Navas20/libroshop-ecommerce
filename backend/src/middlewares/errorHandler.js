const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  if (statusCode === 500) {
    logger.error(`${err.message} - ${req.method} ${req.originalUrl}`, {
      stack: err.stack,
      body: req.body,
      params: req.params,
      query: req.query
    });
  }

  const response = {
    success: false,
    error: message
  };

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;

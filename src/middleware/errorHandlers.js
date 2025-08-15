const logger = require('../utils/logger');

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  const error = {
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404
  };
  
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json(error);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Determine status code
  let statusCode = err.statusCode || err.status || 500;
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
  } else if (err.code === 'ENOENT') {
    statusCode = 404;
  }

  // Prepare error response
  const errorResponse = {
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    statusCode
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = {
  notFoundHandler,
  errorHandler
};

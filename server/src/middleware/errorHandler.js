/**
 * @module middleware/errorHandler
 * @description Centralized error handling middleware for Express.
 *
 * All errors that are passed to next(err) or thrown in async handlers
 * (via express-async-errors) flow through here. This ensures:
 *  - Consistent error response format across all endpoints
 *  - Structured error logging via Winston
 *  - Sensitive error details hidden from clients in production
 *  - Mongoose and JWT errors converted to user-friendly messages
 *
 * Usage: Mount LAST in the Express middleware chain:
 *   app.use(errorHandler);
 */

const logger = require('../config/logger');
const { sendError } = require('../utils/response.utils');

/**
 * Custom application error class.
 * Use this to throw errors with specific HTTP status codes.
 *
 * @example
 *   throw new AppError('User not found', 404, 'USER_NOT_FOUND');
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {string} [code='APP_ERROR'] - Machine-readable error code
   */
  constructor(message, statusCode, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Marks as expected/handled error
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handles Mongoose CastError (invalid ObjectId, etc.)
 * @param {import('mongoose').CastError} err
 * @returns {AppError}
 */
function handleCastError(err) {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400, 'INVALID_ID');
}

/**
 * Handles Mongoose duplicate key errors (code 11000).
 * @param {object} err
 * @returns {AppError}
 */
function handleDuplicateKeyError(err) {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue?.[field];
  return new AppError(
    `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' is already in use.`,
    409,
    'DUPLICATE_KEY'
  );
}

/**
 * Handles Mongoose validation errors.
 * @param {import('mongoose').Error.ValidationError} err
 * @returns {AppError}
 */
function handleValidationError(err) {
  const details = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
  const appErr = new AppError('Validation failed', 400, 'VALIDATION_ERROR');
  appErr.details = details;
  return appErr;
}

/**
 * Handles expired JWT tokens.
 * @returns {AppError}
 */
function handleJWTExpiredError() {
  return new AppError('Your session has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
}

/**
 * Handles invalid JWT tokens.
 * @returns {AppError}
 */
function handleJWTError() {
  return new AppError('Invalid authentication token. Please log in again.', 401, 'TOKEN_INVALID');
}

/**
 * Express error handling middleware.
 * Signature MUST have 4 parameters for Express to recognize it as an error handler.
 *
 * @param {Error} err - The error
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next - Not used but required in signature
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  // --- Convert known error types to AppError ---

  if (err.name === 'CastError') error = handleCastError(err);
  else if (err.code === 11000) error = handleDuplicateKeyError(err);
  else if (err.name === 'ValidationError') error = handleValidationError(err);
  else if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  else if (err.name === 'JsonWebTokenError') error = handleJWTError();

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const isProd = process.env.NODE_ENV === 'production';

  // --- Structured logging ---
  if (statusCode >= 500) {
    logger.error('Unhandled server error', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
      statusCode,
    });
  } else {
    logger.warn('Client error', {
      error: error.message,
      code,
      url: req.originalUrl,
      method: req.method,
      statusCode,
    });
  }

  // --- Send response ---

  // In production, hide internal error details from clients
  const message = isProd && statusCode >= 500
    ? 'An internal server error occurred. Please try again later.'
    : error.message;

  return sendError(res, message, statusCode, code, error.details || null);
}

module.exports = { errorHandler, AppError };

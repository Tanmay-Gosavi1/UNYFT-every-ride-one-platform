/**
 * @module middleware/auth
 * @description JWT authentication middleware.
 *
 * Verifies the access token from the Authorization header or httpOnly cookie
 * and attaches the decoded user payload to req.user.
 *
 * Two exported middleware functions:
 *  - protect: Requires valid access token (most routes)
 *  - optionalAuth: Attaches user if token present, but does not fail if absent
 *
 * Token delivery:
 *  - Access token: Authorization: Bearer <token>
 *  - Refresh token: httpOnly cookie named 'refreshToken'
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const { AppError } = require('./errorHandler');

/**
 * Extracts the Bearer token from the Authorization header.
 *
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function extractToken(req) {
  const { authorization } = req.headers;
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.split(' ')[1];
  }
  return null;
}

/**
 * Middleware that requires a valid JWT access token.
 * Attaches the full user document to req.user (without sensitive fields).
 *
 * @throws {AppError} 401 if token missing, invalid, or expired
 * @throws {AppError} 401 if the user no longer exists
 */
async function protect(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    throw new AppError('Authentication required. Please log in.', 401, 'NO_TOKEN');
  }

  // jwt.verify throws TokenExpiredError or JsonWebTokenError on failure
  // These are caught and converted by errorHandler middleware
  const decoded = jwt.verify(token, config.jwt.accessSecret);

  // Re-fetch user to ensure account still exists and is active
  const user = await User.findById(decoded.sub).select('-refreshTokens');
  if (!user) {
    throw new AppError('The user belonging to this token no longer exists.', 401, 'USER_NOT_FOUND');
  }
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 401, 'ACCOUNT_INACTIVE');
  }

  req.user = user;
  next();
}

/**
 * Middleware that optionally attaches user from token.
 * Does NOT throw if token is missing — useful for public endpoints
 * that may enhance their response if a user is known.
 */
async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    const user = await User.findById(decoded.sub).select('-refreshTokens');
    if (user && user.isActive) req.user = user;
  } catch {
    // Silently ignore token errors for optional auth
  }
  return next();
}

module.exports = { protect, optionalAuth };

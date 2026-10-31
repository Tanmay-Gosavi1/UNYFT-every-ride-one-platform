/**
 * @module middleware/rateLimiter
 * @description Express rate limiting middleware using express-rate-limit.
 *
 * Different limits are applied to different route groups:
 *  - authLimiter:     Strict — prevents brute-force login/register attacks
 *  - apiLimiter:      General — protects all API endpoints
 *  - estimateLimiter: Tight — ride estimates trigger expensive parallel provider calls
 *  - locationLimiter: Moderate — Google Maps API calls cost money per request
 *
 * In production, use a Redis store (rate-limit-redis) to share state
 * across multiple server instances. For now we use memory store (single instance).
 */

const rateLimit = require('express-rate-limit');
const { RATE_LIMITS, HTTP } = require('../config/constants');
const { sendError } = require('../utils/response.utils');

/**
 * Standard rate limit response handler.
 * Returns our consistent error envelope instead of the default HTML.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function rateLimitHandler(req, res) {
  return sendError(
    res,
    'Too many requests. Please slow down and try again later.',
    HTTP.TOO_MANY_REQUESTS,
    'RATE_LIMIT_EXCEEDED'
  );
}

/**
 * Rate limiter for auth endpoints (login, register, refresh).
 * 20 requests per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  ...RATE_LIMITS.AUTH,
  standardHeaders: true,   // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false,
  message: undefined,      // Handled by handler
});

/**
 * General API rate limiter.
 * 100 requests per 15 minutes per IP.
 */
const apiLimiter = rateLimit({
  ...RATE_LIMITS.API_GENERAL,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Ride estimate rate limiter.
 * 10 requests per minute per IP.
 * Each estimate call fans out to all connected providers — expensive!
 */
const estimateLimiter = rateLimit({
  ...RATE_LIMITS.RIDE_ESTIMATE,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Location/Maps rate limiter.
 * 30 requests per minute per IP.
 * Google Maps API has per-request costs.
 */
const locationLimiter = rateLimit({
  ...RATE_LIMITS.LOCATION,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

module.exports = { authLimiter, apiLimiter, estimateLimiter, locationLimiter };

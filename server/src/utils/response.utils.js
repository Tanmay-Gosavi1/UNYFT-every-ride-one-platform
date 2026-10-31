/**
 * @module utils/response
 * @description Standardized API response helpers.
 * All API responses follow a consistent envelope format:
 *
 *   Success: { success: true, data: {...}, meta: {...} }
 *   Error:   { success: false, error: { code, message, details } }
 *
 * Using helpers here ensures every controller sends the same shape,
 * making client-side parsing predictable.
 */

/**
 * Sends a successful response.
 *
 * @param {import('express').Response} res - Express response object
 * @param {*} data - Payload to return
 * @param {string} [message=''] - Human-readable success message
 * @param {number} [statusCode=200] - HTTP status code
 * @param {object} [meta={}] - Pagination or other metadata
 */
function sendSuccess(res, data, message = '', statusCode = 200, meta = {}) {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== undefined) body.data = data;
  if (Object.keys(meta).length > 0) body.meta = meta;
  return res.status(statusCode).json(body);
}

/**
 * Sends a created (201) response.
 *
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message='Created successfully']
 */
function sendCreated(res, data, message = 'Created successfully') {
  return sendSuccess(res, data, message, 201);
}

/**
 * Sends an error response.
 *
 * @param {import('express').Response} res
 * @param {string} message - Human-readable error message
 * @param {number} [statusCode=500] - HTTP status code
 * @param {string} [code='INTERNAL_ERROR'] - Machine-readable error code
 * @param {*} [details=null] - Validation errors or additional context
 */
function sendError(res, message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
  const body = {
    success: false,
    error: { code, message },
  };
  if (details) body.error.details = details;
  return res.status(statusCode).json(body);
}

/**
 * Builds a paginated meta object for list responses.
 *
 * @param {number} total - Total number of records
 * @param {number} page - Current page (1-indexed)
 * @param {number} limit - Items per page
 * @returns {{ total: number, page: number, limit: number, pages: number, hasNext: boolean, hasPrev: boolean }}
 */
function buildPaginationMeta(total, page, limit) {
  const pages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
}

module.exports = { sendSuccess, sendCreated, sendError, buildPaginationMeta };

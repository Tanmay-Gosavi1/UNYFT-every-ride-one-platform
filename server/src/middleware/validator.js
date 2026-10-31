/**
 * @module middleware/validator
 * @description Request validation middleware factory using Joi.
 *
 * Returns an Express middleware that validates req.body, req.query, or req.params
 * against a Joi schema and returns structured validation errors on failure.
 *
 * @example
 *   const { validate } = require('../middleware/validator');
 *   const { registerSchema } = require('../validators/auth.validator');
 *   router.post('/register', validate(registerSchema), authController.register);
 */

const { AppError } = require('./errorHandler');

/**
 * Creates a validation middleware for the given Joi schema.
 *
 * @param {import('joi').Schema} schema - Joi schema to validate against
 * @param {'body' | 'query' | 'params'} [target='body'] - Which part of request to validate
 * @returns {import('express').RequestHandler}
 */
function validate(schema, target = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,       // Collect all errors, not just first
      stripUnknown: true,      // Remove fields not in schema (prevent pollution)
      convert: true,           // Allow type coercion (e.g., "5" → 5 for numbers)
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''), // Clean up Joi's quotes
      }));
      const appErr = new AppError('Validation failed', 400, 'VALIDATION_ERROR');
      appErr.details = details;
      return next(appErr);
    }

    // Replace the target with the validated (and stripped) value
    req[target] = value;
    return next();
  };
}

module.exports = { validate };

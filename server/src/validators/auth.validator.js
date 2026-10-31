/**
 * @module validators/auth.validator
 * @description Joi schemas for authentication endpoints.
 *
 * Used with the validate() middleware to validate request bodies
 * before they reach controllers. Strips unknown fields automatically.
 */

const Joi = require('joi');

/**
 * POST /api/auth/register
 */
const registerSchema = Joi.object({
  email: Joi.string().email().required().trim().lowercase()
    .messages({ 'string.email': 'Please provide a valid email address' }),
  password: Joi.string().min(8).max(72).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and a digit',
    }),
  firstName: Joi.string().trim().min(1).max(100).required(),
  lastName: Joi.string().trim().max(100).allow('').optional(),
  phone: Joi.string().pattern(/^\+?\d{10,15}$/).optional()
    .messages({ 'string.pattern.base': 'Phone number must be 10-15 digits' }),
});

/**
 * POST /api/auth/login
 */
const loginSchema = Joi.object({
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().required(),
});

/**
 * POST /api/auth/refresh-token
 */
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

/**
 * PUT /api/auth/profile
 */
const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).optional(),
  lastName: Joi.string().trim().max(100).allow('').optional(),
  phone: Joi.string().pattern(/^\+?\d{10,15}$/).optional(),
  avatar: Joi.string().uri().optional(),
  preferences: Joi.object({
    sortBy: Joi.string().valid('price', 'eta', 'rating', 'distance').optional(),
  }).optional(),
}).min(1); // At least one field must be present

module.exports = { registerSchema, loginSchema, refreshTokenSchema, updateProfileSchema };


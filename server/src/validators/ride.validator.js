/**
 * @module validators/ride.validator
 * @description Joi schemas for ride estimation, booking, and tracking endpoints.
 */

const Joi = require('joi');
const { VEHICLE_CATEGORY, PROVIDER, SORT_BY } = require('../config/constants');

/**
 * Reusable coordinate schema.
 */
const coordinateSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required()
    .messages({ 'number.min': 'Latitude must be between -90 and 90' }),
  lng: Joi.number().min(-180).max(180).required()
    .messages({ 'number.min': 'Longitude must be between -180 and 180' }),
  address: Joi.string().max(500).optional(),
});

/**
 * POST /api/rides/estimate
 */
const estimateSchema = Joi.object({
  pickup: coordinateSchema.required(),
  dropoff: coordinateSchema.required(),
  providers: Joi.array()
    .items(Joi.string().valid(...Object.values(PROVIDER)))
    .optional()
    .default([]), // Empty = query all registered providers
  vehicleCategory: Joi.string()
    .valid(...Object.values(VEHICLE_CATEGORY))
    .optional(), // Optional filter
  sortBy: Joi.string()
    .valid(...Object.values(SORT_BY))
    .optional()
    .default(SORT_BY.PRICE),
});

/**
 * POST /api/rides/book
 */
const bookRideSchema = Joi.object({
  provider: Joi.string().valid(...Object.values(PROVIDER)).required(),
  productId: Joi.string().required(),
  fareId: Joi.string().optional(), // Required for Uber/Ola upfront pricing
  pickup: coordinateSchema.required(),
  dropoff: coordinateSchema.required(),
  vehicleCategory: Joi.string()
    .valid(...Object.values(VEHICLE_CATEGORY))
    .optional(),
  providerCategory: Joi.string().optional(), // Provider's own category string
});

/**
 * POST /api/rides/:bookingId/cancel
 */
const cancelRideSchema = Joi.object({
  reason: Joi.string().max(500).optional().default('User cancelled'),
});

/**
 * POST /api/rides/:bookingId/rate
 */
const rateRideSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  review: Joi.string().max(500).optional().allow(''),
});

/**
 * GET /api/rides/history (query params)
 */
const rideHistorySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  status: Joi.string().optional(),
  provider: Joi.string().valid(...Object.values(PROVIDER)).optional(),
});

module.exports = {
  estimateSchema,
  bookRideSchema,
  cancelRideSchema,
  rateRideSchema,
  rideHistorySchema,
};


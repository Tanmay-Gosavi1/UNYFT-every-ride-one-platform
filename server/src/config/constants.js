/**
 * @module config/constants
 * @description Application-wide constants and enumerations.
 * Centralizes magic strings and values to prevent typos and
 * ensure consistency across the codebase.
 *
 * All enums are frozen objects to prevent accidental mutation.
 */

/**
 * Booking status state machine.
 * These map to a superset of both Uber and Ola status values,
 * normalized into a common lifecycle.
 *
 * State transitions:
 *   ESTIMATE_FETCHED → BOOKING_REQUESTED → ALLOTMENT_PENDING
 *   ALLOTMENT_PENDING → DRIVER_ALLOCATED → DRIVER_EN_ROUTE → DRIVER_ARRIVED
 *   DRIVER_ARRIVED → IN_PROGRESS → COMPLETED
 *   Any active state → CANCELLED | FAILED
 */
const BOOKING_STATUS = Object.freeze({
  ESTIMATE_FETCHED: 'ESTIMATE_FETCHED',
  BOOKING_REQUESTED: 'BOOKING_REQUESTED',
  ALLOTMENT_PENDING: 'ALLOTMENT_PENDING',
  DRIVER_ALLOCATED: 'DRIVER_ALLOCATED',
  DRIVER_EN_ROUTE: 'DRIVER_EN_ROUTE',
  DRIVER_ARRIVED: 'DRIVER_ARRIVED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
});

/**
 * Normalized vehicle categories across all providers.
 * Each provider maps their categories to one of these.
 *
 * @example
 *   Uber: UberX → ECONOMY, UberXL → SUV, Uber Black → LUXURY
 *   Ola:  mini → ECONOMY, prime → PREMIUM, suv → SUV
 */
const VEHICLE_CATEGORY = Object.freeze({
  ECONOMY: 'economy',
  PREMIUM: 'premium',
  SUV: 'suv',
  LUXURY: 'luxury',
  AUTO: 'auto',
  BIKE: 'bike',
  SHARED: 'shared',
});

/**
 * Registered ride-hailing provider identifiers.
 * Used as keys throughout the system — in database records,
 * adapter registry lookups, and API responses.
 */
const PROVIDER = Object.freeze({
  UBER: 'uber',
  OLA: 'ola',
  MOCK: 'mock',
});

/**
 * User sort preferences for ride comparison results.
 */
const SORT_BY = Object.freeze({
  PRICE: 'price',
  ETA: 'eta',
  RATING: 'rating',
});

/**
 * Payment status values for platform fee payments.
 */
const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  CREATED: 'CREATED',
  VERIFIED: 'VERIFIED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
});

/**
 * Socket.IO event names for real-time communication.
 * Using constants prevents client/server event name mismatches.
 */
const SOCKET_EVENTS = Object.freeze({
  // Client → Server
  JOIN_TRACKING: 'join_tracking',
  LEAVE_TRACKING: 'leave_tracking',

  // Server → Client
  DRIVER_LOCATION_UPDATE: 'driver_location_update',
  RIDE_STATUS_CHANGE: 'ride_status_change',
  ETA_UPDATE: 'eta_update',
  DRIVER_INFO_UPDATE: 'driver_info_update',
  BOOKING_ERROR: 'booking_error',
});

/**
 * HTTP status code shortcuts used throughout controllers.
 * Using the http-status-codes package is preferred, but these
 * cover the most common cases.
 */
const HTTP = Object.freeze({
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
});

/**
 * Rate limiting presets (requests per window).
 */
const RATE_LIMITS = Object.freeze({
  AUTH: { windowMs: 15 * 60 * 1000, max: 20 },       // 20 per 15 min
  API_GENERAL: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 per 15 min
  RIDE_ESTIMATE: { windowMs: 60 * 1000, max: 10 },     // 10 per minute
  LOCATION: { windowMs: 60 * 1000, max: 30 },           // 30 per minute
});

module.exports = {
  BOOKING_STATUS,
  VEHICLE_CATEGORY,
  PROVIDER,
  SORT_BY,
  PAYMENT_STATUS,
  SOCKET_EVENTS,
  HTTP,
  RATE_LIMITS,
};

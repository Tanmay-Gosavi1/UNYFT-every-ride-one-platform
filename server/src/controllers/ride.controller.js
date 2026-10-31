/**
 * @module controllers/ride.controller
 * @description Handles HTTP requests for ride estimation, booking, tracking, and history.
 */

const rideService = require('../services/ride.service');
const { sendSuccess } = require('../utils/response.utils');

/**
 * POST /api/rides/estimate
 * Fetches fare estimates from multiple providers.
 */
async function getEstimates(req, res) {
  const { pickup, dropoff, providers, vehicleCategory, sortBy } = req.body;

  const result = await rideService.getEstimates({
    pickup,
    dropoff,
    providers,
    vehicleCategory,
    sortBy,
    user: req.user,
  });

  return sendSuccess(res, result, `Found ${result.estimates.length} ride options`);
}

/**
 * POST /api/rides/book
 * Creates a booking on the selected provider.
 */
async function bookRide(req, res) {
  const booking = await rideService.createBooking(req.user, req.body);
  return sendSuccess(res, { booking }, 'Booking created', 201);
}

/**
 * GET /api/rides/:bookingId
 * Returns a single booking.
 */
async function getBooking(req, res) {
  const booking = await rideService.getBooking(req.user, req.params.bookingId);
  return sendSuccess(res, { booking });
}

/**
 * GET /api/rides/:bookingId/track
 * Returns live tracking data for an active booking.
 */
async function trackRide(req, res) {
  const tracking = await rideService.trackBooking(req.user, req.params.bookingId);
  return sendSuccess(res, { tracking });
}

/**
 * POST /api/rides/:bookingId/cancel
 * Cancels an active booking.
 */
async function cancelRide(req, res) {
  const booking = await rideService.cancelBooking(
    req.user,
    req.params.bookingId,
    req.body.reason
  );
  return sendSuccess(res, { booking }, 'Booking cancelled');
}

/**
 * POST /api/rides/:bookingId/rate
 * Rates a completed ride.
 */
async function rateRide(req, res) {
  const booking = await rideService.rateRide(
    req.user,
    req.params.bookingId,
    req.body.rating,
    req.body.review
  );
  return sendSuccess(res, { booking }, 'Rating submitted');
}

/**
 * GET /api/rides/history
 * Returns paginated ride history.
 */
async function getRideHistory(req, res) {
  const result = await rideService.getRideHistory(req.user._id, req.query);
  return sendSuccess(res, result);
}

module.exports = { getEstimates, bookRide, getBooking, trackRide, cancelRide, rateRide, getRideHistory };


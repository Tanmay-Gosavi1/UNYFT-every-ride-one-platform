/**
 * @module routes/ride.routes
 * @description Ride estimation, booking, tracking, and history routes.
 *
 * Protected (require valid JWT):
 *   POST /estimate         — Get fare estimates from providers
 *   POST /book             — Create a booking
 *   GET  /history          — Paginated ride history
 *   GET  /:bookingId       — Single booking details
 *   GET  /:bookingId/track — Live tracking data
 *   POST /:bookingId/cancel — Cancel a booking
 *   POST /:bookingId/rate   — Rate a completed ride
 */

const { Router } = require('express');
const rideController = require('../controllers/ride.controller');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { estimateLimiter } = require('../middleware/rateLimiter');
const {
  estimateSchema,
  bookRideSchema,
  cancelRideSchema,
  rateRideSchema,
  rideHistorySchema,
} = require('../validators/ride.validator');

const router = Router();

// All ride routes require authentication
router.use(protect);

router.post('/estimate', estimateLimiter, validate(estimateSchema), rideController.getEstimates);
router.post('/book', validate(bookRideSchema), rideController.bookRide);
router.get('/history', validate(rideHistorySchema, 'query'), rideController.getRideHistory);
router.get('/:bookingId', rideController.getBooking);
router.get('/:bookingId/track', rideController.trackRide);
router.post('/:bookingId/cancel', validate(cancelRideSchema), rideController.cancelRide);
router.post('/:bookingId/rate', validate(rateRideSchema), rideController.rateRide);

module.exports = router;


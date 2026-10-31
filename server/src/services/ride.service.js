/**
 * @module services/ride.service
 * @description Core ride business logic — estimation, booking, tracking, history.
 *
 * This is the main aggregation engine. It:
 *  1. Fans out estimate requests to all configured providers in parallel
 *  2. Collects, normalizes, and sorts the results
 *  3. Handles booking lifecycle (create → track → complete/cancel)
 *  4. Manages booking state transitions and persistence
 *
 * All provider-specific logic stays in the adapters.
 * This service only works with the normalized ProviderAdapter interface.
 */

const Booking = require('../models/Booking');
const registry = require('../providers/ProviderRegistry');
const { BOOKING_STATUS, SORT_BY } = require('../config/constants');
const { AppError } = require('../middleware/errorHandler');
const { encrypt, decrypt } = require('../utils/crypto.utils');
const logger = require('../config/logger');

/**
 * Fetches ride estimates from multiple providers in parallel.
 * This is the heart of the aggregation — the "compare" in Ride Compare.
 *
 * @param {object} params
 * @param {{ lat: number, lng: number }} params.pickup
 * @param {{ lat: number, lng: number }} params.dropoff
 * @param {string[]} [params.providers] - Specific providers (empty = all configured)
 * @param {string} [params.vehicleCategory] - Filter by category
 * @param {string} [params.sortBy='price'] - Sort key
 * @param {object} [params.user] - Authenticated user (for provider tokens)
 * @returns {Promise<{ estimates: object[], meta: object }>}
 */
async function getEstimates(params) {
  const { pickup, dropoff, providers, vehicleCategory, sortBy, user } = params;

  // Determine which adapters to query
  let adapters;
  if (providers && providers.length > 0) {
    adapters = providers.map((id) => registry.get(id));
  } else {
    adapters = registry.getConfigured();
  }

  if (adapters.length === 0) {
    throw new AppError('No ride providers are available.', 503, 'NO_PROVIDERS');
  }

  logger.info('Fetching estimates', {
    providers: adapters.map((a) => a.providerId),
    pickup,
    dropoff,
  });

  // Fan out requests to all providers in parallel
  const results = await Promise.allSettled(
    adapters.map(async (adapter) => {
      const userTokens = user ? getUserTokens(user, adapter.providerId) : null;
      const estimates = await adapter.getRideEstimates(pickup, dropoff, userTokens);
      return estimates;
    })
  );

  // Collect successful results, log failures
  let allEstimates = [];
  const errors = [];

  results.forEach((result, i) => {
    const providerId = adapters[i].providerId;
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      allEstimates = allEstimates.concat(result.value);
    } else {
      const reason = result.reason?.message || 'Unknown error';
      logger.warn(`Provider ${providerId} estimate failed`, { error: reason });
      errors.push({ provider: providerId, error: reason });
    }
  });

  // Filter by vehicle category if specified
  if (vehicleCategory) {
    allEstimates = allEstimates.filter((e) => e.category === vehicleCategory);
  }

  // Sort results
  allEstimates = sortEstimates(allEstimates, sortBy || SORT_BY.PRICE);

  return {
    estimates: allEstimates,
    meta: {
      pickup,
      dropoff,
      providersQueried: adapters.map((a) => a.providerId),
      totalEstimates: allEstimates.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date(),
    },
  };
}

/**
 * Sorts estimates according to the user's preferred criteria.
 *
 * @param {object[]} estimates
 * @param {string} sortBy
 * @returns {object[]}
 */
function sortEstimates(estimates, sortBy) {
  const sorters = {
    [SORT_BY.PRICE]: (a, b) => a.fareEstimated - b.fareEstimated,
    [SORT_BY.ETA]: (a, b) => a.pickupEtaMinutes - b.pickupEtaMinutes,
    [SORT_BY.RATING]: (a, b) => (b.providerRating || 0) - (a.providerRating || 0),
    [SORT_BY.DISTANCE]: (a, b) => a.tripDistanceKm - b.tripDistanceKm,
  };
  return [...estimates].sort(sorters[sortBy] || sorters[SORT_BY.PRICE]);
}

/**
 * Creates a booking on the selected provider and stores it in the database.
 *
 * @param {object} user - Authenticated user document
 * @param {object} bookingData - Validated booking parameters
 * @returns {Promise<object>} Created booking document
 */
async function createBooking(user, bookingData) {
  const { provider, productId, fareId, pickup, dropoff, vehicleCategory, providerCategory } = bookingData;

  // 1. Get the provider adapter
  const adapter = registry.get(provider);
  if (!adapter.isConfigured() && adapter.providerId !== 'mock') {
    throw new AppError(`Provider '${provider}' is not configured.`, 400, 'PROVIDER_NOT_CONFIGURED');
  }

  // 2. Get user's provider tokens
  const userTokens = getUserTokens(user, provider);
  if (adapter.getProviderInfo().requiresOAuth && !userTokens) {
    throw new AppError(
      `You must link your ${adapter.getProviderInfo().name} account before booking.`,
      400,
      'PROVIDER_NOT_LINKED'
    );
  }

  // 3. Create our booking record first (ESTIMATE_FETCHED → BOOKING_REQUESTED)
  const booking = new Booking({
    userId: user._id,
    provider,
    status: BOOKING_STATUS.BOOKING_REQUESTED,
    pickup: { lat: pickup.lat, lng: pickup.lng, address: pickup.address },
    dropoff: { lat: dropoff.lat, lng: dropoff.lng, address: dropoff.address },
    vehicleCategory,
    providerCategory,
    estimate: { fareId },
    statusHistory: [
      { status: BOOKING_STATUS.BOOKING_REQUESTED, timestamp: new Date() },
    ],
  });
  await booking.save();

  // 4. Call the provider to create the booking
  try {
    const providerResponse = await adapter.createBooking(userTokens, {
      productId,
      fareId,
      pickup,
      dropoff,
      category: vehicleCategory,
      providerCategory,
      bookingId: booking._id.toString(),
    });

    // 5. Update with provider booking reference
    booking.providerBookingId = providerResponse.providerBookingId;
    booking.transition(BOOKING_STATUS.ALLOTMENT_PENDING, {
      providerBookingId: providerResponse.providerBookingId,
      bookingTimeout: providerResponse.bookingTimeout,
    });
    await booking.save();

    logger.info('Booking created', {
      bookingId: booking._id,
      provider,
      providerBookingId: providerResponse.providerBookingId,
    });

    return booking;
  } catch (err) {
    // Mark booking as failed
    booking.transition(BOOKING_STATUS.FAILED, { error: err.message });
    await booking.save();
    logger.error('Booking creation failed on provider', { error: err.message, provider });
    throw new AppError(`Failed to create booking: ${err.message}`, 502, 'PROVIDER_BOOKING_FAILED');
  }
}

/**
 * Cancels an active booking.
 *
 * @param {object} user
 * @param {string} bookingId
 * @param {string} [reason]
 * @returns {Promise<object>} Updated booking
 */
async function cancelBooking(user, bookingId, reason) {
  const booking = await Booking.findOne({ _id: bookingId, userId: user._id });
  if (!booking) throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');
  if (!booking.isActive()) {
    throw new AppError('This booking cannot be cancelled.', 400, 'BOOKING_NOT_ACTIVE');
  }

  // Cancel on provider side
  const adapter = registry.get(booking.provider);
  const userTokens = getUserTokens(user, booking.provider);

  try {
    if (booking.providerBookingId) {
      await adapter.cancelBooking(userTokens, booking.providerBookingId, reason);
    }
  } catch (err) {
    logger.warn('Provider cancellation failed — marking cancelled locally', { error: err.message });
  }

  booking.transition(BOOKING_STATUS.CANCELLED, { reason, cancelledAt: new Date() });
  await booking.save();

  logger.info('Booking cancelled', { bookingId, reason });
  return booking;
}

/**
 * Gets live tracking data for an active booking.
 *
 * @param {object} user
 * @param {string} bookingId
 * @returns {Promise<object>} Tracking data + booking status
 */
async function trackBooking(user, bookingId) {
  const booking = await Booking.findOne({ _id: bookingId, userId: user._id });
  if (!booking) throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');

  if (!booking.isActive()) {
    return {
      bookingId: booking._id,
      status: booking.status,
      driver: booking.driver,
      tripInfo: booking.tripInfo,
    };
  }

  // Poll provider for live data
  const adapter = registry.get(booking.provider);
  const userTokens = getUserTokens(user, booking.provider);

  try {
    const trackingData = await adapter.trackRide(userTokens, booking.providerBookingId);

    // Update local booking with latest provider data
    if (trackingData.status && trackingData.status !== booking.status) {
      booking.transition(trackingData.status);
    }
    if (trackingData.driver) booking.driver = trackingData.driver;
    if (trackingData.otp) booking.otp = trackingData.otp;
    if (trackingData.shareRideUrl) booking.shareRideUrl = trackingData.shareRideUrl;
    if (trackingData.tripInfo) booking.tripInfo = trackingData.tripInfo;
    await booking.save();

    return {
      bookingId: booking._id,
      provider: booking.provider,
      status: booking.status,
      ...trackingData,
    };
  } catch (err) {
    logger.warn('Tracking poll failed', { error: err.message, bookingId });
    return {
      bookingId: booking._id,
      status: booking.status,
      driver: booking.driver,
      error: 'Tracking temporarily unavailable',
    };
  }
}

/**
 * Rates a completed ride.
 *
 * @param {object} user
 * @param {string} bookingId
 * @param {number} rating
 * @param {string} [review]
 * @returns {Promise<object>}
 */
async function rateRide(user, bookingId, rating, review) {
  const booking = await Booking.findOne({ _id: bookingId, userId: user._id });
  if (!booking) throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');
  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    throw new AppError('Can only rate completed rides.', 400, 'RIDE_NOT_COMPLETED');
  }
  if (booking.userRating) {
    throw new AppError('You have already rated this ride.', 400, 'ALREADY_RATED');
  }

  booking.userRating = rating;
  booking.userReview = review || '';
  await booking.save();

  return booking;
}

/**
 * Retrieves paginated ride history for a user.
 *
 * @param {string} userId
 * @param {object} query - Pagination and filter options
 * @returns {Promise<{ bookings: object[], pagination: object }>}
 */
async function getRideHistory(userId, query) {
  const { page = 1, limit = 10, status, provider } = query;
  const filter = { userId };
  if (status) filter.status = status;
  if (provider) filter.provider = provider;

  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

/**
 * Gets a single booking by ID for the authenticated user.
 *
 * @param {object} user
 * @param {string} bookingId
 * @returns {Promise<object>}
 */
async function getBooking(user, bookingId) {
  const booking = await Booking.findOne({ _id: bookingId, userId: user._id });
  if (!booking) throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');
  return booking;
}

// --- Internal Helpers ---

/**
 * Extracts provider OAuth tokens for a user.
 * Returns null if the user hasn't linked this provider.
 *
 * @param {object} user - Mongoose user document
 * @param {string} providerId
 * @returns {object|null} { accessToken, refreshToken }
 */
function getUserTokens(user, providerId) {
  if (providerId === 'mock') return null; // Mock doesn't need tokens
  const account = user.getProviderAccount
    ? user.getProviderAccount(providerId)
    : user.providerAccounts?.find((pa) => pa.provider === providerId);

  if (!account) return null;

  return {
    accessToken: account.accessToken,
    refreshToken: account.refreshToken,
  };
}

module.exports = {
  getEstimates,
  createBooking,
  cancelBooking,
  trackBooking,
  rateRide,
  getRideHistory,
  getBooking,
};


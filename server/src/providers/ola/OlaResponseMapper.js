/**
 * @module providers/ola/OlaResponseMapper
 * @description Maps raw Ola API responses to the normalized schema.
 *
 * Ola uses different naming conventions and category strings than Uber.
 * This mapper ensures both providers produce identical normalized shapes
 * so the aggregation engine and UI treat them uniformly.
 *
 * Reference: https://developers.olacabs.com/docs/
 */

const { v4: uuidv4 } = require('uuid');
const { VEHICLE_CATEGORY, BOOKING_STATUS } = require('../../config/constants');

/**
 * Maps Ola category string to a normalized vehicle category.
 *
 * Ola categories: micro, mini, prime, prime_play, prime_suv, lux, auto, bike, share
 *
 * @param {string} olaCategory
 * @returns {string} Normalized category
 */
function mapOlaCategory(olaCategory) {
  const cat = (olaCategory || '').toLowerCase();
  if (cat === 'lux' || cat === 'luxury') return VEHICLE_CATEGORY.LUXURY;
  if (cat.includes('suv') || cat === 'prime_suv') return VEHICLE_CATEGORY.SUV;
  if (cat === 'prime' || cat === 'prime_play' || cat === 'sedan') return VEHICLE_CATEGORY.PREMIUM;
  if (cat === 'auto') return VEHICLE_CATEGORY.AUTO;
  if (cat === 'bike') return VEHICLE_CATEGORY.BIKE;
  if (cat === 'share' || cat === 'shuttle') return VEHICLE_CATEGORY.SHARED;
  return VEHICLE_CATEGORY.ECONOMY; // micro, mini
}

/**
 * Maps Ola booking status to normalized BOOKING_STATUS.
 *
 * Ola statuses: BOOKED, CAB_ALLOTMENT_PENDING, CAB_ALLOTTED,
 *               DRIVER_EN_ROUTE, ARRIVED, TRIP_STARTED,
 *               COMPLETED, CANCELLED, NO_CABS_AVAILABLE
 *
 * @param {string} olaStatus
 * @returns {string}
 */
function mapOlaStatus(olaStatus) {
  const statusMap = {
    BOOKED: BOOKING_STATUS.BOOKING_REQUESTED,
    CAB_ALLOTMENT_PENDING: BOOKING_STATUS.ALLOTMENT_PENDING,
    CAB_ALLOTTED: BOOKING_STATUS.DRIVER_ALLOCATED,
    DRIVER_EN_ROUTE: BOOKING_STATUS.DRIVER_EN_ROUTE,
    ARRIVED: BOOKING_STATUS.DRIVER_ARRIVED,
    TRIP_STARTED: BOOKING_STATUS.IN_PROGRESS,
    COMPLETED: BOOKING_STATUS.COMPLETED,
    CANCELLED: BOOKING_STATUS.CANCELLED,
    NO_CABS_AVAILABLE: BOOKING_STATUS.FAILED,
  };
  return statusMap[(olaStatus || '').toUpperCase()] || BOOKING_STATUS.ALLOTMENT_PENDING;
}

/**
 * Transforms a raw Ola product/category to NormalizedProduct.
 *
 * @param {object} rawProduct
 * @returns {import('../ProviderAdapter').NormalizedProduct}
 */
function mapProduct(rawProduct) {
  return {
    id: rawProduct.id || rawProduct.category,
    name: rawProduct.display_name || rawProduct.name,
    category: mapOlaCategory(rawProduct.category),
    description: rawProduct.description || '',
    capacity: rawProduct.capacity || 4,
    imageUrl: rawProduct.image || rawProduct.image_url,
  };
}

/**
 * Transforms a raw Ola fare estimate to NormalizedEstimate.
 *
 * Ola estimate structure (per category):
 * {
 *   category, amount_min, amount_max, distance, eta,
 *   surge: { multiplier }, fare_breakup: [...]
 * }
 *
 * @param {object} rawEstimate - Single category from Ola estimate response
 * @returns {import('../ProviderAdapter').NormalizedEstimate}
 */
function mapEstimate(rawEstimate) {
  const surge = rawEstimate.surge || {};
  const surgeMultiplier = surge.multiplier || surge.surge_factor || 1.0;

  return {
    id: uuidv4(),
    provider: 'ola',
    productId: rawEstimate.id || rawEstimate.category,
    productName: rawEstimate.display_name || rawEstimate.category,
    category: mapOlaCategory(rawEstimate.category),
    capacity: rawEstimate.capacity || 4,
    fareMin: rawEstimate.amount_min || rawEstimate.fare_estimate?.amount_min || 0,
    fareMax: rawEstimate.amount_max || rawEstimate.fare_estimate?.amount_max || 0,
    fareEstimated: Math.round(
      ((rawEstimate.amount_min || 0) + (rawEstimate.amount_max || 0)) / 2
    ),
    currency: 'INR',
    surgeMultiplier,
    surgeActive: surgeMultiplier > 1.0,
    fareId: rawEstimate.fare_id || null,
    fareIdExpiry: rawEstimate.fare_id
      ? new Date(Date.now() + 5 * 60 * 1000) // Ola fare_id typically valid ~5 min
      : null,
    pickupEtaMinutes: rawEstimate.eta || rawEstimate.pickup_eta || 5,
    tripDurationMinutes: rawEstimate.duration
      ? Math.round(rawEstimate.duration / 60)
      : rawEstimate.ride_estimate?.travel_time_in_minutes || 0,
    tripDistanceKm: rawEstimate.distance || rawEstimate.ride_estimate?.distance || 0,
  };
}

/**
 * Transforms raw Ola tracking/ride-status data to NormalizedTrackingData.
 *
 * Ola track_ride response:
 * {
 *   crn, status, driver_name, driver_number, driver_rating,
 *   car_model, car_number, driver_lat, driver_lng,
 *   eta, otp, tracking_url
 * }
 *
 * @param {object} rawTracking
 * @returns {import('../ProviderAdapter').NormalizedTrackingData}
 */
function mapTrackingData(rawTracking) {
  const tracking = {
    providerBookingId: rawTracking.crn,
    status: mapOlaStatus(rawTracking.status || rawTracking.booking_status),
  };

  if (rawTracking.driver_name) {
    tracking.driver = {
      name: rawTracking.driver_name,
      phone: rawTracking.driver_number || rawTracking.driver_phone,
      rating: rawTracking.driver_rating ? parseFloat(rawTracking.driver_rating) : null,
      imageUrl: rawTracking.driver_image || null,
      vehicle: {
        make: null,
        model: rawTracking.car_model || rawTracking.cab_type,
        color: rawTracking.car_color || null,
        licensePlate: rawTracking.car_number || rawTracking.cab_number,
      },
    };
  }

  if (rawTracking.driver_lat && rawTracking.driver_lng) {
    tracking.driverLocation = {
      lat: parseFloat(rawTracking.driver_lat),
      lng: parseFloat(rawTracking.driver_lng),
      bearing: rawTracking.driver_bearing ? parseFloat(rawTracking.driver_bearing) : 0,
      speed: 0,
      updatedAt: new Date(),
    };
  }

  if (rawTracking.eta !== undefined) {
    tracking.eta = { value: parseInt(rawTracking.eta, 10) || 0, unit: 'MINUTES' };
  }

  if (rawTracking.otp) tracking.otp = rawTracking.otp;
  if (rawTracking.tracking_url) tracking.shareRideUrl = rawTracking.tracking_url;

  return tracking;
}

module.exports = { mapProduct, mapEstimate, mapTrackingData, mapOlaStatus, mapOlaCategory };


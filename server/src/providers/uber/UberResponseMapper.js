/**
 * @module providers/uber/UberResponseMapper
 * @description Maps raw Uber API responses to the normalized schema.
 *
 * Uber v1.2 product/estimate/request response structures differ
 * significantly from our internal normalized format and from Ola's format.
 * This mapper isolates the transformation so changes to either format
 * only require updating this file.
 *
 * Reference: https://developer.uber.com/docs/riders/references/api/v1.2/
 */

const { v4: uuidv4 } = require('uuid');
const { VEHICLE_CATEGORY, BOOKING_STATUS } = require('../../config/constants');

/**
 * Maps Uber product displayName to a normalized vehicle category.
 *
 * @param {string} displayName - e.g., 'UberX', 'UberXL', 'Uber Black'
 * @returns {string} Normalized category
 */
function mapUberCategory(displayName) {
  const name = (displayName || '').toLowerCase();
  if (name.includes('black') || name.includes('lux')) return VEHICLE_CATEGORY.LUXURY;
  if (name.includes('xl') || name.includes('van') || name.includes('suv')) return VEHICLE_CATEGORY.SUV;
  if (name.includes('premier') || name.includes('comfort')) return VEHICLE_CATEGORY.PREMIUM;
  if (name.includes('pool') || name.includes('share')) return VEHICLE_CATEGORY.SHARED;
  return VEHICLE_CATEGORY.ECONOMY; // UberX, UberGo, etc.
}

/**
 * Maps Uber status strings to our normalized BOOKING_STATUS values.
 *
 * Uber statuses: processing, accepted, arriving, in_progress, driver_canceled, completed
 *
 * @param {string} uberStatus
 * @returns {string} Normalized BOOKING_STATUS
 */
function mapUberStatus(uberStatus) {
  const statusMap = {
    processing: BOOKING_STATUS.ALLOTMENT_PENDING,
    accepted: BOOKING_STATUS.DRIVER_ALLOCATED,
    arriving: BOOKING_STATUS.DRIVER_EN_ROUTE,
    in_progress: BOOKING_STATUS.IN_PROGRESS,
    driver_canceled: BOOKING_STATUS.CANCELLED,
    completed: BOOKING_STATUS.COMPLETED,
  };
  return statusMap[(uberStatus || '').toLowerCase()] || BOOKING_STATUS.ALLOTMENT_PENDING;
}

/**
 * Transforms a raw Uber product object to NormalizedProduct.
 *
 * @param {object} rawProduct - Uber /v1.2/products item
 * @returns {import('../ProviderAdapter').NormalizedProduct}
 */
function mapProduct(rawProduct) {
  return {
    id: rawProduct.product_id,
    name: rawProduct.display_name,
    category: mapUberCategory(rawProduct.display_name),
    description: rawProduct.description,
    capacity: rawProduct.capacity,
    imageUrl: rawProduct.image,
  };
}

/**
 * Transforms a raw Uber fare estimate to NormalizedEstimate.
 *
 * Uber estimate structure:
 * {
 *   fare: { display, currency_code, value, fare_id, expires_at, ... },
 *   trip: { distance_unit, duration_estimate, distance_estimate },
 *   pickup_estimate: <minutes>
 * }
 *
 * @param {object} rawEstimate - Uber /v1.2/requests/estimate response
 * @param {object} product - The product this estimate is for
 * @returns {import('../ProviderAdapter').NormalizedEstimate}
 */
function mapEstimate(rawEstimate, product) {
  const { fare, trip, pickup_estimate } = rawEstimate;

  return {
    id: uuidv4(),
    provider: 'uber',
    productId: product.product_id || product.id,
    productName: product.display_name || product.name,
    category: mapUberCategory(product.display_name || product.name),
    capacity: product.capacity,
    fareMin: fare?.low_estimate || fare?.value || 0,
    fareMax: fare?.high_estimate || fare?.value || 0,
    fareEstimated: fare?.value || 0,
    currency: fare?.currency_code || 'INR',
    surgeMultiplier: fare?.surge_multiplier || 1.0,
    surgeActive: (fare?.surge_multiplier || 1.0) > 1.0,
    fareId: fare?.fare_id,
    fareIdExpiry: fare?.expires_at
      ? new Date(fare.expires_at * 1000) // Uber uses Unix timestamp
      : new Date(Date.now() + 2 * 60 * 1000), // Default: 2 minutes
    pickupEtaMinutes: pickup_estimate || 5,
    tripDurationMinutes: trip?.duration_estimate ? Math.round(trip.duration_estimate / 60) : 0,
    tripDistanceKm: trip?.distance_estimate
      ? trip.distance_unit === 'mile'
        ? trip.distance_estimate * 1.60934
        : trip.distance_estimate
      : 0,
  };
}

/**
 * Transforms a raw Uber request status to NormalizedTrackingData.
 *
 * @param {object} rawRequest - Uber /v1.2/requests/:id response
 * @returns {import('../ProviderAdapter').NormalizedTrackingData}
 */
function mapTrackingData(rawRequest) {
  const tracking = {
    providerBookingId: rawRequest.request_id,
    status: mapUberStatus(rawRequest.status),
  };

  if (rawRequest.driver) {
    tracking.driver = {
      name: rawRequest.driver.name,
      phone: rawRequest.driver.phone_number,
      rating: rawRequest.driver.rating,
      imageUrl: rawRequest.driver.picture_url,
      vehicle: {
        make: rawRequest.vehicle?.make,
        model: rawRequest.vehicle?.model,
        color: rawRequest.vehicle?.color,
        licensePlate: rawRequest.vehicle?.license_plate,
      },
    };
  }

  if (rawRequest.location) {
    tracking.driverLocation = {
      lat: rawRequest.location.latitude,
      lng: rawRequest.location.longitude,
      bearing: rawRequest.location.bearing,
      speed: 0,
      updatedAt: new Date(),
    };
  }

  if (rawRequest.eta !== undefined) {
    tracking.eta = { value: rawRequest.eta, unit: 'MINUTES' };
  }

  return tracking;
}

module.exports = { mapProduct, mapEstimate, mapTrackingData, mapUberStatus, mapUberCategory };

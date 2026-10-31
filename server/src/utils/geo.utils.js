/**
 * @module utils/geo
 * @description Geospatial utility functions.
 *
 * Used across the ride aggregation engine and provider adapters for:
 *  - Calculating straight-line distance between coordinates (Haversine formula)
 *  - Estimating drive time based on distance
 *  - Validating coordinate ranges
 *  - Computing bearing between two points (for driver heading display)
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Converts degrees to radians.
 * @param {number} degrees
 * @returns {number}
 */
function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates the great-circle distance between two coordinates
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lng1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lng2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in kilometers
 *
 * @example
 *   const dist = calculateDistance(12.9523, 77.6432, 12.9592, 77.6974);
 *   // → approximately 5.5 km
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Estimates drive time in minutes based on straight-line distance.
 * Uses an average urban speed of 25 km/h with a 1.4 route factor
 * (accounts for roads not being straight lines).
 *
 * NOTE: This is a rough estimate used only by the mock adapter.
 * Real provider APIs return actual ETAs based on live traffic.
 *
 * @param {number} distanceKm - Straight-line distance in km
 * @returns {number} Estimated drive time in minutes (rounded up)
 */
function estimateDriveTime(distanceKm) {
  const AVG_SPEED_KMH = 25;    // Urban average
  const ROUTE_FACTOR = 1.4;    // Road path vs straight line
  const effectiveDistance = distanceKm * ROUTE_FACTOR;
  return Math.ceil((effectiveDistance / AVG_SPEED_KMH) * 60);
}

/**
 * Computes the bearing (compass direction) from point 1 to point 2.
 * Used to orient the driver icon on the map.
 *
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} Bearing in degrees (0–360, where 0 = North)
 */
function calculateBearing(lat1, lng1, lat2, lng2) {
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δλ = toRadians(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360; // Normalize to 0–360
}

/**
 * Validates that latitude and longitude values are within valid ranges.
 *
 * @param {number} lat - Latitude (-90 to 90)
 * @param {number} lng - Longitude (-180 to 180)
 * @returns {boolean}
 */
function isValidCoordinate(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng)
  );
}

/**
 * Interpolates a position along a straight path between two coordinates.
 * Used by the mock tracking simulator to animate driver movement.
 *
 * @param {number} lat1 - Start latitude
 * @param {number} lng1 - Start longitude
 * @param {number} lat2 - End latitude
 * @param {number} lng2 - End longitude
 * @param {number} fraction - Progress along path (0.0 to 1.0)
 * @returns {{ lat: number, lng: number }}
 */
function interpolatePosition(lat1, lng1, lat2, lng2, fraction) {
  const f = Math.max(0, Math.min(1, fraction));
  return {
    lat: lat1 + (lat2 - lat1) * f,
    lng: lng1 + (lng2 - lng1) * f,
  };
}

module.exports = {
  calculateDistance,
  estimateDriveTime,
  calculateBearing,
  isValidCoordinate,
  interpolatePosition,
};

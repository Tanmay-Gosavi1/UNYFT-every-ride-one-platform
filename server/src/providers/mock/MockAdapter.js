/**
 * @module providers/mock/MockAdapter
 * @description Fully functional mock provider adapter.
 *
 * Simulates the complete ride-hailing lifecycle without requiring
 * any external API credentials. This enables:
 *  - Development and testing without Uber/Ola API access
 *  - UI demonstrations with realistic data and animations
 *  - CI/CD test runs without network dependencies
 *
 * The mock adapter respects the same ProviderAdapter interface as
 * real adapters — it can be swapped in/out transparently.
 *
 * Behavior:
 *  - getAvailableProducts: Returns 6 vehicle categories
 *  - getRideEstimates: Calculates realistic fares using fare.utils
 *  - createBooking: Generates booking ID and starts tracking simulation
 *  - trackRide: Returns current simulation snapshot
 *  - cancelBooking: Stops simulation and returns success
 */

const { v4: uuidv4 } = require('uuid');
const ProviderAdapter = require('../ProviderAdapter');
const { BOOKING_STATUS } = require('../../config/constants');
const { generateEstimates, VEHICLE_PRODUCTS } = require('./MockDataGenerator');
const { startSimulation, stopSimulation, getSnapshot } = require('./MockTrackingSimulator');
const logger = require('../../config/logger');

class MockAdapter extends ProviderAdapter {
  constructor() {
    super('mock');
  }

  // ===================================================================
  // IDENTITY
  // ===================================================================

  getProviderInfo() {
    return {
      id: 'mock',
      name: 'Mock Provider',
      logoUrl: '/assets/providers/mock.svg',
      supportedCountries: ['IN'],
      vehicleCategories: VEHICLE_PRODUCTS.map((p) => p.category),
      requiresOAuth: false,
      sandboxAvailable: true,
      description: 'Simulated provider for development and testing',
    };
  }

  // ===================================================================
  // OAUTH (No-op for mock — no OAuth required)
  // ===================================================================

  getOAuthUrl() {
    return null; // Mock does not require OAuth
  }

  async handleOAuthCallback() {
    return {
      accessToken: `mock_access_${uuidv4()}`,
      refreshToken: `mock_refresh_${uuidv4()}`,
      expiresIn: 3600,
      scope: 'mock.all',
    };
  }

  async refreshAccessToken() {
    return {
      accessToken: `mock_access_${uuidv4()}`,
      expiresIn: 3600,
    };
  }

  // ===================================================================
  // RIDE DISCOVERY
  // ===================================================================

  async getAvailableProducts(pickupLat, pickupLng) {
    logger.debug('MockAdapter: getAvailableProducts', { pickupLat, pickupLng });
    // Simulate slight API delay
    await this._delay(200);
    return VEHICLE_PRODUCTS;
  }

  async getRideEstimates(pickup, dropoff) {
    logger.debug('MockAdapter: getRideEstimates', { pickup, dropoff });
    await this._delay(300);
    return generateEstimates(pickup, dropoff);
  }

  // ===================================================================
  // BOOKING
  // ===================================================================

  async createBooking(userTokens, bookingParams) {
    const { productId, pickup, dropoff, category } = bookingParams;
    logger.debug('MockAdapter: createBooking', { productId, category });
    await this._delay(400);

    const providerBookingId = `MOCK-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Start the tracking simulation in the background.
    // The booking service will subscribe to updates via the TrackingService.
    // We pass a no-op callback here; real callbacks come from the Socket handler.
    startSimulation(
      bookingParams.bookingId || providerBookingId,
      providerBookingId,
      pickup,
      dropoff,
      category || 'economy',
      (update) => {
        logger.debug('MockAdapter: tracking update', { providerBookingId, status: update.status });
      }
    );

    return {
      providerBookingId,
      status: BOOKING_STATUS.ALLOTMENT_PENDING,
      message: 'Searching for a mock driver...',
      bookingTimeout: 70,
    };
  }

  async cancelBooking(userTokens, providerBookingId, reason) {
    logger.debug('MockAdapter: cancelBooking', { providerBookingId, reason });
    await this._delay(200);
    stopSimulation(providerBookingId);
    return { success: true, message: 'Booking cancelled successfully' };
  }

  async getBookingStatus(userTokens, providerBookingId) {
    return this.trackRide(userTokens, providerBookingId);
  }

  // ===================================================================
  // TRACKING
  // ===================================================================

  async trackRide(userTokens, providerBookingId) {
    logger.debug('MockAdapter: trackRide', { providerBookingId });
    const snapshot = getSnapshot(providerBookingId);
    if (!snapshot) {
      // Simulation not running — booking may be completed or unknown
      return {
        providerBookingId,
        status: BOOKING_STATUS.COMPLETED,
        message: 'Ride completed',
      };
    }
    return snapshot;
  }

  // ===================================================================
  // NORMALIZATION (no-op — MockAdapter generates normalized data directly)
  // ===================================================================

  normalizeEstimate(rawEstimate) {
    return rawEstimate;
  }

  normalizeTracking(rawTracking) {
    return rawTracking;
  }

  // ===================================================================
  // CONFIGURATION
  // ===================================================================

  isConfigured() {
    return true; // Mock is always available
  }

  // ===================================================================
  // PRIVATE HELPERS
  // ===================================================================

  /**
   * Simulates async API latency.
   * @param {number} ms
   * @returns {Promise<void>}
   */
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = MockAdapter;

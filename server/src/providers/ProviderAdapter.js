/**
 * @module providers/ProviderAdapter
 * @description Abstract base class for all ride-hailing provider adapters.
 *
 * ARCHITECTURE NOTE — Strategy Pattern
 * =====================================
 * Every provider (Uber, Ola, Rapido, etc.) must extend this class and
 * implement all abstract methods. The ProviderRegistry then holds instances
 * of each adapter and the RideService calls them uniformly through this
 * interface — with no knowledge of which specific provider is being called.
 *
 * HOW TO ADD A NEW PROVIDER
 * ==========================
 *  1. Create directory: server/src/providers/<provider_id>/
 *  2. Create: <ProviderName>Adapter.js  (extend ProviderAdapter)
 *  3. Create: <ProviderName>ResponseMapper.js  (raw → normalized mapping)
 *  4. Register in: ProviderRegistry.js
 *  5. Add config vars to: config/index.js + .env.example
 *  6. Document in: docs/PROVIDER_INTEGRATION_GUIDE.md
 *
 * See docs/PROVIDER_INTEGRATION_GUIDE.md for full walkthrough.
 */

class ProviderAdapter {
  /**
   * @param {string} providerId - Unique identifier (e.g., 'uber', 'ola', 'mock')
   */
  constructor(providerId) {
    if (new.target === ProviderAdapter) {
      throw new Error('ProviderAdapter is abstract and cannot be instantiated directly.');
    }
    this.providerId = providerId;
  }

  // ===================================================================
  // IDENTITY
  // ===================================================================

  /**
   * Returns static information about this provider.
   * Used by the /providers endpoint to list available providers.
   *
   * @abstract
   * @returns {{
   *   id: string,
   *   name: string,
   *   logoUrl: string,
   *   supportedCountries: string[],
   *   vehicleCategories: string[],
   *   requiresOAuth: boolean,
   *   sandboxAvailable: boolean
   * }}
   */
  getProviderInfo() {
    throw new Error(`${this.constructor.name} must implement getProviderInfo()`);
  }

  // ===================================================================
  // OAUTH AUTHENTICATION
  // ===================================================================

  /**
   * Generates the OAuth 2.0 authorization URL for the provider.
   * The user is redirected here to grant access.
   *
   * @abstract
   * @param {string} state - CSRF protection state token
   * @param {string} redirectUri - Must match the registered redirect URI
   * @returns {string} Full authorization URL
   */
  getOAuthUrl(state, redirectUri) {
    throw new Error(`${this.constructor.name} must implement getOAuthUrl()`);
  }

  /**
   * Exchanges the authorization code for access + refresh tokens.
   * Called after the user approves the OAuth consent screen.
   *
   * @abstract
   * @param {string} code - Authorization code from provider callback
   * @param {string} redirectUri
   * @returns {Promise<{ accessToken: string, refreshToken: string, expiresIn: number, scope: string }>}
   */
  async handleOAuthCallback(code, redirectUri) {
    throw new Error(`${this.constructor.name} must implement handleOAuthCallback()`);
  }

  /**
   * Uses the refresh token to get a new access token.
   * Should be called automatically when access token is expired.
   *
   * @abstract
   * @param {string} refreshToken
   * @returns {Promise<{ accessToken: string, expiresIn: number }>}
   */
  async refreshAccessToken(refreshToken) {
    throw new Error(`${this.constructor.name} must implement refreshAccessToken()`);
  }

  // ===================================================================
  // RIDE DISCOVERY
  // ===================================================================

  /**
   * Returns all vehicle products available at the given pickup location.
   * Used to populate the product selector before fare estimation.
   *
   * @abstract
   * @param {number} pickupLat
   * @param {number} pickupLng
   * @param {object} [userTokens] - Provider OAuth tokens for authenticated requests
   * @returns {Promise<Array<NormalizedProduct>>}
   */
  async getAvailableProducts(pickupLat, pickupLng, userTokens) {
    throw new Error(`${this.constructor.name} must implement getAvailableProducts()`);
  }

  /**
   * Returns fare estimates for all (or a specific) product at the given route.
   * This is the main method called by the RideAggregationEngine.
   *
   * @abstract
   * @param {{ lat: number, lng: number }} pickup
   * @param {{ lat: number, lng: number }} dropoff
   * @param {object} [userTokens] - Provider OAuth tokens
   * @param {string} [productId] - Specific product to estimate (all if omitted)
   * @returns {Promise<Array<NormalizedEstimate>>}
   */
  async getRideEstimates(pickup, dropoff, userTokens, productId) {
    throw new Error(`${this.constructor.name} must implement getRideEstimates()`);
  }

  // ===================================================================
  // BOOKING
  // ===================================================================

  /**
   * Creates a ride booking on the provider platform.
   * Must be called with a valid (non-expired) fareId for upfront pricing.
   *
   * @abstract
   * @param {object} userTokens - Provider OAuth tokens
   * @param {object} bookingParams
   * @param {string} bookingParams.productId
   * @param {string} bookingParams.fareId
   * @param {{ lat: number, lng: number }} bookingParams.pickup
   * @param {{ lat: number, lng: number }} bookingParams.dropoff
   * @returns {Promise<NormalizedBookingResponse>}
   */
  async createBooking(userTokens, bookingParams) {
    throw new Error(`${this.constructor.name} must implement createBooking()`);
  }

  /**
   * Cancels a ride booking.
   *
   * @abstract
   * @param {object} userTokens
   * @param {string} providerBookingId
   * @param {string} [reason] - Cancellation reason
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async cancelBooking(userTokens, providerBookingId, reason) {
    throw new Error(`${this.constructor.name} must implement cancelBooking()`);
  }

  /**
   * Fetches the current status and details of a booking.
   * Used for polling when WebSocket/push is unavailable.
   *
   * @abstract
   * @param {object} userTokens
   * @param {string} providerBookingId
   * @returns {Promise<NormalizedTrackingData>}
   */
  async getBookingStatus(userTokens, providerBookingId) {
    throw new Error(`${this.constructor.name} must implement getBookingStatus()`);
  }

  // ===================================================================
  // TRACKING
  // ===================================================================

  /**
   * Returns the current driver location and ride status.
   * Called periodically by the TrackingService for active bookings.
   *
   * @abstract
   * @param {object} userTokens
   * @param {string} providerBookingId
   * @returns {Promise<NormalizedTrackingData>}
   */
  async trackRide(userTokens, providerBookingId) {
    throw new Error(`${this.constructor.name} must implement trackRide()`);
  }

  // ===================================================================
  // RESPONSE NORMALIZATION
  // The following are implemented by each adapter's ResponseMapper.
  // ===================================================================

  /**
   * Converts a raw provider estimate response to the normalized format.
   *
   * @abstract
   * @param {object} rawEstimate - Raw API response from provider
   * @returns {NormalizedEstimate}
   */
  normalizeEstimate(rawEstimate) {
    throw new Error(`${this.constructor.name} must implement normalizeEstimate()`);
  }

  /**
   * Converts raw provider tracking/status data to normalized format.
   *
   * @abstract
   * @param {object} rawTracking - Raw API response from provider
   * @returns {NormalizedTrackingData}
   */
  normalizeTracking(rawTracking) {
    throw new Error(`${this.constructor.name} must implement normalizeTracking()`);
  }

  // ===================================================================
  // UTILITY (shared by all adapters)
  // ===================================================================

  /**
   * Returns whether this adapter is ready to use
   * (i.e., all required config values are present).
   *
   * Override in concrete adapters that have optional requirements.
   *
   * @returns {boolean}
   */
  isConfigured() {
    return true;
  }

  /**
   * Returns a human-readable name for logging.
   * @returns {string}
   */
  toString() {
    return `[ProviderAdapter: ${this.providerId}]`;
  }
}

module.exports = ProviderAdapter;

/**
 * @typedef {object} NormalizedProduct
 * @property {string} id - Provider's product ID
 * @property {string} name - Display name (e.g., 'UberX', 'Ola Mini')
 * @property {string} category - Normalized: 'economy'|'premium'|'suv'|'luxury'|'auto'|'bike'|'shared'
 * @property {string} [description]
 * @property {number} [capacity] - Passenger capacity
 * @property {string} [imageUrl]
 */

/**
 * @typedef {object} NormalizedEstimate
 * @property {string} id - Unique estimate ID (uuid)
 * @property {string} provider - Provider ID ('uber', 'ola', 'mock')
 * @property {string} productId - Provider's product ID
 * @property {string} productName - Display name
 * @property {string} category - Normalized vehicle category
 * @property {number} fareMin - Min fare estimate (INR)
 * @property {number} fareMax - Max fare estimate (INR)
 * @property {number} fareEstimated - Best single estimate (INR)
 * @property {string} currency - Always 'INR' for India
 * @property {number} surgeMultiplier - 1.0 = no surge
 * @property {boolean} surgeActive
 * @property {string} [fareId] - ID to lock the fare for booking
 * @property {Date} [fareIdExpiry] - When fareId expires
 * @property {number} pickupEtaMinutes - Driver's ETA to pickup
 * @property {number} tripDurationMinutes - Estimated trip duration
 * @property {number} tripDistanceKm
 */

/**
 * @typedef {object} NormalizedBookingResponse
 * @property {string} providerBookingId - Provider's booking reference
 * @property {'ALLOTMENT_PENDING'|'DRIVER_ALLOCATED'|'FAILED'} status
 * @property {string} [message]
 * @property {number} [bookingTimeout] - Seconds before booking expires if no driver
 */

/**
 * @typedef {object} NormalizedTrackingData
 * @property {string} providerBookingId
 * @property {string} status - Normalized booking status
 * @property {object} [driver] - Driver info when allocated
 * @property {{ lat: number, lng: number, bearing: number, speed: number }} [driverLocation]
 * @property {{ value: number, unit: string }} [eta] - ETA to pickup
 * @property {string} [otp] - Trip start OTP
 * @property {string} [shareRideUrl]
 * @property {object} [tripInfo] - Populated on COMPLETED
 */

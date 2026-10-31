/**
 * @module providers/uber/UberAdapter
 * @description Uber API v1.2 provider adapter.
 *
 * STATUS: Ready for production credentials.
 *         Falls back to mock data if UBER_CLIENT_ID is not configured.
 *
 * UBER API REQUIREMENTS:
 *  - Register at https://developer.uber.com/
 *  - Create an app and get client_id + client_secret
 *  - Request 'request' scope (privileged — requires Uber full-access review)
 *  - In sandbox mode: only your account + 5 test users can make requests
 *
 * CRITICAL: Uber's fare_id expires in 2 minutes.
 * The UI must enforce this — show a countdown and re-fetch if expired.
 *
 * OAuth Scopes used:
 *  - profile    (public) — user name and email
 *  - request    (privileged) — create/manage ride requests
 *  - ride_widgets (privileged, optional) — deep-link integration
 */

const ProviderAdapter = require('../ProviderAdapter');
const uberClient = require('./UberApiClient');
const { mapProduct, mapEstimate, mapTrackingData } = require('./UberResponseMapper');
const config = require('../../config');
const logger = require('../../config/logger');
const { decrypt } = require('../../utils/crypto.utils');

const UBER_OAUTH_SCOPES = ['profile', 'request'];
const FARE_ID_EXPIRY_MS = 2 * 60 * 1000; // 2 minutes

class UberAdapter extends ProviderAdapter {
  constructor() {
    super('uber');
  }

  // ===================================================================
  // IDENTITY
  // ===================================================================

  getProviderInfo() {
    return {
      id: 'uber',
      name: 'Uber',
      logoUrl: '/assets/providers/uber.svg',
      supportedCountries: ['IN', 'US', 'GB', 'AU'],
      vehicleCategories: ['economy', 'premium', 'suv', 'luxury', 'shared'],
      requiresOAuth: true,
      sandboxAvailable: true,
      description: 'Book Uber rides — UberGo, Uber Premier, UberXL and more',
    };
  }

  // ===================================================================
  // OAUTH
  // ===================================================================

  getOAuthUrl(state, redirectUri) {
    const params = new URLSearchParams({
      client_id: config.uber.clientId,
      response_type: 'code',
      scope: UBER_OAUTH_SCOPES.join(' '),
      state,
      redirect_uri: redirectUri || config.uber.redirectUri,
    });
    return `${config.uber.authUrl}/authorize?${params.toString()}`;
  }

  async handleOAuthCallback(code, redirectUri) {
    const raw = await uberClient.exchangeCodeForTokens(code, redirectUri || config.uber.redirectUri);
    return {
      accessToken: raw.access_token,
      refreshToken: raw.refresh_token,
      expiresIn: raw.expires_in,
      scope: raw.scope,
    };
  }

  async refreshAccessToken(encryptedRefreshToken) {
    const refreshToken = decrypt(encryptedRefreshToken);
    const raw = await uberClient.refreshToken(refreshToken);
    return {
      accessToken: raw.access_token,
      expiresIn: raw.expires_in,
    };
  }

  // ===================================================================
  // RIDE DISCOVERY
  // ===================================================================

  async getAvailableProducts(pickupLat, pickupLng, userTokens) {
    logger.debug('UberAdapter: getAvailableProducts', { pickupLat, pickupLng });
    const accessToken = userTokens ? decrypt(userTokens.accessToken) : null;
    const raw = await uberClient.getProducts(pickupLat, pickupLng, accessToken);
    return (raw.products || []).map(mapProduct);
  }

  async getRideEstimates(pickup, dropoff, userTokens) {
    logger.debug('UberAdapter: getRideEstimates', { pickup, dropoff });

    // Step 1: Get available products
    const accessToken = userTokens ? decrypt(userTokens.accessToken) : null;
    const rawProducts = await uberClient.getProducts(pickup.lat, pickup.lng, accessToken);
    const products = rawProducts.products || [];

    // Step 2: Fan out estimate requests for each product in parallel
    // Use allSettled so one failing product doesn't kill the rest
    const estimatePromises = products.map(async (product) => {
      try {
        const rawEstimate = await uberClient.getFareEstimate(
          product.product_id,
          pickup,
          dropoff,
          accessToken
        );
        return mapEstimate(rawEstimate, product);
      } catch (err) {
        logger.warn('UberAdapter: estimate failed for product', {
          productId: product.product_id,
          error: err.message,
        });
        return null;
      }
    });

    const results = await Promise.allSettled(estimatePromises);
    return results
      .filter((r) => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value);
  }

  // ===================================================================
  // BOOKING
  // ===================================================================

  async createBooking(userTokens, bookingParams) {
    const { productId, fareId, pickup, dropoff } = bookingParams;
    const accessToken = decrypt(userTokens.accessToken);

    logger.info('UberAdapter: createBooking', { productId });

    // NOTE: If fareId is expired (>2 minutes old), Uber returns HTTP 422.
    // The booking service checks isFareIdValid() before calling this.
    const raw = await uberClient.createRequest(accessToken, productId, fareId, pickup, dropoff);

    return {
      providerBookingId: raw.request_id,
      status: 'ALLOTMENT_PENDING',
      message: raw.status || 'Searching for a driver...',
      bookingTimeout: 70,
    };
  }

  async cancelBooking(userTokens, providerBookingId) {
    const accessToken = decrypt(userTokens.accessToken);
    await uberClient.cancelRequest(accessToken, providerBookingId);
    return { success: true, message: 'Uber booking cancelled' };
  }

  async getBookingStatus(userTokens, providerBookingId) {
    return this.trackRide(userTokens, providerBookingId);
  }

  // ===================================================================
  // TRACKING
  // ===================================================================

  async trackRide(userTokens, providerBookingId) {
    const accessToken = decrypt(userTokens.accessToken);
    const raw = await uberClient.getRequestStatus(accessToken, providerBookingId);
    return mapTrackingData(raw);
  }

  // ===================================================================
  // NORMALIZATION
  // ===================================================================

  normalizeEstimate(rawEstimate) {
    return rawEstimate; // Already normalized in getRideEstimates
  }

  normalizeTracking(rawTracking) {
    return mapTrackingData(rawTracking);
  }

  // ===================================================================
  // CONFIGURATION CHECK
  // ===================================================================

  isConfigured() {
    return !!(config.uber.clientId && config.uber.clientSecret);
  }
}

module.exports = UberAdapter;

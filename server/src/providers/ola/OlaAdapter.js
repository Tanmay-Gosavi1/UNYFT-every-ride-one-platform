/**
 * @module providers/ola/OlaAdapter
 * @description Ola ride-hailing provider adapter.
 *
 * STATUS: Ready for production credentials.
 *         Falls back gracefully if OLA_APP_TOKEN is not configured.
 *
 * OLA API REQUIREMENTS:
 *  - Register at https://developers.olacabs.com/
 *  - Request app_token and OAuth credentials
 *  - Ola uses CRN (Customer Reference Number) as the booking identifier
 *  - OTP is required to start rides (driver shows OTP on app, passenger confirms)
 *
 * OAuth Scopes:
 *  - profile     — user info
 *  - booking     — create/manage bookings
 *  - tracking    — real-time ride tracking
 */

const ProviderAdapter = require('../ProviderAdapter');
const olaClient = require('./OlaApiClient');
const { mapProduct, mapEstimate, mapTrackingData } = require('./OlaResponseMapper');
const config = require('../../config');
const logger = require('../../config/logger');
const { decrypt } = require('../../utils/crypto.utils');

const OLA_OAUTH_SCOPES = ['profile', 'booking', 'tracking'];

class OlaAdapter extends ProviderAdapter {
  constructor() {
    super('ola');
  }

  // ===================================================================
  // IDENTITY
  // ===================================================================

  getProviderInfo() {
    return {
      id: 'ola',
      name: 'Ola',
      logoUrl: '/assets/providers/ola.svg',
      supportedCountries: ['IN', 'AU', 'NZ', 'GB'],
      vehicleCategories: ['economy', 'premium', 'suv', 'luxury', 'auto', 'bike', 'shared'],
      requiresOAuth: true,
      sandboxAvailable: true,
      description: 'Book Ola rides — Micro, Mini, Prime, Auto and more',
    };
  }

  // ===================================================================
  // OAUTH
  // ===================================================================

  getOAuthUrl(state, redirectUri) {
    const params = new URLSearchParams({
      client_id: config.ola.clientId,
      response_type: 'code',
      scope: OLA_OAUTH_SCOPES.join(' '),
      state,
      redirect_uri: redirectUri || config.ola.redirectUri,
    });
    return `${config.ola.baseUrl}/oauth2/authorize?${params.toString()}`;
  }

  async handleOAuthCallback(code, redirectUri) {
    const raw = await olaClient.exchangeCodeForTokens(code, redirectUri || config.ola.redirectUri);
    return {
      accessToken: raw.access_token,
      refreshToken: raw.refresh_token,
      expiresIn: raw.expires_in,
      scope: OLA_OAUTH_SCOPES.join(' '),
    };
  }

  async refreshAccessToken(encryptedRefreshToken) {
    const refreshToken = decrypt(encryptedRefreshToken);
    const raw = await olaClient.refreshToken(refreshToken);
    return {
      accessToken: raw.access_token,
      expiresIn: raw.expires_in,
    };
  }

  // ===================================================================
  // RIDE DISCOVERY
  // ===================================================================

  async getAvailableProducts(pickupLat, pickupLng, userTokens) {
    logger.debug('OlaAdapter: getAvailableProducts', { pickupLat, pickupLng });
    const raw = await olaClient.getProducts(pickupLat, pickupLng);
    const categories = raw.categories || raw.ride_categories || [];
    return categories.map(mapProduct);
  }

  async getRideEstimates(pickup, dropoff, userTokens) {
    logger.debug('OlaAdapter: getRideEstimates', { pickup, dropoff });
    const accessToken = userTokens ? decrypt(userTokens.accessToken) : null;

    const raw = await olaClient.getFareEstimate(pickup, dropoff, null, accessToken);
    const categories = raw.categories || raw.ride_estimate || [];

    if (!Array.isArray(categories)) {
      // Single estimate response — wrap in array
      return [mapEstimate(categories)];
    }

    return categories.map(mapEstimate);
  }

  // ===================================================================
  // BOOKING
  // ===================================================================

  async createBooking(userTokens, bookingParams) {
    const { providerCategory, pickup, dropoff } = bookingParams;
    const accessToken = decrypt(userTokens.accessToken);

    logger.info('OlaAdapter: createBooking', { category: providerCategory });

    const raw = await olaClient.createBooking(
      accessToken,
      providerCategory || 'mini',
      pickup,
      dropoff
    );

    return {
      providerBookingId: raw.crn,
      status: 'ALLOTMENT_PENDING',
      message: raw.status || 'Searching for a driver...',
      bookingTimeout: 60,
    };
  }

  async cancelBooking(userTokens, providerBookingId, reason) {
    const accessToken = decrypt(userTokens.accessToken);
    await olaClient.cancelBooking(accessToken, providerBookingId, reason);
    return { success: true, message: 'Ola booking cancelled' };
  }

  async getBookingStatus(userTokens, providerBookingId) {
    return this.trackRide(userTokens, providerBookingId);
  }

  // ===================================================================
  // TRACKING
  // ===================================================================

  async trackRide(userTokens, providerBookingId) {
    const accessToken = decrypt(userTokens.accessToken);
    const raw = await olaClient.trackRide(accessToken, providerBookingId);
    return mapTrackingData(raw);
  }

  // ===================================================================
  // NORMALIZATION
  // ===================================================================

  normalizeEstimate(rawEstimate) {
    return mapEstimate(rawEstimate);
  }

  normalizeTracking(rawTracking) {
    return mapTrackingData(rawTracking);
  }

  // ===================================================================
  // CONFIGURATION CHECK
  // ===================================================================

  isConfigured() {
    return !!(config.ola.appToken && config.ola.clientId);
  }
}

module.exports = OlaAdapter;


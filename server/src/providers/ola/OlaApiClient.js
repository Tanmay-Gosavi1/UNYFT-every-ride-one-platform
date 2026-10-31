/**
 * @module providers/ola/OlaApiClient
 * @description Axios HTTP client for Ola Partner/Rider API calls.
 *
 * Ola API Base URLs:
 *  - Production:  https://devapi.olacabs.com
 *  - Sandbox:     https://sandbox-t.olacabs.com
 *
 * Authentication:
 *  - App-level:  X-APP-TOKEN header (server token)
 *  - User-level: Authorization: Bearer <user_access_token>
 *
 * Key API surfaces used:
 *  - GET  /v1/products                     → Available ride categories
 *  - POST /v1/offerings/estimate           → Fare estimate
 *  - POST /v1/bookings/create              → Create booking
 *  - GET  /v1/bookings/track_ride?crn=...  → Track ride (driver location + status)
 *  - POST /v1/bookings/cancel              → Cancel booking
 *  - POST /oauth2/token                    → Token exchange/refresh
 *
 * Reference: https://developers.olacabs.com/docs/
 */

const axios = require('axios');
const config = require('../../config');
const logger = require('../../config/logger');

/**
 * Creates an Axios instance for Ola API calls.
 *
 * @param {string} [accessToken] - User's OAuth access token
 * @returns {import('axios').AxiosInstance}
 */
function createOlaClient(accessToken) {
  const instance = axios.create({
    baseURL: config.ola.baseUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'X-APP-TOKEN': config.ola.appToken,
    },
  });

  if (accessToken) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  }

  // Request logging
  instance.interceptors.request.use((req) => {
    logger.debug('Ola API request', { method: req.method, url: req.url });
    return req;
  });

  // Error normalization
  instance.interceptors.response.use(
    (res) => res,
    (error) => {
      const status = error.response?.status;
      const data = error.response?.data;
      logger.warn('Ola API error', { status, data: JSON.stringify(data) });
      return Promise.reject(error);
    }
  );

  return instance;
}

/**
 * Fetches available Ola ride categories at a given location.
 *
 * @param {number} lat - Pickup latitude
 * @param {number} lng - Pickup longitude
 * @returns {Promise<object>} Raw Ola products response
 */
async function getProducts(lat, lng) {
  const client = createOlaClient();
  const { data } = await client.get('/v1/products', {
    params: { pickup_lat: lat, pickup_lng: lng },
  });
  return data;
}

/**
 * Gets a fare estimate for a ride on Ola.
 *
 * Ola estimate request body:
 * {
 *   pickup_lat, pickup_lng,
 *   drop_lat, drop_lng,
 *   category: 'micro' | 'mini' | 'prime' | 'suv' | 'auto' | 'bike' (optional)
 * }
 *
 * @param {{ lat: number, lng: number }} pickup
 * @param {{ lat: number, lng: number }} dropoff
 * @param {string} [category] - Specific Ola category
 * @param {string} [accessToken] - User token for upfront pricing
 * @returns {Promise<object>} Raw Ola estimate response
 */
async function getFareEstimate(pickup, dropoff, category, accessToken) {
  const client = createOlaClient(accessToken);
  const params = {
    pickup_lat: pickup.lat,
    pickup_lng: pickup.lng,
    drop_lat: dropoff.lat,
    drop_lng: dropoff.lng,
  };
  if (category) params.category = category;

  const { data } = await client.post('/v1/offerings/estimate', params);
  return data;
}

/**
 * Creates a booking on Ola.
 *
 * Ola booking request:
 * {
 *   pickup_lat, pickup_lng,
 *   drop_lat, drop_lng,
 *   category: 'mini',
 *   pickup_mode: 'NOW' | 'LATER'
 * }
 *
 * Returns a CRN (Customer Reference Number) used for tracking.
 *
 * @param {string} accessToken
 * @param {string} category - Ola category string
 * @param {{ lat: number, lng: number }} pickup
 * @param {{ lat: number, lng: number }} dropoff
 * @returns {Promise<object>} Raw Ola booking response including crn
 */
async function createBooking(accessToken, category, pickup, dropoff) {
  const client = createOlaClient(accessToken);
  const { data } = await client.post('/v1/bookings/create', {
    pickup_lat: pickup.lat,
    pickup_lng: pickup.lng,
    drop_lat: dropoff.lat,
    drop_lng: dropoff.lng,
    category,
    pickup_mode: 'NOW',
  });
  return data;
}

/**
 * Tracks a ride using the CRN (Customer Reference Number).
 *
 * Returns driver location, ETA, ride status, and OTP.
 *
 * @param {string} accessToken
 * @param {string} crn - Customer Reference Number
 * @returns {Promise<object>} Raw Ola tracking response
 */
async function trackRide(accessToken, crn) {
  const client = createOlaClient(accessToken);
  const { data } = await client.get('/v1/bookings/track_ride', {
    params: { crn },
  });
  return data;
}

/**
 * Cancels an Ola booking.
 *
 * @param {string} accessToken
 * @param {string} crn
 * @param {string} [reason='User cancelled']
 * @returns {Promise<object>}
 */
async function cancelBooking(accessToken, crn, reason) {
  const client = createOlaClient(accessToken);
  const { data } = await client.post('/v1/bookings/cancel', {
    crn,
    reason: reason || 'User cancelled',
  });
  return data;
}

/**
 * Exchanges an authorization code for Ola access/refresh tokens.
 *
 * @param {string} code - Authorization code from OAuth callback
 * @param {string} redirectUri
 * @returns {Promise<{ access_token: string, refresh_token: string, expires_in: number }>}
 */
async function exchangeCodeForTokens(code, redirectUri) {
  const { data } = await axios.post(
    `${config.ola.baseUrl}/oauth2/token`,
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.ola.clientId,
      client_secret: config.ola.clientSecret,
      redirect_uri: redirectUri,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return data;
}

/**
 * Refreshes an expired Ola access token.
 *
 * @param {string} refreshToken
 * @returns {Promise<{ access_token: string, expires_in: number }>}
 */
async function refreshToken(refreshToken) {
  const { data } = await axios.post(
    `${config.ola.baseUrl}/oauth2/token`,
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.ola.clientId,
      client_secret: config.ola.clientSecret,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return data;
}

module.exports = {
  getProducts,
  getFareEstimate,
  createBooking,
  trackRide,
  cancelBooking,
  exchangeCodeForTokens,
  refreshToken,
};


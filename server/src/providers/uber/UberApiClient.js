/**
 * @module providers/uber/UberApiClient
 * @description Axios HTTP client for Uber API v1.2 calls.
 *
 * Uber API Base URLs:
 *  - Production:  https://api.uber.com
 *  - Sandbox:     https://sandbox-api.uber.com
 *
 * Authentication:
 *  - Client-level (price estimates): Authorization: Token <server_token>
 *  - User-level (booking, tracking): Authorization: Bearer <user_access_token>
 *
 * Key API surfaces used:
 *  - GET  /v1.2/products              → Available products at location
 *  - POST /v1.2/requests/estimate     → Fare estimate + fare_id (expires 2 min!)
 *  - POST /v1.2/requests              → Create ride request
 *  - GET  /v1.2/requests/:request_id  → Ride status polling
 *  - DELETE /v1.2/requests/current    → Cancel active request
 *  - POST https://auth.uber.com/oauth/v2/token → Token exchange
 */

const axios = require('axios');
const config = require('../../config');
const logger = require('../../config/logger');

/**
 * Creates an Axios instance for Uber API calls.
 *
 * @param {string} [accessToken] - User's OAuth access token (optional for public endpoints)
 * @returns {import('axios').AxiosInstance}
 */
function createUberClient(accessToken) {
  const instance = axios.create({
    baseURL: config.uber.baseUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': 'en_US',
    },
  });

  // Attach authorization header based on token availability
  if (accessToken) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  } else if (config.uber.clientSecret) {
    // Server token for public endpoints (price estimates don't need user auth)
    instance.defaults.headers.common['Authorization'] = `Token ${config.uber.clientSecret}`;
  }

  // Request interceptor for logging
  instance.interceptors.request.use((req) => {
    logger.debug('Uber API request', { method: req.method, url: req.url });
    return req;
  });

  // Response interceptor for error normalization
  instance.interceptors.response.use(
    (res) => res,
    (error) => {
      const status = error.response?.status;
      const data = error.response?.data;
      logger.warn('Uber API error', { status, data: JSON.stringify(data) });
      return Promise.reject(error);
    }
  );

  return instance;
}

/**
 * Fetches available Uber products at a given pickup location.
 *
 * @param {number} lat - Pickup latitude
 * @param {number} lng - Pickup longitude
 * @returns {Promise<object>} Raw Uber products response
 */
async function getProducts(lat, lng) {
  const client = createUberClient();
  const { data } = await client.get('/v1.2/products', {
    params: { latitude: lat, longitude: lng },
  });
  return data;
}

/**
 * Gets a fare estimate for a specific Uber product.
 * Returns a fare_id that MUST be used within 2 minutes to create a booking.
 *
 * @param {string} productId - Uber product ID
 * @param {{ lat: number, lng: number }} pickup
 * @param {{ lat: number, lng: number }} dropoff
 * @param {string} [accessToken] - User token (required for some markets)
 * @returns {Promise<object>} Raw Uber estimate response including fare_id
 */
async function getFareEstimate(productId, pickup, dropoff, accessToken) {
  const client = createUberClient(accessToken);
  const { data } = await client.post('/v1.2/requests/estimate', {
    product_id: productId,
    start_latitude: pickup.lat,
    start_longitude: pickup.lng,
    end_latitude: dropoff.lat,
    end_longitude: dropoff.lng,
  });
  return data;
}

/**
 * Creates a ride request (books a ride).
 *
 * IMPORTANT: The fare_id from getFareEstimate expires in 2 minutes.
 * If the user takes longer to confirm, re-fetch the estimate.
 *
 * @param {string} accessToken - User's OAuth access token (required)
 * @param {string} productId
 * @param {string} fareId - From getFareEstimate (2-minute window!)
 * @param {{ lat: number, lng: number }} pickup
 * @param {{ lat: number, lng: number }} dropoff
 * @returns {Promise<object>} Raw Uber request response (202 Accepted)
 */
async function createRequest(accessToken, productId, fareId, pickup, dropoff) {
  const client = createUberClient(accessToken);
  const { data } = await client.post('/v1.2/requests', {
    fare_id: fareId,
    product_id: productId,
    start_latitude: pickup.lat,
    start_longitude: pickup.lng,
    end_latitude: dropoff.lat,
    end_longitude: dropoff.lng,
  });
  return data;
}

/**
 * Gets the current status of a ride request.
 * Poll this after booking to track driver allocation and location.
 *
 * @param {string} accessToken
 * @param {string} requestId - Uber request ID
 * @returns {Promise<object>}
 */
async function getRequestStatus(accessToken, requestId) {
  const client = createUberClient(accessToken);
  const { data } = await client.get(`/v1.2/requests/${requestId}`);
  return data;
}

/**
 * Cancels the user's current active ride request.
 *
 * @param {string} accessToken
 * @param {string} requestId
 * @returns {Promise<void>} 204 No Content on success
 */
async function cancelRequest(accessToken, requestId) {
  const client = createUberClient(accessToken);
  await client.delete(`/v1.2/requests/${requestId}`);
}

/**
 * Exchanges an authorization code for Uber access/refresh tokens.
 *
 * @param {string} code - Authorization code from OAuth callback
 * @param {string} redirectUri
 * @returns {Promise<{ access_token: string, refresh_token: string, expires_in: number, scope: string }>}
 */
async function exchangeCodeForTokens(code, redirectUri) {
  const { data } = await axios.post(
    `${config.uber.authUrl}/token`,
    new URLSearchParams({
      client_id: config.uber.clientId,
      client_secret: config.uber.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return data;
}

/**
 * Refreshes an expired Uber access token.
 *
 * @param {string} refreshToken
 * @returns {Promise<{ access_token: string, expires_in: number }>}
 */
async function refreshToken(refreshToken) {
  const { data } = await axios.post(
    `${config.uber.authUrl}/token`,
    new URLSearchParams({
      client_id: config.uber.clientId,
      client_secret: config.uber.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return data;
}

module.exports = {
  getProducts,
  getFareEstimate,
  createRequest,
  getRequestStatus,
  cancelRequest,
  exchangeCodeForTokens,
  refreshToken,
};

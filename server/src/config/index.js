/**
 * @module config
 * @description Central configuration module. Loads environment variables via dotenv
 * and exports a frozen configuration object. All environment-dependent values
 * should be accessed through this module — never read process.env directly
 * in application code.
 *
 * @example
 *   const config = require('./config');
 *   console.log(config.port); // 5000
 */

const dotenv = require('dotenv');
const path = require('path');

// Load .env file from server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Validates that all required environment variables are present.
 * Throws a descriptive error at startup if any are missing, rather
 * than failing silently at runtime.
 *
 * @param {string[]} requiredVars - List of required env var names
 * @throws {Error} If any required variables are missing
 */
function validateEnv(requiredVars) {
  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}\n\nCopy .env.example to .env and fill in the values.`
    );
  }
}

// In development, we only strictly require MongoDB and JWT secrets.
// Other services (Maps, Uber, Ola, Razorpay) can start with mocks.
const requiredInProduction = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

if (process.env.NODE_ENV === 'production') {
  validateEnv([
    ...requiredInProduction,
    'GOOGLE_MAPS_API_KEY',
    'ENCRYPTION_KEY',
  ]);
} else {
  validateEnv(requiredInProduction);
}

const config = Object.freeze({
  /** @type {'development' | 'production' | 'test'} */
  env: process.env.NODE_ENV || 'development',

  /** @type {number} Server port */
  port: parseInt(process.env.PORT, 10) || 5000,

  /** @type {string} API version prefix */
  apiVersion: process.env.API_VERSION || 'v1',

  /** MongoDB connection */
  mongodb: {
    uri: process.env.MONGODB_URI,
  },

  /** JWT authentication */
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  /** Google OAuth 2.0 (platform login) */
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },

  /** Google Maps Platform */
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
  },

  /** Uber API */
  uber: {
    clientId: process.env.UBER_CLIENT_ID,
    clientSecret: process.env.UBER_CLIENT_SECRET,
    redirectUri: process.env.UBER_REDIRECT_URI,
    sandbox: process.env.UBER_SANDBOX === 'true',
    baseUrl: process.env.UBER_SANDBOX === 'true'
      ? 'https://sandbox-api.uber.com'
      : 'https://api.uber.com',
    authUrl: 'https://auth.uber.com/oauth/v2',
  },

  /** Ola API */
  ola: {
    appToken: process.env.OLA_APP_TOKEN,
    clientId: process.env.OLA_CLIENT_ID,
    clientSecret: process.env.OLA_CLIENT_SECRET,
    redirectUri: process.env.OLA_REDIRECT_URI,
    sandbox: process.env.OLA_SANDBOX === 'true',
    baseUrl: process.env.OLA_SANDBOX === 'true'
      ? 'https://sandbox-t.olacabs.com'
      : 'https://devapi.olacabs.com',
  },

  /** Razorpay Payment Gateway */
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
  },

  /** Encryption for provider tokens at rest */
  encryption: {
    key: process.env.ENCRYPTION_KEY,
    ivLength: parseInt(process.env.ENCRYPTION_IV_LENGTH, 10) || 16,
  },

  /** CORS */
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  /** Redis (optional) */
  redis: {
    url: process.env.REDIS_URL,
  },
});

module.exports = config;

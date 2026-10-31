/**
 * @module services/auth.service
 * @description Authentication business logic.
 *
 * Handles registration, login, JWT token lifecycle, and profile management.
 * Uses a dual-token strategy:
 *  - Access token (short-lived, 15 min): Sent in Authorization header
 *  - Refresh token (long-lived, 7 days): Stored in httpOnly cookie
 *
 * SECURITY NOTES:
 *  - Passwords are bcrypt hashed (work factor 12) before storage
 *  - Refresh tokens are tracked per-user for revocation on logout
 *  - Access tokens are stateless (no DB lookup on every request)
 *  - Provider OAuth tokens are AES-256-CBC encrypted at rest
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const { encrypt, decrypt, generateRandomToken } = require('../utils/crypto.utils');
const logger = require('../config/logger');

/**
 * Generates an access + refresh token pair for a user.
 *
 * @param {object} user - Mongoose user document
 * @returns {{ accessToken: string, refreshToken: string, expiresIn: number }}
 */
function generateTokenPair(user) {
  const payload = {
    sub: user._id,
    email: user.email,
    name: user.name?.full || user.name?.first,
  };

  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
    issuer: 'ride-compare',
  });

  const refreshToken = jwt.sign(
    { sub: user._id, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn, issuer: 'ride-compare' }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
  };
}

/**
 * Registers a new user with email/password credentials.
 *
 * @param {object} data - Validated registration data
 * @param {string} data.email
 * @param {string} data.password
 * @param {string} data.firstName
 * @param {string} [data.lastName]
 * @param {string} [data.phone]
 * @returns {Promise<{ user: object, tokens: object }>}
 * @throws {AppError} 409 if email already exists
 */
async function register(data) {
  const { email, password, firstName, lastName, phone } = data;

  // Check if email exists
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
  }

  const user = new User({
    email,
    name: { first: firstName, last: lastName || '' },
    phone: phone ? { number: phone } : undefined,
  });

  // Set plaintext password — the pre-save hook will bcrypt hash it
  user._plaintextPassword = password;
  await user.save();

  const tokens = generateTokenPair(user);

  // Store refresh token for revocation tracking
  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: tokens.refreshToken },
  });

  logger.info('New user registered', { userId: user._id, email });

  return { user: sanitizeUser(user), tokens };
}

/**
 * Authenticates a user with email/password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: object, tokens: object }>}
 * @throws {AppError} 401 if credentials are invalid
 */
async function login(email, password) {
  // Include passwordHash in query (select: false in schema)
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated.', 401, 'ACCOUNT_INACTIVE');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const tokens = generateTokenPair(user);

  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: tokens.refreshToken },
  });

  logger.info('User logged in', { userId: user._id });

  return { user: sanitizeUser(user), tokens };
}

/**
 * Refreshes an expired access token using a valid refresh token.
 *
 * @param {string} refreshToken
 * @returns {Promise<{ accessToken: string, expiresIn: number }>}
 * @throws {AppError} 401 if refresh token is invalid or revoked
 */
async function refreshAccessToken(refreshToken) {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token.', 401, 'INVALID_REFRESH_TOKEN');
  }

  // Check if this refresh token is still in the user's stored list
  const user = await User.findById(decoded.sub).select('+refreshTokens');
  if (!user) {
    throw new AppError('User not found.', 401, 'USER_NOT_FOUND');
  }

  const isStored = user.refreshTokens?.includes(refreshToken);
  if (!isStored) {
    // Token was revoked (logout) — possible token theft
    logger.warn('Revoked refresh token used', { userId: user._id });
    // Invalidate ALL refresh tokens for this user (security measure)
    await User.findByIdAndUpdate(user._id, { $set: { refreshTokens: [] } });
    throw new AppError('Refresh token has been revoked. Please log in again.', 401, 'TOKEN_REVOKED');
  }

  // Generate new access token only (keep same refresh token)
  const payload = { sub: user._id, email: user.email, name: user.name?.first };
  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
    issuer: 'ride-compare',
  });

  return { accessToken, expiresIn: 900 };
}

/**
 * Logs out a user by revoking their refresh token.
 *
 * @param {string} userId
 * @param {string} refreshToken
 */
async function logout(userId, refreshToken) {
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: refreshToken },
  });
  logger.info('User logged out', { userId });
}

/**
 * Updates user profile fields.
 *
 * @param {string} userId
 * @param {object} updates
 * @returns {Promise<object>} Updated user
 */
async function updateProfile(userId, updates) {
  const allowedUpdates = {};
  if (updates.firstName) allowedUpdates['name.first'] = updates.firstName;
  if (updates.lastName !== undefined) allowedUpdates['name.last'] = updates.lastName;
  if (updates.phone) allowedUpdates['phone.number'] = updates.phone;
  if (updates.avatar) allowedUpdates.avatar = updates.avatar;
  if (updates.preferences) {
    if (updates.preferences.sortBy) {
      allowedUpdates['preferences.sortBy'] = updates.preferences.sortBy;
    }
  }

  const user = await User.findByIdAndUpdate(userId, { $set: allowedUpdates }, { new: true });
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

  return sanitizeUser(user);
}

/**
 * Retrieves the current user's profile.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  return sanitizeUser(user);
}

/**
 * Strips sensitive fields from a user document for API responses.
 *
 * @param {object} user
 * @returns {object}
 */
function sanitizeUser(user) {
  const obj = user.toJSON ? user.toJSON() : { ...user };
  delete obj.passwordHash;
  delete obj.refreshTokens;
  delete obj.__v;
  // Redact provider tokens — only show linked status
  if (obj.providerAccounts) {
    obj.providerAccounts = obj.providerAccounts.map((pa) => ({
      provider: pa.provider,
      connectedAt: pa.connectedAt,
      hasAccess: !!pa.accessToken,
    }));
  }
  return obj;
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  updateProfile,
  getProfile,
  generateTokenPair,
};


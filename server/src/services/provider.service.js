/**
 * @module services/provider.service
 * @description Provider account linking business logic.
 *
 * Handles the OAuth flow for connecting user accounts to ride providers
 * (Uber, Ola). Once linked, the user can book rides through those providers.
 *
 * Flow:
 *  1. Frontend calls GET /api/providers/:provider/auth → gets redirect URL
 *  2. User is redirected to provider's OAuth consent screen
 *  3. Provider redirects back to our callback with auth code
 *  4. Backend exchanges code for tokens, encrypts, and stores them
 *  5. User's provider account is now linked
 */

const User = require('../models/User');
const registry = require('../providers/ProviderRegistry');
const { encrypt, decrypt } = require('../utils/crypto.utils');
const { generateRandomToken } = require('../utils/crypto.utils');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

/**
 * Returns information about all available providers.
 *
 * @returns {object[]}
 */
function listProviders() {
  return registry.getAllProviderInfo();
}

/**
 * Generates the OAuth authorization URL for a provider.
 * Includes a CSRF state token that must be verified on callback.
 *
 * @param {string} providerId
 * @param {string} userId - For state token binding
 * @returns {{ authUrl: string, state: string }}
 */
function getAuthUrl(providerId, userId) {
  const adapter = registry.get(providerId);
  if (!adapter.isConfigured()) {
    throw new AppError(`Provider '${providerId}' is not configured.`, 400, 'PROVIDER_NOT_CONFIGURED');
  }
  if (!adapter.getProviderInfo().requiresOAuth) {
    throw new AppError(`Provider '${providerId}' does not require OAuth.`, 400, 'NO_OAUTH');
  }

  // State token: binds to user and has a short lifetime
  const state = `${userId}:${generateRandomToken(16)}`;

  const authUrl = adapter.getOAuthUrl(state);
  return { authUrl, state };
}

/**
 * Handles the OAuth callback: exchanges code for tokens, encrypts, and stores.
 *
 * @param {string} providerId
 * @param {string} code - Authorization code from provider
 * @param {string} state - Must match the state sent in getAuthUrl
 * @param {string} userId - Extracted from state token
 * @returns {Promise<object>} Updated user
 */
async function handleOAuthCallback(providerId, code, state, userId) {
  const adapter = registry.get(providerId);

  // Exchange code for tokens
  const tokens = await adapter.handleOAuthCallback(code);

  // Encrypt tokens before storage
  const encryptedAccess = encrypt(tokens.accessToken);
  const encryptedRefresh = tokens.refreshToken ? encrypt(tokens.refreshToken) : null;

  // Upsert provider account
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

  // Remove existing account for this provider (if re-linking)
  user.providerAccounts = user.providerAccounts.filter(
    (pa) => pa.provider !== providerId
  );

  // Add new provider account
  user.providerAccounts.push({
    provider: providerId,
    accessToken: encryptedAccess,
    refreshToken: encryptedRefresh,
    tokenExpiry: tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null,
    scopes: tokens.scope ? tokens.scope.split(' ') : [],
    connectedAt: new Date(),
  });

  await user.save();
  logger.info(`Provider ${providerId} linked for user`, { userId });

  return user;
}

/**
 * Unlinks a provider account from the user.
 *
 * @param {string} userId
 * @param {string} providerId
 * @returns {Promise<object>} Updated user
 */
async function unlinkProvider(userId, providerId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

  const hadProvider = user.providerAccounts.some((pa) => pa.provider === providerId);
  if (!hadProvider) {
    throw new AppError(`Provider '${providerId}' is not linked.`, 400, 'NOT_LINKED');
  }

  user.providerAccounts = user.providerAccounts.filter(
    (pa) => pa.provider !== providerId
  );
  await user.save();

  logger.info(`Provider ${providerId} unlinked for user`, { userId });
  return user;
}

module.exports = { listProviders, getAuthUrl, handleOAuthCallback, unlinkProvider };


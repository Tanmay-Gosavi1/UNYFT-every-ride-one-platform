/**
 * @module controllers/provider.controller
 * @description Handles HTTP requests for provider management and OAuth flows.
 */

const providerService = require('../services/provider.service');
const { sendSuccess } = require('../utils/response.utils');

/**
 * GET /api/providers
 * Returns all registered providers with their info and configuration status.
 */
async function listProviders(req, res) {
  const providers = providerService.listProviders();
  return sendSuccess(res, { providers });
}

/**
 * GET /api/providers/:provider/auth
 * Generates the OAuth redirect URL for linking a provider account.
 */
async function initiateOAuth(req, res) {
  const { authUrl, state } = providerService.getAuthUrl(
    req.params.provider,
    req.user._id.toString()
  );

  // Store state in session/cookie for CSRF verification on callback
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Allow redirect from provider
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  return sendSuccess(res, { authUrl, state }, 'Redirect user to authUrl');
}

/**
 * GET /api/providers/:provider/callback
 * Handles the OAuth callback from the provider.
 */
async function handleCallback(req, res) {
  const { code, state } = req.query;

  // Verify CSRF state
  const storedState = req.cookies?.oauth_state;
  if (!storedState || storedState !== state) {
    return res.status(400).json({ error: 'Invalid OAuth state. Please try again.' });
  }

  // Extract userId from state token
  const userId = state.split(':')[0];
  await providerService.handleOAuthCallback(req.params.provider, code, state, userId);

  // Clear the state cookie
  res.clearCookie('oauth_state');

  // Redirect to frontend with success
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return res.redirect(`${frontendUrl}/settings/providers?linked=${req.params.provider}`);
}

/**
 * DELETE /api/providers/:provider/unlink
 * Unlinks a provider account.
 */
async function unlinkProvider(req, res) {
  await providerService.unlinkProvider(req.user._id, req.params.provider);
  return sendSuccess(res, null, `${req.params.provider} account unlinked`);
}

module.exports = { listProviders, initiateOAuth, handleCallback, unlinkProvider };


/**
 * @module controllers/auth.controller
 * @description Handles HTTP requests for authentication endpoints.
 *
 * Controllers are thin — they parse request data, call the service,
 * and format the response. Business logic lives in services.
 */

const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response.utils');

/**
 * POST /api/auth/register
 * Creates a new user account.
 */
async function register(req, res) {
  const { user, tokens } = await authService.register(req.body);

  // Set refresh token as httpOnly cookie
  setRefreshCookie(res, tokens.refreshToken);

  return sendSuccess(res, { user, accessToken: tokens.accessToken, expiresIn: tokens.expiresIn }, 'Registration successful', 201);
}

/**
 * POST /api/auth/login
 * Authenticates with email/password.
 */
async function login(req, res) {
  const { email, password } = req.body;
  const { user, tokens } = await authService.login(email, password);

  setRefreshCookie(res, tokens.refreshToken);

  return sendSuccess(res, { user, accessToken: tokens.accessToken, expiresIn: tokens.expiresIn }, 'Login successful');
}

/**
 * POST /api/auth/refresh-token
 * Gets a new access token using the refresh token from cookie or body.
 */
async function refreshToken(req, res) {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  const result = await authService.refreshAccessToken(token);

  return sendSuccess(res, result, 'Token refreshed');
}

/**
 * POST /api/auth/logout
 * Revokes the current refresh token.
 */
async function logout(req, res) {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (token && req.user) {
    await authService.logout(req.user._id, token);
  }

  // Clear the cookie
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });

  return sendSuccess(res, null, 'Logged out successfully');
}

/**
 * GET /api/auth/me
 * Returns the current user's profile.
 */
async function getMe(req, res) {
  const user = await authService.getProfile(req.user._id);
  return sendSuccess(res, { user });
}

/**
 * PUT /api/auth/profile
 * Updates the current user's profile.
 */
async function updateProfile(req, res) {
  const user = await authService.updateProfile(req.user._id, req.body);
  return sendSuccess(res, { user }, 'Profile updated');
}

// --- Helpers ---

/**
 * Sets the refresh token as an httpOnly secure cookie.
 */
function setRefreshCookie(res, refreshToken) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth',
  });
}

module.exports = { register, login, refreshToken, logout, getMe, updateProfile };


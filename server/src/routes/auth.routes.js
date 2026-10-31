/**
 * @module routes/auth.routes
 * @description Authentication routes.
 *
 * Public:
 *   POST /register  — Create account
 *   POST /login     — Login with email/password
 *   POST /refresh-token — Refresh access token
 *
 * Protected (require valid JWT):
 *   POST /logout    — Revoke refresh token
 *   GET  /me        — Get current user profile
 *   PUT  /profile   — Update profile
 */

const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
} = require('../validators/auth.validator');

const router = Router();

// --- Public routes (rate-limited) ---
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', authLimiter, validate(refreshTokenSchema), authController.refreshToken);

// --- Protected routes ---
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, validate(updateProfileSchema), authController.updateProfile);

module.exports = router;


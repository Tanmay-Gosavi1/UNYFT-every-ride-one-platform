/**
 * @module routes/provider.routes
 * @description Provider listing and OAuth linking routes.
 *
 * Public:
 *   GET /                      — List all providers
 *
 * Protected:
 *   GET /:provider/auth        — Get OAuth redirect URL
 *   GET /:provider/callback    — OAuth callback handler
 *   DELETE /:provider/unlink   — Unlink a provider
 */

const { Router } = require('express');
const providerController = require('../controllers/provider.controller');
const { protect, optionalAuth } = require('../middleware/auth');

const router = Router();

// Public — list available providers
router.get('/', providerController.listProviders);

// Protected — OAuth flow & unlinking
router.get('/:provider/auth', protect, providerController.initiateOAuth);
router.get('/:provider/callback', optionalAuth, providerController.handleCallback);
router.delete('/:provider/unlink', protect, providerController.unlinkProvider);

module.exports = router;


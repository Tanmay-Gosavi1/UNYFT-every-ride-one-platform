/**
 * @module providers/bootstrap
 * @description Initializes and registers all provider adapters at startup.
 *
 * Called once from app.js during application boot. This is the ONLY place
 * that instantiates provider adapters — all other code gets them from the
 * ProviderRegistry singleton.
 *
 * To add a new provider:
 *  1. Import its adapter class
 *  2. Add a registry.register(new YourAdapter()) call below
 *  3. Done — the entire system discovers it automatically
 */

const registry = require('./ProviderRegistry');
const MockAdapter = require('./mock/MockAdapter');
const UberAdapter = require('./uber/UberAdapter');
const OlaAdapter = require('./ola/OlaAdapter');
const logger = require('../config/logger');

/**
 * Registers all provider adapters with the global registry.
 * Reports which providers are configured (have API keys) vs registered-only.
 */
function bootstrapProviders() {
  logger.info('Bootstrapping provider adapters...');

  // --- Mock Provider (always available) ---
  registry.register(new MockAdapter());

  // --- Uber ---
  const uber = new UberAdapter();
  registry.register(uber);
  if (uber.isConfigured()) {
    logger.info('Uber adapter: CONFIGURED (API keys present)');
  } else {
    logger.warn('Uber adapter: REGISTERED but not configured (set UBER_CLIENT_ID, UBER_CLIENT_SECRET)');
  }

  // --- Ola ---
  const ola = new OlaAdapter();
  registry.register(ola);
  if (ola.isConfigured()) {
    logger.info('Ola adapter: CONFIGURED (API keys present)');
  } else {
    logger.warn('Ola adapter: REGISTERED but not configured (set OLA_APP_TOKEN, OLA_CLIENT_ID)');
  }

  // --- Summary ---
  const all = registry.listIds();
  const configured = registry.getConfigured().map((a) => a.providerId);
  logger.info(`Provider bootstrap complete: ${all.length} registered, ${configured.length} configured`, {
    registered: all,
    configured,
  });
}

module.exports = bootstrapProviders;


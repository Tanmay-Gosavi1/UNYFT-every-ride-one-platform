/**
 * @module providers/ProviderRegistry
 * @description Singleton registry for all provider adapter instances.
 *
 * The registry is the single source of truth for which providers are
 * available. Services and controllers never instantiate adapters directly
 * — they always go through the registry.
 *
 * ADDING A NEW PROVIDER
 * ======================
 * 1. Create your adapter extending ProviderAdapter
 * 2. Import and register it here with registry.register(new YourAdapter())
 * 3. That's it — the entire system will automatically discover it
 *
 * @example
 *   const registry = require('../providers/ProviderRegistry');
 *   const adapter = registry.get('uber');
 *   const estimates = await adapter.getRideEstimates(pickup, dropoff, tokens);
 */

const logger = require('../config/logger');

class ProviderRegistry {
  constructor() {
    /** @type {Map<string, import('./ProviderAdapter')>} */
    this._adapters = new Map();
  }

  /**
   * Registers a provider adapter instance.
   * Throws if the adapter does not have a valid providerId.
   *
   * @param {import('./ProviderAdapter')} adapter
   * @throws {Error} If adapter is missing or has no providerId
   */
  register(adapter) {
    if (!adapter || !adapter.providerId) {
      throw new Error('Cannot register an adapter without a providerId');
    }
    this._adapters.set(adapter.providerId, adapter);
    logger.info(`Provider registered: ${adapter.providerId}`);
  }

  /**
   * Retrieves a provider adapter by ID.
   *
   * @param {string} providerId - e.g., 'uber', 'ola', 'mock'
   * @returns {import('./ProviderAdapter')}
   * @throws {Error} If provider is not registered
   */
  get(providerId) {
    const adapter = this._adapters.get(providerId);
    if (!adapter) {
      throw new Error(`Provider '${providerId}' is not registered. Available: ${this.listIds().join(', ')}`);
    }
    return adapter;
  }

  /**
   * Returns all registered provider adapter instances.
   *
   * @returns {import('./ProviderAdapter')[]}
   */
  getAll() {
    return Array.from(this._adapters.values());
  }

  /**
   * Returns all registered provider IDs.
   *
   * @returns {string[]}
   */
  listIds() {
    return Array.from(this._adapters.keys());
  }

  /**
   * Returns only adapters that are fully configured (have required API keys).
   * Used to filter providers before making live API calls.
   *
   * @returns {import('./ProviderAdapter')[]}
   */
  getConfigured() {
    return this.getAll().filter((adapter) => adapter.isConfigured());
  }

  /**
   * Checks whether a given provider ID is registered.
   *
   * @param {string} providerId
   * @returns {boolean}
   */
  has(providerId) {
    return this._adapters.has(providerId);
  }

  /**
   * Returns provider info objects for all registered providers.
   * Used by the GET /providers endpoint.
   *
   * @returns {object[]}
   */
  getAllProviderInfo() {
    return this.getAll().map((adapter) => ({
      ...adapter.getProviderInfo(),
      isConfigured: adapter.isConfigured(),
    }));
  }
}

// Singleton — one registry for the entire application lifecycle
const registry = new ProviderRegistry();

module.exports = registry;

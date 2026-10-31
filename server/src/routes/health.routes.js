/**
 * @module routes/health.routes
 * @description Health check and system status endpoints.
 *
 * GET /health — Lightweight liveness check (load balancers, uptime monitors)
 * GET /health/detailed — Full readiness check (DB, providers)
 */

const { Router } = require('express');
const mongoose = require('mongoose');
const registry = require('../providers/ProviderRegistry');
const { sendSuccess } = require('../utils/response.utils');

const router = Router();

/**
 * Lightweight health check — just confirms the process is alive.
 */
router.get('/', (req, res) => {
  return sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Detailed health check — verifies DB connection and provider status.
 */
router.get('/detailed', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const providers = registry.getAllProviderInfo();

  return sendSuccess(res, {
    status: dbState === 1 ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStatus[dbState] || 'unknown',
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    },
    providers: providers.map((p) => ({
      id: p.id,
      name: p.name,
      isConfigured: p.isConfigured,
    })),
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heap: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    },
  });
});

module.exports = router;


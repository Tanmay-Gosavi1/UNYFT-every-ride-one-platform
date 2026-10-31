/**
 * @module app
 * @description Express application factory.
 *
 * Creates and configures the Express app with all middleware, routes,
 * and error handlers. Separated from server.js to enable testing
 * (supertest can import app without starting the HTTP server).
 *
 * Middleware stack (order matters!):
 *  1. Security headers (helmet)
 *  2. CORS
 *  3. Cookie parsing
 *  4. Body parsing (JSON, URL-encoded)
 *  5. HTTP request logging (Morgan → Winston)
 *  6. Rate limiting (per-route)
 *  7. Routes
 *  8. 404 handler
 *  9. Global error handler
 */

require('express-async-errors'); // Patches Express to catch async errors automatically

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./config/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, AppError } = require('./middleware/errorHandler');
const bootstrapProviders = require('./providers/bootstrap');

// Route imports
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const rideRoutes = require('./routes/ride.routes');
const providerRoutes = require('./routes/provider.routes');

/**
 * Creates and returns the configured Express app.
 * @returns {import('express').Application}
 */
function createApp() {
  const app = express();

  // --- Security ---
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true, // Allow cookies (refresh token)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // --- Parsing ---
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // --- HTTP Request Logging ---
  app.use(morgan('combined', { stream: logger.stream }));

  // --- Global rate limit ---
  app.use('/api', apiLimiter);

  // --- Bootstrap providers ---
  bootstrapProviders();

  // --- Routes ---
  app.use('/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/rides', rideRoutes);
  app.use('/api/providers', providerRoutes);

  // --- 404 handler ---
  app.all('*', (req, res, next) => {
    next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, 'NOT_FOUND'));
  });

  // --- Global error handler (MUST be last) ---
  app.use(errorHandler);

  return app;
}

module.exports = createApp;


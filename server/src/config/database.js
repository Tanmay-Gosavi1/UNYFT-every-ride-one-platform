/**
 * @module config/database
 * @description MongoDB connection manager using Mongoose.
 * Handles connection lifecycle, retry logic, and graceful shutdown.
 *
 * Connection events are logged via Winston logger.
 * On SIGINT/SIGTERM, the connection is closed gracefully.
 *
 * @example
 *   const connectDB = require('./config/database');
 *   await connectDB();
 */

const mongoose = require('mongoose');
const logger = require('./logger');
const config = require('./index');

/**
 * Establishes connection to MongoDB Atlas.
 * Uses recommended Mongoose 8.x options.
 *
 * @returns {Promise<void>}
 * @throws {Error} If connection fails after retries
 */
async function connectDB() {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 5000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(config.mongodb.uri, {
        // Mongoose 8.x uses the new driver defaults, these are the most
        // important options for production reliability:
        serverSelectionTimeoutMS: 10000,  // Fail fast if cluster is unreachable
        socketTimeoutMS: 45000,            // Close sockets after 45s inactivity
        maxPoolSize: 50,                   // Connection pool size
        minPoolSize: 5,                    // Keep minimum connections warm
      });

      logger.info('MongoDB connected successfully', {
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        attempt,
      });

      return;
    } catch (error) {
      logger.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed`, {
        error: error.message,
        uri: config.mongodb.uri.replace(/\/\/.*@/, '//***:***@'), // Mask credentials
      });

      if (attempt === MAX_RETRIES) {
        logger.error('All MongoDB connection attempts exhausted. Exiting.');
        process.exit(1);
      }

      logger.info(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

// --- Connection event listeners ---

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', { error: err.message });
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

// --- Graceful shutdown ---

/**
 * Closes the Mongoose connection gracefully.
 * Called on process termination signals.
 */
async function gracefulShutdown(signal) {
  logger.info(`${signal} received. Closing MongoDB connection...`);
  await mongoose.connection.close();
  logger.info('MongoDB connection closed gracefully');
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = connectDB;

/**
 * @module server
 * @description Application entrypoint — starts HTTP server, connects DB, and sets up Socket.IO.
 *
 * Startup sequence:
 *  1. Load and validate environment variables (config/index.js)
 *  2. Connect to MongoDB with retry logic (config/database.js)
 *  3. Create Express app (app.js)
 *  4. Create HTTP server and attach Socket.IO
 *  5. Start listening on configured port
 *
 * Graceful shutdown:
 *  - SIGINT / SIGTERM triggers cleanup
 *  - Closes Socket.IO connections
 *  - Closes HTTP server (stops accepting new connections)
 *  - Disconnects from MongoDB
 *  - Exits process
 */

const http = require('http');
const config = require('./config');
const { connectDB, disconnectDB } = require('./config/database');
const logger = require('./config/logger');
const createApp = require('./app');
const { setupSocketIO } = require('./socket');

async function startServer() {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Create Express app
    const app = createApp();

    // 3. Create HTTP server
    const server = http.createServer(app);

    // 4. Setup Socket.IO for real-time tracking
    const io = setupSocketIO(server);

    // Make io accessible to controllers/services if needed
    app.set('io', io);

    // 5. Start listening
    const PORT = config.port;
    server.listen(PORT, () => {
      logger.info(`🚀 Ride Compare API server running`, {
        port: PORT,
        environment: config.nodeEnv,
        url: `http://localhost:${PORT}`,
        health: `http://localhost:${PORT}/health`,
        api: `http://localhost:${PORT}/api`,
      });
    });

    // --- Graceful shutdown ---
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully...`);

      // Close Socket.IO
      io.close(() => logger.info('Socket.IO connections closed'));

      // Stop accepting new HTTP connections
      server.close(async () => {
        logger.info('HTTP server closed');

        // Disconnect from MongoDB
        await disconnectDB();

        logger.info('Graceful shutdown complete');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown — could not close connections in time');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // --- Unhandled rejection / exception safety nets ---
    process.on('unhandledRejection', (reason) => {
      logger.error('UNHANDLED REJECTION', { error: reason?.message || reason });
      // Don't exit — let the error handler deal with it
    });

    process.on('uncaughtException', (err) => {
      logger.error('UNCAUGHT EXCEPTION — shutting down', { error: err.message, stack: err.stack });
      process.exit(1);
    });

  } catch (err) {
    logger.error('Failed to start server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

startServer();


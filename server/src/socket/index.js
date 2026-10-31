/**
 * @module socket
 * @description Socket.IO setup for real-time ride tracking.
 *
 * Events architecture:
 *
 * CLIENT → SERVER:
 *  - 'subscribe_tracking'   { bookingId }  — Start receiving updates for a booking
 *  - 'unsubscribe_tracking' { bookingId }  — Stop receiving updates
 *
 * SERVER → CLIENT:
 *  - 'tracking_update'  { bookingId, status, driverLocation, ... }
 *  - 'booking_status'   { bookingId, status, ... }       — Status transitions
 *  - 'error'            { message, code }                  — Error events
 *
 * Each booking gets its own Socket.IO room: `booking:{bookingId}`
 * This means only the user tracking that specific booking receives updates.
 *
 * Authentication:
 *  - Client must send the JWT access token in the auth handshake
 *  - Unauthenticated connections are rejected
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config');
const { SOCKET_EVENTS } = require('./config/constants');
const logger = require('./config/logger');

/**
 * Creates and configures the Socket.IO server.
 *
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
function setupSocketIO(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,    // How often to check connection health
    pingTimeout: 10000,     // How long to wait for pong
    transports: ['websocket', 'polling'],
  });

  // --- Authentication middleware ---
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret);
      socket.userId = decoded.sub;
      socket.userEmail = decoded.email;
      return next();
    } catch (err) {
      return next(new Error('Invalid or expired token'));
    }
  });

  // --- Connection handler ---
  io.on('connection', (socket) => {
    logger.info('Socket connected', {
      socketId: socket.id,
      userId: socket.userId,
    });

    // --- Subscribe to booking tracking ---
    socket.on(SOCKET_EVENTS.SUBSCRIBE_TRACKING, ({ bookingId }) => {
      if (!bookingId) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'bookingId is required', code: 'MISSING_BOOKING_ID' });
        return;
      }

      const room = `booking:${bookingId}`;
      socket.join(room);
      logger.debug('Socket joined tracking room', { socketId: socket.id, room });
    });

    // --- Unsubscribe from booking tracking ---
    socket.on(SOCKET_EVENTS.UNSUBSCRIBE_TRACKING, ({ bookingId }) => {
      const room = `booking:${bookingId}`;
      socket.leave(room);
      logger.debug('Socket left tracking room', { socketId: socket.id, room });
    });

    // --- Disconnect ---
    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', {
        socketId: socket.id,
        userId: socket.userId,
        reason,
      });
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}

/**
 * Emits a tracking update to all clients subscribed to a booking.
 * Called by the TrackingService when provider data changes.
 *
 * @param {import('socket.io').Server} io
 * @param {string} bookingId
 * @param {object} trackingData
 */
function emitTrackingUpdate(io, bookingId, trackingData) {
  const room = `booking:${bookingId}`;
  io.to(room).emit(SOCKET_EVENTS.TRACKING_UPDATE, {
    bookingId,
    ...trackingData,
    timestamp: new Date(),
  });
}

/**
 * Emits a status change event for a booking.
 *
 * @param {import('socket.io').Server} io
 * @param {string} bookingId
 * @param {string} status
 * @param {object} [data={}]
 */
function emitBookingStatus(io, bookingId, status, data = {}) {
  const room = `booking:${bookingId}`;
  io.to(room).emit(SOCKET_EVENTS.BOOKING_STATUS, {
    bookingId,
    status,
    ...data,
    timestamp: new Date(),
  });
}

module.exports = { setupSocketIO, emitTrackingUpdate, emitBookingStatus };


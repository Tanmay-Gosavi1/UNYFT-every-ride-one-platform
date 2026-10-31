/**
 * @module providers/mock/MockTrackingSimulator
 * @description Simulates live driver tracking for active mock bookings.
 *
 * After a booking is created, this simulator:
 *  1. Places a driver at a random nearby location
 *  2. Moves them toward the pickup in steps (DRIVER_EN_ROUTE → DRIVER_ARRIVED)
 *  3. Simulates ride progress toward the dropoff (IN_PROGRESS)
 *  4. Completes the ride after reaching the dropoff (COMPLETED)
 *
 * Each active booking has its own simulation state, stored in memory.
 * State is cleared when the booking reaches a terminal state.
 *
 * This is intentionally simple and uses setInterval-based polling.
 * In production, real tracking comes from provider APIs.
 */

const { BOOKING_STATUS } = require('../../config/constants');
const { calculateBearing, interpolatePosition } = require('../../utils/geo.utils');
const { generateNearbyLocation, generateDriver } = require('./MockDataGenerator');
const { buildFareBreakup } = require('../../utils/fare.utils');
const logger = require('../../config/logger');

/** In-memory simulation states keyed by providerBookingId */
const simulations = new Map();

/** Interval between each simulation tick (ms) */
const TICK_MS = 3000;

/** Number of ticks to spend in each phase */
const PHASE_TICKS = {
  ALLOTMENT_PENDING: 3,   // ~9 seconds searching for driver
  EN_ROUTE: 10,            // ~30 seconds driver coming to pickup
  ARRIVED_WAIT: 2,         // ~6 seconds waiting at pickup
  IN_PROGRESS: 15,         // ~45 seconds for the trip
};

/**
 * Creates and starts a simulation for a newly created mock booking.
 *
 * @param {string} bookingId - Internal booking ID (MongoDB _id string)
 * @param {string} providerBookingId - Mock provider booking reference
 * @param {{ lat: number, lng: number }} pickup
 * @param {{ lat: number, lng: number }} dropoff
 * @param {string} category - Vehicle category for driver generation
 * @param {Function} onUpdate - Callback(trackingData) called on each tick
 */
function startSimulation(bookingId, providerBookingId, pickup, dropoff, category, onUpdate) {
  if (simulations.has(providerBookingId)) {
    logger.warn(`Simulation already running for ${providerBookingId}`);
    return;
  }

  const driver = generateDriver(category);
  const driverStartPos = generateNearbyLocation(pickup.lat, pickup.lng, 1.0); // ~1km away

  const state = {
    phase: 'ALLOTMENT_PENDING',
    tick: 0,
    driver,
    driverPos: { ...driverStartPos },
    pickup,
    dropoff,
    category,
    intervalId: null,
  };

  state.intervalId = setInterval(() => {
    try {
      const update = processTick(state, providerBookingId);
      if (update) onUpdate(update);

      // Stop simulation on terminal states
      if ([
        BOOKING_STATUS.COMPLETED,
        BOOKING_STATUS.CANCELLED,
        BOOKING_STATUS.FAILED,
      ].includes(update?.status)) {
        stopSimulation(providerBookingId);
      }
    } catch (err) {
      logger.error('Mock simulation tick error', { error: err.message, providerBookingId });
      stopSimulation(providerBookingId);
    }
  }, TICK_MS);

  simulations.set(providerBookingId, state);
  logger.debug(`Mock simulation started: ${providerBookingId}`);
}

/**
 * Processes one simulation tick and returns the updated tracking data.
 *
 * @param {object} state - Current simulation state (mutated in place)
 * @param {string} providerBookingId
 * @returns {import('../ProviderAdapter').NormalizedTrackingData}
 */
function processTick(state, providerBookingId) {
  state.tick++;

  // --- Phase transitions ---
  if (state.phase === 'ALLOTMENT_PENDING' && state.tick >= PHASE_TICKS.ALLOTMENT_PENDING) {
    state.phase = 'EN_ROUTE';
    state.tick = 0;
  } else if (state.phase === 'EN_ROUTE' && state.tick >= PHASE_TICKS.EN_ROUTE) {
    state.phase = 'ARRIVED';
    state.tick = 0;
    state.driverPos = { ...state.pickup };
  } else if (state.phase === 'ARRIVED' && state.tick >= PHASE_TICKS.ARRIVED_WAIT) {
    state.phase = 'IN_PROGRESS';
    state.tick = 0;
  } else if (state.phase === 'IN_PROGRESS' && state.tick >= PHASE_TICKS.IN_PROGRESS) {
    state.phase = 'COMPLETED';
  }

  // --- Move driver position ---
  let bearing = 0;
  if (state.phase === 'EN_ROUTE') {
    const fraction = state.tick / PHASE_TICKS.EN_ROUTE;
    state.driverPos = interpolatePosition(
      simulations.get(providerBookingId)?.driverPos?.lat ?? state.driverPos.lat,
      simulations.get(providerBookingId)?.driverPos?.lng ?? state.driverPos.lng,
      state.pickup.lat,
      state.pickup.lng,
      fraction / PHASE_TICKS.EN_ROUTE // Move incrementally
    );
    bearing = calculateBearing(state.driverPos.lat, state.driverPos.lng, state.pickup.lat, state.pickup.lng);
  } else if (state.phase === 'IN_PROGRESS') {
    const fraction = state.tick / PHASE_TICKS.IN_PROGRESS;
    state.driverPos = interpolatePosition(
      state.pickup.lat,
      state.pickup.lng,
      state.dropoff.lat,
      state.dropoff.lng,
      fraction
    );
    bearing = calculateBearing(state.driverPos.lat, state.driverPos.lng, state.dropoff.lat, state.dropoff.lng);
  }

  // --- Map phase to normalized status ---
  const statusMap = {
    ALLOTMENT_PENDING: BOOKING_STATUS.ALLOTMENT_PENDING,
    EN_ROUTE: BOOKING_STATUS.DRIVER_EN_ROUTE,
    ARRIVED: BOOKING_STATUS.DRIVER_ARRIVED,
    IN_PROGRESS: BOOKING_STATUS.IN_PROGRESS,
    COMPLETED: BOOKING_STATUS.COMPLETED,
  };

  const normalizedStatus = statusMap[state.phase];
  const etaToPickup = state.phase === 'EN_ROUTE'
    ? Math.max(1, PHASE_TICKS.EN_ROUTE - state.tick)
    : 0;

  const base = {
    providerBookingId,
    status: normalizedStatus,
    driverLocation: {
      lat: parseFloat(state.driverPos.lat.toFixed(6)),
      lng: parseFloat(state.driverPos.lng.toFixed(6)),
      bearing: Math.round(bearing),
      speed: state.phase === 'IN_PROGRESS' ? Math.floor(20 + Math.random() * 25) : 15,
      updatedAt: new Date(),
    },
  };

  if (normalizedStatus !== BOOKING_STATUS.ALLOTMENT_PENDING) {
    base.driver = state.driver;
    base.otp = String(Math.floor(1000 + Math.random() * 9000));
    base.shareRideUrl = `https://mock-ride.local/track/${providerBookingId}`;
    base.eta = { value: etaToPickup, unit: 'MINUTES' };
  }

  if (normalizedStatus === BOOKING_STATUS.COMPLETED) {
    const dist = 5 + Math.random() * 10; // 5–15 km
    const dur = Math.floor(dist * 3 + Math.random() * 10); // rough minutes
    base.tripInfo = buildFareBreakup(dist, dur, state.category);
    base.tripInfo.distance = parseFloat(dist.toFixed(1));
    base.tripInfo.duration = dur;
  }

  return base;
}

/**
 * Stops and cleans up a simulation.
 *
 * @param {string} providerBookingId
 */
function stopSimulation(providerBookingId) {
  const state = simulations.get(providerBookingId);
  if (state) {
    clearInterval(state.intervalId);
    simulations.delete(providerBookingId);
    logger.debug(`Mock simulation stopped: ${providerBookingId}`);
  }
}

/**
 * Returns the current tracking snapshot for a booking
 * without advancing the simulation (read-only poll).
 *
 * @param {string} providerBookingId
 * @returns {import('../ProviderAdapter').NormalizedTrackingData|null}
 */
function getSnapshot(providerBookingId) {
  const state = simulations.get(providerBookingId);
  if (!state) return null;
  return processTick(state, providerBookingId);
}

module.exports = { startSimulation, stopSimulation, getSnapshot };

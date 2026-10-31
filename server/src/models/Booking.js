/**
 * @module models/Booking
 * @description Mongoose schema for ride bookings.
 *
 * A booking goes through a well-defined state machine:
 *
 *   ESTIMATE_FETCHED
 *     → BOOKING_REQUESTED (user confirms)
 *     → ALLOTMENT_PENDING (provider searching for driver)
 *     → DRIVER_ALLOCATED (driver found)
 *     → DRIVER_EN_ROUTE (driver heading to pickup)
 *     → DRIVER_ARRIVED (driver at pickup)
 *     → IN_PROGRESS (trip started)
 *     → COMPLETED (trip ended, bill generated)
 *
 *   Any active state → CANCELLED | FAILED
 *
 * The statusHistory array preserves every transition for audit/debugging.
 *
 * Indexes:
 *  - userId + status: most common query (find user's active booking)
 *  - provider + providerBookingId: for polling tracking APIs
 *  - createdAt: for history pagination
 */

const mongoose = require('mongoose');
const { BOOKING_STATUS, VEHICLE_CATEGORY, PROVIDER, PAYMENT_STATUS } = require('../config/constants');

// --- Sub-schemas ---

const locationSchema = new mongoose.Schema(
  {
    address: { type: String },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    timestamp: { type: Date },
  },
  { _id: false }
);

const vehicleSchema = new mongoose.Schema(
  {
    make: String,
    model: String,
    color: String,
    licensePlate: String,
  },
  { _id: false }
);

const driverLocationSchema = new mongoose.Schema(
  {
    lat: Number,
    lng: Number,
    bearing: Number,  // 0–360 degrees, 0 = North
    speed: Number,    // km/h
    updatedAt: Date,
  },
  { _id: false }
);

const driverSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    rating: { type: Number, min: 0, max: 5 },
    imageUrl: String,
    vehicle: vehicleSchema,
    currentLocation: driverLocationSchema,
  },
  { _id: false }
);

const fareBreakupItemSchema = new mongoose.Schema(
  {
    label: String,
    amount: Number,
  },
  { _id: false }
);

const tripInfoSchema = new mongoose.Schema(
  {
    actualFare: Number,
    distance: Number,       // km
    duration: Number,       // minutes
    fareBreakup: [fareBreakupItemSchema],
    paymentMode: String,    // 'cash', 'ola_money', 'uber_wallet', etc.
    paymentStatus: String,
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    platformFee: { type: Number, default: 0 },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    /** Extra context at time of transition (e.g., error code, driver info) */
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

// --- Main Booking Schema ---

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    /** Which provider this booking is with */
    provider: {
      type: String,
      enum: Object.values(PROVIDER),
      required: true,
    },

    /** Provider's own booking reference (e.g., Ola: 'CRN123456789', Uber: request_id) */
    providerBookingId: { type: String },

    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.ESTIMATE_FETCHED,
      index: true,
    },

    pickup: locationSchema,
    dropoff: locationSchema,

    /** Normalized vehicle category for cross-provider comparison */
    vehicleCategory: {
      type: String,
      enum: Object.values(VEHICLE_CATEGORY),
    },

    /** Provider's own category string (e.g., 'UberX', 'mini', 'prime') */
    providerCategory: { type: String },

    estimate: {
      fareMin: Number,
      fareMax: Number,
      currency: { type: String, default: 'INR' },
      surgeMultiplier: { type: Number, default: 1.0 },
      estimatedDuration: Number,   // minutes
      estimatedDistance: Number,   // km
      /**
       * Provider-specific fare lock ID.
       * Uber: fare_id (expires in 2 minutes — enforced at application level)
       * Ola:  fare_id (required for upfront pricing categories)
       */
      fareId: String,
      fareIdExpiry: Date,
    },

    /** Populated after driver is allocated */
    driver: driverSchema,

    /** Ola-style OTP required to start the trip */
    otp: { type: String },

    /** URL to share live ride with emergency contacts */
    shareRideUrl: { type: String },

    /** Populated after ride completes */
    tripInfo: tripInfoSchema,

    /** Platform-level payment (our commission) */
    payment: paymentSchema,

    /** User's rating for this ride (1–5 stars) */
    userRating: { type: Number, min: 1, max: 5 },
    userReview: { type: String, maxlength: 500 },

    /** Full status transition history for audit trail */
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
  }
);

// --- Compound Indexes ---

// Most common query: "get user's active booking"
bookingSchema.index({ userId: 1, status: 1 });
// Polling tracking: "get booking by provider ref"
bookingSchema.index({ provider: 1, providerBookingId: 1 }, { sparse: true });
// History pagination
bookingSchema.index({ userId: 1, createdAt: -1 });

// --- Instance Methods ---

/**
 * Transitions the booking to a new status and records the history entry.
 * Call save() after to persist.
 *
 * @param {string} newStatus - One of BOOKING_STATUS values
 * @param {object} [metadata={}] - Additional context for the transition
 */
bookingSchema.methods.transition = function (newStatus, metadata = {}) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    metadata,
  });
};

/**
 * Returns true if the booking is in any active state
 * (i.e., not yet completed, cancelled, or failed).
 *
 * @returns {boolean}
 */
bookingSchema.methods.isActive = function () {
  const inactiveStatuses = [
    BOOKING_STATUS.COMPLETED,
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.FAILED,
  ];
  return !inactiveStatuses.includes(this.status);
};

/**
 * Checks if the fare_id is still valid (not expired).
 * Uber's fare_id expires after 2 minutes.
 *
 * @returns {boolean}
 */
bookingSchema.methods.isFareIdValid = function () {
  if (!this.estimate.fareId || !this.estimate.fareIdExpiry) return false;
  return new Date() < new Date(this.estimate.fareIdExpiry);
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;

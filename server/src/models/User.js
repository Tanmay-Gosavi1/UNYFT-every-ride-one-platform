/**
 * @module models/User
 * @description Mongoose schema for platform users.
 *
 * A user has two independent auth layers:
 *  1. Platform credentials (email/password or Google OAuth) — to log into Ride Compare
 *  2. Provider accounts (Uber OAuth, Ola OAuth) — to book rides on linked providers
 *
 * Provider OAuth tokens are stored AES-256 encrypted at rest.
 * Passwords are bcrypt hashed (work factor 12).
 *
 * Indexes:
 *  - email: unique (primary lookup)
 *  - phone.number: for phone-based lookups
 *  - providerAccounts.provider: for provider token retrieval
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { SORT_BY } = require('../config/constants');

const BCRYPT_WORK_FACTOR = 12;

// --- Sub-schemas ---

/**
 * Represents a linked ride-hailing provider account.
 * OAuth tokens are encrypted before storage.
 */
const providerAccountSchema = new mongoose.Schema(
  {
    /** Provider identifier: 'uber', 'ola', etc. */
    provider: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    /** AES-256-CBC encrypted access token */
    accessToken: { type: String, required: true },
    /** AES-256-CBC encrypted refresh token */
    refreshToken: { type: String },
    /** When the access token expires */
    tokenExpiry: { type: Date },
    /** User's account ID on the provider platform */
    providerUserId: { type: String },
    /** OAuth scopes granted by the user */
    scopes: [{ type: String }],
    /** When this provider was linked */
    connectedAt: { type: Date, default: Date.now },
  },
  { _id: false } // No separate _id for sub-documents
);

/**
 * A saved favorite location (home, work, etc.)
 */
const favoriteLocationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    address: { type: String, required: true },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
  },
  { _id: true }
);

// --- Main User Schema ---

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },

    /** bcrypt hash. Null for Google-only users. */
    passwordHash: { type: String, select: false },

    name: {
      first: { type: String, required: true, trim: true, maxlength: 100 },
      last: { type: String, trim: true, maxlength: 100 },
    },

    phone: {
      countryCode: { type: String, default: '+91' },
      number: { type: String, trim: true },
      verified: { type: Boolean, default: false },
    },

    avatar: { type: String }, // URL to profile picture

    /** Social auth providers used for platform login */
    authProviders: {
      google: {
        id: String,
        email: String,
      },
    },

    /**
     * Linked ride-hailing provider accounts.
     * Each entry enables booking through that provider.
     */
    providerAccounts: [providerAccountSchema],

    preferences: {
      /** Default sort order for ride comparison results */
      sortBy: {
        type: String,
        enum: Object.values(SORT_BY),
        default: SORT_BY.PRICE,
      },
      favoriteLocations: [favoriteLocationSchema],
    },

    /** For soft-delete or account suspension */
    isActive: { type: Boolean, default: true },

    /** Refresh tokens stored for invalidation on logout */
    refreshTokens: [{ type: String, select: false }],
  },
  {
    timestamps: true, // Adds createdAt, updatedAt automatically
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        // Never expose sensitive fields in JSON output
        delete ret.passwordHash;
        delete ret.refreshTokens;
        return ret;
      },
    },
  }
);

// --- Indexes ---

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'phone.number': 1 }, { sparse: true });
userSchema.index({ 'providerAccounts.provider': 1 });
userSchema.index({ 'authProviders.google.id': 1 }, { sparse: true });

// --- Virtuals ---

/** Full name convenience virtual */
userSchema.virtual('name.full').get(function () {
  return `${this.name.first} ${this.name.last || ''}`.trim();
});

// --- Instance Methods ---

/**
 * Compares a plaintext password against the stored hash.
 *
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Returns the provider account entry for a given provider ID.
 *
 * @param {string} providerId - e.g., 'uber', 'ola'
 * @returns {object|undefined}
 */
userSchema.methods.getProviderAccount = function (providerId) {
  return this.providerAccounts.find((pa) => pa.provider === providerId);
};

/**
 * Checks if a given provider is linked to this user.
 *
 * @param {string} providerId
 * @returns {boolean}
 */
userSchema.methods.hasProvider = function (providerId) {
  return this.providerAccounts.some((pa) => pa.provider === providerId);
};

// --- Pre-save Middleware ---

/**
 * Hash password before saving if it has been set or modified.
 */
userSchema.pre('save', async function (next) {
  // Only hash if passwordHash was explicitly set as plaintext
  // We check a temporary flag set by the auth service
  if (this._plaintextPassword) {
    this.passwordHash = await bcrypt.hash(this._plaintextPassword, BCRYPT_WORK_FACTOR);
    delete this._plaintextPassword;
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;

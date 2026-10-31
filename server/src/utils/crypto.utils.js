/**
 * @module utils/crypto
 * @description Cryptographic utilities for the platform.
 *
 * Responsibilities:
 *  - AES-256-CBC encryption/decryption for provider OAuth tokens at rest
 *  - Secure random token generation
 *  - HMAC-SHA256 signature computation (used by Razorpay verification)
 *
 * Why encrypt tokens at rest?
 *  Provider access/refresh tokens grant access to users' Uber/Ola accounts.
 *  If the MongoDB database were ever compromised, encrypted tokens are useless
 *  without the ENCRYPTION_KEY, which is stored separately in environment config.
 */

const crypto = require('crypto');
const config = require('../config');

const ALGORITHM = 'aes-256-cbc';

/**
 * Derives a 32-byte key buffer from the hex ENCRYPTION_KEY config value.
 * AES-256 requires exactly 32 bytes.
 *
 * @returns {Buffer}
 * @throws {Error} If ENCRYPTION_KEY is not set or invalid
 */
function getKeyBuffer() {
  const { key } = config.encryption;
  if (!key) throw new Error('ENCRYPTION_KEY is not configured');
  const keyBuf = Buffer.from(key, 'hex');
  if (keyBuf.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return keyBuf;
}

/**
 * Encrypts a plaintext string using AES-256-CBC with a random IV.
 * The IV is prepended to the ciphertext (hex:hex format) so it can be
 * recovered during decryption.
 *
 * @param {string} plaintext - Value to encrypt
 * @returns {string} `iv:encrypted` string (both hex-encoded)
 * @example
 *   const token = encrypt('uber_access_token_abc123');
 *   // → '3f4a...iv...hex:a8c3...cipher...hex'
 */
function encrypt(plaintext) {
  const iv = crypto.randomBytes(config.encryption.ivLength);
  const cipher = crypto.createCipheriv(ALGORITHM, getKeyBuffer(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts a value that was encrypted with {@link encrypt}.
 *
 * @param {string} encryptedText - `iv:encrypted` string from encrypt()
 * @returns {string} Original plaintext
 * @throws {Error} If the format is invalid or decryption fails
 */
function decrypt(encryptedText) {
  const [ivHex, encryptedHex] = encryptedText.split(':');
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted text format. Expected "iv:encrypted".');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKeyBuffer(), iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Generates a cryptographically secure random token.
 *
 * @param {number} [bytes=32] - Number of random bytes (default 32 → 64-char hex)
 * @returns {string} Hex-encoded random token
 */
function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Computes an HMAC-SHA256 signature.
 * Used for Razorpay payment verification.
 *
 * @param {string} data - Data to sign
 * @param {string} secret - HMAC secret key
 * @returns {string} Hex-encoded signature
 */
function hmacSHA256(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Use when comparing tokens or signatures.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function safeCompare(a, b) {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

module.exports = { encrypt, decrypt, generateSecureToken, hmacSHA256, safeCompare };

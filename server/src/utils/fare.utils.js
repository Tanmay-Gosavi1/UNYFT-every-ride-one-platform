/**
 * @module utils/fare
 * @description Fare calculation utilities.
 *
 * Used primarily by the mock adapter to generate realistic fare estimates.
 * Real provider adapters receive fare data directly from provider APIs.
 *
 * Fare model: Base fare + (per-km rate × distance) + (per-min rate × duration)
 * This mirrors how ride-hailing companies structure their actual pricing.
 */

/**
 * Fare configuration for each normalized vehicle category.
 * Values are in INR (Indian Rupees).
 *
 * @typedef {object} FareConfig
 * @property {number} baseFare      - Fixed charge per trip
 * @property {number} perKm         - Rate per kilometer
 * @property {number} perMin        - Rate per minute of ride time
 * @property {number} minimumFare   - Floor price regardless of distance
 * @property {number} surgeMax      - Maximum surge multiplier (1.0 = no surge)
 */
const FARE_CONFIG = {
  economy: {
    baseFare: 30,
    perKm: 10,
    perMin: 1.5,
    minimumFare: 50,
    surgeMax: 2.5,
  },
  premium: {
    baseFare: 60,
    perKm: 16,
    perMin: 2.5,
    minimumFare: 100,
    surgeMax: 2.0,
  },
  suv: {
    baseFare: 80,
    perKm: 20,
    perMin: 3.0,
    minimumFare: 130,
    surgeMax: 2.0,
  },
  luxury: {
    baseFare: 150,
    perKm: 28,
    perMin: 4.0,
    minimumFare: 250,
    surgeMax: 1.5,
  },
  auto: {
    baseFare: 25,
    perKm: 8,
    perMin: 1.0,
    minimumFare: 40,
    surgeMax: 1.5,
  },
  bike: {
    baseFare: 15,
    perKm: 5,
    perMin: 0.8,
    minimumFare: 25,
    surgeMax: 1.2,
  },
  shared: {
    baseFare: 20,
    perKm: 6,
    perMin: 1.0,
    minimumFare: 35,
    surgeMax: 1.3,
  },
};

/**
 * Calculates an estimated fare for a given vehicle category and trip.
 * Returns a min/max range to account for traffic variability.
 *
 * @param {string} category - Normalized vehicle category (e.g., 'economy')
 * @param {number} distanceKm - Trip distance in kilometers
 * @param {number} durationMin - Estimated trip duration in minutes
 * @param {number} [surgeMultiplier=1.0] - Surge pricing multiplier
 * @returns {{ fareMin: number, fareMax: number, estimated: number, surgeMultiplier: number }}
 */
function calculateFare(category, distanceKm, durationMin, surgeMultiplier = 1.0) {
  const config = FARE_CONFIG[category] || FARE_CONFIG.economy;

  const baseFare = config.baseFare + (config.perKm * distanceKm) + (config.perMin * durationMin);
  const clampedSurge = Math.min(surgeMultiplier, config.surgeMax);
  const estimated = Math.max(baseFare * clampedSurge, config.minimumFare);

  // Provide a ±15% range to reflect real-world price variability
  const variance = 0.15;
  return {
    fareMin: Math.floor(estimated * (1 - variance)),
    fareMax: Math.ceil(estimated * (1 + variance)),
    estimated: Math.round(estimated),
    surgeMultiplier: clampedSurge,
    currency: 'INR',
  };
}

/**
 * Determines if surge pricing is active based on simulated demand.
 * In production, this comes from the provider API.
 *
 * @param {number} hour - Hour of the day (0–23)
 * @returns {{ active: boolean, multiplier: number }}
 */
function getSurgeCondition(hour) {
  // Peak hours: morning commute (8-10) and evening commute (18-21)
  const isPeakHour = (hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 21);
  const isLatNight = hour >= 23 || hour <= 4;

  if (isPeakHour) {
    return { active: true, multiplier: 1.3 + Math.random() * 0.5 }; // 1.3x–1.8x
  }
  if (isLatNight) {
    return { active: true, multiplier: 1.2 + Math.random() * 0.3 }; // 1.2x–1.5x
  }
  return { active: false, multiplier: 1.0 };
}

/**
 * Builds a detailed fare breakup for display after ride completion.
 *
 * @param {number} distanceKm
 * @param {number} durationMin
 * @param {string} category
 * @param {number} surgeMultiplier
 * @returns {{ items: Array<{label: string, amount: number}>, total: number }}
 */
function buildFareBreakup(distanceKm, durationMin, category, surgeMultiplier = 1.0) {
  const config = FARE_CONFIG[category] || FARE_CONFIG.economy;

  const baseFare = config.baseFare;
  const distanceCharge = parseFloat((config.perKm * distanceKm).toFixed(2));
  const timeCharge = parseFloat((config.perMin * durationMin).toFixed(2));
  const subtotal = baseFare + distanceCharge + timeCharge;
  const gst = parseFloat((subtotal * 0.05).toFixed(2)); // 5% GST
  const surgeFee = surgeMultiplier > 1 ? parseFloat((subtotal * (surgeMultiplier - 1)).toFixed(2)) : 0;
  const total = Math.max(Math.round(subtotal + gst + surgeFee), config.minimumFare);

  const items = [
    { label: 'Base fare', amount: baseFare },
    { label: `Distance (${distanceKm.toFixed(1)} km × ₹${config.perKm})`, amount: distanceCharge },
    { label: `Time (${durationMin} min × ₹${config.perMin})`, amount: timeCharge },
    { label: 'GST (5%)', amount: gst },
  ];
  if (surgeFee > 0) items.push({ label: `Surge fee (×${surgeMultiplier.toFixed(1)})`, amount: surgeFee });
  items.push({ label: 'Total', amount: total });

  return { items, total };
}

module.exports = { calculateFare, getSurgeCondition, buildFareBreakup, FARE_CONFIG };

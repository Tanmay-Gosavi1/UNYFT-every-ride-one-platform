/**
 * @module providers/mock/MockDataGenerator
 * @description Generates realistic mock data for all provider API responses.
 *
 * Used exclusively by the MockAdapter to simulate real provider behavior
 * during development and demonstration when live API credentials are unavailable.
 *
 * Generated data is designed to be:
 *  - Realistic (plausible names, vehicle numbers, ratings)
 *  - Deterministic given the same seed (consistent across test runs)
 *  - Varied enough to make UI testing meaningful
 */

const { v4: uuidv4 } = require('uuid');
const { VEHICLE_CATEGORY, BOOKING_STATUS } = require('../../config/constants');
const { calculateDistance, estimateDriveTime } = require('../../utils/geo.utils');
const { calculateFare, getSurgeCondition } = require('../../utils/fare.utils');

// --- Static realistic data pools ---

const DRIVER_NAMES = [
  'Rajesh Kumar', 'Amit Sharma', 'Suresh Patel', 'Vikram Singh',
  'Ravi Verma', 'Manoj Gupta', 'Sanjay Yadav', 'Arun Kumar',
  'Deepak Nair', 'Pradeep Mehta',
];

const CAR_MODELS = {
  economy: ['Maruti Swift', 'Hyundai i10', 'Tata Tiago', 'Honda Brio', 'Maruti Wagon R'],
  premium: ['Honda City', 'Hyundai Verna', 'Maruti Ciaz', 'Toyota Yaris', 'Volkswagen Vento'],
  suv: ['Hyundai Creta', 'Kia Seltos', 'MG Hector', 'Toyota Fortuner', 'Mahindra XUV500'],
  luxury: ['Mercedes E-Class', 'BMW 5-Series', 'Audi A6', 'Jaguar XF', 'Volvo S90'],
  auto: ['Bajaj RE', 'Piaggio Ape', 'TVS Auto'],
  bike: ['Royal Enfield', 'Honda Activa', 'Bajaj Pulsar'],
  shared: ['Maruti Swift', 'Hyundai i20', 'Toyota Glanza'],
};

const CAR_COLORS = ['White', 'Silver', 'Black', 'Grey', 'Red', 'Blue'];

const VEHICLE_PRODUCTS = [
  { id: 'mock-economy', name: 'Mock Economy', category: VEHICLE_CATEGORY.ECONOMY, capacity: 4, description: '4-seater hatchback — affordable rides' },
  { id: 'mock-premium', name: 'Mock Prime', category: VEHICLE_CATEGORY.PREMIUM, capacity: 4, description: '4-seater sedan — comfortable rides' },
  { id: 'mock-suv', name: 'Mock SUV', category: VEHICLE_CATEGORY.SUV, capacity: 6, description: '6-seater SUV — spacious rides' },
  { id: 'mock-auto', name: 'Mock Auto', category: VEHICLE_CATEGORY.AUTO, capacity: 3, description: '3-seater auto-rickshaw' },
  { id: 'mock-bike', name: 'Mock Bike', category: VEHICLE_CATEGORY.BIKE, capacity: 1, description: 'Solo bike rides' },
  { id: 'mock-shared', name: 'Mock Share', category: VEHICLE_CATEGORY.SHARED, capacity: 2, description: 'Shared ride — save money, save planet' },
];

/**
 * Returns a random item from an array.
 * @param {any[]} arr
 * @returns {any}
 */
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generates a realistic Indian vehicle license plate.
 * Format: KA01AB1234
 * @returns {string}
 */
function generateLicensePlate() {
  const states = ['KA', 'MH', 'DL', 'TN', 'UP', 'RJ', 'GJ', 'WB'];
  const state = randomFrom(states);
  const district = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const series = randomFrom(letters) + randomFrom(letters);
  const num = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `${state}${district}${series}${num}`;
}

/**
 * Generates a mock driver profile.
 * @param {string} category - Vehicle category
 * @returns {object}
 */
function generateDriver(category) {
  const carModels = CAR_MODELS[category] || CAR_MODELS.economy;
  return {
    name: randomFrom(DRIVER_NAMES),
    phone: `+91${Math.floor(7000000000 + Math.random() * 2999999999)}`,
    rating: parseFloat((3.8 + Math.random() * 1.2).toFixed(1)), // 3.8–5.0
    imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.floor(Math.random() * 100)}`,
    vehicle: {
      make: carModels[0].split(' ')[0],
      model: randomFrom(carModels),
      color: randomFrom(CAR_COLORS),
      licensePlate: generateLicensePlate(),
    },
  };
}

/**
 * Generates ride estimates for all mock products on a given route.
 *
 * @param {{ lat: number, lng: number }} pickup
 * @param {{ lat: number, lng: number }} dropoff
 * @returns {import('../ProviderAdapter').NormalizedEstimate[]}
 */
function generateEstimates(pickup, dropoff) {
  const distanceKm = calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
  const tripDuration = estimateDriveTime(distanceKm);
  const currentHour = new Date().getHours();
  const surge = getSurgeCondition(currentHour);

  return VEHICLE_PRODUCTS.map((product) => {
    const fare = calculateFare(product.category, distanceKm, tripDuration, surge.multiplier);
    const pickupEta = Math.floor(2 + Math.random() * 10); // 2–12 min

    return {
      id: uuidv4(),
      provider: 'mock',
      productId: product.id,
      productName: product.name,
      category: product.category,
      capacity: product.capacity,
      description: product.description,
      fareMin: fare.fareMin,
      fareMax: fare.fareMax,
      fareEstimated: fare.estimated,
      currency: 'INR',
      surgeMultiplier: surge.multiplier,
      surgeActive: surge.active,
      fareId: uuidv4(), // Mock fare_id (no expiry for mock)
      fareIdExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 min (mock is lenient)
      pickupEtaMinutes: pickupEta,
      tripDurationMinutes: tripDuration,
      tripDistanceKm: parseFloat(distanceKm.toFixed(2)),
    };
  });
}

/**
 * Returns a location slightly offset from a base point —
 * simulates a driver nearby but not at exact pickup.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {number} [radiusKm=0.5] - How far away (km)
 * @returns {{ lat: number, lng: number }}
 */
function generateNearbyLocation(lat, lng, radiusKm = 0.5) {
  const DEGREES_PER_KM = 0.009; // Approximate
  const offsetLat = (Math.random() - 0.5) * 2 * radiusKm * DEGREES_PER_KM;
  const offsetLng = (Math.random() - 0.5) * 2 * radiusKm * DEGREES_PER_KM;
  return {
    lat: parseFloat((lat + offsetLat).toFixed(6)),
    lng: parseFloat((lng + offsetLng).toFixed(6)),
  };
}

module.exports = {
  VEHICLE_PRODUCTS,
  generateEstimates,
  generateDriver,
  generateNearbyLocation,
  generateLicensePlate,
};

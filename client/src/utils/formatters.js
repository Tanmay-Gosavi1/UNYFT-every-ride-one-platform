/**
 * Formatting utilities for ride comparison UI
 */

export function formatCurrency(amount, currency = 'INR') {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹--';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '-- min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hrs = Math.floor(minutes / 60);
  const remainingMins = Math.round(minutes % 60);
  return `${hrs}h ${remainingMins}m`;
}

export function formatDistance(distanceKm) {
  if (!distanceKm && distanceKm !== 0) return '-- km';
  return `${Number(distanceKm).toFixed(1)} km`;
}

export function formatDateTime(isoString) {
  if (!isoString) return '--';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

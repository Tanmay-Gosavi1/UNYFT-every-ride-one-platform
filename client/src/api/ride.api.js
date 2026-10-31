import api from './client';

export const rideApi = {
  getEstimates: (params) => api.post('/rides/estimate', params),
  bookRide: (data) => api.post('/rides/book', data),
  getBooking: (bookingId) => api.get(`/rides/${bookingId}`),
  trackRide: (bookingId) => api.get(`/rides/${bookingId}/track`),
  cancelRide: (bookingId, reason) => api.post(`/rides/${bookingId}/cancel`, { reason }),
  rateRide: (bookingId, rating, review) => api.post(`/rides/${bookingId}/rate`, { rating, review }),
  getHistory: (params) => api.get('/rides/history', { params }),
};

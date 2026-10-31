import api from './client';

export const providerApi = {
  listProviders: () => api.get('/providers'),
  getAuthUrl: (providerId) => api.get(`/providers/${providerId}/auth`),
  unlinkProvider: (providerId) => api.delete(`/providers/${providerId}/unlink`),
};

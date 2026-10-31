import { create } from 'zustand';
import { authApi } from '../api/auth.api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('access_token') || null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,
  authModalOpen: false,
  authModalMode: 'login', // 'login' | 'register'

  openAuthModal: (mode = 'login') => set({ authModalOpen: true, authModalMode: mode }),
  closeAuthModal: () => set({ authModalOpen: false }),

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await authApi.login({ email, password });
      const { user, accessToken } = res.data;
      localStorage.setItem('access_token', accessToken);
      set({ user, token: accessToken, isAuthenticated: true, loading: false, authModalOpen: false });
      return { success: true };
    } catch (err) {
      set({ loading: false });
      return { success: false, error: err.message || 'Login failed' };
    }
  },

  register: async (userData) => {
    set({ loading: true });
    try {
      const res = await authApi.register(userData);
      const { user, accessToken } = res.data;
      localStorage.setItem('access_token', accessToken);
      set({ user, token: accessToken, isAuthenticated: true, loading: false, authModalOpen: false });
      return { success: true };
    } catch (err) {
      set({ loading: false });
      return { success: false, error: err.message || 'Registration failed' };
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('access_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    if (!localStorage.getItem('access_token')) return;
    set({ loading: true });
    try {
      const res = await authApi.getMe();
      set({ user: res.data.user, isAuthenticated: true, loading: false });
    } catch {
      localStorage.removeItem('access_token');
      set({ user: null, token: null, isAuthenticated: false, loading: false });
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await authApi.updateProfile(data);
      set({ user: res.data.user });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Update failed' };
    }
  },
}));

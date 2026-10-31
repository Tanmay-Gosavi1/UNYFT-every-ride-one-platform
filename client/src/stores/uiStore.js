import { create } from 'zustand';

export const useUIStore = create((set) => ({
  activeTab: 'home', // 'home' | 'compare' | 'tracking' | 'history' | 'providers'
  toasts: [],

  setActiveTab: (tab) => set({ activeTab: tab }),

  addToast: (title, description = '', type = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    set((state) => ({
      toasts: [...state.toasts, { id, title, description, type, createdAt: Date.now() }],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4500);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

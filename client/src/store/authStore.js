// ============================================
// Store d'authentification (Zustand)
// ============================================

import { create } from 'zustand';
import { authApi } from '../api/client';

// Stocke une référence globale pour que le module api/client.js puisse
// appeler logout() en cas de 401 sans import circulaire.
import * as apiModule from '../api/client';

export const useAuthStore = create((set, get) => {
  // Enregistre la référence du store pour api/client.js
  if (typeof window !== 'undefined') {
    window.__authStoreRef__ = { getState: () => get() };
  }

  const initialUser = (() => {
    try {
      const stored = localStorage.getItem('invoicehub_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  return {
    user: initialUser,
    token: localStorage.getItem('invoicehub_token'),
    isAuthenticated: !!localStorage.getItem('invoicehub_token'),

    // Connexion
    login: async (email, password) => {
      const data = await authApi.login({ email, password });
      localStorage.setItem('invoicehub_token', data.token);
      localStorage.setItem('invoicehub_user', JSON.stringify(data.user));
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
      });
      return data.user;
    },

    // Inscription
    register: async (email, password, companyName) => {
      const data = await authApi.register({ email, password, companyName });
      localStorage.setItem('invoicehub_token', data.token);
      localStorage.setItem('invoicehub_user', JSON.stringify(data.user));
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
      });
      return data.user;
    },

    // Déconnexion
    logout: () => {
      localStorage.removeItem('invoicehub_token');
      localStorage.removeItem('invoicehub_user');
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});

// Ré-exporte pour compatibilité
export { apiModule };

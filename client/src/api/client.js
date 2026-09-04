// ============================================
// Client API - fonctions pour communiquer avec le backend
// ============================================

const API_URL = '/api';

const authStore = window.__authStoreRef__;

// Récupère le token depuis localStorage
function getToken() {
  return localStorage.getItem('invoicehub_token');
}

/**
 * Requête générique vers l'API.
 * Ajoute automatiquement le token JWT si présent.
 */
export async function request(path, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_URL}${path}`, config);

  // Si le serveur renvoie 401, le token est invalide
  if (response.status === 401 && authStore && authStore.getState) {
    const state = authStore.getState();
    if (state.logout) state.logout();
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'Une erreur est survenue');
    error.status = response.status;
    throw error;
  }

  return data;
}

// ============ Helpers de verbes HTTP ============

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

// ============ Endpoints spécifiques ============

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const clientsApi = {
  list: () => api.get('/clients'),
  get: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  remove: (id) => api.delete(`/clients/${id}`),
};

export const invoicesApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.append(k, v);
    });
    const query = qs.toString();
    return api.get(`/invoices${query ? `?${query}` : ''}`);
  },
  get: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  updateStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }),
  send: (id) => api.post(`/invoices/${id}/send`),
  remove: (id) => api.delete(`/invoices/${id}`),
  // Téléchargement du PDF (binaire)
  downloadPdf: async (id) => {
    const token = getToken();
    const response = await fetch(`${API_URL}/invoices/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Erreur lors du téléchargement du PDF');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return blob;
  },
};

export const paymentsApi = {
  // Crée un lien de paiement Stripe pour une facture
  createCheckout: (invoiceId) => api.post('/payments/create-checkout', { invoiceId }),
};

// ============================================
// ProtectedRoute - redirige vers /login si non connecté
// et enveloppe les pages dans le layout (sidebar + contenu)
// ============================================

import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Sidebar from './Sidebar';
import './Layout.css';

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Titre de page basé sur la route
  const pageTitle = (() => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/clients') return 'Clients';
    if (path.startsWith('/clients/')) return 'Détail client';
    if (path === '/invoices') return 'Factures';
    if (path === '/invoices/new') return 'Nouvelle facture';
    if (path.startsWith('/invoices/')) return 'Détail facture';
    if (path === '/settings') return 'Paramètres';
    return 'InvoiceHub';
  })();

  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="layout-main">
        {/* Header avec hamburger sur mobile */}
        <header className="layout-header">
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <h1 className="layout-title">{pageTitle}</h1>
        </header>

        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ============================================
// Settings.jsx - Paramètres du compte
// ============================================

import { useAuthStore } from '../store/authStore';
import { formatDateLong } from '../utils/format';

export default function Settings() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="card settings-card">
      <h2 className="page-title" style={{ marginBottom: 4 }}>Paramètres du compte</h2>
      <p className="page-subtitle">Gérez les informations de votre entreprise et votre compte.</p>

      {/* Profil utilisateur */}
      <div className="settings-section">
        <div className="settings-heading">
          <div className="settings-avatar">
            {(user?.companyName || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="settings-company">{user?.companyName || '—'}</div>
            <div className="settings-email">{user?.email || '—'}</div>
          </div>
        </div>
      </div>

      {/* Informations du compte */}
      <div className="settings-section">
        <h3 className="settings-title">Informations du compte</h3>
        <div className="settings-row">
          <span className="settings-label">Entreprise</span>
          <span className="settings-value">{user?.companyName || '—'}</span>
        </div>
        <div className="settings-row">
          <span className="settings-label">Email de connexion</span>
          <span className="settings-value">{user?.email || '—'}</span>
        </div>
        <div className="settings-row">
          <span className="settings-label">Membre depuis</span>
          <span className="settings-value">{user?.createdAt ? formatDateLong(user.createdAt) : '—'}</span>
        </div>
      </div>

      {/* Aperçu de la facturation */}
      <div className="settings-section">
        <h3 className="settings-title">Facturation</h3>
        <p className="settings-note">
          Votre taux de TVA par défaut, vos coordonnées d'émission et vos mentions légales
          peuvent être configurés pour apparaître automatiquement sur vos documents.
        </p>
        <div className="settings-placeholder">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v9M15 9h4M17 10h3" />
          </svg>
          <span>Bientôt disponible</span>
        </div>
      </div>
    </div>
  );
}
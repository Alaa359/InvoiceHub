// ============================================
// Settings.jsx - Paramètres du compte
// ============================================

import { useAuthStore } from '../store/authStore';
import { formatDateLong } from '../utils/format';

export default function Settings() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <h2 className="page-title" style={{ marginBottom: 16 }}>Paramètres du compte</h2>
      <div className="settings-row">
        <span className="settings-label">Entreprise</span>
        <span className="settings-value">{user?.companyName || '—'}</span>
      </div>
      <div className="settings-row">
        <span className="settings-label">Email</span>
        <span className="settings-value">{user?.email || '—'}</span>
      </div>
      <p className="empty-sub" style={{ marginTop: 24 }}>
        Les paramètres de facturation (TVA, mention légales) seront ajoutés aux étapes suivantes.
      </p>
    </div>
  );
}

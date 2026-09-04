// ============================================
// ClientCard - Carte d'un client dans la grille
// ============================================

import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';

export default function ClientCard({ client }) {
  const initial = (client.name || '?').charAt(0).toUpperCase();

  return (
    <Link to={`/clients/${client.id}`} className="client-card">
      <div className="client-card-top">
        <div className="client-avatar">{initial}</div>
        <div className="client-card-info">
          <h3 className="client-card-name">{client.name}</h3>
          <p className="client-card-company">{client.company || (client.email ? '—' : '')}</p>
        </div>
      </div>

      <p className="client-card-email">{client.email}</p>

      <div className="client-card-stats">
        <div className="client-card-stat">
          <span className="client-card-stat-label">Factures</span>
          <span className="client-card-stat-value">{client.invoiceCount ?? 0}</span>
        </div>
        <div className="client-card-stat">
          <span className="client-card-stat-label">Total facturé</span>
          <span className="client-card-stat-value">{formatCurrency(client.totalInvoiced ?? 0)}</span>
        </div>
      </div>
    </Link>
  );
}

// ============================================
// ClientDetail.jsx - Détail d'un client avec historique
// ============================================

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { clientsApi } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/format';
import './clientDetail.css';

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await clientsApi.get(id);
        setClient(data);
      } catch (err) {
        toast.error(err.message || 'Erreur lors du chargement du client');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return <div className="card skeleton-card" style={{ height: 200 }} />;
  }

  if (!client) {
    return (
      <div className="empty-state card">
        <p>Client introuvable.</p>
        <Link to="/clients" className="btn btn-primary" style={{ marginTop: 12 }}>
          Retour aux clients
        </Link>
      </div>
    );
  }

  const totals = client.invoices?.reduce(
    (acc, inv) => {
      acc.total += inv.total || 0;
      if (inv.status === 'paid') acc.paid += inv.total || 0;
      return acc;
    },
    { total: 0, paid: 0 }
  );

  return (
    <div className="client-detail">
      <Link to="/clients" className="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Retour aux clients
      </Link>

      {/* En-tête client */}
      <div className="card client-detail-header">
        <div className="client-detail-avatar">
          {(client.name || '?').charAt(0).toUpperCase()}
        </div>
        <div className="client-detail-info">
          <h2>{client.name}</h2>
          <p>{client.company || 'Particulier'}</p>
          <p className="client-detail-email">{client.email}</p>
          {client.address && <p className="client-detail-address">{client.address}</p>}
        </div>
        <div className="client-detail-stats">
          <div className="stat-mini">
            <span className="stat-mini-value">{client.invoices?.length || 0}</span>
            <span className="stat-mini-label">Factures</span>
          </div>
          <div className="stat-mini">
            <span className="stat-mini-value">{formatCurrency(totals?.total || 0)}</span>
            <span className="stat-mini-label">Total facturé</span>
          </div>
          <div className="stat-mini">
            <span className="stat-mini-value" style={{ color: 'var(--green)' }}>
              {formatCurrency(totals?.paid || 0)}
            </span>
            <span className="stat-mini-label">Payé</span>
          </div>
        </div>
      </div>

      {/* Historique des factures */}
      <div className="card">
        <h3 className="section-title">Historique des factures</h3>
        {client.invoices?.length === 0 ? (
          <div className="empty-sub" style={{ padding: '24px 0' }}>
            Aucune facture pour ce client pour le moment.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Date</th>
                <th>Échéance</th>
                <th>Montant</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {client.invoices?.map((inv) => (
                <tr key={inv.id}>
                  <td className="cell-number">{inv.number}</td>
                  <td>{formatDate(inv.createdAt)}</td>
                  <td>{formatDate(inv.dueDate)}</td>
                  <td className="cell-amount">{formatCurrency(inv.total)}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td>
                    <Link to={`/invoices/${inv.id}`} className="btn btn-secondary btn-sm">
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

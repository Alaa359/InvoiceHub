// ============================================
// Invoices.jsx - Liste des factures
// Implémentation complète à l'Étape 3
// ============================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { invoicesApi } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/format';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await invoicesApi.list();
        setInvoices(data);
      } catch (err) {
        toast.error(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="invoices-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Factures</h2>
          <p className="page-subtitle">Créez et gérez vos factures</p>
        </div>
        <Link to="/invoices/new" className="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouvelle facture
        </Link>
      </div>

      <div className="card">
        {loading ? (
          <div className="skeleton-card" style={{ height: 200 }} />
        ) : invoices.length === 0 ? (
          <p className="empty-sub" style={{ padding: 24 }}>Aucune facture pour le moment.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Client</th>
                <th>Date</th>
                <th>Échéance</th>
                <th>Montant</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="cell-number">{inv.number}</td>
                  <td>{inv.client?.name || '—'}</td>
                  <td>{formatDate(inv.createdAt)}</td>
                  <td>{formatDate(inv.dueDate)}</td>
                  <td className="cell-amount">{formatCurrency(inv.total)}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td>
                    <Link to={`/invoices/${inv.id}`} className="btn btn-secondary btn-sm">Voir</Link>
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

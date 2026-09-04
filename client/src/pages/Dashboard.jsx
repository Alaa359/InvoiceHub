// ============================================
// Dashboard.jsx - Tableau de bord
// Implémentation complète à l'Étape 7
// ============================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { invoicesApi } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/format';

export default function Dashboard() {
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

  // Statistiques simples
  const total = invoices.reduce((s, i) => s + i.total, 0);
  const paid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const pending = invoices.filter((i) => i.status === 'sent').reduce((s, i) => s + i.total, 0);
  const overdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.total, 0);

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h2 className="page-title">Vue d'ensemble</h2>
          <p className="page-subtitle">Suivez vos revenus et factures</p>
        </div>
        <Link to="/invoices/new" className="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouvelle facture
        </Link>
      </div>

      {loading ? (
        <div className="card skeleton-card" style={{ height: 200 }} />
      ) : (
        <>
          <div className="stats-row">
            <StatCard label="Revenus totaux" value={total} color="accent" icon="cash" />
            <StatCard label="Factures payées" value={paid} color="green" icon="check" />
            <StatCard label="En attente" value={pending} color="blue" icon="clock" />
            <StatCard label="En retard" value={overdue} color="orange" icon="alert" />
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <h3 className="section-title">Factures récentes</h3>
            {invoices.length === 0 ? (
              <p className="empty-sub">Aucune facture pour le moment.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>N°</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Échéance</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 6).map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.client?.name || '—'}</td>
                      <td className="cell-number">{inv.number}</td>
                      <td className="cell-amount">{formatCurrency(inv.total)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td>{formatDate(inv.dueDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Mini composant StatCard local (remplacé par le composant dédié à l'étape 7)
function StatCard({ label, value, color, icon }) {
  const colors = { accent: 'var(--accent)', green: 'var(--green)', blue: 'var(--blue)', orange: 'var(--orange)' };
  return (
    <div className="card stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={{ color: colors[color] }}>
        {formatCurrency(value)}
      </div>
    </div>
  );
}

// ============================================
// Dashboard.jsx - Tableau de bord (stats + graphique + récentes)
// ============================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { invoicesApi } from '../api/client';
import StatCard from '../components/StatCard';
import RevenueChart from '../components/RevenueChart';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/format';
import './dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, invoices] = await Promise.all([
          invoicesApi.stats(),
          invoicesApi.list(),
        ]);
        setStats(statsData);
        setRecent(invoices.slice(0, 6));
      } catch (err) {
        toast.error(err.message || 'Erreur de chargement du dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
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
        <div className="stats-row">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card skeleton-card" style={{ height: 130 }} />
          ))}
        </div>
        <div className="card skeleton-card" style={{ height: 280, marginTop: 20 }} />
      </div>
    );
  }

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

      {/* Cartes statistiques */}
      <div className="stats-row">
        <StatCard
          label="Revenus totaux"
          value={stats?.totalPaid ?? 0}
          color="accent"
          icon="cash"
        />
        <StatCard
          label="Factures payées"
          value={stats?.paidCount ?? 0}
          color="green"
          icon="check"
          format="number"
        />
        <StatCard
          label="En attente"
          value={stats?.pending ?? 0}
          color="blue"
          icon="clock"
        />
        <StatCard
          label="En retard"
          value={stats?.overdue ?? 0}
          color="orange"
          icon="alert"
        />
      </div>

      {/* Graphique des revenus */}
      <div className="card dashboard-chart">
        <div className="chart-head">
          <div>
            <h3 className="section-title">Évolution des revenus</h3>
            <p className="chart-sub">Sur les 12 derniers mois</p>
          </div>
        </div>
        <RevenueChart data={stats?.revenueData} loading={false} />
      </div>

      {/* Factures récentes */}
      <div className="card dashboard-recent">
        <div className="chart-head">
          <h3 className="section-title">Factures récentes</h3>
          <Link to="/invoices" className="see-all">Voir tout</Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty-sub" style={{ padding: 24, textAlign: 'center' }}>
            Aucune facture pour le moment.
          </div>
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
              {recent.map((inv) => (
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
    </div>
  );
}
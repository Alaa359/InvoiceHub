// ============================================
// Invoices.jsx - Liste des factures avec filtres
// ============================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { clientsApi, invoicesApi } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/format';
import './invoices.css';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [search, setSearch] = useState('');

  // Charge la liste des clients (pour les filtres)
  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await clientsApi.list();
        setClients(data);
      } catch {}
    };
    loadClients();
  }, []);

  // Charge les factures selon les filtres
  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoicesApi.list({
        status: filterStatus || undefined,
        clientId: filterClient || undefined,
        search: search || undefined,
      });
      setInvoices(data);
    } catch (err) {
      toast.error(err.message || 'Erreur de chargement des factures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [filterStatus, filterClient]);

  // Recherche avec debounce sur le numéro
  useEffect(() => {
    const timer = setTimeout(() => {
      loadInvoices();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

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

      {/* Barre de filtres */}
      <div className="card filters-bar">
        <div className="filter-group">
          <input
            className="filter-search"
            type="text"
            placeholder="Rechercher par numéro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="sent">Envoyée</option>
          <option value="paid">Payée</option>
          <option value="overdue">En retard</option>
          <option value="cancelled">Annulée</option>
        </select>
        <select
          className="filter-select"
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
        >
          <option value="">Tous les clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tableau des factures */}
      <div className="card">
        {loading ? (
          <div className="skeleton-card" style={{ height: 220 }} />
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <p>Aucune facture trouvée.</p>
            <p className="empty-sub">Modifiez vos filtres ou créez une nouvelle facture.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Échéance</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const isOverdue =
                    inv.status === 'overdue' ||
                    (inv.status === 'sent' && inv.dueDate && new Date(inv.dueDate) < new Date());
                  return (
                    <tr key={inv.id} className={isOverdue ? 'row-overdue' : ''}>
                      <td className="cell-number">{inv.number}</td>
                      <td>{inv.client?.name || '—'}</td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

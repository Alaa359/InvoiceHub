// ============================================
// InvoiceDetail.jsx - Détail d'une facture
// Implémentation complète aux Étapes 3/4
// ============================================

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { invoicesApi } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/format';

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await invoicesApi.get(id);
        setInvoice(data);
      } catch (err) {
        toast.error(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="card skeleton-card" style={{ height: 200 }} />;
  if (!invoice) return <div className="empty-state card"><p>Facture introuvable.</p></div>;

  return (
    <div className="invoice-detail">
      <Link to="/invoices" className="back-link">Retour aux factures</Link>
      <div className="card">
        <div className="invoice-detail-head">
          <div>
            <h2>Facture {invoice.number}</h2>
            <p className="empty-sub">Créée le {formatDate(invoice.createdAt)}</p>
          </div>
          <StatusBadge status={invoice.status} />
        </div>
        <p><strong>Client :</strong> {invoice.client?.name || '—'}</p>
        <p><strong>Montant total :</strong> <span className="cell-amount">{formatCurrency(invoice.total)}</span></p>
      </div>
    </div>
  );
}

// ============================================
// InvoiceDetail.jsx - Détail complet d'une facture
// ============================================

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { invoicesApi } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatDate, formatDateLong } from '../utils/format';
import './invoiceDetail.css';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Calcule le total des lignes (depuis les items)
  const subtotal = (invoice?.items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const taxAmount = subtotal * (Number(invoice?.taxRate) || 0) / 100;

  const loadInvoice = async () => {
    try {
      const data = await invoicesApi.get(id);
      setInvoice(data);
    } catch (err) {
      toast.error(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [id]);

  // Change le statut de la facture
  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const updated = await invoicesApi.updateStatus(id, newStatus);
      setInvoice(updated);
      toast.success('Statut mis à jour');
    } catch (err) {
      toast.error(err.message || 'Erreur');
    } finally {
      setUpdating(false);
    }
  };

  // Supprime la facture
  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette facture ?')) return;
    try {
      await invoicesApi.remove(id);
      toast.success('Facture supprimée');
      navigate('/invoices');
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
  };

  // Télécharge le PDF de la facture
  const handleDownloadPdf = async () => {
    try {
      await invoicesApi.downloadPdf(id);
      toast.success('PDF téléchargé');
    } catch (err) {
      toast.error(err.message || 'Erreur lors du téléchargement');
    }
  };

  // Envoie la facture par email au client
  const handleSend = async () => {
    setUpdating(true);
    try {
      const res = await invoicesApi.send(id);
      setInvoice(res.invoice);
      toast.success(`Facture envoyée à ${res.invoice.client?.name || 'la cliente'}`);
    } catch (err) {
      toast.error(err.message || "Erreur lors de l'envoi");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="card skeleton-card" style={{ height: 200 }} />;
  if (!invoice) return <div className="empty-state card"><p>Facture introuvable.</p></div>;

  const isOverdue = invoice.status === 'overdue' || (invoice.status === 'sent' && invoice.dueDate && new Date(invoice.dueDate) < new Date());

  return (
    <div className="invoice-detail-page">
      <div className="detail-topbar">
        <Link to="/invoices" className="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Retour aux factures
        </Link>
        <div className="detail-actions">
          <StatusBadge status={invoice.status} />
          <button className="btn btn-secondary btn-sm" onClick={handleDownloadPdf}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5 5 5-5" />
              <path d="M12 15V3" />
            </svg>
            Télécharger PDF
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={updating || invoice.status === 'paid'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2 11 13" />
              <path d="M22 2 15 22l-4-9-9-4z" />
            </svg>
            Envoyer au client
          </button>
          <button className="btn btn-success btn-sm" onClick={() => handleStatusChange('paid')} disabled={updating || invoice.status === 'paid'}>
            Marquer payée
          </button>
          <button className="btn btn-secondary btn-sm danger-text" onClick={handleDelete}>
            Supprimer
          </button>
        </div>
      </div>

      {isOverdue && invoice.status !== 'overdue' && (
        <div className="overdue-banner">⚠️ Cette facture est en retard de paiement.</div>
      )}

      {/* Document de facture */}
      <div className="card invoice-doc">
        <div className="invoice-doc-head">
          <div>
            <div className="invoice-doc-company">{user?.companyName || 'Votre entreprise'}</div>
            <div className="invoice-doc-label">FACTURE</div>
            <div className="invoice-doc-number">{invoice.number}</div>
          </div>
          <div className="invoice-doc-meta">
            <div><span>Date d'émission</span> {formatDateLong(invoice.createdAt)}</div>
            {invoice.dueDate && (
              <div><span>Échéance</span> {formatDateLong(invoice.dueDate)}</div>
            )}
            {invoice.paidAt && (
              <div><span>Payée le</span> {formatDateLong(invoice.paidAt)}</div>
            )}
          </div>
        </div>

        <div className="invoice-doc-client">
          <div className="invoice-doc-client-label">Facturé à</div>
          <div className="invoice-doc-client-name">{invoice.client?.name || '—'}</div>
          {invoice.client?.company && <div>{invoice.client.company}</div>}
          {invoice.client?.address && <div>{invoice.client.address}</div>}
          <div>{invoice.client?.email || ''}</div>
        </div>

        <div className="invoice-doc-items">
          <div className="doc-items-head">
            <span>Description</span>
            <span>Qté</span>
            <span>Prix unitaire</span>
            <span>Montant</span>
          </div>
          {invoice.items.map((item) => (
            <div className="doc-item" key={item.id}>
              <span>{item.description}</span>
              <span>{item.quantity}</span>
              <span>{formatCurrency(item.unitPrice)}</span>
              <span>{formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}</span>
            </div>
          ))}
        </div>

        <div className="invoice-doc-totals">
          <div className="doc-summary-row">
            <span>Sous-total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="doc-summary-row">
            <span>TVA ({invoice.taxRate}%)</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="doc-summary-row doc-total">
            <span>Total</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// InvoiceEditor.jsx - Éditeur de facture
// Formulaire à gauche + aperçu à droite
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { clientsApi, invoicesApi } from '../api/client';
import InvoiceLineItem from '../components/InvoiceLineItem';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatDate } from '../utils/format';
import './invoiceEditor.css';

// Ligne d'article vide par défaut
const emptyItem = { description: '', quantity: 1, unitPrice: 0 };

export default function InvoiceEditor() {
  const { id } = useParams(); // si route /invoices/:id/edit -> non géré; nouveau ici
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    clientId: '',
    dueDate: '',
    taxRate: 20,
  });
  const [items, setItems] = useState([{ ...emptyItem }]);

  // Charge la liste des clients pour la sélection
  useEffect(() => {
    const load = async () => {
      try {
        const data = await clientsApi.list();
        setClients(data);
        if (data.length > 0) setForm((f) => ({ ...f, clientId: data[0].id }));
      } catch (err) {
        toast.error(err.message || 'Erreur de chargement des clients');
      } finally {
        setLoadingClients(false);
      }
    };
    load();
  }, []);

  // ============ Gestion des lignes d'articles ============

  const handleItemChange = (index, updated) => {
    setItems((prev) => prev.map((item, i) => (i === index ? updated : item)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);

  const removeItem = (index) => {
    if (items.length <= 1) {
      // Ne pas laisser zéro ligne
      setItems([{ ...emptyItem }]);
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ============ Calculs automatiques ============

  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const taxRate = Number(form.taxRate) || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  // Client sélectionné (pour l'aperçu)
  const selectedClient = clients.find((c) => c.id === form.clientId);

  // ============ Sauvegarde ============

  const handleSaveDraft = () => {
    if (!form.clientId) {
      toast.error('Veuillez sélectionner un client');
      return;
    }
    const validItems = items.filter((item) => item.description.trim() !== '');
    if (validItems.length === 0) {
      toast.error('Ajoutez au moins une ligne avec une description');
      return;
    }
    setSaving(true);
    invoicesApi
      .create({
        clientId: form.clientId,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        taxRate: taxRate,
        items: validItems.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
        })),
      })
      .then(() => {
        toast.success('Brouillon enregistré');
        setSaving(false);
        navigate('/invoices');
      })
      .catch((err) => {
        toast.error(err.message || 'Erreur');
        setSaving(false);
      });
  };

  // Valide et renvoie le payload de création
  const buildCreatePayload = () => {
    if (!form.clientId) {
      toast.error('Veuillez sélectionner un client');
      return null;
    }
    const validItems = items.filter((item) => item.description.trim() !== '');
    if (validItems.length === 0) {
      toast.error('Ajoutez au moins une ligne avec une description');
      return null;
    }
    return {
      clientId: form.clientId,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      taxRate: taxRate,
      items: validItems.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
      })),
    };
  };

  // Crée la facture puis l'envoie au client
  const handleSend = async () => {
    const payload = buildCreatePayload();
    if (!payload) return;
    setSaving(true);
    try {
      const invoice = await invoicesApi.create(payload);
      const res = await invoicesApi.send(invoice.id);
      if (res.preview) {
        toast('Facture créée et marquée "Envoyée" (mode démo — aucun email réel envoyé)', { icon: '✉️' });
      } else {
        toast.success(`Facture ${invoice.number} envoyée au client`);
      }
      setSaving(false);
      navigate(`/invoices/${invoice.id}`);
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la création/envoi');
      setSaving(false);
    }
  };

  return (
    <div className="invoice-editor">
      {/* ===== Colonne gauche : formulaire ===== */}
      <div className="editor-left">
        <div className="card editor-form">
          <h3 className="editor-title">Informations de la facture</h3>

          <div className="form-field">
            <label>Client *</label>
            <select
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              required
            >
              <option value="">Sélectionner un client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.company ? ` — ${c.company}` : ''}
                </option>
              ))}
            </select>
            {!loadingClients && clients.length === 0 && (
              <p className="form-hint">
                Aucun client. <a href="/clients">Créez d'abord un client</a>
              </p>
            )}
          </div>

          <div className="form-field">
            <label>Date d'échéance</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>

          <div className="form-field form-half">
            <label>TVA (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.taxRate}
              onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
            />
          </div>
        </div>

        {/* Lignes d'articles */}
        <div className="card editor-lines">
          <h3 className="editor-title">Lignes d'articles</h3>

          <div className="lines-header">
            <span>Description</span>
            <span>Qté</span>
            <span>Prix unitaire</span>
            <span>Total</span>
            <span></span>
          </div>

          {items.map((item, index) => (
            <InvoiceLineItem
              key={index}
              item={item}
              index={index}
              onChange={handleItemChange}
              onRemove={removeItem}
            />
          ))}

          <button type="button" className="btn btn-secondary add-line" onClick={addItem}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Ajouter une ligne
          </button>
        </div>

        {/* Totaux */}
        <div className="card editor-summary">
          <div className="summary-row">
            <span>Sous-total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>TVA ({taxRate}%)</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="editor-actions">
          <button type="button" className="btn btn-secondary" onClick={handleSaveDraft} disabled={saving}>
            Enregistrer brouillon
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSend} disabled={saving}>
            {saving ? 'Envoi en cours...' : 'Envoyer au client'}
          </button>
        </div>
      </div>

      {/* ===== Colonne droite : aperçu ===== */}
      <div className="editor-right">
        <div className="card invoice-preview">
          <div className="preview-head">
            <div>
              <div className="preview-company">{user?.companyName || 'Votre entreprise'}</div>
              <div className="preview-inv-label">FACTURE</div>
              <div className="preview-number">N° FACT-XXXX</div>
            </div>
            <div className="preview-meta">
              <div>Date: {formatDate(new Date())}</div>
              {form.dueDate && <div>Échéance: {formatDate(form.dueDate)}</div>}
            </div>
          </div>

          <div className="preview-client">
            <div className="preview-section-label">Facturé à</div>
            <div className="preview-client-name">{selectedClient?.name || '—'}</div>
            {selectedClient?.company && <div>{selectedClient.company}</div>}
            {selectedClient?.address && <div>{selectedClient.address}</div>}
            <div>{selectedClient?.email || ''}</div>
          </div>

          <div className="preview-items-head">
            <span>Description</span>
            <span>Qté</span>
            <span>Prix</span>
            <span>Montant</span>
          </div>

          {items
            .filter((item) => item.description.trim() !== '')
            .map((item, i) => (
              <div className="preview-item" key={i}>
                <span>{item.description}</span>
                <span>{Number(item.quantity) || 0}</span>
                <span>{formatCurrency(item.unitPrice)}</span>
                <span>{formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}</span>
              </div>
            ))}

          <div className="preview-totals">
            <div className="summary-row">
              <span>Sous-total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>TVA ({taxRate}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="summary-row preview-total">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

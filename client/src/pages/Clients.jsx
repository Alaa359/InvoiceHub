// ============================================
// Clients.jsx - Liste et gestion des clients
// ============================================

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { clientsApi } from '../api/client';
import ClientCard from '../components/ClientCard';
import './clients.css';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    company: '',
  });
  const [saving, setSaving] = useState(false);

  // Charge la liste des clients
  const loadClients = async () => {
    try {
      const data = await clientsApi.list();
      setClients(data);
    } catch (err) {
      toast.error(err.message || 'Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // Ouvre le formulaire pour ajouter un nouveau client
  const handleNew = () => {
    setEditingId(null);
    setForm({ name: '', email: '', address: '', company: '' });
    setShowForm(true);
  };

  // Ouvre le formulaire pour éditer un client existant
  const handleEdit = (client) => {
    setEditingId(client.id);
    setForm({
      name: client.name,
      email: client.email,
      address: client.address || '',
      company: client.company || '',
    });
    setShowForm(true);
  };

  // Soumet le formulaire (création ou mise à jour)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await clientsApi.update(editingId, form);
        toast.success('Client mis à jour');
      } else {
        await clientsApi.create(form);
        toast.success('Client créé');
      }
      setShowForm(false);
      setSaving(false);
      await loadClients();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la sauvegarde');
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDelete = async (e, client) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Supprimer le client "${client.name}" ?`)) return;
    try {
      await clientsApi.remove(client.id);
      toast.success('Client supprimé');
      loadClients();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="clients-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Clients</h2>
          <p className="page-subtitle">Gérez vos clients et leurs informations</p>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouveau client
        </button>
      </div>

      {/* Formulaire d'ajout / édition */}
      {showForm && (
        <div className="client-form card">
          <h3>{editingId ? 'Modifier le client' : 'Nouveau client'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="client-form-grid">
              <div className="form-field">
                <label>Nom du client *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jean Dupont"
                  required
                />
              </div>
              <div className="form-field">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jean@entreprise.com"
                  required
                />
              </div>
              <div className="form-field">
                <label>Entreprise</label>
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Entreprise SA"
                />
              </div>
              <div className="form-field">
                <label>Adresse</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="12 rue Exemple, 75000 Paris"
                />
              </div>
            </div>
            <div className="client-form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Ajouter le client'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grille des clients */}
      {loading ? (
        <div className="clients-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card skeleton-card" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="empty-state card">
          <p>Aucun client pour le moment.</p>
          <p className="empty-sub">Cliquez sur "Nouveau client" pour commencer.</p>
        </div>
      ) : (
        <div className="clients-grid">
          {clients.map((client) => (
            <div key={client.id} className="client-card-wrap">
              <ClientCard client={client} />
              <div className="client-card-actions">
                <button className="icon-btn" onClick={() => handleEdit(client)} title="Modifier">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
                  </svg>
                </button>
                <button className="icon-btn danger" onClick={(e) => handleDelete(e, client)} title="Supprimer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

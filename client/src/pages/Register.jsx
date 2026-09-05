// ============================================
// Register.jsx - Inscription
// ============================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import './auth.css';

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    companyName: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password, form.companyName);
      toast.success('Compte créé ! Bienvenue sur InvoiceHub');
      navigate('/');
    } catch (err) {
      toast.error(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/favicon.svg" alt="InvoiceHub" width="40" height="40" />
          <h1>InvoiceHub</h1>
        </div>
        <p className="auth-subtitle">Créez votre compte gratuit</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="companyName">Nom de l'entreprise</label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              value={form.companyName}
              onChange={handleChange}
              placeholder="Votre entreprise / activité"
              autoComplete="organization"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="vous@entreprise.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="6 caractères minimum"
              autoComplete="new-password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Création...' : "S'inscrire"}
          </button>
        </form>

        <p className="auth-alt">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

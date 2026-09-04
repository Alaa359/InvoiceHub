// ============================================
// InvoiceHub - Serveur Express
// Point d'entrée du backend
// ============================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import prisma from './prisma.js';

// Charge les variables d'environnement depuis server/.env
dotenv.config();

// Import des routes
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import invoiceRoutes from './routes/invoices.js';
import paymentRoutes from './routes/payments.js';

// Import du cron de relances automatiques
import { processOverdueInvoices, startReminderCron } from './services/reminderCron.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ============ MIDDLEWARE GLOBAUX ============

// CORS - autorise le frontend (Vite) à accéder à l'API
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Parse du JSON entrant (limite augmentée pour les payloads de factures).
// `verify` conserve le body brut (nécessaire pour vérifier les webhooks Stripe).
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// ============ ROUTES ============

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);

// ============ HEALTH CHECK ============

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'InvoiceHub API est en ligne' });
});

// ============ GESTION DES ERREURS 404 ============

app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// ============ GESTION DES ERREURS GLOBALES ============

app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur',
  });
});

// ============ DÉMARRAGE DU SERVEUR ============

app.listen(PORT, () => {
  console.log(`✅ InvoiceHub server écoute sur le port ${PORT}`);

  // Démarre les relances automatiques (cron)
  startReminderCron();

  // Passe les factures expirées en "overdue" au démarrage
  processOverdueInvoices().catch((err) =>
    console.error('[Relances] Erreur au démarrage:', err.message)
  );
});

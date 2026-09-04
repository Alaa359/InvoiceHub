# InvoiceHub

> Plateforme SaaS de facturation pour freelances et petites entreprises.

InvoiceHub permet de créer, envoyer et suivre vos factures professionnelles, de générer des PDF, d'encaisser vos clients par carte (Stripe) et de relancer automatiquement les factures en retard — le tout dans un dashboard moderne et responsive.

## ✨ Fonctionnalités

- **Gestion des clients** : carnet de contacts avec historique et total facturé
- **Création de factures** : lignes d'articles, quantités, TVA, calcul automatique des totaux
- **Génération de PDF** : factures au format professionnel téléchargeables
- **Envoi par email** : envoi au client avec PDF joint et suivi du statut
- **Suivi des statuts** : brouillon, envoyée, payée, en retard, annulée
- **Paiement en ligne** : lien de paiement sécurisé Stripe (mode test)
- **Dashboard** : revenus totaux, factures en attente/en retard, graphique d'évolution mensuelle
- **Relances automatiques** : cron quotidien qui passe les factures en retard et envoie un email de relance
- **Authentification** : inscription / connexion sécurisée (JWT)

## 🛠 Stack technique

| Couche    | Technologie                     |
| --------- | -------------------------------- |
| Frontend  | React + Vite                    |
| Backend   | Node.js + Express               |
| Base de données | PostgreSQL + Prisma ORM    |
| PDF       | pdfkit                          |
| Emails    | Nodemailer                      |
| Paiement  | Stripe (Checkout, mode test)    |
| Auth      | JWT + bcrypt                    |
| State     | Zustand                         |
| Graphiques| recharts                        |
| Cron      | node-cron                       |

## 📁 Structure du projet

```
InvoiceHub/
├── client/                 # Frontend React (Vite)
│   └── src/
│       ├── api/            # Requêtes vers l'API
│       ├── components/     # Sidebar, StatCard, StatusBadge, ...
│       ├── pages/          # Login, Register, Dashboard, Clients, Factures, Settings
│       ├── store/          # Zustand (session utilisateur)
│       └── styles/         # Variables CSS globales
├── server/                 # Backend Express
│   ├── middleware/         # Auth JWT
│   ├── prisma/             # Schéma, migrations, seed
│   ├── routes/             # auth, clients, invoices, payments
│   └── services/           # pdf, email, stripe, relances
├── .env.example            # Variables d'environnement (exemple)
└── package.json            # Scripts racine
```

## 🚀 Installation

Prérequis : Node.js 18+, PostgreSQL 15+.

```bash
# 1. Installer les dépendances (racine + client + serveur)
npm run install:all

# 2. Configurer l'environnement
#    Copier server/.env.example vers server/.env et le remplir

# 3. Appliquer les migrations + créer la base
npm run db:migrate

# 4. (Optionnel) Charger des données de démonstration
npm run db:seed
```

### Configuration de l'environnement

Copiez `.env.example` vers `server/.env` et renseignez :

```env
# Base de données
DATABASE_URL="postgresql://utilisateur:motdepasse@localhost:5432/invoicehub?schema=public"

# JWT
JWT_SECRET="une-chaine-longue-et-aléatoire"

# Serveur
PORT=3000

# Cron de relance (format cron, défaut tous les jours à 08h00)
REMINDER_CRON="0 8 * * *"

# SMTP (envoi d'emails)
SMTP_HOST=smtp.votre-fournisseur.com
SMTP_PORT=587
SMTP_USER=you@votre-entreprise.com
SMTP_PASS=votre_mot_de_passe

# Stripe (jetons de test)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## ▶️ Lancement en développement

```bash
npm run dev
```

- Client : http://localhost:5173
- API : http://localhost:3000
- Santé de l'API : http://localhost:3000/api/health

### Compte de démonstration (après `npm run db:seed`)

```
Email        : demo@invoicehub.com
Mot de passe : demo123
```

## 🔌 API (principales routes)

| Méthode | Route                          | Description                          |
| ------- | ------------------------------ | ------------------------------------ |
| POST    | `/api/auth/register`           | Créer un compte                      |
| POST    | `/api/auth/login`              | Se connecter (renvoie un JWT)        |
| GET/POST| `/api/clients`                 | Lister / créer des clients           |
| GET/PUT/DELETE | `/api/clients/:id`      | Détail / modifier / supprimer        |
| GET/POST| `/api/invoices`                | Lister (avec filtres) / créer        |
| GET/PUT/DELETE | `/api/invoices/:id`    | Détail / modifier / supprimer        |
| PATCH   | `/api/invoices/:id/status`     | Changer le statut                    |
| GET     | `/api/invoices/:id/pdf`        | Télécharger le PDF                   |
| POST    | `/api/invoices/:id/send`       | Envoyer par email                    |
| GET     | `/api/invoices/stats`          | Statistiques du dashboard            |
| POST    | `/api/payments/create-checkout`| Créer une session de paiement Stripe |
| POST    | `/api/payments/webhook`        | Webhook Stripe (aucune auth)         |

## 💳 Statuts d'une facture

`draft` (brouillon) → `sent` (envoyée) → `paid` (payée) | `overdue` (en retard) | `cancelled` (annulée)

## 🌱 Relances automatiques

Le serveur vérifie au démarrage puis quotidiennement (à 08h00 par défaut) les factures `sent` dont l'échéance est dépassée. Ces factures passent en `overdue` et un email de relance est envoyé au client. Modifiez `REMINDER_CRON` pour changer la fréquence.

## 🚢 Déploiement (production)

- **Client** : `cd client && npm run build` → sert le dossier `client/dist` (statique).
- **Serveur** : `cd server && npm start` (ou `node index.js`) derrière un reverse proxy (Nginx/Caddy).
- En production, activez les valeurs réelles de Stripe et SMTP dans `server/.env`, et utilisez un `JWT_SECRET` fort et secret.

## ✅ Tests de base

- Vérifiez la santé : `Invoke-RestMethod http://localhost:3000/api/health`
- Créez un compte via l'interface ou `/api/auth/register`, puis créez clients/factures.
- Testez le PDF : `GET /api/invoices/:id/pdf` (avec un `Authorization: Bearer <token>`).

---

Projet de démonstration pédagogique — n'utilisez pas de clés Stripe réelles en mode test.
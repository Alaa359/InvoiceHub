# InvoiceHub

Plateforme SaaS de facturation pour freelances et petites entreprises.

## Fonctionnalités

- Gestion des clients
- Création de factures professionnelles (lignes d'articles, TVA, remises)
- Génération de factures en PDF
- Envoi de factures par email
- Suivi des statuts (brouillon, envoyée, payée, en retard, annulée)
- Paiement en ligne via Stripe
- Dashboard avec graphiques de revenus
- Relances automatiques pour factures en retard

## Stack technique

- **Frontend** : React + Vite
- **Backend** : Node.js + Express
- **Base de données** : PostgreSQL avec Prisma
- **PDF** : pdfkit
- **Emails** : Nodemailer
- **Paiement** : Stripe (mode test)
- **Auth** : JWT + bcrypt
- **State management** : Zustand
- **Graphiques** : recharts

## Installation

```bash
npm run install:all
```

## Configuration

1. Copiez `.env.example` en `.env` dans le dossier `server/`
2. Remplissez les variables d'environnement
3. Lancez les migrations Prisma : `npm run db:migrate`

## Lancement

```bash
npm run dev
```

Le client est accessible sur `http://localhost:5173` et le serveur sur `http://localhost:3000`.

// ============================================
// seed.js - Données de démonstration InvoiceHub
// ============================================
//
// Usage : npm run db:seed  (ou : cd server && node prisma/seed.js)
//
// Crée un compte de démonstration, un client et deux factures.
// En cas d'exécution répétée, les données existantes (mêmes emails/n°)
// sont conservées pour rester idempotent.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const EMAIL = 'demo@invoicehub.com';
const PASSWORD = 'demo123';

/** Ajoute N mois à une date (pour les échéances). */
function monthsFromNow(n) {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d;
}

async function seed() {
  console.log('🌱 Seeding InvoiceHub...');

  const existingUser = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (existingUser) {
    console.log('⚠️  Un utilisateur de démonstration existe déjà. Aucune modification.');
    await prisma.$disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.create({
    data: { email: EMAIL, password: hashedPassword, companyName: 'Demo SARL' },
  });

  const client = await prisma.client.create({
    data: {
      userId: user.id,
      name: 'Acme SARL',
      email: 'acme@example.com',
      company: 'Acme SARL',
      address: '12 rue des Lilas, 75012 Paris',
    },
  });

  // Facture payée
  await prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: client.id,
      number: 'FACT-0001',
      status: 'paid',
      dueDate: monthsFromNow(1),
      paidAt: new Date(),
      subtotal: 700,
      taxRate: 20,
      total: 840,
      items: {
        create: [
          { description: 'Pack de démarrage', quantity: 1, unitPrice: 700 },
        ],
      },
    },
  });

  // Facture brouillon
  await prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: client.id,
      number: 'FACT-0002',
      status: 'draft',
      dueDate: monthsFromNow(1),
      subtotal: 700,
      taxRate: 20,
      total: 840,
      items: {
        create: [
          { description: 'Maintenance trimestrielle', quantity: 1, unitPrice: 700 },
        ],
      },
    },
  });

  console.log('✅ Seed terminé :');
  console.log(`   Email        : ${EMAIL}`);
  console.log(`   Mot de passe : ${PASSWORD}`);
  console.log('   → Client Acme SARL + factures FACT-0001 (payée) et FACT-0002 (brouillon)');

  await prisma.$disconnect();
}

seed().catch(async (error) => {
  console.error('❌ Erreur lors du seed :', error.message);
  await prisma.$disconnect();
  process.exit(1);
});
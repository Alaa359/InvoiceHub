// ============================================
// reminderCron.js - Relances automatiques des factures en retard
// ============================================

import cron from 'node-cron';
import prisma from '../prisma.js';
import { sendReminderEmail } from './emailSender.js';

/**
 * Vérifie les factures "sent" dont l'échéance est dépassée :
 *  - les marque comme "overdue"
 *  - envoie une relance par email au client
 *
 * Peut être appelé directement ou via le cron scheduling.
 */
export async function processOverdueInvoices() {
  console.log('🕐 [Relances] Vérification des factures en retard...');

  const now = new Date();

  // Trouve les factures "sent" dont la date d'échéance est dépassée
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: 'sent',
      dueDate: { not: null, lt: now },
    },
    include: {
      client: true,
      items: true,
      user: { select: { companyName: true } },
    },
  });

  console.log(`[Relances] ${overdueInvoices.length} facture(s) en retard détectée(s).`);

  let reminded = 0;

  for (const invoice of overdueInvoices) {
    // 1. Marque la facture comme "overdue"
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'overdue' },
    });

    // 2. Tente d'envoyer une relance par email
    const company = { companyName: invoice.user?.companyName || 'Votre entreprise' };
    try {
      await sendReminderEmail(invoice, company);
      reminded++;
      console.log(`   ✅ Relance envoyée pour ${invoice.number}`);
    } catch (error) {
      console.log(`   ⚠️ Relance échouée pour ${invoice.number} : ${error.message}`);
    }
  }

  return { checked: overdueInvoices.length, reminded };
}

/**
 * Démarre le cron qui vérifie les factures en retard.
 * Par défaut chaque jour à 08:00.
 */
export function startReminderCron() {
  const schedule = process.env.REMINDER_CRON || '0 8 * * *';

  const task = cron.schedule(schedule, async () => {
    try {
      await processOverdueInvoices();
    } catch (error) {
      console.error('[Relances] Erreur imprévue:', error.message);
    }
  });

  console.log(`🕐 [Relances] Cron planifié : "${schedule}" (tous les jours à 08h00 par défaut).`);

  return task;
}
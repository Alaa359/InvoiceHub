// ============================================
// Routes paiements Stripe
// - Création d'un lien de paiement (avec auth)
// - Webhook Stripe (mise à jour automatique du statut "payée")
// ============================================

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../prisma.js';
import { createInvoiceCheckoutSession, getStripe, isStripeConfigured } from '../services/stripe.js';

const router = Router();

// ============ CRÉER UN LIEN DE PAIEMENT ============

/**
 * POST /api/payments/create-checkout
 * Body : { invoiceId }
 * Retourne l'URL de paiement Stripe pour la facture.
 */
router.post('/create-checkout', authenticate, async (req, res) => {
  try {
    const { invoiceId } = req.body;
    if (!invoiceId) {
      return res.status(400).json({ error: 'invoiceId requis' });
    }

    // Vérifie que la facture appartient à l'utilisateur connecté
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: req.user.id },
      include: { client: true, items: true },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Facture introuvable' });
    }

    // Ne permet pas de payer une facture déjà payée/annulée
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      return res.status(400).json({ error: 'Cette facture ne peut pas être payée' });
    }

    // Pré-vérifie la configuration Stripe pour éviter un appel API inutile
    if (!isStripeConfigured()) {
      return res.status(409).json({
        error: 'Paiement en ligne non configuré. Renseignez une clé Stripe réelle (STRIPE_SECRET_KEY) dans server/.env.',
      });
    }

    try {
      const url = await createInvoiceCheckoutSession(invoice);
      res.json({ url });
    } catch (stripeError) {
      console.error('Erreur Stripe:', stripeError.message);
      return res.status(502).json({
        error:
          stripeError.code === 'STRIPE_NOT_CONFIGURED'
            ? 'Stripe non configuré. Ajoutez STRIPE_SECRET_KEY dans le fichier .env.'
            : 'Erreur lors de la création du lien de paiement',
      });
    }
  } catch (error) {
    console.error('Erreur création checkout:', error);
    res.status(500).json({ error: "Erreur lors de la création du lien de paiement" });
  }
});

// ============ WEBHOOK STRIPE ============

/**
 * POST /api/payments/webhook
 * Appelé par Stripe lorsqu'un paiement aboutit.
 * Marque automatiquement la facture comme "payée".
 *
 * NOTE : Cette route ne passe PAS par le middleware `authenticate`
 * car c'est Stripe qui l'appelle (avec sa propre signature).
 */
router.post('/webhook', async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe non configuré' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  // Le body brut est conservé par express.json via l'option verify (req.rawBody)
  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));

  let event;

  try {
    // Vérifie la signature du webhook pour s'assurer qu'il vient bien de Stripe
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } else {
      // En mode dev sans secret de webhook, on parse le payload directement
      event = JSON.parse(rawBody.toString());
    }
  } catch (err) {
    console.error('Vérification webhook échouée:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Gère l'événement de paiement réussi
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const invoiceId = session.metadata?.invoiceId;

    if (invoiceId) {
      try {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: 'paid', paidAt: new Date() },
        });
        console.log(`✅ Facture ${invoiceId} marquée payée via Stripe`);
      } catch (error) {
        console.error('Erreur mise à jour facture via webhook:', error);
      }
    }
  }

  res.json({ received: true });
});

export default router;

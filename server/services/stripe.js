// ============================================
// stripe.js - Intégration Stripe (mode test)
// ============================================

import Stripe from 'stripe';

// La clé secrète est lue depuis les variables d'environnement du SERVEUR.
// Elle n'est JAMAIS exposée côté client.
let stripeInstance = null;

/**
 * Retourne l'instance Stripe configurée.
 * Le paiement s'appuie sur Stripe Checkout (mode test).
 */
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

/**
 * Crée une Stripe Checkout Session pour une facture.
 * Le client est redirigé vers cette URL pour payer en ligne.
 *
 * @param {Object} invoice - Facture avec client et items
 * @returns {Promise<string>} URL de la session de paiement
 */
export async function createInvoiceCheckoutSession(invoice) {
  const stripe = getStripe();
  if (!stripe) {
    const error = new Error('Stripe non configuré (STRIPE_SECRET_KEY manquante)');
    error.code = 'STRIPE_NOT_CONFIGURED';
    throw error;
  }

  const client = invoice.client || {};
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  // Crée la session de Checkout
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Facture ${invoice.number}`,
            description: invoice.items
              ? invoice.items.map((i) => i.description).join(', ')
              : 'Prestation',
          },
          unit_amount: Math.round(invoice.total * 100), // Stripe attend des centimes
        },
        quantity: 1,
      },
    ],
    customer_email: client.email || undefined,
    metadata: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      userId: invoice.userId,
    },
    // URLs de redirection après paiement (mode test)
    success_url: `${clientUrl}/invoices/${invoice.id}?payment=success`,
    cancel_url: `${clientUrl}/invoices/${invoice.id}?payment=cancelled`,
  });

  return session.url;
}

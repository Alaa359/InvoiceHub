// ============================================
// Routes factures (CRUD complet + lignes + calculs auto)
// ============================================

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import prisma from '../prisma.js';
import { generateInvoicePDF } from '../services/pdfGenerator.js';
import { sendInvoiceEmail } from '../services/emailSender.js';

const router = Router();

// Toutes les routes factures nécessitent une authentification
router.use(authenticate);

// ============ HELPERS ============

/**
 * Génère le prochain numéro séquentiel de facture pour un utilisateur.
 * Format : FACT-0001, FACT-0002, ...
 */
async function nextInvoiceNumber(userId) {
  const lastInvoice = await prisma.invoice.findFirst({
    where: { userId },
    orderBy: { number: 'desc' }, // Lexicographique, fonctionne pour FACT-XXXX
  });

  if (!lastInvoice) {
    return 'FACT-0001';
  }

  const match = lastInvoice.number.match(/(\d+)$/);
  const lastNumber = match ? parseInt(match[1], 10) : 0;
  return `FACT-${String(lastNumber + 1).padStart(4, '0')}`;
}

/**
 * Calcule le sous-total, la TVA et le total à partir des lignes.
 * @param {Array} items - [{ quantity, unitPrice, description }]
 * @param {number} taxRate - taux de TVA en % (ex: 20)
 */
function computeTotals(items, taxRate) {
  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const tax = subtotal * (Number(taxRate) || 0) / 100;
  const total = subtotal + tax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxRate: Number(taxRate) || 0,
    total: Math.round(total * 100) / 100,
  };
}

// ============ LISTER LES FACTURES ============

/**
 * GET /api/invoices
 * Retourne les factures avec filtres optionnels :
 * ?status=draft&clientId=xxx&search=FACT-0001
 */
router.get('/', async (req, res) => {
  try {
    const { status, clientId, search } = req.query;

    // Construit le filtre Prisma selon les paramètres de requête
    const where = { userId: req.user.id };

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (search) {
      where.number = { contains: search, mode: 'insensitive' };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, company: true, email: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(invoices);
  } catch (error) {
    console.error('Erreur liste factures:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des factures' });
  }
});

// ============ STATISTIQUES DU DASHBOARD ============

/**
 * GET /api/invoices/stats
 * Retourne les statistiques pour le dashboard :
 *  - revenus totaux (payés)
 *  - compteurs par statut
 *  - évolution des revenus sur 12 mois
 */
router.get('/stats', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user.id },
      select: { status: true, total: true, paidAt: true, createdAt: true, dueDate: true },
    });

    // Revenus totaux (factures marquées payées)
    const totalPaid = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Compteurs par statut
    const count = { draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 };
    invoices.forEach((inv) => {
      if (count[inv.status] !== undefined) count[inv.status]++;
    });

    // En attente = envoyées non payées
    const pending = invoices
      .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    // En retard = factures "overdue" + envoyées dont l'échéance est dépassée
    const now = new Date();
    const overdueAmount = invoices
      .filter(
        (inv) =>
          inv.status === 'overdue' ||
          (inv.status === 'sent' && inv.dueDate && new Date(inv.dueDate) < now)
      )
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Évolution des revenus sur les 12 derniers mois
    const monthly = {}; // { "YYYY-MM": total }
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = 0;
    }

    invoices
      .filter((inv) => inv.status === 'paid' && inv.paidAt)
      .forEach((inv) => {
        const d = new Date(inv.paidAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthly[key] !== undefined) {
          monthly[key] += inv.total || 0;
        }
      });

    // Formate pour recharts
    const monthlyNames = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
    ];
    const revenueData = Object.entries(monthly).map(([key, value]) => ({
      month: monthlyNames[Number(key.split('-')[1]) - 1],
      total: Math.round(value * 100) / 100,
    }));

    res.json({
      totalPaid,
      pending,
      overdue: overdueAmount,
      paidCount: count.paid,
      sentCount: count.sent,
      draftCount: count.draft,
      revenueData,
    });
  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({ error: 'Erreur lors du calcul des statistiques' });
  }
});

// ============ DÉTAIL D'UNE FACTURE ============

/**
 * GET /api/invoices/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        client: { select: { id: true, name: true, company: true, email: true, address: true } },
        items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Facture introuvable' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Erreur détail facture:', error);
    res.status(500).json({ error: 'Erreur lors du chargement de la facture' });
  }
});

// ============ CRÉER UNE FACTURE ============

/**
 * POST /api/invoices
 * Body : { clientId, dueDate?, taxRate, items: [{ description, quantity, unitPrice }] }
 */
router.post(
  '/',
  [
    body('clientId').notEmpty().withMessage('Client requis'),
    body('taxRate').optional().isNumeric().withMessage('TVA invalide'),
    body('dueDate').optional().isISO8601().withMessage('Date d\'échéance invalide'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('Au moins une ligne d\'article est requise'),
    body('items.*.description').notEmpty().withMessage('Description requise'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantité invalide'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Prix invalide'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { clientId, dueDate, taxRate = 0, items } = req.body;

      // Vérifie que le client appartient à l'utilisateur
      const client = await prisma.client.findFirst({
        where: { id: clientId, userId: req.user.id },
      });
      if (!client) {
        return res.status(400).json({ error: 'Client invalide' });
      }

      // Calcule les totaux
      const totals = computeTotals(items, taxRate);

      // Génère le numéro séquentiel
      const number = await nextInvoiceNumber(req.user.id);

      // Crée la facture avec ses lignes d'articles (transactions imbriquées)
      const invoice = await prisma.invoice.create({
        data: {
          userId: req.user.id,
          clientId,
          number,
          dueDate: dueDate ? new Date(dueDate) : null,
          subtotal: totals.subtotal,
          taxRate: totals.taxRate,
          total: totals.total,
          items: {
            create: items.map((item) => ({
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
            })),
          },
        },
        include: { items: true, client: true },
      });

      res.status(201).json(invoice);
    } catch (error) {
      console.error('Erreur création facture:', error);
      res.status(500).json({ error: 'Erreur lors de la création de la facture' });
    }
  }
);

// ============ METTRE À JOUR UNE FACTURE ============

/**
 * PUT /api/invoices/:id
 * Met à jour la facture et ses lignes (remplacement complet des items).
 */
router.put(
  '/:id',
  [
    body('clientId').optional().notEmpty().withMessage('Client requis'),
    body('taxRate').optional().isNumeric().withMessage('TVA invalide'),
    body('dueDate').optional({ nullable: true }).custom((v) => !v || !isNaN(new Date(v))).withMessage('Date invalide'),
    body('items')
      .optional()
      .isArray({ min: 1 })
      .withMessage('Au moins une ligne d\'article est requise'),
    body('items.*.description').optional().notEmpty().withMessage('Description requise'),
    body('items.*.quantity').optional().isInt({ min: 1 }).withMessage('Quantité invalide'),
    body('items.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Prix invalide'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { clientId, dueDate, taxRate, items } = req.body;

      // Vérifie que la facture appartient à l'utilisateur
      const existing = await prisma.invoice.findFirst({
        where: { id: req.params.id, userId: req.user.id },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Facture introuvable' });
      }

      // N'autorise pas la modification des factures payées
      if (existing.status === 'paid') {
        return res.status(400).json({ error: 'Impossible de modifier une facture payée' });
      }

      const data = {};

      if (clientId) {
        const client = await prisma.client.findFirst({
          where: { id: clientId, userId: req.user.id },
        });
        if (!client) return res.status(400).json({ error: 'Client invalide' });
        data.clientId = clientId;
      }

      if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

      // Recalcule les totaux si les lignes ou le taux changent
      if (items) {
        const newItems = items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        }));
        const newTaxRate = taxRate !== undefined ? taxRate : existing.taxRate;
        const totals = computeTotals(newItems, newTaxRate);
        data.subtotal = totals.subtotal;
        data.taxRate = totals.taxRate;
        data.total = totals.total;

        // Supprime les anciennes lignes et recrée (transaction)
        await prisma.invoiceItem.deleteMany({ where: { invoiceId: existing.id } });
        data.items = {
          create: newItems,
        };
      } else if (taxRate !== undefined) {
        // Recalcule avec les lignes existantes
        const currentItems = await prisma.invoiceItem.findMany({
          where: { invoiceId: existing.id },
        });
        const totals = computeTotals(currentItems, taxRate);
        data.subtotal = totals.subtotal;
        data.taxRate = totals.taxRate;
        data.total = totals.total;
      }

      const invoice = await prisma.invoice.update({
        where: { id: existing.id },
        data,
        include: { items: true, client: true },
      });

      res.json(invoice);
    } catch (error) {
      console.error('Erreur mise à jour facture:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de la facture' });
    }
  }
);

// ============ CHANGER LE STATUT ============

/**
 * PATCH /api/invoices/:id/status
 * Body : { status }
 * Complète paidAt automatiquement si statut = paid.
 */
router.patch(
  '/:id/status',
  [
    body('status')
      .isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
      .withMessage('Statut invalide'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { status } = req.body;

      const existing = await prisma.invoice.findFirst({
        where: { id: req.params.id, userId: req.user.id },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Facture introuvable' });
      }

      // Si la facture passe à "paid", on enregistre la date de paiement
      const paidAt = status === 'paid' ? new Date() : null;

      const invoice = await prisma.invoice.update({
        where: { id: existing.id },
        data: { status, ...(status === 'paid' ? { paidAt } : {}) },
        include: { items: true, client: true },
      });

      res.json(invoice);
    } catch (error) {
      console.error('Erreur changement statut:', error);
      res.status(500).json({ error: 'Erreur lors du changement de statut' });
    }
  }
);

// ============ SUPPRIMER UNE FACTURE ============

/**
 * DELETE /api/invoices/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Facture introuvable' });
    }

    await prisma.invoice.delete({ where: { id: existing.id } });
    res.json({ message: 'Facture supprimée' });
  } catch (error) {
    console.error('Erreur suppression facture:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la facture' });
  }
});

// ============ TÉLÉCHARGER LE PDF ============

/**
 * GET /api/invoices/:id/pdf
 * Génère et renvoie le PDF de la facture.
 */
router.get('/:id/pdf', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        client: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Facture introuvable' });
    }

    // Infos de l'entreprise émettrice (l'utilisateur connecté)
    const company = { companyName: req.user.companyName };

    const pdfBuffer = await generateInvoicePDF(invoice, company);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="facture-${invoice.number}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
  }
});

// ============ ENVOI PAR EMAIL ============

/**
 * POST /api/invoices/:id/send
 * Envoie la facture par email au client et passe le statut en "sent".
 */
router.post('/:id/send', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        client: true,
        items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Facture introuvable' });
    }

    if (!invoice.client?.email) {
      return res.status(400).json({ error: 'Ce client n\'a pas d\'adresse email' });
    }

    const company = { companyName: req.user.companyName };

    let result;
    try {
      // En mode réel : envoie via SMTP. Sans SMTP configuré : génère un email
      // de démonstration dans server/preview-emails/ (l'envoi reste un succès).
      result = await sendInvoiceEmail(invoice, company);
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError.message);
      return res.status(502).json({
        error:
          emailError.code === 'SMTP_NOT_CONFIGURED'
            ? 'Serveur SMTP non configuré. Ajoutez les variables SMTP_* dans le fichier .env.'
            : 'Erreur lors de l\'envoi de l\'email',
      });
    }

    // Passe le statut en "sent" (si ce n'est pas déjà payé)
    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: invoice.status === 'paid' ? 'paid' : 'sent' },
      include: { items: true, client: true },
    });

    res.json({
      message: result.preview ? 'Facture envoyée (mode démonstration)' : 'Facture envoyée',
      invoice: updated,
      preview: result.preview || false,
      previewPath: result.path || undefined,
    });
  } catch (error) {
    console.error('Erreur envoi facture:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la facture' });
  }
});

export default router;

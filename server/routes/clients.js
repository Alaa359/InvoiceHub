// ============================================
// Routes clients (CRUD complet)
// ============================================

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../index.js';

const router = Router();

// Toutes les routes clients nécessitent une authentification
router.use(authenticate);

// ============ LISTER LES CLIENTS ============

/**
 * GET /api/clients
 * Retourne la liste des clients de l'utilisateur connecté,
 * avec le nombre de factures et le montant total facturé.
 */
router.get('/', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      where: { userId: req.user.id },
      include: {
        _count: { select: { invoices: true } },
        invoices: {
          select: { total: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcule le montant total facturé par client
    const result = clients.map((client) => ({
      ...client,
      invoiceCount: client._count.invoices,
      totalInvoiced: client.invoices.reduce(
        (sum, inv) => sum + (inv.total || 0),
        0
      ),
    }));

    res.json(result);
  } catch (error) {
    console.error('Erreur liste clients:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des clients' });
  }
});

// ============ DÉTAIL D'UN CLIENT ============

/**
 * GET /api/clients/:id
 * Retourne un client avec l'historique de ses factures.
 */
router.get('/:id', async (req, res) => {
  try {
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client introuvable' });
    }

    res.json(client);
  } catch (error) {
    console.error('Erreur détail client:', error);
    res.status(500).json({ error: 'Erreur lors du chargement du client' });
  }
});

// ============ CRÉER UN CLIENT ============

/**
 * POST /api/clients
 * Body : { name, email, address?, company? }
 */
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Le nom est requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('address').optional().isString(),
    body('company').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, address, company } = req.body;

      const client = await prisma.client.create({
        data: {
          userId: req.user.id,
          name,
          email,
          address: address || null,
          company: company || null,
        },
      });

      res.status(201).json(client);
    } catch (error) {
      console.error('Erreur création client:', error);
      res.status(500).json({ error: 'Erreur lors de la création du client' });
    }
  }
);

// ============ METTRE À JOUR UN CLIENT ============

/**
 * PUT /api/clients/:id
 * Body : { name, email, address?, company? }
 */
router.put(
  '/:id',
  [
    body('name').notEmpty().withMessage('Le nom est requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('address').optional().isString(),
    body('company').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, address, company } = req.body;

      // Vérifie que le client appartient à l'utilisateur
      const existing = await prisma.client.findFirst({
        where: { id: req.params.id, userId: req.user.id },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Client introuvable' });
      }

      const client = await prisma.client.update({
        where: { id: req.params.id },
        data: {
          name,
          email,
          address: address || null,
          company: company || null,
        },
      });

      res.json(client);
    } catch (error) {
      console.error('Erreur mise à jour client:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du client' });
    }
  }
);

// ============ SUPPRIMER UN CLIENT ============

/**
 * DELETE /api/clients/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    // Vérifie que le client appartient à l'utilisateur
    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Client introuvable' });
    }

    await prisma.client.delete({ where: { id: req.params.id } });
    res.json({ message: 'Client supprimé' });
  } catch (error) {
    console.error('Erreur suppression client:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du client' });
  }
});

export default router;

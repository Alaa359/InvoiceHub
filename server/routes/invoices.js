// ============================================
// Routes factures (CRUD)
// Implémentées à l'Étape 3
// ============================================

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../index.js';

const router = Router();

// Toutes les routes factures nécessitent une authentification
router.use(authenticate);

// GET /api/invoices - liste des factures de l'utilisateur connecté
router.get('/', async (req, res) => {
  const invoices = await prisma.invoice.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(invoices);
});

export default router;

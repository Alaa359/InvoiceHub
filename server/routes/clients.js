// ============================================
// Routes clients (CRUD)
// Implémentées à l'Étape 2
// ============================================

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../index.js';

const router = Router();

// Toutes les routes clients nécessitent une authentification
router.use(authenticate);

// GET /api/clients - liste des clients de l'utilisateur connecté
router.get('/', async (req, res) => {
  const clients = await prisma.client.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(clients);
});

export default router;

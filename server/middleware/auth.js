// ============================================
// Middleware d'authentification JWT
// Protège les routes qui nécessitent un utilisateur connecté
// ============================================

import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';

/**
 * Middleware qui vérifie le token JWT de l'utilisateur.
 * Le token est attendu dans le header `Authorization: Bearer <token>`.
 */
export async function authenticate(req, res, next) {
  try {
    // Récupère le header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    }

    const token = authHeader.split(' ')[1];

    // Vérifie et décode le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Charge l'utilisateur depuis la base de données
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, companyName: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur introuvable' });
    }

    // Attache l'utilisateur à la requête pour les routes suivantes
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expirée ou token invalide' });
    }
    next(error);
  }
}

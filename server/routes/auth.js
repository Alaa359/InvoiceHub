// ============================================
// Routes d'authentification : register / login
// ============================================

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import prisma from '../prisma.js';

const router = Router();

// ============ HELPERS ============

// Génère un token JWT pour un utilisateur
function generateToken(user) {
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

// Formate l'utilisateur renvoyé (sans le mot de passe)
function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    companyName: user.companyName,
  };
}

// ============ INSCRIPTION ============

/**
 * POST /api/auth/register
 * Body : { email, password, companyName }
 */
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email invalide'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    body('companyName')
      .notEmpty()
      .withMessage("Le nom de l'entreprise est requis"),
  ],
  async (req, res) => {
    // Valide les données entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, companyName } = req.body;

      // Vérifie si l'email est déjà utilisé
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: 'Cet email est déjà utilisé' });
      }

      // Hache le mot de passe (10 rounds de salage)
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crée l'utilisateur
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          companyName,
        },
      });

      // Génère le token et renvoie l'utilisateur
      const token = generateToken(user);
      res.status(201).json({ token, user: formatUser(user) });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de l'inscription" });
    }
  }
);

// ============ CONNEXION ============

/**
 * POST /api/auth/login
 * Body : { email, password }
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Trouve l'utilisateur par email
      const user = await prisma.user.findUnique({ where: { email } });

      // Vérifie le mot de passe (comparaison sécurisée via bcrypt)
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }

      // Génère le token et renvoie l'utilisateur
      const token = generateToken(user);
      res.json({ token, user: formatUser(user) });
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la connexion' });
    }
  }
);

export default router;

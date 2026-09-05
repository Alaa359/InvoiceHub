// ============================================
// emailSender.js - Envoi d'emails avec Nodemailer
// ============================================

import nodemailer from 'nodemailer';
import { generateInvoicePDF } from './pdfGenerator.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

// La clé placeholder du .env.example n'est pas une configuration réelle
const PLACEHOLDER_SMTP_HOST = 'smtp.example.com';

/**
 * Indique si le SMTP est réellement configuré (hôte présent ET non placeholder).
 * @returns {boolean}
 */
export function isEmailConfigured() {
  const host = process.env.SMTP_HOST;
  return !!host && host !== PLACEHOLDER_SMTP_HOST;
}

/**
 * Crée le transporteur Nodemailer à partir des variables d'environnement.
 * Retourne null si SMTP n'est pas configuré.
 */
function createTransporter() {
  if (!isEmailConfigured()) {
    console.warn('SMTP_HOST non configuré : l\'envoi d\'emails est désactivé.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Envoie une facture par email au client, avec le PDF en pièce jointe.
 *
 * @param {Object} invoice - Facture avec client et items chargés
 * @param {Object} company - { companyName }
 * @returns {Promise<Object>} info du transport Nodemailer
 */
export async function sendInvoiceEmail(invoice, company = {}) {
  const transporter = createTransporter();
  if (!transporter) {
    // Mode sans SMTP : simule l'envoi pour les tests locaux
    const error = new Error('SMTP non configuré (variables SMTP_HOST manquantes)');
    error.code = 'SMTP_NOT_CONFIGURED';
    throw error;
  }

  const client = invoice.client || {};
  const companyName = company.companyName || 'Votre entreprise';

  // Génère le PDF à joindre
  const pdfBuffer = await generateInvoicePDF(invoice, company);

  const mailOptions = {
    from: `"${companyName}" <${process.env.SMTP_USER}>`,
    to: client.email,
    subject: `Facture ${invoice.number} de ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Bonjour ${client.name},</h2>
        <p>Veuillez trouver ci-joint la facture <strong>${invoice.number}</strong> de la part de
        <strong>${companyName}</strong>.</p>

        <table style="width:100%; border-collapse: collapse; margin: 20px 0; background: #F5F7FA; border-radius: 8px;">
          <tr>
            <td style="padding: 12px; color: #6E7485;">Montant total</td>
            <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 20px; color: #1A1D29;">
              ${formatCurrency(invoice.total)}
            </td>
          </tr>
          ${invoice.dueDate ? `
          <tr>
            <td style="padding: 12px; color: #6E7485;">Date d'échéance</td>
            <td style="padding: 12px; text-align: right; color: #1A1D29;">${formatDate(invoice.dueDate)}</td>
          </tr>` : ''}
        </table>

        <p>Merci pour votre confiance.</p>
        <p style="color: #6E7485; font-size: 12px;">
          ${companyName} · Facturation via InvoiceHub
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `facture-${invoice.number}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

/**
 * Envoie une relance de paiement pour une facture en retard.
 *
 * @param {Object} invoice - Facture avec client et items chargés
 * @param {Object} company - { companyName }
 * @returns {Promise<Object>} info du transport Nodemailer
 */
export async function sendReminderEmail(invoice, company = {}) {
  const transporter = createTransporter();
  if (!transporter) {
    const error = new Error('SMTP non configuré (variables SMTP_HOST manquantes)');
    error.code = 'SMTP_NOT_CONFIGURED';
    throw error;
  }

  const client = invoice.client || {};
  const companyName = company.companyName || 'Votre entreprise';

  // Génère le PDF à joindre (facultatif pour la relance)
  const pdfBuffer = await generateInvoicePDF(invoice, company);

  const mailOptions = {
    from: `"${companyName}" <${process.env.SMTP_USER}>`,
    to: client.email,
    subject: `Relance : Facture ${invoice.number} en attente de paiement`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F59E0B;">Relance de paiement</h2>
        <p>Bonjour ${client.name},</p>
        <p>Nous vous rappelons que la facture <strong>${invoice.number}</strong>
        de <strong>${companyName}</strong> est arrivée à échéance et reste en attente de paiement.</p>

        ${invoice.dueDate ? `
        <p><strong>Montant dû :</strong> ${formatCurrency(invoice.total)}</p>
        <p><strong>Date d'échéance :</strong> ${formatDate(invoice.dueDate)}</p>` : ''}

        <p>Vous trouverez la facture en pièce jointe. Merci de procéder au paiement
        dans les plus brefs délais.</p>

        <p>Si le paiement a déjà été effectué, merci d'ignorer ce message.</p>
        <p style="color: #6E7485; font-size: 12px;">
          ${companyName} · Facturation via InvoiceHub
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `facture-${invoice.number}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

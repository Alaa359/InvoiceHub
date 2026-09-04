// ============================================
// pdfGenerator.js - Génération de factures PDF avec pdfkit
// ============================================

import PDFDocument from 'pdfkit';

/**
 * Formate un montant en euros (ex: "840,00 €").
 */
function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  });
}

/**
 * Formate une date en français (ex: "04/09/2026").
 */
function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Génère un buffer PDF pour une facture.
 *
 * @param {Object} invoice - Facture avec items et client chargés
 * @param {Object} company - Infos de l'entreprise émettrice
 * @returns {Promise<Buffer>} Le buffer PDF
 */
export async function generateInvoicePDF(invoice, company = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const companyName = company.companyName || 'Votre entreprise';
      const client = invoice.client || {};

      // Calcule les totaux depuis les lignes
      const subtotal = (invoice.items || []).reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        0
      );
      const taxRate = Number(invoice.taxRate) || 0;
      const taxAmount = subtotal * taxRate / 100;

      // ===== Couleurs =====
      const COLOR_ACCENT = '#4F46E5';
      const COLOR_TEXT = '#1A1D29';
      const COLOR_MUTED = '#6E7485';
      const COLOR_LINE = '#E5E7EB';

      // ===== En-tête : entreprise + type de document =====
      doc.fillColor(COLOR_TEXT).fontSize(22).font('Helvetica-Bold').text(companyName, { continued: false });
      doc.moveDown(0.4);
      doc.fillColor(COLOR_ACCENT).fontSize(16).font('Helvetica-Bold').text('FACTURE', { continued: false });
      doc.moveDown(0.1);
      doc.fillColor(COLOR_TEXT).fontSize(20).text(`N° ${invoice.number}`);
      doc.moveDown(1);

      // Informations d'émission (à droite)
      const metaX = doc.page.width - 50 - 200;
      doc.fontSize(10).font('Helvetica');
      doc.fillColor(COLOR_MUTED).text(`Date d'émission : ${formatDate(invoice.createdAt)}`, metaX, 70, { width: 200, align: 'right' });
      if (invoice.dueDate) {
        doc.fillColor(COLOR_MUTED).text(`Échéance : ${formatDate(invoice.dueDate)}`, metaX, 84, { width: 200, align: 'right' });
      }
      if (invoice.paidAt) {
        doc.fillColor(COLOR_MUTED).text(`Payée le : ${formatDate(invoice.paidAt)}`, metaX, 98, { width: 200, align: 'right' });
      }

      doc.moveDown(1.5);

      // ===== Bloc client =====
      doc.fillColor(COLOR_MUTED).fontSize(9).font('Helvetica-Bold').text('FACTURÉ À', { continued: false });
      doc.moveDown(0.2);
      doc.fillColor(COLOR_TEXT).fontSize(12).font('Helvetica-Bold').text(client.name || '—');
      doc.fontSize(10).font('Helvetica');
      if (client.company) doc.text(client.company);
      if (client.address) doc.text(client.address);
      if (client.email) doc.text(client.email);
      doc.moveDown(1.5);

      // ===== Tableau des lignes =====
      const tableTop = doc.y;
      const colDescription = 50;
      const colQty = 400;
      const colPrice = 460;
      const colTotal = 520;
      const rowHeight = 24;

      // En-tête de tableau
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR_TEXT);
      doc.text('Description', colDescription, tableTop);
      doc.text('Qté', colQty, tableTop, { width: 50, align: 'right' });
      doc.text('Prix', colPrice, tableTop, { width: 60, align: 'right' });
      doc.text('Montant', colTotal, tableTop, { width: 60, align: 'right' });
      doc.moveTo(colDescription, tableTop + 16).lineTo(colTotal + 60, tableTop + 16).strokeColor(COLOR_ACCENT).lineWidth(1.5).stroke();

      let y = tableTop + 24;

      // Lignes d'articles
      doc.font('Helvetica').fontSize(10).fillColor(COLOR_TEXT);
      (invoice.items || []).forEach((item) => {
        const amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        doc.text(item.description || '', colDescription, y);
        doc.text(String(item.quantity || 0), colQty, y, { width: 50, align: 'right' });
        doc.text(formatCurrency(item.unitPrice), colPrice, y, { width: 60, align: 'right' });
        doc.text(formatCurrency(amount), colTotal, y, { width: 60, align: 'right' });
        doc.moveTo(colDescription, y + rowHeight - 8).lineTo(colTotal + 60, y + rowHeight - 8).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
        y += rowHeight;
      });

      // ===== Totaux =====
      const totalsX = colTotal + 60;
      const totalsStartX = colPrice;
      doc.moveDown(1);
      let ty = doc.y + 10;
      doc.font('Helvetica').fontSize(11).fillColor(COLOR_MUTED);
      doc.text('Sous-total', totalsStartX, ty, { width: 120 });
      doc.fillColor(COLOR_TEXT).text(formatCurrency(subtotal), colPrice + 100, ty, { width: 90, align: 'right' });
      ty += 22;
      doc.fillColor(COLOR_MUTED).text(`TVA (${taxRate}%)`, totalsStartX, ty, { width: 120 });
      doc.fillColor(COLOR_TEXT).text(formatCurrency(taxAmount), colPrice + 100, ty, { width: 90, align: 'right' });
      ty += 30;

      // Total en gros
      doc.moveTo(totalsStartX, ty - 8).lineTo(totalsX, ty - 8).strokeColor(COLOR_TEXT).lineWidth(1).stroke();
      doc.font('Helvetica-Bold').fontSize(16).fillColor(COLOR_TEXT).text('TOTAL', totalsStartX, ty, { width: 120 });
      doc.font('Helvetica-Bold').fillColor(COLOR_ACCENT).text(formatCurrency(invoice.total ?? (subtotal + taxAmount)), colPrice + 100, ty, { width: 90, align: 'right' });

      // ===== Pied de page =====
      const bottom = doc.page.height - 70;
      doc.font('Helvetica').fontSize(8).fillColor(COLOR_MUTED);
      doc.text(
        `Facture générée par InvoiceHub - ${companyName} - Merci pour votre confiance.`,
        50,
        bottom,
        { width: 500, align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

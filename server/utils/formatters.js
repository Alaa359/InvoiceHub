// ============================================
// Utilitaires de formatage côté serveur
// ============================================

/**
 * Formate un montant en euros (ex: "1 234,56 €").
 */
export function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  });
}

/**
 * Formate une date en français (ex: "04/09/2026").
 */
export function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

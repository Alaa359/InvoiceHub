// ============================================
// StatusBadge - Badge pilule coloré selon le statut
// ============================================

const statusConfig = {
  draft: { label: 'Brouillon', className: 'badge-gray' },
  sent: { label: 'Envoyée', className: 'badge-blue' },
  paid: { label: 'Payée', className: 'badge-green' },
  overdue: { label: 'En retard', className: 'badge-orange' },
  cancelled: { label: 'Annulée', className: 'badge-gray' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: 'badge-gray' };

  return <span className={`status-badge ${config.className}`}>{config.label}</span>;
}

// Export du mapping pour réutilisation
export { statusConfig };

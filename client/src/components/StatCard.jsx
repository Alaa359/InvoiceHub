// ============================================
// StatCard - Carte de statistique du dashboard
// Implémentation complète à l'Étape 7
// ============================================

import { formatCurrency } from '../utils/format';

const colorMap = {
  accent: { iconBg: 'var(--accent-light)', color: 'var(--accent)' },
  green: { iconBg: 'var(--green-light)', color: 'var(--green)' },
  blue: { iconBg: 'var(--blue-light)', color: 'var(--blue)' },
  orange: { iconBg: 'var(--orange-light)', color: '#b45309' },
  gray: { iconBg: 'var(--gray-light)', color: 'var(--gray)' },
};

const iconPath = {
  cash: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  ),
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  alert: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  invoice: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  ),
};

export default function StatCard({ label, value, color = 'accent', icon = 'cash', variation = null }) {
  const cfg = colorMap[color] || colorMap.accent;

  return (
    <div className="card stat-card">
      <div className="stat-card-icon" style={{ background: cfg.iconBg, color: cfg.color }}>
        {iconPath[icon] || iconPath.cash}
      </div>
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value" style={{ color: cfg.color }}>
        {formatCurrency(value ?? 0)}
      </span>
      {variation != null && (
        <span className={variation >= 0 ? 'stat-variation positive' : 'stat-variation negative'}>
          {variation >= 0 ? '▲' : '▼'} {Math.abs(variation)}%
        </span>
      )}
    </div>
  );
}

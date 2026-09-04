// ============================================
// RevenueChart - Graphique d'évolution des revenus
// Implémentation complète à l'Étape 7
// ============================================

export default function RevenueChart({ data, loading }) {
  if (loading) {
    return <div className="card skeleton-card" style={{ height: 260 }} />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="empty-sub" style={{ padding: 40, textAlign: 'center' }}>
        Pas encore de données de revenus.
      </div>
    );
  }

  // Placeholder: le vrai graphique recharts sera ajouté à l'étape 7
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 220, paddingTop: 8 }}>
      {data.map((d) => (
        <div
          key={d.month}
          title={`${d.month}: ${d.total}`}
          style={{
            flex: 1,
            background: 'var(--accent)',
            height: `${Math.max(4, (d.total / (Math.max(...data.map((x) => x.total || 0), 1))) * 180)}px`,
            borderRadius: '4px 4px 0 0',
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// RevenueChart - Graphique de revenus (recharts area chart)
// Courbe lissée sur les 12 derniers mois avec zone remplie
// ============================================

import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/format';

export default function RevenueChart({ data, loading }) {
  if (loading) {
    return <div className="card skeleton-card" style={{ height: 280 }} />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="empty-sub" style={{ padding: 40, textAlign: 'center' }}>
        Pas encore de données de revenus.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 24, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#6E7485', fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6E7485', fontSize: 12 }} />
        <Tooltip formatter={(value) => formatCurrency(value)} />
        {/* Zone sous la courbe : indigo très léger (remplissage doux) */}
        <Area dataKey="total" type="monotone" stroke="#4F46E5" strokeWidth={2.5} fill="rgba(79, 70, 229, 0.08)" activeDot={{ r: 5, fill: '#4F46E5' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
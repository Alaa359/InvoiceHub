// ============================================
// InvoiceLineItem - Ligne d'article éditable dans une facture
// ============================================

import { formatCurrency } from '../utils/format';

export default function InvoiceLineItem({ item, index, onChange, onRemove }) {
  // Met à jour un champ de la ligne
  const handleChange = (field, value) => {
    onChange(index, { ...item, [field]: field === 'quantity' ? Number(value) || 0 : value });
  };

  const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

  return (
    <div className="line-item">
      <input
        className="line-description"
        type="text"
        value={item.description}
        onChange={(e) => handleChange('description', e.target.value)}
        placeholder="Description de la prestation"
      />
      <input
        className="line-quantity"
        type="number"
        min="0"
        value={item.quantity}
        onChange={(e) => handleChange('quantity', e.target.value)}
        placeholder="Qté"
      />
      <input
        className="line-price"
        type="number"
        min="0"
        step="0.01"
        value={item.unitPrice}
        onChange={(e) => handleChange('unitPrice', e.target.value)}
        placeholder="Prix"
      />
      <span className="line-total">{formatCurrency(lineTotal)}</span>
      <button type="button" className="line-remove" onClick={() => onRemove(index)} title="Supprimer la ligne">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        </svg>
      </button>
    </div>
  );
}

// ============================================
// InvoiceRow - Ligne d'une facture dans la liste
// ============================================

import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { formatCurrency, formatDate } from '../utils/format';

export default function InvoiceRow({ invoice }) {
  const isOverdue =
    invoice.status === 'overdue' ||
    (invoice.status === 'sent' && invoice.dueDate && new Date(invoice.dueDate) < new Date());

  return (
    <tr className={isOverdue ? 'row-overdue' : ''}>
      <td className="cell-number">{invoice.number}</td>
      <td>{invoice.client?.name || '—'}</td>
      <td>{formatDate(invoice.createdAt)}</td>
      <td>{formatDate(invoice.dueDate)}</td>
      <td className="cell-amount">{formatCurrency(invoice.total)}</td>
      <td><StatusBadge status={invoice.status} /></td>
      <td>
        <Link to={`/invoices/${invoice.id}`} className="btn btn-secondary btn-sm">Voir</Link>
      </td>
    </tr>
  );
}

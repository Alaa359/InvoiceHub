// ============================================
// InvoiceEditor.jsx - Éditeur de facture
// Implémentation complète à l'Étape 3
// ============================================

import { Link } from 'react-router-dom';

export default function InvoiceEditor() {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 48 }}>
      <h2>Éditeur de facture</h2>
      <p className="empty-sub" style={{ margin: '12px 0 24px' }}>
        L'éditeur complet sera disponible à l'étape 3.
      </p>
      <Link to="/invoices" className="btn btn-secondary">Retour aux factures</Link>
    </div>
  );
}

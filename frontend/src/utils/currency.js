/**
 * Formate un montant en euros (€) avec séparateur de milliers.
 * Ex : formatPrice(1200.5) → "1 200,50 €"
 */
export function formatPrice(amount) {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

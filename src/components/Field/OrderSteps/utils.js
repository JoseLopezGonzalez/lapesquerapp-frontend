export function formatDate(value) {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export function getOrderTypeLabel(orderType) {
  return orderType === 'autoventa' ? 'Autoventa' : 'Estándar';
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return 'Sin calcular';
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Sin calcular';
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${minutes.toString().padStart(2, '0')} min`;
}

export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return 'No disponible';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getStopTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    obligatoria: 'Obligatoria',
    sugerida: 'Sugerida',
    oportunidad: 'Oportunidad',
  };
  return labels[value] ?? value ?? 'Sin tipo';
}

export function getTargetTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    location: 'Ubicación',
    customer: 'Cliente',
    prospect: 'Prospecto',
  };
  return labels[value] ?? value ?? 'Sin objetivo';
}

export function getRouteStatusLabel(value: string): string {
  const normalizedValue = typeof value === 'string' ? value.trim().toLowerCase() : value;
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    planned: 'Planificada',
    draft: 'Borrador',
    assigned: 'Asignada',
    active: 'Activa',
    in_progress: 'En curso',
    completed: 'Completada',
    finished: 'Finalizada',
    cancelled: 'Cancelada',
    canceled: 'Cancelada',
    incident: 'Incidencia',
    skipped: 'Omitida',
  };
  return labels[normalizedValue] ?? value ?? 'Pendiente';
}

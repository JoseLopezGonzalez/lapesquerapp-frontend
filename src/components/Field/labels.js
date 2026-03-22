export const fieldStatusLabels = {
  pending: 'Pendiente',
  planned: 'Planificada',
  assigned: 'Asignada',
  active: 'Activa',
  in_progress: 'En curso',
  finished: 'Finalizado',
  incident: 'Incidencia',
  completed: 'Completada',
  skipped: 'Omitida',
  cancelled: 'Cancelada',
  canceled: 'Cancelada',
};

export function getFieldStatusLabel(status) {
  const normalized = typeof status === 'string' ? status.trim().toLowerCase() : status;
  return fieldStatusLabels[normalized] ?? status ?? 'Pendiente';
}

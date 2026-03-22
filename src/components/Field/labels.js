export const fieldStatusLabels = {
  pending: 'Pendiente',
  finished: 'Finalizado',
  incident: 'Incidencia',
  completed: 'Completada',
  skipped: 'Omitida',
};

export function getFieldStatusLabel(status) {
  return fieldStatusLabels[status] ?? status ?? 'Pendiente';
}

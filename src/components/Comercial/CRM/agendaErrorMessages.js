export function extractAgendaErrorCode(error) {
  const directCode = error?.data?.code ?? error?.code;
  if (typeof directCode === 'string' && directCode.trim()) return directCode.trim().toUpperCase();

  const nestedCode = error?.data?.error?.code;
  if (typeof nestedCode === 'string' && nestedCode.trim()) return nestedCode.trim().toUpperCase();

  const firstFieldError = Array.isArray(error?.data?.errors) ? error.data.errors[0] : null;

  if (typeof firstFieldError?.code === 'string' && firstFieldError.code.trim()) {
    return firstFieldError.code.trim().toUpperCase();
  }

  return null;
}

const DOMAIN_MESSAGES = {
  PENDING_EXISTS: 'Ya existe una acción pendiente para este cliente o prospecto.',
  NO_PENDING_TO_UPDATE: 'No hay acción pendiente para actualizar.',
  NO_PENDING_TO_RESCHEDULE: 'No hay acción pendiente para reprogramar.',
  NO_PENDING_TO_KEEP: 'No hay acción pendiente para mantener.',
  NO_PENDING_TO_OVERRIDE: 'No hay acción pendiente para reemplazar.',
  STALE_PENDING: 'La acción pendiente cambió mientras operabas. Recarga y vuelve a intentarlo.',
  TARGET_MISMATCH: 'La acción no corresponde al cliente o prospecto seleccionado.',
  PENDING_NOT_ACTIVE: 'La acción pendiente ya no está activa. Recarga la agenda.',
  INVALID_STRATEGY: 'La estrategia seleccionada no es válida para el estado actual.',
  INVALID_STRATEGY_FIELDS: 'Los campos enviados no son válidos para la estrategia seleccionada.',
};

export function getAgendaDomainErrorMessage(error, fallbackMessage) {
  const code = extractAgendaErrorCode(error);
  if (code && DOMAIN_MESSAGES[code]) return DOMAIN_MESSAGES[code];
  return error?.message || fallbackMessage || 'No se pudo completar la operación de agenda.';
}

// Estas secciones/acciones se ocultan por completo (no se deshabilitan con aviso) para
// comercial readOnly en pedidos en curso — decisión de producto confirmada por Jose
// (GAP-V2-036, rejected, 2026-07-03): el rol comercial no tiene expectativa de que estas
// opciones existan, así que no hay nada que explicar. No reabrir como hallazgo de UX/a11y
// en futuras auditorías de "acción oculta sin feedback" para estas secciones concretas.
export const COMMERCIAL_IN_PROGRESS_BLOCKED_ORDER_SECTIONS = [
  'labels',
  'documents',
  'incident',
  'export',
];

type OrderPermissionState = {
  readOnly?: boolean;
  status?: string | null;
};

export function isReadOnlyOrderInProgress({ readOnly = false, status }: OrderPermissionState) {
  return Boolean(readOnly && status && status !== 'finished');
}

export function getBlockedOrderSectionsForReadOnly(state: OrderPermissionState): string[] {
  return isReadOnlyOrderInProgress(state) ? COMMERCIAL_IN_PROGRESS_BLOCKED_ORDER_SECTIONS : [];
}

// Mismo criterio que arriba: los botones de acción de palets se ocultan sin aviso para
// comercial readOnly en curso (GAP-V2-036, rejected) — no es un hallazgo pendiente.
export function isOrderPalletsReadOnly(state: OrderPermissionState) {
  return isReadOnlyOrderInProgress(state);
}

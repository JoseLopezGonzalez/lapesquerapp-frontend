/**
 * Rutas base por rol (patrón role-based routing).
 * Cada rol tiene su segmento en la URL; el operario usa /operator, administración usa /admin.
 * Ver docs/arquitectura/patron-rutas-por-rol.md
 */

/** Base URL para el rol operario (dashboard, crear recepción, crear salida de cebo) */
export const OPERATOR_BASE = '/operator';

export const operatorRoutes = {
  dashboard: OPERATOR_BASE,
  receptionsCreate: `${OPERATOR_BASE}/receptions/create`,
  dispatchesCreate: `${OPERATOR_BASE}/dispatches/create`,
};

/** Base URL para el rol comercial (dashboard con 5 cards) */
export const COMERCIAL_BASE = '/comercial';

export const comercialRoutes = {
  dashboard: COMERCIAL_BASE,
  autoventa: `${COMERCIAL_BASE}/autoventa`,
};

/** Rutas de admin para otros roles (referencia; no incluye operario para flujos propios) */
export const ADMIN_BASE = '/admin';

export const adminRoutes = {
  home: `${ADMIN_BASE}/home`,
  rawMaterialReceptionsCreate: `${ADMIN_BASE}/raw-material-receptions/create`,
  ceboDispatchesCreate: `${ADMIN_BASE}/cebo-dispatches/create`,
  ceboDispatchesList: `${ADMIN_BASE}/cebo-dispatches`,
};

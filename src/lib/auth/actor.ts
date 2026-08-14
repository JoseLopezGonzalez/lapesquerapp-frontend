export type ActorType = 'internal_user' | 'external_user';
export type ExternalUserType = 'maquilador' | null;

export interface AuthActorLike {
  actorType?: ActorType | null;
  externalUserType?: ExternalUserType;
  tollClientId?: number | null;
  allowedStoreIds?: number[] | null;
  role?: string | string[] | null;
}

function normalizeRole(role: AuthActorLike['role']): string | null {
  if (Array.isArray(role)) return role[0] ?? null;
  return role ?? null;
}

export function isExternalActor(user?: AuthActorLike | null): boolean {
  return user?.actorType === 'external_user';
}

export function isInternalActor(user?: AuthActorLike | null): boolean {
  return user?.actorType !== 'external_user';
}

/**
 * Cliente de maquila (TollClient) — portal reducido y propio dentro de la experiencia externa.
 * No usar `externalUserType` para esta decisión: es un enum con un único valor legal
 * ('maquilador') compartido por cualquier ExternalUser, tenga o no toll_client_id vinculado.
 * El único campo fiable es `tollClientId !== null` (fail-closed, mismo criterio que el backend
 * usa en cada controller del portal vía getCurrentTollClientId()) — ver docs/maquila/frontend/00-index.md §1.1.
 */
export function isTollClient(user?: AuthActorLike | null): boolean {
  return isExternalActor(user) && user?.tollClientId != null;
}

export function canDeletePallet(user?: AuthActorLike | null): boolean {
  return isInternalActor(user);
}

/** Roles que pueden ver/editar costes de palet y coste manual por caja (API v2). */
const PALLET_COST_MANAGEMENT_ROLES = new Set(['administrador', 'direccion', 'tecnico']);

/**
 * Usuarios internos con rol administrador, dirección o técnico pueden gestionar
 * costes en palets (coherente con CostRegularization y PalletView).
 */
export function canManagePalletCostFields(user?: AuthActorLike | null): boolean {
  if (!isInternalActor(user)) return false;
  const role = normalizeRole(user?.role);
  return role != null && PALLET_COST_MANAGEMENT_ROLES.has(role);
}

export function getDefaultAuthenticatedRoute(user?: AuthActorLike | null): string {
  if (isTollClient(user)) return '/external/maquila';
  if (isExternalActor(user)) return '/external/stores-manager';

  const role = normalizeRole(user?.role);
  if (role === 'operario') return '/operator';
  if (role === 'comercial') return '/comercial';
  if (role === 'repartidor_autoventa') return '/field';
  return '/admin/home';
}

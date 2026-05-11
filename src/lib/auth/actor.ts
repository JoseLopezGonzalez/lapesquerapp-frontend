export type ActorType = "internal_user" | "external_user";
export type ExternalUserType = "maquilador" | null;

export interface AuthActorLike {
  actorType?: ActorType | null;
  externalUserType?: ExternalUserType;
  allowedStoreIds?: number[] | null;
  role?: string | string[] | null;
}

function normalizeRole(role: AuthActorLike["role"]): string | null {
  if (Array.isArray(role)) return role[0] ?? null;
  return role ?? null;
}

export function isExternalActor(user?: AuthActorLike | null): boolean {
  return user?.actorType === "external_user";
}

export function isInternalActor(user?: AuthActorLike | null): boolean {
  return user?.actorType !== "external_user";
}

export function canDeletePallet(user?: AuthActorLike | null): boolean {
  return isInternalActor(user);
}

/** Roles que pueden ver/editar costes de palet y coste manual por caja (API v2). */
const PALLET_COST_MANAGEMENT_ROLES = new Set([
  "administrador",
  "direccion",
  "tecnico",
]);

/**
 * Usuarios internos con rol administrador, dirección o técnico pueden gestionar
 * costes en palets (coherente con CostRegularization y PalletView).
 */
export function canManagePalletCostFields(user?: AuthActorLike | null): boolean {
  if (!isInternalActor(user)) return false;
  const role = normalizeRole(user?.role);
  return role != null && PALLET_COST_MANAGEMENT_ROLES.has(role);
}

export function getDefaultAuthenticatedRoute(
  user?: AuthActorLike | null
): string {
  if (isExternalActor(user)) return "/external/stores-manager";

  const role = normalizeRole(user?.role);
  if (role === "operario") return "/operator";
  if (role === "comercial") return "/comercial";
  if (role === "repartidor_autoventa") return "/field";
  return "/admin/home";
}

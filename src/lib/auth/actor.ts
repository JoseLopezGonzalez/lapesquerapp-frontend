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

export function getDefaultAuthenticatedRoute(
  user?: AuthActorLike | null
): string {
  if (isExternalActor(user)) return "/external/stores-manager";

  const role = normalizeRole(user?.role);
  if (role === "operario") return "/operator";
  if (role === "comercial") return "/comercial";
  return "/admin/home";
}

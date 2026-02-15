import type { Session } from "next-auth";

export function getServerAuthToken(session: Session | null): string {
  if (!session?.user?.accessToken) {
    throw new Error("No hay sesión autenticada. No se puede realizar la operación.");
  }
  return session.user.accessToken;
}

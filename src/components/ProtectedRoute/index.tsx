"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { buildLoginUrl } from "@/configs/authConfig";

/**
 * Protección genérica por rol: redirige a login si no autenticado o a /unauthorized
 * si el rol del usuario no está en allowedRoles.
 *
 * Actualmente no está usado por ninguna ruta: /admin usa AdminRouteProtection
 * (que además restringe rutas para operario). Usar este componente en layouts
 * o páginas que necesiten restricción por allowedRoles sin la lógica de operario.
 */
interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "authenticated") {
      const rawRole = session?.user?.role;
      const userRole = Array.isArray(rawRole) ? rawRole[0] : rawRole;
      const hasAccess = userRole && allowedRoles?.includes(userRole);
      if (!hasAccess) {
        router.push("/unauthorized");
      }
    }

    if (status === "unauthenticated") {
      router.push(buildLoginUrl(pathname || ""));
    }
  }, [session, status, allowedRoles, router, pathname]);

  if (status === "loading") {
    return <div>Cargando...</div>;
  }

  return <>{children}</>;
}

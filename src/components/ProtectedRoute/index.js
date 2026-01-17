"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      // Normalizar roles del usuario a array
      const userRoles = Array.isArray(session.user.role) ? session.user.role : (session.user.role ? [session.user.role] : []);
      // Verificar si al menos uno de los roles del usuario está permitido
      const hasAccess = userRoles.some((role) => allowedRoles.includes(role));
      
      if (!hasAccess) {
        router.push("/unauthorized"); // Página de acceso denegado
      }
    }

    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [session, status, allowedRoles, router]);

  if (status === "loading") {
    return <div>Cargando...</div>; // O un loader personalizado
  }

  return children;
}

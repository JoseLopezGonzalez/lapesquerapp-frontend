"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      const userRole = session?.user?.role;
      const hasAccess = userRole && allowedRoles?.includes(userRole);
      if (!hasAccess) {
        router.push("/unauthorized");
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

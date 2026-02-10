"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { buildLoginUrl } from "@/configs/authConfig";

export default function ProtectedRoute({ children, allowedRoles }) {
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
    return <div>Cargando...</div>; // O un loader personalizado
  }

  return children;
}

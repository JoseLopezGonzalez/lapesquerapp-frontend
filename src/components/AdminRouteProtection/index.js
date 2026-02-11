"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useIsLoggingOut } from "@/hooks/useIsLoggingOut";
import { LogoutDialog } from "@/components/Utilities/LogoutDialog";
import Loader from "@/components/Utilities/Loader";

const OPERARIO_ALLOWED_PATHS = [
  "/admin/home",
  "/admin/raw-material-receptions",
  "/admin/cebo-dispatches",
  "/admin/orquestador",
  "/admin/stores-manager",
  "/admin/nfc-punch-manager",
];

function isOperarioAllowedPath(pathname) {
  if (!pathname) return false;
  return OPERARIO_ALLOWED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function AdminRouteProtection({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isLoggingOut = useIsLoggingOut();

  // Operario (rol de nivel): solo puede permanecer en rutas permitidas (home, orquestador, stores-manager, etc.)
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const rawRole = session.user.role;
      const userRole = Array.isArray(rawRole) ? rawRole[0] : rawRole;
      if (userRole === "operario" && !isOperarioAllowedPath(pathname)) {
        router.replace("/admin/home");
      }
    }
  }, [status, session, pathname, router]);

  if (isLoggingOut) {
    return <LogoutDialog open={true} />;
  }

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  const role = session?.user?.role != null ? (Array.isArray(session.user.role) ? session.user.role[0] : session.user.role) : null;
  if (status === "authenticated" && role === "operario" && !isOperarioAllowedPath(pathname)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  return children;
}

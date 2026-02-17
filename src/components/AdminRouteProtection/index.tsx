"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useIsLoggingOut } from "@/hooks/useIsLoggingOut";
import { LogoutDialog } from "@/components/Utilities/LogoutDialog";
import Loader from "@/components/Utilities/Loader";

/** El operario tiene su propio segmento /operator; si llega a /admin se redirige. */
const OPERATOR_DASHBOARD = "/operator";

interface AdminRouteProtectionProps {
  children: ReactNode;
}

export default function AdminRouteProtection({ children }: AdminRouteProtectionProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isLoggingOut = useIsLoggingOut();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const rawRole = session.user.role;
      const userRole = Array.isArray(rawRole) ? rawRole[0] : rawRole;
      if (userRole === "operario") {
        router.replace(OPERATOR_DASHBOARD);
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
  if (status === "authenticated" && role === "operario") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
}

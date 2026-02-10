"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useIsLoggingOut } from "@/hooks/useIsLoggingOut";
import { LogoutDialog } from "@/components/Utilities/LogoutDialog";
import Loader from "@/components/Utilities/Loader";

export default function AdminRouteProtection({ children }) {
  // ✅ CRÍTICO: Todos los hooks DEBEN ejecutarse ANTES de cualquier return condicional
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoggingOut = useIsLoggingOut();

  // ✅ Todos los useEffect también deben estar antes de cualquier return
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const userRole = session.user.role;
      // Si es operario, redirigir a su almacén asignado
      if (userRole === "operario" && session.user.assignedStoreId) {
        router.replace(`/warehouse/${session.user.assignedStoreId}`);
        return;
      }
    }
  }, [status, session, router]);

  // ✅ AHORA SÍ: Después de todos los hooks, podemos hacer returns condicionales
  // Si hay logout en curso, mostrar solo el diálogo
  if (isLoggingOut) {
    return <LogoutDialog open={true} />;
  }

  // ✅ Verificar logout también en estados de loading
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  // Si es operario, mostrar loader mientras redirige
  if (status === "authenticated" && session?.user?.role === "operario") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  // Para otros usuarios, mostrar el contenido normal
  return children;
}

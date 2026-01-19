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
      // Normalizar roles del usuario a array
      const userRoles = Array.isArray(session.user.role) ? session.user.role : (session.user.role ? [session.user.role] : []);
      // Si es store_operator, redirigir a su almacén asignado
      if (userRoles.includes("store_operator") && session.user.assignedStoreId) {
        // console.log("🚫 Store_operator intentando acceder a admin, redirigiendo a:", `/warehouse/${session.user.assignedStoreId}`);
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

  // Si es store_operator, mostrar loader mientras redirige
  if (status === "authenticated" && session?.user) {
    const userRoles = Array.isArray(session.user.role) ? session.user.role : (session.user.role ? [session.user.role] : []);
    if (userRoles.includes("store_operator")) {
      return (
        <div className="flex justify-center items-center h-screen">
          <Loader />
        </div>
      );
    }
  }

  // Para otros usuarios, mostrar el contenido normal
  return children;
}

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loader from "@/components/Utilities/Loader";

export default function AdminRouteProtection({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Si es store_operator, redirigir a su almacén asignado
      if (session.user.role === "store_operator" && session.user.assignedStoreId) {
        console.log("🚫 Store_operator intentando acceder a admin, redirigiendo a:", `/warehouse/${session.user.assignedStoreId}`);
        router.replace(`/warehouse/${session.user.assignedStoreId}`);
        return;
      }
    }
  }, [status, session, router]);

  // Mostrar loader mientras se procesa la redirección
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  // Si es store_operator, mostrar loader mientras redirige
  if (status === "authenticated" && session.user.role === "store_operator") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  // Para otros usuarios, mostrar el contenido normal
  return children;
}

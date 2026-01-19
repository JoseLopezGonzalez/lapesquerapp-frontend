"use client";

import { useIsLoggingOut } from "@/hooks/useIsLoggingOut";
import { LogoutDialog } from "@/components/Utilities/LogoutDialog";
import Loader from "@/components/Utilities/Loader";

/**
 * Wrapper que verifica logout antes de mostrar loaders
 * Útil para archivos loading.js de Next.js y otros componentes que muestran loaders
 * 
 * @param {React.ReactNode} children - Contenido opcional a mostrar si no hay logout
 * @returns {React.ReactNode} LogoutDialog si hay logout, children o Loader si no
 */
export function LogoutAwareLoader({ children = null }) {
  const isLoggingOut = useIsLoggingOut();
  
  // ✅ Si hay logout en curso, mostrar solo el diálogo
  if (isLoggingOut) {
    return <LogoutDialog open={true} />;
  }
  
  // Si hay children personalizados, mostrarlos
  if (children) {
    return <>{children}</>;
  }
  
  // Por defecto, mostrar el Loader estándar
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader />
    </div>
  );
}


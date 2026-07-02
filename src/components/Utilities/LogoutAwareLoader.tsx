'use client';

import type { ReactNode } from 'react';
import { useIsLoggingOut } from '@/hooks/useIsLoggingOut';
import { LogoutDialog } from '@/components/Utilities/LogoutDialog';
import Loader from '@/components/Utilities/Loader';

interface LogoutAwareLoaderProps {
  children?: ReactNode;
}

/**
 * Wrapper que verifica logout antes de mostrar loaders
 * Útil para archivos loading.js de Next.js y otros componentes que muestran loaders
 */
export function LogoutAwareLoader({ children = null }: LogoutAwareLoaderProps) {
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
    <div className="flex h-screen items-center justify-center">
      <Loader />
    </div>
  );
}

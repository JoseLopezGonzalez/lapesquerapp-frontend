'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { isTollClient } from '@/lib/auth/actor';
import { ExternalPageShell } from '@/components/External/ExternalPageShell';
import Loader from '@/components/Utilities/Loader';

/**
 * Guard de actor para el portal de maquila: solo un ExternalUser con tollClientId puede ver
 * estas rutas. Un ExternalUser genérico (sin tollClientId) que navegue aquí a mano se redirige
 * a su experiencia reducida (/external/stores-manager) — el backend ya es fail-closed en cada
 * endpoint /maquila/* (403), esto es solo para no dejarle una pantalla rota/vacía en la UI.
 * Nota: el guard "duro" de nivel ruta vive en src/middleware.ts (archivo protegido, pendiente
 * de un ajuste puntual — ver conversación con Jose) — este guard de cliente es la capa de
 * defensa disponible hoy sin tocar ese archivo.
 */
export default function MaquilaPortalLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && !isTollClient(session?.user)) {
      router.replace('/external/stores-manager');
    }
  }, [status, session, router]);

  if (status === 'loading' || (status === 'authenticated' && !isTollClient(session?.user))) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  return <ExternalPageShell>{children}</ExternalPageShell>;
}

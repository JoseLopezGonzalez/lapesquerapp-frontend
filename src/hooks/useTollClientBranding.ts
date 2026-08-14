'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { tollClientBrandingKeys } from '@/lib/routes/queryKeys';
import { getTollClientBranding } from '@/services/domain/tollClients/tollClientBrandingService';

/**
 * Branding del cliente de maquila para la pantalla de login (`/portal/{slug}`), previo a
 * autenticar. `data === null` cuando el slug no existe o el cliente está inactivo (404) —
 * el consumidor debe caer al branding genérico del tenant, nunca mostrar un error.
 */
export function useTollClientBranding(slug: string | null | undefined) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error } = useQuery({
    queryKey: tollClientBrandingKeys.bySlug(tenantId, slug ?? ''),
    queryFn: () => getTollClientBranding(slug as string),
    enabled: !!tenantId && !!slug,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}

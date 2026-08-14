'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { maquilaOrderKeys } from '@/lib/routes/queryKeys';
import { transportService } from '@/services/domain/transports/transportService';

/**
 * Opciones de transporte para el formulario de pedido — único catálogo que el whitelist
 * de creación/edición acepta (`transport: {id}`). No reutiliza useOrderFormOptions (admin):
 * ese hook trae también salespeople/fieldOperators/incoterms/paymentTerms/externalProcessors/
 * customers, ninguno aplicable al portal.
 */
export function useMaquilaOrderTransportOptions() {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error } = useQuery({
    queryKey: maquilaOrderKeys.transportOptions(tenantId),
    queryFn: () => transportService.getOptions(),
    enabled: !!tenantId,
    staleTime: 10 * 60 * 1000,
  });

  return {
    options: data ?? [],
    isLoading,
    error: error?.message ?? null,
  };
}

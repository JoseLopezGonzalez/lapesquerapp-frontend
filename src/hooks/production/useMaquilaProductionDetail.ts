'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { maquilaProductionKeys } from '@/lib/routes/queryKeys';
import { maquilaProductionService } from '@/services/domain/productions/maquilaProductionService';
import type { Production } from '@/types/production';

/**
 * Detalle + trazabilidad de una producción propia — 2 queries independientes para carga
 * progresiva (mismo patrón que useProductionDetail interno). Ver docs/maquila/frontend/03-producciones.md.
 */
export function useMaquilaProductionDetail(productionId: number | string | null | undefined) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const enabled = !!tenantId && productionId != null;

  const productionQuery = useQuery({
    queryKey: maquilaProductionKeys.detail(tenantId, productionId),
    queryFn: () => maquilaProductionService.getById(productionId as number | string),
    enabled,
    staleTime: 60 * 1000,
  });

  const traceabilityQuery = useQuery({
    queryKey: maquilaProductionKeys.traceability(tenantId, productionId),
    queryFn: () => maquilaProductionService.getTraceability(productionId as number | string),
    enabled,
    staleTime: 0,
  });

  return {
    production: (productionQuery.data ?? null) as Production | null,
    processTree: traceabilityQuery.data ?? null,
    isLoading: productionQuery.isLoading,
    traceabilityLoading: traceabilityQuery.isLoading,
    error: productionQuery.error?.message ?? null,
    refetch: () => {
      productionQuery.refetch();
      traceabilityQuery.refetch();
    },
  };
}

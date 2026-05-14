'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { productionQueryKeys } from '@/lib/routes/queryKeys';
import {
  getProduction,
  getProductionProcessTree,
  getProductionTotals,
} from '@/services/productionService';
import type { Production, ProductionTotals } from '@/types/production';

export interface UseProductionDetailResult {
  production: Production | null;
  processTree: unknown;
  totals: ProductionTotals | null;
  isLoading: boolean;
  totalsLoading: boolean;
  processTreeLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseProductionDetailOptions {
  enableProcessTree?: boolean;
  processTreeFilter?: {
    customerId?: string | number | null;
    orderId?: string | number | null;
  };
}

/**
 * Hook para detalle de una producción: production, processTree y totals.
 * 3 queries independientes para carga progresiva.
 * React Query, tenant-aware. Sustituye useEffect + loadProductionData en ProductionView.
 */
export function useProductionDetail(
  productionId: string | number | null,
  options?: UseProductionDetailOptions
): UseProductionDetailResult {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const enableProcessTree = options?.enableProcessTree ?? true;
  const rawProcessTreeFilter = options?.processTreeFilter ?? {};
  const processTreeFilter: { customerId?: string | number; orderId?: string | number } =
    rawProcessTreeFilter.customerId != null && rawProcessTreeFilter.customerId !== ''
      ? { customerId: rawProcessTreeFilter.customerId }
      : rawProcessTreeFilter.orderId != null && rawProcessTreeFilter.orderId !== ''
        ? { orderId: rawProcessTreeFilter.orderId }
        : {};
  const isEnabled = !!token && !!tenantId && productionId != null && productionId !== '';

  const productionQuery = useQuery({
    queryKey: productionQueryKeys.detail(tenantId, productionId),
    queryFn: () => {
      if (!token || productionId == null) throw new Error('Missing token or productionId');
      return getProduction(productionId, token);
    },
    enabled: isEnabled,
    staleTime: 2 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  const totalsQuery = useQuery({
    queryKey: productionQueryKeys.totals(tenantId, productionId),
    queryFn: () => getProductionTotals(productionId!, token!).catch(() => null),
    enabled: isEnabled,
    staleTime: 2 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  const processTreeQuery = useQuery({
    queryKey: productionQueryKeys.processTree(tenantId, productionId, processTreeFilter),
    queryFn: () =>
      getProductionProcessTree(productionId!, token!, processTreeFilter).catch((err) => {
        console.error('Error al cargar processTree:', err);
        if (err?.message?.includes?.('500')) {
          console.error('Error 500 del backend - posible problema con formato de fechas en nodos');
        }
        return null;
      }),
    enabled: isEnabled && enableProcessTree,
    // El árbol se muestra “a demanda” (tab Diagrama). Si volvemos desde otras pantallas,
    // queremos evitar que se reutilice un tree aún “fresh” pero desactualizado.
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  return {
    production: (productionQuery.data ?? null) as Production | null,
    processTree: processTreeQuery.data ?? null,
    totals: (totalsQuery.data ?? null) as ProductionTotals | null,
    isLoading: productionQuery.isLoading,
    totalsLoading: totalsQuery.isLoading,
    processTreeLoading: processTreeQuery.isLoading,
    error: productionQuery.error?.message ?? null,
    refetch: () => {
      productionQuery.refetch();
      totalsQuery.refetch();
      processTreeQuery.refetch();
    },
  };
}

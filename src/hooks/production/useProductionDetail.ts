'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
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
  error: string | null;
  refetch: () => void;
}

/**
 * Hook para detalle de una producción: production, processTree y totals.
 * React Query, tenant-aware. Sustituye useEffect + loadProductionData en ProductionView.
 */
export function useProductionDetail(productionId: string | number | null): UseProductionDetailResult {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['productions', 'detail', tenantId ?? 'unknown', productionId],
    queryFn: async () => {
      if (!token || productionId == null) throw new Error('Missing token or productionId');
      const [productionData, treeData, totalsData] = await Promise.all([
        getProduction(productionId, token),
        getProductionProcessTree(productionId, token).catch((err) => {
          console.error('Error al cargar processTree:', err);
          if (err?.message?.includes?.('500')) {
            console.error('Error 500 del backend - posible problema con formato de fechas en nodos');
          }
          return null;
        }),
        getProductionTotals(productionId, token).catch(() => null),
      ]);
      return {
        production: productionData as Production,
        processTree: treeData,
        totals: totalsData as ProductionTotals | null,
      };
    },
    enabled: !!token && !!tenantId && productionId != null && productionId !== '',
  });

  return {
    production: data?.production ?? null,
    processTree: data?.processTree ?? null,
    totals: data?.totals ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

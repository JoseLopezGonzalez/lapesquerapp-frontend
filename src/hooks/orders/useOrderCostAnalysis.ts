'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrderCostAnalysis } from '@/services/orderService';
import type { OrderCostAnalysisResponse } from '@/services/orderService';
import { orderCostAnalysisKeys } from '@/lib/routes/queryKeys';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';

interface UseOrderCostAnalysisParams {
  orderId: number | string | null | undefined;
  activeTab: string;
  enabled?: boolean;
}

export interface UseOrderCostAnalysisResult {
  costAnalysis: OrderCostAnalysisResponse | null;
  costAnalysisLoading: boolean;
  costAnalysisError: unknown;
  loadCostAnalysis: (options?: { force?: boolean }) => Promise<OrderCostAnalysisResponse | null>;
  resetCostAnalysis: () => void;
}

export function useOrderCostAnalysis({
  orderId,
  activeTab,
  enabled = true,
}: UseOrderCostAnalysisParams): UseOrderCostAnalysisResult {
  const queryClient = useQueryClient();
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const queryKey = useMemo(
    () => orderCostAnalysisKeys.detail(tenantId, orderId),
    [tenantId, orderId]
  );

  const resetCostAnalysis = useCallback(() => {
    queryClient.removeQueries({ queryKey });
  }, [queryClient, queryKey]);

  const query = useQuery({
    queryKey,
    queryFn: () => getOrderCostAnalysis(orderId as number | string),
    enabled: Boolean(enabled && tenantId && orderId && activeTab === 'analysis'),
    staleTime: 60 * 1000,
    select: (response): OrderCostAnalysisResponse | null =>
      response
        ? {
            ...response,
            byProductLine: [...(response.byProductLine || [])].sort(
              (a, b) => (Number(b?.lineRevenue) || 0) - (Number(a?.lineRevenue) || 0)
            ),
            byPallet: [...(response.byPallet || [])].sort(
              (a, b) => (Number(b?.totalCost) || 0) - (Number(a?.totalCost) || 0)
            ),
          }
        : null,
  });

  const loadCostAnalysis = useCallback(
    async ({ force = false } = {}): Promise<OrderCostAnalysisResponse | null> => {
      if (!enabled) return null;
      if (!orderId) return null;
      if (!force && query.data) {
        return query.data;
      }

      const result = await query.refetch();
      if (result.error) throw result.error;
      return result.data ?? null;
    },
    [enabled, orderId, query]
  );

  return {
    costAnalysis: query.data ?? null,
    costAnalysisLoading: query.isFetching,
    costAnalysisError: query.error,
    loadCostAnalysis,
    resetCostAnalysis,
  };
}

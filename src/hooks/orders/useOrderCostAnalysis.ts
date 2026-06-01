'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getOrderCostAnalysis } from '@/services/orderService';
import type { OrderCostAnalysisResponse } from '@/services/orderService';

interface UseOrderCostAnalysisParams {
  orderId: number | string | null | undefined;
  accessToken: string | null | undefined;
  activeTab: string;
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
  accessToken,
  activeTab,
}: UseOrderCostAnalysisParams): UseOrderCostAnalysisResult {
  const [costAnalysis, setCostAnalysis] = useState<OrderCostAnalysisResponse | null>(null);
  const [costAnalysisLoading, setCostAnalysisLoading] = useState(false);
  const [costAnalysisError, setCostAnalysisError] = useState<unknown>(null);
  const costAnalysisRequestedRef = useRef(false);
  const previousOrderIdRef = useRef<typeof orderId>(null);

  const resetCostAnalysis = useCallback(() => {
    setCostAnalysis(null);
    setCostAnalysisError(null);
    setCostAnalysisLoading(false);
    costAnalysisRequestedRef.current = false;
  }, []);

  useEffect(() => {
    if (previousOrderIdRef.current !== orderId) {
      resetCostAnalysis();
      previousOrderIdRef.current = orderId;
    }
  }, [orderId, resetCostAnalysis]);

  const loadCostAnalysis = useCallback(
    async ({ force = false } = {}): Promise<OrderCostAnalysisResponse | null> => {
      if (!orderId || !accessToken) return null;
      if (costAnalysisLoading) return costAnalysis;
      if (!force && (costAnalysisRequestedRef.current || costAnalysis)) {
        return costAnalysis;
      }

      setCostAnalysisLoading(true);
      setCostAnalysisError(null);

      try {
        const response = await getOrderCostAnalysis(orderId, accessToken);
        const normalizedResponse = response
          ? {
              ...response,
              byProductLine: [...(response.byProductLine || [])].sort(
                (a, b) => (Number(b?.lineRevenue) || 0) - (Number(a?.lineRevenue) || 0)
              ),
              byPallet: [...(response.byPallet || [])].sort(
                (a, b) => (Number(b?.totalCost) || 0) - (Number(a?.totalCost) || 0)
              ),
            }
          : null;

        setCostAnalysis(normalizedResponse);
        costAnalysisRequestedRef.current = true;
        return normalizedResponse;
      } catch (err) {
        setCostAnalysisError(err);
        throw err;
      } finally {
        setCostAnalysisLoading(false);
      }
    },
    [accessToken, costAnalysis, costAnalysisLoading, orderId]
  );

  useEffect(() => {
    if (activeTab !== 'analysis') return;
    if (!accessToken || !orderId) return;
    if (costAnalysisRequestedRef.current || costAnalysisLoading) return;

    loadCostAnalysis().catch(() => {});
  }, [activeTab, accessToken, orderId, costAnalysisLoading, loadCostAnalysis]);

  return {
    costAnalysis,
    costAnalysisLoading,
    costAnalysisError,
    loadCostAnalysis,
    resetCostAnalysis,
  };
}

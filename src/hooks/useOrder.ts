'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getOrder, updateOrder, setOrderStatus } from '@/services/orderService';
import type { Order, OrderStatus } from '@/services/orderService';
import { useOrderCostAnalysis } from './orders/useOrderCostAnalysis';
import { useOrderOptions } from './orders/useOrderOptions';
import { useOrderIncidents } from './orders/useOrderIncidents';
import { useOrderPlannedDetails } from './orders/useOrderPlannedDetails';
import { useOrderAuxiliaryLines } from './orders/useOrderAuxiliaryLines';
import { useOrderPallets } from './orders/useOrderPallets';
import { useOrderDocuments } from './orders/useOrderDocuments';
import { useAuxiliaryProductOptions } from './useAuxiliaryProductOptions';
import { orderKeys } from '@/lib/routes/queryKeys';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';

const PRODUCTION_TOLERANCE_PERCENTAGE = 0.03;
const MIN_PRODUCTION_TOLERANCE_KG = 10;
const MAX_PRODUCTION_TOLERANCE_KG = 75;

export interface NormalizedOrderPallet {
  id: number | string;
  receptionId: number | string | null;
  costPerKg: number | null;
  totalCost: number | null;
  [key: string]: unknown;
}

export type MergedOrderProductStatus = 'success' | 'difference' | 'pending' | 'noPlanned';

export interface MergedOrderProductDetail {
  product: Record<string, unknown>;
  plannedQuantity: number;
  plannedBoxes: number;
  productionQuantity: number;
  productionBoxes: number;
  quantityDifference: number;
  boxesDifference?: number;
  status: MergedOrderProductStatus;
}

const normalizeOrderPallet = (pallet: Record<string, unknown>): NormalizedOrderPallet => {
  return {
    ...pallet,
    id: pallet.id as number | string,
    receptionId: (pallet.receptionId ?? pallet.reception_id ?? null) as number | string | null,
    costPerKg: (pallet.costPerKg ?? pallet.cost_per_kg ?? null) as number | null,
    totalCost: (pallet.totalCost ?? pallet.total_cost ?? null) as number | null,
  };
};

export const calculateProductionQuantityToleranceKg = (plannedQuantity: number): number => {
  if (!Number.isFinite(plannedQuantity) || plannedQuantity <= 0) return 0;

  // Regla de negocio confirmada: tolerancia por linea = min(max(10 kg, kg planificados * 3%), 75 kg).
  return Math.min(
    Math.max(MIN_PRODUCTION_TOLERANCE_KG, plannedQuantity * PRODUCTION_TOLERANCE_PERCENTAGE),
    MAX_PRODUCTION_TOLERANCE_KG
  );
};

const mergeOrderDetails = (
  plannedProductDetails: unknown[] | undefined,
  productionProductDetails: unknown[] | undefined
): MergedOrderProductDetail[] => {
  const resultMap = new Map<number | string, MergedOrderProductDetail>();

  (plannedProductDetails as Array<Record<string, unknown>> | undefined)?.forEach((detail) => {
    const product = detail?.product as Record<string, unknown> | undefined;
    if (!product?.id) return;
    resultMap.set(product.id as number | string, {
      product,
      plannedQuantity: parseFloat(String(detail.quantity)),
      plannedBoxes: parseFloat(String(detail.boxes)),
      productionQuantity: 0.0,
      productionBoxes: 0.0,
      quantityDifference: parseFloat(String(detail.quantity)) * -1,
      status: 'pending',
    });
  });

  (productionProductDetails as Array<Record<string, unknown>> | undefined)?.forEach(
    (production) => {
      const product = production?.product as Record<string, unknown> | undefined;
      if (!product?.id) return;
      const existing = resultMap.get(product.id as number | string);
      if (existing) {
        existing.productionQuantity =
          (existing.productionQuantity as number) + parseFloat(String(production.netWeight));
        existing.productionBoxes =
          (existing.productionBoxes as number) + parseFloat(String(production.boxes));
        existing.quantityDifference =
          Number(existing.plannedQuantity) - Number(existing.productionQuantity);
        existing.boxesDifference =
          (existing.plannedBoxes as number) - (existing.productionBoxes as number);
        const diff = existing.quantityDifference as number;
        const toleranceKg = calculateProductionQuantityToleranceKg(
          Number(existing.plannedQuantity)
        );
        existing.status =
          diff === 0 ? 'success' : Math.abs(diff) <= toleranceKg ? 'difference' : 'pending';
      } else {
        resultMap.set(product.id as number | string, {
          product,
          plannedQuantity: 0.0,
          plannedBoxes: 0.0,
          productionQuantity: parseFloat(String(production.netWeight)),
          productionBoxes: parseFloat(String(production.boxes)),
          quantityDifference: parseFloat(String(production.netWeight)),
          boxesDifference: parseFloat(String(production.boxes)),
          status: 'noPlanned',
        });
      }
    }
  );

  return Array.from(resultMap.values());
};

export function useOrder(
  orderId: number | string | null | undefined,
  onChange?: (order: Order) => void,
  options: { canViewCostData?: boolean } = {}
) {
  const { canViewCostData = true } = options;
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const accessToken = session?.user?.accessToken;
  const [mutationError, setMutationError] = useState<unknown>(null);
  const [activeTab, setActiveTab] = useState('details');
  const previousOrderIdRef = useRef<typeof orderId>(null);

  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const queryKey = useMemo(() => orderKeys.detail(tenantId, orderId), [tenantId, orderId]);

  const {
    data: order = null,
    isLoading: loading,
    error: queryError,
    refetch: queryRefetch,
  } = useQuery({
    queryKey,
    queryFn: () => getOrder(orderId as unknown as string),
    enabled: !!tenantId && !!orderId,
  });

  const error = queryError ?? mutationError;

  const updateOrderCache = useCallback(
    (updatedOrder: Order) => {
      if (!updatedOrder) return;
      queryClient.setQueryData(queryKey, updatedOrder);
      onChange?.(updatedOrder);
    },
    [queryClient, queryKey, onChange]
  );

  // Reset tab when orderId changes
  useRef(null); // kept for ref ordering consistency
  if (previousOrderIdRef.current !== orderId) {
    setActiveTab('details');
    previousOrderIdRef.current = orderId;
  }

  const {
    costAnalysis: costAnalysisData,
    costAnalysisLoading,
    costAnalysisError,
    loadCostAnalysis,
    resetCostAnalysis,
  } = useOrderCostAnalysis({ orderId, activeTab, enabled: canViewCostData });

  const reload = useCallback(async (): Promise<Order | null> => {
    try {
      const result = await queryRefetch();
      resetCostAnalysis();
      return (result?.data ?? result) as Order | null;
    } catch (err) {
      setMutationError(err);
      return null;
    }
  }, [queryRefetch, resetCostAnalysis]);

  const { productOptions, taxOptions, optionsLoading, loadOptions } = useOrderOptions({
    activeTab,
    onError: setMutationError,
  });

  const pallets = useMemo(
    () => ((order?.pallets as Array<Record<string, unknown>>) || []).map(normalizeOrderPallet),
    [order?.pallets]
  );

  const mergedProductDetails = useMemo(
    () =>
      order
        ? mergeOrderDetails(
            order.plannedProductDetails as unknown[],
            order.productionProductDetails as unknown[]
          )
        : [],
    [order]
  );

  const updateOrderData = async (updateData: Record<string, unknown>) => {
    return updateOrder(orderId as unknown as string, updateData)
      .then((updated) => {
        if (updated) {
          updateOrderCache(updated);
          onChange?.(updated);
        }
        return updated;
      })
      .catch((err: unknown) => {
        setMutationError(err);
        throw err;
      });
  };

  const updateOrderStatus = async (statusValue: OrderStatus) => {
    return setOrderStatus(orderId as unknown as string, statusValue)
      .then((updated) => {
        updateOrderCache(updated as Order);
        return updated;
      })
      .catch((err: unknown) => {
        setMutationError(err);
        throw err;
      });
  };

  const updateTemperatureOrder = async (updatedTemperature: unknown) => {
    return updateOrder(orderId as unknown as string, { temperature: updatedTemperature })
      .then((updated) => {
        if (updated) updateOrderCache(updated);
        return updated;
      })
      .catch((err: unknown) => {
        setMutationError(err);
        throw err;
      });
  };

  const incidents = useOrderIncidents({
    order,
    onError: setMutationError,
  });

  const { plannedProductDetails, plannedProductDetailActions } = useOrderPlannedDetails({
    order,
    productOptions,
    taxOptions,
    onError: setMutationError,
  });

  const { auxiliaryLines, auxiliaryLineActions } = useOrderAuxiliaryLines({
    order,
    onOrderUpdate: updateOrderCache,
    onError: setMutationError,
  });

  const { options: auxiliaryProductOptions } = useAuxiliaryProductOptions({
    enabled: activeTab === 'auxiliary',
  });

  const palletHandlers = useOrderPallets({
    order,
    accessToken,
    onOrderUpdate: updateOrderCache,
    reload,
    onChange,
  });

  const { exportDocument, exportDocuments, fastExportDocuments, sendDocuments, hasMaquilador } =
    useOrderDocuments({
      order,
      session,
    });

  return {
    pallets,
    order,
    loading,
    error,
    updateOrderData,
    exportDocument,
    mergedProductDetails,
    options: { taxOptions, productOptions, loading: optionsLoading },
    plannedProductDetailActions,
    plannedProductDetails,
    auxiliaryLines,
    auxiliaryLineActions,
    auxiliaryProductOptions,
    sendDocuments,
    hasMaquilador,
    updateOrderStatus,
    exportDocuments,
    fastExportDocuments,
    activeTab,
    setActiveTab,
    reload,
    costAnalysis: costAnalysisData,
    costAnalysisLoading,
    costAnalysisError,
    loadCostAnalysis,
    updateTemperatureOrder,
    openOrderIncident: incidents.openOrderIncident,
    resolveOrderIncident: incidents.resolveOrderIncident,
    deleteOrderIncident: incidents.deleteOrderIncident,
    onEditingPallet: palletHandlers.onEditingPallet,
    onCreatingPallet: palletHandlers.onCreatingPallet,
    onDeletePallet: palletHandlers.onDeletePallet,
    onUnlinkPallet: palletHandlers.onUnlinkPallet,
    onLinkPallets: palletHandlers.onLinkPallets,
    onUnlinkAllPallets: palletHandlers.onUnlinkAllPallets,
    loadOptions,
  };
}

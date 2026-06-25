'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getOrder, updateOrder, setOrderStatus } from '@/services/orderService';
import type { Order } from '@/services/orderService';
import { useOrderCostAnalysis } from './orders/useOrderCostAnalysis';
import { useOrderOptions } from './orders/useOrderOptions';
import { useOrderIncidents } from './orders/useOrderIncidents';
import { useOrderPlannedDetails } from './orders/useOrderPlannedDetails';
import { useOrderPallets } from './orders/useOrderPallets';
import { useOrderDocuments } from './orders/useOrderDocuments';

const normalizeOrderPallet = (pallet: Record<string, unknown>) => {
  if (!pallet) return pallet;
  return {
    ...pallet,
    receptionId: pallet.receptionId ?? pallet.reception_id ?? null,
    costPerKg: pallet.costPerKg ?? pallet.cost_per_kg ?? null,
    totalCost: pallet.totalCost ?? pallet.total_cost ?? null,
  };
};

const mergeOrderDetails = (
  plannedProductDetails: unknown[] | undefined,
  productionProductDetails: unknown[] | undefined
) => {
  const resultMap = new Map<number | string, Record<string, unknown>>();

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
        existing.status =
          diff === 0 ? 'success' : diff <= 30 && diff >= -30 ? 'difference' : 'pending';
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
  onChange?: (order: Order) => void
) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const accessToken = session?.user?.accessToken;
  const [mutationError, setMutationError] = useState<unknown>(null);
  const [activeTab, setActiveTab] = useState('details');
  const previousOrderIdRef = useRef<typeof orderId>(null);

  const queryKey = ['order', orderId];

  const {
    data: order = null,
    isLoading: loading,
    error: queryError,
    refetch: queryRefetch,
  } = useQuery({
    queryKey,
    queryFn: () => getOrder(orderId as unknown as string, accessToken ?? ''),
    enabled: !!orderId && !!accessToken && status !== 'loading',
  });

  const error = queryError ?? mutationError;

  const updateOrderCache = useCallback(
    (updatedOrder: Order) => {
      if (!updatedOrder) return;
      queryClient.setQueryData(queryKey, updatedOrder);
      onChange?.(updatedOrder);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, JSON.stringify(queryKey), onChange]
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
  } = useOrderCostAnalysis({ orderId, accessToken, activeTab });

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
    accessToken,
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
    return updateOrder(orderId as unknown as string, updateData, accessToken ?? '')
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

  const updateOrderStatus = async (statusValue: number) => {
    return setOrderStatus(orderId as unknown as string, statusValue, accessToken ?? '')
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
    return updateOrder(
      orderId as unknown as string,
      { temperature: updatedTemperature },
      accessToken ?? ''
    )
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
    accessToken,
    onOrderUpdate: updateOrderCache,
    onError: setMutationError,
  });

  const { plannedProductDetails, plannedProductDetailActions } = useOrderPlannedDetails({
    order,
    accessToken,
    productOptions,
    taxOptions,
    onOrderUpdate: updateOrderCache,
    onError: setMutationError,
  });

  const palletHandlers = useOrderPallets({
    order,
    accessToken,
    onOrderUpdate: updateOrderCache,
    reload,
    onChange,
  });

  const { exportDocument, exportDocuments, fastExportDocuments, sendDocuments, hasMaquilador } = useOrderDocuments(
    {
      order,
      session,
    }
  );

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

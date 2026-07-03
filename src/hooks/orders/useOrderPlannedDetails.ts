'use client';

import { useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createOrderPlannedProductDetail,
  deleteOrderPlannedProductDetail,
  updateOrderPlannedProductDetail,
} from '@/services/orderService';
import type { Order } from '@/services/orderService';
import { orderKeys, orderCostAnalysisKeys } from '@/lib/routes/queryKeys';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';

export interface OrderSelectOption {
  value: number | string;
  label: string | number;
}

function warnInvalidTaxRate(value: unknown, reason: string) {
  if (process.env.NODE_ENV !== 'development') return;

  console.warn('[orders] Invalid planned detail tax rate ignored', { value, reason });
}

export function parseTaxRate(value: unknown): number | null {
  if (value == null || value === '') {
    warnInvalidTaxRate(value, 'missing');
    return null;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      warnInvalidTaxRate(value, 'not_finite');
      return null;
    }

    if (value < 0) {
      warnInvalidTaxRate(value, 'negative');
      return null;
    }

    return value;
  }

  const normalized = String(value).replace(',', '.');
  const match = normalized.match(/-?\d+(\.\d+)?/);
  const parsed = match ? Number(match[0]) : Number(normalized);

  if (!Number.isFinite(parsed)) {
    warnInvalidTaxRate(value, 'not_parseable');
    return null;
  }

  if (parsed < 0) {
    warnInvalidTaxRate(value, 'negative');
    return null;
  }

  return parsed;
}

function normalizePlannedProductDetail(
  detail: Record<string, unknown>,
  productOptions: OrderSelectOption[] = [],
  taxOptions: OrderSelectOption[] = [],
  fallbackDetail: Record<string, unknown> | null = null
): Record<string, unknown> {
  if (!detail || typeof detail !== 'object') return detail;

  const dp = detail?.product as Record<string, unknown> | undefined;
  const fp = fallbackDetail?.product as Record<string, unknown> | undefined;
  const productId = dp?.id ?? detail?.productId ?? fp?.id ?? fallbackDetail?.productId ?? null;
  const matchedProduct = productOptions.find((p) => String(p?.value) === String(productId));
  const productName = dp?.name ?? fp?.name ?? matchedProduct?.label ?? '';

  const dt = detail?.tax as Record<string, unknown> | undefined;
  const ft = fallbackDetail?.tax as Record<string, unknown> | undefined;
  const taxId = dt?.id ?? detail?.taxId ?? ft?.id ?? fallbackDetail?.taxId ?? null;
  const matchedTax = taxOptions.find((t) => Number(t?.value) === Number(taxId));
  const taxRateRaw = dt?.rate ?? ft?.rate ?? matchedTax?.label;
  const parsedTaxRate = parseTaxRate(taxRateRaw);

  return {
    ...detail,
    product: { id: productId, name: productName },
    tax: { id: taxId, rate: parsedTaxRate },
  };
}

interface UseOrderPlannedDetailsParams {
  order: Order | null;
  productOptions: OrderSelectOption[];
  taxOptions: OrderSelectOption[];
  onError?: (err: unknown) => void;
}

export interface UseOrderPlannedDetailsResult {
  plannedProductDetails: unknown[];
  plannedProductDetailActions: {
    update: (id: number | string, updateData: Record<string, unknown>) => Promise<void>;
    delete: (id: number | string) => Promise<void>;
    create: (detailData: Record<string, unknown>) => Promise<void>;
  };
}

export function useOrderPlannedDetails({
  order,
  productOptions,
  taxOptions,
  onError,
}: UseOrderPlannedDetailsParams): UseOrderPlannedDetailsResult {
  const queryClient = useQueryClient();
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const orderId = order?.id;
  const orderDetailKey = useMemo(() => orderKeys.detail(tenantId, orderId), [tenantId, orderId]);
  const costAnalysisKey = useMemo(
    () => orderCostAnalysisKeys.detail(tenantId, orderId),
    [tenantId, orderId]
  );

  // La previsión alimenta el análisis de costes — invalidarlo también para que
  // se recalcule solo, sin depender de un botón manual de recarga.
  const invalidateOrderDetail = useCallback(() => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: orderDetailKey }),
      queryClient.invalidateQueries({ queryKey: costAnalysisKey }),
    ]);
  }, [queryClient, orderDetailKey, costAnalysisKey]);

  const plannedProductDetails = useMemo(
    () =>
      order?.plannedProductDetails
        ? (order.plannedProductDetails as Array<Record<string, unknown>>).map((detail) =>
            normalizePlannedProductDetail(detail, productOptions, taxOptions)
          )
        : [],
    [order?.plannedProductDetails, productOptions, taxOptions]
  );

  const { mutateAsync: updatePlannedProductDetailMutation } = useMutation({
    mutationFn: ({
      id,
      updateData,
    }: {
      id: number | string;
      updateData: Record<string, unknown>;
    }) => updateOrderPlannedProductDetail(String(id), updateData),
    onSuccess: invalidateOrderDetail,
    onError: (err: unknown) => {
      onError?.(err);
    },
  });

  const { mutateAsync: deletePlannedProductDetailMutation } = useMutation({
    mutationFn: (id: number | string) => deleteOrderPlannedProductDetail(String(id)),
    onSuccess: invalidateOrderDetail,
    onError: (err: unknown) => {
      onError?.(err);
    },
  });

  const { mutateAsync: createPlannedProductDetailMutation } = useMutation({
    mutationFn: (detailData: Record<string, unknown>) =>
      createOrderPlannedProductDetail(detailData),
    onSuccess: invalidateOrderDetail,
    onError: (err: unknown) => {
      onError?.(err);
    },
  });

  const updatePlannedProductDetail = useCallback(
    async (id: number | string, updateData: Record<string, unknown>) => {
      await updatePlannedProductDetailMutation({ id, updateData });
    },
    [updatePlannedProductDetailMutation]
  );

  const deletePlannedProductDetail = useCallback(
    async (id: number | string) => {
      await deletePlannedProductDetailMutation(id);
    },
    [deletePlannedProductDetailMutation]
  );

  const createPlannedProductDetail = useCallback(
    async (detailData: Record<string, unknown>) => {
      await createPlannedProductDetailMutation(detailData);
    },
    [createPlannedProductDetailMutation]
  );

  return {
    plannedProductDetails,
    plannedProductDetailActions: {
      update: updatePlannedProductDetail,
      delete: deletePlannedProductDetail,
      create: createPlannedProductDetail,
    },
  };
}

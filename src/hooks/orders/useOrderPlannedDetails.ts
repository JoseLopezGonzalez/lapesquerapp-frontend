'use client';

import { useMemo, useCallback } from 'react';
import {
  createOrderPlannedProductDetail,
  deleteOrderPlannedProductDetail,
  updateOrderPlannedProductDetail,
} from '@/services/orderService';
import type { Order } from '@/services/orderService';

export interface OrderSelectOption {
  value: number | string;
  label: string | number;
}

function parseTaxRate(value: unknown): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;
  const normalized = String(value).replace(',', '.');
  const match = normalized.match(/-?\d+(\.\d+)?/);
  const parsed = match ? Number(match[0]) : Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
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
  const taxRateRaw = dt?.rate ?? ft?.rate ?? matchedTax?.label ?? 0;
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
  onOrderUpdate: (updatedOrder: Order) => void;
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
  onOrderUpdate,
  onError,
}: UseOrderPlannedDetailsParams): UseOrderPlannedDetailsResult {
  const plannedProductDetails = useMemo(
    () => (order?.plannedProductDetails ? [...(order.plannedProductDetails as unknown[])] : []),
    [order?.plannedProductDetails]
  );

  const updatePlannedProductDetail = useCallback(
    async (id: number | string, updateData: Record<string, unknown>) => {
      return updateOrderPlannedProductDetail(String(id), updateData)
        .then((updated) => {
          if (!order) return;
          const normalizedUpdated = normalizePlannedProductDetail(
            updated as Record<string, unknown>,
            productOptions,
            taxOptions,
            updateData
          );
          const updatedPlannedDetails = (
            order.plannedProductDetails as Array<Record<string, unknown>>
          ).map((d) =>
            d.id === normalizedUpdated.id
              ? normalizedUpdated
              : normalizePlannedProductDetail(d, productOptions, taxOptions)
          );
          onOrderUpdate({ ...order, plannedProductDetails: updatedPlannedDetails });
        })
        .catch((err: unknown) => {
          onError?.(err);
          throw err;
        });
    },
    [order, productOptions, taxOptions, onOrderUpdate, onError]
  );

  const deletePlannedProductDetail = useCallback(
    async (id: number | string) => {
      return deleteOrderPlannedProductDetail(String(id))
        .then(() => {
          if (!order) return;
          const filteredDetails = (
            order.plannedProductDetails as Array<{ id: number | string }>
          ).filter((d) => d.id !== id);
          onOrderUpdate({ ...order, plannedProductDetails: filteredDetails });
        })
        .catch((err: unknown) => {
          onError?.(err);
          throw err;
        });
    },
    [order, onOrderUpdate, onError]
  );

  const createPlannedProductDetail = useCallback(
    async (detailData: Record<string, unknown>) => {
      return createOrderPlannedProductDetail(detailData)
        .then((created) => {
          if (!order) return;
          const normalizedCreated = normalizePlannedProductDetail(
            created as Record<string, unknown>,
            productOptions,
            taxOptions,
            detailData
          );
          const normalizedExisting = (
            (order.plannedProductDetails as Array<Record<string, unknown>>) || []
          ).map((d) => normalizePlannedProductDetail(d, productOptions, taxOptions));
          onOrderUpdate({
            ...order,
            plannedProductDetails: [...normalizedExisting, normalizedCreated],
          });
        })
        .catch((err: unknown) => {
          onError?.(err);
          throw err;
        });
    },
    [order, productOptions, taxOptions, onOrderUpdate, onError]
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

'use client';

import { useCallback, useEffect } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getProductOptions } from '@/services/productService';
import { taxService } from '@/services/domain/taxes/taxService';
import { useOrdersManagerOptions } from '@/context/gestor-options/OrdersManagerOptionsContext';
import { productOptionKeys, taxOptionKeys } from '@/lib/routes/queryKeys';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';

interface OrdersManagerOptionsValue {
  productOptions?: Array<{ value: number | string; label: string | number }>;
  taxOptions?: Array<{ value: number | string; label: string | number }>;
  productsLoading?: boolean;
  taxOptionsLoading?: boolean;
}

export interface OrderSelectOption {
  value: number | string;
  label: string | number;
}

interface UseOrderOptionsParams {
  activeTab: string;
  onError?: (err: unknown) => void;
}

export interface UseOrderOptionsResult {
  productOptions: OrderSelectOption[];
  taxOptions: OrderSelectOption[];
  optionsLoading: boolean;
  loadOptions: () => Promise<void>;
}

export function useOrderOptions({
  activeTab,
  onError,
}: UseOrderOptionsParams): UseOrderOptionsResult {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const ordersManagerOptions = useOrdersManagerOptions() as OrdersManagerOptionsValue | null;
  const contextProductOptions = ordersManagerOptions?.productOptions ?? [];
  const contextTaxOptions = ordersManagerOptions?.taxOptions ?? [];
  const hasContextOptions = contextProductOptions.length > 0 && contextTaxOptions.length > 0;
  const shouldFetchFallback = Boolean(tenantId && activeTab === 'products' && !hasContextOptions);

  const [productsQuery, taxesQuery] = useQueries({
    queries: [
      {
        queryKey: productOptionKeys.options(tenantId),
        queryFn: async (): Promise<OrderSelectOption[]> => {
          const products = await getProductOptions();
          return (products || []).map((product) => ({ value: product.id, label: product.name }));
        },
        enabled: shouldFetchFallback,
        staleTime: 10 * 60 * 1000,
      },
      {
        queryKey: taxOptionKeys.options(tenantId),
        queryFn: async (): Promise<OrderSelectOption[]> => {
          const taxes = (await taxService.getOptions()) as Array<{
            value: number | string;
            label: string | number;
          }>;
          return (taxes || []).map((tax) => ({ value: tax.value, label: tax.label }));
        },
        enabled: shouldFetchFallback,
        staleTime: 10 * 60 * 1000,
      },
    ],
  });

  const productOptions = hasContextOptions
    ? (contextProductOptions as OrderSelectOption[])
    : (productsQuery.data ?? []);
  const taxOptions = hasContextOptions
    ? (contextTaxOptions as OrderSelectOption[])
    : (taxesQuery.data ?? []);
  const optionsLoading = hasContextOptions
    ? Boolean(ordersManagerOptions?.productsLoading || ordersManagerOptions?.taxOptionsLoading)
    : productsQuery.isLoading || taxesQuery.isLoading;

  const loadOptions = useCallback(async () => {
    if (hasContextOptions) return;
    const [productsResult, taxesResult] = await Promise.all([
      productsQuery.refetch(),
      taxesQuery.refetch(),
    ]);

    const error = productsResult.error ?? taxesResult.error;
    if (error) {
      onError?.(error);
    }
  }, [hasContextOptions, onError, productsQuery, taxesQuery]);

  useEffect(() => {
    const error = productsQuery.error ?? taxesQuery.error;
    if (error) onError?.(error);
  }, [onError, productsQuery.error, taxesQuery.error]);

  return { productOptions, taxOptions, optionsLoading, loadOptions };
}

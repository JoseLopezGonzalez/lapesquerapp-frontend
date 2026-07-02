'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getProductOptions } from '@/services/productService';
import { getTaxOptions } from '@/services/taxService';
import { useOrdersManagerOptions } from '@/context/gestor-options/OrdersManagerOptionsContext';

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
  const { data: session } = useSession();
  const accessToken = session?.user?.accessToken;
  const [productOptions, setProductOptions] = useState<OrderSelectOption[]>([]);
  const [taxOptions, setTaxOptions] = useState<OrderSelectOption[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const ordersManagerOptions = useOrdersManagerOptions() as OrdersManagerOptionsValue | null;

  /* eslint-disable react-hooks/exhaustive-deps -- subscribing to specific sub-properties of context intentionally */
  useEffect(() => {
    if (!ordersManagerOptions) return;
    if (
      (ordersManagerOptions.productOptions?.length ?? 0) > 0 &&
      (ordersManagerOptions.taxOptions?.length ?? 0) > 0
    ) {
      setProductOptions(ordersManagerOptions.productOptions as OrderSelectOption[]);
      setTaxOptions(ordersManagerOptions.taxOptions as OrderSelectOption[]);
      setOptionsLoaded(true);
      setOptionsLoading(false);
    } else if (ordersManagerOptions.productsLoading || ordersManagerOptions.taxOptionsLoading) {
      setOptionsLoading(true);
    }
  }, [
    ordersManagerOptions?.productOptions,
    ordersManagerOptions?.taxOptions,
    ordersManagerOptions?.productsLoading,
    ordersManagerOptions?.taxOptionsLoading,
  ]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const loadOptions = useCallback(async () => {
    if (optionsLoaded || !accessToken) return;
    setOptionsLoading(true);
    try {
      const [productsData, taxesData] = await Promise.all([
        getProductOptions(),
        (
          getTaxOptions as (
            token: string
          ) => Promise<Array<{ id: number | string; rate: number | string }>>
        )(accessToken),
      ]);
      setProductOptions(productsData.map((p) => ({ value: p.id, label: p.name })));
      setTaxOptions(taxesData.map((t) => ({ value: t.id, label: t.rate })));
      setOptionsLoaded(true);
    } catch (err) {
      onError?.(err);
    } finally {
      setOptionsLoading(false);
    }
  }, [accessToken, optionsLoaded, onError]);

  useEffect(() => {
    if (
      activeTab === 'products' &&
      !optionsLoaded &&
      accessToken &&
      !ordersManagerOptions?.productOptions?.length
    ) {
      loadOptions();
    }
  }, [
    activeTab,
    optionsLoaded,
    accessToken,
    loadOptions,
    ordersManagerOptions?.productOptions?.length,
  ]);

  useEffect(() => {
    if (optionsLoaded || !accessToken) return;
    if (ordersManagerOptions?.productsLoading || ordersManagerOptions?.taxOptionsLoading) return;
    const timeoutId = setTimeout(() => {
      if (!optionsLoaded && !ordersManagerOptions?.productOptions?.length) {
        loadOptions();
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    optionsLoaded,
    accessToken,
    loadOptions,
    ordersManagerOptions?.productOptions?.length,
    ordersManagerOptions?.productsLoading,
    ordersManagerOptions?.taxOptionsLoading,
  ]);

  return { productOptions, taxOptions, optionsLoading, loadOptions };
}

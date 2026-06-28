'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import {
  getTotalStockStats,
  getStockBySpeciesStats,
  getStockByProducts,
  type StockByProductItem,
} from '@/services/storeService';
import { storeQueryKeys } from '@/lib/routes/queryKeys';

export function useTotalStockStats() {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error } = useQuery({
    queryKey: storeQueryKeys.totalStock(tenantId),
    queryFn: () => getTotalStockStats(),
    enabled: !!tenantId,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}

export function useStockBySpeciesStats() {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error } = useQuery({
    queryKey: storeQueryKeys.stockBySpecies(tenantId),
    queryFn: () => getStockBySpeciesStats(),
    enabled: !!tenantId,
  });

  const stockData = Array.isArray(data) ? data : ((data as { data?: unknown[] })?.data ?? []);
  return {
    data: stockData,
    isLoading,
    error: error?.message ?? null,
  };
}

export function useStockByProductsStats() {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error } = useQuery({
    queryKey: storeQueryKeys.stockByProducts(tenantId),
    queryFn: () => getStockByProducts(),
    enabled: !!tenantId,
  });

  const stockData = Array.isArray(data)
    ? data
    : ((data as { data?: StockByProductItem[] })?.data ?? []);
  return {
    data: stockData,
    isLoading,
    error: error?.message ?? null,
  };
}

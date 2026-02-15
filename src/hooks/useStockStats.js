'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import {
  getTotalStockStats,
  getStockBySpeciesStats,
  getStockByProducts,
} from '@/services/storeService';

/**
 * Hook para obtener el stock total usando React Query.
 * @returns {Object} { data, isLoading, error }
 */
export function useTotalStockStats() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['stock', 'total', tenantId ?? 'unknown'],
    queryFn: () => getTotalStockStats(token),
    enabled: !!token && !!tenantId,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}

/**
 * Hook para obtener el stock por especies usando React Query.
 * @returns {Object} { data, isLoading, error }
 */
export function useStockBySpeciesStats() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['stock', 'by-species', tenantId ?? 'unknown'],
    queryFn: () => getStockBySpeciesStats(token),
    enabled: !!token && !!tenantId,
  });

  const stockData = Array.isArray(data) ? data : data?.data ?? [];
  return {
    data: stockData,
    isLoading,
    error: error?.message ?? null,
  };
}

/**
 * Hook para obtener el stock por productos usando React Query.
 * @returns {Object} { data, isLoading, error }
 */
export function useStockByProductsStats() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['stock', 'by-products', tenantId ?? 'unknown'],
    queryFn: () => getStockByProducts(token),
    enabled: !!token && !!tenantId,
  });

  const stockData = Array.isArray(data) ? data : data?.data ?? [];
  return {
    data: stockData,
    isLoading,
    error: error?.message ?? null,
  };
}

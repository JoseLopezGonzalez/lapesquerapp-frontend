'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import {
  getOrdersTotalNetWeightStats,
  getOrdersTotalAmountStats,
  getOrderRankingStats,
  getSalesBySalesperson,
} from '@/services/orderService';

function getYearToDateRange() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), 0, 1);
  const dateFrom = firstDay.toISOString().split('T')[0];
  const dateTo = today.toISOString().split('T')[0];
  return { dateFrom, dateTo };
}

/**
 * Hook para obtener la cantidad total vendida (kg) usando React Query.
 * Rango: 1 enero - hoy (año en curso).
 * @returns {Object} { data, isLoading, error }
 */
export function useOrdersTotalNetWeightStats() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const { dateFrom, dateTo } = getYearToDateRange();

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['orders', 'totalNetWeight', tenantId ?? 'unknown', dateFrom, dateTo],
    queryFn: () => getOrdersTotalNetWeightStats({ dateFrom, dateTo }, token),
    enabled: !!token && !!tenantId,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}

/**
 * Hook para obtener el importe total vendido usando React Query.
 * Rango: 1 enero - hoy (año en curso).
 * @returns {Object} { data, isLoading, error }
 */
export function useOrdersTotalAmountStats() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const { dateFrom, dateTo } = getYearToDateRange();

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['orders', 'totalAmount', tenantId ?? 'unknown', dateFrom, dateTo],
    queryFn: () => getOrdersTotalAmountStats({ dateFrom, dateTo }, token),
    enabled: !!token && !!tenantId,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}

function parseOrderRankingData(rawData) {
  if (Array.isArray(rawData)) return rawData;
  if (rawData && typeof rawData === 'object') {
    if (Array.isArray(rawData.data)) return rawData.data;
    if (Array.isArray(rawData.results)) return rawData.results;
  }
  return [];
}

/**
 * Hook para obtener el ranking de pedidos usando React Query.
 * @param {Object} params - { range, groupBy, valueType, speciesId }
 * @returns {Object} { data, fullData, isLoading, error }
 */
export function useOrderRankingStats({ range, groupBy, valueType, speciesId }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const dateFrom = range?.from?.toLocaleDateString?.('sv-SE') ?? null;
  const dateTo = range?.to?.toLocaleDateString?.('sv-SE') ?? null;

  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['orders', 'ranking', tenantId ?? 'unknown', dateFrom, dateTo, groupBy, valueType, speciesId],
    queryFn: () =>
      getOrderRankingStats(
        {
          groupBy,
          valueType,
          dateFrom,
          dateTo,
          speciesId: speciesId ?? 'all',
        },
        token
      ),
    enabled: !!token && !!tenantId && !!dateFrom && !!dateTo && !!groupBy && !!valueType,
  });

  const fullData = parseOrderRankingData(rawData);
  const data = fullData.slice(0, 5);

  return {
    data,
    fullData,
    isLoading,
    error: error?.message ?? null,
  };
}

const PIE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
];

/**
 * Hook para obtener ventas por comercial usando React Query.
 * @param {Object} range - { from, to }
 * @returns {Object} { data, isLoading, error }
 */
export function useSalesBySalesperson(range) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const dateFrom = range?.from?.toLocaleDateString?.('sv-SE') ?? null;
  const dateTo = range?.to?.toLocaleDateString?.('sv-SE') ?? null;

  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['orders', 'salesBySalesperson', tenantId ?? 'unknown', dateFrom, dateTo],
    queryFn: () => getSalesBySalesperson({ dateFrom, dateTo }, token),
    enabled: !!token && !!tenantId && !!dateFrom && !!dateTo,
  });

  const data = Array.isArray(rawData)
    ? rawData.map((item, index) => ({
        ...item,
        fill: PIE_COLORS[index % PIE_COLORS.length],
      }))
    : [];

  return {
    data,
    isLoading,
    error: error?.message ?? null,
  };
}

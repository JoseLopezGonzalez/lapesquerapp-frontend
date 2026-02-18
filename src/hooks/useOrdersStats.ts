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

interface OrderRankingItem {
  name: string;
  value: number;
  [key: string]: unknown;
}

function getYearToDateRange(): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), 0, 1);
  const dateFrom = firstDay.toISOString().split('T')[0] ?? '';
  const dateTo = today.toISOString().split('T')[0] ?? '';
  return { dateFrom, dateTo };
}

/**
 * Hook para obtener la cantidad total vendida (kg) usando React Query.
 * Rango: 1 enero - hoy (año en curso).
 */
export function useOrdersTotalNetWeightStats() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const { dateFrom, dateTo } = getYearToDateRange();

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', 'totalNetWeight', tenantId ?? 'unknown', dateFrom, dateTo],
    queryFn: () => getOrdersTotalNetWeightStats({ dateFrom, dateTo }, token as string),
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
 */
export function useOrdersTotalAmountStats() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const { dateFrom, dateTo } = getYearToDateRange();

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', 'totalAmount', tenantId ?? 'unknown', dateFrom, dateTo],
    queryFn: () => getOrdersTotalAmountStats({ dateFrom, dateTo }, token as string),
    enabled: !!token && !!tenantId,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}

function parseOrderRankingData(rawData: unknown): OrderRankingItem[] {
  if (Array.isArray(rawData)) return rawData as OrderRankingItem[];
  if (rawData && typeof rawData === 'object') {
    const obj = rawData as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as OrderRankingItem[];
    if (Array.isArray(obj.results)) return obj.results as OrderRankingItem[];
  }
  return [];
}

interface OrderRankingParams {
  range?: { from?: Date; to?: Date };
  groupBy?: string;
  valueType?: string;
  speciesId?: string;
}

/**
 * Hook para obtener el ranking de pedidos usando React Query.
 */
export function useOrderRankingStats(params: OrderRankingParams) {
  const { range, groupBy, valueType, speciesId } = params;
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const dateFrom = range?.from?.toLocaleDateString?.('sv-SE') ?? null;
  const dateTo = range?.to?.toLocaleDateString?.('sv-SE') ?? null;

  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['orders', 'ranking', tenantId ?? 'unknown', dateFrom, dateTo, groupBy, valueType, speciesId],
    queryFn: () =>
      getOrderRankingStats(
        {
          groupBy: groupBy ?? 'client',
          valueType: valueType ?? 'totalAmount',
          dateFrom: dateFrom!,
          dateTo: dateTo!,
          speciesId: speciesId ?? 'all',
        },
        token as string
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

interface SalesBySalespersonItem {
  name?: string;
  value?: number;
  fill?: string;
  [key: string]: unknown;
}

interface SalesBySalespersonParams {
  range?: { from?: Date; to?: Date };
}

function parseSalesBySalespersonResponse(raw: unknown): SalesBySalespersonItem[] {
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as { data: unknown[] }).data)
      ? (raw as { data: unknown[] }).data
      : [];
  return arr.map((item: Record<string, unknown>, index: number) => ({
    ...item,
    name: (item.salesperson_name ?? item.name) as string,
    quantity: Number(item.total_weight ?? item.quantity ?? item.value ?? 0),
    fill: PIE_COLORS[index % PIE_COLORS.length],
  }));
}

/**
 * Hook para obtener ventas por comercial usando React Query.
 */
export function useSalesBySalesperson(params: SalesBySalespersonParams) {
  const { range } = params ?? {};
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const yearToDate = getYearToDateRange();
  const dateFrom = range?.from?.toLocaleDateString?.('sv-SE') ?? yearToDate.dateFrom;
  const dateTo = range?.to?.toLocaleDateString?.('sv-SE') ?? yearToDate.dateTo;
  const enabled = !!token && !!dateFrom && !!dateTo && status !== 'loading';

  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['orders', 'salesBySalesperson', tenantId ?? 'unknown', dateFrom, dateTo, status],
    queryFn: () => getSalesBySalesperson({ dateFrom, dateTo }, token as string),
    enabled,
  });

  const data = parseSalesBySalespersonResponse(rawData);

  return {
    data,
    isLoading,
    error: error?.message ?? null,
  };
}

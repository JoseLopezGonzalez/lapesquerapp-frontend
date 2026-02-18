'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { getSalesChartData } from '@/services/orderService';
import { getReceptionChartData } from '@/services/rawMaterialReception/getReceptionChartData';
import { getDispatchChartData } from '@/services/ceboDispatch/getDispatchChartData';
import { getTransportChartData } from '@/services/orderService';

interface ChartDataParams {
  range?: { from?: Date; to?: Date };
  speciesId?: string;
  categoryId?: string;
  familyId?: string;
  unit?: string;
  groupBy?: string;
}

interface UseChartDataReturn {
  data: unknown[];
  isLoading: boolean;
  error: string | null;
}

function useChartData(
  queryKey: unknown[],
  queryFn: () => Promise<unknown>,
  enabled: boolean
): UseChartDataReturn {
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn,
    enabled,
  });
  const chartData = Array.isArray(data) ? data : [];
  return {
    data: chartData,
    isLoading,
    error: error?.message ?? null,
  };
}

/**
 * Hook para datos del gráfico de ventas.
 */
export function useSalesChartData(params: ChartDataParams) {
  const { range, speciesId, categoryId, familyId, unit, groupBy } = params;
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const from = range?.from?.toLocaleDateString?.('sv-SE') ?? null;
  const to = range?.to?.toLocaleDateString?.('sv-SE') ?? null;

  return useChartData(
    ['sales', 'chart', tenantId ?? 'unknown', from, to, speciesId, categoryId, familyId, unit, groupBy],
    () =>
      getSalesChartData({
        token: token as string,
        speciesId: speciesId ?? 'all',
        categoryId: categoryId ?? 'all',
        familyId: familyId ?? 'all',
        from: from!,
        to: to!,
        unit: unit ?? 'quantity',
        groupBy: groupBy ?? 'month',
      }),
    !!token && !!tenantId && !!from && !!to
  );
}

/**
 * Hook para datos del gráfico de recepciones.
 */
export function useReceptionChartData(params: ChartDataParams) {
  const { range, speciesId, categoryId, familyId, unit, groupBy } = params;
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const from = range?.from?.toLocaleDateString?.('sv-SE') ?? null;
  const to = range?.to?.toLocaleDateString?.('sv-SE') ?? null;

  return useChartData(
    ['receptions', 'chart', tenantId ?? 'unknown', from, to, speciesId, categoryId, familyId, unit, groupBy],
    () =>
      getReceptionChartData({
        token: token as string,
        speciesId: speciesId ?? 'all',
        categoryId: categoryId ?? 'all',
        familyId: familyId ?? 'all',
        from: from!,
        to: to!,
        unit: unit ?? 'quantity',
        groupBy: groupBy ?? 'month',
      }),
    !!token && !!tenantId && !!from && !!to
  );
}

/**
 * Hook para datos del gráfico de salidas/dispatches.
 */
export function useDispatchChartData(params: ChartDataParams) {
  const { range, speciesId, categoryId, familyId, unit, groupBy } = params;
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const from = range?.from?.toLocaleDateString?.('sv-SE') ?? null;
  const to = range?.to?.toLocaleDateString?.('sv-SE') ?? null;

  return useChartData(
    ['dispatches', 'chart', tenantId ?? 'unknown', from, to, speciesId, categoryId, familyId, unit, groupBy],
    () =>
      getDispatchChartData({
        token: token as string,
        speciesId: speciesId ?? 'all',
        categoryId: categoryId ?? 'all',
        familyId: familyId ?? 'all',
        from: from!,
        to: to!,
        unit: unit ?? 'quantity',
        groupBy: groupBy ?? 'month',
      }),
    !!token && !!tenantId && !!from && !!to
  );
}

interface TransportChartItem {
  name: string;
  netWeight: number;
  [key: string]: unknown;
}

function parseTransportChartResponse(raw: unknown): TransportChartItem[] {
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as { data: unknown[] }).data)
      ? (raw as { data: unknown[] }).data
      : [];
  return arr.map((item: Record<string, unknown>) => ({
    ...item,
    name: (item.transport_name ?? item.name) as string,
    netWeight: Number(item.total_weight ?? item.netWeight ?? 0),
  }));
}

/**
 * Hook para datos del gráfico de transporte.
 */
function getYearToDateStrings(): { from: string; to: string } {
  const today = new Date();
  const first = new Date(today.getFullYear(), 0, 1);
  return {
    from: first.toISOString().split('T')[0] ?? '',
    to: today.toISOString().split('T')[0] ?? '',
  };
}

export function useTransportChartData(params: { range?: { from?: Date; to?: Date } }) {
  const { range } = params ?? {};
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const yearToDate = getYearToDateStrings();
  const from = range?.from?.toLocaleDateString?.('sv-SE') ?? yearToDate.from;
  const to = range?.to?.toLocaleDateString?.('sv-SE') ?? yearToDate.to;
  const enabled = !!token && !!from && !!to && status !== 'loading';

  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['transport', 'chart', tenantId ?? 'unknown', from, to, status],
    queryFn: () => getTransportChartData({ token: token as string, from, to }),
    enabled,
  });

  const data = parseTransportChartResponse(rawData);

  return {
    data,
    isLoading,
    error: error?.message ?? null,
  };
}

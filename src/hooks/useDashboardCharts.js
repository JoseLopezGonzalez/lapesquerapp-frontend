'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { getSalesChartData } from '@/services/orderService';
import { getReceptionChartData } from '@/services/rawMaterialReception/getReceptionChartData';
import { getDispatchChartData } from '@/services/ceboDispatch/getDispatchChartData';
import { getTransportChartData } from '@/services/orderService';

function useChartData(queryKey, queryFn, enabled) {
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
 * @param {Object} params - { range, speciesId, categoryId, familyId, unit, groupBy }
 */
export function useSalesChartData({ range, speciesId, categoryId, familyId, unit, groupBy }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const from = range?.from?.toLocaleDateString?.('sv-SE') ?? null;
  const to = range?.to?.toLocaleDateString?.('sv-SE') ?? null;

  return useChartData(
    ['sales', 'chart', tenantId ?? 'unknown', from, to, speciesId, categoryId, familyId, unit, groupBy],
    () =>
      getSalesChartData({
        token,
        speciesId: speciesId ?? 'all',
        categoryId: categoryId ?? 'all',
        familyId: familyId ?? 'all',
        from,
        to,
        unit: unit ?? 'quantity',
        groupBy: groupBy ?? 'month',
      }),
    !!token && !!tenantId && !!from && !!to
  );
}

/**
 * Hook para datos del gráfico de recepciones.
 */
export function useReceptionChartData({ range, speciesId, categoryId, familyId, unit, groupBy }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const from = range?.from?.toLocaleDateString?.('sv-SE') ?? null;
  const to = range?.to?.toLocaleDateString?.('sv-SE') ?? null;

  return useChartData(
    ['receptions', 'chart', tenantId ?? 'unknown', from, to, speciesId, categoryId, familyId, unit, groupBy],
    () =>
      getReceptionChartData({
        token,
        speciesId: speciesId ?? 'all',
        categoryId: categoryId ?? 'all',
        familyId: familyId ?? 'all',
        from,
        to,
        unit: unit ?? 'quantity',
        groupBy: groupBy ?? 'month',
      }),
    !!token && !!tenantId && !!from && !!to
  );
}

/**
 * Hook para datos del gráfico de salidas/dispatches.
 */
export function useDispatchChartData({ range, speciesId, categoryId, familyId, unit, groupBy }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const from = range?.from?.toLocaleDateString?.('sv-SE') ?? null;
  const to = range?.to?.toLocaleDateString?.('sv-SE') ?? null;

  return useChartData(
    ['dispatches', 'chart', tenantId ?? 'unknown', from, to, speciesId, categoryId, familyId, unit, groupBy],
    () =>
      getDispatchChartData({
        token,
        speciesId: speciesId ?? 'all',
        categoryId: categoryId ?? 'all',
        familyId: familyId ?? 'all',
        from,
        to,
        unit: unit ?? 'quantity',
        groupBy: groupBy ?? 'month',
      }),
    !!token && !!tenantId && !!from && !!to
  );
}

/**
 * Hook para datos del gráfico de transporte.
 */
export function useTransportChartData(range) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const from = range?.from?.toLocaleDateString?.('sv-SE') ?? null;
  const to = range?.to?.toLocaleDateString?.('sv-SE') ?? null;

  return useChartData(
    ['transport', 'chart', tenantId ?? 'unknown', from, to],
    () => getTransportChartData({ token, from, to }),
    !!token && !!tenantId && !!from && !!to
  );
}

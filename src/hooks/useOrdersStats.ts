'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import {
  getOrdersTotalNetWeightStats,
  getOrdersTotalAmountStats,
  getOrderRankingStats,
  getSalesBySalesperson,
  getOrdersProfitabilitySummary,
  getOrdersProfitabilityTimeline,
  getOrdersProfitabilityProducts,
  getAuxiliaryLinesTotalAmountStats,
  getAuxiliaryLinesByProductStats,
  getAuxiliaryLinesByCustomerStats,
  getAuxiliaryLinesChartData,
} from '@/services/orderService';
import { orderStatKeys, auxiliaryLineStatKeys } from '@/lib/routes/queryKeys';

interface OrderRankingItem {
  name: string;
  value: number;
  [key: string]: unknown;
}

function getYearToDateRange(): { dateFrom: string; dateTo: string } {
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), 0, 1);
  const dateFrom = formatLocalDate(firstDay);
  const dateTo = formatLocalDate(today);
  return { dateFrom, dateTo };
}

export function useOrdersTotalNetWeightStats() {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const { dateFrom, dateTo } = getYearToDateRange();

  const { data, isLoading, error } = useQuery({
    queryKey: orderStatKeys.totalNetWeight(tenantId, dateFrom, dateTo),
    queryFn: () => getOrdersTotalNetWeightStats({ dateFrom, dateTo }),
    enabled: !!tenantId,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}

export function useOrdersTotalAmountStats(params: { includeAuxiliary?: boolean } = {}) {
  const { includeAuxiliary = false } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const { dateFrom, dateTo } = getYearToDateRange();

  const { data, isLoading, error } = useQuery({
    queryKey: orderStatKeys.totalAmount(tenantId, dateFrom, dateTo, includeAuxiliary),
    queryFn: () => getOrdersTotalAmountStats({ dateFrom, dateTo, includeAuxiliary }),
    enabled: !!tenantId,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}

export function useAuxiliaryLinesTotalAmountStats() {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const { dateFrom, dateTo } = getYearToDateRange();

  const { data, isLoading, error } = useQuery({
    queryKey: auxiliaryLineStatKeys.totalAmount(tenantId, dateFrom, dateTo),
    queryFn: () => getAuxiliaryLinesTotalAmountStats({ dateFrom, dateTo }),
    enabled: !!tenantId,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}

interface AuxiliaryLinesRangeParams {
  range?: { from?: Date; to?: Date };
}

export function useAuxiliaryLinesByProductStats(params: AuxiliaryLinesRangeParams = {}) {
  const { range } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const yearToDate = getYearToDateRange();
  const dateFrom = range?.from?.toLocaleDateString?.('sv-SE') ?? yearToDate.dateFrom;
  const dateTo = range?.to?.toLocaleDateString?.('sv-SE') ?? yearToDate.dateTo;

  const { data, isLoading, error } = useQuery({
    queryKey: auxiliaryLineStatKeys.byProduct(tenantId, dateFrom, dateTo),
    queryFn: () => getAuxiliaryLinesByProductStats({ dateFrom, dateTo }),
    enabled: !!tenantId && !!dateFrom && !!dateTo,
  });

  return {
    data: data ?? [],
    isLoading,
    error: error?.message ?? null,
  };
}

export function useAuxiliaryLinesByCustomerStats(params: AuxiliaryLinesRangeParams = {}) {
  const { range } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const yearToDate = getYearToDateRange();
  const dateFrom = range?.from?.toLocaleDateString?.('sv-SE') ?? yearToDate.dateFrom;
  const dateTo = range?.to?.toLocaleDateString?.('sv-SE') ?? yearToDate.dateTo;

  const { data, isLoading, error } = useQuery({
    queryKey: auxiliaryLineStatKeys.byCustomer(tenantId, dateFrom, dateTo),
    queryFn: () => getAuxiliaryLinesByCustomerStats({ dateFrom, dateTo }),
    enabled: !!tenantId && !!dateFrom && !!dateTo,
  });

  return {
    data: data ?? [],
    isLoading,
    error: error?.message ?? null,
  };
}

interface AuxiliaryLinesChartParams extends AuxiliaryLinesRangeParams {
  groupBy?: 'day' | 'week' | 'month';
}

export function useAuxiliaryLinesChartData(params: AuxiliaryLinesChartParams = {}) {
  const { range, groupBy = 'day' } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const yearToDate = getYearToDateRange();
  const dateFrom = range?.from?.toLocaleDateString?.('sv-SE') ?? yearToDate.dateFrom;
  const dateTo = range?.to?.toLocaleDateString?.('sv-SE') ?? yearToDate.dateTo;

  const { data, isLoading, error } = useQuery({
    queryKey: auxiliaryLineStatKeys.chartData(tenantId, dateFrom, dateTo, groupBy),
    queryFn: () => getAuxiliaryLinesChartData({ dateFrom, dateTo, groupBy }),
    enabled: !!tenantId && !!dateFrom && !!dateTo,
  });

  return {
    data: data ?? [],
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

export function useOrderRankingStats(params: OrderRankingParams) {
  const { range, groupBy, valueType, speciesId } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const dateFrom = range?.from?.toLocaleDateString?.('sv-SE') ?? null;
  const dateTo = range?.to?.toLocaleDateString?.('sv-SE') ?? null;

  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery({
    queryKey: orderStatKeys.ranking(
      tenantId,
      dateFrom ?? '',
      dateTo ?? '',
      groupBy ?? 'client',
      valueType ?? 'totalAmount',
      speciesId
    ),
    queryFn: () =>
      getOrderRankingStats({
        groupBy: groupBy ?? 'client',
        valueType: valueType ?? 'totalAmount',
        dateFrom: dateFrom!,
        dateTo: dateTo!,
        speciesId: speciesId ?? 'all',
      }),
    enabled: !!tenantId && !!dateFrom && !!dateTo && !!groupBy && !!valueType,
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

interface ProfitabilityRangeParams {
  range?: { from?: Date; to?: Date };
}

interface ProfitabilitySummaryParams extends ProfitabilityRangeParams {
  productId?: string;
}

interface ProfitabilityTimelineParams extends ProfitabilityRangeParams {
  productId?: string;
  granularity?: 'day' | 'week' | 'month';
}

function parseSalesBySalespersonResponse(raw: unknown): SalesBySalespersonItem[] {
  const arr = Array.isArray(raw)
    ? raw
    : raw &&
        typeof raw === 'object' &&
        'data' in raw &&
        Array.isArray((raw as { data: unknown[] }).data)
      ? (raw as { data: unknown[] }).data
      : [];
  return arr.map((item: Record<string, unknown>, index: number) => ({
    ...item,
    name: (item.salesperson_name ?? item.name) as string,
    quantity: Number(item.total_weight ?? item.quantity ?? item.value ?? 0),
    fill: PIE_COLORS[index % PIE_COLORS.length],
  }));
}

export function useSalesBySalesperson(params: SalesBySalespersonParams) {
  const { range } = params ?? {};
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const yearToDate = getYearToDateRange();
  const dateFrom = range?.from?.toLocaleDateString?.('sv-SE') ?? yearToDate.dateFrom;
  const dateTo = range?.to?.toLocaleDateString?.('sv-SE') ?? yearToDate.dateTo;

  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery({
    queryKey: orderStatKeys.salesBySalesperson(tenantId, dateFrom, dateTo),
    queryFn: () => getSalesBySalesperson({ dateFrom, dateTo }),
    enabled: !!tenantId && !!dateFrom && !!dateTo,
  });

  const data = parseSalesBySalespersonResponse(rawData);

  return {
    data,
    isLoading,
    error: error?.message ?? null,
  };
}

export function useOrdersProfitabilitySummary(params: ProfitabilitySummaryParams) {
  const { range } = params ?? {};
  const productId = params?.productId ?? 'all';
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const yearToDate = getYearToDateRange();
  const dateFrom = range?.from?.toLocaleDateString?.('sv-SE') ?? yearToDate.dateFrom;
  const dateTo = range?.to?.toLocaleDateString?.('sv-SE') ?? yearToDate.dateTo;

  const { data, isLoading, error } = useQuery({
    queryKey: orderStatKeys.profitabilitySummary(tenantId, dateFrom, dateTo, productId),
    queryFn: () =>
      getOrdersProfitabilitySummary({
        dateFrom,
        dateTo,
        productIds: productId && productId !== 'all' ? [productId] : undefined,
      }),
    enabled: !!tenantId && !!dateFrom && !!dateTo,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}

export function useOrdersProfitabilityTimeline(params: ProfitabilityTimelineParams) {
  const { range } = params ?? {};
  const productId = params?.productId ?? 'all';
  const granularity = params?.granularity ?? 'month';
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const yearToDate = getYearToDateRange();
  const dateFrom = range?.from?.toLocaleDateString?.('sv-SE') ?? yearToDate.dateFrom;
  const dateTo = range?.to?.toLocaleDateString?.('sv-SE') ?? yearToDate.dateTo;

  const { data, isLoading, error } = useQuery({
    queryKey: orderStatKeys.profitabilityTimeline(tenantId, dateFrom, dateTo, granularity, productId),
    queryFn: () =>
      getOrdersProfitabilityTimeline({
        dateFrom,
        dateTo,
        granularity,
        productIds: productId && productId !== 'all' ? [productId] : undefined,
      }),
    enabled: !!tenantId && !!dateFrom && !!dateTo,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}

export function useOrdersProfitabilityProducts(params: ProfitabilityRangeParams) {
  const { range } = params ?? {};
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const yearToDate = getYearToDateRange();
  const dateFrom = range?.from?.toLocaleDateString?.('sv-SE') ?? yearToDate.dateFrom;
  const dateTo = range?.to?.toLocaleDateString?.('sv-SE') ?? yearToDate.dateTo;

  const { data, isLoading, error } = useQuery({
    queryKey: orderStatKeys.profitabilityProducts(tenantId, dateFrom, dateTo),
    queryFn: () =>
      getOrdersProfitabilityProducts({
        dateFrom,
        dateTo,
      }),
    enabled: !!tenantId && !!dateFrom && !!dateTo,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}

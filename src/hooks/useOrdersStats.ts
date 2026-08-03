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
  createOrdersProfitabilitySummaryJob,
  getOrdersProfitabilitySummaryJob,
  createOrdersProfitabilityProductsJob,
  getOrdersProfitabilityProductsJob,
  ProfitabilityRangeTooLargeError,
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

// Backend Sprint 4 (2026-08-03): profitability-summary/profitability-products
// rechazan con 422 rangos síncronos > 60 días — por encima de eso hay que usar
// el flujo async (POST .../jobs + polling).
const PROFITABILITY_SYNC_MAX_DAYS = 60;
const PROFITABILITY_JOB_POLL_INTERVAL_MS = 1800;
// ~20-30s / 10-15 intentos de polling, recomendado por el propio backend antes
// de considerar que el cálculo "está tardando más de lo normal".
const PROFITABILITY_JOB_TIMEOUT_MS = 30000;

function daysBetween(dateFrom: string, dateTo: string): number {
  const from = new Date(dateFrom).getTime();
  const to = new Date(dateTo).getTime();
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

function hasProfitabilityJobTimedOut(
  job: { status: string; createdAt: string } | undefined
): boolean {
  if (!job || !isProfitabilityJobPending(job.status)) return false;
  return Date.now() - new Date(job.createdAt).getTime() > PROFITABILITY_JOB_TIMEOUT_MS;
}

function isProfitabilityJobPending(status: string | undefined): boolean {
  return status === 'pending' || status === 'processing';
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
  const productIds = productId && productId !== 'all' ? [productId] : undefined;
  const hasContext = !!tenantId && !!dateFrom && !!dateTo;
  const isLongRange = daysBetween(dateFrom, dateTo) > PROFITABILITY_SYNC_MAX_DAYS;

  const syncQuery = useQuery({
    queryKey: orderStatKeys.profitabilitySummary(tenantId, dateFrom, dateTo, productId),
    queryFn: () => getOrdersProfitabilitySummary({ dateFrom, dateTo, productIds }),
    enabled: hasContext && !isLongRange,
    retry: (failureCount, error) =>
      !(error instanceof ProfitabilityRangeTooLargeError) && failureCount < 2,
  });

  // hasContext también gatea needsAsync: sin tenant/rango no hay nada que
  // despachar, y sin este guard el job quedaría "pendiente" para siempre en
  // vez de resolver isLoading a false (jobQuery/jobStatusQuery nunca se habilitan).
  const needsAsync =
    hasContext &&
    (isLongRange ||
      (syncQuery.error != null && syncQuery.error instanceof ProfitabilityRangeTooLargeError));

  // Dispatch: crea el job una vez por rango (staleTime infinito) — el polling real
  // de status/resultado lo hace la query de abajo, keyed por el jobId devuelto aquí.
  const jobQuery = useQuery({
    queryKey: orderStatKeys.profitabilitySummaryJob(tenantId, dateFrom, dateTo, productId),
    queryFn: () => createOrdersProfitabilitySummaryJob({ dateFrom, dateTo, productIds }),
    enabled: needsAsync,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const jobId = jobQuery.data?.id;

  const jobStatusQuery = useQuery({
    queryKey: orderStatKeys.profitabilitySummaryJobStatus(tenantId, jobId),
    queryFn: () => getOrdersProfitabilitySummaryJob(jobId as string),
    enabled: !!jobId,
    refetchInterval: (query) =>
      isProfitabilityJobPending(query.state.data?.status) &&
      !hasProfitabilityJobTimedOut(query.state.data)
        ? PROFITABILITY_JOB_POLL_INTERVAL_MS
        : false,
  });

  if (!needsAsync) {
    return {
      data: syncQuery.data ?? null,
      isLoading: syncQuery.isLoading,
      error:
        syncQuery.error && !(syncQuery.error instanceof ProfitabilityRangeTooLargeError)
          ? syncQuery.error.message
          : null,
    };
  }

  // Los fallos de creación/polling del job deben cortar isLoading, no dejarlo
  // colgado — sin esto, un 404/500 en cualquiera de los dos endpoints se
  // enmascaraba como "cargando" para siempre (job seguía siendo undefined).
  if (jobQuery.isError) {
    return { data: null, isLoading: false, error: jobQuery.error.message };
  }
  if (jobStatusQuery.isError) {
    return { data: null, isLoading: false, error: jobStatusQuery.error.message };
  }

  const job = jobStatusQuery.data ?? jobQuery.data;

  if (hasProfitabilityJobTimedOut(job)) {
    return {
      data: null,
      isLoading: false,
      error: 'El cálculo está tardando más de lo esperado. Inténtalo de nuevo en unos minutos.',
    };
  }

  const isLoading = !job || isProfitabilityJobPending(job.status);
  const error =
    job?.status === 'failed' ? (job.errorMessage ?? 'No se pudo calcular la rentabilidad') : null;

  return {
    data: job?.status === 'finished' ? job.result : null,
    isLoading,
    error,
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
    queryKey: orderStatKeys.profitabilityTimeline(
      tenantId,
      dateFrom,
      dateTo,
      granularity,
      productId
    ),
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
  const hasContext = !!tenantId && !!dateFrom && !!dateTo;
  const isLongRange = daysBetween(dateFrom, dateTo) > PROFITABILITY_SYNC_MAX_DAYS;

  const syncQuery = useQuery({
    queryKey: orderStatKeys.profitabilityProducts(tenantId, dateFrom, dateTo),
    queryFn: () => getOrdersProfitabilityProducts({ dateFrom, dateTo }),
    enabled: hasContext && !isLongRange,
    retry: (failureCount, error) =>
      !(error instanceof ProfitabilityRangeTooLargeError) && failureCount < 2,
  });

  // hasContext también gatea needsAsync: sin tenant/rango no hay nada que
  // despachar, y sin este guard el job quedaría "pendiente" para siempre en
  // vez de resolver isLoading a false (jobQuery/jobStatusQuery nunca se habilitan).
  const needsAsync =
    hasContext &&
    (isLongRange ||
      (syncQuery.error != null && syncQuery.error instanceof ProfitabilityRangeTooLargeError));

  const jobQuery = useQuery({
    queryKey: orderStatKeys.profitabilityProductsJob(tenantId, dateFrom, dateTo),
    queryFn: () => createOrdersProfitabilityProductsJob({ dateFrom, dateTo }),
    enabled: needsAsync,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const jobId = jobQuery.data?.id;

  const jobStatusQuery = useQuery({
    queryKey: orderStatKeys.profitabilityProductsJobStatus(tenantId, jobId),
    queryFn: () => getOrdersProfitabilityProductsJob(jobId as string),
    enabled: !!jobId,
    refetchInterval: (query) =>
      isProfitabilityJobPending(query.state.data?.status) &&
      !hasProfitabilityJobTimedOut(query.state.data)
        ? PROFITABILITY_JOB_POLL_INTERVAL_MS
        : false,
  });

  if (!needsAsync) {
    return {
      data: syncQuery.data ?? null,
      isLoading: syncQuery.isLoading,
      error:
        syncQuery.error && !(syncQuery.error instanceof ProfitabilityRangeTooLargeError)
          ? syncQuery.error.message
          : null,
    };
  }

  // Los fallos de creación/polling del job deben cortar isLoading, no dejarlo
  // colgado — sin esto, un 404/500 en cualquiera de los dos endpoints se
  // enmascaraba como "cargando" para siempre (job seguía siendo undefined).
  if (jobQuery.isError) {
    return { data: null, isLoading: false, error: jobQuery.error.message };
  }
  if (jobStatusQuery.isError) {
    return { data: null, isLoading: false, error: jobStatusQuery.error.message };
  }

  const job = jobStatusQuery.data ?? jobQuery.data;

  if (hasProfitabilityJobTimedOut(job)) {
    return {
      data: null,
      isLoading: false,
      error: 'El cálculo está tardando más de lo esperado. Inténtalo de nuevo en unos minutos.',
    };
  }

  const isLoading = !job || isProfitabilityJobPending(job.status);
  const error =
    job?.status === 'failed' ? (job.errorMessage ?? 'No se pudo calcular la rentabilidad') : null;

  return {
    data: job?.status === 'finished' ? job.result : null,
    isLoading,
    error,
  };
}

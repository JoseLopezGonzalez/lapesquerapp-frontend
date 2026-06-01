/**
 * Tests for profitability dashboard hooks
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useOrdersProfitabilityProducts,
  useOrdersProfitabilitySummary,
  useOrdersProfitabilityTimeline,
} from '@/hooks/useOrdersStats';

const mockUseSession = vi.fn();
const mockGetCurrentTenant = vi.fn();
const mockGetOrdersProfitabilitySummary = vi.fn();
const mockGetOrdersProfitabilityTimeline = vi.fn();
const mockGetOrdersProfitabilityProducts = vi.fn();

vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}));

vi.mock('@/lib/utils/getCurrentTenant', () => ({
  getCurrentTenant: () => mockGetCurrentTenant(),
}));

vi.mock('@/services/orderService', () => ({
  getOrdersTotalNetWeightStats: vi.fn(),
  getOrdersTotalAmountStats: vi.fn(),
  getOrderRankingStats: vi.fn(),
  getSalesBySalesperson: vi.fn(),
  getOrdersProfitabilitySummary: (...args: unknown[]) => mockGetOrdersProfitabilitySummary(...args),
  getOrdersProfitabilityTimeline: (...args: unknown[]) =>
    mockGetOrdersProfitabilityTimeline(...args),
  getOrdersProfitabilityProducts: (...args: unknown[]) =>
    mockGetOrdersProfitabilityProducts(...args),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
}

describe('useOrders profitability stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: { user: { accessToken: 'test-token' } },
      status: 'authenticated',
    });
    mockGetCurrentTenant.mockReturnValue('tenant-a');
    mockGetOrdersProfitabilitySummary.mockResolvedValue({
      period: { from: '2026-01-01', to: '2026-01-31' },
      ordersCount: 4,
      totalRevenue: 1000,
      totalCost: 700,
      grossMargin: 300,
      marginPercentage: 30,
      coveredBoxes: 7,
      uncoveredBoxes: 3,
      costCoverageBoxesPct: 70,
    });
    mockGetOrdersProfitabilityTimeline.mockResolvedValue({
      granularity: 'month',
      series: [],
    });
    mockGetOrdersProfitabilityProducts.mockResolvedValue({
      period: { from: '2026-01-01', to: '2026-01-31' },
      products: [],
    });
  });

  it('loads profitability summary with tenant-aware params', async () => {
    const range = { from: new Date('2026-01-01'), to: new Date('2026-01-31') };
    const { result } = renderHook(() => useOrdersProfitabilitySummary({ range, productId: '12' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetOrdersProfitabilitySummary).toHaveBeenCalledWith(
      {
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
        productIds: ['12'],
      },
      'test-token'
    );
    expect(result.current.data?.grossMargin).toBe(300);
    expect(result.current.data?.costCoverageBoxesPct).toBe(70);
  });

  it('loads profitability timeline and refetches with granularity changes in query key inputs', async () => {
    const range = { from: new Date('2026-02-01'), to: new Date('2026-02-28') };
    const { result, rerender } = renderHook(
      ({ granularity }) => useOrdersProfitabilityTimeline({ range, productId: 'all', granularity }),
      {
        initialProps: { granularity: 'month' as const },
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetOrdersProfitabilityTimeline).toHaveBeenCalledWith(
      {
        dateFrom: '2026-02-01',
        dateTo: '2026-02-28',
        granularity: 'month',
        productIds: undefined,
      },
      'test-token'
    );

    rerender({ granularity: 'week' as const });

    await waitFor(() => {
      expect(mockGetOrdersProfitabilityTimeline).toHaveBeenCalledWith(
        {
          dateFrom: '2026-02-01',
          dateTo: '2026-02-28',
          granularity: 'week',
          productIds: undefined,
        },
        'test-token'
      );
    });
  });

  it('does not run queries without tenant or token', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    mockGetCurrentTenant.mockReturnValue(null);

    const { result } = renderHook(() => useOrdersProfitabilityProducts({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetOrdersProfitabilityProducts).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });
});

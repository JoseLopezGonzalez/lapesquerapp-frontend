/**
 * Tests for useCustomerHistory hook
 * Verifies filteredHistory, generalMetrics, dateFilter, calculateTrend, getDateRange
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCustomerHistory } from '@/hooks/useCustomerHistory';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: { user: { accessToken: 'test-token' } } })),
}));

// Mock customerService
vi.mock('@/services/customerService', () => ({
  getCustomerOrderHistory: vi.fn(),
}));

// Mock notifications (Sileo wrapper)
vi.mock('@/lib/notifications', () => ({
  notify: { error: vi.fn() },
}));

import { getCustomerOrderHistory } from '@/services/customerService';

describe('useCustomerHistory', () => {
  const mockOrder = {
    id: 1,
    load_date: '2025-01-15',
    total_amount: 1000,
    lines: [
      { order_id: 1, load_date: '2025-01-15', net_weight: 100, product: { id: 1 } },
      { order_id: 1, load_date: '2025-01-10', net_weight: 80, product: { id: 1 } },
    ],
  };

  const mockHistory = [
    {
      ...mockOrder,
      product: { id: 1, name: 'Producto A' },
      lines: mockOrder.lines.map((l) => ({ ...l, product: { id: 1 } })),
    },
  ];

  const mockOrderWithProduct = {
    ...mockOrder,
    product: { id: 1, name: 'Producto A' },
    lines: mockOrder.lines.map((l) => ({ ...l, product_id: 1 })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getCustomerOrderHistory
      .mockResolvedValueOnce({ data: [], available_years: [2024, 2025] })
      .mockResolvedValueOnce({ data: mockHistory, available_years: [2024, 2025] });
  });

  it('returns filteredHistory and generalMetrics when loaded', async () => {
    const order = { customer: { id: 1 } };

    const { result } = renderHook(() => useCustomerHistory(order));

    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });

    expect(result.current.filteredHistory).toBeDefined();
    expect(Array.isArray(result.current.filteredHistory)).toBe(true);
    expect(result.current.generalMetrics).toBeDefined();
    expect(result.current.generalMetrics).toHaveProperty('totalOrders');
    expect(result.current.generalMetrics).toHaveProperty('totalAmount');
  });

  it('dateFilter changes getDateRange', async () => {
    const order = { customer: { id: 1 } };

    const { result } = renderHook(() => useCustomerHistory(order));

    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });

    const rangeMonth = result.current.getDateRange;
    expect(rangeMonth).toBeDefined();

    await act(async () => {
      result.current.setDateFilter('year');
    });

    const rangeYear = result.current.getDateRange;
    expect(rangeYear).toBeDefined();
    expect(rangeYear).not.toBe(rangeMonth);
  });

  it('calculateTrend returns direction and percentage', async () => {
    getCustomerOrderHistory.mockReset();
    getCustomerOrderHistory
      .mockResolvedValueOnce({ data: [], available_years: [2024, 2025] })
      .mockResolvedValue({
        data: [mockOrderWithProduct],
        available_years: [2024, 2025],
      });

    const order = { customer: { id: 1 } };

    const { result } = renderHook(() => useCustomerHistory(order));

    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });

    const product = { product: { id: 1 }, lines: mockOrder.lines };
    const trend = result.current.calculateTrend(product);

    expect(trend).toHaveProperty('direction');
    expect(trend).toHaveProperty('percentage');
    expect(['up', 'down', 'stable']).toContain(trend.direction);
  });

  it('getDateRange returns correct shape for month filter', async () => {
    const order = { customer: { id: 1 } };

    const { result } = renderHook(() => useCustomerHistory(order));

    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });

    const range = result.current.getDateRange;
    expect(range).toHaveProperty('from');
    expect(range).toHaveProperty('to');
    expect(range.from).toBeInstanceOf(Date);
    expect(range.to).toBeInstanceOf(Date);
  });

  it('returns loading states initially', () => {
    getCustomerOrderHistory.mockImplementation(() => new Promise(() => {}));

    const order = { customer: { id: 1 } };

    const { result } = renderHook(() => useCustomerHistory(order));

    expect(result.current.initialLoading).toBe(true);
  });
});

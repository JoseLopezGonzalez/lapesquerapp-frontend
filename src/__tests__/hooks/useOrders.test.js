/**
 * Tests for useOrders hook
 * Verifies orders fetching, loading state, and cache behavior
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrders } from '@/hooks/useOrders';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: { user: { accessToken: 'test-token' } } })),
}));

// Mock orderService
vi.mock('@/services/orderService', () => ({
  getActiveOrders: vi.fn(),
}));

// Mock getCurrentTenant - in test env window may be undefined, simulate browser
vi.mock('@/lib/utils/getCurrentTenant', () => ({
  getCurrentTenant: vi.fn(() => 'test-tenant'),
}));

import { getActiveOrders } from '@/services/orderService';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useOrders', () => {
  const mockOrders = [
    { id: 1, customer: { name: 'Cliente A' }, status: 'pending' },
    { id: 2, customer: { name: 'Cliente B' }, status: 'in_production' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    getActiveOrders.mockResolvedValue(mockOrders);
  });

  it('returns orders and isLoading', async () => {
    const { result } = renderHook(() => useOrders(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.orders).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.orders).toEqual(mockOrders);
    expect(getActiveOrders).toHaveBeenCalledWith('test-token');
  });

  it('returns empty array when no orders', async () => {
    getActiveOrders.mockResolvedValue([]);

    const { result } = renderHook(() => useOrders(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.orders).toEqual([]);
  });

  it('returns error when request fails', async () => {
    getActiveOrders.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useOrders(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });

  it('exposes queryKey and refetch', async () => {
    const { result } = renderHook(() => useOrders(), {
      wrapper: createWrapper(),
    });

    expect(result.current.queryKey).toEqual(['orders', 'test-tenant']);
    expect(typeof result.current.refetch).toBe('function');
  });
});

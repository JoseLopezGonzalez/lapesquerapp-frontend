/**
 * Tests for useProductionDetail hook
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProductionDetail } from '@/hooks/production/useProductionDetail';

const mockProduction = { id: 1, name: 'Producción test', status: 'active' };
const mockProcessTree = { nodes: [], edges: [] };
const mockTotals = { totalWeight: 100, totalBoxes: 10 };

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: { user: { accessToken: 'test-token' } } })),
}));

vi.mock('@/lib/utils/getCurrentTenant', () => ({
  getCurrentTenant: vi.fn(() => 'tenant-1'),
}));

vi.mock('@/services/productionService', () => ({
  getProduction: vi.fn(),
  getProductionProcessTree: vi.fn(),
  getProductionTotals: vi.fn(),
}));

import {
  getProduction,
  getProductionProcessTree,
  getProductionTotals,
} from '@/services/productionService';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useProductionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProduction).mockResolvedValue(mockProduction as never);
    vi.mocked(getProductionProcessTree).mockResolvedValue(mockProcessTree as never);
    vi.mocked(getProductionTotals).mockResolvedValue(mockTotals as never);
  });

  it('returns production, processTree, totals when productionId and token are set', async () => {
    const { result } = renderHook(() => useProductionDetail(1), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.production).toEqual(mockProduction);
    expect(result.current.processTree).toEqual(mockProcessTree);
    expect(result.current.totals).toEqual(mockTotals);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
    expect(getProduction).toHaveBeenCalledWith(1, 'test-token');
    expect(getProductionProcessTree).toHaveBeenCalledWith(1, 'test-token');
    expect(getProductionTotals).toHaveBeenCalledWith(1, 'test-token');
  });

  it('returns null production when productionId is null', async () => {
    vi.clearAllMocks();
    const { result } = renderHook(() => useProductionDetail(null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.production).toBeNull();
    expect(result.current.processTree).toBeNull();
    expect(result.current.totals).toBeNull();
    expect(getProduction).not.toHaveBeenCalled();
  });

  it('exposes refetch and handles error', async () => {
    vi.mocked(getProduction).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useProductionDetail(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain('Network error');
    expect(result.current.production).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
  });
});

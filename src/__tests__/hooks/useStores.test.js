/**
 * Tests for useStores hook
 * Verifies stores fetching with React Query, ghost store, and load more
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStores, REGISTERED_PALLETS_STORE_ID } from '@/hooks/useStores';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: { user: { accessToken: 'test-token' } } })),
}));

vi.mock('@/services/storeService', () => ({
  getStores: vi.fn(),
  getRegisteredPallets: vi.fn(),
}));

vi.mock('@/lib/utils/getCurrentTenant', () => ({
  getCurrentTenant: vi.fn(() => 'test-tenant'),
}));

import { getStores, getRegisteredPallets } from '@/services/storeService';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useStores', () => {
  const mockStoresResponse = {
    data: [
      { id: 1, name: 'Almacén A', totalNetWeight: 1000 },
      { id: 2, name: 'Almacén B', totalNetWeight: 2000 },
    ],
    links: { next: null },
    meta: { current_page: 1 },
  };

  const mockGhostStore = {
    id: null,
    name: 'En espera',
    content: { pallets: [], boxes: [], bigBoxes: [] },
    totalNetWeight: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getStores.mockResolvedValue(mockStoresResponse);
    getRegisteredPallets.mockResolvedValue(mockGhostStore);
  });

  it('returns stores with ghost store first', async () => {
    const { result } = renderHook(() => useStores(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.stores).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stores.length).toBeGreaterThanOrEqual(2);
    expect(result.current.stores[0].id).toBe(REGISTERED_PALLETS_STORE_ID);
    expect(result.current.stores[0].name).toBe('En espera');
    expect(getStores).toHaveBeenCalledWith('test-token', 1);
    expect(getRegisteredPallets).toHaveBeenCalledWith('test-token');
  });

  it('returns error when request fails', async () => {
    getStores.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useStores(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error.message).toContain('Network');
  });

  it('exposes loadMoreStores and hasMoreStores', async () => {
    const { result } = renderHook(() => useStores(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.loadMoreStores).toBe('function');
    expect(typeof result.current.hasMoreStores).toBe('boolean');
  });
});

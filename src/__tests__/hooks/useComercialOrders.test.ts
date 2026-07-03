/**
 * @vitest-environment happy-dom
 */
import React, { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useComercialOrders } from '@/hooks/useComercialOrders';

vi.mock('@/services/crmService', () => ({
  crmService: {
    listCommercialOrders: vi.fn(),
  },
}));

vi.mock('@/lib/utils/getCurrentTenant', () => ({
  getCurrentTenant: vi.fn(() => 'test-tenant'),
}));

import { crmService } from '@/services/crmService';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useComercialOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes offer_id (snake_case) into offerId when offerId is missing', async () => {
    vi.mocked(crmService.listCommercialOrders).mockResolvedValue({
      data: [
        { id: 1, offer_id: 42 },
        { id: 2, offerId: 7, offer_id: 99 },
        { id: 3 },
      ],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 3 },
    });

    const { result } = renderHook(() => useComercialOrders(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([
      expect.objectContaining({ id: 1, offerId: 42 }),
      expect.objectContaining({ id: 2, offerId: 7 }),
      expect.objectContaining({ id: 3, offerId: null }),
    ]);
  });

  it('falls back to a default meta shape when the response has no pagination', async () => {
    vi.mocked(crmService.listCommercialOrders).mockResolvedValue({
      data: [{ id: 1 }],
    });

    const { result } = renderHook(() => useComercialOrders(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.meta).toEqual({
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
    });
  });

  it('returns an empty list when the response has no data array', async () => {
    vi.mocked(crmService.listCommercialOrders).mockResolvedValue({});

    const { result } = renderHook(() => useComercialOrders(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([]);
  });
});

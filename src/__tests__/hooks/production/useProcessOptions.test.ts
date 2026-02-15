/**
 * Tests for useProcessOptions hook
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProcessOptions } from '@/hooks/production/useProcessOptions';

const mockProcesses = [
  { id: 1, name: 'Proceso A', type: 'primary' },
  { id: 2, name: 'Proceso B', type: 'secondary' },
];

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: { user: { accessToken: 'test-token' } } })),
}));

vi.mock('@/lib/utils/getCurrentTenant', () => ({
  getCurrentTenant: vi.fn(() => 'tenant-1'),
}));

vi.mock('@/lib/fetchWithTenant', () => ({
  fetchWithTenant: vi.fn(),
}));

import { fetchWithTenant } from '@/lib/fetchWithTenant';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useProcessOptions', () => {
  beforeEach(() => {
    vi.mocked(fetchWithTenant).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockProcesses }),
    } as Response);
  });

  it('returns processes array when token and tenant are set', async () => {
    const { result } = renderHook(() => useProcessOptions(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.processes).toEqual(mockProcesses);
    expect(result.current.error).toBeNull();
    expect(fetchWithTenant).toHaveBeenCalledWith(
      expect.stringContaining('processes/options'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('returns empty array when response is not ok', async () => {
    vi.mocked(fetchWithTenant).mockResolvedValue({ ok: false } as Response);

    const { result } = renderHook(() => useProcessOptions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.processes).toEqual([]);
  });

  it('exposes isLoading and error', async () => {
    const { result } = renderHook(() => useProcessOptions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(Array.isArray(result.current.processes)).toBe(true);
  });
});

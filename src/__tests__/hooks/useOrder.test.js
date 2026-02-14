/**
 * Tests for useOrder hook
 * Verifies order, loading, error, updateOrderStatus cache update, exportDocument
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrder } from '@/hooks/useOrder';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: { user: { accessToken: 'test-token' } },
    status: 'authenticated',
  })),
}));

// Mock orderService
vi.mock('@/services/orderService', () => ({
  getOrder: vi.fn(),
  setOrderStatus: vi.fn(),
  updateOrder: vi.fn(),
  createOrderIncident: vi.fn(),
  createOrderPlannedProductDetail: vi.fn(),
  deleteOrderPlannedProductDetail: vi.fn(),
  destroyOrderIncident: vi.fn(),
  updateOrderIncident: vi.fn(),
  updateOrderPlannedProductDetail: vi.fn(),
}));

// Mock palletService
vi.mock('@/services/palletService', () => ({
  deletePallet: vi.fn(),
  unlinkPalletFromOrder: vi.fn(),
  linkPalletToOrder: vi.fn(),
  linkPalletsToOrders: vi.fn(),
  unlinkPalletsFromOrders: vi.fn(),
}));

// Mock productService, taxService
vi.mock('@/services/productService', () => ({ getProductOptions: vi.fn().mockResolvedValue([]) }));
vi.mock('@/services/taxService', () => ({ getTaxOptions: vi.fn().mockResolvedValue([]) }));

// Mock OrdersManagerOptionsContext (path without extension - resolves to .jsx)
vi.mock('@/context/gestor-options/OrdersManagerOptionsContext', () => ({
  useOrdersManagerOptions: vi.fn(() => ({ productOptions: [], taxOptions: [], productsLoading: false, taxOptionsLoading: false })),
  OrdersManagerOptionsProvider: () => null,
  OrdersManagerOptionsContext: {},
}));

// Mock fetchWithTenant for exportDocument
vi.mock('@lib/fetchWithTenant', () => ({ fetchWithTenant: vi.fn() }));
vi.mock('@/configs/config', () => ({ API_URL_V2: 'https://api.test/v2/' }));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    loading: vi.fn(() => 'toast-id'),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock blob/URL for export
const mockBlob = new Blob(['test'], { type: 'application/pdf' });
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
});

import { getOrder, setOrderStatus } from '@/services/orderService';
import { fetchWithTenant } from '@lib/fetchWithTenant';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useOrder', () => {
  const mockOrder = {
    id: 1,
    customer: { id: 1, name: 'Cliente Test' },
    status: 'pending',
    loadDate: '2026-02-15',
    plannedProductDetails: [],
    productionProductDetails: [],
    pallets: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
    getOrder.mockResolvedValue(mockOrder);
  });

  it('returns order, loading, error when loaded', async () => {
    const { result } = renderHook(() => useOrder(1), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.order).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.order).toEqual(mockOrder);
    expect(result.current.error).toBeFalsy();
  });

  it('updateOrderStatus updates cache via setOrderStatus', async () => {
    const updatedOrder = { ...mockOrder, status: 'in_production' };
    setOrderStatus.mockResolvedValue(updatedOrder);

    const onChange = vi.fn();
    const { result } = renderHook(() => useOrder(1, onChange), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateOrderStatus('in_production');
    });

    expect(setOrderStatus).toHaveBeenCalledWith(1, 'in_production', 'test-token');
    expect(onChange).toHaveBeenCalledWith(updatedOrder);
  });

  it('exportDocument calls fetchWithTenant', async () => {
    fetchWithTenant.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
      headers: { get: () => null },
    });

    const { result } = renderHook(() => useOrder(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.exportDocument('loading-note', 'pdf', 'Nota de Carga');
    });

    expect(fetchWithTenant).toHaveBeenCalledWith(
      expect.stringContaining('/orders/1/'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('sets error when getOrder fails with 401', async () => {
    const err401 = new Error('Unauthorized');
    err401.status = 401;
    getOrder.mockRejectedValue(err401);

    const { result } = renderHook(() => useOrder(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.order).toBeNull();
  });
});

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

// Mock notifications (Sileo wrapper)
vi.mock('@/lib/notifications', () => ({
  notify: {
    loading: vi.fn(() => 'toast-id'),
    success: vi.fn(),
    error: vi.fn(),
    promise: vi.fn((p, _opts) => (typeof p === 'function' ? Promise.resolve(p()) : Promise.resolve(p))),
  },
}));

// Mock blob/URL for export
const mockBlob = new Blob(['test'], { type: 'application/pdf' });
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
const NativeURL = global.URL;
Object.defineProperty(global, 'URL', {
  value: class extends NativeURL {},
  writable: true,
});
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

import { getOrder, setOrderStatus } from '@/services/orderService';
import { fetchWithTenant } from '@lib/fetchWithTenant';
import { notify } from '@/lib/notifications';

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
      'https://api.test/v2/orders/1/pdf/loading-note',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('exportDocument keeps order-signs endpoint unchanged', async () => {
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
      await result.current.exportDocument('order-signs', 'pdf', 'Letreros de transporte');
    });

    expect(fetchWithTenant).toHaveBeenCalledWith(
      'https://api.test/v2/orders/1/pdf/order-signs',
      expect.any(Object)
    );
  });

  it('exportDocument resolves restricted-order-signs endpoint', async () => {
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
      await result.current.exportDocument('restricted-order-signs', 'pdf', 'Letreros de transporte (Restringidos)');
    });

    expect(fetchWithTenant).toHaveBeenCalledWith(
      'https://api.test/v2/orders/1/pdf/restricted-order-signs',
      expect.any(Object)
    );
  });

  it('exposes restricted-order-signs in export catalogs', async () => {
    const { result } = renderHook(() => useOrder(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.exportDocuments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'restricted-order-signs',
          label: 'Letreros de transporte (Restringidos)',
          types: ['pdf'],
        }),
      ])
    );

    expect(result.current.fastExportDocuments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'restricted-order-signs',
          label: 'Letreros de transporte (Restringidos)',
          type: 'pdf',
        }),
      ])
    );
  });

  it('propagates export errors so notify.promise can handle 403 responses', async () => {
    fetchWithTenant.mockResolvedValue({
      ok: false,
      status: 403,
      blob: () => Promise.resolve(mockBlob),
      headers: { get: () => null },
    });

    const { result } = renderHook(() => useOrder(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.exportDocument('restricted-order-signs', 'pdf', 'Letreros de transporte (Restringidos)');
      })
    ).rejects.toThrow('Error al exportar');

    expect(notify.promise).toHaveBeenCalled();
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

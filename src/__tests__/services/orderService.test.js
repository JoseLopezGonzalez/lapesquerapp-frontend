/**
 * Unit tests for orderService
 * Tests getOrder, getActiveOrders, createOrder, updateOrder, setOrderStatus
 * Mocks fetchWithTenant to avoid real API calls
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOrder,
  getActiveOrders,
  createOrder,
  updateOrder,
  setOrderStatus,
} from '@/services/orderService';

// Mock fetchWithTenant
vi.mock('@lib/fetchWithTenant', () => ({
  fetchWithTenant: vi.fn(),
}));

// Mock getUserAgent to avoid server/client detection issues
vi.mock('@/lib/utils/getUserAgent', () => ({
  getUserAgent: () => 'Vitest-Test-User-Agent',
}));

// Mock next-auth getSession (used by createOrder)
vi.mock('next-auth/react', () => ({
  getSession: vi.fn(),
}));

// Import mocked module to configure
import { fetchWithTenant } from '@lib/fetchWithTenant';

describe('orderService', () => {
  const token = 'test-token-123';
  const mockOrder = {
    id: 1,
    customer: { id: 1, name: 'Cliente Test' },
    status: 'pending',
    loadDate: '2026-02-15',
    plannedProductDetails: [],
    pallets: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockJsonResponse = (data) => ({
    ok: true,
    headers: { get: (name) => (name === 'content-type' ? 'application/json' : null) },
    json: async () => data,
  });

  describe('getOrder', () => {
    it('fetches order by ID and returns order data', async () => {
      const orderId = 1;
      fetchWithTenant.mockResolvedValueOnce(mockJsonResponse({ data: mockOrder }));

      const result = await getOrder(orderId, token);

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining(`/orders/${orderId}`),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );
      expect(result).toEqual(mockOrder);
    });

    it('returns data.data when response has data wrapper', async () => {
      fetchWithTenant.mockResolvedValueOnce(mockJsonResponse({ data: mockOrder }));

      const result = await getOrder(1, token);
      expect(result).toEqual(mockOrder);
    });

    it('returns data directly when response has no data wrapper', async () => {
      fetchWithTenant.mockResolvedValueOnce(mockJsonResponse(mockOrder));

      const result = await getOrder(1, token);
      expect(result).toEqual(mockOrder);
    });

    it('throws error when request fails', async () => {
      fetchWithTenant.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Pedido no encontrado' }),
      });

      await expect(getOrder(999, token)).rejects.toThrow();
    });
  });

  describe('getActiveOrders', () => {
    it('fetches active orders and returns array', async () => {
      const mockOrders = [mockOrder, { ...mockOrder, id: 2 }];
      fetchWithTenant.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrders,
      });

      const result = await getActiveOrders(token);

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining('/orders/active'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );
      expect(result).toEqual(mockOrders);
    });

    it('returns data.data when response has data wrapper', async () => {
      const mockOrders = [mockOrder];
      fetchWithTenant.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockOrders }),
      });

      const result = await getActiveOrders(token);
      expect(result).toEqual(mockOrders);
    });

    it('returns empty array when data.data is not array', async () => {
      fetchWithTenant.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: null }),
      });

      const result = await getActiveOrders(token);
      expect(result).toEqual([]);
    });

    it('rejects when token is not provided', async () => {
      await expect(getActiveOrders()).rejects.toThrow(
        'No se proporcionó token de autenticación'
      );
      expect(fetchWithTenant).not.toHaveBeenCalled();
    });

    it('throws error when request fails', async () => {
      fetchWithTenant.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Error de servidor' }),
      });

      await expect(getActiveOrders(token)).rejects.toThrow();
    });
  });

  describe('updateOrder', () => {
    it('updates order with given data', async () => {
      const updateData = { status: 'confirmed' };
      const updatedOrder = { ...mockOrder, ...updateData };
      fetchWithTenant.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedOrder }),
      });

      const result = await updateOrder(1, updateData, token);

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining('/orders/1'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual(updatedOrder);
    });

    it('throws error when update fails', async () => {
      fetchWithTenant.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Error de validación' }),
      });

      await expect(updateOrder(1, { status: 'invalid' }, token)).rejects.toThrow();
    });
  });

  describe('setOrderStatus', () => {
    it('sets order status via PUT request', async () => {
      const status = 'finished';
      const updatedOrder = { ...mockOrder, status };
      fetchWithTenant.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedOrder }),
      });

      const result = await setOrderStatus(1, status, token);

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining('/orders/1/status'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status }),
        })
      );
      expect(result).toEqual(updatedOrder);
    });
  });

  describe('createOrder', () => {
    it('creates order with payload and returns created order', async () => {
      // createOrder uses getSession internally - we need to mock it
      const { getSession } = await import('next-auth/react');
      vi.mocked(getSession).mockResolvedValueOnce({
        user: { accessToken: token },
      });

      const payload = { customerId: 1, loadDate: '2026-02-15' };
      const createdOrder = { ...mockOrder, id: 42, ...payload };
      fetchWithTenant.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: createdOrder }),
      });

      const result = await createOrder(payload);

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining('/orders'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
          body: JSON.stringify(payload),
        })
      );
      expect(result).toEqual(createdOrder);
    });

    it('throws when no session', async () => {
      const { getSession } = await import('next-auth/react');
      vi.mocked(getSession).mockResolvedValueOnce(null);

      await expect(createOrder({})).rejects.toThrow(
        'No hay sesión autenticada'
      );
      expect(fetchWithTenant).not.toHaveBeenCalled();
    });
  });
});

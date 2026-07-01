/**
 * Unit tests for orderService
 * Tests getOrder, getActiveOrders, createOrder, updateOrder, setOrderStatus
 * Mocks fetchWithTenant to avoid real API calls
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createOrdersProfitabilityExportJob,
  downloadOrdersProfitabilityExportJob,
  getOrder,
  getOrderCostAnalysis,
  getActiveOrders,
  getOrdersProfitabilityExportJob,
  getOrdersProfitabilityProducts,
  getOrdersProfitabilitySummary,
  getOrdersProfitabilityTimeline,
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

// Mock getAuthToken (now used internally by migrated functions)
vi.mock('@/lib/auth/getAuthToken', () => ({
  getAuthToken: vi.fn().mockResolvedValue('test-token-123'),
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

      const result = await getOrder(orderId);

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

      const result = await getOrder(1);
      expect(result).toEqual(mockOrder);
    });

    it('returns data directly when response has no data wrapper', async () => {
      fetchWithTenant.mockResolvedValueOnce(mockJsonResponse(mockOrder));

      const result = await getOrder(1);
      expect(result).toEqual(mockOrder);
    });

    it('throws error when request fails', async () => {
      fetchWithTenant.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Pedido no encontrado' }),
      });

      await expect(getOrder(999)).rejects.toThrow();
    });
  });

  describe('getActiveOrders', () => {
    it('fetches active orders and returns array', async () => {
      const mockOrders = [mockOrder, { ...mockOrder, id: 2 }];
      fetchWithTenant.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrders,
      });

      const result = await getActiveOrders();

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

      const result = await getActiveOrders();
      expect(result).toEqual(mockOrders);
    });

    it('returns empty array when data.data is not array', async () => {
      fetchWithTenant.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: null }),
      });

      const result = await getActiveOrders();
      expect(result).toEqual([]);
    });

    it('throws error when request fails', async () => {
      fetchWithTenant.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Error de servidor' }),
      });

      await expect(getActiveOrders()).rejects.toThrow();
    });
  });

  describe('getOrderCostAnalysis', () => {
    it('fetches cost analysis by order id and returns data', async () => {
      const analysis = {
        summary: {
          totalRevenue: 100,
          totalCost: 80,
          grossMargin: 20,
          marginPercentage: 20,
        },
        byProductLine: [],
        byPallet: [],
      };

      fetchWithTenant.mockResolvedValueOnce(mockJsonResponse({ data: analysis }));

      const result = await getOrderCostAnalysis(1);

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining('/orders/1/cost-analysis'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );
      expect(result).toEqual(analysis);
    });
  });

  describe('profitability statistics', () => {
    it('fetches profitability summary with product filters', async () => {
      const summary = {
        period: { from: '2026-01-01', to: '2026-03-31' },
        ordersCount: 3,
        totalRevenue: 1500,
        totalCost: 1000,
        grossMargin: 500,
        marginPercentage: 33.33,
        coveredBoxes: 28,
        uncoveredBoxes: 6,
        costCoverageBoxesPct: 82.35,
      };

      fetchWithTenant.mockResolvedValueOnce(mockJsonResponse({ data: summary }));

      const result = await getOrdersProfitabilitySummary(
        {
          dateFrom: '2026-01-01',
          dateTo: '2026-03-31',
          productIds: [12, '18'],
        },
        token
      );

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining(
          'statistics/orders/profitability-summary?dateFrom=2026-01-01&dateTo=2026-03-31&productIds%5B%5D=12&productIds%5B%5D=18'
        ),
        expect.any(Object)
      );
      expect(result).toEqual(summary);
    });

    it('creates profitability export job with missing costs filter enabled', async () => {
      const job = {
        id: '8b84f421-3a64-4c34-b257-d7f96891d0c2',
        status: 'pending',
        filters: {
          dateFrom: '2025-12-31',
          dateTo: '2026-04-28',
          productIds: [],
          onlyMissingCosts: true,
        },
        filename: null,
        errorMessage: null,
        createdAt: '2026-04-28T14:55:00+00:00',
        startedAt: null,
        finishedAt: null,
        downloadUrl: null,
      };

      fetchWithTenant.mockResolvedValueOnce(mockJsonResponse(job));

      const result = await createOrdersProfitabilityExportJob(
        {
          dateFrom: '2025-12-31',
          dateTo: '2026-04-28',
          productIds: [],
        },
        token
      );

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining('statistics/orders/profitability-summary/export-jobs'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            dateFrom: '2025-12-31',
            dateTo: '2026-04-28',
            productIds: [],
            onlyMissingCosts: true,
          }),
        })
      );
      expect(result).toEqual(job);
    });

    it('fetches profitability export job status', async () => {
      const job = {
        id: 'job-1',
        status: 'processing',
        filters: {
          dateFrom: '2025-12-31',
          dateTo: '2026-04-28',
          productIds: [],
          onlyMissingCosts: true,
        },
        filename: null,
        errorMessage: null,
        createdAt: '2026-04-28T14:55:00+00:00',
        startedAt: '2026-04-28T14:55:05+00:00',
        finishedAt: null,
        downloadUrl: null,
      };

      fetchWithTenant.mockResolvedValueOnce(mockJsonResponse({ data: job }));

      const result = await getOrdersProfitabilityExportJob('job-1', token);

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining('statistics/orders/profitability-summary/export-jobs/job-1'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          }),
        })
      );
      expect(result).toEqual(job);
    });

    it('downloads profitability export job as a blob and reads filename header', async () => {
      const blob = new Blob(['xlsx'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      fetchWithTenant.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name) =>
            name.toLowerCase() === 'content-disposition'
              ? 'attachment; filename="rentabilidad_test.xlsx"'
              : null,
        },
        blob: async () => blob,
      });

      const result = await downloadOrdersProfitabilityExportJob(
        '/api/v2/statistics/orders/profitability-summary/export-jobs/job-1/download',
        token
      );

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining(
          'statistics/orders/profitability-summary/export-jobs/job-1/download'
        ),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }),
        })
      );
      expect(result).toEqual({
        blob,
        filename: 'rentabilidad_test.xlsx',
      });
    });

    it('fetches profitability timeline with granularity and omits all product filter', async () => {
      const timeline = {
        granularity: 'week',
        series: [],
      };

      fetchWithTenant.mockResolvedValueOnce(mockJsonResponse({ data: timeline }));

      const result = await getOrdersProfitabilityTimeline(
        {
          dateFrom: '2026-01-01',
          dateTo: '2026-03-31',
          granularity: 'week',
          productIds: ['all'],
        },
        token
      );

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining(
          'statistics/orders/profitability-timeline?dateFrom=2026-01-01&dateTo=2026-03-31&granularity=week'
        ),
        expect.any(Object)
      );
      expect(fetchWithTenant.mock.calls[0][0]).not.toContain('productIds%5B%5D=all');
      expect(result).toEqual(timeline);
    });

    it('fetches profitability products stats', async () => {
      const products = {
        period: { from: '2026-01-01', to: '2026-03-31' },
        products: [],
      };

      fetchWithTenant.mockResolvedValueOnce(mockJsonResponse({ data: products }));

      const result = await getOrdersProfitabilityProducts(
        {
          dateFrom: '2026-01-01',
          dateTo: '2026-03-31',
        },
        token
      );

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining(
          'statistics/orders/profitability-products?dateFrom=2026-01-01&dateTo=2026-03-31'
        ),
        expect.any(Object)
      );
      expect(result).toEqual(products);
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

      const result = await updateOrder(1, updateData);

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

      await expect(updateOrder(1, { status: 'invalid' })).rejects.toThrow();
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

      const result = await setOrderStatus(1, status);

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
      const { getAuthToken } = await import('@/lib/auth/getAuthToken');
      vi.mocked(getAuthToken).mockRejectedValueOnce(new Error('No hay sesión autenticada'));

      await expect(createOrder({})).rejects.toThrow('No hay sesión autenticada');
      expect(fetchWithTenant).not.toHaveBeenCalled();
    });
  });
});

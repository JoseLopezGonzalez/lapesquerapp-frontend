/**
 * Unit tests for storeService
 * Tests getTotalStockStats, getStockBySpeciesStats, getStockByProducts
 * Mocks fetchWithTenant to avoid real API calls
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getTotalStockStats,
  getStockBySpeciesStats,
  getStockByProducts,
} from '@/services/storeService';

vi.mock('@lib/fetchWithTenant', () => ({
  fetchWithTenant: vi.fn(),
}));

vi.mock('@/lib/utils/getUserAgent', () => ({
  getUserAgent: () => 'Vitest-Test-User-Agent',
}));

import { fetchWithTenant } from '@lib/fetchWithTenant';

describe('storeService', () => {
  const token = 'test-token-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockJsonResponse = (data) => ({
    ok: true,
    json: async () => data,
  });

  describe('getTotalStockStats', () => {
    it('fetches total stock stats and returns data', async () => {
      const mockStats = {
        totalNetWeight: 50000,
        totalPallets: 500,
        totalBoxes: 3500,
        totalStores: 3,
      };
      fetchWithTenant.mockResolvedValueOnce(mockJsonResponse(mockStats));

      const result = await getTotalStockStats(token);

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining('statistics/stock/total'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );
      expect(result).toEqual(mockStats);
    });

    it('throws on API error', async () => {
      fetchWithTenant.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Unauthorized', userMessage: 'No autorizado' }),
      });

      await expect(getTotalStockStats(token)).rejects.toThrow();
    });
  });

  describe('getStockBySpeciesStats', () => {
    it('fetches stock by species and returns data', async () => {
      const mockData = [
        { id: 1, name: 'Especie A', totalNetWeight: 25000, percentage: 50 },
        { id: 2, name: 'Especie B', totalNetWeight: 25000, percentage: 50 },
      ];
      fetchWithTenant.mockResolvedValueOnce(mockJsonResponse(mockData));

      const result = await getStockBySpeciesStats(token);

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining('statistics/stock/total-by-species'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('throws on API error', async () => {
      fetchWithTenant.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Server error' }),
      });

      await expect(getStockBySpeciesStats(token)).rejects.toThrow();
    });
  });

  describe('getStockByProducts', () => {
    it('fetches stock by products and returns data', async () => {
      const mockData = [
        { id: 1, name: 'Producto A', total_kg: 10000, percentage: 33.3 },
        { id: 2, name: 'Producto B', total_kg: 20000, percentage: 66.7 },
      ];
      fetchWithTenant.mockResolvedValueOnce(mockJsonResponse(mockData));

      const result = await getStockByProducts(token);

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining('stores/total-stock-by-products'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('handles wrapped response with data property', async () => {
      const mockData = [
        { product_id: 1, product_name: 'Producto A', total_quantity: 10000 },
      ];
      fetchWithTenant.mockResolvedValueOnce(mockJsonResponse({ data: mockData }));

      const result = await getStockByProducts(token);

      expect(result).toEqual({ data: mockData });
    });

    it('throws on API error', async () => {
      fetchWithTenant.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Server error' }),
      });

      await expect(getStockByProducts(token)).rejects.toThrow();
    });
  });
});

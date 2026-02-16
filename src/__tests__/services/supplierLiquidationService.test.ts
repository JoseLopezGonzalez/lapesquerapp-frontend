/**
 * Unit tests for supplierLiquidationService (Bloque 6)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSuppliersWithActivity,
  getSupplierLiquidationDetails,
} from '@/services/domain/supplier-liquidations/supplierLiquidationService';

vi.mock('@/lib/auth/getAuthToken', () => ({
  getAuthToken: vi.fn(() => Promise.resolve('test-token')),
}));
vi.mock('@/lib/fetchWithTenant', () => ({ fetchWithTenant: vi.fn() }));
vi.mock('@/lib/utils/getUserAgent', () => ({ getUserAgent: vi.fn(() => 'TestAgent') }));

import { fetchWithTenant } from '@/lib/fetchWithTenant';

describe('supplierLiquidationService', () => {
  beforeEach(() => {
    vi.mocked(fetchWithTenant).mockReset();
  });

  it('getSuppliersWithActivity calls API and returns data', async () => {
    const mockData = [
      {
        id: 1,
        name: 'Proveedor A',
        receptions_count: 5,
        dispatches_count: 2,
        total_receptions_weight: 1000,
        total_dispatches_weight: 500,
        total_receptions_amount: 5000,
        total_dispatches_amount: 2500,
      },
    ];
    vi.mocked(fetchWithTenant).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockData }),
    } as Response);

    const result = await getSuppliersWithActivity('2024-01-01', '2024-01-31');

    expect(fetchWithTenant).toHaveBeenCalledWith(
      expect.stringContaining('supplier-liquidations/suppliers'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
    expect(result).toEqual(mockData);
  });

  it('getSuppliersWithActivity returns data.data when present', async () => {
    const mockData = [{ id: 1, name: 'P' }];
    vi.mocked(fetchWithTenant).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockData }),
    } as Response);

    const result = await getSuppliersWithActivity('2024-01-01', '2024-01-31');
    expect(result).toEqual(mockData);
  });

  it('getSupplierLiquidationDetails calls API and returns details', async () => {
    const mockDetails = {
      supplier: { id: 1, name: 'Proveedor A' },
      date_range: { start: '2024-01-01', end: '2024-01-31' },
      receptions: [],
      dispatches: [],
    };
    vi.mocked(fetchWithTenant).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockDetails }),
    } as Response);

    const result = await getSupplierLiquidationDetails(1, '2024-01-01', '2024-01-31');

    expect(fetchWithTenant).toHaveBeenCalledWith(
      expect.stringContaining('supplier-liquidations/1/details'),
      expect.any(Object)
    );
    expect(result).toEqual(mockDetails);
  });

  it('getSuppliersWithActivity throws on API error', async () => {
    vi.mocked(fetchWithTenant).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({}),
    } as Response);

    await expect(getSuppliersWithActivity('2024-01-01', '2024-01-31')).rejects.toThrow();
  });
});

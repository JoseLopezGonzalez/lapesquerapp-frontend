/**
 * Unit tests for getReceptionChartData
 * Mocks fetchWithTenant to avoid real API calls
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getReceptionChartData } from '@/services/rawMaterialReception/getReceptionChartData';

vi.mock('@lib/fetchWithTenant', () => ({
  fetchWithTenant: vi.fn(),
}));

vi.mock('@/lib/utils/getUserAgent', () => ({
  getUserAgent: () => 'Vitest-Test-User-Agent',
}));

import { fetchWithTenant } from '@lib/fetchWithTenant';

describe('getReceptionChartData', () => {
  const token = 'test-token-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches reception chart data and returns array', async () => {
    const mockData = [{ label: '2024-01', value: 100 }];
    (fetchWithTenant as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await getReceptionChartData({
      token,
      from: '2024-01-01',
      to: '2024-01-31',
      unit: 'quantity',
      groupBy: 'month',
    });

    expect(fetchWithTenant).toHaveBeenCalledWith(
      expect.stringContaining('raw-material-receptions/reception-chart-data'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: `Bearer ${token}`,
        }),
      })
    );
    expect(result).toEqual(mockData);
  });

  it('extracts data from response.data when backend wraps in data key', async () => {
    const mockData = [{ label: '2024-02', value: 200 }];
    (fetchWithTenant as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockData }),
    });

    const result = await getReceptionChartData({
      token,
      from: '2024-02-01',
      to: '2024-02-29',
      unit: 'quantity',
      groupBy: 'month',
    });

    expect(result).toEqual(mockData);
  });

  it('appends optional filters to query string', async () => {
    (fetchWithTenant as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await getReceptionChartData({
      token,
      speciesId: '1',
      categoryId: '2',
      familyId: '3',
      from: '2024-01-01',
      to: '2024-01-31',
      unit: 'amount',
      groupBy: 'week',
    });

    const callUrl = (fetchWithTenant as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callUrl).toContain('speciesId=1');
    expect(callUrl).toContain('categoryId=2');
    expect(callUrl).toContain('familyId=3');
    expect(callUrl).toContain('valueType=amount');
    expect(callUrl).toContain('groupBy=week');
  });

  it('throws on API error', async () => {
    (fetchWithTenant as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Server error' }),
    });

    await expect(
      getReceptionChartData({
        token,
        from: '2024-01-01',
        to: '2024-01-31',
        unit: 'quantity',
        groupBy: 'month',
      })
    ).rejects.toThrow();
  });
});

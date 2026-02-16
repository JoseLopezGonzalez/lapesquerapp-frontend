/**
 * Unit tests for supplierService (Bloque 6)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supplierService } from '@/services/domain/suppliers/supplierService';

vi.mock('@/lib/auth/getAuthToken', () => ({
  getAuthToken: vi.fn(() => Promise.resolve('test-token')),
}));
vi.mock('@/services/generic/entityService', () => ({
  fetchEntitiesGeneric: vi.fn(),
  deleteEntityGeneric: vi.fn(),
}));
vi.mock('@/services/generic/createEntityService', () => ({ createEntityGeneric: vi.fn() }));
vi.mock('@/services/generic/editEntityService', () => ({
  fetchEntityDataGeneric: vi.fn(),
  submitEntityFormGeneric: vi.fn(),
  fetchAutocompleteOptionsGeneric: vi.fn(),
}));

import { fetchEntitiesGeneric, deleteEntityGeneric } from '@/services/generic/entityService';
import { fetchEntityDataGeneric, fetchAutocompleteOptionsGeneric } from '@/services/generic/editEntityService';

describe('supplierService', () => {
  const mockListResponse = {
    data: [{ id: 1, name: 'Proveedor A' }],
    meta: { current_page: 1, last_page: 1, total: 1, per_page: 12 },
  };

  beforeEach(() => {
    vi.mocked(fetchEntitiesGeneric).mockReset();
    vi.mocked(deleteEntityGeneric).mockReset();
    vi.mocked(fetchEntityDataGeneric).mockReset();
    vi.mocked(fetchAutocompleteOptionsGeneric).mockReset();
  });

  it('list calls fetchEntitiesGeneric', async () => {
    vi.mocked(fetchEntitiesGeneric).mockResolvedValueOnce(mockListResponse as never);
    const result = await supplierService.list({}, { page: 1, perPage: 12 });
    expect(fetchEntitiesGeneric).toHaveBeenCalledWith(
      expect.stringContaining('/suppliers'),
      'test-token'
    );
    expect(result.data).toHaveLength(1);
  });

  it('getById fetches supplier', async () => {
    const supplier = { id: 1, name: 'Proveedor A' };
    vi.mocked(fetchEntityDataGeneric).mockResolvedValueOnce(supplier as never);
    const result = await supplierService.getById(1);
    expect(fetchEntityDataGeneric).toHaveBeenCalledWith(
      expect.stringContaining('/suppliers/1'),
      'test-token'
    );
    expect(result).toEqual(supplier);
  });

  it('getOptions returns autocomplete options', async () => {
    const options = [{ value: 1, label: 'Proveedor A' }];
    vi.mocked(fetchAutocompleteOptionsGeneric).mockResolvedValueOnce(options as never);
    const result = await supplierService.getOptions();
    expect(fetchAutocompleteOptionsGeneric).toHaveBeenCalledWith(
      expect.stringContaining('/suppliers/options'),
      'test-token'
    );
    expect(result).toEqual(options);
  });

  it('delete calls deleteEntityGeneric', async () => {
    vi.mocked(deleteEntityGeneric).mockResolvedValueOnce({ response: {} as Response, data: {} } as never);
    await supplierService.delete(1);
    expect(deleteEntityGeneric).toHaveBeenCalledWith(
      expect.stringContaining('/suppliers/1'),
      undefined,
      'test-token'
    );
  });
});

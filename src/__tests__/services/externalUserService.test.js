import { describe, it, expect, vi, beforeEach } from 'vitest';
import { externalUserService } from '@/services/domain/external-users/externalUserService';

vi.mock('@/lib/auth/getAuthToken', () => ({
  getAuthToken: vi.fn(() => Promise.resolve('test-token')),
}));
vi.mock('@/lib/fetchWithTenant', () => ({ fetchWithTenant: vi.fn() }));
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

import { fetchEntitiesGeneric } from '@/services/generic/entityService';
import { fetchAutocompleteOptionsGeneric } from '@/services/generic/editEntityService';
import { fetchWithTenant } from '@/lib/fetchWithTenant';

describe('externalUserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists external users through generic entity service', async () => {
    vi.mocked(fetchEntitiesGeneric).mockResolvedValueOnce({ data: [{ id: 1, name: 'Ext' }] });

    const result = await externalUserService.list({}, { page: 1, perPage: 12 });

    expect(fetchEntitiesGeneric).toHaveBeenCalledWith(
      expect.stringContaining('/external-users?page=1&perPage=12'),
      'test-token'
    );
    expect(result.data).toHaveLength(1);
  });

  it('falls back to list when /options is unavailable', async () => {
    vi.mocked(fetchAutocompleteOptionsGeneric).mockRejectedValueOnce({ status: 404 });
    vi.mocked(fetchEntitiesGeneric).mockResolvedValueOnce({
      data: [{ id: 7, name: 'Maquila Sur' }],
    });

    const result = await externalUserService.getOptions();

    expect(result).toEqual([{ value: 7, label: 'Maquila Sur' }]);
  });

  it('calls resend-access action endpoint', async () => {
    vi.mocked(fetchWithTenant).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Enviado' }),
    });

    const result = await externalUserService.resendAccess(3);

    expect(fetchWithTenant).toHaveBeenCalledWith(
      expect.stringContaining('/external-users/3/resend-access'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.message).toBe('Enviado');
  });
});

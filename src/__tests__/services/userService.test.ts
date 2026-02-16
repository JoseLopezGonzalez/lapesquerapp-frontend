/**
 * Unit tests for userService (Bloque 11)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '@/services/domain/users/userService';

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

import { fetchEntitiesGeneric, deleteEntityGeneric } from '@/services/generic/entityService';
import { fetchEntityDataGeneric, fetchAutocompleteOptionsGeneric } from '@/services/generic/editEntityService';
import { fetchWithTenant } from '@/lib/fetchWithTenant';

describe('userService', () => {
  const mockListResponse = {
    data: [{ id: 1, name: 'User 1', email: 'u1@test.com', role: 'admin' }],
    meta: { current_page: 1, last_page: 1, total: 1, per_page: 12 },
  };

  beforeEach(() => {
    vi.mocked(fetchEntitiesGeneric).mockReset();
    vi.mocked(deleteEntityGeneric).mockReset();
    vi.mocked(fetchEntityDataGeneric).mockReset();
    vi.mocked(fetchAutocompleteOptionsGeneric).mockReset();
    vi.mocked(fetchWithTenant).mockReset();
  });

  it('list calls fetchEntitiesGeneric', async () => {
    vi.mocked(fetchEntitiesGeneric).mockResolvedValueOnce(mockListResponse as never);
    const result = await userService.list({}, { page: 1, perPage: 12 });
    expect(fetchEntitiesGeneric).toHaveBeenCalledWith(expect.stringContaining('/users'), 'test-token');
    expect(result.data).toHaveLength(1);
  });

  it('getById fetches user', async () => {
    const user = { id: 1, name: 'Test', email: 'test@test.com' };
    vi.mocked(fetchEntityDataGeneric).mockResolvedValueOnce(user as never);
    const result = await userService.getById(1);
    expect(fetchEntityDataGeneric).toHaveBeenCalledWith(expect.stringContaining('/users/1'), 'test-token');
    expect(result).toEqual(user);
  });

  it('getOptions returns autocomplete options', async () => {
    const options = [{ value: 1, label: 'Admin' }];
    vi.mocked(fetchAutocompleteOptionsGeneric).mockResolvedValueOnce(options as never);
    const result = await userService.getOptions();
    expect(fetchAutocompleteOptionsGeneric).toHaveBeenCalledWith(expect.stringContaining('/users/options'), 'test-token');
    expect(result).toEqual(options);
  });

  it('resendInvitation calls POST and returns message', async () => {
    vi.mocked(fetchWithTenant).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Enviado' }),
    } as Response);
    const result = await userService.resendInvitation(5);
    expect(fetchWithTenant).toHaveBeenCalledWith(expect.stringContaining('/users/5/resend-invitation'), expect.objectContaining({ method: 'POST' }));
    expect(result.message).toBe('Enviado');
  });

  it('delete calls deleteEntityGeneric', async () => {
    vi.mocked(deleteEntityGeneric).mockResolvedValueOnce({ response: {} as Response, data: {} } as never);
    await userService.delete(1);
    expect(deleteEntityGeneric).toHaveBeenCalledWith(expect.stringContaining('/users/1'), undefined, 'test-token');
  });
});

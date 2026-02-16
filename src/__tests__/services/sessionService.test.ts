/**
 * Unit tests for sessionService (Bloque 11 — Usuarios y sesiones)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sessionService } from '@/services/domain/sessions/sessionService';

vi.mock('@/lib/auth/getAuthToken', () => ({
  getAuthToken: vi.fn(() => Promise.resolve('test-token')),
}));

vi.mock('@/services/generic/entityService', () => ({
  fetchEntitiesGeneric: vi.fn(),
  deleteEntityGeneric: vi.fn(),
}));

vi.mock('@/services/generic/editEntityService', () => ({
  fetchEntityDataGeneric: vi.fn(),
  fetchAutocompleteOptionsGeneric: vi.fn(),
}));

import { fetchEntitiesGeneric, deleteEntityGeneric } from '@/services/generic/entityService';
import { fetchEntityDataGeneric, fetchAutocompleteOptionsGeneric } from '@/services/generic/editEntityService';

describe('sessionService', () => {
  const mockListResponse = {
    data: [{ id: 's1', user_name: 'Admin', created_at: '2026-01-01' }],
    meta: { current_page: 1, last_page: 1, total: 1, per_page: 15 },
  };

  beforeEach(() => {
    vi.mocked(fetchEntitiesGeneric).mockReset();
    vi.mocked(deleteEntityGeneric).mockReset();
    vi.mocked(fetchEntityDataGeneric).mockReset();
    vi.mocked(fetchAutocompleteOptionsGeneric).mockReset();
  });

  describe('list', () => {
    it('calls fetchEntitiesGeneric with filters and pagination', async () => {
      vi.mocked(fetchEntitiesGeneric).mockResolvedValueOnce(mockListResponse as never);

      const result = await sessionService.list({}, { page: 1, perPage: 15 });

      expect(fetchEntitiesGeneric).toHaveBeenCalledWith(
        expect.stringContaining('/sessions'),
        'test-token'
      );
      expect(result.data).toHaveLength(1);
      expect(result.meta.per_page).toBe(15);
    });
  });

  describe('getById', () => {
    it('fetches session by id', async () => {
      const session = { id: 's1', user_name: 'Admin' };
      vi.mocked(fetchEntityDataGeneric).mockResolvedValueOnce(session as never);

      const result = await sessionService.getById('s1');

      expect(fetchEntityDataGeneric).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/s1'),
        'test-token'
      );
      expect(result).toEqual(session);
    });
  });

  describe('getOptions', () => {
    it('returns options for autocomplete', async () => {
      const options = [{ value: 's1', label: 'Session 1' }];
      vi.mocked(fetchAutocompleteOptionsGeneric).mockResolvedValueOnce(options as never);

      const result = await sessionService.getOptions();

      expect(fetchAutocompleteOptionsGeneric).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/options'),
        'test-token'
      );
      expect(result).toEqual(options);
    });
  });

  describe('delete', () => {
    it('calls deleteEntityGeneric', async () => {
      vi.mocked(deleteEntityGeneric).mockResolvedValueOnce({
        response: {} as Response,
        data: {},
      } as never);

      await sessionService.delete('s1');

      expect(deleteEntityGeneric).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/s1'),
        undefined,
        'test-token'
      );
    });
  });
});

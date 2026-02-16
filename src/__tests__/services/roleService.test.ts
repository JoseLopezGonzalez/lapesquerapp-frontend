/**
 * Unit tests for roleService (Bloque 11 — Usuarios y sesiones)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { roleService } from '@/services/domain/roles/roleService';

vi.mock('@/lib/auth/getAuthToken', () => ({
  getAuthToken: vi.fn(() => Promise.resolve('test-token')),
}));

vi.mock('@/services/generic/editEntityService', () => ({
  fetchAutocompleteOptionsGeneric: vi.fn(),
}));

import { fetchAutocompleteOptionsGeneric } from '@/services/generic/editEntityService';

describe('roleService', () => {
  beforeEach(() => {
    vi.mocked(fetchAutocompleteOptionsGeneric).mockReset();
  });

  describe('getOptions', () => {
    it('calls fetchAutocompleteOptionsGeneric with roles/options URL', async () => {
      const options = [
        { value: 1, label: 'Administrador' },
        { value: 2, label: 'Operario' },
      ];
      vi.mocked(fetchAutocompleteOptionsGeneric).mockResolvedValueOnce(options as never);

      const result = await roleService.getOptions();

      expect(fetchAutocompleteOptionsGeneric).toHaveBeenCalledWith(
        expect.stringContaining('/roles/options'),
        'test-token'
      );
      expect(result).toEqual(options);
      expect(result).toHaveLength(2);
    });
  });
});

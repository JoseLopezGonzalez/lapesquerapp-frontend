/**
 * Unit tests for settingsService
 * Mocks fetchWithTenant and next-auth getSession
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSettings, updateSettings } from '@/services/settingsService';
import { fetchWithTenant } from '@lib/fetchWithTenant';
import { getSession } from 'next-auth/react';

vi.mock('@lib/fetchWithTenant', () => ({
  fetchWithTenant: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/utils/getUserAgent', () => ({
  getUserAgent: () => 'Vitest-Test-User-Agent',
}));

function mockJsonResponse<T>(
  data: T,
  ok = true,
  status = 200
): { ok: boolean; status: number; json: () => Promise<T> } {
  return {
    ok,
    status,
    json: async () => data,
  };
}

describe('settingsService', () => {
  const mockSettings = {
    'company.name': 'Test Empresa',
    'company.cif': 'B12345678',
    'company.mail.host': 'smtp.example.com',
    'company.mail.port': '587',
  };

  const mockSession = {
    user: { accessToken: 'test-token-123' },
  };

  beforeEach(() => {
    vi.mocked(fetchWithTenant).mockReset();
    vi.mocked(getSession).mockResolvedValue(mockSession as never);
  });

  describe('getSettings', () => {
    it('fetches settings and returns data', async () => {
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse(mockSettings)
      );

      const result = await getSettings();

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining('/settings'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      );
      expect(result).toEqual(mockSettings);
    });

    it('returns null on 401', async () => {
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse({}, false, 401)
      );

      const result = await getSettings();
      expect(result).toBeNull();
    });

    it('returns null on 403', async () => {
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse({}, false, 403)
      );

      const result = await getSettings();
      expect(result).toBeNull();
    });

    it('throws when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null as never);

      await expect(getSettings()).rejects.toThrow('No autenticado');
      expect(fetchWithTenant).not.toHaveBeenCalled();
    });

    it('throws when session has no accessToken', async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        user: {},
      } as never);

      await expect(getSettings()).rejects.toThrow('No autenticado');
    });

    it('throws on 5xx error', async () => {
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse({}, false, 500)
      );

      await expect(getSettings()).rejects.toThrow(
        'Error al obtener configuración'
      );
    });
  });

  describe('updateSettings', () => {
    it('updates settings and returns data', async () => {
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse({ ...mockSettings, 'company.name': 'Updated' })
      );

      const result = await updateSettings({
        ...mockSettings,
        'company.name': 'Updated',
      });

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining('/settings'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
          body: expect.stringContaining('Updated'),
        })
      );
      expect(result).toEqual(
        expect.objectContaining({ 'company.name': 'Updated' })
      );
    });

    it('returns authError object on 401', async () => {
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse({}, false, 401)
      );

      const result = await updateSettings(mockSettings);
      expect(result).toEqual({ success: false, authError: true });
    });

    it('returns authError object on 403', async () => {
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse({}, false, 403)
      );

      const result = await updateSettings(mockSettings);
      expect(result).toEqual({ success: false, authError: true });
    });

    it('throws with userMessage on backend error', async () => {
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse(
          { message: 'Mail incomplete', userMessage: 'Configuración de email incompleta' },
          false,
          422
        )
      );

      await expect(updateSettings(mockSettings)).rejects.toMatchObject({
        message: 'Mail incomplete',
        userMessage: 'Configuración de email incompleta',
      });
    });

    it('throws when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null as never);

      await expect(updateSettings(mockSettings)).rejects.toThrow(
        'No autenticado'
      );
    });
  });
});

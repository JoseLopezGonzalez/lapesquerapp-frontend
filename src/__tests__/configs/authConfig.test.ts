/**
 * Unit tests for authConfig
 * isAuthError, isAuthStatusCode, buildLoginUrl
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AUTH_ERROR_CONFIG,
  isAuthError,
  isAuthStatusCode,
  buildLoginUrl,
} from "@/configs/authConfig";

describe("authConfig", () => {
  const fakeWindow = { location: { origin: "https://app.example.com" } };

  beforeEach(() => {
    vi.stubGlobal("window", fakeWindow);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isAuthError', () => {
    it('returns false for null/undefined', () => {
      expect(isAuthError(null)).toBe(false);
      expect(isAuthError(undefined)).toBe(false);
    });

    it('returns true when error.code is UNAUTHENTICATED', () => {
      expect(isAuthError({ code: 'UNAUTHENTICATED' } as Error)).toBe(true);
    });

    it('returns false when error has no message', () => {
      expect(isAuthError({} as Error)).toBe(false);
    });

    it('returns true when message contains an AUTH_ERROR_MESSAGE', () => {
      expect(isAuthError(new Error('No autenticado'))).toBe(true);
      expect(isAuthError(new Error('Unauthorized access'))).toBe(true);
      expect(isAuthError(new Error('Sesión expirada'))).toBe(true);
      expect(isAuthError(new Error('Token expired'))).toBe(true);
      expect(isAuthError(new Error('Invalid token'))).toBe(true);
    });

    it('returns false when message does not match', () => {
      expect(isAuthError(new Error('Not found'))).toBe(false);
      expect(isAuthError(new Error('Validation failed'))).toBe(false);
    });

    it('is case insensitive', () => {
      expect(isAuthError(new Error('UNAUTHORIZED'))).toBe(true);
      expect(isAuthError(new Error('session expired'))).toBe(true);
    });
  });

  describe('isAuthStatusCode', () => {
    it('returns true for 401 and 403', () => {
      expect(isAuthStatusCode(401)).toBe(true);
      expect(isAuthStatusCode(403)).toBe(true);
    });

    it('returns false for other status codes', () => {
      expect(isAuthStatusCode(200)).toBe(false);
      expect(isAuthStatusCode(404)).toBe(false);
      expect(isAuthStatusCode(500)).toBe(false);
    });
  });

  describe("buildLoginUrl", () => {
    it("returns default login URL when no path", () => {
      const url = buildLoginUrl('');
      expect(url).toContain(AUTH_ERROR_CONFIG.DEFAULT_LOGIN_URL);
      expect(url).toContain('https://app.example.com');
      expect(new URL(url).searchParams.get(AUTH_ERROR_CONFIG.FROM_PARAM)).toBeNull();
    });

    it("adds from param when currentPath provided", () => {
      const url = buildLoginUrl('/admin/orders');
      expect(url).toContain(AUTH_ERROR_CONFIG.DEFAULT_LOGIN_URL);
      expect(new URL(url).searchParams.get(AUTH_ERROR_CONFIG.FROM_PARAM)).toBe(
        '/admin/orders'
      );
    });

    it("handles path with query string", () => {
      const url = buildLoginUrl('/admin?page=1');
      expect(new URL(url).searchParams.get(AUTH_ERROR_CONFIG.FROM_PARAM)).toBe(
        '/admin?page=1'
      );
    });
  });
});

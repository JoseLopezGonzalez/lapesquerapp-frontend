/**
 * Unit tests for authService
 * Mocks fetchWithTenant and next-auth getSession
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  requestAccess,
  requestOtp,
  verifyOtp,
  verifyMagicLinkToken,
  logout,
  getCurrentUser,
} from "@/services/authService";
import { fetchWithTenant } from "@lib/fetchWithTenant";
import { getSession } from "next-auth/react";

vi.mock("@lib/fetchWithTenant", () => ({
  fetchWithTenant: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  getSession: vi.fn(),
}));

function mockJsonResponse(
  data: unknown,
  ok = true,
  status = 200
): { ok: boolean; status: number; headers: { get: () => string | null }; json: () => Promise<unknown> } {
  return {
    ok,
    status,
    headers: { get: () => (ok ? "application/json" : null) },
    json: async () => data,
  };
}

describe("authService", () => {
  beforeEach(() => {
    vi.mocked(fetchWithTenant).mockReset();
    vi.mocked(getSession).mockReset();
  });

  describe("requestAccess", () => {
    it("returns message on success", async () => {
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse({ message: "Código enviado" })
      );

      const result = await requestAccess("user@example.com");

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining("auth/request-access"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "user@example.com" }),
        })
      );
      expect(result).toEqual({ message: "Código enviado" });
    });

    it("throws throttle message on 429", async () => {
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse({}, false, 429)
      );

      await expect(requestAccess("user@example.com")).rejects.toThrow(
        "Demasiados intentos"
      );
    });

    it("throws backend message when not ok (prefers message over userMessage)", async () => {
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse(
          { message: "Email no registrado", userMessage: "Correo no válido" },
          false,
          400
        )
      );

      await expect(requestAccess("bad@example.com")).rejects.toThrow(
        "Email no registrado"
      );
    });
  });

  describe("requestOtp", () => {
    it("calls otp/request and returns on success", async () => {
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse({ message: "Código enviado" })
      );

      const result = await requestOtp("user@example.com");

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining("auth/otp/request"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "user@example.com" }),
        })
      );
      expect(result).toEqual({ message: "Código enviado" });
    });

    it("throws on backend error", async () => {
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse({ message: "Error" }, false, 500)
      );

      await expect(requestOtp("user@example.com")).rejects.toThrow();
    });
  });

  describe("verifyOtp", () => {
    it("returns access_token and user on success", async () => {
      const mockUser = { id: 1, email: "u@e.com", role: "tecnico" };
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse({ access_token: "token-123", user: mockUser })
      );

      const result = await verifyOtp("u@e.com", "123456");

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining("auth/otp/verify"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "u@e.com", code: "123456" }),
        })
      );
      expect(result).toEqual({ access_token: "token-123", user: mockUser });
    });

    it("throws error with status and data when not ok (prefers message over userMessage)", async () => {
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse(
          { message: "Código expirado", userMessage: "Solicita uno nuevo" },
          false,
          400
        )
      );

      try {
        await verifyOtp("u@e.com", "000000");
        expect.fail("should have thrown");
      } catch (err: unknown) {
        const e = err as { message: string; status?: number; data?: unknown };
        expect(e.message).toBe("Código expirado");
        expect(e.status).toBe(400);
        expect(e.data).toBeDefined();
      }
    });
  });

  describe("verifyMagicLinkToken", () => {
    it("returns access_token and user on success", async () => {
      const mockUser = { id: 1, email: "u@e.com", role: "administrador" };
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse({ access_token: "magic-token", user: mockUser })
      );

      const result = await verifyMagicLinkToken("magic-token-xyz");

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining("auth/magic-link/verify"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ token: "magic-token-xyz" }),
        })
      );
      expect(result).toEqual({ access_token: "magic-token", user: mockUser });
    });

    it("throws throttle message on 429", async () => {
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse({}, false, 429)
      );

      await expect(verifyMagicLinkToken("invalid")).rejects.toThrow(
        "Demasiados intentos"
      );
    });
  });

  describe("logout", () => {
    it("returns { ok: true } when no session", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const result = await logout();

      expect(fetchWithTenant).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });

    it("calls backend logout when session has token", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        user: { accessToken: "token-xyz" },
      } as never);
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(mockJsonResponse({}));

      const result = await logout();

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining("logout"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer token-xyz",
          }),
        })
      );
      expect(result).toBeDefined();
    });

    it("returns without throwing when backend fails", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        user: { accessToken: "token" },
      } as never);
      vi.mocked(fetchWithTenant).mockRejectedValueOnce(new Error("Network error"));

      const result = await logout();

      expect(result).toEqual({ ok: false });
    });
  });

  describe("getCurrentUser", () => {
    it("returns user data when response has data wrapper", async () => {
      const mockUser = { id: 1, email: "u@e.com", name: "User" };
      vi.mocked(getSession).mockResolvedValueOnce({
        user: { accessToken: "token" },
      } as never);
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse({ data: mockUser })
      );

      const result = await getCurrentUser();

      expect(fetchWithTenant).toHaveBeenCalledWith(
        expect.stringContaining("/me"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer token",
          }),
        })
      );
      expect(result).toEqual(mockUser);
    });

    it("returns user when response is user directly", async () => {
      const mockUser = { id: 2, email: "a@b.com" };
      vi.mocked(getSession).mockResolvedValueOnce({
        user: { accessToken: "t" },
      } as never);
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse(mockUser)
      );

      const result = await getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it("throws when no session", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);

      await expect(getCurrentUser()).rejects.toThrow(
        "No hay sesión autenticada"
      );
      expect(fetchWithTenant).not.toHaveBeenCalled();
    });

    it("throws when response not ok", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        user: { accessToken: "t" },
      } as never);
      vi.mocked(fetchWithTenant).mockResolvedValueOnce(
        mockJsonResponse({}, false, 401)
      );

      await expect(getCurrentUser()).rejects.toMatchObject({ status: 401 });
    });
  });
});

"use client";

import { useCallback, useEffect, type ClipboardEvent } from "react";
import { signIn } from "next-auth/react";import { requestAccess, verifyOtp } from "@/services/authService";
import { notify } from "@/lib/notifications";
import { getRedirectUrl } from "@/utils/loginUtils";

export interface UseLoginActionsParams {
  email: string;
  accessRequested: boolean;
  setEmail: (value: string) => void;
  setAccessRequested: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setCodeValue: (value: string) => void;
}

interface AccederData {
  email?: string;
}

interface VerifyOtpData {
  code?: string;
}

interface AuthErrorLike {
  message?: string;
  data?: { message?: string; userMessage?: string };
}

/**
 * Hook con los handlers del flujo login. Espera datos del formulario (validados con Zod):
 * handleAcceder(data) con data.email, handleVerifyOtp(data) con data.code (email viene de closure).
 * setCodeValue se usa para pegar OTP y para el efecto de portapapeles.
 */
export function useLoginActions({
  email,
  accessRequested,
  setEmail,
  setAccessRequested,
  setLoading,
  setCodeValue,
}: UseLoginActionsParams) {
  const handleAcceder = useCallback(
    async (data: AccederData) => {
      if (!data?.email?.trim()) return;
      setLoading(true);
      try {
        await requestAccess(data.email.trim());
        setEmail(data.email.trim());
        setAccessRequested(true);
      } catch (err) {
        const msg = (err as AuthErrorLike).message || "Error al solicitar acceso.";
        notify.error({ title: msg });
      } finally {
        setLoading(false);
      }
    },
    [setEmail, setAccessRequested, setLoading]
  );

  const handleVerifyOtp = useCallback(
    async (data: VerifyOtpData) => {
      if (!data?.code?.trim() || !email?.trim()) return;
      setLoading(true);
      try {
        const result = await verifyOtp(email.trim(), data.code.trim());
        if (!result?.access_token || !result?.user) {
          throw new Error("Respuesta inválida del servidor.");
        }
        const signInResult = await signIn("credentials", {
          redirect: false,
          accessToken: result.access_token,
          user: JSON.stringify(result.user),
        });
        if (!signInResult || signInResult.error) {
          throw new Error(signInResult?.error || "Error al iniciar sesión.");
        }
        notify.success({ title: "Inicio de sesión exitoso" });
        const search =
          typeof window !== "undefined" ? window.location.search : "";
        window.location.href = getRedirectUrl(result.user, search);
      } catch (err) {
        const e = err as AuthErrorLike;
        const msg =
          e.message ||
          e.data?.userMessage ||
          e.data?.message ||
          "Error al verificar el código.";
        notify.error({ title: msg });
      } finally {
        setLoading(false);
      }
    },
    [email, setLoading]
  );

  const backToEmail = useCallback(() => {
    setAccessRequested(false);
  }, [setAccessRequested]);

  const handleOtpPaste = useCallback(
    (e: ClipboardEvent) => {
      const text = (e.clipboardData?.getData("text/plain") || "").trim();
      const digits = text.replace(/\D/g, "").slice(0, 6);
      if (digits.length === 6 && setCodeValue) {
        setCodeValue(digits);
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [setCodeValue]
  );

  useEffect(() => {
    if (!setCodeValue) return;
    const tryFillFromClipboard = () => {
      if (
        typeof document === "undefined" ||
        document.visibilityState !== "visible" ||
        !accessRequested
      )
        return;
      if (typeof navigator?.clipboard?.readText !== "function") return;
      navigator.clipboard
        .readText()
        .then((text) => {
          const digits = (text || "").trim().replace(/\D/g, "").slice(0, 6);
          if (digits.length === 6) setCodeValue(digits);
        })
        .catch(() => {});
    };

    document.addEventListener("visibilitychange", tryFillFromClipboard);
    return () =>
      document.removeEventListener("visibilitychange", tryFillFromClipboard);
  }, [accessRequested, setCodeValue]);

  return {
    handleAcceder,
    handleVerifyOtp,
    backToEmail,
    handleOtpPaste,
  };
}

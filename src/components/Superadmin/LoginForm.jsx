"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSuperadminAuth } from "@/context/SuperadminAuthContext";
import { fetchSuperadmin, setSuperadminToken, SuperadminApiError } from "@/lib/superadminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Fish, Loader2, ArrowLeft } from "lucide-react";

const RESEND_COOLDOWN = 60;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, token } = useSuperadminAuth();

  const [step, setStep] = useState("email"); // "email" | "otp" | "verifying"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const otpRef = useRef(null);
  const cooldownRef = useRef(null);

  // Redirect if already logged in
  useEffect(() => {
    if (token) router.replace("/superadmin");
  }, [token, router]);

  // Auto-verify magic link token from URL
  useEffect(() => {
    const magicToken = searchParams.get("token");
    if (!magicToken) return;

    setStep("verifying");
    setError("");

    (async () => {
      try {
        const res = await fetchSuperadmin("/auth/verify-magic-link", {
          method: "POST",
          body: JSON.stringify({ token: magicToken }),
        });
        const data = await res.json();
        login(data.access_token, data.user);
        router.replace("/superadmin");
      } catch (err) {
        setError(err instanceof SuperadminApiError ? err.message : "Error al verificar el enlace.");
        setStep("email");
      }
    })();
  }, [searchParams, login, router]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [cooldown]);

  // Focus OTP input when entering step
  useEffect(() => {
    if (step === "otp" && otpRef.current) otpRef.current.focus();
  }, [step]);

  const handleRequestAccess = useCallback(async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetchSuperadmin("/auth/request-access", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message || "Revisa tu email para el enlace de acceso, o introduce el código.");
      setStep("otp");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(err instanceof SuperadminApiError ? err.message : "Error al solicitar acceso.");
    } finally {
      setSubmitting(false);
    }
  }, [email]);

  const handleVerifyOtp = useCallback(async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetchSuperadmin("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      login(data.access_token, data.user);
      router.replace("/superadmin");
    } catch (err) {
      setError(err instanceof SuperadminApiError ? err.message : "Error al verificar el código.");
    } finally {
      setSubmitting(false);
    }
  }, [email, otp, login, router]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;
    setError("");
    try {
      await fetchSuperadmin("/auth/request-access", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setCooldown(RESEND_COOLDOWN);
      setMessage("Código reenviado. Revisa tu email.");
    } catch (err) {
      setError(err instanceof SuperadminApiError ? err.message : "Error al reenviar el código.");
    }
  }, [cooldown, email]);

  const handleOtpPaste = useCallback((e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      e.preventDefault();
      setOtp(pasted);
    }
  }, []);

  if (step === "verifying") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Verificando enlace...</p>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Fish className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">PesquerApp Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Panel de administración</p>
        </div>

        {/* Email step */}
        {step === "email" && (
          <form onSubmit={handleRequestAccess} className="space-y-4">
            <div>
              <label htmlFor="sa-email" className="mb-1.5 block text-sm font-medium">
                Email
              </label>
              <Input
                id="sa-email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting || !email}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Solicitar acceso"}
            </Button>
          </form>
        )}

        {/* OTP step */}
        {step === "otp" && (
          <div className="space-y-4">
            {message && (
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{message}</p>
            )}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="sa-otp" className="mb-1.5 block text-sm font-medium">
                  Código de verificación
                </label>
                <Input
                  id="sa-otp"
                  ref={otpRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onPaste={handleOtpPaste}
                  required
                  autoComplete="one-time-code"
                  className="text-center text-lg tracking-[0.3em]"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting || otp.length < 6}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
              </Button>
            </form>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setStep("email"); setError(""); setOtp(""); }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" />
                Volver
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0}
                className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                {cooldown > 0 ? `Reenviar código (${cooldown}s)` : "Reenviar código"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

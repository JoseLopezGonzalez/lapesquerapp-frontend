"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSuperadminAuth } from "@/context/SuperadminAuthContext";
import { fetchSuperadmin, SuperadminApiError } from "@/lib/superadminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Fish, Loader2, Mail, KeyRound } from "lucide-react";

const RESEND_COOLDOWN = 60;
const OTP_SLOT_CLASS = "rounded-md border border-input border-accent/90 shadow-inner dark:shadow-primary/10 h-11 w-10 text-base";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, token } = useSuperadminAuth();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);

  useEffect(() => {
    if (token) router.replace("/superadmin");
  }, [token, router]);

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

  useEffect(() => {
    if (cooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [cooldown]);

  const handleRequestAccess = useCallback(async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await fetchSuperadmin("/auth/request-access", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setStep("otp");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(err instanceof SuperadminApiError ? err.message : "Error al solicitar acceso.");
    } finally {
      setSubmitting(false);
    }
  }, [email]);

  const handleVerifyOtp = useCallback(async () => {
    if (otp.length < 6) return;
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
    } catch (err) {
      setError(err instanceof SuperadminApiError ? err.message : "Error al reenviar el código.");
    }
  }, [cooldown, email]);

  const handleOtpChange = useCallback((value) => {
    setOtp(value);
  }, []);

  if (step === "verifying") {
    return (
      <div className="login-background flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Verificando enlace...</p>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="login-background flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Fish className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl bg-clip-text text-transparent bg-gradient-to-tr from-primary to-muted-foreground">
            PesquerApp Admin
          </CardTitle>
          <CardDescription>Panel de administración de la plataforma</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Email step */}
          {step === "email" && (
            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="sa-email">Email</Label>
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
                {submitting ? "Enviando..." : "Acceder"}
              </Button>
            </form>
          )}

          {/* OTP step */}
          {step === "otp" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertTitle>Revisa tu correo</AlertTitle>
                  <AlertDescription>
                    Te hemos enviado un enlace para acceder.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <KeyRound className="h-4 w-4" />
                  <AlertDescription>
                    O bien introduce aquí el código de 6 dígitos que aparece en el correo.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex flex-col items-center gap-2 w-full">
                <Label className="text-center w-full">Código de 6 dígitos</Label>
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={otp}
                  onChange={handleOtpChange}
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot key={index} index={index} className={OTP_SLOT_CLASS} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  type="button"
                  disabled={submitting || otp.length < 6}
                  onClick={handleVerifyOtp}
                >
                  {submitting ? "Verificando..." : "Verificar código"}
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => { setStep("email"); setError(""); setOtp(""); }}
                >
                  Volver
                </Button>
              </div>

              <div className="text-center">
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
        </CardContent>
      </Card>
    </div>
  );
}

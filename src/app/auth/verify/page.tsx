"use client";

import * as React from "react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button as ButtonBase } from "@/components/ui/button";

const Button = ButtonBase as React.ComponentType<
  React.PropsWithChildren<{ asChild?: boolean; variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link"; className?: string }>
>;
import { verifyMagicLinkToken } from "@/services/authService";
import { getRedirectUrl } from "@/utils/loginUtils";
import { magicLinkTokenSchema } from "@/schemas/loginSchema";
import Loader from "@/components/Utilities/Loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const parsed = magicLinkTokenSchema.safeParse(token ?? "");
    if (!parsed.success) {
      setStatus("error");
      setErrorMessage(parsed.error.errors[0]?.message ?? "Enlace no válido.");
      return;
    }

    const validToken = parsed.data;
    let cancelled = false;

    (async () => {
      try {
        const data = await verifyMagicLinkToken(validToken);
        if (cancelled) return;
        if (!data?.access_token || !data?.user) {
          setStatus("error");
          setErrorMessage("Respuesta inválida del servidor.");
          return;
        }
        const result = await signIn("credentials", {
          redirect: false,
          accessToken: data.access_token,
          user: JSON.stringify(data.user),
        });
        if (cancelled) return;
        if (!result || result.error) {
          setStatus("error");
          setErrorMessage(result?.error ?? "Error al iniciar sesión.");
          return;
        }
        const search = searchParams.toString() ? `?${searchParams.toString()}` : "";
        const redirectUrl = getRedirectUrl(data.user, search);
        window.location.href = redirectUrl;
        setStatus("success");
      } catch (err: unknown) {
        if (cancelled) return;
        setStatus("error");
        const e = err as { status?: number; message?: string; data?: { message?: string; userMessage?: string } };
        const msg =
          e.status === 403
            ? "Usuario desactivado."
            : e.message || e.data?.message || e.data?.userMessage || "Enlace no válido o expirado.";
        setErrorMessage(msg);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Loader />
        <p className="mt-4 text-muted-foreground">Verificando enlace...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md">
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        <div className="mt-6 flex flex-col gap-2 w-full">
          <Button asChild>
            <Link href="/">Volver al inicio de sesión</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Solicitar nuevo enlace</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <Loader />
      <p className="mt-4 text-muted-foreground">Redirigiendo...</p>
    </div>
  );
}

export default function AuthVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <Loader />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}

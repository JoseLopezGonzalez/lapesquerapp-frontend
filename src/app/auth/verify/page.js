"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { verifyMagicLinkToken } from "@/services/authService";
import Loader from "@/components/Utilities/Loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

function safeRedirectFrom(from) {
  if (!from || typeof from !== "string") return null;
  const path = from.trim();
  if (path === "" || !path.startsWith("/") || path.includes("//") || /^https?:\/\//i.test(path)) return null;
  return path;
}

function getRedirectUrl(user, searchParams) {
  const from = searchParams.get("from");
  const safeFrom = safeRedirectFrom(from);
  if (user?.role === "operario") {
    return "/admin/home";
  }
  return safeFrom || "/admin/home";
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Enlace no válido.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = await verifyMagicLinkToken(token);
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
          setErrorMessage(result?.error || "Error al iniciar sesión.");
          return;
        }
        const redirectUrl = getRedirectUrl(data.user, searchParams);
        window.location.href = redirectUrl;
        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        const msg = err.status === 403
          ? "Usuario desactivado."
          : err.message || err.data?.message || err.data?.userMessage || "Enlace no válido o expirado.";
        setErrorMessage(msg);
      }
    })();

    return () => { cancelled = true; };
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

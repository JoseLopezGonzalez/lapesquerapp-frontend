"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import RotatingText from "@/components/Utilities/RotatingText";
import Image from "next/image";
import Link from "next/link";
import { getToastTheme } from "@/customs/reactHotToast";
import { API_URL_V2 } from "@/configs/config";
import Loader from "../Utilities/Loader";
import { AlertCircleIcon, ArrowLeft, ArrowRight, KeyRound, Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobileSafe } from "@/hooks/use-mobile";
import { pageTransition } from "@/lib/motion-presets";
import { requestAccess, verifyOtp } from "@/services/authService";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

function safeRedirectFrom(from) {
  if (!from || typeof from !== "string") return null;
  const path = from.trim();
  if (path === "" || !path.startsWith("/") || path.includes("//") || /^https?:\/\//i.test(path)) return null;
  return path;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [tenantActive, setTenantActive] = useState(true);
  const [brandingImageUrl, setBrandingImageUrl] = useState("");
  const [tenantChecked, setTenantChecked] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [accessRequested, setAccessRequested] = useState(false);
  const { isMobile } = useIsMobileSafe();

  useEffect(() => {
    const hostname = window.location.hostname;
    const subdomain = hostname.split(".")[0];

    if (subdomain === "test") {
      setEmail("admin@lapesquerapp.es");
      setIsDemo(true);
    }

    const brandingImagePath = `/images/tenants/${subdomain}/image.png`;
    setBrandingImageUrl(brandingImagePath);

    fetch(`${API_URL_V2}public/tenant/${subdomain}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data || data.error || data.active === false) {
          setTenantActive(false);
        }
      })
      .catch(() => setTenantActive(false))
      .finally(() => setTenantChecked(true));
  }, []);

  const getRedirectUrl = (user) => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    const safeFrom = safeRedirectFrom(from);
    if (user?.role === "operario" && user?.assignedStoreId) {
      return `/warehouse/${user.assignedStoreId}`;
    }
    return safeFrom || "/admin/home";
  };

  const handleAcceder = async (e) => {
    e.preventDefault();
    if (!tenantActive || !email?.trim()) return;
    setLoading(true);
    try {
      await requestAccess(email.trim());
      setAccessRequested(true);
    } catch (err) {
      const msg = err.message || "Error al solicitar acceso.";
      toast.error(msg, getToastTheme());
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!tenantActive || !email?.trim() || !code?.trim()) return;
    setLoading(true);
    try {
      const data = await verifyOtp(email.trim(), code.trim());
      if (!data?.access_token || !data?.user) {
        throw new Error("Respuesta inválida del servidor.");
      }
      const result = await signIn("credentials", {
        redirect: false,
        accessToken: data.access_token,
        user: JSON.stringify(data.user),
      });
      if (!result || result.error) {
        throw new Error(result?.error || "Error al iniciar sesión.");
      }
      toast.success("Inicio de sesión exitoso", getToastTheme());
      window.location.href = getRedirectUrl(data.user);
    } catch (err) {
      const msg = err.message || err.data?.userMessage || err.data?.message || "Error al verificar el código.";
      toast.error(msg, getToastTheme());
    } finally {
      setLoading(false);
    }
  };

  const backToEmail = () => {
    setAccessRequested(false);
    setCode("");
  };

  const handleOtpPaste = (e) => {
    const text = (e.clipboardData?.getData("text/plain") || "").trim();
    const digits = text.replace(/\D/g, "").slice(0, 6);
    if (digits.length === 6) {
      setCode(digits);
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Al volver el foco a la pestaña, si el portapapeles tiene 6 dígitos, rellenar el OTP
  useEffect(() => {
    const tryFillFromClipboard = () => {
      if (document.visibilityState !== "visible" || !accessRequested) return;
      if (typeof navigator?.clipboard?.readText !== "function") return;
      navigator.clipboard
        .readText()
        .then((text) => {
          const digits = (text || "").trim().replace(/\D/g, "").slice(0, 6);
          if (digits.length === 6) setCode(digits);
        })
        .catch(() => {});
    };

    document.addEventListener("visibilitychange", tryFillFromClipboard);
    return () => document.removeEventListener("visibilitychange", tryFillFromClipboard);
  }, [accessRequested]);

  // Mostrar loader mientras se verifica el tenant
  if (!tenantChecked) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Si es mobile y no ha mostrado el formulario, mostrar pantalla de bienvenida
  const shouldShowWelcome = isMobile && !showForm;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {shouldShowWelcome ? (
          // PANTALLA DE BIENVENIDA (MOBILE)
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative min-h-screen w-full flex flex-col items-center px-4 pb-8"
          >
            {/* Imagen de branding como fondo */}
            <div className="absolute inset-0 z-0">
              <Image
                src={brandingImageUrl || "/images/landing.png"}
                alt="Imagen de branding"
                fill
                className="object-cover"
                priority
                onError={(e) => {
                  e.currentTarget.src = "/images/landing.png";
                }}
              />
              {/* Degradado blanco/negro según el modo desde el fondo (altura intermedia) */}
              <div 
                className="absolute inset-0 dark:hidden"
                style={{
                  background: 'linear-gradient(to top, white 0%, rgba(255, 255, 255, 0.7) 30%, rgba(255, 255, 255, 0.3) 50%, transparent 60%)'
                }}
              />
              <div 
                className="absolute inset-0 hidden dark:block"
                style={{
                  background: 'linear-gradient(to top, black 0%, rgba(0, 0, 0, 0.7) 30%, rgba(0, 0, 0, 0.3) 50%, transparent 60%)'
                }}
              />
            </div>

            {/* Badge de modo demo */}
            {isDemo && (
              <div className="absolute top-4 right-4 z-20 bg-lime-100 text-lime-800 text-xs font-semibold px-3 py-1 rounded-lg shadow">
                MODO DEMO
              </div>
            )}

            {/* Contenido alineado al fondo */}
            <div className="relative z-10 flex flex-col items-center justify-end flex-1 w-full max-w-sm pb-8">
              <div className="flex flex-col items-center text-center space-y-8 w-full">
                {/* Título La PesquerApp */}
                <div className="space-y-4">
                  <h1 className="text-5xl font-bold text-primary bg-clip-text bg-gradient-to-tr from-primary to-primary/80">
                    La PesquerApp
                  </h1>
                  <p className="text-lg text-muted-foreground hidden">
                    Tu viaje comienza aquí
                  </p>
                </div>

                {/* Texto rotativo "Mantén tu producción..." */}
                <div className="flex items-center justify-center gap-1 text-nowrap flex-wrap">
                  <span className="text-lg text-foreground">Mantén tu producción</span>
                  <RotatingText
                    texts={["al día.", "segura.", "eficiente.", "organizada."]}
                    mainClassName="text-lg text-foreground font-medium"
                    staggerFrom="last"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-120%" }}
                    staggerDuration={0.025}
                    splitLevelClassName="overflow-hidden"
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    rotationInterval={6000}
                  />
                </div>

                {/* Botón de acción principal */}
                <Button
                  onClick={() => setShowForm(true)}
                  size="lg"
                  className="w-full h-14 text-base font-semibold gap-2"
                  disabled={!tenantActive}
                >
                  Continuar
                  <motion.div
                    animate={{
                      x: [0, 4, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </Button>

                {/* Texto legal */}
                <p className="text-xs text-muted-foreground px-4">
                  Al presionar "Continuar" aceptas nuestros{" "}
                  <Link href="/terms" className="underline underline-offset-2 text-primary">
                    Términos de Servicio
                  </Link>{" "}
                  y{" "}
                  <Link href="/privacy" className="underline underline-offset-2 text-primary">
                    Política de Privacidad
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          // PANTALLA DE FORMULARIO (DESKTOP O MOBILE DESPUÉS DE WELCOME)
          <motion.div
            key="form"
            {...pageTransition}
            className="login-background flex min-h-screen items-center justify-center bg-white dark:bg-black"
          >
            {/* Desktop Layout */}
            <div className="hidden md:block w-full max-w-[1000px] py-20 px-6">
              {!tenantActive && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircleIcon />
                  <AlertTitle>Cuentas deshabilitadas para esta empresa</AlertTitle>
                  <AlertDescription>
                    <p>La suscripción de esta empresa está caducada o pendiente de renovación.</p>
                    <ul className="list-inside list-disc text-sm">
                      <li>
                        Contacta con soporte para más información (
                        <Link href="mailto:soporte@pesquerapp.com">soporte@pesquerapp.com</Link>)
                      </li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Card className="relative flex flex-row w-full p-2">
                {isDemo && (
                  <div className="absolute top-2 right-2 z-10 bg-lime-100 text-lime-800 text-xs font-semibold px-3 py-1 rounded-lg shadow">
                    MODO DEMO
                  </div>
                )}

                {/* Panel izquierdo con imagen dinámica (desktop) */}
                <div className="relative w-full max-w-[500px] overflow-hidden rounded-lg min-h-[240px]">
                  <Image
                    src={brandingImageUrl || "/images/landing.png"}
                    alt="Imagen de branding"
                    fill
                    className="object-cover"
                    priority
                    onError={(e) => {
                      e.currentTarget.src = "/images/landing.png";
                    }}
                  />
                </div>

                {/* Panel derecho con formulario (desktop) */}
                <div className="flex w-full flex-col items-center justify-center p-8 lg:p-12">
                  <div className="mx-auto w-full max-w-xs space-y-8 py-20">
                    <div className="text-center flex flex-col gap-3">
                      <h2 className="text-2xl lg:text-3xl xl:text-[2.5rem] font-bold text-primary bg-clip-text bg-gradient-to-tr from-primary to-muted-foreground text-transparent leading-tight">
                        La PesquerApp
                      </h2>
                      <div className="flex items-center justify-center gap-1 text-nowrap">
                        <span className="text-md lg:text-xl text-primary">Mantén tu producción</span>
                        <RotatingText
                          texts={["al día.", "segura.", "eficiente.", "organizada."]}
                          mainClassName="text-xl text-primary font-medium"
                          staggerFrom="last"
                          initial={{ y: "100%" }}
                          animate={{ y: 0 }}
                          exit={{ y: "-120%" }}
                          staggerDuration={0.025}
                          splitLevelClassName="overflow-hidden"
                          transition={{ type: "spring", damping: 30, stiffness: 400 }}
                          rotationInterval={6000}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {!accessRequested ? (
                        <>
                          <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              type="email"
                              id="email"
                              name="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="ejemplo@lapesquerapp.es"
                              required
                              disabled={!tenantActive}
                            />
                          </div>
                          <Button
                            className="w-full"
                            type="button"
                            disabled={loading || !tenantActive || !email?.trim()}
                            onClick={handleAcceder}
                          >
                            {loading ? "Enviando..." : "Acceder"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col gap-1">
                            <Alert className="max-w-sm">
                              <Mail className="h-4 w-4" />
                              <AlertTitle>Revisa tu correo</AlertTitle>
                              <AlertDescription>
                                Te hemos enviado un enlace para acceder.
                              </AlertDescription>
                            </Alert>
                            <Alert className="max-w-sm">
                              <KeyRound className="h-4 w-4" />
                              <AlertDescription>
                                O bien introduce aquí el código de 6 dígitos que aparece en el correo.
                              </AlertDescription>
                            </Alert>
                          </div>
                          <div
                            className="flex flex-col items-center gap-1.5 w-full max-w-sm"
                            onPasteCapture={handleOtpPaste}
                          >
                            <Label className="text-center w-full">Código de 6 dígitos</Label>
                            <InputOTP
                              maxLength={6}
                              pattern={REGEXP_ONLY_DIGITS}
                              value={code}
                              onChange={(value) => setCode(value)}
                              disabled={!tenantActive}
                            >
                              <InputOTPGroup className="gap-2">
                                <InputOTPSlot index={0} className="rounded-md border border-input border-accent/90 shadow-inner dark:shadow-primary/10" />
                                <InputOTPSlot index={1} className="rounded-md border border-input border-accent/90 shadow-inner dark:shadow-primary/10" />
                                <InputOTPSlot index={2} className="rounded-md border border-input border-accent/90 shadow-inner dark:shadow-primary/10" />
                                <InputOTPSlot index={3} className="rounded-md border border-input border-accent/90 shadow-inner dark:shadow-primary/10" />
                                <InputOTPSlot index={4} className="rounded-md border border-input border-accent/90 shadow-inner dark:shadow-primary/10" />
                                <InputOTPSlot index={5} className="rounded-md border border-input border-accent/90 shadow-inner dark:shadow-primary/10" />
                              </InputOTPGroup>
                            </InputOTP>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              className="w-full"
                              type="button"
                              disabled={loading || !tenantActive || code.length !== 6}
                              onClick={handleVerifyOtp}
                            >
                              {loading ? "Verificando..." : "Verificar código"}
                            </Button>
                            <Button variant="ghost" type="button" onClick={backToEmail}>
                              Volver
                            </Button>
                          </div>
                        </>
                      )}

                      <p className="text-center text-sm text-muted-foreground">
                        ¿Algún problema?{" "}
                        <Link
                          href="mailto:soporte@pesquerapp.com"
                          className="text-primary hover:text-muted-foreground"
                        >
                          Contáctanos
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden relative w-full min-h-screen flex flex-col px-6 py-safe">
              {!tenantActive && (
                <Alert variant="destructive" className="mb-4 mt-4">
                  <AlertCircleIcon />
                  <AlertTitle className="text-sm">Cuentas deshabilitadas para esta empresa</AlertTitle>
                  <AlertDescription className="text-xs">
                    <p>La suscripción de esta empresa está caducada o pendiente de renovación.</p>
                    <ul className="list-inside list-disc text-xs mt-2">
                      <li>
                        Contacta con soporte para más información (
                        <Link href="mailto:soporte@pesquerapp.com">soporte@pesquerapp.com</Link>)
                      </li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {isDemo && (
                <div className="absolute top-4 right-4 z-10 bg-lime-100 text-lime-800 text-xs font-semibold px-3 py-1 rounded-lg shadow">
                  MODO DEMO
                </div>
              )}

              {/* Botón volver en mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowForm(false)}
                className="absolute top-4 left-4 z-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              {/* Contenido del formulario distribuido verticalmente */}
              <div className="flex-1 flex flex-col justify-center w-full max-w-sm mx-auto py-12">
                <div className="w-full space-y-8">
                  <div className="text-center flex flex-col gap-4">
                    <h2 className="text-4xl font-bold text-primary bg-clip-text bg-gradient-to-tr from-primary to-muted-foreground text-transparent leading-tight">
                      La PesquerApp
                    </h2>
                    <div className="flex items-center justify-center gap-1 text-nowrap flex-wrap">
                      <span className="text-base text-primary">Mantén tu producción</span>
                      <RotatingText
                        texts={["al día.", "segura.", "eficiente.", "organizada."]}
                        mainClassName="text-base text-primary font-medium"
                        staggerFrom="last"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "-120%" }}
                        staggerDuration={0.025}
                        splitLevelClassName="overflow-hidden"
                        transition={{ type: "spring", damping: 30, stiffness: 400 }}
                        rotationInterval={6000}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    {!accessRequested ? (
                      <>
                        <div className="grid w-full items-center gap-2">
                          <Label htmlFor="email-mobile" className="text-base">Email</Label>
                          <Input
                            type="email"
                            id="email-mobile"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ejemplo@lapesquerapp.es"
                            required
                            disabled={!tenantActive}
                            className="h-12 text-base"
                          />
                        </div>
                        <Button
                          className="w-full h-14 text-base font-semibold"
                          type="button"
                          disabled={loading || !tenantActive || !email?.trim()}
                          onClick={handleAcceder}
                        >
                          {loading ? "Enviando..." : "Acceder"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col gap-1">
                          <Alert className="max-w-sm">
                            <Mail className="h-4 w-4" />
                            <AlertTitle>Revisa tu correo</AlertTitle>
                            <AlertDescription>
                              Te hemos enviado un enlace para acceder.
                            </AlertDescription>
                          </Alert>
                          <Alert className="max-w-sm">
                            <KeyRound className="h-4 w-4" />
                            <AlertDescription>
                              O bien introduce aquí el código de 6 dígitos que aparece en el correo.
                            </AlertDescription>
                          </Alert>
                        </div>
                        <div
                          className="flex flex-col items-center gap-2 w-full"
                          onPasteCapture={handleOtpPaste}
                        >
                          <Label className="text-base text-center w-full">Código de 6 dígitos</Label>
                          <InputOTP
                            maxLength={6}
                            pattern={REGEXP_ONLY_DIGITS}
                            value={code}
                            onChange={(value) => setCode(value)}
                            disabled={!tenantActive}
                          >
                            <InputOTPGroup className="gap-2">
                              <InputOTPSlot index={0} className="rounded-md border border-input border-accent/90 shadow-inner dark:shadow-primary/10 h-12 w-11 text-lg" />
                              <InputOTPSlot index={1} className="rounded-md border border-input border-accent/90 shadow-inner dark:shadow-primary/10 h-12 w-11 text-lg" />
                              <InputOTPSlot index={2} className="rounded-md border border-input border-accent/90 shadow-inner dark:shadow-primary/10 h-12 w-11 text-lg" />
                              <InputOTPSlot index={3} className="rounded-md border border-input border-accent/90 shadow-inner dark:shadow-primary/10 h-12 w-11 text-lg" />
                              <InputOTPSlot index={4} className="rounded-md border border-input border-accent/90 shadow-inner dark:shadow-primary/10 h-12 w-11 text-lg" />
                              <InputOTPSlot index={5} className="rounded-md border border-input border-accent/90 shadow-inner dark:shadow-primary/10 h-12 w-11 text-lg" />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            className="w-full h-14 text-base font-semibold"
                            type="button"
                            disabled={loading || !tenantActive || code.length !== 6}
                            onClick={handleVerifyOtp}
                          >
                            {loading ? "Verificando..." : "Verificar código"}
                          </Button>
                          <Button variant="ghost" type="button" onClick={backToEmail}>
                            Volver
                          </Button>
                        </div>
                      </>
                    )}

                    <p className="text-center text-sm text-muted-foreground pt-2">
                      ¿Algún problema?{" "}
                      <Link
                        href="mailto:soporte@pesquerapp.com"
                        className="text-primary hover:text-muted-foreground underline underline-offset-2"
                      >
                        Contáctanos
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

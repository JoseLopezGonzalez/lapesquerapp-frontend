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
import { AlertCircleIcon, ArrowLeft, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobileSafe } from "@/hooks/use-mobile";
import { pageTransition } from "@/lib/motion-presets";
import { useAuthTransition } from "@/hooks/useAuthTransition";
import { AuthTransitionScreen } from "@/components/Auth/AuthTransitionScreen";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tenantActive, setTenantActive] = useState(true);
  const [brandingImageUrl, setBrandingImageUrl] = useState("");
  const [tenantChecked, setTenantChecked] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { isMobile } = useIsMobileSafe();
  const { showLogin, showSuccess, showError, hide } = useAuthTransition();

  useEffect(() => {
    const hostname = window.location.hostname;
    const subdomain = hostname.split(".")[0];

    if (subdomain === "test") {
      setEmail("admin@lapesquerapp.es");
      setPassword("admin");
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

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!tenantActive) {
      toast.error("La suscripción está caducada o no ha sido renovada", getToastTheme());
      return;
    }

    // ✅ Activar transición ANTES de iniciar proceso
    showLogin();
    
    try {
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("from") || "/admin/home";

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (!result || result.error) {
        setEmail("");
        setPassword("");
        
        // ✅ Mostrar error en transición
        const errorMsg = result?.error === "CredentialsSignin"
          ? "Datos de acceso incorrectos"
          : result?.error || "Error al iniciar sesión";
        
        showError(errorMsg);
        
        // Esperar 2 segundos antes de ocultar
        setTimeout(() => {
          hide();
        }, 2000);
        
        return;
      }

      // ✅ Mostrar éxito en transición
      showSuccess();
      
      // Redirigir después de mostrar éxito brevemente
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 1000);
      
    } catch (err) {
      // ✅ Mostrar error en transición
      showError(err.message);
      
      setTimeout(() => {
        hide();
      }, 2000);
    }
  };

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
      {/* ✅ Pantalla de transición de autenticación */}
      <AuthTransitionScreen />
      
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
                  <form
                    onSubmit={handleLogin}
                    className="mx-auto w-full max-w-xs space-y-8 py-20"
                  >
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

                      <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="password">Contraseña</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            autoComplete="off"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="*******"
                            required
                            disabled={!tenantActive}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary focus:outline-none"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                          >
                            {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                          </button>
                        </div>
                      </div>

                      <Button 
                        className="w-full" 
                        type="submit" 
                        disabled={loading || !tenantActive}
                      >
                        {loading ? "Entrando..." : "Login"}
                      </Button>

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
                  </form>
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
                <form
                  onSubmit={handleLogin}
                  className="w-full space-y-8"
                >
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

                    <div className="grid w-full items-center gap-2">
                      <Label htmlFor="password-mobile" className="text-base">Contraseña</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          id="password-mobile"
                          name="password"
                          autoComplete="off"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="*******"
                          required
                          disabled={!tenantActive}
                          className="h-12 text-base pr-12"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary focus:outline-none"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      className="w-full h-14 text-base font-semibold" 
                      type="submit" 
                      disabled={loading || !tenantActive}
                    >
                      {loading ? "Entrando..." : "Iniciar sesión"}
                    </Button>

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
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

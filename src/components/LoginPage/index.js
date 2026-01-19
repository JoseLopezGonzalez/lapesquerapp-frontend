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
import { LogoutDialog } from "../Utilities/LogoutDialog";
import { useIsLoggingOut } from "@/hooks/useIsLoggingOut";
import { AlertCircleIcon, ArrowLeft, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobileSafe } from "@/hooks/use-mobile";
import { pageTransition } from "@/lib/motion-presets";

export default function LoginPage() {
  // ✅ Verificar logout antes de cualquier otra lógica
  const isLoggingOut = useIsLoggingOut();
  
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

  useEffect(() => {
    console.log('🔍 LoginPage: useEffect ejecutado, iniciando verificación de tenant...');
    
    const hostname = window.location.hostname;
    const subdomain = hostname.split(".")[0];
    console.log('🔍 LoginPage: Subdomain detectado:', subdomain);

    if (subdomain === "test") {
      setEmail("admin@lapesquerapp.es");
      setPassword("admin");
      setIsDemo(true);
    }

    const brandingImagePath = `/images/tenants/${subdomain}/image.png`;
    setBrandingImageUrl(brandingImagePath);

    // ✅ CRÍTICO: Usar una referencia para rastrear si el componente está montado
    let isMounted = true;
    let timeoutId = null;
    let fetchCompleted = false;

    const completeTenantCheck = (active = true, source = 'unknown') => {
      // Solo actualizar si el componente sigue montado y no se completó antes
      if (!isMounted) {
        console.log(`⚠️ LoginPage: Componente desmontado, ignorando completeTenantCheck desde ${source}`);
        return;
      }
      
      if (fetchCompleted) {
        console.log(`⚠️ LoginPage: completeTenantCheck ya fue llamado, ignorando llamada desde ${source}`);
        return;
      }
      
      fetchCompleted = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      console.log(`✅ LoginPage: completeTenantCheck llamado desde ${source}, active=${active}`);
      setTenantActive(active);
      setTenantChecked(true);
      console.log('✅ LoginPage: tenantChecked actualizado a true');
    };

    // Establecer timeout que se ejecutará si el fetch no completa
    console.log('🔍 LoginPage: Estableciendo timeout de 3 segundos...');
    timeoutId = setTimeout(() => {
      if (isMounted && !fetchCompleted) {
        console.warn('⚠️ LoginPage: Timeout verificando tenant, continuando con login...');
        completeTenantCheck(true, 'timeout');
      } else {
        console.log('✅ LoginPage: Timeout alcanzado pero componente desmontado o fetch ya completó');
      }
    }, 3000); // Reducido a 3 segundos para respuesta más rápida

    // ✅ Fetch con manejo de errores mejorado y timeout de red
    console.log(`🔍 LoginPage: Iniciando fetch a ${API_URL_V2}public/tenant/${subdomain}`);
    
    // Agregar timeout al fetch mismo para evitar que se quede colgado
    const fetchController = new AbortController();
    const fetchTimeoutId = setTimeout(() => {
      fetchController.abort();
    }, 4000); // 4 segundos máximo para el fetch
    
    fetch(`${API_URL_V2}public/tenant/${subdomain}`, {
      signal: fetchController.signal,
      // Agregar headers para evitar problemas de CORS
      headers: {
        'Accept': 'application/json',
      }
    })
      .then((res) => {
        clearTimeout(fetchTimeoutId);
        if (!isMounted) {
          console.log('⚠️ LoginPage: Componente desmontado durante fetch, ignorando respuesta');
          return null;
        }
        console.log(`🔍 LoginPage: Fetch respuesta recibida, status: ${res.status}`);
        // Verificar si la respuesta es OK antes de parsear
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) {
          console.log('⚠️ LoginPage: Componente desmontado durante procesamiento, ignorando datos');
          return;
        }
        if (data === null) return; // Ya se manejó en el then anterior
        
        console.log('🔍 LoginPage: Datos del tenant recibidos:', data);
        // ✅ Asegurar que tenantChecked se actualiza SIEMPRE
        if (!data || data.error || data.active === false) {
          completeTenantCheck(false, 'fetch-success-inactive');
        } else {
          completeTenantCheck(true, 'fetch-success-active');
        }
      })
      .catch((error) => {
        clearTimeout(fetchTimeoutId);
        if (!isMounted) {
          console.log('⚠️ LoginPage: Componente desmontado durante error, ignorando');
          return;
        }
        if (error.name === 'AbortError') {
          console.error('❌ LoginPage: Fetch abortado por timeout de red');
        } else {
          console.error('❌ LoginPage: Error verificando tenant:', error);
        }
        // En caso de error, asumir que el tenant está activo para no bloquear el login
        completeTenantCheck(true, 'fetch-error');
      });

    // Cleanup: limpiar timeout si el componente se desmonta
    return () => {
      console.log('🔍 LoginPage: Cleanup ejecutado, marcando componente como desmontado...');
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      clearTimeout(fetchTimeoutId);
      fetchController.abort(); // Abortar fetch si está en progreso
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!tenantActive) {
      toast.error("La suscripción está caducada o no ha sido renovada", getToastTheme());
      return;
    }

    setLoading(true);
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
        throw new Error(
          result?.error === "CredentialsSignin"
            ? "Datos de acceso incorrectos"
            : result?.error || "Error al iniciar sesión"
        );
      }

      toast.success("Inicio de sesión exitoso", getToastTheme());
      window.location.href = redirectTo;
    } catch (err) {
      toast.error(err.message, getToastTheme());
    } finally {
      setLoading(false);
    }
  };

  // ✅ Verificar logout antes de mostrar loader de tenant
  console.log('🔍 LoginPage: Render, tenantChecked=', tenantChecked, 'isLoggingOut=', isLoggingOut);
  
  if (!tenantChecked) {
    const hasLogoutFlag = typeof sessionStorage !== 'undefined' && 
                          sessionStorage.getItem('__is_logging_out__') === 'true';
    console.log('🔍 LoginPage: tenantChecked=false, hasLogoutFlag=', hasLogoutFlag);
    
    if (isLoggingOut || hasLogoutFlag) {
      console.log('🔍 LoginPage: Mostrando LogoutDialog');
      return <LogoutDialog open={true} />;
    }
    console.log('🔍 LoginPage: Mostrando Loader (esperando tenant check)');
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }
  
  console.log('🔍 LoginPage: tenantChecked=true, renderizando formulario de login');

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

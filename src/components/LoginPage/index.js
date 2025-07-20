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
import { AlertCircleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tenantActive, setTenantActive] = useState(true);
  const [brandingImageUrl, setBrandingImageUrl] = useState("");
  const [tenantChecked, setTenantChecked] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    const subdomain = hostname.split(".")[0];

    // Construimos directamente la URL de la imagen
    const brandingImagePath = `/images/tenants/${subdomain}/image.png`;
    setBrandingImageUrl(brandingImagePath);

    // Validamos la suscripción con el backend
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

  if (!tenantChecked) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="login-background flex min-h-screen items-center justify-center bg-white dark:bg-black">
      <div className="w-full max-w-[1000px] py-20">
        {!tenantActive && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Cuentas deshabilitadas para esta empresa</AlertTitle>
            <AlertDescription>
              <p>La suscripción de esta empresa está caducada o pendiente de renovación.</p>
              <ul className="list-inside list-disc text-sm">
                <li>Contacta con soporte para más información (<Link href="mailto:soporte@pesquerapp.com">soporte@pesquerapp.com</Link>)</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
        <Card className="flex w-full h-full p-2">
          {/* Panel izquierdo con imagen dinámica */}
          <div className="relative hidden w-full max-w-[500px] overflow-hidden rounded-lg bg-black lg:block">
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

          {/* Panel derecho con formulario */}
          <div className="flex w-full flex-col items-center justify-center p-8 lg:p-12">
            <form
              onSubmit={handleLogin}
              className="mx-auto w-full max-w-xs space-y-8 py-20"
            >
              <div className="text-center flex flex-col gap-3">
                <h2 className="text-3xl font-bold text-primary sm:text-[2.5rem] bg-clip-text bg-gradient-to-tr from-primary to-muted-foreground text-transparent leading-tight">
                  La PesquerApp
                </h2>
                <div className="flex items-center justify-center gap-1 text-nowrap">
                  <span className="text-xl text-primary">Mantén tu producción</span>
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

              {/* Alerta si el tenant no está activo */}


              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@pymcolorao.es"
                    required
                    disabled={!tenantActive}
                  />
                </div>

                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    type="password"
                    id="password"
                    name="password"
                    autoComplete="off"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="*******"
                    required
                    disabled={!tenantActive}
                  />
                </div>

                <Button className="w-full" type="submit" disabled={loading || !tenantActive}>
                  {loading ? "Entrando..." : "Login"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  ¿Algún problema?{" "}
                  <Link href="mailto:soporte@pesquerapp.com" className="text-primary hover:text-muted-foreground">
                    Contáctanos
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}

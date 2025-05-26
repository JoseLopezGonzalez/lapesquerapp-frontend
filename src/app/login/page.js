"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import RotatingText from "@/components/Utilities/RotatingText";

import Image from "next/image";
import Link from "next/link";
import { darkToastTheme } from "@/customs/reactHotToast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const redirectTo = searchParams.get("from") || "/admin";

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

      toast.success("Inicio de sesión exitoso", darkToastTheme);
      window.location.href = redirectTo;
    } catch (err) {
      toast.error(err.message, darkToastTheme);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-background flex min-h-screen items-center justify-center bg-white dark:bg-black">
      <div className="w-full max-w-[1000px] py-20">
        <Card className="flex w-full h-full p-2">
          {/* Panel izquierdo con imagen */}
          <div className="relative hidden w-full max-w-[500px] overflow-hidden rounded-lg bg-black lg:block">
            <Image
              src="/images/landing.png"
              alt="Space landscape with mountains and planet"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Panel derecho con formulario */}
          <div className="flex w-full flex-col items-center justify-center p-8 lg:p-12">
            <form
              onSubmit={handleLogin}
              className="mx-auto w-full max-w-xs space-y-8 py-20"
            >
              <div className="text-center flex flex-col gap-3">
                <h2 className="text-3xl font-bold text-primary sm:text-[2.5rem] bg-clip-text bg-gradient-to-tr from-primary to-muted-foreground text-transparent">
                  BlueApp
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

              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@pymcolorao.es"
                    required
                  />
                </div>

                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="*******"
                    required
                  />
                </div>

                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? "Entrando..." : "Login"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  ¿Algún problema?{" "}
                  <Link href="#" className="text-primary hover:text-muted-foreground">
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

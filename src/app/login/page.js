"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { NAVBAR_LOGO } from "@/configs/config";
import toast from "react-hot-toast";
import { darkToastTheme } from "@/customs/reactHotToast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Obtener la URL de redirección desde los parámetros de la URL
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("from") || "/admin"; // Redirige a /admin si no se especifica una URL previa

      // Intentar iniciar sesión
      const result = await signIn("credentials", {
        redirect: false, // No redirige automáticamente
        email,
        password,
      });

      // Comprobar si hay error
      if (!result || result.error) {
        if (result.error === "CredentialsSignin") {
          setEmail("");
          setPassword("");
          throw new Error("Datos de acceso incorrectos");
        }
        throw new Error(result.error || "Error al iniciar sesión");
      }

      // Si no hay error, inicio de sesión exitoso
      toast.success("Inicio de sesión exitoso", darkToastTheme);
      window.location.href = redirectTo; // Redirigir a la página solicitada o a /admin
    } catch (err) {
      // Mostrar mensaje de error
      toast.error(err.message, darkToastTheme);
    } finally {
      setLoading(false); // Restaurar estado de carga
    }
  };



  return (
    <div className="flex justify-center items-center min-h-screen ">
      <div id="content" class="relative max-w-3xl h-[100vh] px-4 sm:px-6 lg:px-8 flex flex-col justify-center sm:items-center mx-auto size-full before:absolute before:top-0 before:start-1/2 before:bg-[url('https://preline.co/assets/svg/examples-dark/squared-bg-element.svg')] before:bg-no-repeat before:bg-top before:size-full before:-z-[1] before:transform before:-translate-x-1/2">
        <div className="flex flex-col gap-8 justify-center items-center py-12 px-6 sm:px-10 max-w-md w-full">
          <img className="h-16 w-auto" src={NAVBAR_LOGO} alt="Your Company" />
          <div class="text-center py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl text-white sm:text-3xl text-nowrap">
              Manten tu producción al día.
            </h1>
            <h2 className="mt-1 sm:mt-3 text-3xl font-bold text-white sm:text-[2.5rem]">
              <span class="bg-clip-text bg-gradient-to-tr from-sky-600 to-green-400 text-transparent">BlueApp</span>
            </h2>
          </div>
          <div className="w-full backdrop-blur-lg  sm:px-10 px-5 py-10 rounded-xl border border-white/5 shadow-lg">
           {/*  <h2 className="text-center text-2xl font-bold text-white">Iniciar Sesión</h2>
            <p className="text-center text-sm text-neutral-400 mt-2">
              ¡Bienvenido! Introduce tus datos de acceso.
            </p> */}
            <form onSubmit={handleLogin} className=" space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm text-neutral-200">
                  Usuario
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ejemplo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="block w-full mt-1 rounded-md bg-white/5 border-white/50  px-3 py-2 placeholder-neutral-700 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm text-neutral-200">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="block w-full mt-1 rounded-md bg-white/5 border-neutral-600 bg-transparent px-3 py-2 placeholder-neutral-700 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex w-full justify-center rounded-lg bg-neutral-700 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

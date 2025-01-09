"use client";

import { useState } from "react";
import { getCsrfCookie, login, logout, getAuthenticatedUser } from "@/services/auth/auth";
import { NAVBAR_LOGO } from "@/configs/config";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setError(null);
      setLoading(true);

      // Obtener token CSRF y realizar login
      await getCsrfCookie();
      await login(email, password);

      // Obtener el usuario autenticado
      const authenticatedUser = await getAuthenticatedUser();
      setUser(authenticatedUser);
      /* Redirect to /admin/home */
      window.location.href = "/admin/home";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setError(null);
      setLoading(true);

      // Cerrar sesión
      await logout();
      setUser(null);
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (

    <>
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex gap-10 flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 ">
              <img
                className="mx-auto h-16 w-auto"
                src={NAVBAR_LOGO}
                alt="Your Company"
              />
          <div className="mx-auto w-full  backdrop-blur-sm bg-white/5 sm:px-10 px-5 pb-10 pt-10 rounded-xl border-1 border-neutral-700/50">
            <div>
              <h2 className="mt-0 text-center text-2xl font-bold tracking-tight text-white">Iniciar Sesión</h2>
              <p className="mt-2 text-center text-sm text-neutral-400">
                ¡Bienvenido! Introduce tus datos de acceso.
              </p>
            </div>
            <div className="mt-10">
              <div className="mt-6">
                <form  className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm text-neutral-200">
                      Usuario
                    </label>
                    <div className="mt-1">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        className="block w-full appearance-none rounded-md border border-neutral-600/50 bg-transparent px-3 py-2.5 placeholder-neutral-400 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="password" className="block text-sm text-neutral-200">
                      Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        className="block w-full appearance-none rounded-md border border-neutral-600/50 bg-transparent px-3 py-2.5 placeholder-neutral-400 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <button
                      type="submit"
                      onClick={handleLogin}
                      className="flex w-full justify-center rounded-lg border border-transparent bg-sky-500 py-2.5 px-4 font-semibold text-sm text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                    >
                      Iniciar Sesión
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

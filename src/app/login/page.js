"use client";

import { useState } from "react";
import { getCsrfCookie, login, logout, getAuthenticatedUser } from "@/services/auth/auth";
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

      // Obtener token CSRF y realizar login
      await getCsrfCookie();
      await login(email, password);

      // Redirigir al usuario autenticado
      window.location.href = "/admin";
    } catch (err) {
      toast.error(err.message , darkToastTheme);
      setEmail(""); /* No funciona */
      setPassword("");   /* No funciona */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-neutral-900">
      <div className="flex flex-col gap-8 justify-center items-center py-12 px-6 sm:px-10 max-w-md w-full">
        <img
          className="h-16 w-auto"
          src={NAVBAR_LOGO}
          alt="Your Company"
        />
        <div className="w-full backdrop-blur-md bg-white/5 sm:px-10 px-5 py-10 rounded-xl border border-neutral-700/50 shadow-lg">
          <h2 className="text-center text-2xl font-bold text-white">Iniciar Sesión</h2>
          <p className="text-center text-sm text-neutral-400 mt-2">
            ¡Bienvenido! Introduce tus datos de acceso.
          </p>
          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm text-neutral-200">
                Usuario
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="block w-full mt-1 rounded-md border border-neutral-600 bg-transparent px-3 py-2 placeholder-neutral-400 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
              />
            </div>
            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm text-neutral-200">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="block w-full mt-1 rounded-md border border-neutral-600 bg-transparent px-3 py-2 placeholder-neutral-400 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
              />
            </div>
            
            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`flex w-full justify-center rounded-lg bg-sky-500 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

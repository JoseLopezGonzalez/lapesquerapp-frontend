"use client";

import { useState } from "react";
import { getCsrfCookie, login, logout, getAuthenticatedUser } from "@/services/auth/auth";

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
    <div>
      <h1>Prueba de Login</h1>

      {/* Formulario de Login */}
      {!user ? (
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin} disabled={loading}>
            {loading ? "Cargando..." : "Login"}
          </button>
        </div>
      ) : (
        <div>
          {/* Usuario autenticado */}
          <h2>Usuario autenticado</h2>
          <p>Email: {user.email}</p>
          <p>Nombre: {user.name}</p>
          <button onClick={handleLogout} disabled={loading}>
            {loading ? "Cerrando sesión..." : "Cerrar Sesión"}
          </button>
        </div>
      )}

      {/* Mensaje de error */}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

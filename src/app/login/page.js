"use client";

import { useState } from "react";
import { getCsrfCookie , login, getAuthenticatedUser } from "@/services/auth/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const handleGetCsrf = async () => {
    try {
      await getCsrfCookie();
      console.log("Cookie CSRF obtenida correctamente");
    } catch (err) {
      console.error("Error al obtener la cookie CSRF:", err.message);
    }
  };

  const handleLogin = async () => {
    try {
      setError(null);

      // Realizar login
      await login(email, password);

      // Obtener el usuario autenticado
      const authenticatedUser = await getAuthenticatedUser();
      setUser(authenticatedUser);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Prueba de Login</h1>

      {/* Botón para obtener la cookie CSRF */}
      <button onClick={handleGetCsrf}>Obtener Cookie CSRF</button>

      <hr />

      {/* Formulario de Login */}
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
        <button onClick={handleLogin}>Login</button>
      </div>

      {/* Mensaje de error */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Datos del usuario autenticado */}
      {user && (
        <div>
          <h2>Usuario autenticado</h2>
          <p>Email: {user.email}</p>
          <p>Nombre: {user.name}</p>
        </div>
      )}
    </div>
  );
}

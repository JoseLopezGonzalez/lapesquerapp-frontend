import { API_URL_V2 } from '@/configs/config';
import { fetchWithTenant } from '@/lib/fetchWithTenant';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// --- Rate limiting simple en memoria ---
const loginAttempts = {};
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutos

function getClientIp(req) {
  // Next.js API routes: req.headers['x-forwarded-for'] o req.socket.remoteAddress
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // --- Rate limiting por IP ---
        const ip = getClientIp(req);
        const now = Date.now();
        if (!loginAttempts[ip]) {
          loginAttempts[ip] = [];
        }
        // Eliminar intentos viejos
        loginAttempts[ip] = loginAttempts[ip].filter((ts) => now - ts < WINDOW_MS);
        if (loginAttempts[ip].length >= MAX_ATTEMPTS) {
          throw new Error("Demasiados intentos de inicio de sesión. Intenta de nuevo más tarde.");
        }
        loginAttempts[ip].push(now);
        // --- Fin rate limiting ---
        try {
          const res = await fetchWithTenant(`${API_URL_V2}login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          console.log('Response from login:', res);

          const data = await res.json();

          if (res.ok && data.access_token) {
            return { ...data.user, accessToken: data.access_token };
          }

          throw new Error(data.message || 'Error al iniciar sesión');
        } catch (err) {
          console.error('Error al autenticar:', err);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // Actualizar token cada 1 día
  },
  callbacks: {
    async jwt({ token, user }) {
      // Si el usuario está presente (inicia sesión), agregar datos al token
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
        // Campos opcionales para store_operator
        if (user.assignedStoreId) {
          token.assignedStoreId = user.assignedStoreId;
        }
        if (user.companyName) {
          token.companyName = user.companyName;
        }
        if (user.companyLogoUrl) {
          token.companyLogoUrl = user.companyLogoUrl;
        }
      }

      // Validar si el token ha expirado o es inválido (simular esto con un backend en el futuro)
      const tokenIsExpired = false; // Implementa lógica de validación aquí si es necesario

      if (tokenIsExpired) {
        console.log('Token expirado');
        return null;
      }

      return token;
    },
    async session({ session, token }) {
      // Si no hay token (por ejemplo, expiró), cerrar sesión automáticamente
      if (!token) {
        return null;
      }
      session.user = token;
      return session;
    },
  },
  events: {
    async signOut(message) {
      console.log('Usuario deslogueado:', message);
    },
  },
  pages: {
    signIn: '/', // Página personalizada de inicio de sesión
    error: '/', // Redirigir a login en caso de error
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };

import { API_URL_V2 } from '@/configs/config';
import { fetchWithTenant } from '@/lib/fetchWithTenant';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// --- Rate limiting simple en memoria (para intentos de authorize por IP) ---
const loginAttempts = {};
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000; // 1 minuto

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

// Exportar configuración para uso en otras rutas API
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        accessToken: { label: 'Access Token', type: 'text' },
        user: { label: 'User', type: 'text' },
      },
      async authorize(credentials, req) {
        const ip = getClientIp(req);
        const now = Date.now();
        if (!loginAttempts[ip]) loginAttempts[ip] = [];
        loginAttempts[ip] = loginAttempts[ip].filter((ts) => now - ts < WINDOW_MS);
        if (loginAttempts[ip].length >= MAX_ATTEMPTS) {
          throw new Error("Demasiados intentos. Intenta de nuevo más tarde.");
        }
        loginAttempts[ip].push(now);

        // Solo flujo token+user (tras canjear magic link u OTP en el cliente)
        if (!credentials?.accessToken || !credentials?.user) {
          return null;
        }
        try {
          const user = typeof credentials.user === 'string' ? JSON.parse(credentials.user) : credentials.user;
          const accessToken = credentials.accessToken;
          if (!accessToken || !user) return null;
          return { ...user, accessToken };
        } catch (err) {
          console.error('Error al parsear credenciales:', err);
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
    async jwt({ token, user, trigger }) {
      // Si el usuario está presente (inicia sesión), agregar datos al token
      if (user) {
        token.accessToken = user.accessToken;
        // Normalizar rol a string (el backend a veces devuelve array)
        token.role = Array.isArray(user.role) ? (user.role[0] ?? null) : (user.role ?? null);
        // Campos opcionales (ej. operario con almacén asignado)
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

      // Refrescar datos del usuario si se solicita explícitamente o periódicamente
      if (trigger === 'update' || (token.accessToken && Date.now() - (token.lastRefresh || 0) > 60 * 60 * 1000)) {
        try {
          const response = await fetchWithTenant(`${API_URL_V2}me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token.accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          // Token revocado o inválido (ej. personal token eliminado en BD) → invalidar sesión
          if (response.status === 401 || response.status === 403) {
            console.warn('[NextAuth] Token rechazado por el backend (401/403), invalidando sesión');
            return null;
          }

          if (response.ok) {
            const userData = await response.json();
            const currentUser = userData.data || userData;
            
            // Actualizar token con datos frescos (rol siempre string)
            const rawRole = currentUser.role ?? token.role;
            token.role = Array.isArray(rawRole) ? (rawRole[0] ?? null) : rawRole;
            if (currentUser.assigned_store_id !== undefined) {
              token.assignedStoreId = currentUser.assigned_store_id;
            }
            if (currentUser.company_name) {
              token.companyName = currentUser.company_name;
            }
            if (currentUser.company_logo_url) {
              token.companyLogoUrl = currentUser.company_logo_url;
            }
            token.lastRefresh = Date.now();
          }
        } catch (error) {
          console.error('Error refrescando datos del usuario:', error);
          // No fallar si no se puede refrescar, usar datos del token
        }
      }

      // Validar si el token ha expirado o es inválido
      const tokenIsExpired = false; // Implementa lógica de validación aquí si es necesario

      if (tokenIsExpired) {
        return null;
      }

      return token;
    },
    async session({ session, token }) {
      if (!token) {
        return null;
      }
      // Asegurar que session.user.role sea siempre string (por si el token tenía array)
      const role = Array.isArray(token.role) ? (token.role[0] ?? null) : token.role;
      session.user = { ...token, role };
      return session;
    },
  },
  events: {
    async signOut(message) {
      // El logout del backend se maneja en los componentes antes de llamar a signOut
      // para asegurar que el token se revoca antes de limpiar la sesión del cliente
    },
  },
  pages: {
    signIn: '/', // Página personalizada de inicio de sesión
    error: '/', // Redirigir a login en caso de error
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

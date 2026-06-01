import { API_URL_V2 } from '@/configs/config';
import { fetchWithTenant } from '@/lib/fetchWithTenant';
import NextAuth, { NextAuthOptions, type User, type Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000;
const loginAttempts: Record<string, number[]> = {};

function getClientIp(req: {
  headers?: { get?: (n: string) => string | null };
  socket?: { remoteAddress?: string };
}): string {
  const forwarded = req.headers?.get?.('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return req.socket?.remoteAddress ?? 'unknown';
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        accessToken: { label: 'Access Token', type: 'text' },
        user: { label: 'User', type: 'text' },
      },
      async authorize(credentials, req) {
        const ip = getClientIp(req ?? {});
        const now = Date.now();
        if (!loginAttempts[ip]) loginAttempts[ip] = [];
        loginAttempts[ip] = loginAttempts[ip].filter((ts) => now - ts < WINDOW_MS);
        if (loginAttempts[ip].length >= MAX_ATTEMPTS) {
          throw new Error('Demasiados intentos. Intenta de nuevo más tarde.');
        }
        loginAttempts[ip].push(now);

        if (!credentials?.accessToken || !credentials?.user) return null;
        try {
          const user =
            typeof credentials.user === 'string'
              ? (JSON.parse(credentials.user) as Record<string, unknown>)
              : (credentials.user as Record<string, unknown>);
          const accessToken = credentials.accessToken as string;
          if (!accessToken || !user) return null;
          const id = (user as { id?: string }).id ?? 'credentials';
          return { ...user, accessToken, id } as User;
        } catch (err) {
          console.error('Error al parsear credenciales:', err);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as { accessToken?: string }).accessToken;
        const rawRole = (user as { role?: string | string[] }).role;
        token.role = Array.isArray(rawRole) ? (rawRole[0] ?? null) : (rawRole ?? null);
        const u = user as {
          assignedStoreId?: number;
          companyName?: string;
          companyLogoUrl?: string;
          actorType?: 'internal_user' | 'external_user' | null;
          externalUserType?: 'maquilador' | null;
          allowedStoreIds?: number[];
        };
        if (u.assignedStoreId != null) token.assignedStoreId = u.assignedStoreId;
        if (u.companyName) token.companyName = u.companyName;
        if (u.companyLogoUrl) token.companyLogoUrl = u.companyLogoUrl;
        token.actorType = u.actorType ?? 'internal_user';
        token.externalUserType = u.externalUserType ?? null;
        token.allowedStoreIds = Array.isArray(u.allowedStoreIds) ? u.allowedStoreIds : [];
      }

      if (token.accessToken) {
        try {
          const response = await fetchWithTenant(`${API_URL_V2}me`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token.accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          // NOTA: En contexto servidor, fetchWithTenant lanza una excepción con
          // code='UNAUTHENTICATED' para 401, por lo que este branch solo es alcanzable
          // si fetchWithTenant retorna la respuesta (contexto cliente o casos especiales).
          if (response.status === 401 || response.status === 403) {
            console.warn('[NextAuth] Token rechazado por el backend (401/403), invalidando sesión');
            return null as unknown as typeof token;
          }

          if (response.ok) {
            const userData = (await response.json()) as
              | { data?: Record<string, unknown> }
              | Record<string, unknown>;
            const currentUser = (userData as { data?: Record<string, unknown> }).data ?? userData;
            const rawRole = (currentUser as { role?: string | string[] }).role ?? token.role;
            token.role = Array.isArray(rawRole) ? (rawRole[0] ?? null) : rawRole;
            if (
              (currentUser as { actorType?: 'internal_user' | 'external_user' | null })
                .actorType !== undefined
            ) {
              token.actorType =
                (currentUser as { actorType?: 'internal_user' | 'external_user' | null })
                  .actorType ?? 'internal_user';
            }
            if (
              (currentUser as { externalUserType?: 'maquilador' | null }).externalUserType !==
              undefined
            ) {
              token.externalUserType =
                (currentUser as { externalUserType?: 'maquilador' | null }).externalUserType ??
                null;
            }
            if (Array.isArray((currentUser as { allowedStoreIds?: number[] }).allowedStoreIds)) {
              token.allowedStoreIds = (
                currentUser as { allowedStoreIds: number[] }
              ).allowedStoreIds;
            }
            if ((currentUser as { assigned_store_id?: number }).assigned_store_id !== undefined) {
              token.assignedStoreId = (
                currentUser as { assigned_store_id: number }
              ).assigned_store_id;
            }
            if ((currentUser as { company_name?: string }).company_name) {
              token.companyName = (currentUser as { company_name: string }).company_name;
            }
            if ((currentUser as { company_logo_url?: string }).company_logo_url) {
              token.companyLogoUrl = (currentUser as { company_logo_url: string }).company_logo_url;
            }
            const features = (currentUser as { features?: string[] }).features;
            if (Array.isArray(features)) token.features = features;
            token.lastRefresh = Date.now();
          }
        } catch (error) {
          const err = error as { code?: string; message?: string };
          // fetchWithTenant lanza con code='UNAUTHENTICATED' cuando el backend rechaza
          // explícitamente el access token (401 no de validación). Invalidar la sesión
          // NextAuth para que el middleware y el cliente redirijan a login correctamente.
          if (err.code === 'UNAUTHENTICATED') {
            console.warn('[NextAuth] Token rechazado por el backend, invalidando sesión');
            return null as unknown as typeof token;
          }
          // Error de red, timeout o backend no disponible: mantener la sesión viva.
          // El middleware lo detectará en el siguiente request.
          console.error('Error al verificar sesión con el backend:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!token) return null as unknown as Session;
      const role = Array.isArray(token.role) ? (token.role[0] ?? null) : token.role;
      session.user = {
        ...token,
        role,
        actorType:
          (token.actorType as 'internal_user' | 'external_user' | null | undefined) ??
          'internal_user',
        externalUserType: (token.externalUserType as 'maquilador' | null | undefined) ?? null,
        allowedStoreIds: Array.isArray(token.allowedStoreIds)
          ? (token.allowedStoreIds as number[])
          : [],
        features: (token.features as string[]) ?? [],
      };
      return session;
    },
  },
  events: {
    async signOut() {},
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import roleConfig from './configs/roleConfig';
import { API_BASE_URL } from './configs/config';
import { fetchWithTenant } from './lib/fetchWithTenant';
import { isAuthError } from './configs/authConfig';
import { log as devLog, error as logError } from './lib/logger';

interface JWTToken {
  accessToken?: string;
  role?: string | string[] | null;
  actorType?: 'internal_user' | 'external_user' | null;
  exp?: number;
  assignedStoreId?: number | null;
  [key: string]: unknown;
}

function setVerificationCookie(response: NextResponse): void {
  response.cookies.set('__session_verified', '1', {
    maxAge: 5 * 60, // 5 minutos (300 s)
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });
}

/**
 * Redirige a login y borra las cookies de sesión NextAuth para evitar el bucle
 * "authenticated-loop": sin borrar la cookie, page.js detecta status="authenticated"
 * y redirige inmediatamente de vuelta a la ruta protegida, que el middleware vuelve
 * a rechazar, creando un ciclo infinito. Al borrar la cookie aquí, el siguiente
 * render de page.js obtiene status="unauthenticated" y muestra LoginPage.
 */
function redirectToLoginClearing(req: NextRequest, pathname: string): NextResponse {
  const loginUrl = new URL('/', req.url);
  loginUrl.searchParams.set('from', pathname);
  const response = NextResponse.redirect(loginUrl);
  // Borrar ambas variantes del nombre de cookie (HTTP dev / HTTPS prod)
  response.cookies.delete('next-auth.session-token');
  response.cookies.delete('__Secure-next-auth.session-token');
  return response;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isExternalRoute = pathname.startsWith('/external');
  const isInternalProtectedRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/operator') ||
    pathname.startsWith('/comercial') ||
    pathname.startsWith('/field') ||
    pathname.startsWith('/production') ||
    pathname.startsWith('/warehouse');

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/pesquerapp') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.startsWith('/og-image') ||
    pathname.startsWith('/site.webmanifest') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/superadmin')) {
    return NextResponse.next();
  }

  if (!isExternalRoute && !isInternalProtectedRoute) {
    return NextResponse.next();
  }

  let token: JWTToken | null = null;
  try {
    const requestForToken = {
      url: req.url,
      headers: req.headers,
      cookies: {
        get: (name: string) => {
          const cookie = req.cookies.get(name);
          return cookie ? { name: cookie.name, value: cookie.value } : undefined;
        },
        getAll: () => req.cookies.getAll().map((c) => ({ name: c.name, value: c.value })),
      },
    };

    token = (await getToken({
      req: requestForToken as Parameters<typeof getToken>[0]['req'],
      secret: process.env.NEXTAUTH_SECRET,
    })) as JWTToken | null;
  } catch (error) {
    logError('🔐 [Middleware] Error al obtener token:', error);
    token = null;
  }

  if (!token) {
    const loginUrl = new URL('/', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const tokenExpiration = (token?.exp ?? 0) * 1000;
  if (Date.now() > tokenExpiration) {
    return redirectToLoginClearing(req, pathname);
  }

  // P-MW — Opción C: cookie-based session verification cache (TTL 5 min / 300 s).
  // Skips the /me roundtrip on requests within the TTL window.
  const needsVerification = !req.cookies.get('__session_verified');
  let currentUser: Record<string, unknown> | null = null;

  if (needsVerification) {
    try {
      const host = req.headers.get('host') || '';
      const tenant = host.includes('localhost')
        ? host.split('.').length > 1 && host.split('.')[0] !== 'localhost'
          ? host.split('.')[0]
          : 'dev'
        : host.split('.')[0];

      const verifyResponse = await fetchWithTenant(
        `${API_BASE_URL}/api/v2/me`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
          },
        },
        req.headers
      );

      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text().catch(() => '');
        devLog(
          `🔐 [Middleware] Token inválido o sesión cancelada. Status: ${verifyResponse.status}, Tenant: ${tenant}, Ruta: ${pathname}, Error: ${errorText}`
        );
        if (verifyResponse.status === 401 || verifyResponse.status === 403) {
          const loginUrl = new URL('/', req.url);
          loginUrl.searchParams.set('from', pathname);
          return NextResponse.redirect(loginUrl);
        }
      } else {
        const verifyData = (await verifyResponse.json().catch(() => null)) as
          | { data?: Record<string, unknown> }
          | Record<string, unknown>
          | null;
        currentUser = (
          verifyData && 'data' in verifyData && verifyData.data ? verifyData.data : verifyData
        ) as Record<string, unknown> | null;
      }
    } catch (error) {
      const err = error as { code?: string; message?: string; name?: string };
      logError('🔐 [Middleware] Error al validar el token con el backend:', {
        message: err.message,
        name: err.name,
        tenant: req.headers.get('host')?.split('.')[0] || 'unknown',
        pathname,
      });

      if (isAuthError(err)) {
        // Usar redirectToLoginClearing para borrar la cookie de sesión NextAuth
        // y romper el bucle "authenticated-loop" (ver H5 en la auditoría).
        return redirectToLoginClearing(req, pathname);
      }
    }
  }

  // actorType and role: currentUser has JWT fallbacks so this works whether
  // verification ran or was skipped via the cookie cache.
  const actorType =
    (currentUser?.actorType as JWTToken['actorType'] | undefined) ??
    token.actorType ??
    'internal_user';
  const rawRole = (currentUser?.role as string | string[] | null | undefined) ?? token.role;
  const userRoleFromVerification = Array.isArray(rawRole) ? rawRole[0] : rawRole;

  if (isExternalRoute) {
    if (actorType !== 'external_user') {
      const internalUrl = new URL('/admin/home', req.url);
      if (userRoleFromVerification === 'operario') internalUrl.pathname = '/operator';
      if (userRoleFromVerification === 'comercial') internalUrl.pathname = '/comercial';
      if (userRoleFromVerification === 'repartidor_autoventa') internalUrl.pathname = '/field';
      return NextResponse.redirect(internalUrl);
    }
    const response = NextResponse.next();
    if (needsVerification && currentUser) setVerificationCookie(response);
    return response;
  }

  if (actorType === 'external_user') {
    const externalUrl = new URL('/external/stores-manager', req.url);
    return NextResponse.redirect(externalUrl);
  }

  const matchingRoutes = Object.keys(roleConfig).filter((route) => pathname.startsWith(route));
  const matchingRoute = matchingRoutes.sort((a, b) => b.length - a.length)[0];
  const rolesAllowed = matchingRoute ? roleConfig[matchingRoute] : [];
  const userRole = Array.isArray(token.role) ? token.role[0] : token.role;

  const hasAccess = userRole && rolesAllowed.includes(userRole as (typeof rolesAllowed)[number]);

  // Operario: todo /admin redirige a /operator (gestores bajo /operator/* reutilizan componentes)
  if (userRole === 'operario' && pathname.startsWith('/admin')) {
    const operatorUrl = new URL('/operator', req.url);
    return NextResponse.redirect(operatorUrl);
  }

  // Supervisor: solo puede acceder a /admin/home — cualquier otra ruta /admin redirige ahí
  if (userRole === 'supervisor' && pathname.startsWith('/admin') && !pathname.startsWith('/admin/home')) {
    const homeUrl = new URL('/admin/home', req.url);
    return NextResponse.redirect(homeUrl);
  }

  // Comercial: todo /admin redirige a /comercial
  if (userRole === 'comercial' && pathname.startsWith('/admin')) {
    const comercialUrl = new URL('/comercial', req.url);
    return NextResponse.redirect(comercialUrl);
  }

  if (userRole === 'repartidor_autoventa' && pathname.startsWith('/admin')) {
    const fieldUrl = new URL('/field', req.url);
    return NextResponse.redirect(fieldUrl);
  }

  if (!rolesAllowed.length || !hasAccess) {
    const unauthorizedUrl = new URL('/unauthorized', req.url);
    return NextResponse.redirect(unauthorizedUrl);
  }

  const response = NextResponse.next();
  if (needsVerification && currentUser) setVerificationCookie(response);
  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/operator/:path*',
    '/comercial/:path*',
    '/field/:path*',
    '/production/:path*',
    '/warehouse/:path*',
    '/external/:path*',
  ],
};

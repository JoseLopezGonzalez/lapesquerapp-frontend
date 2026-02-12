import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import roleConfig from "./configs/roleConfig";
import { API_BASE_URL } from "./configs/config";
import { fetchWithTenant } from "@lib/fetchWithTenant";
import { isAuthError } from "./configs/authConfig";

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  
  // Ignorar archivos estáticos y recursos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.startsWith('/og-image') ||
    pathname.startsWith('/site.webmanifest') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }
  
  // En Next.js 16, req.cookies es un ReadonlyRequestCookies con métodos get() y getAll()
  // Crear un wrapper compatible con getToken
  let token;
  try {
    // Crear un objeto request que getToken pueda usar
    const requestForToken = {
      url: req.url,
      headers: req.headers,
      cookies: {
        get: (name) => {
          const cookie = req.cookies.get(name);
          return cookie ? { name: cookie.name, value: cookie.value } : undefined;
        },
        getAll: () => {
          return req.cookies.getAll().map(c => ({ name: c.name, value: c.value }));
        },
      },
    };
    
    token = await getToken({ 
      req: requestForToken,
      secret: process.env.NEXTAUTH_SECRET 
    });
  } catch (error) {
    console.error("🔐 [Middleware] Error al obtener token:", error);
    // Continuar sin token para que redirija al login
    token = null;
  }

  // Si no hay token, redirigir al login
  if (!token) {
    // console.log("🔐 [Middleware] No hay token, redirigiendo al login desde:", pathname);
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("from", pathname); // Guardar la página actual para redirigir después del login
    return NextResponse.redirect(loginUrl);
  }

  // Verificar si el token está expirado
  const tokenExpiration = token?.exp * 1000; // Convertir de segundos a milisegundos
  if (Date.now() > tokenExpiration) {
    // console.log("🔐 [Middleware] Token expirado, redirigiendo al login desde:", pathname);
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validar token con el backend para detectar revocación/cancelación
  try {
    // Obtener el host para detectar el tenant (en localhost usar 'dev')
    const host = req.headers.get('host') || '';
    const tenant = host.includes('localhost')
      ? (host.split('.').length > 1 && host.split('.')[0] !== 'localhost' ? host.split('.')[0] : 'dev')
      : host.split('.')[0];

    console.log(`🔐 [Middleware] Validando token para tenant: ${tenant}, ruta: ${pathname}`);

    const verifyResponse = await fetchWithTenant(
      `${API_BASE_URL}/api/v2/me`, 
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      },
      req.headers // Pasar headers del middleware para evitar usar headers() de next/headers
    );

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text().catch(() => '');
      console.error(`🔐 [Middleware] Token inválido o sesión cancelada. Status: ${verifyResponse.status}, Tenant: ${tenant}, Ruta: ${pathname}, Error: ${errorText}`);
      
      // Solo redirigir si es un error de autenticación (401/403)
      if (verifyResponse.status === 401 || verifyResponse.status === 403) {
        const loginUrl = new URL("/", req.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      // Para otros errores (500, 502, etc.), permitir continuar para evitar redirecciones por errores temporales del servidor
      console.warn(`🔐 [Middleware] Error del servidor (${verifyResponse.status}), pero permitiendo continuar para evitar redirección innecesaria`);
    } else {
      console.log(`🔐 [Middleware] Token validado exitosamente para tenant: ${tenant}`);
    }
  } catch (error) {
    console.error(`🔐 [Middleware] Error al validar el token con el backend:`, {
      message: error.message,
      name: error.name,
      tenant: req.headers.get('host')?.split('.')[0] || 'unknown',
      pathname
    });
    
    // Si es un error de autenticación explícito, redirigir al login
    if (isAuthError(error)) {
      console.log(`🔐 [Middleware] Error de autenticación confirmado, redirigiendo al login desde: ${pathname}`);
      const loginUrl = new URL("/", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Para errores de red o temporales, NO redirigir al login para evitar problemas con conexiones intermitentes
    // El token JWT ya fue validado localmente (no expirado), así que confiamos en él
    if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('ECONNREFUSED')) {
      console.warn(`🔐 [Middleware] Error de red al validar token, pero permitiendo continuar (error temporal): ${error.message}`);
      // Continuar sin redirigir
    } else {
      // Para otros errores desconocidos, también permitir continuar para evitar redirecciones innecesarias
      console.warn(`🔐 [Middleware] Error desconocido al validar token, pero permitiendo continuar: ${error.message}`);
    }
  }

  // Obtener las rutas que coinciden con la solicitada
  const matchingRoutes = Object.keys(roleConfig).filter((route) =>
    pathname.startsWith(route)
  );

  // Elegir la ruta más específica (la más larga)
  const matchingRoute = matchingRoutes.sort((a, b) => b.length - a.length)[0];
  const rolesAllowed = matchingRoute ? roleConfig[matchingRoute] : [];

  // Rol del usuario (normalizar: API/token a veces devuelve array)
  const userRole = Array.isArray(token.role) ? token.role[0] : token.role;

  console.log("🔐 [Middleware] Ruta coincidente:", matchingRoute);
  console.log("🔐 [Middleware] Roles Permitidos:", rolesAllowed);
  console.log("🔐 [Middleware] Rol del Usuario:", userRole);
  console.log("🔐 [Middleware] Token completo:", JSON.stringify({ role: token.role, assignedStoreId: token.assignedStoreId }, null, 2));

  // Verificar si el rol del usuario está permitido
  const hasAccess = userRole && rolesAllowed.includes(userRole);

  console.log("🔐 [Middleware] ¿Tiene acceso?:", hasAccess);

  // Operario (rol de nivel): solo puede acceder a rutas que incluyan "operario" en roleConfig.
  // Si intenta otra ruta bajo /admin, redirigir al dashboard operario en lugar de unauthorized.
  if (!hasAccess && userRole === "operario" && pathname.startsWith("/admin")) {
    const homeUrl = new URL("/admin/home", req.url);
    return NextResponse.redirect(homeUrl);
  }

  if (!rolesAllowed.length || !hasAccess) {
    console.log("🔐 [Middleware] Acceso denegado para el rol:", userRole, "en ruta:", pathname);
    console.log("🔐 [Middleware] Roles permitidos para esta ruta:", rolesAllowed);
    const unauthorizedUrl = new URL("/unauthorized", req.url);
    return NextResponse.redirect(unauthorizedUrl);
  }


  // Si todo está bien, continuar con la solicitud
  // console.log("🔐 [Middleware] Acceso permitido para usuario con roles:", userRoles, "en ruta:", pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/production/:path*',
    '/warehouse/:path*',
  ],
};

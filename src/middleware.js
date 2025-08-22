import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import roleConfig from "./configs/roleConfig";
import { fetchWithTenant } from "@lib/fetchWithTenant";
import { isAuthError } from "./configs/authConfig";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Si no hay token, redirigir al login
  if (!token) {
    console.log("🔐 [Middleware] No hay token, redirigiendo al login desde:", pathname);
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("from", pathname); // Guardar la página actual para redirigir después del login
    return NextResponse.redirect(loginUrl);
  }

  // Verificar si el token está expirado
  const tokenExpiration = token?.exp * 1000; // Convertir de segundos a milisegundos
  if (Date.now() > tokenExpiration) {
    console.log("🔐 [Middleware] Token expirado, redirigiendo al login desde:", pathname);
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validar token con el backend para detectar revocación/cancelación
  try {
    const verifyResponse = await fetchWithTenant(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v2/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    });

    if (!verifyResponse.ok) {
      console.log("🔐 [Middleware] Token inválido o sesión cancelada, redirigiendo al login desde:", pathname);
      const loginUrl = new URL("/", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    console.error("🔐 [Middleware] Error al validar el token con el backend:", error);
    
    // Si es un error de autenticación, redirigir al login
    if (isAuthError(error)) {
      console.log("🔐 [Middleware] Error de autenticación confirmado, redirigiendo al login desde:", pathname);
      const loginUrl = new URL("/", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Para otros errores, también redirigir al login por seguridad
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Obtener las rutas que coinciden con la solicitada
  const matchingRoutes = Object.keys(roleConfig).filter((route) =>
    pathname.startsWith(route)
  );

  // Elegir la ruta más específica (la más larga)
  const matchingRoute = matchingRoutes.sort((a, b) => b.length - a.length)[0];
  const rolesAllowed = matchingRoute ? roleConfig[matchingRoute] : [];

  console.log("🔐 [Middleware] Ruta coincidente:", matchingRoute);
  console.log("🔐 [Middleware] Roles Permitidos:", rolesAllowed);

  // Obtener los roles del usuario y asegurarse de que sean un array
  const userRoles = Array.isArray(token.role) ? token.role : [token.role];

  console.log("🔐 [Middleware] Roles del Usuario:", userRoles);

  // Verificar si al menos uno de los roles del usuario está permitido
  const hasAccess = userRoles.some((role) => rolesAllowed.includes(role));

  if (!rolesAllowed.length || !hasAccess) {
    console.log("🔐 [Middleware] Acceso denegado para los roles:", userRoles, "en ruta:", pathname);
    const unauthorizedUrl = new URL("/unauthorized", req.url);
    return NextResponse.redirect(unauthorizedUrl);
  }

  // Si todo está bien, continuar con la solicitud
  console.log("🔐 [Middleware] Acceso permitido para usuario con roles:", userRoles, "en ruta:", pathname);
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/production/:path*"],
};

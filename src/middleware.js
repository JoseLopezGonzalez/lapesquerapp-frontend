import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import roleConfig from "./configs/roleConfig";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Si no hay token, redirigir al login
  if (!token) {
    console.log("No hay token, redirigiendo al login.");
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname); // Guardar la página actual para redirigir después del login
    return NextResponse.redirect(loginUrl);
  }

  // Verificar si el token está expirado
  const tokenExpiration = token?.exp * 1000; // Convertir de segundos a milisegundos
  if (Date.now() > tokenExpiration) {
    console.log("Token expirado, redirigiendo al login.");
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validar token con el backend para detectar revocación/cancelación
  try {
    const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v2/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    });

    if (!verifyResponse.ok) {
      console.log("Token inválido o sesión cancelada, redirigiendo al login.");
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    console.error("Error al validar el token con el backend:", error);
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Obtener las rutas que coinciden con la solicitada
  const matchingRoutes = Object.keys(roleConfig).filter((route) =>
    pathname.startsWith(route)
  );

  // Elegir la ruta más específica (la más larga)
  const matchingRoute = matchingRoutes.sort((a, b) => b.length - a.length)[0];
  const rolesAllowed = matchingRoute ? roleConfig[matchingRoute] : [];

  console.log("Ruta coincidente:", matchingRoute);
  console.log("Roles Permitidos:", rolesAllowed);

  // Obtener los roles del usuario y asegurarse de que sean un array
  const userRoles = Array.isArray(token.role) ? token.role : [token.role];

  console.log("Roles del Usuario:", userRoles);

  // Verificar si al menos uno de los roles del usuario está permitido
  const hasAccess = userRoles.some((role) => rolesAllowed.includes(role));

  if (!rolesAllowed.length || !hasAccess) {
    console.log("Acceso denegado para los roles:", userRoles);
    const unauthorizedUrl = new URL("/unauthorized", req.url);
    return NextResponse.redirect(unauthorizedUrl);
  }

  // Si todo está bien, continuar con la solicitud
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/production/:path*"], // Define las rutas protegidas
};

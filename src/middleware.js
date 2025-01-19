import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import roleConfig from "./configs/roleConfig";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Si no hay token, redirigir al login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Obtener los roles permitidos para la ruta actual
  const matchingRoute = Object.keys(roleConfig).find((route) =>
    pathname.startsWith(route)
  );
  const rolesAllowed = matchingRoute ? roleConfig[matchingRoute] : [];

  console.log("Roles Permitidos:", rolesAllowed);

  // Obtener los roles del usuario y asegurarse de que sean un array
  const userRoles = Array.isArray(token.role) ? token.role : [token.role];

  console.log("Roles del Usuario:", userRoles);

  // Verificar si al menos uno de los roles del usuario está permitido
  const hasAccess = userRoles.some((role) => rolesAllowed.includes(role));

  console.log("¿Tiene acceso?", hasAccess);

  if (!rolesAllowed.length || !hasAccess) {
    const unauthorizedUrl = new URL("/unauthorized", req.url);
    console.log("Acceso denegado para los roles:", userRoles);
    return NextResponse.redirect(unauthorizedUrl);
  }

  // Si todo está bien, continuar con la solicitud
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*", // Rutas protegidas para administradores
    "/production/:path*", // Rutas protegidas para producción
    // Agregar más rutas según sea necesario
  ],
};

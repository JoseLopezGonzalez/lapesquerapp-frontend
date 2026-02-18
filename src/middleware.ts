import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import roleConfig from "./configs/roleConfig";
import { API_BASE_URL } from "./configs/config";
import { fetchWithTenant } from "./lib/fetchWithTenant";
import { isAuthError } from "./configs/authConfig";
import { log as devLog, error as logError } from "./lib/logger";

interface JWTToken {
  accessToken?: string;
  role?: string | string[] | null;
  exp?: number;
  assignedStoreId?: number | null;
  [key: string]: unknown;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/pesquerapp") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/apple-touch-icon") ||
    pathname.startsWith("/og-image") ||
    pathname.startsWith("/site.webmanifest") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
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
        getAll: () =>
          req.cookies.getAll().map((c) => ({ name: c.name, value: c.value })),
      },
    };

    token = (await getToken({
      req: requestForToken as Parameters<typeof getToken>[0]["req"],
      secret: process.env.NEXTAUTH_SECRET,
    })) as JWTToken | null;
  } catch (error) {
    logError("🔐 [Middleware] Error al obtener token:", error);
    token = null;
  }

  if (!token) {
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const tokenExpiration = (token?.exp ?? 0) * 1000;
  if (Date.now() > tokenExpiration) {
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const host = req.headers.get("host") || "";
    const tenant = host.includes("localhost")
      ? host.split(".").length > 1 && host.split(".")[0] !== "localhost"
        ? host.split(".")[0]
        : "dev"
      : host.split(".")[0];

    const verifyResponse = await fetchWithTenant(
      `${API_BASE_URL}/api/v2/me`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      },
      req.headers
    );

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text().catch(() => "");
      devLog(
        `🔐 [Middleware] Token inválido o sesión cancelada. Status: ${verifyResponse.status}, Tenant: ${tenant}, Ruta: ${pathname}, Error: ${errorText}`
      );
      if (verifyResponse.status === 401 || verifyResponse.status === 403) {
        const loginUrl = new URL("/", req.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  } catch (error) {
    const err = error as { message?: string; name?: string };
    logError("🔐 [Middleware] Error al validar el token con el backend:", {
      message: err.message,
      name: err.name,
      tenant: req.headers.get("host")?.split(".")[0] || "unknown",
      pathname,
    });

    if (isAuthError(err)) {
      const loginUrl = new URL("/", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const matchingRoutes = Object.keys(roleConfig).filter((route) =>
    pathname.startsWith(route)
  );
  const matchingRoute = matchingRoutes.sort((a, b) => b.length - a.length)[0];
  const rolesAllowed = matchingRoute ? roleConfig[matchingRoute] : [];
  const userRole = Array.isArray(token.role) ? token.role[0] : token.role;

  const hasAccess =
    userRole && rolesAllowed.includes(userRole as (typeof rolesAllowed)[number]);

  // Operario: todo /admin redirige a /operator (gestores bajo /operator/* reutilizan componentes)
  if (userRole === "operario" && pathname.startsWith("/admin")) {
    const operatorUrl = new URL("/operator", req.url);
    return NextResponse.redirect(operatorUrl);
  }

  // Comercial: todo /admin redirige a /comercial
  if (userRole === "comercial" && pathname.startsWith("/admin")) {
    const comercialUrl = new URL("/comercial", req.url);
    return NextResponse.redirect(comercialUrl);
  }

  if (!rolesAllowed.length || !hasAccess) {
    const unauthorizedUrl = new URL("/unauthorized", req.url);
    return NextResponse.redirect(unauthorizedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/operator/:path*", "/comercial/:path*", "/production/:path*", "/warehouse/:path*"],
};

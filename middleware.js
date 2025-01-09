import { NextResponse } from 'next/server';

export async function middleware(request) {
  const sessionCookie = request.cookies.get('congelados_brisamar_app_session'); // Cambia por el nombre exacto de tu cookie

  // Si no hay cookie, redirigir al login
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url); // Ruta de login
    loginUrl.searchParams.set('from', request.nextUrl.pathname); // Agregar la ruta original como parámetro
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next(); // Continuar con la solicitud si está autenticado
}

export const config = {
  matcher: [
    '/admin/:path*', // Protege todas las rutas que comiencen con /admin
    '/production/:path*', // Protege las rutas bajo /production
  ],
};

import { NextResponse } from 'next/server';

export async function middleware(request) {
 /*  const sessionCookie = request.cookies.get('congelados_brisamar_app_session'); // Cambia por el nombre exacto de tu cookie

  // Si no hay cookie, redirigir al login
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url); // Ruta de login
    loginUrl.searchParams.set('from', request.nextUrl.pathname); // Agregar la ruta original como parámetro
    return NextResponse.redirect(loginUrl);
  } */

  // Verificar si la sesión es válida llamando al backend
  try {
    const response = await fetch('https://api.congeladosbrisamar.es/api/v2/me', {
      method: 'GET',
      credentials: 'include',
    });

    console.log('Response status:', response.status);
  console.log('Response body:', await response.text());

    if (response.ok) {
      // Sesión válida, continuar
      return NextResponse.next();
    }

    // Sesión inválida, redirigir al login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl); /* Esto se ejecuta siempre si esta ya logeado tambien */
  } catch (err) {
    console.error('Error verificando la sesión:', err);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('froma', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/admin/:path*', // Protege todas las rutas que comiencen con /admin
    '/production/:path*', // Protege las rutas bajo /production
  ],
};

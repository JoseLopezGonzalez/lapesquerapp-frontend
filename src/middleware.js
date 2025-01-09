import { NextResponse } from 'next/server';

export async function middleware(request) {
  const sessionCookie = request.cookies.get('congelados_brisamar_app_session'); // Cambia por el nombre exacto de tu cookie

  // Si no hay cookie, redirigir al login
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url); // Ruta de login
    loginUrl.searchParams.set('from', request.nextUrl.pathname); // Agregar la ruta original como parámetro
    return NextResponse.redirect(loginUrl);
  }

  // Verificar si la sesión es válida llamando al backend
  try {
    const response = await fetch('https://api.congeladosbrisamar.es/api/v2/me', {
      method: 'GET',
      credentials: 'include', // Para enviar cookies automáticamente
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Si la sesión no es válida, redirigir al login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', request.nextUrl.pathname);
      console.log('Sesión inválida, redirigiendo a:', loginUrl.toString());
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    console.error('Error al verificar la sesión:', error);

    // En caso de error al verificar la sesión, redirigir al login
    const loginUrl = new URL('/login', request.url);
    console.log('Error al verificar la sesión, redirigiendo a:', loginUrl.toString());
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
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

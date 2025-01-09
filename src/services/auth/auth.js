// Obtener el token CSRF
export async function getCsrfCookie() {
  const response = await fetch('https://api.congeladosbrisamar.es/sanctum/csrf-cookie', {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Error al obtener el token CSRF');
  }
}

// Iniciar sesión
export async function login(email, password) {
  const csrfToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

  if (!csrfToken) {
    throw new Error('Token CSRF no encontrado');
  }

  const response = await fetch('https://api.congeladosbrisamar.es/api/v2/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': decodeURIComponent(csrfToken),
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al iniciar sesión');
  }

  return await response.json();
}

// Obtener usuario autenticado
export async function getAuthenticatedUser() {
  const response = await fetch('https://api.congeladosbrisamar.es/api/v2/me', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('No estás autenticado');
  }

  return await response.json();
}

// Cerrar sesión
export async function logout() {
  const response = await fetch('https://api.congeladosbrisamar.es/api/v2/logout', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Error al cerrar sesión');
  }
}

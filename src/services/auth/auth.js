export async function getCsrfCookie() {
    const response = await fetch('https://api.congeladosbrisamar.es/sanctum/csrf-cookie', {
      method: 'GET',
      credentials: 'include', // Habilita el manejo de cookies en fetch
    });
  
    if (!response.ok) {
      throw new Error('Error al obtener el token CSRF');
    }
  }
  

  // services/auth.js

  export async function login(email, password) {
    // Obtener el valor de la cookie XSRF-TOKEN
    const csrfToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1];
  
    const response = await fetch('https://api.congeladosbrisamar.es/api/v2/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': decodeURIComponent(csrfToken), // Incluye el token CSRF
      },
      credentials: 'include', // Incluye cookies
      body: JSON.stringify({ email, password }),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al iniciar sesión');
    }
  
    return await response.json(); // Devuelve los datos de la respuesta si el login fue exitoso
  }
  

  export async function getAuthenticatedUser() {
    const response = await fetch('https://api.congeladosbrisamar.es/api/v2/me', {
      method: 'GET',
      credentials: 'include', // Incluye cookies
    });
  
    if (!response.ok) {
      throw new Error('No estás autenticado');
    }
  
    return await response.json(); // Devuelve los datos del usuario autenticado
  }
  
  
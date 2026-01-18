/**
 * Helper para obtener el token de autenticación
 * Centraliza la lógica de obtención del token para usar en services
 * 
 * ✅ SOPORTE PARA SERVIDOR Y CLIENTE:
 * - En el servidor (API routes): Puede recibir un token del contexto
 * - En el cliente: Usa getSession() de next-auth/react
 * 
 * @param {string} [serverToken] - Token opcional del servidor (para uso en API routes)
 * @returns {Promise<string>} Token de autenticación
 * @throws {Error} Si no hay sesión autenticada
 */
import { getSession } from 'next-auth/react';

// Variable global temporal para el token del servidor (solo para esta ejecución de request)
let serverTokenContext = null;

/**
 * Configura el token del servidor para esta ejecución
 * @internal - Solo para uso en API routes
 */
export function setServerTokenContext(token) {
  console.log('[setServerTokenContext] ✅ Configurando token en contexto, longitud:', token?.length || 0);
  serverTokenContext = token;
  console.log('[setServerTokenContext] ✅ Token configurado en contexto, ahora serverTokenContext es:', serverTokenContext ? `definido (${serverTokenContext.substring(0, 10)}...)` : 'null');
}

/**
 * Limpia el token del servidor del contexto
 * @internal - Solo para uso en API routes
 */
export function clearServerTokenContext() {
  serverTokenContext = null;
}

export async function getAuthToken(providedToken = null) {
  // ✅ PRIORIDAD 1: Token proporcionado explícitamente
  if (providedToken) {
    console.log('[getAuthToken] ✅ Usando token proporcionado explícitamente');
    return providedToken;
  }
  
  // ✅ PRIORIDAD 2: Token del contexto del servidor (API routes)
  if (serverTokenContext) {
    console.log('[getAuthToken] ✅ Usando token del contexto del servidor, longitud:', serverTokenContext?.length || 0);
    return serverTokenContext;
  }
  
  // ✅ PRIORIDAD 3: Token de la sesión del cliente
  console.log('[getAuthToken] ⚠️ No hay token en contexto, intentando obtener de sesión del cliente...');
  const session = await getSession();
  
  if (!session || !session.user || !session.user.accessToken) {
    console.error('[getAuthToken] ❌ No hay sesión del cliente o no tiene accessToken');
    throw new Error('No hay sesión autenticada. No se puede realizar la operación.');
  }
  
  console.log('[getAuthToken] ✅ Token obtenido de sesión del cliente');
  return session.user.accessToken;
}


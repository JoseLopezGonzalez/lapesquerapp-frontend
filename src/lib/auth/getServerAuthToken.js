/**
 * Helper para obtener el token de autenticación en el servidor (API routes)
 * 
 * Versión servidor de getAuthToken que usa getServerSession en lugar de getSession
 * 
 * @param {Object} session - Sesión del servidor (obtenida con getServerSession)
 * @returns {string} Token de autenticación
 * @throws {Error} Si no hay sesión autenticada o no hay token
 */
export function getServerAuthToken(session) {
  if (!session || !session.user || !session.user.accessToken) {
    throw new Error('No hay sesión autenticada. No se puede realizar la operación.');
  }
  
  return session.user.accessToken;
}


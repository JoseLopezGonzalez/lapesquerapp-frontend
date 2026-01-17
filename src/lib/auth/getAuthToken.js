/**
 * Helper para obtener el token de autenticación
 * Centraliza la lógica de obtención del token para usar en services
 * 
 * @returns {Promise<string>} Token de autenticación
 * @throws {Error} Si no hay sesión autenticada
 */
import { getSession } from 'next-auth/react';

export async function getAuthToken() {
    const session = await getSession();
    
    if (!session || !session.user || !session.user.accessToken) {
        throw new Error('No hay sesión autenticada. No se puede realizar la operación.');
    }
    
    return session.user.accessToken;
}


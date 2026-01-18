import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V2 } from "@/configs/config";
import { getErrorMessage, isLoggingOut } from "@/lib/api/apiHelpers";
import { getUserAgent } from '@/lib/utils/getUserAgent';

/**
 * Elimina duplicados de un array de opciones basándose en el ID
 * @param {Array} options - Array de opciones
 * @returns {Array} Array sin duplicados
 */
const removeDuplicateOptions = (options) => {
    const seen = new Set();
    return options.filter(option => {
        const duplicate = seen.has(option.id);
        seen.add(option.id);
        return !duplicate;
    });
};

/**
 * Obtiene las opciones de familias de productos para autocompletado
 * @param {string} token - Token de autenticación
 * @returns {Promise<Array>} Array de familias de productos
 */
export function getProductFamilyOptions(token) {
    return fetchWithTenant(`${API_URL_V2}product-families/options`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
    })
        .then((response) => {
            if (!response.ok) {
                // Si hay un logout en curso, no lanzar error
                if (isLoggingOut()) {
                    console.log('ℹ️ Logout en curso: ignorando error en getProductFamilyOptions');
                    return []; // Retornar array vacío en lugar de lanzar error
                }
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener las familias de productos');
                });
            }
            return response.json();
        })
        .then((data) => {
            // Eliminar duplicados antes de devolver
            const uniqueData = removeDuplicateOptions(data);
            return uniqueData;
        })
        .catch((error) => {
            throw error;
        })
        .finally(() => {
        });
}

/**
 * Obtiene todas las familias de productos
 * @param {string} token - Token de autenticación
 * @returns {Promise<Array>} Array de familias de productos
 */
export function getProductFamilies(token) {
    return fetchWithTenant(`${API_URL_V2}product-families`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
    })
        .then((response) => {
            if (!response.ok) {
                // Si hay un logout en curso, no lanzar error
                if (isLoggingOut()) {
                    console.log('ℹ️ Logout en curso: ignorando error en getProductFamilyOptions');
                    return []; // Retornar array vacío en lugar de lanzar error
                }
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener las familias de productos');
                });
            }
            return response.json();
        })
        .then((data) => {
            // Eliminar duplicados antes de devolver
            const uniqueData = removeDuplicateOptions(data);
            return uniqueData;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Obtiene una familia de producto específica por ID
 * @param {string} id - ID de la familia
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} Familia de producto
 */
export function getProductFamily(id, token) {
    return fetchWithTenant(`${API_URL_V2}product-families/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': getUserAgent(),
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(getErrorMessage(errorData) || 'Error al obtener la familia de producto');
                });
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch((error) => {
            throw error;
        });
}

import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V2 } from "@/configs/config";

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
 * Obtiene las opciones de categorías de productos para autocompletado
 * @param {string} token - Token de autenticación
 * @returns {Promise<Array>} Array de categorías de productos
 */
export function getProductCategoryOptions(token) {
    return fetchWithTenant(`${API_URL_V2}product-categories/options`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al obtener las categorías de productos');
                });
            }
            return response.json();
        })
        .then((data) => {
            console.log('Datos originales del backend (categorías):', data);
            console.log('Número de elementos originales:', data.length);
            
            // Eliminar duplicados antes de devolver
            const uniqueData = removeDuplicateOptions(data);
            console.log('Categorías de productos cargadas:', uniqueData.length, 'elementos únicos');
            console.log('Elementos únicos:', uniqueData);
            return uniqueData;
        })
        .catch((error) => {
            throw error;
        })
        .finally(() => {
            console.log('getProductCategoryOptions finalizado');
        });
}

/**
 * Obtiene todas las categorías de productos
 * @param {string} token - Token de autenticación
 * @returns {Promise<Array>} Array de categorías de productos
 */
export function getProductCategories(token) {
    return fetchWithTenant(`${API_URL_V2}product-categories`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al obtener las categorías de productos');
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
 * Obtiene una categoría de producto específica por ID
 * @param {string} id - ID de la categoría
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} Categoría de producto
 */
export function getProductCategory(id, token) {
    return fetchWithTenant(`${API_URL_V2}product-categories/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': navigator.userAgent,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    throw new Error(errorData.message || 'Error al obtener la categoría de producto');
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

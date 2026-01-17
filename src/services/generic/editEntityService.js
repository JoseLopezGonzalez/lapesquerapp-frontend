/**
 * Servicios genéricos para edición de entidades
 * 
 * ESTOS SERVICIOS SON PRIVADOS - Solo deben usarse dentro de services de dominio
 * Los componentes NUNCA deben importar o usar estos servicios directamente
 * 
 * Para uso público, usar los services de dominio específicos (ej: supplierService, productCategoryService)
 */

import { fetchWithTenant } from "@lib/fetchWithTenant";
import { getAuthToken } from '@/lib/auth/getAuthToken';

/**
 * Obtiene headers de autenticación
 * @private
 */
const getAuthHeaders = async (token = null) => {
    if (!token) {
        token = await getAuthToken();
    }
    if (!token) {
        throw new Error("No authenticated session found.");
    }
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": navigator.userAgent,
    };
};

/**
 * Obtiene datos de una entidad por URL
 * @param {string} url - URL completa del endpoint de la entidad
 * @param {string} [token] - Token de autenticación (opcional)
 * @returns {Promise<object>} Datos de la entidad
 * @private
 */
export const fetchEntityDataGeneric = async (url, token = null) => {
    try {
        const headers = await getAuthHeaders(token);
        const response = await fetchWithTenant(url, {
            method: 'GET',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw response;
        }
        const result = await response.json();
        // Manejar ambos casos: datos envueltos en 'data' o datos directos
        return result.data || result;
    } catch (error) {
        console.error("Error fetching entity data:", error);
        throw error;
    }
};

/**
 * Obtiene opciones para campos de autocompletado
 * @param {string} autocompleteEndpoint - URL completa del endpoint para opciones de autocompletado
 * @param {string} [token] - Token de autenticación (opcional)
 * @returns {Promise<Array<{value: any, label: string}>>} Opciones formateadas para Combobox
 * @private
 */
export const fetchAutocompleteOptionsGeneric = async (autocompleteEndpoint, token = null) => {
    try {
        const headers = await getAuthHeaders(token);
        const response = await fetchWithTenant(autocompleteEndpoint, {
            method: 'GET',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw response;
        }
        const data = await response.json();
        
        // Eliminar duplicados basándose en el ID
        const uniqueData = data.filter((item, index, self) => 
            index === self.findIndex(t => t.id === item.id)
        );
        
        return uniqueData.map((item) => ({
            value: item.id,
            label: item.name,
        }));
    } catch (error) {
        console.error(`Error fetching autocomplete options from ${autocompleteEndpoint}:`, error);
        throw error;
    }
};

/**
 * Envía datos de formulario de entidad (crear o actualizar)
 * @param {string} url - URL completa del endpoint para envío
 * @param {string} method - Método HTTP (e.g., 'PUT', 'POST')
 * @param {object} data - Datos del formulario a enviar
 * @param {string} [token] - Token de autenticación (opcional)
 * @returns {Promise<Response>} Respuesta de fetch
 * @private
 */
export const submitEntityFormGeneric = async (url, method, data, token = null) => {
    try {
        const headers = await getAuthHeaders(token);
        const response = await fetchWithTenant(url, {
            method,
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw response;
        }
        return response;
    } catch (error) {
        console.error("Error submitting entity form:", error);
        throw error;
    }
};


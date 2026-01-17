/**
 * Servicios genéricos para creación de entidades
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
        Accept: "application/json",
        "User-Agent": navigator.userAgent,
    };
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
 * Crea una nueva entidad
 * @param {string} url - URL completa del endpoint para creación
 * @param {object} data - Datos del formulario a enviar
 * @param {string} [token] - Token de autenticación (opcional)
 * @returns {Promise<Response>} Respuesta de fetch
 * @private
 */
export const createEntityGeneric = async (url, data, token = null) => {
    try {
        const headers = await getAuthHeaders(token);
        const response = await fetchWithTenant(url, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw response;
        }
        return response;
    } catch (error) {
        console.error("Error creating entity:", error);
        throw error;
    }
};

